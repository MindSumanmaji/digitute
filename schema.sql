-- ==============================================================================
-- DigiTute - Enterprise Coaching Institute Management System
-- Centralized Class Scheduling, Session History, Attendance & Academic Ledger
-- Architecture: Single Dedicated Institute (.env configured, No multi-tenant overhead)
-- Total Core Tables: 11
-- ==============================================================================

-- Enable UUID extension for secure, non-guessable identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. BATCHES (Course Offerings, Tuition Fee Models & Subjects)
-- ==============================================================================
CREATE TYPE fee_payment_type AS ENUM ('MONTHLY', 'ONE_TIME');

CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL, -- e.g. "Class 12 Science 2026"
    
    -- Fee Model (MONTHLY recurring tuition vs ONE_TIME full course fee)
    fee_type fee_payment_type NOT NULL DEFAULT 'MONTHLY',
    fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Monthly fee if MONTHLY, Full course fee if ONE_TIME

    -- Flexible Subjects, Teachers, Revenue Share % & Chapters:
    -- [
    --   {
    --     "name": "Physics",
    --     "teacher_id": "uuid",
    --     "share_percent": 35.00, -- Percentage of batch fee collection distributed to this faculty
    --     "chapters": [
    --       {"name": "Electrostatics", "status": "COMPLETED"},
    --       {"name": "Current Electricity", "status": "IN_PROGRESS"},
    --       {"name": "Magnetism", "status": "NOT_STARTED"}
    --     ]
    --   }
    -- ]
    subjects JSONB DEFAULT '[]'::jsonb,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. USERS (Admin, Teachers, Students & Staff in ONE unified table)
-- 1 Student = 1 Batch Model (batch_id assigned directly on student record)
-- ==============================================================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'STAFF');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL, -- Mandatory for portal login
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL,
    avatar_url TEXT, -- Uploaded by student/teacher after login
    
    -- Student Specific Fields (1 Student = 1 Batch)
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,  -- Scholarship / fee concession
    custom_monthly_fee NUMERIC(10, 2),           -- Optional manual fee override
    guardian_name VARCHAR(200),
    guardian_phone VARCHAR(20),
    address TEXT,                                -- Optional, can be updated later by student
    
    -- Teacher Specific Fields
    qualification VARCHAR(255),
    specialization VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_batch ON users(batch_id) WHERE role = 'STUDENT';

-- ==============================================================================
-- 3. INVOICES (Monthly Tuition Fee Demands & Enrolment Charges)
-- ==============================================================================
CREATE TYPE invoice_status AS ENUM ('PENDING', 'PAID', 'CANCELLED');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    
    invoice_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. "INV-202610-008"
    billing_month DATE NOT NULL,                 -- e.g. '2026-10-01'
    
    base_amount NUMERIC(10, 2) NOT NULL,       -- Batch regular fee
    discount_amount NUMERIC(10, 2) DEFAULT 0,  -- Student discount
    late_fine NUMERIC(10, 2) DEFAULT 0,        -- Applied if past due_date
    payable_amount NUMERIC(10, 2) NOT NULL,   -- (base - discount + fine)
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,  -- Running total paid so far
    
    due_date DATE NOT NULL,
    status invoice_status DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_student_monthly_invoice UNIQUE (student_id, batch_id, billing_month)
);

CREATE INDEX idx_invoices_student_status ON invoices(student_id, status);
CREATE INDEX idx_invoices_due ON invoices(status, due_date);

-- ==============================================================================
-- 4. PAYMENTS & TRANSACTIONS (Online Razorpay + Offline Cash + Receipts)
-- ==============================================================================
CREATE TYPE payment_mode AS ENUM ('RAZORPAY', 'CASH');
CREATE TYPE payment_status AS ENUM ('INITIATED', 'SUCCESS', 'FAILED');

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode payment_mode NOT NULL,
    status payment_status NOT NULL DEFAULT 'INITIATED',
    
    -- Razorpay Gateway Fields
    razorpay_order_id VARCHAR(150),
    razorpay_payment_id VARCHAR(150) UNIQUE, -- Unique constraint prevents duplicate credits
    razorpay_signature VARCHAR(255),
    
    -- Offline Cash Collection
    collected_by UUID REFERENCES users(id), -- Admin/Staff who received cash
    remarks TEXT,
    
    -- Receipt Metadata
    receipt_number VARCHAR(100) UNIQUE,     -- e.g. "REC-2026-0042"
    receipt_pdf_url TEXT,                   -- Stored in Supabase Storage
    
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_status_date ON payments(status, paid_at);

-- ==============================================================================
-- 5. CLASS ROUTINES (Centralized Recurring Weekly Schedule - Master Template)
-- Source of truth for recurring timetable across all batches and teachers
-- ==============================================================================
CREATE TABLE class_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,                           -- e.g. "Physics"
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 1 to 7: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,                                -- e.g. '10:00:00'
    end_time TIME NOT NULL,                                  -- e.g. '11:30:00'
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_routine_time CHECK (start_time < end_time)
);

-- Crucial index for Centralized Conflict Validation:
-- Query: Check if teacher is already booked on day_of_week with overlapping time:
-- (existing_start < new_end AND new_start < existing_end)
CREATE INDEX idx_routines_teacher_conflict ON class_routines(teacher_id, day_of_week, start_time, end_time) WHERE is_active = TRUE;
CREATE INDEX idx_routines_batch_schedule ON class_routines(batch_id, day_of_week) WHERE is_active = TRUE;

-- ==============================================================================
-- 6. CLASS SESSIONS (Concrete Date-wise Class Instances + Rescheduling Audit)
-- Each row is an actual class on a specific date. Preserves cancellation & rescheduling history.
-- ==============================================================================
CREATE TYPE session_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

CREATE TABLE class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID REFERENCES class_routines(id) ON DELETE SET NULL, -- Source weekly routine
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,                                    -- e.g. "Physics"
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,          -- Actual faculty (supports substitutions)
    
    session_date DATE NOT NULL,                                       -- Specific calendar date
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    status session_status NOT NULL DEFAULT 'SCHEDULED',
    
    -- Rescheduling Audit Trail:
    -- If cancelled, status becomes 'CANCELLED'.
    -- If rescheduled, a NEW session is created pointing back to rescheduled_from_id!
    rescheduled_from_id UUID REFERENCES class_sessions(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    topic_covered TEXT,                                               -- Lesson topic taught
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_session_time CHECK (start_time < end_time)
);

CREATE INDEX idx_class_sessions_batch_date ON class_sessions(batch_id, session_date);
CREATE INDEX idx_class_sessions_teacher_date ON class_sessions(teacher_id, session_date);
CREATE INDEX idx_class_sessions_status ON class_sessions(status, session_date);
CREATE INDEX idx_class_sessions_rescheduled ON class_sessions(rescheduled_from_id);

-- ==============================================================================
-- 7. ATTENDANCE (Session-wise Student Attendance Ledger)
-- Attendance is strictly linked to a specific class_session.
-- Eligible students are fetched directly via: WHERE batch_id = session.batch_id
-- ==============================================================================
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT');

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    status attendance_status NOT NULL DEFAULT 'PRESENT',
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,           -- Teacher or Admin who marked
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Mandatory constraint: Prevents duplicate attendance for the same student in a single class session
    CONSTRAINT unique_session_student_attendance UNIQUE (session_id, student_id)
);

CREATE INDEX idx_attendance_student ON attendance(student_id, status);
CREATE INDEX idx_attendance_session ON attendance(session_id);

-- ==============================================================================
-- 8. STUDY MATERIALS (Class Notes & Reference PDFs)
-- ==============================================================================
CREATE TABLE study_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(100) NOT NULL, -- e.g. "Physics"
    title VARCHAR(255) NOT NULL,   -- e.g. "Ray Optics Complete Notes"
    description TEXT,
    file_url TEXT NOT NULL,        -- PDF link in Supabase Storage
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_materials_batch ON study_materials(batch_id);

-- ==============================================================================
-- 9. DPPS (Daily Practice Problems & Worksheets)
-- ==============================================================================
CREATE TABLE dpps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(100) NOT NULL, -- e.g. "Mathematics"
    title VARCHAR(255) NOT NULL,   -- e.g. "Calculus - DPP #04"
    file_url TEXT NOT NULL,        -- Sheet link
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dpps_batch ON dpps(batch_id);

-- ==============================================================================
-- 10. DOUBTS (Single Unified Table: Student Question + Teacher Answer)
-- ==============================================================================
CREATE TYPE doubt_status AS ENUM ('OPEN', 'OFFLINE_PENDING', 'RESOLVED');

CREATE TABLE doubts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    
    -- Student's Question
    question_title VARCHAR(255) NOT NULL,
    question_text TEXT NOT NULL,
    question_file_url TEXT,
    status doubt_status DEFAULT 'OPEN', -- OPEN ➔ OFFLINE_PENDING (Mark as offline solve) ➔ RESOLVED
    
    -- Teacher's Solution (Inline in same row)
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reply_text TEXT,
    reply_file_url TEXT,
    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doubts_batch_status ON doubts(batch_id, status);

-- ==============================================================================
-- 11. EXAMS (Single Unified Table: Exam Details + Student Scores in JSONB)
-- ==============================================================================
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL, -- e.g. "Weekly Test #3 - Thermodynamics"
    total_marks NUMERIC(6, 2) NOT NULL,
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Student Scores & Rankings directly stored in JSONB
    -- Example: [{"student_id": "uuid", "marks_obtained": 82, "rank": 1, "feedback": "Excellent"}]
    results JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exams_batch_date ON exams(batch_id, exam_date);

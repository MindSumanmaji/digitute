from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any, Literal
from datetime import datetime, date, time

# ==============================================================================
# 1. AUTHENTICATION & SECURITY MODELS
# ==============================================================================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    message: str
    access_token: str
    refresh_token: str
    user: dict[str, Any]

class ChangePasswordRequest(BaseModel):
    new_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="The refresh token provided during login")

# ==============================================================================
# 2. USER MODELS (ADMIN, TEACHER, STUDENT)
# ==============================================================================
class StudentCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    batch_id: Optional[str] = None
    discount_amount: float = 0.0
    custom_monthly_fee: Optional[float] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    address: Optional[str] = None

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    batch_id: Optional[str] = None
    discount_amount: Optional[float] = None
    custom_monthly_fee: Optional[float] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

    model_config = {"extra": "allow"}

class AdminSeedRequest(BaseModel):
    email: EmailStr = Field(..., description="Admin email address for portal login")
    password: Optional[str] = Field(None, description="Admin password. If left empty, defaults to email.")

class TeacherCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    qualification: Optional[str] = None
    specialization: Optional[str] = None

class TeacherUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    is_active: Optional[bool] = None

    model_config = {"extra": "allow"}

class UserProfileResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    role: Literal["ADMIN", "TEACHER", "STUDENT", "STAFF"]
    avatar_url: Optional[str] = None
    batch_id: Optional[str] = None
    discount_amount: Optional[float] = 0.0
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

# ==============================================================================
# 3. BATCHES & COURSE OFFERINGS
# ==============================================================================
class SubjectConfig(BaseModel):
    name: str
    teacher_id: Optional[str] = None
    share_percent: float = 35.0
    chapters: list[dict[str, Any]] = []

    model_config = {"extra": "allow"}

class BatchCreate(BaseModel):
    name: str
    fee_type: Optional[str] = "MONTHLY"
    fee_amount: Optional[float] = 0.0
    subjects: list[dict[str, Any]] = []
    routine: Optional[list[dict[str, Any]]] = []

    model_config = {"extra": "allow"}

class BatchResponse(BaseModel):
    id: str
    name: str
    fee_type: str
    fee_amount: float
    student_count: Optional[int] = 0
    subjects: list[Any] = []
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = {"extra": "allow"}

# ==============================================================================
# 4. CLASS ROUTINES & TIMETABLES (RECURRING SCHEDULE)
# ==============================================================================
class RoutineSlotCreate(BaseModel):
    batch_id: str
    subject: str
    teacher_id: str
    day_of_week: int = Field(..., ge=1, le=7, description="1=Monday ... 7=Sunday")
    start_time: str = Field(..., description="HH:MM:SS format e.g. '10:00:00'")
    end_time: str = Field(..., description="HH:MM:SS format e.g. '11:30:00'")

class RoutineResponse(BaseModel):
    id: str
    batch_id: str
    subject: str
    teacher_id: str
    day_of_week: int
    start_time: str
    end_time: str
    is_active: bool = True

# ==============================================================================
# 5. CLASS SESSIONS & ATTENDANCE LEDGER
# ==============================================================================
class SessionCreate(BaseModel):
    batch_id: str
    subject: str
    teacher_id: Optional[str] = None
    session_date: date
    start_time: str
    end_time: str
    routine_id: Optional[str] = None
    topic_covered: Optional[str] = None

class AttendanceStudentEntry(BaseModel):
    student_id: str
    status: Literal["PRESENT", "ABSENT"] = "PRESENT"

class MarkAttendanceRequest(BaseModel):
    session_id: str
    records: list[AttendanceStudentEntry]

# ==============================================================================
# 6. INVOICES, PAYMENTS & TRANSACTIONS
# ==============================================================================
class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    student_id: str
    batch_id: str
    billing_month: date
    base_amount: float
    discount_amount: float
    late_fine: float
    payable_amount: float
    amount_paid: float
    due_date: date
    status: Literal["PENDING", "PAID", "CANCELLED"]

class PaymentCollectRequest(BaseModel):
    invoice_id: str
    student_id: str
    amount: float
    payment_mode: Literal["CASH", "RAZORPAY"] = "CASH"
    remarks: Optional[str] = None

# ==============================================================================
# 7. STUDY MATERIALS, DPPS, DOUBTS & EXAMS
# ==============================================================================
class StudyMaterialCreate(BaseModel):
    batch_id: str
    teacher_id: Optional[str] = None
    subject: str
    title: str
    description: Optional[str] = None
    file_url: str

class StudyMaterialResponse(BaseModel):
    id: str
    batch_id: str
    teacher_id: Optional[str] = None
    subject: str
    title: str
    description: Optional[str] = None
    file_url: str
    signed_url: Optional[str] = None
    created_at: Optional[str] = None

class DoubtCreate(BaseModel):
    batch_id: str
    student_id: str
    subject: str
    question_title: str
    question_text: str
    question_file_url: Optional[str] = None

class DoubtResolve(BaseModel):
    doubt_id: str
    resolved_by: str
    reply_text: str
    reply_file_url: Optional[str] = None

class ExamCreate(BaseModel):
    batch_id: str
    subject: str
    title: str
    total_marks: float
    exam_date: Optional[date] = None
    results: Optional[list[dict[str, Any]]] = []

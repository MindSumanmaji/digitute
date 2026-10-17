from fastapi import APIRouter, HTTPException, Depends
from app.db import get_supabase_client
from app.core.dependencies import require_roles
from app.models import (
    BatchCreate,
    RoutineSlotCreate,
    StudentCreate,
    StudentUpdate,
    TeacherCreate,
    TeacherUpdate,
    PaymentCollectRequest
)
from datetime import date, datetime
import uuid
import re

def _normalize_phone(raw: str) -> str:
    digits = re.sub(r'\D', '', raw)  # keep only digits
    # Normalize leading country code: if 12 digits starting with 91, strip it
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    return digits

# Protect all /api/admin endpoints with ADMIN role check
router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Portal API"],
    dependencies=[Depends(require_roles(["ADMIN"]))]
)

# ==============================================================================
# 1. OVERVIEW & METRICS
# ==============================================================================
@router.get("/metrics", summary="Get Institute Overview Metrics")
def get_dashboard_metrics():
    """
    Returns aggregated stats for Admin Dashboard:
    - Active students count
    - Active batches count
    - Verified faculty count
    - Total fee collected & outstanding dues
    """
    try:
        supabase = get_supabase_client()
        
        students = supabase.table("users").select("id", count="exact").eq("role", "STUDENT").eq("is_active", True).execute()
        batches = supabase.table("batches").select("id", count="exact").eq("is_active", True).execute()
        teachers = supabase.table("users").select("id", count="exact").eq("role", "TEACHER").eq("is_active", True).execute()
        
        # Invoices summary
        invoices = supabase.table("invoices").select("payable_amount, amount_paid, status").execute()
        total_collected = sum(float(i.get("amount_paid") or 0.0) for i in invoices.data or [])
        total_dues = sum(
            max(0.0, float(i.get("payable_amount") or 0.0) - float(i.get("amount_paid") or 0.0))
            for i in invoices.data or []
            if i.get("status") == "PENDING"
        )
        
        return {
            "active_students": students.count or 0,
            "active_batches": batches.count or 0,
            "verified_teachers": teachers.count or 0,
            "total_fee_collected": total_collected,
            "total_outstanding_dues": total_dues
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 2. BATCHES MANAGEMENT
# ==============================================================================
@router.get("/batches", summary="List All Course Batches")
def list_batches():
    try:
        supabase = get_supabase_client()
        res = supabase.table("batches").select("*").eq("is_active", True).order("created_at", desc=True).execute()
        batches = res.data or []
        
        # Pre-fetch all teachers to resolve teacher names efficiently
        t_res = supabase.table("users").select("id, full_name").eq("role", "TEACHER").execute()
        teacher_map = {t["id"]: t["full_name"] for t in (t_res.data or []) if t.get("id")}

        for b in batches:
            b_id = b["id"]
            # Student count from users table
            try:
                st_res = supabase.table("users").select("id", count="exact").eq("batch_id", b_id).eq("role", "STUDENT").eq("is_active", True).execute()
                cnt = st_res.count if st_res.count is not None else len(st_res.data or [])
                b["student_count"] = cnt
                b["studentCount"] = cnt
            except Exception:
                b["student_count"] = 0
                b["studentCount"] = 0

            # Clean subjects strictly matching schema.sql + teacher_name for display
            clean_subjects = []
            for s in (b.get("subjects") or []):
                if isinstance(s, dict):
                    raw_share = s.get("share_percent") if s.get("share_percent") is not None else s.get("sharePercent")
                    try:
                        share_val = float(raw_share) if raw_share is not None else 35.0
                    except (ValueError, TypeError):
                        share_val = 35.0
                    t_id = s.get("teacher_id") or s.get("teacherId")
                    t_name = teacher_map.get(t_id) or s.get("teacher_name") or s.get("teacher")
                    clean_subjects.append({
                        "name": s.get("name") or "Subject",
                        "teacher_id": t_id,
                        "teacher_name": t_name,
                        "share_percent": share_val,
                        "chapters": s.get("chapters") or []
                    })
            b["subjects"] = clean_subjects

        return batches
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batches", summary="Create New Course Batch")
def create_batch(batch: BatchCreate):
    try:
        supabase = get_supabase_client()
        clean_name = batch.name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Batch name is required.")

        fee_type = batch.fee_type if batch.fee_type in ["MONTHLY", "ONE_TIME"] else "MONTHLY"
        fee_amount = max(0.0, float(batch.fee_amount or 0.0))

        # Subjects strictly according to schema.sql: [ {"name": ..., "teacher_id": ..., "share_percent": ..., "chapters": ...} ]
        raw_subjects = [s if isinstance(s, dict) else s.model_dump() for s in (batch.subjects or [])]
        clean_subjects = []
        for s in raw_subjects:
            name = (s.get("name") or "").strip()
            if not name:
                continue
            t_id = s.get("teacher_id") or s.get("teacherId")
            if t_id and len(str(t_id)) != 36:
                t_id = None
            share = float(s.get("share_percent") or s.get("sharePercent") or 35.0)
            clean_subjects.append({
                "name": name,
                "teacher_id": t_id,
                "share_percent": share,
                "chapters": s.get("chapters", [])
            })

        payload = {
            "name": clean_name,
            "fee_type": fee_type,
            "fee_amount": fee_amount,
            "subjects": clean_subjects,
            "is_active": True
        }
        res = supabase.table("batches").insert(payload).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to insert batch into database.")
        
        new_batch = res.data[0]
        new_batch["student_count"] = 0
        new_batch["studentCount"] = 0
        return new_batch
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/batches/{batch_id}", summary="Update Course Batch")
def update_batch(batch_id: str, batch: BatchCreate):
    try:
        supabase = get_supabase_client()
        clean_name = batch.name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Batch name is required.")

        fee_type = batch.fee_type if batch.fee_type in ["MONTHLY", "ONE_TIME"] else "MONTHLY"
        fee_amount = max(0.0, float(batch.fee_amount or 0.0))

        # Subjects strictly according to schema.sql
        raw_subjects = [s if isinstance(s, dict) else s.model_dump() for s in (batch.subjects or [])]
        clean_subjects = []
        for s in raw_subjects:
            name = (s.get("name") or "").strip()
            if not name:
                continue
            t_id = s.get("teacher_id") or s.get("teacherId")
            if t_id and len(str(t_id)) != 36:
                t_id = None
            share = float(s.get("share_percent") or s.get("sharePercent") or 35.0)
            clean_subjects.append({
                "name": name,
                "teacher_id": t_id,
                "share_percent": share,
                "chapters": s.get("chapters", [])
            })

        update_payload = {
            "name": clean_name,
            "fee_type": fee_type,
            "fee_amount": fee_amount,
            "subjects": clean_subjects
        }

        res = supabase.table("batches").update(update_payload).eq("id", batch_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Batch not found or update failed.")

        updated_batch = res.data[0]
        st_res = supabase.table("users").select("id", count="exact").eq("batch_id", batch_id).eq("role", "STUDENT").eq("is_active", True).execute()
        cnt = st_res.count if st_res.count is not None else len(st_res.data or [])
        updated_batch["student_count"] = cnt
        updated_batch["studentCount"] = cnt
        return updated_batch
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/batches/{batch_id}", summary="Delete / Deactivate Course Batch")
def delete_batch(batch_id: str):
    try:
        supabase = get_supabase_client()
        # 1. Unlink any students assigned to this batch
        try:
            supabase.table("users").update({"batch_id": None}).eq("batch_id", batch_id).execute()
        except Exception:
            pass

        # 2. Try permanent deletion if no invoice dependencies
        try:
            del_res = supabase.table("batches").delete().eq("id", batch_id).execute()
            if del_res.data:
                return {"message": "Batch deleted successfully", "id": batch_id}
        except Exception:
            pass

        # 3. Soft-delete fallback
        supabase.table("batches").update({"is_active": False}).eq("id", batch_id).execute()
        try:
            supabase.table("class_routines").update({"is_active": False}).eq("batch_id", batch_id).execute()
        except Exception:
            pass
        return {"message": "Batch deleted successfully", "id": batch_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 4. STUDENTS & ADMISSIONS (Default Password = Phone Number)
# ==============================================================================
@router.get("/students", summary="List All Enrolled Students")
def list_students(batch_id: str = None):
    try:
        supabase = get_supabase_client()
        query = supabase.table("users").select("*, batches(name)").eq("role", "STUDENT").eq("is_active", True)
        if batch_id and batch_id != "ALL":
            try:
                uuid.UUID(batch_id)
                query = query.eq("batch_id", batch_id)
            except ValueError:
                pass
        try:
            res = query.order("created_at", desc=True).execute()
            return res.data or []
        except Exception:
            res = supabase.table("users").select("*").eq("role", "STUDENT").eq("is_active", True).execute()
            students = res.data or []
            for s in students:
                b_id = s.get("batch_id")
                if b_id:
                    try:
                        b_lookup = supabase.table("batches").select("name").eq("id", b_id).execute()
                        if b_lookup.data:
                            s["batches"] = {"name": b_lookup.data[0].get("name")}
                    except Exception:
                        pass
            return students
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/students/admit", summary="New Student Admission (Default Password = Phone Number)")
def admit_student(req: StudentCreate):
    try:
        supabase = get_supabase_client()
        clean_email = req.email.strip().lower()

        # Normalize phone: strip spaces, dashes, +91 prefix → pure digits (10-digit Indian)
        clean_phone = _normalize_phone(req.phone)
        if len(clean_phone) < 6:
            raise HTTPException(
                status_code=400,
                detail=f"Phone number must be at least 6 digits. Received: '{req.phone.strip()}' → normalized: '{clean_phone}'"
            )

        # Default login password is the normalized digits-only phone number
        default_password = clean_phone
        
        # Check duplicate in public.users
        existing = supabase.table("users").select("id").eq("email", clean_email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail=f"Student with email {clean_email} already exists.")
            
        # Resolve batch_id safely (supports UUID or batch name)
        batch_id = req.batch_id
        if batch_id and isinstance(batch_id, str):
            batch_id = batch_id.strip()
            if not batch_id or batch_id.lower() in ["none", "null", "all", "unassigned"]:
                batch_id = None
            else:
                try:
                    uuid.UUID(batch_id)
                except ValueError:
                    # Look up batch by name
                    b_lookup = supabase.table("batches").select("id").ilike("name", batch_id).execute()
                    if b_lookup.data and len(b_lookup.data) > 0:
                        batch_id = b_lookup.data[0]["id"]
                    else:
                        batch_id = None
        else:
            batch_id = None

        # 1. Create or link in Supabase Auth
        user_id = None
        try:
            auth_user = supabase.auth.admin.create_user({
                "email": clean_email,
                "password": default_password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": req.full_name,
                    "role": "STUDENT"
                }
            })
            user_id = auth_user.user.id
        except Exception as auth_err:
            err_str = str(auth_err).lower()
            if "already" in err_str or "exists" in err_str:
                # Try finding existing user from auth
                try:
                    list_u = supabase.auth.admin.list_users()
                    users_list = getattr(list_u, 'users', list_u) if not isinstance(list_u, list) else list_u
                    for u in users_list:
                        u_email = getattr(u, 'email', None) or (u.get('email') if isinstance(u, dict) else None)
                        if u_email and u_email.lower() == clean_email:
                            user_id = getattr(u, 'id', None) or u.get('id')
                            break
                except Exception:
                    pass
            if not user_id:
                raise HTTPException(status_code=400, detail=f"Auth creation failed: {str(auth_err)}")
        
        discount_amt = max(0.0, float(req.discount_amount or 0.0))

        # 2. Insert into public.users strictly matching schema.sql
        record = {
            "id": user_id,
            "full_name": req.full_name.strip(),
            "email": clean_email,
            "phone": clean_phone,
            "role": "STUDENT",
            "batch_id": batch_id,
            "discount_amount": discount_amt,
            "custom_monthly_fee": req.custom_monthly_fee,
            "guardian_name": req.guardian_name.strip() if req.guardian_name else None,
            "guardian_phone": req.guardian_phone.strip() if req.guardian_phone else clean_phone,
            "address": req.address.strip() if req.address else None,
            "is_active": True
        }
        res = supabase.table("users").insert(record).execute()
        
        batch_name = None
        if batch_id:
            try:
                b_lookup = supabase.table("batches").select("name").eq("id", batch_id).execute()
                if b_lookup.data and len(b_lookup.data) > 0:
                    batch_name = b_lookup.data[0].get("name")
            except Exception:
                pass

        student_data = res.data[0] if (res.data and len(res.data) > 0) else record
        if batch_name:
            student_data["batches"] = {"name": batch_name}

        return {
            "message": "Student registered successfully",
            "student": student_data,
            "default_password": default_password,
            "login_instructions": f"Login with Email: {clean_email} and Default Password (Phone): {clean_phone}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/students/{student_id}", summary="Get Student Details")
def get_student(student_id: str):
    try:
        supabase = get_supabase_client()
        try:
            uuid.UUID(student_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid student ID format.")

        res = supabase.table("users").select("*, batches(name)").eq("id", student_id).eq("role", "STUDENT").execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Student not found.")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/students/{student_id}", summary="Update Enrolled Student")
@router.patch("/students/{student_id}", summary="Update Enrolled Student")
def update_student(student_id: str, req: StudentUpdate):
    try:
        supabase = get_supabase_client()

        # Validate student_id UUID format
        try:
            uuid.UUID(student_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid student ID format.")

        # Verify student exists in public.users with role STUDENT
        existing = supabase.table("users").select("*").eq("id", student_id).eq("role", "STUDENT").execute()
        if not existing.data or len(existing.data) == 0:
            raise HTTPException(status_code=404, detail="Student not found.")
        current_student = existing.data[0]

        update_payload = {}

        if req.full_name is not None:
            name_clean = req.full_name.strip()
            if not name_clean:
                raise HTTPException(status_code=400, detail="Student full name cannot be empty.")
            update_payload["full_name"] = name_clean

        if req.phone is not None:
            clean_phone = _normalize_phone(req.phone)
            if len(clean_phone) < 6:
                raise HTTPException(
                    status_code=400,
                    detail=f"Phone number must be at least 6 digits. Received: '{req.phone.strip()}' → normalized: '{clean_phone}'"
                )
            update_payload["phone"] = clean_phone

        if req.guardian_name is not None:
            update_payload["guardian_name"] = req.guardian_name.strip() or None

        if req.guardian_phone is not None:
            g_raw = req.guardian_phone.strip()
            update_payload["guardian_phone"] = _normalize_phone(g_raw) if g_raw else None

        if req.address is not None:
            update_payload["address"] = req.address.strip() or None

        if req.discount_amount is not None:
            update_payload["discount_amount"] = max(0.0, float(req.discount_amount))

        if req.custom_monthly_fee is not None:
            update_payload["custom_monthly_fee"] = float(req.custom_monthly_fee) if float(req.custom_monthly_fee) > 0 else None

        if req.is_active is not None:
            update_payload["is_active"] = bool(req.is_active)

        if req.batch_id is not None:
            bid = req.batch_id
            if isinstance(bid, str):
                bid = bid.strip()
                if not bid or bid.lower() in ["none", "null", "all", "unassigned"]:
                    update_payload["batch_id"] = None
                else:
                    try:
                        uuid.UUID(bid)
                        update_payload["batch_id"] = bid
                    except ValueError:
                        # Batch lookup by name
                        b_lookup = supabase.table("batches").select("id").ilike("name", bid).execute()
                        if b_lookup.data and len(b_lookup.data) > 0:
                            update_payload["batch_id"] = b_lookup.data[0]["id"]
                        else:
                            update_payload["batch_id"] = None
            else:
                update_payload["batch_id"] = None

        if not update_payload:
            batch_name = None
            if current_student.get("batch_id"):
                try:
                    b_lookup = supabase.table("batches").select("name").eq("id", current_student["batch_id"]).execute()
                    if b_lookup.data:
                        batch_name = b_lookup.data[0].get("name")
                except Exception:
                    pass
            if batch_name:
                current_student["batches"] = {"name": batch_name}
            return {
                "message": "No changes provided",
                "student": current_student
            }

        # Update in public.users
        res = supabase.table("users").update(update_payload).eq("id", student_id).eq("role", "STUDENT").execute()

        # Keep Supabase Auth metadata full_name synchronized
        if "full_name" in update_payload:
            try:
                supabase.auth.admin.update_user_by_id(
                    student_id,
                    {"user_metadata": {"full_name": update_payload["full_name"], "role": "STUDENT"}}
                )
            except Exception:
                pass

        updated_student = res.data[0] if (res.data and len(res.data) > 0) else {**current_student, **update_payload}

        # Resolve batch name for UI response
        target_batch_id = updated_student.get("batch_id")
        if target_batch_id:
            try:
                b_lookup = supabase.table("batches").select("name").eq("id", target_batch_id).execute()
                if b_lookup.data and len(b_lookup.data) > 0:
                    updated_student["batches"] = {"name": b_lookup.data[0].get("name")}
                else:
                    updated_student["batches"] = None
            except Exception:
                updated_student["batches"] = None
        else:
            updated_student["batches"] = None

        return {
            "message": "Student updated successfully",
            "student": updated_student
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 5. TEACHERS & FACULTY (Default Password = Phone Number)
# ==============================================================================
@router.get("/teachers", summary="List All Faculty Members")
def list_teachers():
    try:
        supabase = get_supabase_client()
        res = supabase.table("users").select("*").eq("role", "TEACHER").eq("is_active", True).order("full_name").execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/teachers/onboard", summary="Onboard Faculty Member (Default Password = Phone Number)")
def onboard_teacher(req: TeacherCreate):
    try:
        supabase = get_supabase_client()
        clean_email = req.email.strip().lower()

        # Normalize phone: strip spaces, dashes, +91 prefix → pure digits (10-digit Indian)
        clean_phone = _normalize_phone(req.phone)
        if len(clean_phone) < 6:
            raise HTTPException(
                status_code=400,
                detail=f"Phone number must be at least 6 digits. Received: '{req.phone.strip()}' → normalized: '{clean_phone}'"
            )

        # Default login password is the normalized digits-only phone number
        default_password = clean_phone
        
        existing = supabase.table("users").select("id").eq("email", clean_email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail=f"Faculty member with email {clean_email} already exists.")
            
        # 1. Create in Supabase Auth (email_confirm=True for instant access without email verification)
        auth_user = supabase.auth.admin.create_user({
            "email": clean_email,
            "password": default_password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": req.full_name,
                "role": "TEACHER"
            }
        })
        
        # 2. Insert into public.users strictly matching schema.sql
        record = {
            "id": auth_user.user.id,
            "full_name": req.full_name.strip(),
            "email": clean_email,
            "phone": clean_phone,
            "role": "TEACHER",
            "qualification": req.qualification.strip() if req.qualification else None,
            "specialization": req.specialization.strip() if req.specialization else None,
            "is_active": True
        }
        res = supabase.table("users").insert(record).execute()
        rec = res.data[0] if (res.data and len(res.data) > 0) else record
        
        return {
            "message": "Faculty member onboarded successfully",
            "teacher": rec,
            "default_password": default_password,
            "login_instructions": f"Login with Email: {clean_email} and Default Password (Phone): {clean_phone}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/teachers/{teacher_id}", summary="Get Faculty Member Details")
def get_teacher(teacher_id: str):
    try:
        supabase = get_supabase_client()
        try:
            uuid.UUID(teacher_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid teacher ID format.")

        res = supabase.table("users").select("*").eq("id", teacher_id).eq("role", "TEACHER").execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Faculty member not found.")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/teachers/{teacher_id}", summary="Update Faculty Member")
@router.patch("/teachers/{teacher_id}", summary="Update Faculty Member")
def update_teacher(teacher_id: str, req: TeacherUpdate):
    try:
        supabase = get_supabase_client()

        # Validate teacher_id UUID format
        try:
            uuid.UUID(teacher_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid teacher ID format.")

        # Verify teacher exists in public.users with role TEACHER
        existing = supabase.table("users").select("*").eq("id", teacher_id).eq("role", "TEACHER").execute()
        if not existing.data or len(existing.data) == 0:
            raise HTTPException(status_code=404, detail="Faculty member not found.")
        current_teacher = existing.data[0]

        update_payload = {}

        if req.full_name is not None:
            name_clean = req.full_name.strip()
            if not name_clean:
                raise HTTPException(status_code=400, detail="Faculty member full name cannot be empty.")
            update_payload["full_name"] = name_clean

        if req.phone is not None:
            clean_phone = _normalize_phone(req.phone)
            if len(clean_phone) < 6:
                raise HTTPException(
                    status_code=400,
                    detail=f"Phone number must be at least 6 digits. Received: '{req.phone.strip()}' → normalized: '{clean_phone}'"
                )
            update_payload["phone"] = clean_phone

        if req.qualification is not None:
            update_payload["qualification"] = req.qualification.strip() or None

        if req.specialization is not None:
            update_payload["specialization"] = req.specialization.strip() or None

        if req.is_active is not None:
            update_payload["is_active"] = bool(req.is_active)

        if not update_payload:
            return {
                "message": "No changes provided",
                "teacher": current_teacher
            }

        # Update in public.users
        res = supabase.table("users").update(update_payload).eq("id", teacher_id).eq("role", "TEACHER").execute()

        # Keep Supabase Auth metadata full_name synchronized
        if "full_name" in update_payload:
            try:
                supabase.auth.admin.update_user_by_id(
                    teacher_id,
                    {"user_metadata": {"full_name": update_payload["full_name"], "role": "TEACHER"}}
                )
            except Exception:
                pass

        updated_teacher = res.data[0] if (res.data and len(res.data) > 0) else {**current_teacher, **update_payload}

        return {
            "message": "Faculty member updated successfully",
            "teacher": updated_teacher
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


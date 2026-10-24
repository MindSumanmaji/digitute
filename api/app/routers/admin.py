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
    PaymentCollectRequest,
    SessionCreate,
    GenerateMonthSessionsRequest,
    SessionActionRequest
)
from datetime import date, datetime
import calendar
import uuid
import re
import traceback

def _normalize_phone(raw: str) -> str:
    digits = re.sub(r'\D', '', raw)  # keep only digits
    # Normalize leading country code: if 12 digits starting with 91, strip it
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    return digits

def _generate_default_password(name: str) -> str:
    """
    Generates default password in format #{initials}@123
    Examples:
      - 'Pritam Sahoo' -> '#ps@123'
      - 'Suman Kumar Maji' -> '#skm@123'
    """
    words = [w for w in re.split(r'\s+', (name or '').strip()) if w]
    initials = ""
    for w in words:
        match = re.search(r'[a-zA-Z0-9]', w)
        if match:
            initials += match.group(0).lower()
    if not initials:
        initials = "user"
    return f"#{initials}@123"

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
# 3. CLASS ROUTINES & TIMETABLES (RECURRING SCHEDULE & CONFLICT AUDIT)
# ==============================================================================

def _format_time_str(val: str) -> str:
    """Normalizes time string to HH:MM:SS"""
    v = str(val or "").strip()
    if not v:
        return "00:00:00"
    if len(v) == 5:
        return f"{v}:00"
    return v[:8]

def _check_routine_clashes(supabase, teacher_id: str, batch_id: str, day_of_week: int, start_time: str, end_time: str, exclude_id: str = None):
    try:
        t_start = _format_time_str(start_time)
        t_end = _format_time_str(end_time)
        
        # Query active routines for this day_of_week
        routines_res = supabase.table("class_routines").select("*").eq("day_of_week", int(day_of_week)).eq("is_active", True).execute()
        all_day_routines = routines_res.data or []
        
        # Lookups for informative error messages
        b_res = supabase.table("batches").select("id, name").execute()
        batch_map = {b["id"]: b["name"] for b in (b_res.data or []) if b.get("id")}
        t_res = supabase.table("users").select("id, full_name").eq("role", "TEACHER").execute()
        teacher_map = {t["id"]: t["full_name"] for t in (t_res.data or []) if t.get("id")}

        for r in all_day_routines:
            if exclude_id and str(r.get("id")) == str(exclude_id):
                continue
            r_start = _format_time_str(r.get("start_time"))
            r_end = _format_time_str(r.get("end_time"))
            
            # Overlap formula: (r_start < t_end) and (t_start < r_end)
            if r_start < t_end and t_start < r_end:
                t_name = teacher_map.get(r.get("teacher_id")) or "This teacher"
                b_name = batch_map.get(r.get("batch_id")) or "another batch"
                
                if str(r.get("teacher_id")) == str(teacher_id):
                    return {
                        "has_conflict": True,
                        "type": "TEACHER_CONFLICT",
                        "message": f"Conflict detected: Teacher {t_name} is already assigned to '{r.get('subject')}' in batch '{b_name}' from {r_start[:5]} to {r_end[:5]} on this day."
                    }
                if str(r.get("batch_id")) == str(batch_id):
                    return {
                        "has_conflict": True,
                        "type": "BATCH_CONFLICT",
                        "message": f"Conflict detected: Batch '{b_name}' already has a class '{r.get('subject')}' scheduled from {r_start[:5]} to {r_end[:5]} on this day."
                    }
        return {"has_conflict": False}
    except Exception as e:
        traceback.print_exc()
        return {"has_conflict": False}

@router.get("/routines", summary="List All Master Routine Slots")
def list_routines(batch_id: str = None, teacher_id: str = None):
    try:
        supabase = get_supabase_client()
        query = supabase.table("class_routines").select("*").eq("is_active", True)
        if batch_id and batch_id != "ALL":
            query = query.eq("batch_id", batch_id)
        if teacher_id and teacher_id != "ALL":
            query = query.eq("teacher_id", teacher_id)
            
        res = query.order("day_of_week").order("start_time").execute()
        routines = res.data or []
        
        # Batch and teacher maps for reliable names
        b_res = supabase.table("batches").select("id, name").execute()
        batch_map = {b["id"]: b["name"] for b in (b_res.data or []) if b.get("id")}
        t_res = supabase.table("users").select("id, full_name, specialization").eq("role", "TEACHER").execute()
        teacher_map = {t["id"]: t for t in (t_res.data or []) if t.get("id")}
        
        for r in routines:
            b_id = r.get("batch_id")
            t_id = r.get("teacher_id")
            r["batch_name"] = batch_map.get(b_id, "General Batch")
            t_obj = teacher_map.get(t_id, {})
            r["teacher_name"] = t_obj.get("full_name", "Faculty Member")
            r["teacher_specialization"] = t_obj.get("specialization", "")
            
        return routines
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/routines", summary="Create New Master Routine Slot")
def create_routine_slot(slot: RoutineSlotCreate):
    try:
        supabase = get_supabase_client()
        clean_start = _format_time_str(slot.start_time)
        clean_end = _format_time_str(slot.end_time)
        
        if clean_start >= clean_end:
            raise HTTPException(status_code=400, detail="Start time must be strictly earlier than end time.")
            
        # Verify Batch exists
        b_check = supabase.table("batches").select("id, name").eq("id", slot.batch_id).execute()
        if not b_check.data:
            raise HTTPException(status_code=400, detail="Invalid batch selected.")
        batch_name = b_check.data[0]["name"]
        
        # Verify Teacher exists
        t_check = supabase.table("users").select("id, full_name").eq("id", slot.teacher_id).eq("role", "TEACHER").execute()
        if not t_check.data:
            raise HTTPException(status_code=400, detail="Invalid faculty member selected.")
        teacher_name = t_check.data[0]["full_name"]
        
        # Strict Conflict Check
        conflict = _check_routine_clashes(
            supabase=supabase,
            teacher_id=slot.teacher_id,
            batch_id=slot.batch_id,
            day_of_week=slot.day_of_week,
            start_time=clean_start,
            end_time=clean_end
        )
        if conflict["has_conflict"]:
            raise HTTPException(status_code=400, detail=conflict["message"])
            
        payload = {
            "batch_id": slot.batch_id,
            "subject": slot.subject.strip(),
            "teacher_id": slot.teacher_id,
            "day_of_week": slot.day_of_week,
            "start_time": clean_start,
            "end_time": clean_end,
            "is_active": True
        }
        res = supabase.table("class_routines").insert(payload).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to insert routine slot into database.")
            
        created = res.data[0]
        created["batch_name"] = batch_name
        created["teacher_name"] = teacher_name
        return created
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/routines/{routine_id}", summary="Delete Master Routine Slot")
def delete_routine_slot(routine_id: str):
    try:
        supabase = get_supabase_client()
        try:
            del_res = supabase.table("class_routines").delete().eq("id", routine_id).execute()
            if del_res.data:
                return {"message": "Routine slot deleted successfully", "id": routine_id}
        except Exception:
            pass
        supabase.table("class_routines").update({"is_active": False}).eq("id", routine_id).execute()
        return {"message": "Routine slot deactivated successfully", "id": routine_id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 3.1. CLASS SESSIONS (Concrete Date Classes & Calendar Sync)
# ==============================================================================

def _check_session_clashes(supabase, session_date: str, start_time: str, end_time: str, teacher_id: str = None, batch_id: str = None, exclude_id: str = None):
    try:
        s_res = supabase.table("class_sessions").select("*").eq("session_date", session_date).neq("status", "CANCELLED").execute()
        day_sessions = s_res.data or []
        
        t_start = _format_time_str(start_time)
        t_end = _format_time_str(end_time)
        
        b_res = supabase.table("batches").select("id, name").execute()
        batch_map = {b["id"]: b["name"] for b in (b_res.data or []) if b.get("id")}
        t_res = supabase.table("users").select("id, full_name").eq("role", "TEACHER").execute()
        teacher_map = {t["id"]: t["full_name"] for t in (t_res.data or []) if t.get("id")}

        for s in day_sessions:
            if exclude_id and str(s.get("id")) == str(exclude_id):
                continue
            s_start = _format_time_str(s.get("start_time"))
            s_end = _format_time_str(s.get("end_time"))
            
            if s_start < t_end and t_start < s_end:
                t_name = teacher_map.get(s.get("teacher_id")) or "Faculty member"
                b_name = batch_map.get(s.get("batch_id")) or "this batch"
                
                if teacher_id and str(s.get("teacher_id")) == str(teacher_id):
                    return {
                        "has_conflict": True,
                        "type": "TEACHER_SESSION_OVERLAP",
                        "message": f"Conflict detected: Teacher {t_name} is already conducting '{s.get('subject')}' ({b_name}) on {session_date} from {s_start[:5]} to {s_end[:5]}."
                    }
                if batch_id and str(s.get("batch_id")) == str(batch_id):
                    return {
                        "has_conflict": True,
                        "type": "BATCH_SESSION_OVERLAP",
                        "message": f"Conflict detected: Batch '{b_name}' already has a session for '{s.get('subject')}' on {session_date} from {s_start[:5]} to {s_end[:5]}."
                    }
        return {"has_conflict": False}
    except Exception as e:
        traceback.print_exc()
        return {"has_conflict": False}

@router.get("/sessions", summary="List Concrete Date-wise Class Sessions")
def list_sessions(start_date: str = None, end_date: str = None, batch_id: str = None, teacher_id: str = None):
    try:
        supabase = get_supabase_client()
        query = supabase.table("class_sessions").select("*")
        if start_date:
            query = query.gte("session_date", start_date)
        if end_date:
            query = query.lte("session_date", end_date)
        if batch_id and batch_id != "ALL":
            query = query.eq("batch_id", batch_id)
        if teacher_id and teacher_id != "ALL":
            query = query.eq("teacher_id", teacher_id)
            
        res = query.order("session_date").order("start_time").execute()
        sessions = res.data or []
        
        # Batch and teacher maps for reliable names
        b_res = supabase.table("batches").select("id, name").execute()
        batch_map = {b["id"]: b["name"] for b in (b_res.data or []) if b.get("id")}
        t_res = supabase.table("users").select("id, full_name, specialization").eq("role", "TEACHER").execute()
        teacher_map = {t["id"]: t for t in (t_res.data or []) if t.get("id")}
        
        # Fetch attendance counts efficiently
        session_ids = [s["id"] for s in sessions if s.get("id")]
        att_map = {}
        if session_ids:
            try:
                att_res = supabase.table("attendance").select("session_id, status").in_("session_id", session_ids[:200]).execute()
                for a in att_res.data or []:
                    s_id = a.get("session_id")
                    if s_id not in att_map:
                        att_map[s_id] = {"present": 0, "absent": 0}
                    if a.get("status") == "PRESENT":
                        att_map[s_id]["present"] += 1
                    else:
                        att_map[s_id]["absent"] += 1
            except Exception:
                pass
                
        for s in sessions:
            b_id = s.get("batch_id")
            t_id = s.get("teacher_id")
            s["batch_name"] = batch_map.get(b_id, "General Batch")
            t_obj = teacher_map.get(t_id, {})
            s["teacher_name"] = t_obj.get("full_name", "Faculty Member")
            s["teacher_specialization"] = t_obj.get("specialization", "")
            s["attendance_count"] = att_map.get(s["id"], {"present": 0, "absent": 0})
            
        return sessions
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/generate", summary="Auto-Generate Date Sessions from Master Routines for a Month")
def generate_month_sessions(req: GenerateMonthSessionsRequest):
    try:
        supabase = get_supabase_client()
        parts = req.month.strip().split("-")
        if len(parts) != 2:
            raise HTTPException(status_code=400, detail="Month must be in YYYY-MM format, e.g. '2026-10'")
        gen_year, gen_month = int(parts[0]), int(parts[1])
        _, total_days = calendar.monthrange(gen_year, gen_month)
        
        start_month_date = f"{gen_year:04d}-{gen_month:02d}-01"
        end_month_date = f"{gen_year:04d}-{gen_month:02d}-{total_days:02d}"
        
        # 1. Fetch active master routines
        r_query = supabase.table("class_routines").select("*").eq("is_active", True)
        if req.batch_id and req.batch_id != "ALL":
            r_query = r_query.eq("batch_id", req.batch_id)
        routines = r_query.execute().data or []
        
        if not routines:
            return {"message": "No active weekly routines found to generate sessions from.", "generated_count": 0, "sessions": []}
            
        # 2. Fetch existing sessions for this range to prevent duplicate generation
        existing_res = supabase.table("class_sessions").select("id, routine_id, batch_id, session_date, start_time").gte("session_date", start_month_date).lte("session_date", end_month_date).execute()
        existing_sessions = existing_res.data or []
        
        existing_keys = set()
        for es in existing_sessions:
            if es.get("routine_id"):
                existing_keys.add((str(es.get("routine_id")), str(es.get("session_date"))))
            existing_keys.add((str(es.get("batch_id")), str(es.get("session_date")), _format_time_str(es.get("start_time"))))
            
        # 3. Generate sessions day by day
        new_sessions = []
        for d in range(1, total_days + 1):
            cur_date = date(gen_year, gen_month, d)
            # Python isoweekday: 1 = Monday ... 7 = Sunday (matches schema.sql 100%)
            dow = cur_date.isoweekday()
            date_str = cur_date.isoformat()
            
            for r in routines:
                if int(r.get("day_of_week")) == dow:
                    r_id = str(r.get("id"))
                    b_id = str(r.get("batch_id"))
                    r_start = _format_time_str(r.get("start_time"))
                    
                    # Skip if already exists
                    if (r_id, date_str) in existing_keys:
                        continue
                    if (b_id, date_str, r_start) in existing_keys:
                        continue
                        
                    new_sessions.append({
                        "routine_id": r["id"],
                        "batch_id": r["batch_id"],
                        "subject": r["subject"],
                        "teacher_id": r["teacher_id"],
                        "session_date": date_str,
                        "start_time": r_start,
                        "end_time": _format_time_str(r.get("end_time")),
                        "status": "SCHEDULED",
                        "topic_covered": f"Curriculum Module - {r['subject']}"
                    })
                    existing_keys.add((r_id, date_str))
                    existing_keys.add((b_id, date_str, r_start))
                    
        # Bulk insert in chunks of 50
        inserted_sessions = []
        if new_sessions:
            for i in range(0, len(new_sessions), 50):
                chunk = new_sessions[i:i + 50]
                ins_res = supabase.table("class_sessions").insert(chunk).execute()
                if ins_res.data:
                    inserted_sessions.extend(ins_res.data)
                    
        return {
            "message": f"Successfully generated {len(inserted_sessions)} class sessions for {req.month}.",
            "generated_count": len(inserted_sessions),
            "sessions": inserted_sessions
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/sessions/{session_id}", summary="Perform Action on Class Session (Reschedule, Substitute, Cancel, Complete)")
def update_session_action(session_id: str, req: SessionActionRequest):
    try:
        supabase = get_supabase_client()
        s_res = supabase.table("class_sessions").select("*").eq("id", session_id).execute()
        if not s_res.data:
            raise HTTPException(status_code=404, detail="Class session not found.")
        current_session = s_res.data[0]
        
        if req.action == "cancel":
            reason = (req.cancellation_reason or "Cancelled by institute administration").strip()
            up_res = supabase.table("class_sessions").update({
                "status": "CANCELLED",
                "cancellation_reason": reason
            }).eq("id", session_id).execute()
            return {"message": "Session marked as cancelled.", "session": up_res.data[0] if up_res.data else current_session}
            
        elif req.action == "complete":
            topic = (req.topic_covered or current_session.get("topic_covered") or "Lesson completed").strip()
            up_res = supabase.table("class_sessions").update({
                "status": "COMPLETED",
                "topic_covered": topic
            }).eq("id", session_id).execute()
            return {"message": "Session marked as completed.", "session": up_res.data[0] if up_res.data else current_session}
            
        elif req.action == "substitute":
            if not req.substitute_teacher_id:
                raise HTTPException(status_code=400, detail="Please select a substitute faculty member.")
            # Conflict check for substitute teacher on this date and time
            conflict = _check_session_clashes(
                supabase=supabase,
                session_date=current_session["session_date"],
                start_time=current_session["start_time"],
                end_time=current_session["end_time"],
                teacher_id=req.substitute_teacher_id,
                exclude_id=session_id
            )
            if conflict["has_conflict"]:
                raise HTTPException(status_code=400, detail=conflict["message"])
                
            up_res = supabase.table("class_sessions").update({
                "teacher_id": req.substitute_teacher_id
            }).eq("id", session_id).execute()
            return {"message": "Substitute faculty assigned successfully.", "session": up_res.data[0] if up_res.data else current_session}
            
        elif req.action == "reschedule":
            new_date = (req.new_date or current_session["session_date"]).strip()
            new_start = _format_time_str(req.new_start_time or current_session["start_time"])
            new_end = _format_time_str(req.new_end_time or current_session["end_time"])
            
            if new_start >= new_end:
                raise HTTPException(status_code=400, detail="Start time must be strictly earlier than end time.")
                
            # Conflict check for teacher & batch on new date and time
            conflict = _check_session_clashes(
                supabase=supabase,
                session_date=new_date,
                start_time=new_start,
                end_time=new_end,
                teacher_id=current_session.get("teacher_id"),
                batch_id=current_session.get("batch_id"),
                exclude_id=session_id
            )
            if conflict["has_conflict"]:
                raise HTTPException(status_code=400, detail=conflict["message"])
                
            # Audit trail: update current session to RESCHEDULED
            supabase.table("class_sessions").update({
                "status": "RESCHEDULED",
                "cancellation_reason": f"Rescheduled to {new_date} from {new_start[:5]} to {new_end[:5]}"
            }).eq("id", session_id).execute()
            
            # Create new session linked via rescheduled_from_id
            new_payload = {
                "routine_id": current_session.get("routine_id"),
                "batch_id": current_session["batch_id"],
                "subject": current_session["subject"],
                "teacher_id": current_session.get("teacher_id"),
                "session_date": new_date,
                "start_time": new_start,
                "end_time": new_end,
                "status": "SCHEDULED",
                "rescheduled_from_id": session_id,
                "topic_covered": current_session.get("topic_covered")
            }
            new_res = supabase.table("class_sessions").insert(new_payload).execute()
            return {
                "message": f"Session rescheduled to {new_date} with audit trail.",
                "new_session": new_res.data[0] if new_res.data else new_payload
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported action '{req.action}'.")
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 4. STUDENTS & ADMISSIONS
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

@router.post("/students/admit", summary="New Student Admission (Default Password = #{initials}@123)")
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

        # Default login password is in format #{initials}@123 (e.g. 'Pritam Sahoo' -> '#ps@123')
        default_password = _generate_default_password(req.full_name)
        
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
                    if user_id:
                        try:
                            supabase.auth.admin.update_user_by_id(
                                user_id,
                                {
                                    "password": default_password,
                                    "user_metadata": {"full_name": req.full_name, "role": "STUDENT"}
                                }
                            )
                        except Exception:
                            pass
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
        res = supabase.table("users").upsert(record).execute()
        
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
            "login_instructions": f"Login with Email: {clean_email} and Default Password: {default_password}"
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
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
# 5. TEACHERS & FACULTY (Default Password = #{initials}@123)
# ==============================================================================
@router.get("/teachers", summary="List All Faculty Members")
def list_teachers():
    try:
        supabase = get_supabase_client()
        res = supabase.table("users").select("*").eq("role", "TEACHER").eq("is_active", True).order("full_name").execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/teachers/onboard", summary="Onboard Faculty Member (Default Password = #{initials}@123)")
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

        # Default login password is in format #{initials}@123 (e.g. 'Suman Kumar Maji' -> '#skm@123')
        default_password = _generate_default_password(req.full_name)
        
        existing = supabase.table("users").select("id").eq("email", clean_email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail=f"Faculty member with email {clean_email} already exists.")
            
        # 1. Create or link in Supabase Auth (email_confirm=True for instant access without email verification)
        user_id = None
        try:
            auth_user = supabase.auth.admin.create_user({
                "email": clean_email,
                "password": default_password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": req.full_name,
                    "role": "TEACHER"
                }
            })
            user_id = auth_user.user.id
        except Exception as auth_err:
            err_str = str(auth_err).lower()
            if "already" in err_str or "exists" in err_str:
                # User already registered in Auth: locate their ID and update password/metadata
                try:
                    list_u = supabase.auth.admin.list_users()
                    users_list = getattr(list_u, 'users', list_u) if not isinstance(list_u, list) else list_u
                    for u in users_list:
                        u_email = getattr(u, 'email', None) or (u.get('email') if isinstance(u, dict) else None)
                        if u_email and u_email.lower() == clean_email:
                            user_id = getattr(u, 'id', None) or u.get('id')
                            break
                    if user_id:
                        try:
                            supabase.auth.admin.update_user_by_id(
                                user_id,
                                {
                                    "password": default_password,
                                    "user_metadata": {"full_name": req.full_name, "role": "TEACHER"}
                                }
                            )
                        except Exception:
                            pass
                except Exception:
                    pass
            if not user_id:
                raise HTTPException(status_code=400, detail=f"Auth creation failed: {str(auth_err)}")
        
        # 2. Insert or update in public.users strictly matching schema.sql
        record = {
            "id": user_id,
            "full_name": req.full_name.strip(),
            "email": clean_email,
            "phone": clean_phone,
            "role": "TEACHER",
            "qualification": req.qualification.strip() if req.qualification else None,
            "specialization": req.specialization.strip() if req.specialization else None,
            "is_active": True
        }
        res = supabase.table("users").upsert(record).execute()
        rec = res.data[0] if (res.data and len(res.data) > 0) else record
        
        return {
            "message": "Faculty member onboarded successfully",
            "teacher": rec,
            "default_password": default_password,
            "login_instructions": f"Login with Email: {clean_email} and Default Password: {default_password}"
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
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


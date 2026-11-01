from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from app.db import get_supabase_client
from app.core.dependencies import get_current_user, require_roles
from app.models import (
    SessionCreate,
    MarkAttendanceRequest,
    StudyMaterialCreate,
    StudyMaterialResponse,
    DppCreate,
    DppManualCreate,
    DppResponse,
    DoubtResolve,
    SyllabusSaveRequest,
    SyllabusToggleChapterRequest,
    ExamCreate,
    ExamUpdate,
    TeacherNoticeCreate,
    TeacherCollectCashRequest
)
from datetime import date, datetime, timezone
from typing import Any, Optional
import uuid
import os
import re
import traceback
import calendar

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MiB limit

ALLOWED_EXTENSIONS = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
}

ALLOWED_DPP_EXTENSIONS = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}

def validate_magic_bytes(ext: str, header: bytes) -> bool:
    if ext == ".pdf":
        return header.startswith(b"%PDF")
    elif ext == ".doc":
        return header.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
    elif ext == ".docx":
        return header.startswith(b"PK\x03\x04")
    elif ext == ".png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    elif ext in (".jpg", ".jpeg"):
        return header.startswith(b"\xff\xd8\xff")
    elif ext == ".webp":
        return len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WEBP"
    elif ext == ".mp4":
        return len(header) >= 8 and (b"ftyp" in header[:16] or b"moov" in header[:16])
    elif ext in (".webm", ".mkv"):
        return header.startswith(b"\x1a\x45\xdf\xa3")
    elif ext == ".mov":
        return len(header) >= 8 and (b"ftyp" in header[:16] or b"moov" in header[:16] or b"mdat" in header[:16] or b"wide" in header[:16])
    return False

def verify_teacher_batch_and_subject(supabase, teacher_id: str, teacher_name: str, batch_id: str, subject_name: str, role: str) -> None:
    if role == "ADMIN":
        return

    batch_res = supabase.table("batches").select("*").eq("id", batch_id).execute()
    if not batch_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    batch = batch_res.data[0]
    subjects = batch.get("subjects") or []
    target_subject = subject_name.strip().lower()
    teacher_name_lower = (teacher_name or "").strip().lower()

    authorized = False
    for s in subjects:
        s_name = (s.get("name") or "").strip().lower()
        if s_name == target_subject:
            s_teacher_id = s.get("teacher_id")
            s_teacher_name = (s.get("teacher") or "").strip().lower()
            if s_teacher_id == teacher_id or (s_teacher_name and s_teacher_name == teacher_name_lower):
                authorized = True
                break

    if not authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not authorized to upload materials for '{subject_name}' in this batch."
        )

router = APIRouter(
    prefix="/api/teacher",
    tags=["Teacher Portal API"],
    dependencies=[Depends(require_roles(["TEACHER", "ADMIN"]))]
)

# ==============================================================================
# 1. TEACHER SCHEDULE & ROUTINE
# ==============================================================================
@router.get("/my-routine", summary="Get Weekly Routine for Logged-In Teacher")
def get_my_routine(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        role = current_user.get("role")
        
        query = supabase.table("class_routines").select(
            "*, batches(name)"
        ).eq("is_active", True)
        
        if role == "TEACHER" or (role != "ADMIN" and teacher_id):
            query = query.eq("teacher_id", teacher_id)
            
        res = query.order("day_of_week").order("start_time").execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routines/all", summary="Get ALL active class routines (own + other teachers, with is_own flag)")
def get_all_routines_for_reschedule(
    current_user: dict = Depends(get_current_user)
):
    """Returns every active class_routine (not filtered by teacher_id).
    Each record gets an `is_own` boolean so the frontend knows which belong to
    the logged-in teacher vs other teachers.
    Used by the Reschedule calendar to show dots on future months even when no
    concrete class_session records exist yet."""
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")

        res = (
            supabase.table("class_routines")
            .select("*, batches(name)")
            .eq("is_active", True)
            .order("day_of_week")
            .order("start_time")
            .execute()
        )
        routines = res.data or []
        for r in routines:
            r["is_own"] = (r.get("teacher_id") == teacher_id)
        return routines
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-batches", summary="Get Batches Assigned to Logged-In Teacher")
def get_my_batches(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        teacher_name = current_user.get("full_name", "").lower()
        
        role = current_user.get("role")
        
        # Batches where this teacher is mapped in subjects
        all_batches = supabase.table("batches").select("*").eq("is_active", True).execute()
        assigned = []
        
        for b in all_batches.data or []:
            subjects = b.get("subjects") or []
            if role == "ADMIN":
                matches = subjects
            else:
                matches = [
                    s for s in subjects
                    if s.get("teacher_id") == teacher_id or s.get("teacher", "").lower() == teacher_name
                ]
            if matches:
                assigned.append({
                    "batch_id": b.get("id"),
                    "batch_name": b.get("name"),
                    "subjects": matches
                })
        return assigned
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batch-summary", summary="Get Live Student Count and Doubt Stats for Batch & Subject")
def get_batch_summary(
    batch_id: Optional[str] = None,
    batch_name: Optional[str] = None,
    subject: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        target_batch_id = batch_id
        if not target_batch_id and batch_name:
            b_res = supabase.table("batches").select("id").ilike("name", batch_name.strip()).execute()
            if b_res.data:
                target_batch_id = b_res.data[0]["id"]
                
        student_count = 0
        if target_batch_id:
            st_res = supabase.table("users").select("id", count="exact").eq("role", "STUDENT").eq("batch_id", target_batch_id).eq("is_active", True).execute()
            student_count = st_res.count if st_res.count is not None else len(st_res.data or [])

        doubt_query = supabase.table("doubts").select("id, status, subject, batch_id")
        if target_batch_id:
            doubt_query = doubt_query.eq("batch_id", target_batch_id)
        if subject:
            doubt_query = doubt_query.ilike("subject", subject.strip())
            
        d_res = doubt_query.execute()
        doubts = d_res.data or []
        
        total_doubts = len(doubts)
        resolved_doubts = sum(1 for d in doubts if d.get("status") == "RESOLVED")
        pending_doubts = sum(1 for d in doubts if d.get("status") != "RESOLVED")
        solved_pct = round((resolved_doubts / total_doubts) * 100) if total_doubts > 0 else 100

        return {
            "batch_id": target_batch_id,
            "students": student_count,
            "doubts": {
                "total": total_doubts,
                "resolved": resolved_doubts,
                "pending": pending_doubts,
                "solved_pct": solved_pct
            }
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# 1.1 ENROLLED BATCH STUDENTS FOR TEACHER
# ==============================================================================
@router.get("/students", summary="Get Enrolled Students for Batch & Subject")
def get_batch_students(
    batch_id: Optional[str] = None,
    batch_name: Optional[str] = None,
    subject: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        target_batch_id = batch_id
        target_batch_name = batch_name

        if target_batch_id:
            try:
                uuid.UUID(target_batch_id)
                b_res = supabase.table("batches").select("id, name").eq("id", target_batch_id).execute()
                if b_res.data:
                    target_batch_name = b_res.data[0].get("name")
            except ValueError:
                # If target_batch_id was passed as a batch name string instead of UUID
                b_res = supabase.table("batches").select("id, name").ilike("name", target_batch_id.strip()).execute()
                if b_res.data:
                    target_batch_id = b_res.data[0].get("id")
                    target_batch_name = b_res.data[0].get("name")
        elif target_batch_name:
            b_res = supabase.table("batches").select("id, name").ilike("name", target_batch_name.strip()).execute()
            if b_res.data:
                target_batch_id = b_res.data[0].get("id")
                target_batch_name = b_res.data[0].get("name")

        if not target_batch_id:
            return []

        # 1. Fetch only enrolled active students for this specific batch from the database
        st_res = supabase.table("users").select(
            "id, full_name, email, phone, avatar_url, batch_id, created_at, role, is_active"
        ).eq("role", "STUDENT").eq("batch_id", target_batch_id).eq("is_active", True).order("full_name").execute()

        student_rows = st_res.data or []
        if not student_rows:
            return []

        # 2. Query attendance for sessions of this batch and subject
        student_att = {}
        try:
            session_query = supabase.table("class_sessions").select("id, session_date, subject").eq("batch_id", target_batch_id)
            if subject:
                session_query = session_query.ilike("subject", subject.strip())
            session_res = session_query.execute()
            sessions = session_res.data or []
            session_ids = [s["id"] for s in sessions if s.get("id")]

            if session_ids:
                att_res = supabase.table("attendance").select("student_id, status").in_("session_id", session_ids).execute()
                for a in att_res.data or []:
                    sid = a.get("student_id")
                    if sid:
                        if sid not in student_att:
                            student_att[sid] = {"total": 0, "present": 0}
                        student_att[sid]["total"] += 1
                        if a.get("status") == "PRESENT":
                            student_att[sid]["present"] += 1
        except Exception as att_err:
            print("Attendance lookup warning:", att_err)

        # 3. Query exams for this batch and subject
        student_exam_scores = {}
        try:
            exam_query = supabase.table("exams").select("id, title, total_marks, exam_date, results").eq("batch_id", target_batch_id)
            if subject:
                exam_query = exam_query.ilike("subject", subject.strip())
            exam_res = exam_query.execute()
            for ex in exam_res.data or []:
                results = ex.get("results") or []
                try:
                    total_m = float(ex.get("total_marks") or 100)
                except (ValueError, TypeError):
                    total_m = 100.0
                for r in results:
                    sid = r.get("student_id")
                    obtained = r.get("marks_obtained")
                    if sid and obtained is not None and not r.get("is_absent"):
                        try:
                            obt = float(obtained)
                            pct = (obt / total_m) * 100 if total_m > 0 else 0
                            if sid not in student_exam_scores:
                                student_exam_scores[sid] = []
                            student_exam_scores[sid].append(pct)
                        except (ValueError, TypeError):
                            pass
        except Exception as exam_err:
            print("Exam lookup warning:", exam_err)

        # 4. Format students list strictly matching database records
        formatted_students = []
        for idx, s in enumerate(student_rows):
            sid = s.get("id")

            # Calculate attendance status & percentage
            att_info = student_att.get(sid)
            if att_info and att_info["total"] > 0:
                att_pct = round((att_info["present"] / att_info["total"]) * 100)
                if att_pct >= 90:
                    att_status = "Excellent"
                elif att_pct >= 80:
                    att_status = "Good"
                elif att_pct >= 70:
                    att_status = "Average"
                else:
                    att_status = "Below Average"
            else:
                att_pct = None
                att_status = "No Classes"

            # Calculate grade from actual exam scores
            scores = student_exam_scores.get(sid, [])
            if scores:
                avg_score = sum(scores) / len(scores)
                if avg_score >= 90:
                    grade = "A+"
                elif avg_score >= 80:
                    grade = "A"
                elif avg_score >= 70:
                    grade = "B+"
                elif avg_score >= 60:
                    grade = "B"
                elif avg_score >= 50:
                    grade = "C"
                else:
                    grade = "D"
            else:
                grade = "N/A"

            clean_phone = s.get("phone") or ""
            if clean_phone.startswith("+91"):
                clean_phone = clean_phone[3:].strip()
            elif clean_phone.startswith("91") and len(clean_phone) == 12:
                clean_phone = clean_phone[2:]

            formatted_students.append({
                "id": sid,
                "roll": f"CS-{idx+1:02d}",
                "name": s.get("full_name") or "Enrolled Student",
                "phone": clean_phone,
                "email": s.get("email") or "",
                "avatar_url": s.get("avatar_url"),
                "batch_id": target_batch_id,
                "batch_name": target_batch_name or "Assigned Batch",
                "attendance": att_status,
                "attendancePct": att_pct,
                "grade": grade,
                "total_classes": att_info["total"] if att_info else 0,
                "present_classes": att_info["present"] if att_info else 0,
                "exams_count": len(scores)
            })

        return formatted_students
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/students/{student_id}/performance", summary="Get Live Exam Evaluation History for Student")
def get_student_exam_performance(
    student_id: str,
    batch_id: Optional[str] = None,
    subject: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        query = supabase.table("exams").select("id, title, total_marks, exam_date, subject, batch_id, results").eq("is_active", True)
        if batch_id:
            query = query.eq("batch_id", batch_id)
        if subject:
            query = query.ilike("subject", subject.strip())
            
        ex_res = query.order("exam_date", desc=True).execute()
        exams = ex_res.data or []
        
        history = []
        valid_scores = []
        
        for ex in exams:
            results = ex.get("results") or []
            total_m = float(ex.get("total_marks") or 100)
            
            for r in results:
                if str(r.get("student_id")) == str(student_id):
                    is_abs = bool(r.get("is_absent"))
                    obtained = r.get("marks_obtained")
                    pct = None
                    grade = "N/A"
                    if not is_abs and obtained is not None:
                        try:
                            obt = float(obtained)
                            pct = round((obt / total_m) * 100) if total_m > 0 else 0
                            valid_scores.append(pct)
                            if pct >= 90: grade = "A+"
                            elif pct >= 80: grade = "A"
                            elif pct >= 70: grade = "B+"
                            elif pct >= 60: grade = "B"
                            elif pct >= 50: grade = "C"
                            else: grade = "D"
                        except (ValueError, TypeError):
                            pass
                            
                    history.append({
                        "examId": ex.get("id"),
                        "examTitle": ex.get("title") or "Class Exam",
                        "subject": ex.get("subject") or "General",
                        "examDate": ex.get("exam_date") or "",
                        "totalMarks": total_m,
                        "obtainedMarks": obtained,
                        "isAbsent": is_abs,
                        "percentage": pct,
                        "grade": grade
                    })
                    break

        if valid_scores:
            avg_pct = round(sum(valid_scores) / len(valid_scores))
            if avg_pct >= 90: overall_grade = "A+"
            elif avg_pct >= 80: overall_grade = "A"
            elif avg_pct >= 70: overall_grade = "B+"
            elif avg_pct >= 60: overall_grade = "B"
            elif avg_pct >= 50: overall_grade = "C"
            else: overall_grade = "D"
        else:
            avg_pct = None
            overall_grade = "N/A"

        return {
            "hasExams": len(valid_scores) > 0,
            "overallGrade": overall_grade,
            "avgPercentage": avg_pct,
            "totalExamsCount": len(history),
            "evaluatedCount": len(valid_scores),
            "absentCount": sum(1 for h in history if h.get("isAbsent")),
            "history": history
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 2. CLASS SESSIONS & ATTENDANCE
# ==============================================================================
@router.get("/sessions", summary="Get Sessions for Teacher (by date, range, month, or all)")
def get_teacher_sessions(
    session_date: Optional[str] = None,
    batch_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    month: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        role = current_user.get("role")
        teacher_id = current_user.get("id")
        
        query = supabase.table("class_sessions").select("*, batches(name)")
        
        if role == "TEACHER":
            query = query.eq("teacher_id", teacher_id)
            
        if session_date:
            query = query.eq("session_date", session_date)
        elif month:
            try:
                y, m = [int(p) for p in month.split("-")[:2]]
                _, last_day = calendar.monthrange(y, m)
                query = query.gte("session_date", f"{month}-01").lte("session_date", f"{month}-{last_day:02d}")
            except Exception:
                query = query.gte("session_date", f"{month}-01").lte("session_date", f"{month}-28")
        else:
            if start_date:
                query = query.gte("session_date", start_date)
            if end_date:
                query = query.lte("session_date", end_date)
            
        if batch_id:
            query = query.eq("batch_id", batch_id)
            
        res = query.order("session_date").order("start_time").execute()
        sessions = res.data or []
        
        if sessions:
            session_ids = [s["id"] for s in sessions]
            att_res = supabase.table("attendance").select("session_id, status").in_("session_id", session_ids).execute()
            att_counts = {}
            for a in att_res.data or []:
                sid = a["session_id"]
                if sid not in att_counts:
                    att_counts[sid] = {"present": 0, "absent": 0, "total": 0}
                att_counts[sid]["total"] += 1
                if a.get("status") == "PRESENT":
                    att_counts[sid]["present"] += 1
                elif a.get("status") == "ABSENT":
                    att_counts[sid]["absent"] += 1

            parent_ids = [s["rescheduled_from_id"] for s in sessions if s.get("rescheduled_from_id")]
            parent_map = {}
            if parent_ids:
                try:
                    p_res = supabase.table("class_sessions").select("id, session_date, start_time, end_time").in_("id", parent_ids).execute()
                    for p in p_res.data or []:
                        parent_map[p["id"]] = p
                except Exception:
                    pass
                    
            for s in sessions:
                s["attendance_summary"] = att_counts.get(s["id"], None)
                if s.get("rescheduled_from_id") and s["rescheduled_from_id"] in parent_map:
                    p = parent_map[s["rescheduled_from_id"]]
                    s["rescheduled_from_date"] = p.get("session_date")
                    s["rescheduled_from_start_time"] = p.get("start_time")
                    s["rescheduled_from_end_time"] = p.get("end_time")
                else:
                    s["rescheduled_from_date"] = None
                    s["rescheduled_from_start_time"] = None
                    s["rescheduled_from_end_time"] = None
                
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/today", summary="Get Today's Sessions for This Teacher")
def get_today_sessions(current_user: dict = Depends(get_current_user)):
    today_str = date.today().isoformat()
    return get_teacher_sessions(session_date=today_str, batch_id=None, current_user=current_user)


@router.get("/sessions/all", summary="Get ALL sessions for a date/month (own + other teachers)")
def get_all_sessions_for_reschedule(
    session_date: Optional[str] = None,
    month: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Returns all class sessions (not filtered by teacher_id) so teacher can see their own + other teachers' classes.
    Each session has an extra field `is_own: bool` to identify the logged-in teacher's sessions."""
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")

        query = supabase.table("class_sessions").select("*, batches(name)")

        if session_date:
            query = query.eq("session_date", session_date)
        elif month:
            try:
                y, m = [int(p) for p in month.split("-")[:2]]
                _, last_day = calendar.monthrange(y, m)
                query = query.gte("session_date", f"{month}-01").lte("session_date", f"{month}-{last_day:02d}")
            except Exception:
                query = query.gte("session_date", f"{month}-01").lte("session_date", f"{month}-28")

        res = query.order("session_date").order("start_time").execute()
        sessions = res.data or []

        parent_ids = [s["rescheduled_from_id"] for s in sessions if s.get("rescheduled_from_id")]
        parent_map = {}
        if parent_ids:
            try:
                p_res = supabase.table("class_sessions").select("id, session_date, start_time, end_time").in_("id", parent_ids).execute()
                for p in p_res.data or []:
                    parent_map[p["id"]] = p
            except Exception:
                pass

        for s in sessions:
            s["is_own"] = (s.get("teacher_id") == teacher_id)
            if s.get("rescheduled_from_id") and s["rescheduled_from_id"] in parent_map:
                p = parent_map[s["rescheduled_from_id"]]
                s["rescheduled_from_date"] = p.get("session_date")
                s["rescheduled_from_start_time"] = p.get("start_time")
                s["rescheduled_from_end_time"] = p.get("end_time")
            else:
                s["rescheduled_from_date"] = None
                s["rescheduled_from_start_time"] = None
                s["rescheduled_from_end_time"] = None

        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _format_date_dmy(d_str: str) -> str:
    try:
        parts = d_str.strip().split("-")
        if len(parts) == 3:
            return f"{parts[2]}/{parts[1]}/{parts[0]}"
    except Exception:
        pass
    return d_str

@router.post("/sessions/{session_id}/reschedule", summary="Reschedule a class session to a new date/time")
def reschedule_session(
    session_id: str,
    new_date: str,
    new_start_time: str,
    new_end_time: str,
    source_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Reschedule a session or master routine:
    1. If session_id is a concrete class_session, updates its status to RESCHEDULED with cancellation_reason audit text, preserving original date.
    2. If session_id is a master routine, creates a concrete class_session on source_date with status=RESCHEDULED.
    3. Inserts a new concrete session on new_date with status=SCHEDULED and rescheduled_from_id pointing to original session.
    """
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        role = current_user.get("role")
        now_iso = datetime.now(timezone.utc).isoformat()
        clean_start = new_start_time[:5]
        clean_end = new_end_time[:5]

        # Check if session exists in class_sessions
        sess_res = supabase.table("class_sessions").select("*").eq("id", session_id).execute()
        if sess_res.data:
            current_session = sess_res.data[0]
            if role == "TEACHER" and current_session.get("teacher_id") != teacher_id:
                raise HTTPException(status_code=403, detail="You can only reschedule your own sessions")

            if current_session.get("status") == "CANCELLED":
                raise HTTPException(status_code=400, detail="Cannot reschedule a cancelled class session")
            if current_session.get("status") == "COMPLETED":
                raise HTTPException(status_code=400, detail="Cannot reschedule an already completed class session")
            if current_session.get("status") == "RESCHEDULED":
                raise HTTPException(status_code=400, detail="This session has already been rescheduled")

            # Step 1: Audit trail - update current session to RESCHEDULED, preserving its session_date & times
            supabase.table("class_sessions").update({
                "status": "RESCHEDULED",
                "cancellation_reason": f"Rescheduled to {_format_date_dmy(new_date)} from {clean_start} to {clean_end}",
                "updated_at": now_iso
            }).eq("id", session_id).execute()

            # Step 2: Create new session linked via rescheduled_from_id
            new_payload = {
                "routine_id": current_session.get("routine_id"),
                "batch_id": current_session["batch_id"],
                "subject": current_session["subject"],
                "teacher_id": current_session.get("teacher_id"),
                "session_date": new_date,
                "start_time": new_start_time,
                "end_time": new_end_time,
                "status": "SCHEDULED",
                "rescheduled_from_id": session_id,
                "topic_covered": current_session.get("topic_covered"),
                "created_at": now_iso,
                "updated_at": now_iso
            }
            new_res = supabase.table("class_sessions").insert(new_payload).execute()
            new_session = new_res.data[0] if new_res.data else new_payload

            return {
                "message": f"Session rescheduled successfully to {new_date}",
                "original_session_id": session_id,
                "session": new_session
            }
        else:
            # Fallback: check if session_id is a master routine slot
            rout_res = supabase.table("class_routines").select("*").eq("id", session_id).execute()
            if not rout_res.data:
                raise HTTPException(status_code=404, detail="Session or routine not found")

            routine = rout_res.data[0]
            if role == "TEACHER" and routine.get("teacher_id") != teacher_id:
                raise HTTPException(status_code=403, detail="You can only reschedule your own routines")

            orig_date = source_date or date.today().isoformat()

            # Step 1: Create concrete session for orig_date with status=RESCHEDULED
            orig_payload = {
                "routine_id": routine["id"],
                "batch_id": routine["batch_id"],
                "subject": routine["subject"],
                "teacher_id": routine["teacher_id"],
                "session_date": orig_date,
                "start_time": routine["start_time"],
                "end_time": routine["end_time"],
                "status": "RESCHEDULED",
                "cancellation_reason": f"Rescheduled to {_format_date_dmy(new_date)} from {clean_start} to {clean_end}",
                "created_at": now_iso,
                "updated_at": now_iso
            }
            orig_res = supabase.table("class_sessions").insert(orig_payload).execute()
            orig_session = orig_res.data[0] if orig_res.data else orig_payload
            orig_id = orig_session.get("id")

            # Step 2: Create new session on new_date with status=SCHEDULED
            new_payload = {
                "routine_id": routine["id"],
                "batch_id": routine["batch_id"],
                "subject": routine["subject"],
                "teacher_id": routine["teacher_id"],
                "session_date": new_date,
                "start_time": new_start_time,
                "end_time": new_end_time,
                "status": "SCHEDULED",
                "rescheduled_from_id": orig_id,
                "created_at": now_iso,
                "updated_at": now_iso
            }
            new_res = supabase.table("class_sessions").insert(new_payload).execute()
            new_session = new_res.data[0] if new_res.data else new_payload

            return {
                "message": f"Routine class rescheduled successfully to {new_date}",
                "original_session_id": orig_id,
                "session": new_session
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/cancel", summary="Cancel a class session with a reason")
def cancel_session(
    session_id: str,
    reason: str = "",
    source_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a session: sets status=CANCELLED and stores cancellation_reason."""
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        role = current_user.get("role")
        now_iso = datetime.now(timezone.utc).isoformat()

        # Check concrete class_sessions
        sess_res = supabase.table("class_sessions").select("id, teacher_id, status").eq("id", session_id).execute()
        if sess_res.data:
            sess = sess_res.data[0]
            if role == "TEACHER" and sess.get("teacher_id") != teacher_id:
                raise HTTPException(status_code=403, detail="You can only cancel your own sessions")

            update_payload = {
                "status": "CANCELLED",
                "cancellation_reason": reason.strip() if reason else None,
                "updated_at": now_iso
            }
            result = supabase.table("class_sessions").update(update_payload).eq("id", session_id).execute()
            updated = result.data[0] if result.data else {}

            return {"message": "Session cancelled successfully", "session": updated}
        else:
            # Fallback: check master routines
            rout_res = supabase.table("class_routines").select("*").eq("id", session_id).execute()
            if not rout_res.data:
                raise HTTPException(status_code=404, detail="Session or routine not found")

            routine = rout_res.data[0]
            if role == "TEACHER" and routine.get("teacher_id") != teacher_id:
                raise HTTPException(status_code=403, detail="You can only cancel your own routines")

            orig_date = source_date or date.today().isoformat()
            cancel_payload = {
                "routine_id": routine["id"],
                "batch_id": routine["batch_id"],
                "subject": routine["subject"],
                "teacher_id": routine["teacher_id"],
                "session_date": orig_date,
                "start_time": routine["start_time"],
                "end_time": routine["end_time"],
                "status": "CANCELLED",
                "cancellation_reason": reason.strip() if reason else None,
                "created_at": now_iso,
                "updated_at": now_iso
            }
            result = supabase.table("class_sessions").insert(cancel_payload).execute()
            return {"message": "Routine class cancelled successfully", "session": result.data[0] if result.data else cancel_payload}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/create", summary="Create or Start a Class Session")
def create_session(session: SessionCreate, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = session.teacher_id or current_user.get("id")
        
        payload = session.model_dump()
        payload["teacher_id"] = teacher_id
        payload["session_date"] = session.session_date.isoformat()
        payload["status"] = "SCHEDULED"
        
        res = supabase.table("class_sessions").insert(payload).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}/students", summary="Get Batch Students to Mark Attendance")
def get_session_students(session_id: str):
    try:
        supabase = get_supabase_client()
        
        # Get session details & batch_id
        s_res = supabase.table("class_sessions").select("*, batches(name)").eq("id", session_id).execute()
        if not s_res.data:
            raise HTTPException(status_code=404, detail="Class session not found")
            
        session_info = s_res.data[0]
        batch_id = session_info.get("batch_id")
        
        # Fetch enrolled students in this batch
        st_res = supabase.table("users").select(
            "id, full_name, email, phone, avatar_url"
        ).eq("role", "STUDENT").eq("batch_id", batch_id).eq("is_active", True).order("full_name").execute()
        
        # Fetch existing marked attendance for this session if any
        att_res = supabase.table("attendance").select("student_id, status").eq("session_id", session_id).execute()
        status_map = {a.get("student_id"): a.get("status") for a in att_res.data or []}
        has_marked = len(att_res.data or []) > 0
        
        students = []
        for s in st_res.data or []:
            students.append({
                **s,
                "attendance_status": status_map.get(s.get("id"), "PRESENT")
            })
            
        return {
            "session": session_info,
            "has_marked": has_marked,
            "students": students
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/attendance/mark", summary="Save or Update Attendance Ledger for Session")
def mark_attendance(req: MarkAttendanceRequest, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        marked_by = current_user.get("id")
        
        records = []
        for entry in req.records:
            records.append({
                "session_id": req.session_id,
                "student_id": entry.student_id,
                "status": entry.status,
                "marked_by": marked_by
            })
            
        # Upsert into attendance ledger
        if records:
            supabase.table("attendance").upsert(
                records, on_conflict="session_id, student_id"
            ).execute()
        
        # Update session status to COMPLETED and topic_covered if provided
        update_data = {"status": "COMPLETED"}
        if req.topic_covered is not None:
            update_data["topic_covered"] = req.topic_covered.strip()
            
        supabase.table("class_sessions").update(update_data).eq("id", req.session_id).execute()
        
        return {
            "message": "Attendance marked successfully",
            "marked_count": len(records)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 3. STUDY MATERIALS & DPPS
# ==============================================================================
@router.post("/study-materials", summary="Upload Study Material / PDF / Video for Batch")
async def upload_study_material(
    file: UploadFile = File(...),
    batch_id: str = Form(...),
    subject: str = Form(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_client()
    teacher_id = current_user.get("id")
    teacher_name = current_user.get("full_name", "")
    user_role = current_user.get("role", "TEACHER")

    # 1. Authorize teacher for batch and exact subject
    verify_teacher_batch_and_subject(supabase, teacher_id, teacher_name, batch_id, subject, user_role)

    # 2. Validate filename and extension
    original_filename = file.filename or "uploaded_file"
    clean_filename = os.path.basename(original_filename)
    ext = os.path.splitext(clean_filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: PDF, DOC, DOCX, MP4, WEBM, MOV, MKV"
        )

    # 3. Read content & validate file size
    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="File size exceeds the maximum limit of 50 MiB"
        )

    # 4. Validate file content magic bytes
    if not validate_magic_bytes(ext, contents[:32]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File signature/content does not match declared extension '{ext}'"
        )

    # 5. Prepare storage object path
    safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_filename)
    object_name = f"{uuid.uuid4().hex[:12]}_{safe_name}"
    storage_path = f"study_materials/{batch_id}/{object_name}"

    content_type = file.content_type or ALLOWED_EXTENSIONS[ext]
    if content_type == "application/octet-stream":
        content_type = ALLOWED_EXTENSIONS[ext]

    # 6. Upload file to Supabase Storage
    try:
        supabase.storage.from_("digitute").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": content_type, "upsert": "true"}
        )
    except Exception as upload_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage upload failed: {str(upload_err)}"
        )

    # 7. Insert record in study_materials table
    doc_title = title.strip() if title and title.strip() else clean_filename
    payload = {
        "batch_id": batch_id,
        "teacher_id": teacher_id,
        "subject": subject.strip(),
        "title": doc_title,
        "description": description.strip() if description and description.strip() else None,
        "file_url": storage_path
    }

    try:
        res = supabase.table("study_materials").insert(payload).execute()
        record = res.data[0] if res.data else payload
    except Exception as db_err:
        # Rollback: delete uploaded file from storage to avoid orphaned objects
        try:
            supabase.storage.from_("digitute").remove([storage_path])
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save study material record: {str(db_err)}"
        )

    # 8. Generate signed URL for immediate usage (3600 seconds)
    try:
        signed = supabase.storage.from_("digitute").create_signed_url(storage_path, 3600)
        record["signed_url"] = signed.get("signedURL") or signed.get("signedUrl")
    except Exception:
        record["signed_url"] = None

    return record

@router.get("/study-materials", summary="List Study Materials Uploaded by Teacher")
def list_my_materials(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        user_role = current_user.get("role")

        query = supabase.table("study_materials").select("*, batches(name)")
        if user_role != "ADMIN":
            query = query.eq("teacher_id", teacher_id)

        res = query.order("created_at", desc=True).execute()
        materials = res.data or []

        # Generate signed URLs (3600 seconds expiration)
        for item in materials:
            file_path = item.get("file_url")
            if file_path:
                try:
                    signed = supabase.storage.from_("digitute").create_signed_url(file_path, 3600)
                    item["signed_url"] = signed.get("signedURL") or signed.get("signedUrl")
                except Exception:
                    item["signed_url"] = None
        return materials
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/study-materials/{material_id}/access-url", summary="Get Fresh Signed URL for Material")
def get_material_access_url(material_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        user_role = current_user.get("role")

        res = supabase.table("study_materials").select("*").eq("id", material_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Study material not found")

        material = res.data[0]
        if user_role != "ADMIN" and material.get("teacher_id") != teacher_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this study material")

        file_path = material.get("file_url")
        if not file_path:
            raise HTTPException(status_code=400, detail="No file path associated with this material")

        signed = supabase.storage.from_("digitute").create_signed_url(file_path, 3600)
        signed_url = signed.get("signedURL") or signed.get("signedUrl")
        return {"signed_url": signed_url, "expires_in": 3600}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/study-materials/{material_id}", summary="Delete Study Material")
def delete_study_material(material_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        user_role = current_user.get("role")

        res = supabase.table("study_materials").select("*").eq("id", material_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Study material not found")

        material = res.data[0]
        if user_role != "ADMIN" and material.get("teacher_id") != teacher_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this study material")

        file_path = material.get("file_url")

        supabase.table("study_materials").delete().eq("id", material_id).execute()

        if file_path:
            try:
                supabase.storage.from_("digitute").remove([file_path])
            except Exception:
                pass

        return {"message": "Study material deleted successfully", "id": material_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ==============================================================================
# 4. DAILY PRACTICE PROBLEMS (DPPS)
# ==============================================================================
@router.post("/dpps", summary="Upload DPP / Worksheet for Batch")
async def upload_dpp(
    file: UploadFile = File(...),
    batch_id: str = Form(...),
    subject: str = Form(...),
    title: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_client()
    teacher_id = current_user.get("id")
    teacher_name = current_user.get("full_name", "")
    user_role = current_user.get("role", "TEACHER")

    # 1. Authorize teacher for batch and exact subject
    verify_teacher_batch_and_subject(supabase, teacher_id, teacher_name, batch_id, subject, user_role)

    # 2. Validate filename and extension
    original_filename = file.filename or "dpp_worksheet"
    clean_filename = os.path.basename(original_filename)
    ext = os.path.splitext(clean_filename)[1].lower()

    if ext not in ALLOWED_DPP_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: PDF, DOC, DOCX, PNG, JPG, JPEG, WEBP"
        )

    # 3. Read content & validate file size
    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="File size exceeds the maximum limit of 50 MiB"
        )

    # 4. Validate file content magic bytes
    if not validate_magic_bytes(ext, contents[:32]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File signature/content does not match declared extension '{ext}'"
        )

    # 5. Prepare storage object path
    safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_filename)
    object_name = f"{uuid.uuid4().hex[:12]}_{safe_name}"
    storage_path = f"dpps/{batch_id}/{object_name}"

    content_type = file.content_type or ALLOWED_DPP_EXTENSIONS[ext]
    if content_type == "application/octet-stream":
        content_type = ALLOWED_DPP_EXTENSIONS[ext]

    # 6. Upload file to Supabase Storage
    try:
        supabase.storage.from_("digitute").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": content_type, "upsert": "true"}
        )
    except Exception as upload_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage upload failed: {str(upload_err)}"
        )

    # 7. Insert record in dpps table
    doc_title = title.strip() if title and title.strip() else clean_filename
    payload = {
        "batch_id": batch_id,
        "teacher_id": teacher_id,
        "subject": subject.strip(),
        "title": doc_title,
        "file_url": storage_path
    }

    # Include content_type only after migration has been applied (column exists)
    try:
        supabase.table("dpps").select("content_type").limit(1).execute()
        payload["content_type"] = "FILE"
    except Exception:
        pass  # Column not yet present; migration pending

    try:
        res = supabase.table("dpps").insert(payload).execute()
        record = res.data[0] if res.data else payload
    except Exception as db_err:
        # Rollback: delete uploaded file from storage to avoid orphaned objects
        try:
            supabase.storage.from_("digitute").remove([storage_path])
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save DPP record: {str(db_err)}"
        )

    # 8. Generate signed URL for immediate usage (3600 seconds)
    try:
        signed = supabase.storage.from_("digitute").create_signed_url(storage_path, 3600)
        record["signed_url"] = signed.get("signedURL") or signed.get("signedUrl")
    except Exception:
        record["signed_url"] = None

    return record

@router.post("/dpps/manual", summary="Create Manual Typed DPP (JSONB)")
def create_manual_dpp(
    data: DppManualCreate,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_client()
    teacher_id = current_user.get("id")
    teacher_name = current_user.get("full_name", "")
    user_role = current_user.get("role", "TEACHER")

    # 1. Authorize teacher for batch and exact subject
    verify_teacher_batch_and_subject(supabase, teacher_id, teacher_name, data.batch_id, data.subject, user_role)

    # 2. Validate questions payload: must be non-empty dict or list
    if not isinstance(data.questions, (dict, list)) or len(data.questions) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Questions must be a non-empty JSON object or array"
        )

    title = data.title.strip() if data.title and data.title.strip() else f"Manual DPP — {data.subject.strip()}"
    payload = {
        "batch_id": data.batch_id,
        "teacher_id": teacher_id,
        "subject": data.subject.strip(),
        "title": title,
        "content_type": "MANUAL",
        "file_url": None,
        "questions": data.questions
    }

    try:
        res = supabase.table("dpps").insert(payload).execute()
        record = res.data[0] if res.data else payload
        record["signed_url"] = None
        return record
    except Exception as db_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save manual DPP: {str(db_err)}"
        )

@router.get("/dpps", summary="List DPPs Uploaded by Teacher")
def list_my_dpps(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        user_role = current_user.get("role")

        query = supabase.table("dpps").select("*, batches(name)")
        if user_role != "ADMIN":
            query = query.eq("teacher_id", teacher_id)

        res = query.order("created_at", desc=True).execute()
        dpps = res.data or []

        # Generate signed URLs (3600 seconds expiration)
        for item in dpps:
            file_path = item.get("file_url")
            if file_path:
                try:
                    signed = supabase.storage.from_("digitute").create_signed_url(file_path, 3600)
                    item["signed_url"] = signed.get("signedURL") or signed.get("signedUrl")
                except Exception:
                    item["signed_url"] = None
        return dpps
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dpps/{dpp_id}/access-url", summary="Get Fresh Signed URL for DPP")
def get_dpp_access_url(dpp_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        user_role = current_user.get("role")

        res = supabase.table("dpps").select("*").eq("id", dpp_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="DPP not found")

        dpp = res.data[0]
        if user_role != "ADMIN" and dpp.get("teacher_id") != teacher_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this DPP")

        file_path = dpp.get("file_url")
        if not file_path or dpp.get("content_type") == "MANUAL":
            raise HTTPException(status_code=400, detail="No file path associated with this DPP")

        signed = supabase.storage.from_("digitute").create_signed_url(file_path, 3600)
        signed_url = signed.get("signedURL") or signed.get("signedUrl")
        return {"signed_url": signed_url, "expires_in": 3600}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/dpps/{dpp_id}", summary="Delete DPP")
def delete_dpp(dpp_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        user_role = current_user.get("role")

        res = supabase.table("dpps").select("*").eq("id", dpp_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="DPP not found")

        dpp = res.data[0]
        if user_role != "ADMIN" and dpp.get("teacher_id") != teacher_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this DPP")

        file_path = dpp.get("file_url")

        supabase.table("dpps").delete().eq("id", dpp_id).execute()

        if file_path:
            try:
                supabase.storage.from_("digitute").remove([file_path])
            except Exception:
                pass

        return {"message": "DPP deleted successfully", "id": dpp_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# 5. DOUBTS & QUESTION RESOLUTION
# ==============================================================================
@router.get("/doubts", summary="List Student Doubts in Assigned Batches")
def list_student_doubts(
    batch_id: Optional[str] = None,
    subject: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        teacher_name = (current_user.get("full_name") or "").strip().lower()
        role = current_user.get("role")

        # 1. Authorization: Retrieve assigned batches & subjects if not admin
        assigned_pairs = set()  # (batch_id, subject_name_lower)
        assigned_batch_ids = set()

        if role != "ADMIN":
            all_batches_res = supabase.table("batches").select("id, name, subjects").eq("is_active", True).execute()
            for b in all_batches_res.data or []:
                b_id = b.get("id")
                for s in b.get("subjects") or []:
                    s_name = (s.get("name") or "").strip().lower()
                    s_tid = s.get("teacher_id")
                    s_tname = (s.get("teacher") or "").strip().lower()
                    if s_tid == teacher_id or (s_tname and s_tname == teacher_name):
                        assigned_pairs.add((b_id, s_name))
                        assigned_batch_ids.add(b_id)

            if not assigned_pairs:
                return []

            # If specific batch requested, verify teacher is assigned
            if batch_id:
                if batch_id not in assigned_batch_ids:
                    raise HTTPException(
                        status_code=403,
                        detail="You are not authorized to view doubts for this batch."
                    )
                if subject:
                    subj_lower = subject.strip().lower()
                    if (batch_id, subj_lower) not in assigned_pairs:
                        raise HTTPException(
                            status_code=403,
                            detail=f"You are not authorized to view doubts for subject '{subject}' in this batch."
                        )

        # 2. Build Query
        query = supabase.table("doubts").select(
            "*, student:users!doubts_student_id_fkey(id, full_name, email, avatar_url), resolved_by_user:users!doubts_resolved_by_fkey(id, full_name, email), batches(id, name)"
        )

        if batch_id:
            query = query.eq("batch_id", batch_id)
        elif role != "ADMIN":
            query = query.in_("batch_id", list(assigned_batch_ids))

        if subject:
            query = query.ilike("subject", subject.strip())

        if status:
            query = query.eq("status", status.upper())

        res = query.order("created_at", desc=True).execute()
        records = res.data or []

        # Additional filter for non-admin if neither batch nor subject was specified
        if role != "ADMIN" and (not batch_id or not subject):
            records = [
                r for r in records
                if (r.get("batch_id"), (r.get("subject") or "").strip().lower()) in assigned_pairs
            ]

        # 3. Generate signed URLs for attachments (7-day validity)
        for item in records:
            q_file = item.get("question_file_url")
            if q_file:
                if q_file.startswith("http://") or q_file.startswith("https://"):
                    item["question_file_signed_url"] = q_file
                else:
                    try:
                        signed = supabase.storage.from_("digitute").create_signed_url(q_file, 86400 * 7)
                        item["question_file_signed_url"] = signed.get("signedURL") or signed.get("signedUrl")
                    except Exception:
                        item["question_file_signed_url"] = None

            r_file = item.get("reply_file_url")
            if r_file:
                if r_file.startswith("http://") or r_file.startswith("https://"):
                    item["reply_file_signed_url"] = r_file
                else:
                    try:
                        signed = supabase.storage.from_("digitute").create_signed_url(r_file, 86400 * 7)
                        item["reply_file_signed_url"] = signed.get("signedURL") or signed.get("signedUrl")
                    except Exception:
                        item["reply_file_signed_url"] = None

        return records
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/doubts/resolve", summary="Submit Teacher Solution or Mark Offline Solve")
def resolve_doubt(resolve: DoubtResolve, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        teacher_name = current_user.get("full_name", "")
        role = current_user.get("role", "TEACHER")

        # 1. Fetch doubt to verify authorization
        d_res = supabase.table("doubts").select("*").eq("id", resolve.doubt_id).execute()
        if not d_res.data:
            raise HTTPException(status_code=404, detail="Doubt record not found.")

        doubt = d_res.data[0]
        batch_id = doubt.get("batch_id")
        subject = doubt.get("subject")

        # 2. Enforce teacher authorization for this batch & subject
        verify_teacher_batch_and_subject(supabase, teacher_id, teacher_name, batch_id, subject, role)

        # 3. Formulate update payload
        req_status = (resolve.status or "RESOLVED").upper()
        if req_status not in ("RESOLVED", "OFFLINE_PENDING", "OPEN"):
            raise HTTPException(status_code=400, detail="Invalid status. Must be 'RESOLVED', 'OFFLINE_PENDING', or 'OPEN'.")

        resolved_by = resolve.resolved_by or teacher_id

        if req_status == "RESOLVED":
            payload = {
                "status": "RESOLVED",
                "resolved_by": resolved_by,
                "reply_text": resolve.reply_text,
                "resolved_at": datetime.now(timezone.utc).isoformat()
            }
            if resolve.reply_file_url is not None:
                payload["reply_file_url"] = resolve.reply_file_url
        elif req_status == "OFFLINE_PENDING":
            payload = {
                "status": "OFFLINE_PENDING",
                "resolved_by": resolved_by,
                "reply_text": resolve.reply_text or "Marked for discussion in classroom session."
            }
        else:  # OPEN
            payload = {
                "status": "OPEN",
                "resolved_by": None,
                "resolved_at": None,
                "reply_text": None,
                "reply_file_url": None
            }

        res = supabase.table("doubts").update(payload).eq("id", resolve.doubt_id).execute()
        updated_doubt = res.data[0] if res.data else payload
        return {"message": f"Doubt updated to {req_status} successfully", "doubt": updated_doubt}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/doubts/{doubt_id}/access-url", summary="Get Fresh Signed URL for Doubt Attachment")
def get_doubt_attachment_access_url(
    doubt_id: str,
    target: str = "question",
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        d_res = supabase.table("doubts").select("id, question_file_url, reply_file_url").eq("id", doubt_id).execute()
        if not d_res.data:
            raise HTTPException(status_code=404, detail="Doubt record not found.")

        doubt = d_res.data[0]
        file_path = doubt.get("question_file_url") if target == "question" else doubt.get("reply_file_url")
        if not file_path:
            raise HTTPException(status_code=404, detail=f"No {target} file attachment found for this doubt.")

        if file_path.startswith("http://") or file_path.startswith("https://"):
            return {"signed_url": file_path}

        signed = supabase.storage.from_("digitute").create_signed_url(file_path, 86400 * 7)
        signed_url = signed.get("signedURL") or signed.get("signedUrl")
        return {"signed_url": signed_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/doubts/upload-attachment", summary="Upload Teacher Doubt Solution Attachment")
async def upload_teacher_doubt_attachment(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")

        original_filename = file.filename or "solution_file"
        clean_filename = os.path.basename(original_filename)
        ext = os.path.splitext(clean_filename)[1].lower()

        if ext not in ALLOWED_DPP_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file extension '{ext}'. Allowed: PNG, JPG, JPEG, WEBP, PDF, DOC, DOCX"
            )

        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if len(contents) > 15 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds 15 MiB limit.")

        if not validate_magic_bytes(ext, contents[:32]):
            raise HTTPException(status_code=400, detail=f"File signature does not match declared extension '{ext}'.")

        safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_filename)
        object_name = f"{uuid.uuid4().hex[:12]}_{safe_name}"
        storage_path = f"doubts/teacher/{teacher_id}/{object_name}"

        content_type = file.content_type or ALLOWED_DPP_EXTENSIONS.get(ext, "application/octet-stream")

        supabase.storage.from_("digitute").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": content_type, "upsert": "true"}
        )

        signed = supabase.storage.from_("digitute").create_signed_url(storage_path, 3600)
        signed_url = signed.get("signedURL") or signed.get("signedUrl")

        return {
            "file_url": storage_path,
            "signed_url": signed_url,
            "filename": clean_filename
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Attachment upload failed: {str(e)}")


# ==============================================================================
# 5. SYLLABUS & CHAPTER PROGRESS MANAGEMENT
# ==============================================================================
@router.get("/syllabus", summary="Get Syllabus and Chapter Progress for Batch & Subject")
def get_syllabus(
    subject: str,
    batch_name: Optional[str] = None,
    batch_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        query = supabase.table("batches").select("id, name, subjects")
        if batch_id:
            query = query.eq("id", batch_id)
        elif batch_name:
            query = query.ilike("name", batch_name.strip())
        else:
            raise HTTPException(status_code=400, detail="batch_id or batch_name required")
            
        res = query.execute()
        batches = res.data or []
        
        target_subject = subject.strip().lower()
        
        if batches:
            batch = batches[0]
            subjects = batch.get("subjects") or []
            for s in subjects:
                if isinstance(s, dict):
                    s_name = (s.get("name") or "").strip().lower()
                    chapters = s.get("chapters") or []
                    display_name = s.get("name") or subject
                elif isinstance(s, str):
                    s_name = s.strip().lower()
                    chapters = []
                    display_name = s
                else:
                    continue

                if s_name == target_subject:
                    formatted_chapters = []
                    for idx, ch in enumerate(chapters):
                        if isinstance(ch, dict):
                            formatted_chapters.append({
                                "id": ch.get("id") or f"ch-{idx+1}",
                                "num": ch.get("num") or idx + 1,
                                "title": ch.get("title") or ch.get("name") or f"Chapter {idx+1}",
                                "completed": bool(ch.get("completed") or ch.get("status") == "COMPLETED")
                            })
                        elif isinstance(ch, str):
                            formatted_chapters.append({
                                "id": f"ch-{idx+1}",
                                "num": idx + 1,
                                "title": ch,
                                "completed": False
                            })
                    completed_count = sum(1 for c in formatted_chapters if c["completed"])
                    total_count = len(formatted_chapters)
                    pct = round((completed_count / total_count) * 100) if total_count > 0 else 0
                    return {
                        "batch_id": batch.get("id"),
                        "batch_name": batch.get("name"),
                        "subject": display_name,
                        "chapters": formatted_chapters,
                        "total": total_count,
                        "completed": completed_count,
                        "pct": pct
                    }
        
        return {
            "batch_id": batch_id,
            "batch_name": batch_name,
            "subject": subject,
            "chapters": [],
            "total": 0,
            "completed": 0,
            "pct": 0
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/syllabus", summary="Save or Update Syllabus Chapters in Database")
def save_syllabus(
    req: SyllabusSaveRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        batch_name = (req.batch_name or "").strip()
        subject_name = (req.subject or "").strip()
        
        query = supabase.table("batches").select("*")
        if req.batch_id:
            query = query.eq("id", req.batch_id)
        elif batch_name:
            query = query.ilike("name", batch_name)
        else:
            raise HTTPException(status_code=400, detail="batch_id or batch_name required")
            
        res = query.execute()
        batches = res.data or []
        
        formatted_chapters = []
        for idx, ch in enumerate(req.chapters):
            formatted_chapters.append({
                "id": ch.get("id") or f"ch-{idx+1}",
                "num": ch.get("num") or idx + 1,
                "title": ch.get("title") or ch.get("name") or f"Chapter {idx+1}",
                "completed": bool(ch.get("completed"))
            })
            
        completed_count = sum(1 for c in formatted_chapters if c["completed"])
        total_count = len(formatted_chapters)
        pct = round((completed_count / total_count) * 100) if total_count > 0 else 0
        teacher_id = current_user.get("id")

        if batches:
            batch = batches[0]
            subjects = batch.get("subjects") or []
            found = False
            for idx, s in enumerate(subjects):
                if isinstance(s, dict) and (s.get("name") or "").strip().lower() == subject_name.lower():
                    # Preserve existing completed status for chapters already saved as completed in DB
                    existing_completed = set()
                    for old_ch in (s.get("chapters") or []):
                        if isinstance(old_ch, dict) and (old_ch.get("completed") or old_ch.get("status") == "COMPLETED"):
                            if old_ch.get("id"):
                                existing_completed.add(str(old_ch.get("id")))
                            if old_ch.get("num"):
                                existing_completed.add(str(old_ch.get("num")))

                    for ch in formatted_chapters:
                        ch_id_str = str(ch.get("id"))
                        ch_num_str = str(ch.get("num"))
                        if ch_id_str in existing_completed or ch_num_str in existing_completed:
                            ch["completed"] = True

                    s["chapters"] = formatted_chapters
                    found = True
                    break
                elif isinstance(s, str) and s.strip().lower() == subject_name.lower():
                    subjects[idx] = {
                        "name": s,
                        "teacher_id": teacher_id,
                        "share_percent": 30.0,
                        "chapters": formatted_chapters
                    }
                    found = True
                    break

            if not found:
                subjects.append({
                    "name": subject_name,
                    "teacher_id": teacher_id,
                    "share_percent": 30.0,
                    "chapters": formatted_chapters
                })
            supabase.table("batches").update({
                "subjects": subjects,
                "updated_at": "now()"
            }).eq("id", batch["id"]).execute()
            batch_id = batch["id"]
            batch_name = batch.get("name", batch_name)
        else:
            # Upsert/Create batch in database so it is persistent in PostgreSQL
            new_batch = {
                "name": batch_name or "New Batch",
                "fee_type": "MONTHLY",
                "fee_amount": 0.00,
                "is_active": True,
                "subjects": [
                    {
                        "name": subject_name,
                        "teacher_id": teacher_id,
                        "share_percent": 30.0,
                        "chapters": formatted_chapters
                    }
                ]
            }
            insert_res = supabase.table("batches").insert(new_batch).execute()
            batch_id = insert_res.data[0]["id"] if insert_res.data else None

        return {
            "message": "Syllabus saved successfully",
            "batch_id": batch_id,
            "batch_name": batch_name,
            "subject": subject_name,
            "chapters": formatted_chapters,
            "total": total_count,
            "completed": completed_count,
            "pct": pct
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/syllabus/toggle-chapter", summary="Toggle Single Chapter Completion in Database")
def toggle_chapter(
    req: SyllabusToggleChapterRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        batch_name = (req.batch_name or "").strip()
        subject_name = req.subject.strip()
        
        query = supabase.table("batches").select("*")
        if req.batch_id:
            query = query.eq("id", req.batch_id)
        elif batch_name:
            query = query.ilike("name", batch_name)
        else:
            raise HTTPException(status_code=400, detail="batch_id or batch_name required")
            
        res = query.execute()
        batches = res.data or []
        
        if not batches:
            raise HTTPException(status_code=404, detail="Batch not found")
            
        batch = batches[0]
        subjects = batch.get("subjects") or []
        target_subject = None
        for s in subjects:
            if isinstance(s, dict) and (s.get("name") or "").strip().lower() == subject_name.lower():
                target_subject = s
                break
                
        if not target_subject:
            raise HTTPException(status_code=404, detail=f"Subject '{subject_name}' not found in batch")
            
        chapters = target_subject.get("chapters") or []
        target_ch = None
        for ch in chapters:
            if isinstance(ch, dict) and (str(ch.get("id")) == str(req.chapter_id) or str(ch.get("num")) == str(req.chapter_id)):
                if ch.get("completed") and not req.completed:
                    raise HTTPException(status_code=400, detail="Completed chapters cannot be unmarked as incomplete")
                ch["completed"] = req.completed
                ch["status"] = "COMPLETED" if req.completed else "IN_PROGRESS"
                target_ch = ch
                break
                
        if not target_ch:
            raise HTTPException(status_code=404, detail=f"Chapter '{req.chapter_id}' not found")
            
        supabase.table("batches").update({
            "subjects": subjects,
            "updated_at": "now()"
        }).eq("id", batch["id"]).execute()
        
        comp = sum(1 for c in chapters if isinstance(c, dict) and (c.get("completed") or c.get("status") == "COMPLETED"))
        tot = len(chapters)
        pct = round((comp / tot) * 100) if tot > 0 else 0
        
        return {
            "message": "Chapter updated successfully",
            "batch_id": batch["id"],
            "batch_name": batch.get("name"),
            "subject": subject_name,
            "chapter": target_ch,
            "completed": comp,
            "total": tot,
            "pct": pct,
            "chapters": chapters
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# 10. EXAMS & EVALUATION ENDPOINTS (schema.sql Table 11)
# ==============================================================================
@router.get("/exams", summary="List Exams for Teacher or Batch")
def list_teacher_exams(
    batch_id: Optional[str] = None,
    subject: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        user_role = current_user.get("role")

        query = supabase.table("exams").select("*, batches(name)").order("exam_date", desc=True)
        if user_role != "ADMIN":
            query = query.eq("created_by", teacher_id)

        if batch_id:
            query = query.eq("batch_id", batch_id)
        if subject:
            query = query.ilike("subject", subject.strip())

        res = query.execute()
        return res.data or []
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/exams", summary="Create Exam and Save Evaluation Results")
def create_teacher_exam(
    payload: ExamCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")

        if payload.total_marks <= 0:
            raise HTTPException(status_code=400, detail="Total marks must be greater than 0")

        if payload.passing_marks is not None:
            if payload.passing_marks < 0 or payload.passing_marks > payload.total_marks:
                raise HTTPException(status_code=400, detail="Passing marks must be between 0 and total marks")

        # Format results JSONB: strictly [{ "student_id": "uuid", "marks_obtained": 92.00 }]
        formatted_results = []
        for r in (payload.results or []):
            formatted_results.append({
                "student_id": r.student_id,
                "marks_obtained": float(r.marks_obtained) if r.marks_obtained is not None else None
            })

        exam_date_str = str(payload.exam_date) if payload.exam_date else datetime.now().date().isoformat()
        
        insert_data = {
            "batch_id": payload.batch_id,
            "created_by": teacher_id,
            "subject": payload.subject.strip(),
            "title": payload.title.strip(),
            "syllabus": payload.syllabus.strip() if payload.syllabus else None,
            "exam_date": exam_date_str,
            "start_time": payload.start_time or None,
            "end_time": payload.end_time or None,
            "duration_minutes": payload.duration_minutes or None,
            "total_marks": payload.total_marks,
            "passing_marks": payload.passing_marks,
            "status": payload.status or "completed",
            "is_published": bool(payload.is_published),
            "results_published": bool(payload.results_published),
            "results_published_at": datetime.now(timezone.utc).isoformat() if payload.results_published else None,
            "results": formatted_results
        }

        res = supabase.table("exams").insert(insert_data).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to save exam record in database")

        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/exams/{exam_id}", summary="Update Exam Record or Evaluation Results")
def update_teacher_exam(
    exam_id: str,
    payload: ExamUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        user_role = current_user.get("role")

        existing = supabase.table("exams").select("*").eq("id", exam_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Exam not found")

        ex = existing.data[0]
        if user_role != "ADMIN" and ex.get("created_by") != teacher_id:
            raise HTTPException(status_code=403, detail="Not authorized to edit this exam")

        update_data = {}
        if payload.title is not None:
            update_data["title"] = payload.title.strip()
        if payload.syllabus is not None:
            update_data["syllabus"] = payload.syllabus.strip()
        if payload.exam_date is not None:
            update_data["exam_date"] = str(payload.exam_date)
        if payload.start_time is not None:
            update_data["start_time"] = payload.start_time
        if payload.end_time is not None:
            update_data["end_time"] = payload.end_time
        if payload.duration_minutes is not None:
            update_data["duration_minutes"] = payload.duration_minutes
        if payload.total_marks is not None:
            update_data["total_marks"] = payload.total_marks
        if payload.passing_marks is not None:
            update_data["passing_marks"] = payload.passing_marks
        if payload.status is not None:
            update_data["status"] = payload.status
        if payload.is_published is not None:
            update_data["is_published"] = payload.is_published
        if payload.results_published is not None:
            update_data["results_published"] = payload.results_published
            if payload.results_published and not ex.get("results_published_at"):
                update_data["results_published_at"] = datetime.now(timezone.utc).isoformat()
        if payload.results is not None:
            update_data["results"] = [
                {"student_id": r.student_id, "marks_obtained": float(r.marks_obtained) if r.marks_obtained is not None else None}
                for r in payload.results
            ]

        update_data["updated_at"] = "now()"

        res = supabase.table("exams").update(update_data).eq("id", exam_id).execute()
        return res.data[0] if res.data else {"message": "Updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/exams/{exam_id}", summary="Delete Exam Record")
def delete_teacher_exam(
    exam_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        user_role = current_user.get("role")

        existing = supabase.table("exams").select("*").eq("id", exam_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Exam not found")

        ex = existing.data[0]
        if user_role != "ADMIN" and ex.get("created_by") != teacher_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this exam")

        supabase.table("exams").delete().eq("id", exam_id).execute()
        return {"message": "Exam deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 11. NOTICE BOARD ENDPOINTS (schema.sql Table 12)
# ==============================================================================
def get_teacher_assigned_batch_ids(supabase, teacher_id: str, teacher_name: str) -> set[str]:
    assigned = set()
    t_name_lower = (teacher_name or "").strip().lower()

    # 1. Batches where this teacher is assigned in subjects
    batches_res = supabase.table("batches").select("id, subjects").eq("is_active", True).execute()
    for b in (batches_res.data or []):
        for s in (b.get("subjects") or []):
            s_t_id = s.get("teacher_id")
            s_t_name = (s.get("teacher") or "").strip().lower()
            if s_t_id == teacher_id or (s_t_name and s_t_name == t_name_lower):
                assigned.add(b["id"])
                break

    # 2. Batches where this teacher has recurring routines
    routines_res = supabase.table("class_routines").select("batch_id").eq("teacher_id", teacher_id).eq("is_active", True).execute()
    for r in (routines_res.data or []):
        if r.get("batch_id"):
            assigned.add(r["batch_id"])

    return assigned

@router.post("/notices", summary="Publish Notice to Assigned Batches")
def create_teacher_notice(
    data: TeacherNoticeCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        teacher_name = current_user.get("full_name", "")
        role = current_user.get("role")

        title = data.title.strip()
        body = data.body.strip()
        batch_ids = data.batch_ids

        if not title:
            raise HTTPException(status_code=400, detail="Notice title cannot be empty.")
        if not body:
            raise HTTPException(status_code=400, detail="Notice body cannot be empty.")
        if not batch_ids:
            raise HTTPException(status_code=400, detail="At least one target batch must be selected.")

        # Backend Authorization: Enforce that teacher can ONLY send to their assigned batches
        if role != "ADMIN":
            assigned_ids = get_teacher_assigned_batch_ids(supabase, teacher_id, teacher_name)
            unauthorized_batches = [b for b in batch_ids if b not in assigned_ids]
            if unauthorized_batches:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Authorization failed: You are not assigned to batch(es): {unauthorized_batches}. You can only publish notices to your own assigned batches."
                )

        payload = {
            "title": title,
            "body": body,
            "created_by": teacher_id,
            "target_audience": "BATCH",
            "batch_ids": batch_ids,
            "is_active": True
        }

        res = supabase.table("notices").insert(payload).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to save notice to database.")

        new_notice = res.data[0]

        # Enrich with batch names
        batches_res = supabase.table("batches").select("id, name").in_("id", batch_ids).execute()
        batch_map = {b["id"]: b["name"] for b in (batches_res.data or [])}
        new_notice["batch_names"] = [batch_map.get(b_id, "Batch") for b_id in batch_ids]
        new_notice["sender_name"] = teacher_name
        new_notice["sender_role"] = role
        new_notice["is_mine"] = True

        return new_notice
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notices", summary="List Notices for Teacher Board")
def list_teacher_notices(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")

        # Fetch active notices with creator profile
        res = supabase.table("notices").select(
            "*, users(id, full_name, role, avatar_url)"
        ).eq("is_active", True).order("created_at", desc=True).execute()

        notices = res.data or []

        # Batches map for name lookup
        b_res = supabase.table("batches").select("id, name").execute()
        batch_map = {b["id"]: b["name"] for b in (b_res.data or [])}

        # Teacher sees:
        # 1. All teacher-published notices (target_audience == 'BATCH')
        # 2. Admin-published notices intended for teachers (target_audience IN ('TEACHERS_ONLY', 'ALL'))
        filtered = []
        for n in notices:
            aud = n.get("target_audience")
            u = n.get("users") or {}
            u_role = u.get("role") or ""

            # Only show if teacher notice OR admin notice for teachers
            if aud == "BATCH" or aud in ("TEACHERS_ONLY", "ALL"):
                b_ids = n.get("batch_ids") or []
                filtered.append({
                    "id": n.get("id"),
                    "title": n.get("title"),
                    "body": n.get("body"),
                    "target_audience": aud,
                    "batch_ids": b_ids,
                    "batch_names": [batch_map.get(bid, "Batch") for bid in b_ids if bid in batch_map],
                    "sender_id": n.get("created_by"),
                    "sender_name": u.get("full_name") or ("Admin" if u_role == "ADMIN" else "Teacher"),
                    "sender_role": u_role or ("ADMIN" if aud != "BATCH" else "TEACHER"),
                    "sender_avatar": u.get("avatar_url"),
                    "created_at": n.get("created_at"),
                    "is_mine": (str(n.get("created_by")) == str(teacher_id))
                })

        return filtered
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/notices/{notice_id}", summary="Delete Teacher's Own Notice")
def delete_teacher_notice(notice_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        role = current_user.get("role")

        existing = supabase.table("notices").select("*").eq("id", notice_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Notice not found.")

        n = existing.data[0]
        # Only creator or Admin can delete
        if role != "ADMIN" and str(n.get("created_by")) != str(teacher_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete notices that you created."
            )

        # Soft delete
        supabase.table("notices").update({"is_active": False}).eq("id", notice_id).execute()
        return {"message": "Notice deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))





# ==============================================================================
# TEACHER PROFILE & SETTINGS MANAGEMENT (Avatar, Email, Phone)
# ==============================================================================
@router.post("/avatar", summary="Upload & Update Teacher Profile Avatar")
async def upload_teacher_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")

        ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
        if file.content_type and file.content_type.lower() not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only JPG, JPEG, PNG, or WebP images are allowed."
            )

        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded image is empty."
            )

        storage_path = f"avatars/{teacher_id}/avatar.webp"
        content_type = file.content_type or "image/webp"

        supabase.storage.from_("digitute").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": content_type, "upsert": "true"}
        )

        signed_res = supabase.storage.from_("digitute").create_signed_url(storage_path, 86400 * 365)
        avatar_url = signed_res.get("signedURL") or signed_res.get("signedUrl")

        if not avatar_url:
            raise HTTPException(status_code=500, detail="Failed to generate secure URL for avatar.")

        db_res = supabase.table("users").update({
            "avatar_url": avatar_url
        }).eq("id", teacher_id).execute()

        if not db_res.data:
            try:
                supabase.storage.from_("digitute").remove([storage_path])
            except Exception:
                pass
            raise HTTPException(status_code=500, detail="Failed to update teacher profile record.")

        return {
            "success": True,
            "avatar_url": avatar_url,
            "storage_path": storage_path,
            "message": "Profile picture updated successfully!"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/avatar", summary="Remove Teacher Profile Avatar")
def remove_teacher_avatar(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        storage_path = f"avatars/{teacher_id}/avatar.webp"

        try:
            supabase.storage.from_("digitute").remove([storage_path])
        except Exception:
            pass

        db_res = supabase.table("users").update({
            "avatar_url": None
        }).eq("id", teacher_id).execute()

        return {
            "success": True,
            "avatar_url": None,
            "message": "Profile picture removed successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/email", summary="Update Teacher Email Address")
def update_teacher_email(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")

        new_email = (payload.get("email") or "").strip().lower()

        if not new_email:
            raise HTTPException(status_code=400, detail="New email is required.")

        email_regex = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        if not re.match(email_regex, new_email):
            raise HTTPException(status_code=400, detail="Invalid email format. Please provide a valid address.")

        current_email = (current_user.get("email") or "").strip().lower()
        if new_email == current_email:
            raise HTTPException(status_code=400, detail="New email is identical to your current email.")

        dup_check = supabase.table("users").select("id").ilike("email", new_email).neq("id", teacher_id).execute()
        if dup_check.data and len(dup_check.data) > 0:
            raise HTTPException(status_code=409, detail="This email address is already in use by another account.")

        db_res = supabase.table("users").update({
            "email": new_email
        }).eq("id", teacher_id).execute()

        if not db_res.data:
            raise HTTPException(status_code=500, detail="Failed to update email in database.")

        return {
            "success": True,
            "email": new_email,
            "message": "Email address updated successfully!"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/phone", summary="Update Teacher Mobile / Phone Number")
def update_teacher_phone(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")

        new_phone = (payload.get("phone") or "").strip()

        if not new_phone:
            raise HTTPException(status_code=400, detail="Mobile number is required.")

        digits = re.sub(r"[^0-9]", "", new_phone)
        if len(digits) < 10:
            raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number.")

        current_phone = (current_user.get("phone") or "").strip()
        current_digits = re.sub(r"[^0-9]", "", current_phone)
        if digits == current_digits:
            raise HTTPException(status_code=400, detail="New mobile number is identical to your current number.")

        formatted_phone = f"+91 {digits[-10:]}" if len(digits) == 10 else new_phone

        db_res = supabase.table("users").update({
            "phone": formatted_phone
        }).eq("id", teacher_id).execute()

        if not db_res.data:
            raise HTTPException(status_code=500, detail="Failed to update mobile number in database.")

        return {
            "success": True,
            "phone": formatted_phone,
            "message": "Mobile number updated successfully!"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile", summary="Get Current Teacher Profile")
def get_teacher_profile(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        res = supabase.table("users").select("id, full_name, email, phone, avatar_url, role, specialization, created_at").eq("id", teacher_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return current_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================

@router.get("/student-dues", summary="Get Due Invoices for Students in Teacher's Batches")
def get_teacher_student_dues(
    batch_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Returns invoices (pending, paid, or all) for enrolled students in the logged-in teacher's batches.
    """
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")

        # 1. Find batches assigned to this teacher
        assigned_batch_ids = []
        if current_user.get("role") == "ADMIN":
            b_res = supabase.table("batches").select("id").execute()
            assigned_batch_ids = [b["id"] for b in (b_res.data or [])]
        else:
            # Query routines or batch subjects
            routines = supabase.table("class_routines").select("batch_id").eq("teacher_id", teacher_id).execute()
            routine_batch_ids = [r["batch_id"] for r in (routines.data or []) if r.get("batch_id")]

            # Also check batches table JSON subjects
            all_batches = supabase.table("batches").select("id, subjects").execute()
            subject_batch_ids = []
            for b in (all_batches.data or []):
                for s in (b.get("subjects") or []):
                    s_tid = s.get("teacherId") or s.get("teacher_id")
                    s_tname = (s.get("teacher") or s.get("teacher_name") or s.get("teacherName") or "").strip().lower()
                    teacher_name = (current_user.get("full_name") or "").strip().lower()
                    if s_tid == teacher_id or (s_tname and s_tname == teacher_name):
                        subject_batch_ids.append(b["id"])

            assigned_batch_ids = list(set(routine_batch_ids + subject_batch_ids))

        if not assigned_batch_ids:
            return {"batches": [], "invoices": []}

        # If filtered by specific batch_id
        target_batches = [batch_id] if batch_id and batch_id in assigned_batch_ids else assigned_batch_ids

        # 2. Fetch invoices for these batches with student and payments info
        inv_query = supabase.table("invoices").select(
            "*, batches(id, name), users!invoices_student_id_fkey(id, full_name, phone, email, guardian_name, guardian_phone), payments(*)"
        ).in_("batch_id", target_batches).order("created_at", desc=True)

        if status and status.upper() != "ALL":
            inv_query = inv_query.eq("status", status.upper())

        inv_res = inv_query.execute()
        raw_invoices = inv_res.data or []

        enriched = []
        for inv in raw_invoices:
            student = inv.get("users") or {}
            batch = inv.get("batches") or {}
            pmts = inv.get("payments") or []

            # Check if there is a payment under verification
            under_verification_pmt = next((p for p in pmts if p.get("status") == "UNDER_VERIFICATION"), None)
            rejected_pmt = next((p for p in pmts if p.get("status") == "FAILED"), None)

            net_due = max(0.0, float(inv.get("payable_amount") or 0.0) - float(inv.get("amount_paid") or 0.0))

            enriched.append({
                "id": inv["id"],
                "invoice_number": inv.get("invoice_number"),
                "invoice_type": inv.get("invoice_type"),
                "billing_month": inv.get("billing_month"),
                "billing_year": inv.get("billing_year"),
                "payable_amount": float(inv.get("payable_amount") or 0.0),
                "amount_paid": float(inv.get("amount_paid") or 0.0),
                "net_due": net_due,
                "status": inv.get("status"),
                "batch_id": inv.get("batch_id"),
                "batch_name": batch.get("name") or "Course Batch",
                "student_id": inv.get("student_id"),
                "student_name": student.get("full_name") or "Student",
                "student_phone": student.get("phone") or "",
                "guardian_phone": student.get("guardian_phone") or "",
                "is_under_verification": bool(under_verification_pmt),
                "under_verification_amount": float(under_verification_pmt.get("amount") or 0.0) if under_verification_pmt else None,
                "has_rejected_payment": bool(rejected_pmt),
                "rejected_reason": rejected_pmt.get("rejection_reason") if rejected_pmt else None
            })

        # Fetch batch summary list for filter dropdown including fee_type
        batches_res = supabase.table("batches").select("id, name, fee_type").in_("id", assigned_batch_ids).execute()

        return {
            "batches": batches_res.data or [],
            "invoices": enriched
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collect-cash", summary="Teacher Collects Student Cash & Submits for Admin Verification")
def teacher_collect_cash(
    req: TeacherCollectCashRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")

        # 1. Fetch target invoice
        inv_res = supabase.table("invoices").select("*, payments(*)").eq("id", req.invoice_id).execute()
        if not inv_res.data:
            raise HTTPException(status_code=404, detail="Invoice not found.")

        inv = inv_res.data[0]
        if inv.get("status") == "PAID":
            raise HTTPException(status_code=400, detail="Invoice is already fully paid.")

        # 2. Check if a cash payment is already under verification
        pmts = inv.get("payments") or []
        pending_verif = any(p.get("status") == "UNDER_VERIFICATION" for p in pmts)
        if pending_verif:
            raise HTTPException(
                status_code=400,
                detail="A cash payment for this invoice is already submitted and awaiting Admin clearance."
            )

        # 3. Insert new payment row in payments table
        payment_payload = {
            "invoice_id": req.invoice_id,
            "student_id": inv["student_id"],
            "amount": float(req.amount),
            "payment_mode": "CASH",
            "status": "UNDER_VERIFICATION",
            "collected_by": teacher_id,
            "rejection_reason": None,
            "paid_at": None
        }

        insert_res = supabase.table("payments").insert(payment_payload).execute()
        created_payment = insert_res.data[0] if insert_res.data else payment_payload

        return {
            "message": "Cash collection recorded successfully. Forwarded to Admin verification queue.",
            "payment": created_payment
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cash-handover-ledger", summary="Get Cash Collection & Handover History for Logged-In Teacher")
def get_teacher_cash_ledger(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")

        # Query all payments collected by this teacher
        pmt_res = supabase.table("payments").select(
            "*, invoices(id, invoice_number, billing_month, billing_year, invoice_type, payable_amount), users!payments_student_id_fkey(id, full_name, phone, batches(name))"
        ).eq("collected_by", teacher_id).order("created_at", desc=True).execute()

        raw_pmts = pmt_res.data or []

        records = []
        pending_total = 0.0
        cleared_total = 0.0
        rejected_count = 0

        for p in raw_pmts:
            inv = p.get("invoices") or {}
            student = p.get("users") or {}
            batch = student.get("batches") or {}
            amt = float(p.get("amount") or 0.0)
            st = p.get("status")

            if st == "UNDER_VERIFICATION":
                pending_total += amt
            elif st == "SUCCESS":
                cleared_total += amt
            elif st == "FAILED":
                rejected_count += 1

            records.append({
                "id": p.get("id"),
                "amount": amt,
                "status": st,
                "payment_mode": p.get("payment_mode") or "CASH",
                "invoice_id": p.get("invoice_id"),
                "invoice_number": inv.get("invoice_number") or "N/A",
                "billing_month": inv.get("billing_month"),
                "billing_year": inv.get("billing_year"),
                "student_name": student.get("full_name") or "Student",
                "student_phone": student.get("phone") or "",
                "batch_name": batch.get("name") or "Batch",
                "created_at": p.get("created_at"),
                "paid_at": p.get("paid_at"),
                "rejection_reason": p.get("rejection_reason")
            })

        return {
            "summary": {
                "pending_handover_amount": pending_total,
                "pending_handover_count": sum(1 for r in records if r["status"] == "UNDER_VERIFICATION"),
                "cleared_amount": cleared_total,
                "cleared_count": sum(1 for r in records if r["status"] == "SUCCESS"),
                "rejected_count": rejected_count,
                "total_collected": pending_total + cleared_total
            },
            "records": records
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/earnings", summary="Get Faculty Distributed Earnings & Share Ledger")
def get_teacher_earnings(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        teacher_name = (current_user.get("full_name") or "").strip().lower()

        # Query all records from distributions table
        dist_res = supabase.table("distributions").select("*").order("created_at", desc=True).execute()
        all_dists = dist_res.data or []

        teacher_records = []
        total_earnings = 0.0
        current_month_earnings = 0.0

        today = date.today()
        current_month = today.month
        current_year = today.year

        for d in all_dists:
            t_dist_list = d.get("teachers_distribution") or []
            # Find entry for this teacher by teacher_id or teacher_name
            entry = next((
                t for t in t_dist_list
                if t.get("teacher_id") == teacher_id
                or (t.get("teacher_name") and t.get("teacher_name").strip().lower() == teacher_name)
            ), None)

            if entry:
                payout = float(entry.get("payout_amount") or 0.0)
                total_earnings += payout

                b_month = d.get("billing_month")
                b_year = d.get("billing_year")
                is_this_month = (b_month == current_month and b_year == current_year)
                if is_this_month:
                    current_month_earnings += payout

                teacher_records.append({
                    "id": d["id"],
                    "distribution_id": d["id"],
                    "batch_id": d.get("batch_id"),
                    "batch_name": d.get("batch_name") or "Course Batch",
                    "subject": entry.get("subject") or "Subject",
                    "distribution_type": d.get("distribution_type") or "MONTHLY",
                    "billing_month": b_month,
                    "billing_year": b_year,
                    "share_percent": float(entry.get("share_percent") or 0.0),
                    "batch_total_collected": float(d.get("total_collected") or 0.0),
                    "payout_amount": payout,
                    "distributed_at": d.get("created_at")
                })

        # Count active batches this teacher is mapped to
        b_res = supabase.table("batches").select("id, name, subjects").eq("is_active", True).execute()
        active_batches = []
        for b in (b_res.data or []):
            for s in (b.get("subjects") or []):
                s_tid = s.get("teacherId") or s.get("teacher_id")
                s_tname = (s.get("teacher") or s.get("teacher_name") or "").strip().lower()
                if s_tid == teacher_id or (s_tname and s_tname == teacher_name):
                    active_batches.append(b["id"])
                    break

        return {
            "summary": {
                "total_earnings": round(total_earnings, 2),
                "current_month_earnings": round(current_month_earnings, 2),
                "active_batches_count": len(set(active_batches)),
                "distributions_count": len(teacher_records)
            },
            "records": teacher_records
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/batches", summary="Get Batches Assigned to Teacher")
def get_teacher_batches(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        teacher_name = (current_user.get("full_name") or "").strip().lower()

        b_res = supabase.table("batches").select("id, name, fee_type, subjects").eq("is_active", True).execute()
        batches = b_res.data or []

        if current_user.get("role") == "ADMIN":
            return batches

        assigned = []
        for b in batches:
            is_assigned = False
            for s in (b.get("subjects") or []):
                s_tid = s.get("teacherId") or s.get("teacher_id")
                s_tname = (s.get("teacher") or s.get("teacher_name") or "").strip().lower()
                if s_tid == teacher_id or (s_tname and s_tname == teacher_name):
                    is_assigned = True
                    break
            if is_assigned:
                assigned.append(b)
        return assigned
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/distribution-preview", summary="Get Distribution Preview & Earnings for Teacher")
def get_teacher_distribution_preview(
    batch_id: str,
    billing_month: Optional[int] = None,
    billing_year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        teacher_name = (current_user.get("full_name") or "").strip().lower()

        today = date.today()
        m = int(billing_month) if billing_month else today.month
        y = int(billing_year) if billing_year else today.year

        # 1. Fetch batch
        b_res = supabase.table("batches").select("*").eq("id", batch_id).execute()
        if not b_res.data:
            raise HTTPException(status_code=404, detail="Batch not found")
        batch = b_res.data[0]
        batch_name = batch.get("name") or "Batch"

        # 2. Query collected fees based on updated_at in the selected month & year
        start_date = f"{y:04d}-{m:02d}-01T00:00:00"
        if m == 12:
            end_date = f"{y + 1:04d}-01-01T00:00:00"
        else:
            end_date = f"{y:04d}-{m + 1:02d}-01T00:00:00"

        inv_q = supabase.table("invoices").select("payable_amount, amount_paid, status, updated_at")\
            .eq("batch_id", batch_id)\
            .gte("updated_at", start_date)\
            .lt("updated_at", end_date)
        
        inv_res = inv_q.execute()
        invoices = inv_res.data or []
        total_collected = sum(float(inv.get("amount_paid") or 0.0) for inv in invoices)

        # 3. Check distributions table
        try:
            dist_q = supabase.table("distributions").select("*").eq("batch_id", batch_id)\
                .eq("distribution_month", m).eq("distribution_year", y)
            dist_res = dist_q.execute()
        except Exception:
            dist_q = supabase.table("distributions").select("*").eq("batch_id", batch_id)\
                .eq("billing_month", m).eq("billing_year", y)
            dist_res = dist_q.execute()
        existing = dist_res.data[0] if (dist_res.data and len(dist_res.data) > 0) else None
        already_distributed = bool(existing)

        # 4. Teachers distribution list
        if already_distributed and existing.get("teachers_distribution"):
            teachers_distribution = existing.get("teachers_distribution") or []
            total_distributed = float(existing.get("total_distributed") or 0.0)
            distributed_at = existing.get("created_at")
        else:
            # Calculated preview
            subjects = batch.get("subjects") or []
            t_res = supabase.table("users").select("id, full_name").eq("role", "TEACHER").execute()
            teacher_name_map = {u["id"]: u["full_name"] for u in (t_res.data or []) if u.get("id")}
            name_to_id = {u["full_name"].strip().lower(): u["id"] for u in (t_res.data or []) if u.get("full_name")}

            teachers_distribution = []
            total_distributed = 0.0
            distributed_at = None

            for s in subjects:
                t_id = s.get("teacher_id") or s.get("teacherId") or ""
                t_name = s.get("teacher_name") or s.get("teacher") or teacher_name_map.get(t_id)
                if not t_id and t_name and t_name.strip().lower() in name_to_id:
                    t_id = name_to_id[t_name.strip().lower()]
                if not t_name and t_id in teacher_name_map:
                    t_name = teacher_name_map[t_id]
                if not t_name:
                    t_name = f"Faculty ({s.get('name')})" if s.get("name") else "Faculty"

                raw_share = s.get("share_percent") if s.get("share_percent") is not None else s.get("sharePercent")
                try:
                    share_pct = float(raw_share) if raw_share is not None else 0.0
                except (ValueError, TypeError):
                    share_pct = 0.0

                payout_amt = round(total_collected * (share_pct / 100.0), 2)

                teachers_distribution.append({
                    "teacher_id": t_id,
                    "teacher_name": t_name,
                    "subject": s.get("name") or "Subject",
                    "share_percent": share_pct,
                    "payout_amount": payout_amt
                })

        # 5. Calculate My Earnings for logged-in teacher
        my_entry = next((
            t for t in teachers_distribution
            if t.get("teacher_id") == teacher_id
            or (t.get("teacher_name") and t.get("teacher_name").strip().lower() == teacher_name)
        ), None)

        if already_distributed:
            my_earnings = float(my_entry.get("payout_amount") or 0.0) if my_entry else 0.0
            actual_total_distributed = total_distributed
        else:
            my_earnings = 0.0
            actual_total_distributed = 0.0

        return {
            "batch_id": batch_id,
            "batch_name": batch_name,
            "billing_month": m,
            "billing_year": y,
            "total_collected": total_collected,
            "invoices_count": len(invoices),
            "total_distributed": actual_total_distributed,
            "my_earnings": my_earnings,
            "already_distributed": already_distributed,
            "distributed_at": distributed_at,
            "teachers_distribution": teachers_distribution,
            "current_teacher_id": teacher_id
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


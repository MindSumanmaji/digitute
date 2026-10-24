from fastapi import APIRouter, HTTPException, Depends
from app.db import get_supabase_client
from app.core.dependencies import get_current_user, require_roles
from app.models import DoubtCreate
from typing import Optional, Any
from datetime import datetime, date, time

router = APIRouter(
    prefix="/api/student",
    tags=["Student Portal API"],
    dependencies=[Depends(require_roles(["STUDENT", "ADMIN"]))]
)

# ==============================================================================
# 1. STUDENT PROFILE
# ==============================================================================
@router.get("/my-profile", summary="Get Logged-In Student Profile & Batch")
def get_student_profile(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        
        res = supabase.table("users").select("*, batches(name, fee_amount, fee_type)").eq("id", student_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Student profile not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 2. MASTER CLASS ROUTINE (Weekly Timetable Template)
# ==============================================================================
@router.get("/my-classes", summary="Get Weekly Master Timetable for My Enrolled Batch")
def get_my_classes(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        batch_id = current_user.get("batch_id")
        
        if not batch_id:
            return []
            
        res = supabase.table("class_routines").select(
            "*, users!class_routines_teacher_id_fkey(full_name, specialization)"
        ).eq("batch_id", batch_id).eq("is_active", True).order("day_of_week").order("start_time").execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 3. DATE-WISE CLASS SESSIONS (Live / Concrete Date Calendar Instances)
# ==============================================================================
@router.get("/my-sessions", summary="Get Date-wise Class Sessions for My Batch with Attendance Status")
def get_my_sessions(
    session_date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    month: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        batch_id = current_user.get("batch_id")
        student_id = current_user.get("id")

        if not batch_id:
            return []

        query = supabase.table("class_sessions").select(
            "*, batches(name)"
        ).eq("batch_id", batch_id).neq("status", "CANCELLED")

        if session_date:
            query = query.eq("session_date", session_date)
        if start_date:
            query = query.gte("session_date", start_date)
        if end_date:
            query = query.lte("session_date", end_date)
        if month:
            query = query.gte("session_date", f"{month}-01").lte("session_date", f"{month}-31")

        res = query.order("session_date").order("start_time").execute()
        sessions = res.data or []

        if not sessions:
            return []

        session_ids = [s["id"] for s in sessions]
        teacher_ids = list(set([s["teacher_id"] for s in sessions if s.get("teacher_id")]))

        # Fetch attendance for this student for these sessions
        att_res = supabase.table("attendance").select("session_id, status, marked_at").eq("student_id", student_id).in_("session_id", session_ids).execute()
        att_map = {a["session_id"]: a for a in (att_res.data or [])}

        # Fetch teacher info
        teachers_map = {}
        if teacher_ids:
            t_res = supabase.table("users").select("id, full_name, avatar_url, specialization").in_("id", teacher_ids).execute()
            for t in (t_res.data or []):
                teachers_map[t["id"]] = t

        now = datetime.now()
        today_str = date.today().isoformat()

        enriched = []
        for s in sessions:
            sid = s["id"]
            tid = s.get("teacher_id")
            teacher = teachers_map.get(tid, {})
            att = att_map.get(sid)

            s_date = str(s.get("session_date") or "")
            s_start = str(s.get("start_time") or "")
            s_end = str(s.get("end_time") or "")
            session_status = s.get("status")

            if att:
                student_status = "Attended" if att.get("status") == "PRESENT" else "Absent"
            else:
                if session_status == "COMPLETED":
                    student_status = "Absent"
                elif s_date == today_str:
                    try:
                        start_t = datetime.strptime(s_start[:5], "%H:%M").time()
                        end_t = datetime.strptime(s_end[:5], "%H:%M").time()
                        curr_t = now.time()
                        if start_t <= curr_t <= end_t:
                            student_status = "Live"
                        elif curr_t < start_t:
                            student_status = "Upcoming"
                        else:
                            student_status = "Completed"
                    except Exception:
                        student_status = "Upcoming"
                elif s_date > today_str:
                    student_status = "Upcoming"
                else:
                    student_status = "Completed"

            enriched.append({
                **s,
                "teacher_name": teacher.get("full_name") or "Faculty",
                "teacher_avatar": teacher.get("avatar_url"),
                "teacher_specialization": teacher.get("specialization"),
                "student_attendance_status": student_status,
                "attendance_marked_at": att.get("marked_at") if att else None
            })

        return enriched
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 4. ATTENDANCE ANALYSIS & SUBJECT BREAKDOWN
# ==============================================================================
@router.get("/my-attendance", summary="Get Attendance History, Subject Breakdowns & Calendar Mappings")
def get_my_attendance(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        
        res = supabase.table("attendance").select(
            "*, class_sessions(id, session_date, start_time, end_time, subject, topic_covered, status, teacher_id)"
        ).eq("student_id", student_id).order("marked_at", desc=True).execute()
        
        records = res.data or []
        total_classes = len(records)
        present_classes = sum(1 for r in records if r.get("status") == "PRESENT")
        absent_classes = total_classes - present_classes
        percent = round((present_classes / total_classes * 100), 1) if total_classes > 0 else 0.0

        # Resolve teachers for class sessions
        teacher_ids = list(set([
            (r.get("class_sessions") or {}).get("teacher_id")
            for r in records
            if (r.get("class_sessions") or {}).get("teacher_id")
        ]))
        teachers_map = {}
        if teacher_ids:
            t_res = supabase.table("users").select("id, full_name, avatar_url").in_("id", teacher_ids).execute()
            for t in (t_res.data or []):
                teachers_map[t["id"]] = t.get("full_name") or "Faculty"
        
        # Monthly calculation (current month or latest active session month)
        current_month_prefix = date.today().strftime("%Y-%m")
        month_name = date.today().strftime("%B %Y")
        month_records = [
            r for r in records 
            if r.get("class_sessions") and str(r["class_sessions"].get("session_date", "")).startswith(current_month_prefix)
        ]

        if not month_records and records:
            latest_session_date = str((records[0].get("class_sessions") or {}).get("session_date", ""))
            if len(latest_session_date) >= 7:
                session_prefix = latest_session_date[:7]
                matched = [
                    r for r in records 
                    if r.get("class_sessions") and str(r["class_sessions"].get("session_date", "")).startswith(session_prefix)
                ]
                if matched:
                    month_records = matched
                    try:
                        dt = datetime.strptime(session_prefix, "%Y-%m")
                        month_name = dt.strftime("%B %Y")
                    except Exception:
                        pass

        month_total = len(month_records)
        month_present = sum(1 for r in month_records if r.get("status") == "PRESENT")
        month_absent = month_total - month_present
        month_percent = round((month_present / month_total * 100), 1) if month_total > 0 else 0.0

        # Helper to format 24h time to 12h AM/PM
        def format_time_12h(time_val):
            if not time_val:
                return ""
            try:
                parts = str(time_val).split(":")
                h = int(parts[0])
                m = parts[1]
                ampm = "PM" if h >= 12 else "AM"
                h = h % 12 or 12
                return f"{h:02d}:{m} {ampm}"
            except Exception:
                return str(time_val)

        # Subject-wise calculation & Calendar dates mapping
        subject_map = {}
        calendar_dates = {}

        for r in records:
            cs = r.get("class_sessions") or {}
            subj = cs.get("subject") or "General"
            status = r.get("status")  # 'PRESENT' or 'ABSENT'
            s_date = cs.get("session_date")
            tid = cs.get("teacher_id")
            teacher_name = teachers_map.get(tid, "Faculty")

            if s_date:
                calendar_dates[str(s_date)] = status

            if subj not in subject_map:
                subject_map[subj] = {
                    "subject": subj,
                    "teacher": teacher_name,
                    "total": 0,
                    "present": 0,
                    "absent": 0,
                    "percentage": 0.0,
                    "records": []
                }
            elif teacher_name != "Faculty":
                subject_map[subj]["teacher"] = teacher_name

            subject_map[subj]["total"] += 1
            if status == "PRESENT":
                subject_map[subj]["present"] += 1
            else:
                subject_map[subj]["absent"] += 1

            start_fmt = format_time_12h(cs.get('start_time'))
            end_fmt = format_time_12h(cs.get('end_time'))
            time_display = f"{start_fmt} - {end_fmt}" if start_fmt and end_fmt else ""

            subject_map[subj]["records"].append({
                "date": s_date,
                "time": time_display,
                "topic": cs.get("topic_covered") or f"{subj} Session",
                "status": "Present" if status == "PRESENT" else "Absent",
                "teacher": teacher_name
            })

        for s_info in subject_map.values():
            if s_info["total"] > 0:
                s_info["percentage"] = round((s_info["present"] / s_info["total"] * 100), 1)
            else:
                s_info["percentage"] = 0.0

        return {
            "total_classes": total_classes,
            "present_classes": present_classes,
            "absent_classes": absent_classes,
            "attendance_percentage": percent,
            "month_summary": {
                "month_name": month_name,
                "total": month_total,
                "attended": month_present,
                "missed": month_absent,
                "rate": month_percent
            },
            "subject_wise": subject_map,
            "calendar_dates": calendar_dates,
            "history": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 5. DASHBOARD AGGREGATED SUMMARY (Single Fast API Call)
# ==============================================================================
@router.get("/dashboard-summary", summary="Get Aggregated Dashboard Data for Logged-In Student")
def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        batch_id = current_user.get("batch_id")
        today_str = date.today().isoformat()
        
        # 1. Today's sessions
        today_sessions = []
        if batch_id:
            s_res = supabase.table("class_sessions").select(
                "*"
            ).eq("batch_id", batch_id).eq("session_date", today_str).neq("status", "CANCELLED").order("start_time").execute()
            sessions = s_res.data or []
            
            if sessions:
                s_ids = [s["id"] for s in sessions]
                t_ids = list(set([s["teacher_id"] for s in sessions if s.get("teacher_id")]))
                
                # Fetch attendance
                a_res = supabase.table("attendance").select("session_id, status").eq("student_id", student_id).in_("session_id", s_ids).execute()
                a_map = {a["session_id"]: a["status"] for a in (a_res.data or [])}
                
                # Fetch teachers
                t_map = {}
                if t_ids:
                    t_info = supabase.table("users").select("id, full_name, avatar_url").in_("id", t_ids).execute()
                    t_map = {u["id"]: u for u in (t_info.data or [])}
                    
                for s in sessions:
                    today_sessions.append({
                        **s,
                        "teacher_name": t_map.get(s.get("teacher_id"), {}).get("full_name") or "Faculty",
                        "attendance_status": a_map.get(s["id"], "Upcoming")
                    })

        # 2. Attendance stats
        att_res = supabase.table("attendance").select("status").eq("student_id", student_id).execute()
        records = att_res.data or []
        total_classes = len(records)
        present_classes = sum(1 for r in records if r.get("status") == "PRESENT")
        percent = round((present_classes / total_classes * 100), 1) if total_classes > 0 else 100.0

        # 3. Pending Fee Due
        inv_res = supabase.table("invoices").select("payable_amount, amount_paid, due_date").eq("student_id", student_id).eq("status", "PENDING").execute()
        total_due = sum(max(0.0, float(i.get("payable_amount", 0)) - float(i.get("amount_paid", 0))) for i in (inv_res.data or []))

        # 4. Upcoming tests
        upcoming_tests_count = 0
        if batch_id:
            e_res = supabase.table("exams").select("id").eq("batch_id", batch_id).gte("exam_date", today_str).execute()
            upcoming_tests_count = len(e_res.data or [])

        return {
            "attendance_percentage": percent,
            "total_classes": total_classes,
            "present_classes": present_classes,
            "today_sessions": today_sessions,
            "total_due": total_due,
            "upcoming_tests_count": upcoming_tests_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 6. TUITION FEES & INVOICES (Table 3 in schema.sql)
# ==============================================================================
@router.get("/my-invoices", summary="Get My Invoices & Outstanding Fee Status")
def get_my_invoices(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        
        res = supabase.table("invoices").select(
            "*, batches(name)"
        ).eq("student_id", student_id).order("due_date", desc=True).execute()
        
        invoices = res.data or []
        total_outstanding = sum(
            max(0.0, float(i.get("payable_amount", 0)) - float(i.get("amount_paid", 0)))
            for i in invoices if i.get("status") == "PENDING"
        )
        
        return {
            "total_outstanding": total_outstanding,
            "invoices": invoices
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 7. PAYMENTS & RECEIPTS LEDGER (Table 4 in schema.sql)
# ==============================================================================
@router.get("/my-payments", summary="Get My Payment Receipts & Transaction Ledger")
def get_my_payments(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        
        res = supabase.table("payments").select(
            "*, invoices(invoice_number, billing_month, base_amount, payable_amount)"
        ).eq("student_id", student_id).order("paid_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 8. STUDY MATERIALS (Table 8 in schema.sql)
# ==============================================================================
@router.get("/study-materials", summary="Get Study Material PDFs for My Batch")
def get_my_materials(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        batch_id = current_user.get("batch_id")
        
        if not batch_id:
            return []
            
        res = supabase.table("study_materials").select(
            "*, users!study_materials_teacher_id_fkey(full_name)"
        ).eq("batch_id", batch_id).order("created_at", desc=True).execute()

        materials = res.data or []
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

@router.get("/study-materials/{material_id}/access-url", summary="Get Fresh Signed URL for Student Material")
def get_student_material_access_url(material_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_batch_id = current_user.get("batch_id")
        user_role = current_user.get("role")

        res = supabase.table("study_materials").select("*").eq("id", material_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Study material not found")

        material = res.data[0]
        if user_role != "ADMIN" and material.get("batch_id") != student_batch_id:
            raise HTTPException(status_code=403, detail="You are not authorized to access study materials for another batch")

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

# ==============================================================================
# 9. ASSIGNMENTS & DPPS (Table 9 in schema.sql)
# ==============================================================================
@router.get("/dpps", summary="Get Daily Practice Problems (DPPs / Assignments) for My Batch")
def get_my_dpps(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        batch_id = current_user.get("batch_id")
        
        if not batch_id:
            return []
            
        res = supabase.table("dpps").select(
            "*, users!dpps_teacher_id_fkey(full_name)"
        ).eq("batch_id", batch_id).order("created_at", desc=True).execute()

        dpps = res.data or []
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

# ==============================================================================
# 10. DOUBTS & FORUM (Table 10 in schema.sql)
# ==============================================================================
@router.post("/doubts", summary="Ask a Doubt or Submit Question")
def ask_doubt(doubt: DoubtCreate, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        batch_id = doubt.batch_id or current_user.get("batch_id")
        
        payload = doubt.model_dump()
        payload["student_id"] = student_id
        payload["batch_id"] = batch_id
        payload["status"] = "OPEN"
        
        res = supabase.table("doubts").insert(payload).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/doubts", summary="Get My Submitted Doubts & Solutions")
def get_my_doubts(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        
        res = supabase.table("doubts").select(
            "*, users!doubts_resolved_by_fkey(full_name)"
        ).eq("student_id", student_id).order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 11. EXAM RESULTS & LEADERBOARD (Table 11 in schema.sql)
# ==============================================================================
@router.get("/my-exams", summary="Get My Exam Marks, Rank & Feedback")
def get_my_exams(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        batch_id = current_user.get("batch_id")
        
        if not batch_id:
            return []
            
        res = supabase.table("exams").select("*").eq("batch_id", batch_id).order("exam_date", desc=True).execute()
        
        my_results = []
        for exam in res.data or []:
            results = exam.get("results") or []
            matched = next((r for r in results if r.get("student_id") == student_id), None)
            if matched:
                my_results.append({
                    "exam_id": exam.get("id"),
                    "title": exam.get("title"),
                    "subject": exam.get("subject"),
                    "exam_date": exam.get("exam_date"),
                    "total_marks": exam.get("total_marks"),
                    "marks_obtained": matched.get("marks_obtained"),
                    "rank": matched.get("rank"),
                    "feedback": matched.get("feedback")
                })
        return my_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/exams/{exam_id}/merit-list", summary="Get Exam Leaderboard & Toppers for Batch")
def get_exam_merit_list(exam_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        
        res = supabase.table("exams").select("*").eq("id", exam_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Exam not found")
            
        exam = res.data[0]
        results = exam.get("results") or []
        
        sorted_results = sorted(results, key=lambda x: (x.get("rank") or 999, -float(x.get("marks_obtained") or 0)))
        
        student_ids = [r["student_id"] for r in sorted_results if r.get("student_id")]
        user_names = {}
        if student_ids:
            u_res = supabase.table("users").select("id, full_name, avatar_url").in_("id", student_ids).execute()
            for u in (u_res.data or []):
                user_names[u["id"]] = u
                
        leaderboard = []
        for r in sorted_results:
            uid = r.get("student_id")
            u_info = user_names.get(uid, {})
            leaderboard.append({
                "student_id": uid,
                "name": u_info.get("full_name") or "Student",
                "avatar_url": u_info.get("avatar_url"),
                "marks_obtained": r.get("marks_obtained"),
                "total_marks": exam.get("total_marks"),
                "rank": r.get("rank"),
                "feedback": r.get("feedback"),
                "is_me": uid == student_id
            })
            
        return {
            "exam_id": exam.get("id"),
            "title": exam.get("title"),
            "subject": exam.get("subject"),
            "exam_date": exam.get("exam_date"),
            "total_marks": exam.get("total_marks"),
            "toppers": leaderboard[:10],
            "full_leaderboard": leaderboard
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException, Depends
from app.db import get_supabase_client
from app.core.dependencies import get_current_user, require_roles
from app.models import DoubtCreate
from typing import Any

router = APIRouter(
    prefix="/api/student",
    tags=["Student Portal API"],
    dependencies=[Depends(require_roles(["STUDENT", "ADMIN"]))]
)

# ==============================================================================
# 1. STUDENT PROFILE & DASHBOARD OVERVIEW
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
# 2. CLASS SCHEDULE & ROUTINE
# ==============================================================================
@router.get("/my-classes", summary="Get Weekly Timetable for My Enrolled Batch")
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
# 3. ATTENDANCE ANALYSIS & HISTORY
# ==============================================================================
@router.get("/my-attendance", summary="Get Attendance History & Percentage")
def get_my_attendance(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        
        res = supabase.table("attendance").select(
            "*, class_sessions(session_date, start_time, end_time, subject, topic_covered)"
        ).eq("student_id", student_id).order("marked_at", desc=True).execute()
        
        records = res.data or []
        total_classes = len(records)
        present_classes = sum(1 for r in records if r.get("status") == "PRESENT")
        percent = round((present_classes / total_classes * 100), 1) if total_classes > 0 else 100.0
        
        return {
            "total_classes": total_classes,
            "present_classes": present_classes,
            "absent_classes": total_classes - present_classes,
            "attendance_percentage": percent,
            "history": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 4. TUITION FEES & INVOICES
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
# 5. STUDY MATERIALS & DPPS
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
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 6. DOUBTS & FORUM
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
# 7. EXAM RESULTS & RANKING
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

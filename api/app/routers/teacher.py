from fastapi import APIRouter, HTTPException, Depends
from app.db import get_supabase_client
from app.core.dependencies import get_current_user, require_roles
from app.models import (
    SessionCreate,
    MarkAttendanceRequest,
    StudyMaterialCreate,
    DoubtResolve
)
from datetime import date
from typing import Any

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
        
        res = supabase.table("class_routines").select(
            "*, batches(name)"
        ).eq("teacher_id", teacher_id).eq("is_active", True).order("day_of_week").order("start_time").execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-batches", summary="Get Batches Assigned to Logged-In Teacher")
def get_my_batches(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        teacher_name = current_user.get("full_name", "").lower()
        
        # Batches where this teacher is mapped in subjects
        all_batches = supabase.table("batches").select("*").eq("is_active", True).execute()
        assigned = []
        
        for b in all_batches.data or []:
            subjects = b.get("subjects") or []
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

# ==============================================================================
# 2. CLASS SESSIONS & ATTENDANCE
# ==============================================================================
@router.get("/sessions/today", summary="Get Today's Sessions for This Teacher")
def get_today_sessions(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        today_str = date.today().isoformat()
        
        res = supabase.table("class_sessions").select(
            "*, batches(name)"
        ).eq("teacher_id", teacher_id).eq("session_date", today_str).order("start_time").execute()
        return res.data or []
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
        
        # Get session's batch_id
        s_res = supabase.table("class_sessions").select("batch_id").eq("id", session_id).execute()
        if not s_res.data:
            raise HTTPException(status_code=404, detail="Class session not found")
            
        batch_id = s_res.data[0].get("batch_id")
        
        # Fetch enrolled students in this batch
        st_res = supabase.table("users").select(
            "id, full_name, email, phone"
        ).eq("role", "STUDENT").eq("batch_id", batch_id).eq("is_active", True).order("full_name").execute()
        
        # Fetch existing marked attendance for this session if any
        att_res = supabase.table("attendance").select("student_id, status").eq("session_id", session_id).execute()
        status_map = {a.get("student_id"): a.get("status") for a in att_res.data or []}
        
        students = []
        for s in st_res.data or []:
            students.append({
                **s,
                "attendance_status": status_map.get(s.get("id"), "PRESENT")
            })
            
        return students
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
        res = supabase.table("attendance").upsert(
            records, on_conflict="session_id, student_id"
        ).execute()
        
        # Update session status to COMPLETED
        supabase.table("class_sessions").update({"status": "COMPLETED"}).eq("id", req.session_id).execute()
        
        return {
            "message": "Attendance marked successfully",
            "marked_count": len(records)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 3. STUDY MATERIALS & DPPS
# ==============================================================================
@router.post("/study-materials", summary="Upload Study Material / PDF for Batch")
def upload_study_material(material: StudyMaterialCreate, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = material.teacher_id or current_user.get("id")
        
        payload = material.model_dump()
        payload["teacher_id"] = teacher_id
        
        res = supabase.table("study_materials").insert(payload).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/study-materials", summary="List Study Materials Uploaded by Teacher")
def list_my_materials(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        teacher_id = current_user.get("id")
        res = supabase.table("study_materials").select("*, batches(name)").eq("teacher_id", teacher_id).order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 4. DOUBTS & QUESTION RESOLUTION
# ==============================================================================
@router.get("/doubts", summary="List Student Doubts in Assigned Batches")
def list_student_doubts(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        res = supabase.table("doubts").select(
            "*, users!doubts_student_id_fkey(full_name, email), batches(name)"
        ).order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/doubts/resolve", summary="Submit Teacher Solution or Mark Offline Solve")
def resolve_doubt(resolve: DoubtResolve, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        resolved_by = resolve.resolved_by or current_user.get("id")
        
        payload = {
            "resolved_by": resolved_by,
            "reply_text": resolve.reply_text,
            "reply_file_url": resolve.reply_file_url,
            "status": "RESOLVED"
        }
        res = supabase.table("doubts").update(payload).eq("id", resolve.doubt_id).execute()
        return {"message": "Doubt resolved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

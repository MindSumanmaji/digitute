from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from app.db import get_supabase_client
from app.core.dependencies import get_current_user, require_roles
from app.models import (
    SessionCreate,
    MarkAttendanceRequest,
    StudyMaterialCreate,
    StudyMaterialResponse,
    DoubtResolve
)
from datetime import date
from typing import Any, Optional
import uuid
import os
import re

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

def validate_magic_bytes(ext: str, header: bytes) -> bool:
    if ext == ".pdf":
        return header.startswith(b"%PDF")
    elif ext == ".doc":
        return header.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
    elif ext == ".docx":
        return header.startswith(b"PK\x03\x04")
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

    batch_res = supabase.table("batches").select("*").eq("id", batch_id).eq("is_active", True).execute()
    if not batch_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found or is inactive")

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

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
from app.db import get_supabase_client
from app.core.dependencies import get_current_user, require_roles
from app.core.config import settings
from app.models import (
    DoubtCreate,
    CreateRazorpayOrderRequest,
    CreateRazorpayOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse
)
from typing import Optional, Any
from datetime import datetime, date, time, timezone
import os
import re
import uuid
import hmac
import hashlib
import razorpay

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
        
        res = supabase.table("users").select("*, batches(id, name, fee_amount, fee_type, subjects)").eq("id", student_id).execute()
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

        # Ensure all batch enrolled subjects are present in subject_map even if no classes held yet
        batch_id = current_user.get("batch_id")
        if batch_id:
            try:
                b_res = supabase.table("batches").select("subjects").eq("id", batch_id).execute()
                if b_res.data and b_res.data[0].get("subjects"):
                    raw_subj = b_res.data[0]["subjects"]
                    enrolled_subjs = raw_subj if isinstance(raw_subj, list) else [s.strip() for s in str(raw_subj).split(",") if s.strip()]
                    for s in enrolled_subjs:
                        if s not in subject_map:
                            subject_map[s] = {
                                "subject": s,
                                "teacher": "Faculty",
                                "total": 0,
                                "present": 0,
                                "absent": 0,
                                "percentage": 0.0,
                                "records": []
                            }
            except Exception:
                pass

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
        inv_res = supabase.table("invoices").select("payable_amount, amount_paid").eq("student_id", student_id).eq("status", "PENDING").execute()
        total_due = sum(max(0.0, float(i.get("payable_amount", 0)) - float(i.get("amount_paid", 0))) for i in (inv_res.data or []))

        # 4. Upcoming tests (Must NOT be completed or cancelled, and results must NOT be published)
        upcoming_tests_count = 0
        avg_score_pct = 0.0
        tests_taken_count = 0
        if batch_id:
            e_res = supabase.table("exams").select("id, status, results_published").eq("batch_id", batch_id).gte("exam_date", today_str).execute()
            upcoming_tests_count = sum(
                1 for ex in (e_res.data or [])
                if str(ex.get("status", "")).lower() not in ["completed", "cancelled"] and not bool(ex.get("results_published"))
            )

            # 5. Live Average Score calculated from published/completed exams for this student
            score_res = supabase.table("exams").select(
                "total_marks, results, results_published, status"
            ).eq("batch_id", batch_id).execute()
            all_exams = score_res.data or []
            evaluated_exams = [
                e for e in all_exams
                if (bool(e.get("results_published")) or (e.get("status") or "").lower() == "completed") and e.get("results")
            ]
            all_percentages = []
            for ex in evaluated_exams:
                t_marks = float(ex.get("total_marks") or 100)
                res_list = ex.get("results") or []
                for r in res_list:
                    if isinstance(r, dict) and str(r.get("student_id")) == str(student_id) and r.get("marks_obtained") is not None:
                        try:
                            marks = float(r.get("marks_obtained"))
                            pct = round((marks / t_marks * 100), 1) if t_marks > 0 else 0.0
                            all_percentages.append(pct)
                        except (ValueError, TypeError):
                            pass
                        break
            if all_percentages:
                avg_score_pct = round(sum(all_percentages) / len(all_percentages), 1)
                tests_taken_count = len(all_percentages)

        return {
            "attendance_percentage": percent,
            "total_classes": total_classes,
            "present_classes": present_classes,
            "today_sessions": today_sessions,
            "total_due": total_due,
            "upcoming_tests_count": upcoming_tests_count,
            "avg_score_percentage": avg_score_pct,
            "tests_taken_count": tests_taken_count
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
        ).eq("student_id", student_id).order("created_at", desc=True).execute()
        
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
# 7. PAYMENTS & TRANSACTIONS (Online Razorpay Gateway + History)
# ==============================================================================
@router.post("/payments/create-order", response_model=CreateRazorpayOrderResponse, summary="Generate Razorpay Order for Due Invoice")
def create_razorpay_order(req: CreateRazorpayOrderRequest, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")

        # 1. Fetch target invoice
        inv_res = supabase.table("invoices").select("*, batches(name)").eq("id", req.invoice_id).execute()
        if not inv_res.data:
            raise HTTPException(status_code=404, detail="Invoice not found.")
        
        inv = inv_res.data[0]

        # 2. Authorization check (only target student or admin)
        if str(inv.get("student_id")) != str(student_id) and current_user.get("role") != "ADMIN":
            raise HTTPException(status_code=403, detail="You are not authorized to pay this invoice.")

        # 3. Status check
        if inv.get("status") == "PAID":
            raise HTTPException(status_code=400, detail="This invoice has already been fully paid and settled.")

        # 4. Calculate Net Due Amount
        payable = float(inv.get("payable_amount") or 0.0)
        already_paid = float(inv.get("amount_paid") or 0.0)
        net_due = max(0.0, round(payable - already_paid, 2))

        if net_due <= 0:
            raise HTTPException(status_code=400, detail="Invoice has zero outstanding balance.")

        # Razorpay accepts amounts in paise (1 INR = 100 paise)
        amount_in_paise = int(round(net_due * 100))

        # 5. Create Order via Razorpay Client (reads latest credentials from .env)
        from dotenv import load_dotenv
        load_dotenv(override=True)
        key_id = os.getenv("RAZORPAY_KEY_ID") or settings.RAZORPAY_KEY_ID
        key_secret = os.getenv("RAZORPAY_KEY_SECRET") or settings.RAZORPAY_KEY_SECRET

        try:
            rzp_client = razorpay.Client(auth=(key_id, key_secret))
            order = rzp_client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": inv.get("invoice_number"),
                "notes": {
                    "invoice_id": str(inv["id"]),
                    "invoice_number": inv.get("invoice_number"),
                    "student_id": str(student_id),
                    "batch_name": inv.get("batches", {}).get("name") or "Course Batch"
                }
            })
            order_id = order.get("id")
            if not order_id:
                raise Exception(f"Razorpay did not return an order ID: {order}")
        except Exception as rzp_err:
            print(f"[Razorpay Order Creation Failed]: {rzp_err}")
            raise HTTPException(status_code=502, detail=f"Razorpay order creation failed: {str(rzp_err)}")

        # 6. Clean up any previous uncompleted INITIATED attempts and log new one
        try:
            supabase.table("payments").delete().eq("invoice_id", inv["id"]).eq("student_id", student_id).eq("status", "INITIATED").execute()
        except Exception:
            pass

        payment_payload = {
            "invoice_id": inv["id"],
            "student_id": student_id,
            "amount": net_due,
            "payment_mode": "RAZORPAY",
            "status": "INITIATED",
            "razorpay_order_id": order_id
        }
        supabase.table("payments").insert(payment_payload).execute()

        return {
            "order_id": order_id,
            "amount": amount_in_paise,
            "amount_in_rupees": net_due,
            "currency": "INR",
            "key_id": key_id,
            "invoice_id": inv["id"],
            "invoice_number": inv.get("invoice_number") or "",
            "student_name": current_user.get("full_name") or "Student",
            "student_email": current_user.get("email"),
            "student_phone": current_user.get("phone")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payments/verify", response_model=VerifyPaymentResponse, summary="Verify Razorpay Payment Signature & Settle Invoice")
def verify_razorpay_payment(req: VerifyPaymentRequest, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        key_secret = settings.RAZORPAY_KEY_SECRET or "placeholder_secret"

        # 1. Cryptographic HMAC-SHA256 Signature Verification
        if req.razorpay_order_id.startswith("order_mock_"):
            # Mock verified in local development
            is_valid = True
        else:
            try:
                expected_signature = hmac.new(
                    key_secret.encode("utf-8"),
                    f"{req.razorpay_order_id}|{req.razorpay_payment_id}".encode("utf-8"),
                    hashlib.sha256
                ).hexdigest()
                is_valid = hmac.compare_digest(expected_signature, req.razorpay_signature)
            except Exception:
                is_valid = False

        if not is_valid:
            # Mark payment record as FAILED for audit integrity
            supabase.table("payments").update({
                "status": "FAILED",
                "razorpay_payment_id": req.razorpay_payment_id,
                "razorpay_signature": req.razorpay_signature
            }).eq("razorpay_order_id", req.razorpay_order_id).execute()

            raise HTTPException(
                status_code=400,
                detail="Payment signature verification failed. Possible tampering detected."
            )

        # 2. Signature is Valid -> Update payments table
        now_iso = datetime.now(timezone.utc).isoformat()
        pmt_res = supabase.table("payments").update({
            "status": "SUCCESS",
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_signature": req.razorpay_signature,
            "paid_at": now_iso
        }).eq("razorpay_order_id", req.razorpay_order_id).execute()

        # 3. Settle target invoice -> mark as PAID
        inv_res = supabase.table("invoices").select("*").eq("id", req.invoice_id).execute()
        paid_amt = 0.0
        if inv_res.data:
            inv = inv_res.data[0]
            paid_amt = float(inv.get("payable_amount") or 0.0)
            supabase.table("invoices").update({
                "status": "PAID",
                "amount_paid": paid_amt,
                "updated_at": now_iso
            }).eq("id", req.invoice_id).execute()

        return {
            "success": True,
            "status": "PAID",
            "message": "Payment verified and invoice settled successfully.",
            "invoice_id": req.invoice_id,
            "payment_id": req.razorpay_payment_id,
            "amount_paid": paid_amt
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-payments", summary="Get My Payment Receipts & Transaction Ledger")
def get_my_payments(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        
        res = supabase.table("payments").select(
            "*, invoices(invoice_number, billing_month, billing_year, invoice_type, base_amount, payable_amount)"
        ).eq("student_id", student_id).eq("status", "SUCCESS").order("paid_at", desc=True).execute()
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
@router.post("/doubts/upload-file", summary="Upload attachment for a Doubt (Image or PDF)")
async def upload_doubt_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")

        ALLOWED_DOUBT_EXTS = {
            ".pdf": "application/pdf",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp"
        }

        original_filename = file.filename or "doubt_attachment"
        clean_filename = os.path.basename(original_filename)
        ext = os.path.splitext(clean_filename)[1].lower()

        if ext not in ALLOWED_DOUBT_EXTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF and Image files (.png, .jpg, .jpeg, .webp) are allowed"
            )

        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="File size exceeds maximum limit of 10 MB")

        safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_filename)
        object_name = f"{uuid.uuid4().hex[:12]}_{safe_name}"
        storage_path = f"doubts/{student_id}/{object_name}"

        content_type = file.content_type or ALLOWED_DOUBT_EXTS[ext]

        supabase.storage.from_("digitute").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": content_type, "upsert": "true"}
        )

        signed = supabase.storage.from_("digitute").create_signed_url(storage_path, 86400 * 7)
        signed_url = signed.get("signedURL") or signed.get("signedUrl")

        return {
            "storage_path": storage_path,
            "signed_url": signed_url,
            "filename": clean_filename
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/doubts", summary="Ask a Doubt or Submit Question")
def ask_doubt(doubt: DoubtCreate, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        batch_id = doubt.batch_id or current_user.get("batch_id")

        if not batch_id:
            u_res = supabase.table("users").select("batch_id").eq("id", student_id).execute()
            if u_res.data and u_res.data[0].get("batch_id"):
                batch_id = u_res.data[0].get("batch_id")

        if not batch_id:
            raise HTTPException(status_code=400, detail="Student is not assigned to any batch. Please contact the administrator.")

        if not doubt.question_title or not doubt.question_title.strip():
            q_title = doubt.question_text.strip()[:60] if doubt.question_text else "Student Question"
        else:
            q_title = doubt.question_title.strip()

        if not doubt.question_text or not doubt.question_text.strip():
            raise HTTPException(status_code=400, detail="Please enter your question explanation.")

        payload = {
            "student_id": student_id,
            "batch_id": batch_id,
            "subject": doubt.subject.strip(),
            "question_title": q_title,
            "question_text": doubt.question_text.strip(),
            "question_file_url": doubt.question_file_url,
            "status": "OPEN"
        }

        res = supabase.table("doubts").insert(payload).execute()
        new_doubt = res.data[0] if res.data else payload

        if new_doubt.get("question_file_url"):
            try:
                signed = supabase.storage.from_("digitute").create_signed_url(new_doubt["question_file_url"], 86400 * 7)
                new_doubt["question_file_signed_url"] = signed.get("signedURL") or signed.get("signedUrl")
            except Exception:
                new_doubt["question_file_signed_url"] = None

        return new_doubt
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/doubts", summary="Get My Submitted Doubts & Solutions")
def get_my_doubts(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")

        res = supabase.table("doubts").select(
            "*, resolved_by_user:users!doubts_resolved_by_fkey(full_name, email, avatar_url), batches(name)"
        ).eq("student_id", student_id).order("created_at", desc=True).execute()

        doubts = res.data or []
        for d in doubts:
            q_url = d.get("question_file_url")
            if q_url and not q_url.startswith("http"):
                try:
                    s = supabase.storage.from_("digitute").create_signed_url(q_url, 86400 * 7)
                    d["question_file_signed_url"] = s.get("signedURL") or s.get("signedUrl")
                except Exception:
                    d["question_file_signed_url"] = None
            elif q_url:
                d["question_file_signed_url"] = q_url

            r_url = d.get("reply_file_url")
            if r_url and not r_url.startswith("http"):
                try:
                    s = supabase.storage.from_("digitute").create_signed_url(r_url, 86400 * 7)
                    d["reply_file_signed_url"] = s.get("signedURL") or s.get("signedUrl")
                except Exception:
                    d["reply_file_signed_url"] = None
            elif r_url:
                d["reply_file_signed_url"] = r_url

        return doubts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/doubts/upload-attachment", summary="Upload Student Doubt Attachment")
async def upload_student_doubt_attachment(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")

        original_filename = file.filename or "doubt_file"
        clean_filename = os.path.basename(original_filename)
        ext = os.path.splitext(clean_filename)[1].lower()

        allowed_exts = {
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
        }

        if ext not in allowed_exts:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file extension '{ext}'. Allowed: PNG, JPG, JPEG, WEBP, PDF, DOC, DOCX"
            )

        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if len(contents) > 15 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds 15 MiB limit.")

        safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_filename)
        object_name = f"{uuid.uuid4().hex[:12]}_{safe_name}"
        storage_path = f"doubts/student/{student_id}/{object_name}"

        content_type = file.content_type or allowed_exts.get(ext, "application/octet-stream")

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
# 11. EXAMS & PERFORMANCE (Table 11 in schema.sql)
# ==============================================================================
@router.get("/my-exams", summary="Get Scheduled Upcoming Tests and Evaluated Performance for My Batch")
def get_my_exams(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        batch_id = current_user.get("batch_id")

        if not batch_id:
            u_res = supabase.table("users").select("batch_id").eq("id", student_id).execute()
            if u_res.data and u_res.data[0].get("batch_id"):
                batch_id = u_res.data[0].get("batch_id")

        if not batch_id:
            return {
                "upcoming_tests": [],
                "evaluated_tests": [],
                "performance_by_subject": {},
                "latest_evaluated_test": None
            }

        # 1. Fetch batch details for batch name
        b_res = supabase.table("batches").select("name").eq("id", batch_id).execute()
        batch_name = b_res.data[0].get("name") if b_res.data else "My Batch"

        # 2. Fetch all published exams for this batch
        exams_res = supabase.table("exams").select(
            "id, batch_id, created_by, subject, title, syllabus, exam_date, start_time, end_time, "
            "duration_minutes, total_marks, passing_marks, status, is_published, results_published, "
            "results_published_at, results, created_at, users!exams_created_by_fkey(full_name)"
        ).eq("batch_id", batch_id).order("exam_date", desc=True).execute()

        all_exams = exams_res.data or []

        upcoming_tests = []
        evaluated_tests = []

        subject_colors = {
            "physics": "#10b981",
            "chemistry": "#9333ea",
            "mathematics": "#2563eb",
            "math": "#2563eb",
            "maths": "#2563eb",
            "biology": "#ea580c"
        }

        subject_records = {
            "All Subjects": []
        }

        today_date = date.today()

        for ex in all_exams:
            exam_id = ex.get("id")
            subject = ex.get("subject") or "General"
            title = ex.get("title") or "Center Exam"
            syllabus = ex.get("syllabus") or ""
            exam_date_str = str(ex.get("exam_date")) if ex.get("exam_date") else ""
            total_marks = float(ex.get("total_marks") or 100)
            passing_marks = float(ex.get("passing_marks") or 40)
            status_val = (ex.get("status") or "scheduled").lower()
            is_pub = bool(ex.get("is_published"))
            results_pub = bool(ex.get("results_published"))
            results_list = ex.get("results") or []
            faculty_name = ex.get("users", {}).get("full_name") if isinstance(ex.get("users"), dict) else "Faculty"

            parsed_date = None
            formatted_date = exam_date_str
            day_str = "—"
            month_str = "—"
            short_date = exam_date_str
            try:
                if exam_date_str:
                    parsed_date = datetime.strptime(exam_date_str, "%Y-%m-%d").date()
                    formatted_date = parsed_date.strftime("%d %b %Y")
                    day_str = parsed_date.strftime("%d")
                    month_str = parsed_date.strftime("%b")
                    short_date = parsed_date.strftime("%d %b")
            except Exception:
                pass

            dur_mins = ex.get("duration_minutes")
            if dur_mins:
                dur_str = f"{dur_mins // 60}h {dur_mins % 60}m" if dur_mins >= 60 else f"{dur_mins} mins"
            else:
                dur_str = "2 Hours"

            # Check if this is an upcoming test:
            # 1. Must be published (is_pub == True)
            # 2. Status MUST NOT be 'completed' or 'cancelled'
            # 3. Results MUST NOT be published yet (results_pub == False)
            # 4. Status is explicitly 'scheduled' or date is in the future/today
            is_upcoming = (
                is_pub and
                (not results_pub) and
                (status_val not in ["completed", "cancelled"]) and
                (status_val == "scheduled" or (parsed_date and parsed_date >= today_date))
            )

            if is_upcoming:
                upcoming_tests.append({
                    "id": exam_id,
                    "title": title,
                    "subject": subject,
                    "testName": title,
                    "batch": batch_name,
                    "date": formatted_date,
                    "day": day_str,
                    "month": month_str,
                    "rawDate": exam_date_str,
                    "startTime": ex.get("start_time"),
                    "endTime": ex.get("end_time"),
                    "duration": dur_str,
                    "totalMarks": total_marks,
                    "passingMarks": passing_marks,
                    "syllabus": syllabus,
                    "faculty": faculty_name,
                    "status": status_val
                })

            # Check if this exam is evaluated & published (results_pub is True or status is 'completed' with results)
            if (results_pub or status_val == "completed") and results_list:
                # Rank calculation: sort all evaluated students by marks_obtained descending
                valid_scores = [r for r in results_list if isinstance(r, dict) and r.get("marks_obtained") is not None]
                valid_scores.sort(key=lambda x: float(x.get("marks_obtained", 0)), reverse=True)

                total_evaluated = len(valid_scores)
                student_rank = None
                student_obtained = None

                for rank_idx, record in enumerate(valid_scores, start=1):
                    if str(record.get("student_id")) == str(student_id):
                        student_rank = rank_idx
                        student_obtained = float(record.get("marks_obtained"))
                        break

                if student_obtained is not None:
                    pct = round((student_obtained / total_marks * 100), 1) if total_marks > 0 else 0.0

                    if pct >= 90:
                        grade = "A+"
                        grade_class = "sp-grade-green"
                    elif pct >= 80:
                        grade = "A"
                        grade_class = "sp-grade-green"
                    elif pct >= 70:
                        grade = "B+"
                        grade_class = "sp-grade-blue"
                    elif pct >= 60:
                        grade = "B"
                        grade_class = "sp-grade-blue"
                    elif pct >= 50:
                        grade = "C"
                        grade_class = "sp-grade-amber"
                    elif pct >= 40:
                        grade = "D"
                        grade_class = "sp-grade-amber"
                    else:
                        grade = "F"
                        grade_class = "sp-grade-red"

                    rank_str = f"{student_rank}th of {total_evaluated}" if total_evaluated > 0 else "—"
                    if student_rank == 1:
                        rank_str = f"1st of {total_evaluated}"
                    elif student_rank == 2:
                        rank_str = f"2nd of {total_evaluated}"
                    elif student_rank == 3:
                        rank_str = f"3rd of {total_evaluated}"

                    eval_record = {
                        "id": exam_id,
                        "date": formatted_date,
                        "shortDate": short_date,
                        "rawDate": exam_date_str,
                        "name": title,
                        "subject": subject,
                        "total": total_marks,
                        "obtained": student_obtained,
                        "percentage": f"{pct}%",
                        "score": pct,
                        "grade": grade,
                        "gradeClass": grade_class,
                        "rank": rank_str,
                        "rawRank": student_rank,
                        "totalStudents": total_evaluated,
                        "syllabus": syllabus,
                        "faculty": faculty_name
                    }
                    evaluated_tests.append(eval_record)

                    subj_key = subject.strip()
                    if subj_key not in subject_records:
                        subject_records[subj_key] = []

                    chart_point = {
                        "id": exam_id,
                        "testName": title,
                        "date": short_date,
                        "rawDate": exam_date_str,
                        "score": pct,
                        "marks": f"{student_obtained}/{total_marks}",
                        "subject": subject,
                        "rank": rank_str,
                        "remark": f"Scored {student_obtained}/{total_marks} ({grade}) in {subject}"
                    }
                    subject_records["All Subjects"].append(chart_point)
                    subject_records[subj_key].append(chart_point)

        # Sort upcoming tests chronologically ascending
        upcoming_tests.sort(key=lambda x: x.get("rawDate") or "9999-99-99")

        # Sort evaluated tests chronologically descending
        evaluated_tests.sort(key=lambda x: x.get("rawDate") or "", reverse=True)

        # Sort progression trend points chronologically ascending
        for k in subject_records:
            subject_records[k].sort(key=lambda x: x.get("rawDate") or "")

        progression_data = {}
        standard_subjects = ["All Subjects", "Physics", "Chemistry", "Mathematics", "Biology"]

        for k in subject_records.keys():
            if k not in standard_subjects:
                standard_subjects.append(k)

        for subj in standard_subjects:
            points = subject_records.get(subj) or []
            scores = [p["score"] for p in points]
            avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

            if avg_score >= 90:
                subj_grade = "Grade A+"
            elif avg_score >= 80:
                subj_grade = "Grade A"
            elif avg_score >= 70:
                subj_grade = "Grade B+"
            elif avg_score >= 60:
                subj_grade = "Grade B"
            elif avg_score >= 40:
                subj_grade = "Grade C"
            elif avg_score > 0:
                subj_grade = "Grade D"
            else:
                subj_grade = "—"

            if len(scores) >= 2:
                growth_diff = round(scores[-1] - scores[0], 1)
                if growth_diff > 0:
                    growth_text = f"+{growth_diff}% Overall Growth"
                elif growth_diff < 0:
                    growth_text = f"{growth_diff}% Trend"
                else:
                    growth_text = "Consistent Performance"
            elif len(scores) == 1:
                growth_text = "Initial Baseline Recorded"
            else:
                growth_text = "No records yet"

            color = subject_colors.get(subj.lower(), "#2563eb")

            progression_data[subj] = {
                "subject": subj,
                "color": color,
                "avgScore": f"{avg_score}%" if scores else "0%",
                "grade": subj_grade,
                "growth": growth_text,
                "tests": points
            }

        return {
            "upcoming_tests": upcoming_tests,
            "evaluated_tests": evaluated_tests,
            "performance_by_subject": progression_data,
            "latest_evaluated_test": evaluated_tests[0] if evaluated_tests else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exams/{exam_id}/merit-list", summary="Get Full Batch Merit List and Toppers for an Exam")
def get_exam_merit_list(exam_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        user_batch_id = current_user.get("batch_id")

        ex_res = supabase.table("exams").select(
            "*, batches(name), users!exams_created_by_fkey(full_name)"
        ).eq("id", exam_id).execute()

        if not ex_res.data:
            raise HTTPException(status_code=404, detail="Exam not found")

        exam = ex_res.data[0]
        status_val = (exam.get("status") or "").lower()
        if not exam.get("results_published") and status_val != "completed":
            raise HTTPException(status_code=403, detail="Results and merit list have not been published for this exam yet")

        if user_batch_id and str(exam.get("batch_id")) != str(user_batch_id):
            raise HTTPException(status_code=403, detail="Not authorized to view other batch's exam merit list")

        results_list = exam.get("results") or []
        total_marks = float(exam.get("total_marks") or 100)

        # Extract student IDs to fetch user profiles (name, avatar_url, email)
        student_ids = [r.get("student_id") for r in results_list if isinstance(r, dict) and r.get("student_id")]
        user_map = {}
        if student_ids:
            u_res = supabase.table("users").select("id, full_name, email, avatar_url, phone").in_("id", student_ids).execute()
            for u in (u_res.data or []):
                user_map[str(u.get("id"))] = u

        # Separate evaluated and absent
        evaluated = []
        for r in results_list:
            if not isinstance(r, dict):
                continue
            s_id = str(r.get("student_id"))
            marks_raw = r.get("marks_obtained")
            if marks_raw is not None:
                marks = float(marks_raw)
                pct = round((marks / total_marks * 100), 1) if total_marks > 0 else 0.0
                u_info = user_map.get(s_id, {})
                full_name = u_info.get("full_name") or "Student"
                is_me = (s_id == str(student_id))

                evaluated.append({
                    "student_id": s_id,
                    "name": f"{full_name} (You)" if is_me else full_name,
                    "rawName": full_name,
                    "score": marks,
                    "total": total_marks,
                    "pct": f"{pct}%",
                    "percentageNum": pct,
                    "photo": u_info.get("avatar_url"),
                    "email": u_info.get("email"),
                    "phone": u_info.get("phone"),
                    "isMe": is_me,
                    "initial": full_name[0].upper() if full_name else "S"
                })

        # Sort strictly descending by score
        evaluated.sort(key=lambda x: x["score"], reverse=True)

        # Assign ranks & standings
        palette = [
            {"bg": "#eff6ff", "color": "#2563eb"},
            {"bg": "#ecfdf5", "color": "#059669"},
            {"bg": "#fce7f3", "color": "#db2777"},
            {"bg": "#fef3c7", "color": "#d97706"},
            {"bg": "#f3e8ff", "color": "#9333ea"},
            {"bg": "#e0f2fe", "color": "#0284c7"},
        ]

        merit_list = []
        for idx, st in enumerate(evaluated, start=1):
            color_item = palette[(idx - 1) % len(palette)]
            standing = ""
            if idx == 1:
                standing = "Batch Topper"
            elif idx == 2:
                standing = "Runner Up"
            elif idx == 3:
                standing = "Podium"
            elif idx <= 5:
                standing = "TOP 5 Elite"
            elif idx <= 10:
                standing = "Top 10"
            else:
                standing = ""

            merit_list.append({
                **st,
                "rank": idx,
                "badge": str(idx),
                "standing": standing,
                "bg": color_item["bg"],
                "color": color_item["color"],
                "roll": f"B-{str(st['student_id'])[:4].upper()}"
            })

        return {
            "exam_id": exam_id,
            "title": exam.get("title"),
            "subject": exam.get("subject"),
            "exam_date": str(exam.get("exam_date")),
            "total_marks": total_marks,
            "batch_name": exam.get("batches", {}).get("name") if isinstance(exam.get("batches"), dict) else "Batch",
            "total_students": len(merit_list),
            "merit_list": merit_list
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/peers/{peer_id}/academic-card", summary="Get Live Database Academic Card Metrics for a Peer Student")
def get_peer_academic_card(peer_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        user_batch_id = current_user.get("batch_id")

        # 1. Fetch user profile
        u_res = supabase.table("users").select("id, full_name, email, phone, avatar_url, batch_id, batches(id, name)").eq("id", peer_id).execute()
        if not u_res.data:
            raise HTTPException(status_code=404, detail="Student not found")

        peer = u_res.data[0]
        peer_batch_id = peer.get("batch_id")
        batch_obj = peer.get("batches") or {}
        batch_name = batch_obj.get("name") if isinstance(batch_obj, dict) else "Enrolled Batch"

        # 2. Fetch real attendance for this student
        att_res = supabase.table("attendance").select("status").eq("student_id", peer_id).execute()
        att_records = att_res.data or []
        total_classes = len(att_records)
        present_classes = sum(1 for r in att_records if r.get("status") == "PRESENT")
        attendance_pct = round((present_classes / total_classes * 100), 1) if total_classes > 0 else 0.0

        # 3. Fetch all completed/published exams for this batch
        all_exams = []
        if peer_batch_id:
            e_res = supabase.table("exams").select("id, title, subject, total_marks, results, results_published, status").eq("batch_id", peer_batch_id).execute()
            all_exams = e_res.data or []

        # 4. Calculate tests taken, marks, subject-wise percentage and best score
        evaluated_exams = [
            e for e in all_exams 
            if (bool(e.get("results_published")) or (e.get("status") or "").lower() == "completed") and e.get("results")
        ]

        subject_scores = {}
        total_tests_taken = 0
        all_percentages = []
        best_score_val = 0
        best_score_total = 100
        best_score_test_name = "Exam"

        subject_icons = {
            "physics": "⚛️",
            "chemistry": "🧪",
            "mathematics": "📐",
            "math": "📐",
            "maths": "📐",
            "biology": "🧬"
        }
        subject_colors = {
            "physics": {"color": "#3b82f6", "bg": "#eff6ff"},
            "chemistry": {"color": "#10b981", "bg": "#ecfdf5"},
            "mathematics": {"color": "#8b5cf6", "bg": "#f5f3ff"},
            "math": {"color": "#8b5cf6", "bg": "#f5f3ff"},
            "maths": {"color": "#8b5cf6", "bg": "#f5f3ff"},
            "biology": {"color": "#ea580c", "bg": "#fff7ed"}
        }

        for ex in evaluated_exams:
            subj = ex.get("subject") or "General"
            t_marks = float(ex.get("total_marks") or 100)
            res_list = ex.get("results") or []

            for r in res_list:
                if isinstance(r, dict) and str(r.get("student_id")) == str(peer_id) and r.get("marks_obtained") is not None:
                    marks = float(r.get("marks_obtained"))
                    pct = round((marks / t_marks * 100), 1) if t_marks > 0 else 0.0
                    total_tests_taken += 1
                    all_percentages.append(pct)

                    if pct >= best_score_val:
                        best_score_val = pct
                        best_score_total = int(t_marks)
                        best_score_test_name = ex.get("title") or "Exam"

                    if subj not in subject_scores:
                        subject_scores[subj] = []
                    subject_scores[subj].append(pct)
                    break

        avg_score_pct = round(sum(all_percentages) / len(all_percentages), 1) if all_percentages else 0.0

        # Calculate overall batch rank based on latest evaluated exam results
        student_rank_num = None
        batch_total_students = 0
        student_standing = ""

        for ex in reversed(evaluated_exams):
            res_list = ex.get("results") or []
            if res_list:
                sorted_results = sorted(
                    [r for r in res_list if isinstance(r, dict) and r.get("marks_obtained") is not None],
                    key=lambda r: float(r.get("marks_obtained", 0)),
                    reverse=True
                )
                batch_total_students = len(sorted_results)
                for idx, r in enumerate(sorted_results, 1):
                    if str(r.get("student_id")) == str(peer_id):
                        student_rank_num = idx
                        if idx == 1:
                            student_standing = "Batch Topper"
                        elif idx == 2:
                            student_standing = "Runner Up"
                        elif idx == 3:
                            student_standing = "Podium"
                        elif idx <= 5:
                            student_standing = "TOP 5 Elite"
                        elif idx <= 10:
                            student_standing = "Top 10"
                        break
                if student_rank_num is not None:
                    break

        if batch_total_students == 0 and peer_batch_id:
            batch_users = supabase.table("users").select("id", count="exact").eq("batch_id", peer_batch_id).eq("role", "STUDENT").execute()
            batch_total_students = batch_users.count or len(batch_users.data or []) or 20

        # Build real subject performance metrics
        subjects_payload = []
        for s_name, pcts in subject_scores.items():
            s_avg = round(sum(pcts) / len(pcts)) if pcts else 0
            cfg_color = subject_colors.get(s_name.lower(), {"color": "#2563eb", "bg": "#eff6ff"})
            subjects_payload.append({
                "id": f"sub_{s_name.lower()}",
                "name": s_name,
                "pct": s_avg,
                "color": cfg_color["color"],
                "bg": cfg_color["bg"],
                "icon": subject_icons.get(s_name.lower(), "📄")
            })

        # Add core batch subjects if not tested yet so profile card displays clean subject analysis
        standard_core_subjects = ["Physics", "Chemistry", "Mathematics"]
        existing_subjs = {s["name"].lower() for s in subjects_payload}
        for std_s in standard_core_subjects:
            if std_s.lower() not in existing_subjs:
                cfg_color = subject_colors.get(std_s.lower(), {"color": "#2563eb", "bg": "#eff6ff"})
                subjects_payload.append({
                    "id": f"sub_{std_s.lower()}",
                    "name": std_s,
                    "pct": 0,
                    "color": cfg_color["color"],
                    "bg": cfg_color["bg"],
                    "icon": subject_icons.get(std_s.lower(), "📄")
                })

        clean_name = peer.get("full_name") or "Student"

        return {
            "id": peer_id,
            "name": clean_name,
            "handle": "@" + clean_name.lower().replace(" ", ""),
            "roll": f"B-{peer_id[:4].upper()}",
            "photo": peer.get("avatar_url"),
            "email": peer.get("email"),
            "phone": peer.get("phone"),
            "batch": batch_name,
            "className": "Class XII",
            "stream": "Science",
            "session": "2026 - 2027",
            "attendancePct": attendance_pct,
            "attendanceDetail": f"{present_classes} / {total_classes} classes",
            "avgScorePct": avg_score_pct,
            "avgScoreDetail": f"Across {total_tests_taken} test{'s' if total_tests_taken != 1 else ''}" if total_tests_taken > 0 else "No evaluated tests",
            "testsTaken": total_tests_taken,
            "totalTests": len(all_exams),
            "bestScore": f"{round(best_score_val * best_score_total / 100)}/{best_score_total}" if total_tests_taken > 0 else "—",
            "bestScoreTest": best_score_test_name if total_tests_taken > 0 else "—",
            "rank": f"#{student_rank_num} / {batch_total_students}" if student_rank_num else "—",
            "rankNum": student_rank_num,
            "batchTotal": batch_total_students,
            "standing": student_standing,
            "rankTrend": student_standing or "Active Student",
            "badge": "Gold" if student_rank_num == 1 else "Silver" if (student_rank_num and student_rank_num <= 3) else "Bronze",
            "subjects": subjects_payload
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/academic-card", summary="Get Live Database Academic Card Metrics for Current Student")
def get_current_user_academic_card(current_user: dict = Depends(get_current_user)):
    return get_peer_academic_card(current_user["id"], current_user)


# ==============================================================================
# 18. STUDENT PROFILE AVATAR MANAGEMENT (Upload & Remove)
# ==============================================================================
@router.post("/avatar", summary="Upload & Update Student Profile Avatar")
async def upload_student_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")

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

        storage_path = f"avatars/{student_id}/avatar.webp"
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
        }).eq("id", student_id).execute()

        if not db_res.data:
            try:
                supabase.storage.from_("digitute").remove([storage_path])
            except Exception:
                pass
            raise HTTPException(status_code=500, detail="Failed to update student profile record.")

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


@router.delete("/avatar", summary="Remove Student Profile Avatar")
def remove_student_avatar(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")
        storage_path = f"avatars/{student_id}/avatar.webp"

        try:
            supabase.storage.from_("digitute").remove([storage_path])
        except Exception:
            pass

        db_res = supabase.table("users").update({
            "avatar_url": None
        }).eq("id", student_id).execute()

        return {
            "success": True,
            "avatar_url": None,
            "message": "Profile picture removed successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/email", summary="Update Student Email Address")
def update_student_email(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")

        new_email = (payload.get("email") or "").strip().lower()

        if not new_email:
            raise HTTPException(status_code=400, detail="New email is required.")

        email_regex = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        if not re.match(email_regex, new_email):
            raise HTTPException(status_code=400, detail="Invalid email format. Please provide a valid address.")

        current_email = (current_user.get("email") or "").strip().lower()
        if new_email == current_email:
            raise HTTPException(status_code=400, detail="New email is identical to your current email.")

        dup_check = supabase.table("users").select("id").ilike("email", new_email).neq("id", student_id).execute()
        if dup_check.data and len(dup_check.data) > 0:
            raise HTTPException(status_code=409, detail="This email address is already in use by another account.")

        db_res = supabase.table("users").update({
            "email": new_email
        }).eq("id", student_id).execute()

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


@router.put("/phone", summary="Update Student Mobile / Phone Number")
def update_student_phone(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")

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
        }).eq("id", student_id).execute()

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


@router.put("/password", summary="Update Student Account Password")
def update_student_password(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        student_id = current_user.get("id")

        new_password = (payload.get("new_password") or "").strip()
        confirm_password = (payload.get("confirm_password") or "").strip()

        if not new_password:
            raise HTTPException(status_code=400, detail="New password is required.")

        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

        if not confirm_password:
            raise HTTPException(status_code=400, detail="Please confirm your new password.")

        if new_password != confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match. Please re-enter carefully.")

        try:
            supabase.auth.admin.update_user_by_id(
                student_id,
                {"password": new_password}
            )
        except Exception as auth_err:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update login password: {str(auth_err)}"
            )

        try:
            pwd_hash = hashlib.sha256(new_password.encode("utf-8")).hexdigest()
            supabase.table("users").update({
                "password_hash": pwd_hash,
                "updated_at": "now()"
            }).eq("id", student_id).execute()
        except Exception:
            pass

        return {
            "success": True,
            "message": "Password updated successfully! Use your new password on next login."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# 19. STUDENT ANNOUNCEMENTS & NOTICES (schema.sql Table 12)
# ==============================================================================
@router.get("/notices", summary="Get Notices & Announcements for Student")
def get_student_notices(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        batch_id = current_user.get("batch_id")

        # 1. Fetch institute-wide Admin notices intended for students
        admin_res = supabase.table("notices").select(
            "*, users(id, full_name, role, avatar_url)"
        ).eq("is_active", True).in_("target_audience", ["STUDENTS_ONLY", "ALL"]).execute()

        admin_notices = admin_res.data or []

        # 2. Fetch Teacher notices specifically targeted to student's batch
        batch_notices = []
        batch_name = "My Batch"
        if batch_id:
            b_info = supabase.table("batches").select("name").eq("id", batch_id).execute()
            if b_info.data:
                batch_name = b_info.data[0].get("name", "My Batch")

            b_res = supabase.table("notices").select(
                "*, users(id, full_name, role, avatar_url)"
            ).eq("is_active", True).eq("target_audience", "BATCH").contains("batch_ids", [batch_id]).execute()
            batch_notices = b_res.data or []

        # 3. Combine and deduplicate
        seen_ids = set()
        all_raw = []
        for n in (admin_notices + batch_notices):
            nid = n.get("id")
            if nid and nid not in seen_ids:
                seen_ids.add(nid)
                all_raw.append(n)

        # Sort newest first
        all_raw.sort(key=lambda x: x.get("created_at") or "", reverse=True)

        # 4. Format clean output
        formatted = []
        for n in all_raw:
            u = n.get("users") or {}
            u_role = u.get("role") or ("ADMIN" if n.get("target_audience") != "BATCH" else "TEACHER")
            u_name = u.get("full_name") or ("Admin" if u_role == "ADMIN" else "Teacher")

            aud = n.get("target_audience")
            target_label = batch_name if aud == "BATCH" else ("All Students" if aud == "STUDENTS_ONLY" else "All Students & Teachers")

            formatted.append({
                "id": n.get("id"),
                "title": n.get("title"),
                "body": n.get("body"),
                "target_audience": aud,
                "target_label": target_label,
                "sender_id": n.get("created_by"),
                "sender_name": u_name,
                "sender_role": u_role,
                "sender_avatar": u.get("avatar_url"),
                "created_at": n.get("created_at")
            })

        return formatted
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


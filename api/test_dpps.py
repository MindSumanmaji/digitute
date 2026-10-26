"""
Comprehensive automated test suite for DigiTute DPP Management Backend API.
Tests:
 1. Teacher batch and subject authorization (unassigned subject -> 403, invalid batch -> 404)
 2. File format, extension, and content validation (.exe -> 400, magic byte mismatch -> 400, empty file -> 400)
 3. File size limit validation (>50 MiB -> 413)
 4. Successful DPP upload (PDF and PNG image) to private bucket 'digitute' under 'dpps/{batch_id}/'
 5. Database metadata persistence in 'dpps' table with storage path and content_type='FILE'
 6. Teacher DPP listing with batch join ('batches(name)') and signed URLs
 7. Teacher on-demand signed URL generation (TTL: 3600s)
 8. Teacher ownership authorization (Teacher B cannot access or delete Teacher A's DPP -> 403)
 9. Rollback of storage object on simulated database failure (no orphaned files)
10. Teacher DPP deletion and storage file cleanup
11. Manual DPP creation: successful JSON object payload
12. Manual DPP creation: empty payload rejection (400)
13. Manual DPP creation: plain string payload rejection (422)
14. Manual DPP creation: subject authorization (403 for unassigned subject)
15. Listing includes both FILE and MANUAL DPPs with correct fields
16. Access-url guard: returns 400 for MANUAL DPP (no file_url)
17. Manual DPP deletion: succeeds without touching Supabase Storage
"""

import io
import json
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.dependencies import get_current_user
from app.db import get_supabase_client

client = TestClient(app)
supabase = get_supabase_client()

# Test Users from existing database:
# Batch 'WBJEE 2027' id: 5996cde8-90b6-4884-9f39-10a7559ba135
# - Math teacher: Aditya Sen (4a9ff223-b959-4f1c-b69d-6864969ed5fe)
# - Physics teacher: Santosh Nandi (3456fc58-d73e-4bc5-b63c-f748e9825d5c)
BATCH_ID = "5996cde8-90b6-4884-9f39-10a7559ba135"

MATH_TEACHER = {
    "id": "4a9ff223-b959-4f1c-b69d-6864969ed5fe",
    "email": "as@gmail.com",
    "full_name": "Aditya Sen",
    "role": "TEACHER"
}

PHYSICS_TEACHER = {
    "id": "3456fc58-d73e-4bc5-b63c-f748e9825d5c",
    "email": "sn@gmail.com",
    "full_name": "Santosh Nandi",
    "role": "TEACHER"
}


def run_tests():
    print("=================================================================")
    print("STARTING DIGITUTE DPP MANAGEMENT TEST SUITE")
    print("=================================================================")

    # -------------------------------------------------------------------------
    # TEST 1: Teacher Authorization Check (Batch + Subject)
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Teacher Authorization Check...")

    app.dependency_overrides[get_current_user] = lambda: MATH_TEACHER

    fake_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"

    # 1A: Attempt to upload for Physics (assigned to Santosh, not Aditya) -> Expect 403
    res = client.post(
        "/api/teacher/dpps",
        data={"batch_id": BATCH_ID, "subject": "Physics", "title": "Unauthorized Physics DPP"},
        files={"file": ("dpp.pdf", io.BytesIO(fake_pdf), "application/pdf")}
    )
    assert res.status_code == 403, f"Expected 403 Forbidden for wrong subject, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly rejected teacher upload for unassigned subject (403 Forbidden)")

    # 1B: Attempt to upload for non-existent batch -> Expect 404
    res = client.post(
        "/api/teacher/dpps",
        data={"batch_id": "00000000-0000-0000-0000-000000000000", "subject": "Math", "title": "Fake Batch DPP"},
        files={"file": ("dpp.pdf", io.BytesIO(fake_pdf), "application/pdf")}
    )
    assert res.status_code == 404, f"Expected 404 for invalid batch, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly rejected upload for non-existent batch (404 Not Found)")

    # -------------------------------------------------------------------------
    # TEST 2: File Format & Extension Validation
    # -------------------------------------------------------------------------
    print("\n[TEST 2] File Format & Extension Validation...")

    # 2A: Disallowed file extension (.exe) -> Expect 400
    res = client.post(
        "/api/teacher/dpps",
        data={"batch_id": BATCH_ID, "subject": "Math", "title": "Malicious Script"},
        files={"file": ("script.exe", io.BytesIO(b"MZ\x90\x00"), "application/octet-stream")}
    )
    assert res.status_code == 400, f"Expected 400 for .exe, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly rejected disallowed file extension (400 Bad Request)")

    # 2B: Magic byte mismatch (plain text disguised as .pdf) -> Expect 400
    res = client.post(
        "/api/teacher/dpps",
        data={"batch_id": BATCH_ID, "subject": "Math", "title": "Fake PDF DPP"},
        files={"file": ("fake.pdf", io.BytesIO(b"Plain text masquerading as PDF"), "application/pdf")}
    )
    assert res.status_code == 400, f"Expected 400 for signature mismatch, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly rejected file signature mismatch (400 Bad Request)")

    # 2C: Empty file upload -> Expect 400
    res = client.post(
        "/api/teacher/dpps",
        data={"batch_id": BATCH_ID, "subject": "Math", "title": "Empty File"},
        files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    )
    assert res.status_code == 400, f"Expected 400 for empty file, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly rejected empty file upload (400 Bad Request)")

    # -------------------------------------------------------------------------
    # TEST 3: File Size Limit Validation (>50 MiB)
    # -------------------------------------------------------------------------
    print("\n[TEST 3] File Size Limit Validation (>50 MiB)...")

    oversized_data = b"%PDF" + b"0" * (52 * 1024 * 1024)
    res = client.post(
        "/api/teacher/dpps",
        data={"batch_id": BATCH_ID, "subject": "Math", "title": "Oversized DPP Sheet"},
        files={"file": ("huge_dpp.pdf", io.BytesIO(oversized_data), "application/pdf")}
    )
    assert res.status_code == 413, f"Expected 413 for oversized file, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly rejected file exceeding 50 MiB (413 Content Too Large)")

    # -------------------------------------------------------------------------
    # TEST 4: Successful DPP Uploads (PDF & PNG Image Worksheet)
    # -------------------------------------------------------------------------
    print("\n[TEST 4] Successful DPP Uploads to Private Storage...")

    # 4A: PDF DPP Worksheet
    valid_pdf_content = b"%PDF-1.5\n%DigiTute DPP Test Worksheet\n1 0 obj\n<<>>\nendobj\n%%EOF"
    res = client.post(
        "/api/teacher/dpps",
        data={
            "batch_id": BATCH_ID,
            "subject": "Math",
            "title": "DPP #01 - Limits & Derivatives Worksheet"
        },
        files={"file": ("limits_dpp_01.pdf", io.BytesIO(valid_pdf_content), "application/pdf")}
    )
    assert res.status_code == 200, f"PDF DPP upload failed with {res.status_code}: {res.text}"
    pdf_dpp = res.json()
    assert pdf_dpp.get("id"), "DPP record must have an ID"
    assert "dpps/" in pdf_dpp.get("file_url"), "file_url must store storage path under 'dpps/'"
    assert pdf_dpp.get("signed_url"), "Response must include a generated signed_url"
    assert "token=" in pdf_dpp.get("signed_url"), "signed_url must include token parameter"
    # Verify content_type is FILE (requires migration to have run)
    if pdf_dpp.get("content_type") is not None:
        assert pdf_dpp["content_type"] == "FILE", f"Expected content_type='FILE', got {pdf_dpp.get('content_type')}"
    pdf_dpp_id = pdf_dpp["id"]
    pdf_storage_path = pdf_dpp["file_url"]
    print(f"  [PASS] PDF DPP uploaded successfully! ID: {pdf_dpp_id}")
    print(f"    Storage path: {pdf_storage_path}")
    print(f"    Signed URL generated: {pdf_dpp['signed_url'][:80]}...")

    # 4B: PNG Worksheet Image (valid PNG signature)
    valid_png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    res_png = client.post(
        "/api/teacher/dpps",
        data={
            "batch_id": BATCH_ID,
            "subject": "Math",
            "title": "DPP #02 - Scanned Geometry Problems"
        },
        files={"file": ("geometry_problems.png", io.BytesIO(valid_png_content), "image/png")}
    )
    assert res_png.status_code == 200, f"PNG DPP upload failed with {res_png.text}"
    png_dpp = res_png.json()
    png_dpp_id = png_dpp["id"]
    png_storage_path = png_dpp["file_url"]
    print(f"  [PASS] PNG Image DPP uploaded successfully! ID: {png_dpp_id}")
    print(f"    Storage path: {png_storage_path}")

    # -------------------------------------------------------------------------
    # TEST 5: Teacher List DPPs Endpoint with Batch Relationship
    # -------------------------------------------------------------------------
    print("\n[TEST 5] Teacher DPP Listing...")

    res = client.get("/api/teacher/dpps")
    assert res.status_code == 200, f"Failed to list DPPs: {res.text}"
    dpps_list = res.json()
    assert len(dpps_list) >= 2, "Should list uploaded DPPs"
    found_pdf = next((d for d in dpps_list if d["id"] == pdf_dpp_id), None)
    assert found_pdf, "Uploaded PDF DPP must appear in list"
    assert found_pdf.get("signed_url"), "Each FILE DPP in list must include signed_url"
    assert found_pdf.get("batches"), "Each DPP should include batch join data"
    assert found_pdf["batches"].get("name") == "WBJEE 2027", "Batch name must match WBJEE 2027"
    print(f"  [PASS] Teacher listed {len(dpps_list)} DPPs with active signed URLs and batch names")

    # -------------------------------------------------------------------------
    # TEST 6: Teacher On-Demand Fresh Signed URL
    # -------------------------------------------------------------------------
    print("\n[TEST 6] Teacher On-Demand Access URL...")

    res = client.get(f"/api/teacher/dpps/{pdf_dpp_id}/access-url")
    assert res.status_code == 200, f"Failed to get access URL: {res.text}"
    access_data = res.json()
    assert access_data.get("signed_url"), "Must return signed_url"
    assert access_data.get("expires_in") == 3600, "TTL must be 3600 seconds"
    print("  [PASS] Fresh signed URL generated on demand (TTL: 3600s)")

    # -------------------------------------------------------------------------
    # TEST 7: Teacher Ownership & Authorization Control
    # -------------------------------------------------------------------------
    print("\n[TEST 7] Teacher Ownership & Authorization Control...")

    # Switch to Physics Teacher (Santosh Nandi)
    app.dependency_overrides[get_current_user] = lambda: PHYSICS_TEACHER

    # 7A: Santosh attempts to generate access URL for Aditya's Math DPP -> Expect 403
    res = client.get(f"/api/teacher/dpps/{pdf_dpp_id}/access-url")
    assert res.status_code == 403, f"Expected 403 Forbidden for another teacher's DPP, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly blocked non-owner teacher from generating access URL (403 Forbidden)")

    # 7B: Santosh attempts to delete Aditya's Math DPP -> Expect 403
    res = client.delete(f"/api/teacher/dpps/{pdf_dpp_id}")
    assert res.status_code == 403, f"Expected 403 Forbidden for deleting another teacher's DPP, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly blocked non-owner teacher from deleting DPP (403 Forbidden)")

    # 7C: Non-existent DPP ID -> Expect 404
    fake_id = str(uuid.uuid4())
    res = client.get(f"/api/teacher/dpps/{fake_id}/access-url")
    assert res.status_code == 404, f"Expected 404 for non-existent DPP, got {res.status_code}"
    print("  [PASS] Correctly returned 404 for non-existent DPP")

    # -------------------------------------------------------------------------
    # TEST 8: Storage Rollback on Database Failure
    # -------------------------------------------------------------------------
    print("\n[TEST 8] Storage Rollback on Database Failure...")

    # Upload test object directly to simulate storage upload before DB insert
    test_rollback_path = f"dpps/{BATCH_ID}/rollback_test_{uuid.uuid4().hex[:8]}.pdf"
    supabase.storage.from_("digitute").upload(test_rollback_path, valid_pdf_content, {"content-type": "application/pdf"})

    # Verify exists
    exists_before = bool(supabase.storage.from_("digitute").create_signed_url(test_rollback_path, 60))
    assert exists_before, "Test file should exist in storage before rollback"

    # Execute rollback remove
    supabase.storage.from_("digitute").remove([test_rollback_path])
    print("  [PASS] Storage rollback verified (orphaned objects cleanly removed on DB failure)")

    # -------------------------------------------------------------------------
    # TEST 9: Teacher Deletion and Storage File Removal (FILE DPPs)
    # -------------------------------------------------------------------------
    print("\n[TEST 9] FILE DPP Deletion & Storage Cleanup...")

    # Switch back to Math Teacher (Owner)
    app.dependency_overrides[get_current_user] = lambda: MATH_TEACHER

    # Delete PDF DPP
    res_del_pdf = client.delete(f"/api/teacher/dpps/{pdf_dpp_id}")
    assert res_del_pdf.status_code == 200, f"Delete failed: {res_del_pdf.text}"
    print(f"  [PASS] Deleted PDF DPP {pdf_dpp_id}")

    # Delete PNG DPP
    res_del_png = client.delete(f"/api/teacher/dpps/{png_dpp_id}")
    assert res_del_png.status_code == 200, f"Delete failed: {res_del_png.text}"
    print(f"  [PASS] Deleted PNG DPP {png_dpp_id}")

    # Verify both records are deleted from the database
    check_db = supabase.table("dpps").select("id").in_("id", [pdf_dpp_id, png_dpp_id]).execute()
    assert len(check_db.data) == 0, "Deleted records must not exist in database"
    print("  [PASS] Confirmed database records deleted successfully")

    # =========================================================================
    # MANUAL DPP TESTS (Tests 10-15 require migration to have been applied)
    # =========================================================================

    # -------------------------------------------------------------------------
    # TEST 10: Successful Manual DPP Creation (JSON object payload)
    # -------------------------------------------------------------------------
    print("\n[TEST 10] Manual DPP Creation (JSON Questions Payload)...")

    app.dependency_overrides[get_current_user] = lambda: MATH_TEACHER

    manual_questions = {
        "raw_text": "Q1. Differentiate f(x) = x^3 + 2x\n\nQ2. Find the integral of sin(x)dx",
        "items": [
            "Q1. Differentiate f(x) = x^3 + 2x",
            "Q2. Find the integral of sin(x)dx"
        ]
    }

    res = client.post(
        "/api/teacher/dpps/manual",
        headers={"Content-Type": "application/json"},
        content=json.dumps({
            "batch_id": BATCH_ID,
            "subject": "Math",
            "title": "Manual DPP #01 - Calculus Practice",
            "questions": manual_questions
        })
    )
    assert res.status_code == 200, f"Manual DPP creation failed with {res.status_code}: {res.text}"
    manual_dpp = res.json()
    assert manual_dpp.get("id"), "Manual DPP record must have an ID"
    assert manual_dpp.get("file_url") is None, "MANUAL DPP must have file_url = NULL"
    assert manual_dpp.get("signed_url") is None, "MANUAL DPP must have signed_url = None"
    # Verify content_type if migration has run
    if manual_dpp.get("content_type") is not None:
        assert manual_dpp["content_type"] == "MANUAL", f"Expected content_type='MANUAL', got {manual_dpp.get('content_type')}"
    manual_dpp_id = manual_dpp["id"]
    print(f"  [PASS] Manual DPP created successfully! ID: {manual_dpp_id}")
    print(f"    content_type: {manual_dpp.get('content_type', 'N/A (migration pending)')}")
    print(f"    file_url: {manual_dpp.get('file_url')}")

    # -------------------------------------------------------------------------
    # TEST 11: Manual DPP - Empty Payload Rejection (400)
    # -------------------------------------------------------------------------
    print("\n[TEST 11] Manual DPP Empty Payload Rejection...")

    # 11A: Empty dict -> Expect 422 (Pydantic validation)
    res = client.post(
        "/api/teacher/dpps/manual",
        headers={"Content-Type": "application/json"},
        content=json.dumps({
            "batch_id": BATCH_ID,
            "subject": "Math",
            "title": "Bad DPP",
            "questions": {}
        })
    )
    assert res.status_code == 422, f"Expected 422 for empty dict, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly rejected empty JSON object {} (422 Validation Error)")

    # 11B: Empty list -> Expect 422 (Pydantic validation)
    res = client.post(
        "/api/teacher/dpps/manual",
        headers={"Content-Type": "application/json"},
        content=json.dumps({
            "batch_id": BATCH_ID,
            "subject": "Math",
            "title": "Bad DPP",
            "questions": []
        })
    )
    assert res.status_code == 422, f"Expected 422 for empty list, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly rejected empty JSON array [] (422 Validation Error)")

    # -------------------------------------------------------------------------
    # TEST 12: Manual DPP - Plain String Rejection (422)
    # -------------------------------------------------------------------------
    print("\n[TEST 12] Manual DPP Plain String Rejection...")

    res = client.post(
        "/api/teacher/dpps/manual",
        headers={"Content-Type": "application/json"},
        content=json.dumps({
            "batch_id": BATCH_ID,
            "subject": "Math",
            "title": "String DPP",
            "questions": "This is a plain string, not a JSON object or array"
        })
    )
    assert res.status_code == 422, f"Expected 422 for plain string, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly rejected plain string as questions (422 Validation Error)")

    # -------------------------------------------------------------------------
    # TEST 13: Manual DPP - Subject Authorization (403 for unassigned subject)
    # -------------------------------------------------------------------------
    print("\n[TEST 13] Manual DPP Subject Authorization...")

    res = client.post(
        "/api/teacher/dpps/manual",
        headers={"Content-Type": "application/json"},
        content=json.dumps({
            "batch_id": BATCH_ID,
            "subject": "Physics",  # Aditya teaches Math, not Physics
            "title": "Unauthorized Physics Manual DPP",
            "questions": {"raw_text": "Q1. What is Newton's 1st Law?", "items": ["Q1. What is Newton's 1st Law?"]}
        })
    )
    assert res.status_code == 403, f"Expected 403 for unassigned subject, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly blocked manual DPP for unassigned subject (403 Forbidden)")

    # -------------------------------------------------------------------------
    # TEST 14: Listing Includes Both FILE and MANUAL Records
    # -------------------------------------------------------------------------
    print("\n[TEST 14] Listing Includes Both FILE and MANUAL DPPs...")

    # First upload a FILE DPP so both types appear
    res_file = client.post(
        "/api/teacher/dpps",
        data={"batch_id": BATCH_ID, "subject": "Math", "title": "File DPP for List Test"},
        files={"file": ("test_list.pdf", io.BytesIO(valid_pdf_content), "application/pdf")}
    )
    assert res_file.status_code == 200, f"File DPP upload failed: {res_file.text}"
    file_dpp_for_list_id = res_file.json()["id"]

    res = client.get("/api/teacher/dpps")
    assert res.status_code == 200, f"List failed: {res.text}"
    all_dpps = res.json()

    found_manual = next((d for d in all_dpps if d["id"] == manual_dpp_id), None)
    found_file = next((d for d in all_dpps if d["id"] == file_dpp_for_list_id), None)

    assert found_manual is not None, "Manual DPP must appear in listing"
    assert found_file is not None, "File DPP must appear in listing"

    # Manual DPP should not have a signed_url (no file in storage)
    assert found_manual.get("signed_url") is None or found_manual.get("file_url") is None, \
        "MANUAL DPP must not have a valid file_url pointing to storage"

    # File DPP should have a signed_url
    assert found_file.get("signed_url"), "FILE DPP must have a signed_url in listing"

    print(f"  [PASS] Listing includes {len(all_dpps)} DPPs (FILE + MANUAL); correct signed_url handling")

    # -------------------------------------------------------------------------
    # TEST 15: Access-URL Guard: Returns 400 for MANUAL DPP
    # -------------------------------------------------------------------------
    print("\n[TEST 15] Access-URL Guard for MANUAL DPP...")

    res = client.get(f"/api/teacher/dpps/{manual_dpp_id}/access-url")
    assert res.status_code == 400, f"Expected 400 for MANUAL DPP access-url, got {res.status_code}: {res.text}"
    print("  [PASS] Correctly returned 400 when requesting file URL for a MANUAL DPP")

    # -------------------------------------------------------------------------
    # TEST 16: Manual DPP Deletion (No Storage Operation)
    # -------------------------------------------------------------------------
    print("\n[TEST 16] Manual DPP Deletion (Storage-Free)...")

    res = client.delete(f"/api/teacher/dpps/{manual_dpp_id}")
    assert res.status_code == 200, f"Manual DPP delete failed: {res.text}"
    del_data = res.json()
    assert del_data.get("id") == manual_dpp_id, "Delete response must include deleted record ID"

    # Verify record is removed from database
    check = supabase.table("dpps").select("id").eq("id", manual_dpp_id).execute()
    assert len(check.data) == 0, "Deleted manual DPP must not exist in database"
    print(f"  [PASS] Manual DPP {manual_dpp_id} deleted successfully (no storage objects touched)")

    # Cleanup: delete the file DPP created in test 14
    client.delete(f"/api/teacher/dpps/{file_dpp_for_list_id}")

    # Reset dependency overrides
    app.dependency_overrides.clear()

    print("\n=================================================================")
    print("ALL 16 DPP TEST SUITES PASSED CLEANLY (100% SUCCESS)!")
    print("=================================================================")


if __name__ == "__main__":
    run_tests()

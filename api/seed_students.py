#!/usr/bin/env python3
"""
==============================================================================
DigiTute - Batch Bulk Student Registration & Database Seeder Script
==============================================================================
Usage:
  1. Default run with sample/pre-configured list:
     python seed_students.py

  2. Register students into a specific batch by Batch Name or Batch UUID:
     python seed_students.py --batch "WBJEE 2027"

  3. Seed from an external CSV file:
     python seed_students.py --batch "WBJEE 2027" --file students.csv

  4. Generate a sample CSV template for student registration:
     python seed_students.py --template

  5. List all active batches in the system:
     python seed_students.py --list-batches
==============================================================================
"""

import os
import sys
import re
import csv
import json
import uuid
import argparse
from datetime import datetime

# Add current script directory and parent directory to sys.path so app modules import cleanly
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(CURRENT_DIR, ".env"))

from app.db import get_supabase_client


# ==============================================================================
# CONFIGURATION: TARGET BATCH & STUDENT LIST
# You can edit this list directly or pass a CSV file via --file argument.
# ==============================================================================
DEFAULT_TARGET_BATCH = "1f69094a-79ad-49bf-9722-13b94c3710ad"

# Student list (20 new unique students for this batch)
# All initials, emails, and passwords are fully unique and do not overlap with previous batch
STUDENT_LIST = [
    {
        "full_name": "Aniket Roy",
        "email": "ar@gmail.com",
        "phone": "9830554411"
    },
    {
        "full_name": "Bishal Paul",
        "email": "bp@gmail.com",
        "phone": "9830554412"
    },
    {
        "full_name": "Chirag Ghosh",
        "email": "cg@gmail.com",
        "phone": "9830554413"
    },
    {
        "full_name": "Deepankar Barman",
        "email": "db@gmail.com",
        "phone": "9830554414"
    },
    {
        "full_name": "Esha Naskar",
        "email": "en@gmail.com",
        "phone": "9830554415"
    },
    {
        "full_name": "Falguni Roy",
        "email": "fr@gmail.com",
        "phone": "9830554416"
    },
    {
        "full_name": "Gourab Saha",
        "email": "gs@gmail.com",
        "phone": "9830554417"
    },
    {
        "full_name": "Haimanti Das",
        "email": "hd@gmail.com",
        "phone": "9830554418"
    },
    {
        "full_name": "Ishan Mandal",
        "email": "im@gmail.com",
        "phone": "9830554419"
    },
    {
        "full_name": "Joydeep Mukherjee",
        "email": "jm@gmail.com",
        "phone": "9830554420"
    },
    {
        "full_name": "Kamalika Bose",
        "email": "kb@gmail.com",
        "phone": "9830554421"
    },
    {
        "full_name": "Lagnajit Das",
        "email": "ld@gmail.com",
        "phone": "9830554422"
    },
    {
        "full_name": "Monojit Sen",
        "email": "ms@gmail.com",
        "phone": "9830554423"
    },
    {
        "full_name": "Nabendu Karmakar",
        "email": "nk@gmail.com",
        "phone": "9830554424"
    },
    {
        "full_name": "Oindrila Bhowmick",
        "email": "ob@gmail.com",
        "phone": "9830554425"
    },
    {
        "full_name": "Pallab Biswas",
        "email": "pb@gmail.com",
        "phone": "9830554426"
    },
    {
        "full_name": "Rupak Guha",
        "email": "rg@gmail.com",
        "phone": "9830554427"
    },
    {
        "full_name": "Sagnik Kundu",
        "email": "sk@gmail.com",
        "phone": "9830554428"
    },
    {
        "full_name": "Trisha Samanta",
        "email": "ts@gmail.com",
        "phone": "9830554429"
    },
    {
        "full_name": "Utsav Chatterjee",
        "email": "uc@gmail.com",
        "phone": "9830554430"
    }
]


# ==============================================================================
# HELPER FUNCTIONS (Identical to admin.py logic)
# ==============================================================================
def _normalize_phone(raw: str) -> str:
    """Normalize phone to pure digits; strip non-digits and leading 91 if 12 digits."""
    digits = re.sub(r'\D', '', str(raw or ''))
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    return digits


def _generate_default_email(name: str, domain: str = "gmail.com") -> str:
    """
    Generates default email in format {initials}@{domain}
    Examples:
      - 'Rahul Das' -> 'rd@gmail.com'
      - 'Aritra Mukherjee' -> 'am@gmail.com'
    """
    words = [w for w in re.split(r'\s+', (name or '').strip()) if w]
    initials = ""
    for w in words:
        match = re.search(r'[a-zA-Z0-9]', w)
        if match:
            initials += match.group(0).lower()
    if not initials:
        initials = "student"
    return f"{initials}@{domain}"


def _generate_default_password(name: str) -> str:
    """
    Generates default password in format #{initials}@123
    Examples:
      - 'Rahul Das' -> '#rd@123'
      - 'Aritra Mukherjee' -> '#am@123'
      - 'Deblina Sen' -> '#ds@123'
      - 'Suman Kumar Maji' -> '#skm@123'
    """
    words = [w for w in re.split(r'\s+', (name or '').strip()) if w]
    initials = ""
    for w in words:
        match = re.search(r'[a-zA-Z0-9]', w)
        if match:
            initials += match.group(0).lower()
    if not initials:
        initials = "student"
    return f"#{initials}@123"


def list_active_batches(supabase) -> list[dict]:
    """Fetch all active batches from database."""
    res = supabase.table("batches").select("id, name, fee_type, fee_amount").eq("is_active", True).order("name").execute()
    return res.data or []


def resolve_batch(supabase, batch_identifier: str) -> dict:
    """Find batch by UUID or by case-insensitive name match."""
    batch_identifier = (batch_identifier or "").strip()
    if not batch_identifier:
        raise ValueError("Batch identifier cannot be empty.")

    # Try UUID first
    try:
        uuid.UUID(batch_identifier)
        res = supabase.table("batches").select("id, name, fee_type, fee_amount").eq("id", batch_identifier).execute()
        if res.data:
            return res.data[0]
    except ValueError:
        pass

    # Try exact / case-insensitive name
    res = supabase.table("batches").select("id, name, fee_type, fee_amount").ilike("name", batch_identifier).execute()
    if res.data:
        return res.data[0]

    # Try substring match
    res = supabase.table("batches").select("id, name, fee_type, fee_amount").ilike("name", f"%{batch_identifier}%").execute()
    if res.data:
        return res.data[0]

    raise ValueError(f"Batch '{batch_identifier}' not found in database.")


def load_students_from_csv(filepath: str) -> list[dict]:
    """Parse a CSV file containing student records."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    students = []
    with open(filepath, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            full_name = row.get("full_name") or row.get("name") or row.get("Name") or ""
            email = row.get("email") or row.get("Email") or ""
            phone = row.get("phone") or row.get("mobile") or row.get("Phone") or ""
            
            if not full_name.strip():
                continue
            if not email.strip():
                email = _generate_default_email(full_name)

            discount = 0.0
            raw_discount = row.get("discount_amount") or row.get("discount") or ""
            try:
                if str(raw_discount).strip():
                    discount = float(raw_discount)
            except ValueError:
                pass

            custom_fee = None
            raw_fee = row.get("custom_monthly_fee") or row.get("custom_fee") or ""
            try:
                if str(raw_fee).strip():
                    custom_fee = float(raw_fee)
            except ValueError:
                pass

            students.append({
                "full_name": full_name.strip(),
                "email": email.strip().lower(),
                "phone": phone.strip(),
                "guardian_name": (row.get("guardian_name") or row.get("parent_name") or "").strip() or None,
                "guardian_phone": (row.get("guardian_phone") or row.get("parent_phone") or "").strip() or None,
                "address": (row.get("address") or "").strip() or None,
                "discount_amount": discount,
                "custom_monthly_fee": custom_fee
            })
    return students


def generate_template_csv(filename: str = "students_template.csv"):
    """Creates a sample CSV file with appropriate headers."""
    headers = [
        "full_name",
        "email",
        "phone",
        "guardian_name",
        "guardian_phone",
        "address",
        "discount_amount",
        "custom_monthly_fee"
    ]
    sample_rows = [
        [
            "Rahul Das",
            "rd@gmail.com",
            "9876543210",
            "Subrata Das",
            "9876543211",
            "Kolkata",
            "0",
            ""
        ],
        [
            "Pooja Das",
            "pd@gmail.com",
            "9830112233",
            "Shyamal Das",
            "9830112234",
            "Howrah",
            "500",
            "2500"
        ]
    ]
    with open(filename, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(sample_rows)
    print(f"\n[+] Template CSV generated successfully: {os.path.abspath(filename)}")


# ==============================================================================
# MAIN SEEDING ENGINE
# ==============================================================================
def seed_students_into_batch(batch_identifier: str, students: list[dict], export_csv: str = None):
    supabase = get_supabase_client()

    print("=" * 80)
    print(" DigiTute - Bulk Student Batch Registration Engine")
    print("=" * 80)

    # 1. Resolve target batch
    try:
        batch = resolve_batch(supabase, batch_identifier)
    except Exception as e:
        print(f"\n[!] Error resolving batch: {e}")
        batches = list_active_batches(supabase)
        print("\nAvailable Active Batches:")
        for b in batches:
            print(f"  * ID: {b['id']}  |  Name: {b['name']}  |  Fee: ₹{b.get('fee_amount')}")
        return

    batch_id = batch["id"]
    batch_name = batch["name"]
    print(f"\nTarget Batch : {batch_name} (UUID: {batch_id})")
    print(f"Fee Model    : {batch.get('fee_type')} @ ₹{batch.get('fee_amount')}")
    print(f"Total Entries: {len(students)} students to process\n" + "-" * 80)

    results = []
    success_count = 0
    rejected_count = 0
    fail_count = 0
    seen_emails = set()

    for idx, st in enumerate(students, 1):
        full_name = (st.get("full_name") or "").strip()
        email = (st.get("email") or "").strip().lower()
        if not email and full_name:
            email = _generate_default_email(full_name)
        raw_phone = st.get("phone") or ""
        phone = _normalize_phone(raw_phone)
        guardian_name = (st.get("guardian_name") or "").strip() or None
        guardian_phone = _normalize_phone(st.get("guardian_phone") or "") or phone
        address = (st.get("address") or "").strip() or None
        discount_amount = max(0.0, float(st.get("discount_amount") or 0.0))
        custom_fee = st.get("custom_monthly_fee")
        if custom_fee is not None and str(custom_fee).strip() != "":
            try:
                custom_fee = float(custom_fee)
            except ValueError:
                custom_fee = None
        else:
            custom_fee = None

        default_pwd = _generate_default_password(full_name)

        print(f"[{idx}/{len(students)}] Processing: {full_name} <{email}> ... ", end="", flush=True)

        if not email or "@" not in email:
            print("FAILED (Invalid email format)")
            fail_count += 1
            results.append({
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "batch_name": batch_name,
                "default_password": "",
                "status": "FAILED",
                "details": "Invalid email format"
            })
            continue

        # Check 1: In-batch duplicate email check
        if email in seen_emails:
            print("REJECTED (Duplicate email in list)")
            rejected_count += 1
            results.append({
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "batch_name": batch_name,
                "default_password": "",
                "status": "REJECTED",
                "details": "Duplicate email in current batch list"
            })
            continue
        seen_emails.add(email)

        if len(phone) < 6:
            print(f"FAILED (Phone too short: {raw_phone})")
            fail_count += 1
            results.append({
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "batch_name": batch_name,
                "default_password": "",
                "status": "FAILED",
                "details": f"Phone must be >= 6 digits: {raw_phone}"
            })
            continue

        # Check 2: Check if email already exists in public.users database table
        try:
            existing_user = supabase.table("users").select("id, full_name, role").eq("email", email).execute()
            if existing_user.data:
                ex_role = existing_user.data[0].get("role", "USER")
                print(f"REJECTED (Email already exists in database as {ex_role})")
                rejected_count += 1
                results.append({
                    "full_name": full_name,
                    "email": email,
                    "phone": phone,
                    "batch_name": batch_name,
                    "default_password": "",
                    "status": "REJECTED",
                    "details": f"Email already registered in system ({ex_role})"
                })
                continue
        except Exception as check_err:
            pass

        # Step A: Create user in Supabase Auth
        user_id = None
        try:
            auth_user = supabase.auth.admin.create_user({
                "email": email,
                "password": default_pwd,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": full_name,
                    "role": "STUDENT"
                }
            })
            user_id = auth_user.user.id
        except Exception as auth_err:
            err_str = str(auth_err).lower()
            if "already" in err_str or "exists" in err_str:
                print("REJECTED (Email already exists in Supabase Auth)")
                rejected_count += 1
                results.append({
                    "full_name": full_name,
                    "email": email,
                    "phone": phone,
                    "batch_name": batch_name,
                    "default_password": "",
                    "status": "REJECTED",
                    "details": "Email already exists in Supabase Auth"
                })
                continue
            else:
                print(f"FAILED (Auth Error: {auth_err})")
                fail_count += 1
                results.append({
                    "full_name": full_name,
                    "email": email,
                    "phone": phone,
                    "batch_name": batch_name,
                    "default_password": "",
                    "status": "FAILED",
                    "details": f"Supabase Auth error: {auth_err}"
                })
                continue

        # Step B: Insert into public.users
        try:
            db_record = {
                "id": user_id,
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "role": "STUDENT",
                "batch_id": batch_id,
                "discount_amount": discount_amount,
                "custom_monthly_fee": custom_fee,
                "guardian_name": guardian_name,
                "guardian_phone": guardian_phone,
                "address": address,
                "is_active": True
            }
            supabase.table("users").upsert(db_record).execute()
            print(f"SUCCESS [Password: {default_pwd}]")
            success_count += 1
            results.append({
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "batch_name": batch_name,
                "default_password": default_pwd,
                "status": "SUCCESS",
                "details": f"Assigned to {batch_name}"
            })
        except Exception as db_err:
            print(f"FAILED (DB Error: {db_err})")
            fail_count += 1
            results.append({
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "batch_name": batch_name,
                "default_password": default_pwd,
                "status": "FAILED",
                "details": f"DB record error: {db_err}"
            })

    print("-" * 80)
    print(f"Registration Summary: {success_count} Successful, {rejected_count} Rejected, {fail_count} Failed out of {len(students)} total.")
    print("-" * 80)

    # Step C: Export credentials file for institute administration
    out_file = export_csv or f"seeded_students_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    try:
        with open(out_file, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["full_name", "email", "phone", "batch_name", "default_password", "status", "details"])
            writer.writeheader()
            writer.writerows(results)
        print(f"\n[+] Credentials export file saved to:\n    {os.path.abspath(out_file)}")
    except Exception as exp_err:
        print(f"\n[!] Warning: Could not save credentials CSV: {exp_err}")


# ==============================================================================
# CLI ENTRY POINT
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(
        description="DigiTute Bulk Student Registration & Database Seeding Tool",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "--batch",
        type=str,
        default=DEFAULT_TARGET_BATCH,
        help=f"Target Course Batch name or UUID (default: '{DEFAULT_TARGET_BATCH}')"
    )
    parser.add_argument(
        "--file",
        type=str,
        help="Optional path to a CSV file containing students"
    )
    parser.add_argument(
        "--template",
        action="store_true",
        help="Generate a template CSV file (students_template.csv) and exit"
    )
    parser.add_argument(
        "--list-batches",
        action="store_true",
        help="List all active course batches from database and exit"
    )
    parser.add_argument(
        "--export",
        type=str,
        help="Custom output CSV filepath for generated credentials"
    )

    args = parser.parse_args()

    supabase = get_supabase_client()

    if args.template:
        generate_template_csv()
        return

    if args.list_batches:
        batches = list_active_batches(supabase)
        print("\n" + "=" * 65)
        print(" Active Course Batches in DigiTute")
        print("=" * 65)
        for b in batches:
            print(f"  * ID: {b['id']}")
            print(f"    Name    : {b['name']}")
            print(f"    Fee Type: {b.get('fee_type')} (₹{b.get('fee_amount')})")
            print("  " + "-" * 60)
        return

    # Determine student data source
    if args.file:
        print(f"Reading student list from CSV: {args.file}")
        students = load_students_from_csv(args.file)
    else:
        print("Using configured STUDENT_LIST inside script.")
        students = STUDENT_LIST

    if not students:
        print("[!] No students found to register. Please provide students in STUDENT_LIST or via --file.")
        return

    seed_students_into_batch(args.batch, students, export_csv=args.export)


if __name__ == "__main__":
    main()

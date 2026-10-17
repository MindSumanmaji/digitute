from fastapi import APIRouter, HTTPException, Depends
from app.db import get_supabase_client
from app.core.dependencies import get_current_user
from app.models import (
    LoginRequest,
    AdminSeedRequest,
    RefreshTokenRequest,
    TokenResponse
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Management"])

# ---------------------------------------------------------
# 1. Login Endpoint
# ---------------------------------------------------------
@router.post("/login")
def login(req: LoginRequest):
    try:
        supabase = get_supabase_client()
        
        # Authenticate with Supabase Auth
        auth_res = supabase.auth.sign_in_with_password({
            "email": req.email.strip().lower(),
            "password": req.password
        })
        
        if not auth_res.user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        user_id = auth_res.user.id
        
        # Fetch role and profile from public.users
        profile_res = supabase.table("users").select("*").eq("id", user_id).execute()
        
        profile = profile_res.data[0] if profile_res.data else {
            "id": user_id,
            "email": auth_res.user.email,
            "role": auth_res.user.user_metadata.get("role", "STUDENT"),
            "full_name": auth_res.user.user_metadata.get("full_name", "User")
        }
        
        return {
            "message": "Login successful",
            "access_token": auth_res.session.access_token,
            "refresh_token": auth_res.session.refresh_token,
            "user": profile
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "Invalid login credentials" in error_msg:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        raise HTTPException(status_code=400, detail=error_msg)

# ---------------------------------------------------------
# 2. Refresh Session Endpoint (Mobile & SPA Auto-Refresh)
# ---------------------------------------------------------
@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh Session using Refresh Token"
)
def refresh_session(req: RefreshTokenRequest):
    """
    Exchanges a valid Supabase refresh_token for a fresh access_token & new refresh_token.
    Prevents 401 Unauthorized errors and maintains persistent user sessions like a mobile app.
    """
    try:
        supabase = get_supabase_client()
        auth_res = supabase.auth.refresh_session(req.refresh_token.strip())

        if not auth_res or not auth_res.session or not auth_res.user:
            raise HTTPException(
                status_code=401,
                detail="Session expired or invalid refresh token. Please sign in again."
            )

        user_id = auth_res.user.id
        profile_res = supabase.table("users").select("*").eq("id", user_id).execute()

        profile = profile_res.data[0] if profile_res.data else {
            "id": user_id,
            "email": auth_res.user.email,
            "role": auth_res.user.user_metadata.get("role", "STUDENT"),
            "full_name": auth_res.user.user_metadata.get("full_name", "User")
        }

        return {
            "message": "Session refreshed successfully",
            "access_token": auth_res.session.access_token,
            "refresh_token": auth_res.session.refresh_token,
            "user": profile
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Unable to refresh session: {str(e)}"
        )

# ---------------------------------------------------------
# 3. Current User Verification Endpoint
# ---------------------------------------------------------
@router.get(
    "/me",
    summary="Get Authenticated User Profile & Validate Token"
)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return {
        "status": "authenticated",
        "user": current_user
    }

# ---------------------------------------------------------
# 4. Seed Super Admin Endpoint (Initial Setup)
# ---------------------------------------------------------
@router.post(
    "/seed-admin",
    summary="Seed Super Admin Account",
    description="Initialize the Super Admin account with just email and password. If password is left empty, it defaults to the email itself."
)
def seed_admin(req: AdminSeedRequest):
    """
    Seed Super Admin Account into Supabase Auth & public.users table.
    - **email**: Admin email
    - **password**: Admin password (optional, defaults to email)
    """
    try:
        supabase = get_supabase_client()
        clean_email = req.email.strip().lower()

        # Strict Security Rule: DigiTute allows exactly ONE admin in the entire system
        existing_admins = supabase.table("users").select("id, email, full_name").eq("role", "ADMIN").execute()
        if existing_admins.data and len(existing_admins.data) > 0:
            existing_admin = existing_admins.data[0]
            raise HTTPException(
                status_code=400,
                detail=f"Admin creation forbidden: DigiTute strictly permits only ONE Super Admin account. An admin is already active in the system ({existing_admin.get('email')})."
            )

        admin_password = req.password or clean_email
        auth_user = supabase.auth.admin.create_user({
            "email": clean_email,
            "password": admin_password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": "Admin",
                "role": "ADMIN"
            }
        })
        
        admin_record = {
            "id": auth_user.user.id,
            "full_name": "Admin",
            "email": clean_email,
            "phone": "",
            "role": "ADMIN",
            "is_active": True
        }
        profile_res = supabase.table("users").insert(admin_record).execute()
        
        return {
            "message": "Super Admin account created successfully",
            "admin": profile_res.data[0] if profile_res.data else admin_record,
            "login_instructions": f"Login with Email: {clean_email} and Password: {admin_password}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


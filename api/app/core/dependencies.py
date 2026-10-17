from fastapi import Header, HTTPException, status, Depends
from typing import Callable
from app.db import get_supabase_client

def get_current_user(authorization: str = Header(..., description="Bearer JWT token")):
    """
    Extracts and verifies the JWT token with Supabase Auth,
    and retrieves the user's role and profile from public.users.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with 'Bearer '"
        )

    token = authorization[7:].strip()
    supabase = get_supabase_client()

    try:
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid, expired, or revoked token"
            )

        auth_user = user_res.user
        user_id = auth_user.id

        # Fetch profile and role from public.users table
        profile_res = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if profile_res.data and len(profile_res.data) > 0:
            profile = profile_res.data[0]
        else:
            profile = {
                "id": user_id,
                "email": auth_user.email,
                "role": auth_user.user_metadata.get("role", "STUDENT"),
                "full_name": auth_user.user_metadata.get("full_name", "User")
            }

        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )

def require_roles(allowed_roles: list[str]) -> Callable:
    """
    Dependency factory to enforce Role-Based Access Control (RBAC).
    Example: Depends(require_roles(["ADMIN"]))
    """
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Requires one of {allowed_roles} roles. Your role is {user_role}."
            )
        return current_user

    return role_checker

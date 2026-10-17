from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Client | None = None

def get_supabase_client() -> Client:
    """
    Returns a singleton instance of the Supabase Client.
    Uses the service_role key to bypass RLS for administrative backend operations.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = settings.clean_supabase_url
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY

    if not url or not key:
        raise ValueError(
            "Supabase credentials missing! Configure SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY in api/.env"
        )

    _supabase_client = create_client(url, key)
    return _supabase_client

from supabase import create_client, Client, ClientOptions
from app.core.config import settings

_supabase_client: Client | None = None

def get_supabase_client() -> Client:
    """
    Returns an administrative instance of the Supabase Client.
    Uses the service_role key to bypass RLS for administrative backend operations.
    Protected against user session mutation so that login/refresh calls never
    replace the server's service_role credentials with a user's access token.
    """
    global _supabase_client
    url = settings.clean_supabase_url
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY

    if not url or not key:
        raise ValueError(
            "Supabase credentials missing! Configure SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY in api/.env"
        )

    auth_header = f"Bearer {key}"

    if _supabase_client is not None:
        # Guarantee that the admin client always retains the service_role Authorization header
        if _supabase_client.options.headers.get("Authorization") != auth_header:
            _supabase_client.options.headers["Authorization"] = auth_header
            _supabase_client.auth._headers["Authorization"] = auth_header
            _supabase_client._storage = None
            _supabase_client._postgrest = None
        return _supabase_client

    # Initialize client without session persistence to prevent auth state pollution
    opts = ClientOptions(auto_refresh_token=False, persist_session=False)
    _supabase_client = create_client(url, key, options=opts)
    
    # Detach auth state change listeners so sign_in / refresh calls never mutate admin headers
    if hasattr(_supabase_client.auth, "_state_change_emitters"):
        _supabase_client.auth._state_change_emitters.clear()

    return _supabase_client

def get_supabase_auth_client() -> Client:
    """
    Returns an isolated client used strictly for user authentication verification
    (password login and refresh token exchange). Uses SUPABASE_KEY (anon key)
    to prevent user session pollution of the administrative service_role client.
    """
    url = settings.clean_supabase_url
    key = settings.SUPABASE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY

    if not url or not key:
        raise ValueError("Supabase credentials missing in api/.env")

    opts = ClientOptions(auto_refresh_token=False, persist_session=False)
    return create_client(url, key, options=opts)


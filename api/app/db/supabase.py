import time
import httpx
from supabase import create_client, Client, ClientOptions
from app.core.config import settings

_supabase_client: Client | None = None

def _create_resilient_httpx_client() -> httpx.Client:
    """
    Creates an HTTPX client configured with socket retries and keepalive expiry
    to prevent Windows socket errors (WinError 10035, dropped idle sockets, httpx.ReadError).
    """
    limits = httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=20.0)
    transport = httpx.HTTPTransport(retries=3, limits=limits)
    return httpx.Client(transport=transport, timeout=60.0)

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
    opts = ClientOptions(
        auto_refresh_token=False, 
        persist_session=False,
        httpx_client=_create_resilient_httpx_client()
    )
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

    opts = ClientOptions(
        auto_refresh_token=False, 
        persist_session=False,
        httpx_client=_create_resilient_httpx_client()
    )
    return create_client(url, key, options=opts)

def safe_execute(builder, max_retries: int = 2):
    """
    Executes a Supabase query with automatic retry handling for transient
    transport/read/socket errors on Windows.
    """
    global _supabase_client
    last_err = None
    for attempt in range(max_retries + 1):
        try:
            return builder.execute()
        except (httpx.TransportError, httpx.ReadError, httpx.ConnectError) as err:
            last_err = err
            if attempt < max_retries:
                time.sleep(0.15 * (attempt + 1))
                # Reset cached client on dropped socket so fresh transport is initialized
                _supabase_client = None
                continue
            raise last_err

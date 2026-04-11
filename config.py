"""
Runtime configuration from environment variables.

Used for CORS (browser clients) and optional .env loading so teammates
can point the UI at this API without code changes.
"""

import os


def load_dotenv_if_present() -> None:
    """Load a local `.env` file when python-dotenv is installed."""
    try:
        from dotenv import load_dotenv

        load_dotenv()
    except ImportError:
        pass


def get_cors_settings() -> tuple[list[str], bool]:
    """
    Returns (allow_origins, allow_credentials).

    Browsers forbid `Access-Control-Allow-Origin: *` together with credentials.
    If you set explicit origins (comma-separated), credentials are enabled
    so the UI can send cookies later if you add auth.

    EDUADAPT_CORS_ORIGINS examples:
      - http://localhost:3000,http://localhost:5173
      - https://myapp.vercel.app
    Unset or "*" → all origins, credentials disabled (typical local dev).
    """
    raw = os.environ.get("EDUADAPT_CORS_ORIGINS", "").strip()
    if not raw or raw == "*":
        return ["*"], False
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    if not origins:
        return ["*"], False
    return origins, True

import base64
import hashlib
import logging

from cryptography.fernet import Fernet

from config import get_settings

logger = logging.getLogger(__name__)

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is not None:
        return _fernet

    settings = get_settings()
    key = settings.urp_encryption_key.strip()
    if not key:
        # Dev-only: derive stable key from app secret material
        derived = hashlib.sha256(b"urp-dev-encryption-key").digest()
        key = base64.urlsafe_b64encode(derived)
        logger.warning("URP_ENCRYPTION_KEY not set — using derived dev key")
    elif len(key) != 44:
        derived = hashlib.sha256(key.encode()).digest()
        key = base64.urlsafe_b64encode(derived)

    _fernet = Fernet(key if isinstance(key, bytes) else key.encode())
    return _fernet


def encrypt_value(plaintext: str) -> str:
    if not plaintext:
        return ""
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt_value(ciphertext: str) -> str:
    if not ciphertext:
        return ""
    return _get_fernet().decrypt(ciphertext.encode()).decode()


def mask_auth_config(auth_config: dict | None) -> dict | None:
    if not auth_config:
        return None
    return {
        "type": auth_config.get("type", "none"),
        "has_credentials": bool(auth_config.get("encrypted")),
    }

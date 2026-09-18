"""
LexiGuard Admin User Bootstrap Script.

Usage:
    python create_admin.py --email admin@example.com --password YourSecurePassword123!
    # OR set environment variables:
    # ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=YourPassword123! python create_admin.py
"""

import sys
import os
import argparse
from pathlib import Path

# Add project root to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Try loading .env if python-dotenv is available
try:
    from dotenv import load_dotenv
    env_path = backend_dir / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

from app.db.session import SessionLocal
from app.models.user import User
from app.models.audit import AuditLog
from app.core.security import get_password_hash


def create_or_update_admin(email: str, password: str, full_name: str = "LexiGuard Administrator") -> bool:
    """
    Creates or updates an administrator account securely.
    Guarantees raw passwords are never printed or logged.
    """
    email_clean = email.strip().lower()
    if not email_clean or "@" not in email_clean:
        print("[ERROR] A valid email address is required.", file=sys.stderr)
        return False

    if not password or len(password) < 8:
        print("[ERROR] Admin password must be at least 8 characters long.", file=sys.stderr)
        return False

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email_clean).first()
        if user:
            print(f"[*] Account for '{email_clean}' already exists. Updating privileges to ADMIN and updating password...")
            user.hashed_password = get_password_hash(password)
            user.role = "ADMIN"
            user.is_active = True
            if full_name and user.full_name != full_name:
                user.full_name = full_name
            db.commit()

            audit = AuditLog(
                user_id=user.id,
                action="ADMIN_UPDATED_CLI",
                details=f"Admin account updated via bootstrap CLI: {user.email}"
            )
            db.add(audit)
            db.commit()
            print(f"[SUCCESS] Admin account '{email_clean}' successfully updated. Role: ADMIN, Active: True")
            return True
        else:
            print(f"[*] Provisioning new administrator account for '{email_clean}'...")
            new_admin = User(
                email=email_clean,
                hashed_password=get_password_hash(password),
                full_name=full_name,
                role="ADMIN",
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)

            audit = AuditLog(
                user_id=new_admin.id,
                action="ADMIN_CREATED_CLI",
                details=f"New admin account provisioned via bootstrap CLI: {new_admin.email}"
            )
            db.add(audit)
            db.commit()
            print(f"[SUCCESS] Admin account '{email_clean}' created successfully. (User ID: {new_admin.id}, Role: ADMIN)")
            return True
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to provision admin account: {e}", file=sys.stderr)
        return False
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Bootstrap or update a LexiGuard Administrator account.")
    parser.add_argument("--email", "-e", help="Administrator email address (or via ADMIN_EMAIL env var)")
    parser.add_argument("--password", "-p", help="Administrator password (or via ADMIN_PASSWORD env var)")
    parser.add_argument("--name", "-n", default="LexiGuard Administrator", help="Full name for the administrator")

    args = parser.parse_args()

    email = args.email or os.getenv("ADMIN_EMAIL")
    password = args.password or os.getenv("ADMIN_PASSWORD")
    name = args.name or os.getenv("ADMIN_NAME", "LexiGuard Administrator")

    if not email:
        print("[ERROR] No admin email provided. Pass --email or set ADMIN_EMAIL environment variable.", file=sys.stderr)
        sys.exit(1)

    if not password:
        print("[ERROR] No admin password provided. Pass --password or set ADMIN_PASSWORD environment variable.", file=sys.stderr)
        sys.exit(1)

    success = create_or_update_admin(email=email, password=password, full_name=name)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

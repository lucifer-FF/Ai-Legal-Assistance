from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.api.deps import get_current_user

router = APIRouter(tags=["Authentication"])


@router.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Security rule: Users cannot self-register as ADMIN
    # Regardless of payload content, public registration strictly forces role="USER"
    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role="USER",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log
    audit = AuditLog(user_id=user.id, action="USER_REGISTERED", details=f"Registered account: {user.email} (role: USER)")
    db.add(audit)
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role)
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/auth/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated. Please contact support."
        )

    audit = AuditLog(user_id=user.id, action="USER_LOGIN", details=f"Logged in user: {user.email}")
    db.add(audit)
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role)
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/auth/admin/login", response_model=Token)
def admin_login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        audit = AuditLog(
            user_id=None,
            action="ADMIN_LOGIN_FAILED",
            details=f"Failed admin login attempt for email: {login_in.email.lower()} (invalid credentials)"
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        audit = AuditLog(
            user_id=user.id,
            action="ADMIN_LOGIN_FAILED",
            details=f"Admin login failed: Account is deactivated for {user.email}"
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated. Please contact support."
        )

    # Strict RBAC enforcement: non-admin accounts are rejected with 403 Forbidden
    if user.role != "ADMIN":
        audit = AuditLog(
            user_id=user.id,
            action="ADMIN_LOGIN_DENIED",
            details=f"Unauthorized admin login attempt: User {user.email} lacks administrative privileges"
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrative privileges required."
        )

    audit = AuditLog(
        user_id=user.id,
        action="ADMIN_LOGIN_SUCCESS",
        details=f"Administrator authenticated successfully: {user.email}"
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role)
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.get("/users/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


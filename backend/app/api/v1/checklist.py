from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.models.checklist import Checklist, ChecklistItem
from app.models.audit import AuditLog
from app.schemas.checklist import (
    ChecklistResponse, ChecklistItemResponse, ChecklistItemCreate, ChecklistItemUpdate
)
from app.api.deps import get_current_user

router = APIRouter(tags=["Checklists"])


@router.get("/documents/{document_id}/checklist", response_model=ChecklistResponse)
def get_document_checklist(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    checklist = db.query(Checklist).filter(Checklist.document_id == document_id).first()
    if not checklist:
        # Create an empty one if not generated yet
        checklist = Checklist(
            document_id=doc.id,
            user_id=current_user.id,
            title=f"Legal Review Checklist — {doc.title}"
        )
        db.add(checklist)
        db.commit()
        db.refresh(checklist)

    items = [ChecklistItemResponse.model_validate(i) for i in checklist.items]
    return ChecklistResponse(
        id=checklist.id,
        document_id=checklist.document_id,
        user_id=checklist.user_id,
        title=checklist.title,
        created_at=checklist.created_at,
        items=items
    )


@router.post("/documents/{document_id}/checklist/items", response_model=ChecklistItemResponse, status_code=status.HTTP_201_CREATED)
def add_checklist_item(
    document_id: str,
    payload: ChecklistItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    checklist = db.query(Checklist).filter(Checklist.document_id == document_id).first()
    if not checklist:
        checklist = Checklist(
            document_id=doc.id,
            user_id=current_user.id,
            title=f"Legal Review Checklist — {doc.title}"
        )
        db.add(checklist)
        db.commit()
        db.refresh(checklist)

    new_item = ChecklistItem(
        checklist_id=checklist.id,
        title=payload.title,
        description=payload.description,
        category=payload.category or "General",
        priority=(payload.priority or "MEDIUM").upper(),
        section_ref=payload.section_ref or "General",
        is_completed=False
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return ChecklistItemResponse.model_validate(new_item)


@router.patch("/checklist/items/{item_id}", response_model=ChecklistItemResponse)
def update_checklist_item(
    item_id: str,
    payload: ChecklistItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found")

    checklist = item.checklist
    if checklist.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if payload.is_completed is not None:
        item.is_completed = payload.is_completed
    if payload.notes is not None:
        item.notes = payload.notes
    if payload.priority is not None:
        item.priority = payload.priority.upper()
    if payload.title is not None:
        item.title = payload.title

    db.commit()
    db.refresh(item)
    return ChecklistItemResponse.model_validate(item)


@router.delete("/checklist/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found")

    checklist = item.checklist
    if checklist.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    db.delete(item)
    db.commit()
    return None

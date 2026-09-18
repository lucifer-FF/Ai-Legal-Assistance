from app.models.document import Document
from app.models.checklist import Checklist, ChecklistItem
import uuid


def test_checklist_flow(client, db_session, normal_user, auth_headers):
    doc = Document(
        id=str(uuid.uuid4()),
        user_id=normal_user.id,
        title="Checklist Test Contract",
        original_filename="doc.txt",
        file_path="dummy.txt",
        file_size=100,
        file_type="txt",
        processing_status="COMPLETED"
    )
    chk_id = str(uuid.uuid4())
    checklist = Checklist(
        id=chk_id,
        document_id=doc.id,
        user_id=normal_user.id,
        title=f"Checklist for {doc.title}"
    )
    item = ChecklistItem(
        id=str(uuid.uuid4()),
        checklist_id=chk_id,
        title="Confirm 60-day notice window",
        category="Review",
        priority="HIGH",
        is_completed=False,
        section_ref="Section 8.2"
    )

    db_session.add_all([doc, checklist, item])
    db_session.commit()

    # Get checklist
    res = client.get(f"/api/v1/documents/{doc.id}/checklist", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["is_completed"] is False

    # Update item (mark complete)
    item_id = data["items"][0]["id"]
    patch_res = client.patch(
        f"/api/v1/checklist/items/{item_id}",
        json={"is_completed": True, "notes": "Noted in executive calendar"},
        headers=auth_headers
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["is_completed"] is True
    assert patch_res.json()["notes"] == "Noted in executive calendar"

    # Add custom item
    add_res = client.post(
        f"/api/v1/documents/{doc.id}/checklist/items",
        json={
            "title": "Verify insurance endorsement",
            "category": "Verification",
            "priority": "MEDIUM",
            "section_ref": "Section 6.1"
        },
        headers=auth_headers
    )
    assert add_res.status_code == 201
    assert add_res.json()["title"] == "Verify insurance endorsement"


def test_admin_endpoints_and_rbac(client, normal_user, auth_headers, admin_auth_headers):
    # Normal user should be rejected from admin endpoint (403)
    user_res = client.get("/api/v1/admin/statistics", headers=auth_headers)
    assert user_res.status_code == 403

    # Admin should succeed (200)
    admin_res = client.get("/api/v1/admin/statistics", headers=admin_auth_headers)
    assert admin_res.status_code == 200
    stats = admin_res.json()
    assert "total_users" in stats
    assert "total_documents" in stats
    assert "success_rate_percent" in stats

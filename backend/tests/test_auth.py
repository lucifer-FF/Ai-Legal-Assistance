def test_register_user_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "Password123!",
            "full_name": "New User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == "USER"


def test_register_existing_email_fails(client, normal_user):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": normal_user.email,
            "password": "Password123!",
            "full_name": "Duplicate User"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success(client, normal_user):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": normal_user.email,
            "password": "SecretPassword123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == normal_user.email


def test_login_invalid_password(client, normal_user):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": normal_user.email,
            "password": "WrongPassword!"
        }
    )
    assert response.status_code == 401


def test_get_current_user(client, auth_headers, normal_user):
    response = client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == normal_user.email
    assert data["id"] == normal_user.id


def test_unauthorized_access_fails(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401

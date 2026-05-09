def test_signup_creates_user_and_sets_cookie(client):
    resp = client.post(
        "/auth/signup",
        json={"email": "new@example.com", "name": "New User", "password": "secret123"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "new@example.com"
    assert "access_token" in resp.cookies


def test_signup_duplicate_email_returns_409(client):
    payload = {"email": "dup@example.com", "name": "Dup User", "password": "secret123"}
    client.post("/auth/signup", json=payload)
    resp = client.post("/auth/signup", json=payload)
    assert resp.status_code == 409


def test_login_happy_path(client, test_user):
    resp = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.cookies


def test_get_me_returns_authenticated_user(client, test_user):
    client.post("/auth/login", json={"email": "test@example.com", "password": "password123"})
    resp = client.get("/me")
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"

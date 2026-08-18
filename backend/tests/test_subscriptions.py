def test_subscription_checkout_and_upgrade(client):
    admin_res = client.post("/api/v1/auth/register", json={
        "name": "Admin Pro",
        "email": "admin@procorp.com",
        "password": "password123",
        "role": "company_admin",
        "company_name": "ProCorp"
    })
    admin_token = admin_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Checkout session
    chk_res = client.post("/api/v1/subscriptions/create-checkout-session?plan=Pro", headers=headers)
    assert chk_res.status_code == 200
    assert "checkout_url" in chk_res.json()
    session_id = chk_res.json()["session_id"]

    # Confirm upgrade
    up_res = client.post(f"/api/v1/subscriptions/confirm-upgrade?session_id={session_id}", headers=headers)
    assert up_res.status_code == 200
    assert up_res.json()["plan"] == "Pro"

    # Verify active org subscription plan is Pro
    org_res = client.get("/api/v1/organizations/my-org", headers=headers)
    assert org_res.json()["subscription_plan"] == "Pro"

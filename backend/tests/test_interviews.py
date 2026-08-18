from datetime import datetime, timedelta

def test_interview_scheduling_and_overlap_prevention(client):
    # Register Admin & Candidate
    admin_res = client.post("/api/v1/auth/register", json={
        "name": "Admin Three",
        "email": "admin3@firm.com",
        "password": "password123",
        "role": "company_admin",
        "company_name": "Firm Inc"
    })
    admin_token = admin_res.json()["access_token"]
    admin_id = admin_res.json()["user"]["id"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    job_res = client.post("/api/v1/jobs/", json={
        "title": "Frontend Lead",
        "description": "React Developer",
        "location": "San Francisco"
    }, headers=admin_headers)
    job_id = job_res.json()["id"]

    cand_res = client.post("/api/v1/auth/register", json={
        "name": "Candidate Three",
        "email": "cand3@gmail.com",
        "password": "password123",
        "role": "candidate"
    })
    cand_token = cand_res.json()["access_token"]
    cand_app = client.post("/api/v1/applications/apply", json={"job_id": job_id}, headers={"Authorization": f"Bearer {cand_token}"})
    app_id = cand_app.json()["id"]

    # Schedule interview
    slot_time = (datetime.utcnow() + timedelta(days=2)).isoformat()
    inv_res = client.post("/api/v1/interviews/schedule", json={
        "application_id": app_id,
        "interviewer_id": admin_id,
        "interview_date": slot_time
    }, headers=admin_headers)
    assert inv_res.status_code == 200
    assert inv_res.json()["status"] == "scheduled"
    assert "meeting_link" in inv_res.json()

    # Try to schedule overlapping interview at exact same time -> Should fail with 400!
    overlap_res = client.post("/api/v1/interviews/schedule", json={
        "application_id": app_id,
        "interviewer_id": admin_id,
        "interview_date": slot_time
    }, headers=admin_headers)
    assert overlap_res.status_code == 400
    assert "Interview slot conflict" in overlap_res.json()["detail"]

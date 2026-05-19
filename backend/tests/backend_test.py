"""
Psycheveda backend test suite.

Modules under test:
  - Health
  - Auth (register/login/me)
  - Pillars + suggestions + onboarding selection
  - Goals creation (days + hours) + mini-task generation
  - Tasks today + completion toggle (+5 bless)
  - Journal create / 2/day quota / list grouped / gratitude bonus (+3)
  - Stats summary
"""

import os
import time
import math
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fallback to frontend .env so the suite still runs when env not exported
    env_path = "/app/frontend/.env"
    if os.path.exists(env_path):
        for line in open(env_path):
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break
BASE_URL = (BASE_URL or "").rstrip("/")
API = f"{BASE_URL}/api"

TS = int(time.time())
FRESH_EMAIL = f"tester+{TS}@psyche.app"
FRESH_PASSWORD = "Test1234"
FRESH_NAME = "Fresh Seeker"

SEEDED_EMAIL = "seeker@psyche.app"
SEEDED_PASSWORD = "Test1234"


# ---------------- session fixtures ----------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def fresh_auth(session):
    r = session.post(f"{API}/auth/register", json={
        "email": FRESH_EMAIL, "password": FRESH_PASSWORD, "full_name": FRESH_NAME
    })
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    return data["token"], data["user"]


@pytest.fixture(scope="session")
def fresh_headers(fresh_auth):
    return {"Authorization": f"Bearer {fresh_auth[0]}"}


@pytest.fixture(scope="session")
def seeded_headers(session):
    r = session.post(f"{API}/auth/login", json={
        "email": SEEDED_EMAIL, "password": SEEDED_PASSWORD
    })
    if r.status_code != 200:
        pytest.skip(f"seeded account login failed: {r.status_code}")
    return {"Authorization": f"Bearer {r.json()['token']}"}


# ---------------- Health ----------------
def test_health(session):
    r = session.get(f"{API}/health")
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "ok"
    assert body.get("service") == "psycheveda"


# ---------------- Auth ----------------
def test_register_returns_jwt_and_user(fresh_auth):
    token, user = fresh_auth
    assert isinstance(token, str) and len(token) > 20
    assert user["email"] == FRESH_EMAIL
    assert user["full_name"] == FRESH_NAME
    assert user["bless_points_balance"] == 0
    assert user["onboarding_complete"] is False


def test_register_duplicate_email(session, fresh_auth):
    r = session.post(f"{API}/auth/register", json={
        "email": FRESH_EMAIL, "password": FRESH_PASSWORD, "full_name": "Dup"
    })
    assert r.status_code == 400


def test_login_success(session):
    r = session.post(f"{API}/auth/login", json={
        "email": FRESH_EMAIL, "password": FRESH_PASSWORD
    })
    assert r.status_code == 200
    assert "token" in r.json()


def test_login_invalid_password(session):
    r = session.post(f"{API}/auth/login", json={
        "email": FRESH_EMAIL, "password": "WrongPass!"
    })
    assert r.status_code == 401


def test_me_returns_user(session, fresh_headers):
    r = session.get(f"{API}/auth/me", headers=fresh_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == FRESH_EMAIL


def test_me_requires_auth(session):
    r = session.get(f"{API}/auth/me")
    assert r.status_code == 401


# ---------------- Pillars ----------------
EXPECTED_PILLARS = {
    "family_relationship", "career_business",
    "finance_money", "health", "inner_wellness",
}


def test_list_pillars(session):
    r = session.get(f"{API}/pillars")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 5
    keys = {p["key"] for p in data}
    assert keys == EXPECTED_PILLARS
    for p in data:
        assert "label" in p and p["label"]


@pytest.mark.parametrize("pillar", sorted(EXPECTED_PILLARS))
def test_suggestions_per_pillar(session, fresh_headers, pillar):
    r = session.get(f"{API}/pillars/{pillar}/suggestions", headers=fresh_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["pillar"] == pillar
    assert len(body["suggestions"]) == 5


def test_suggestions_unknown_pillar(session, fresh_headers):
    r = session.get(f"{API}/pillars/bogus/suggestions", headers=fresh_headers)
    assert r.status_code == 404


def test_set_selected_pillars(session, fresh_headers):
    r = session.post(f"{API}/onboarding/pillars", headers=fresh_headers,
                     json={"pillars": ["health", "inner_wellness"]})
    assert r.status_code == 200
    # verify persisted via /auth/me
    me = session.get(f"{API}/auth/me", headers=fresh_headers).json()
    assert me["onboarding_complete"] is True


# ---------------- Goals + Mini-tasks ----------------
def test_create_goal_days_creates_n_tasks(session, fresh_headers):
    payload = {
        "pillar": "health",
        "title": "TEST_walk_8k_steps",
        "estimate_unit": "days",
        "estimate_value": 5,
    }
    r = session.post(f"{API}/goals", headers=fresh_headers, json=payload)
    assert r.status_code == 200, r.text
    goal = r.json()
    assert goal["pillar"] == "health"
    assert goal["estimate_value"] == 5
    assert len(goal["mini_tasks"]) == 5
    # scheduled_for unique consecutive
    dates = [t["scheduled_for"] for t in goal["mini_tasks"]]
    assert len(set(dates)) == 5


def test_create_goal_hours_collapses_to_ceil_div24(session, fresh_headers):
    # 50 hours -> ceil(50/24) = 3 days
    payload = {
        "pillar": "career_business",
        "title": "TEST_hours_goal",
        "estimate_unit": "hours",
        "estimate_value": 50,
    }
    r = session.post(f"{API}/goals", headers=fresh_headers, json=payload)
    assert r.status_code == 200, r.text
    goal = r.json()
    assert len(goal["mini_tasks"]) == math.ceil(50 / 24)


def test_list_goals_returns_created(session, fresh_headers):
    r = session.get(f"{API}/goals", headers=fresh_headers)
    assert r.status_code == 200
    titles = [g["title"] for g in r.json()]
    assert "TEST_walk_8k_steps" in titles
    assert "TEST_hours_goal" in titles


def test_tasks_today_only_today(session, fresh_headers):
    r = session.get(f"{API}/tasks/today", headers=fresh_headers)
    assert r.status_code == 200
    items = r.json()
    # at least 2 today tasks (Day 1 from both goals)
    assert len(items) >= 2
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).date().isoformat()
    for t in items:
        assert t["scheduled_for"] == today


def test_toggle_task_grants_bless_5(session, fresh_headers):
    me_before = session.get(f"{API}/auth/me", headers=fresh_headers).json()
    bal_before = me_before["bless_points_balance"]
    items = session.get(f"{API}/tasks/today", headers=fresh_headers).json()
    assert items, "no tasks to toggle"
    task_id = items[0]["id"]
    r = session.patch(f"{API}/tasks/{task_id}", headers=fresh_headers)
    assert r.status_code == 200
    assert r.json()["completed"] is True
    me_after = session.get(f"{API}/auth/me", headers=fresh_headers).json()
    assert me_after["bless_points_balance"] == bal_before + 5


def test_toggle_task_unauthorized_other_user(session, fresh_headers):
    items = session.get(f"{API}/tasks/today", headers=fresh_headers).json()
    if not items:
        pytest.skip("no tasks")
    task_id = items[0]["id"]
    # call without auth
    r = session.patch(f"{API}/tasks/{task_id}")
    assert r.status_code == 401


# ---------------- Journal ----------------
def _journal_payload(period="morning", with_gratitude=False):
    body = {
        "situation": "TEST_situation: I felt rushed all morning.",
        "natural_emotion": "anxious",
        "nlp_frame": "Responsibility",
        "ease_of_transition": 7,
        "end_feeling": "calm and centred",
        "period": period,
    }
    if with_gratitude:
        body["bless_gratitude"] = "Grateful for sunrise tea"
    return body


def test_journal_create_and_gratitude_bonus(session):
    # use a fresh user to avoid mixing with seeded account quota
    email = f"journaler+{int(time.time()*1000)}@psyche.app"
    reg = session.post(f"{API}/auth/register", json={
        "email": email, "password": "Test1234", "full_name": "Journal Tester"
    })
    assert reg.status_code == 200
    h = {"Authorization": f"Bearer {reg.json()['token']}"}

    bal0 = session.get(f"{API}/auth/me", headers=h).json()["bless_points_balance"]

    r1 = session.post(f"{API}/journal", headers=h, json=_journal_payload("morning"))
    assert r1.status_code == 200, r1.text
    bal1 = session.get(f"{API}/auth/me", headers=h).json()["bless_points_balance"]
    assert bal1 == bal0 + 10  # +10 journal

    r2 = session.post(f"{API}/journal", headers=h,
                      json=_journal_payload("evening", with_gratitude=True))
    assert r2.status_code == 200, r2.text
    bal2 = session.get(f"{API}/auth/me", headers=h).json()["bless_points_balance"]
    assert bal2 == bal1 + 10 + 3  # +10 + 3 gratitude

    # third entry should be blocked
    r3 = session.post(f"{API}/journal", headers=h, json=_journal_payload("morning"))
    assert r3.status_code == 400


def test_journal_list_grouped_by_date(session, seeded_headers):
    r = session.get(f"{API}/journal", headers=seeded_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    if data:
        # date-wise descending
        dates = [d["date"] for d in data]
        assert dates == sorted(dates, reverse=True)
        for d in data:
            assert "entries" in d


def test_seeded_account_quota_already_full(session, seeded_headers):
    r = session.post(f"{API}/journal", headers=seeded_headers,
                     json=_journal_payload("morning"))
    # If seed promise of 2 entries holds, third should fail.
    if r.status_code == 200:
        pytest.skip("seeded account did not have 2 entries today")
    assert r.status_code == 400


# ---------------- Stats ----------------
def test_stats(session, fresh_headers):
    r = session.get(f"{API}/stats", headers=fresh_headers)
    assert r.status_code == 200
    s = r.json()
    for k in ["bless_points_balance", "veda_streak", "total_goals",
              "tasks_completed_today", "journal_entries_today"]:
        assert k in s
    assert s["total_goals"] >= 2


# ---------------- HPA Phase hint ----------------
def test_hpa_axis_phase(session):
    r = session.get(f"{API}/hpa-axis/phase")
    assert r.status_code == 200
    assert r.json()["phase"] in {"cortisol_am", "twilight", "melatonin_pm"}

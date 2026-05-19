"""
Psycheveda Backend (FastAPI + MongoDB)
======================================
MVP API server bridging behavioral psychology (CBT/NLP) with Vedic wellness.

Modules covered:
  • Authentication (JWT email/password)
  • Pillar-based AI goal suggestions (5 pillars × 5 simulated suggestions + 1 custom)
  • Goal creation with auto-generated Daily Mini-Tasks (days|hours estimate → deadline)
  • NLP Cognitive Reframing Journal (5-step pipeline, max 2 entries/day)
  • Rule-based Bless ledger + Veda Streak counter
  • Mongo collection schema mirrors the Supabase PostgreSQL migration in
    /app/database/supabase_migration.sql so the storage layer is portable.

All endpoints are mounted under /api so the K8s ingress routes them to :8001.
"""

from __future__ import annotations

import os
import uuid
import math
from datetime import datetime, timedelta, timezone, date
from typing import Optional, List, Literal

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field, field_validator
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt, JWTError

# ----------------------------------------------------------------------------
# Environment + clients
# ----------------------------------------------------------------------------
load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS = int(os.environ.get("JWT_EXPIRE_HOURS", "168"))

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

app = FastAPI(title="Psycheveda API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------------
# Constants — Pillars & simulated AI suggestions
# ----------------------------------------------------------------------------
PILLARS = [
    "family_relationship",
    "career_business",
    "finance_money",
    "health",
    "inner_wellness",
]

PILLAR_LABELS = {
    "family_relationship": "Family & Relationship",
    "career_business": "Career & Business",
    "finance_money": "Finance & Money",
    "health": "Health",
    "inner_wellness": "Inner Wellness",
}

# 5 suggestions per pillar – simulated AI engine output (deterministic for MVP).
GOAL_SUGGESTIONS: dict[str, list[str]] = {
    "family_relationship": [
        "Hold a 20-minute screen-free conversation with my partner daily",
        "Write one appreciation note to a family member each week",
        "Schedule a recurring Sunday family ritual (meal or walk)",
        "Resolve a long-pending miscommunication with a sibling",
        "Plan and host a small family gathering within the timeframe",
    ],
    "career_business": [
        "Ship one meaningful deliverable that stretches my comfort zone",
        "Build a focused learning loop in a high-leverage skill",
        "Network intentionally with 3 mentors or peers each week",
        "Publish a portfolio piece or thought-leadership article",
        "Map and pitch a new revenue stream or initiative",
    ],
    "finance_money": [
        "Track every rupee/dollar of spending into a clean ledger",
        "Cut three recurring expenses and redirect into savings",
        "Open and fund a dedicated emergency reserve",
        "Begin a small, consistent investing habit (SIP/DCA)",
        "Read one personal-finance book and apply 3 lessons",
    ],
    "health": [
        "Walk 8,000 steps every day with intent",
        "Sleep before 11pm and wake by sunrise consistently",
        "Cook at least one whole-food meal daily",
        "Complete a 30-minute movement practice (yoga/strength)",
        "Hydrate to 2.5L per day and cut sugary drinks",
    ],
    "inner_wellness": [
        "Practice 10 minutes of stillness meditation each morning",
        "Maintain a daily gratitude entry of three blessings",
        "Take a weekly digital sabbath for 4 hours",
        "Read 10 pages of a wisdom/scripture text daily",
        "Perform a weekly self-reflection retrospective",
    ],
}

NLP_FRAMES = [
    "Cause & Effect",
    "Result & Excuse",
    "Mind & Body as One System",
    "Perception is Projection",
    "Responsibility",
]

# Bless rule-book
BLESS_PER_TASK = 5
BLESS_PER_JOURNAL = 0          # journaling no longer awards bless (moved to gratitude)
BLESS_PER_GRATITUDE = 0        # legacy in-journal field — no longer awards bless
BLESS_PER_GRATITUDE_ENTRY = 15 # awarded for the dedicated daily gratitude ritual (3 points)


# ----------------------------------------------------------------------------
# Pydantic models
# ----------------------------------------------------------------------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    bless_points_balance: int
    veda_streak: int
    last_activity_date: Optional[str] = None
    onboarding_complete: bool
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class GoalCreate(BaseModel):
    pillar: Literal[
        "family_relationship",
        "career_business",
        "finance_money",
        "health",
        "inner_wellness",
    ]
    title: str = Field(min_length=2, max_length=240)
    estimate_unit: Literal["days", "hours"]
    estimate_value: int = Field(ge=1, le=365)
    mini_task_template: Optional[str] = None  # optional one-liner used for daily tasks


class MiniTaskOut(BaseModel):
    id: str
    goal_id: str
    title: str
    scheduled_for: str  # YYYY-MM-DD
    completed: bool
    completed_at: Optional[datetime] = None


class GoalOut(BaseModel):
    id: str
    pillar: str
    pillar_label: str
    title: str
    estimate_unit: str
    estimate_value: int
    deadline_at: datetime
    created_at: datetime
    mini_tasks: List[MiniTaskOut]


class JournalCreate(BaseModel):
    situation: str = Field(min_length=2, max_length=2000)
    natural_emotion: str = Field(min_length=1, max_length=120)
    nlp_frame: Literal[
        "Cause & Effect",
        "Result & Excuse",
        "Mind & Body as One System",
        "Perception is Projection",
        "Responsibility",
    ]
    ease_of_transition: int = Field(ge=1, le=10)
    end_feeling: str = Field(min_length=1, max_length=240)
    period: Literal["morning", "evening"]
    bless_gratitude: Optional[str] = Field(default=None, max_length=500)

    @field_validator("bless_gratitude")
    @classmethod
    def _gratitude_only_pm(cls, v, info):
        # gratitude is optional; allowed any time but recommended in evening
        return v


class JournalOut(BaseModel):
    id: str
    situation: str
    natural_emotion: str
    nlp_frame: str
    ease_of_transition: int
    end_feeling: str
    period: str
    bless_gratitude: Optional[str]
    created_at: datetime
    entry_date: str


class StatsOut(BaseModel):
    bless_points_balance: int
    veda_streak: int
    last_activity_date: Optional[str]
    total_goals: int
    tasks_completed_today: int
    journal_entries_today: int
    gratitude_logged_today: bool


class GratitudeCreate(BaseModel):
    point_1: str = Field(min_length=1, max_length=240)
    point_2: str = Field(min_length=1, max_length=240)
    point_3: str = Field(min_length=1, max_length=240)


class GratitudeOut(BaseModel):
    id: str
    point_1: str
    point_2: str
    point_3: str
    entry_date: str
    created_at: datetime


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def today_iso() -> str:
    return now_utc().date().isoformat()


def hash_password(p: str) -> str:
    return pwd_context.hash(p)


def verify_password(p: str, h: str) -> bool:
    return pwd_context.verify(p, h)


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": now_utc() + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": now_utc(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def serialize_user(user: dict) -> UserPublic:
    return UserPublic(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        bless_points_balance=user.get("bless_points_balance", 0),
        veda_streak=user.get("veda_streak", 0),
        last_activity_date=user.get("last_activity_date"),
        onboarding_complete=user.get("onboarding_complete", False),
        created_at=user["created_at"],
    )


def compute_deadline(unit: str, value: int) -> datetime:
    if unit == "hours":
        return now_utc() + timedelta(hours=value)
    return now_utc() + timedelta(days=value)


def generate_mini_tasks(goal_id: str, title: str, template: Optional[str],
                        unit: str, value: int) -> list[dict]:
    """Break the goal into daily mini-tasks. Hour-estimates collapse to a single
    same-day task; day-estimates generate one task per day until the deadline."""
    label = template.strip() if template else f"Daily action: {title}"
    tasks: list[dict] = []
    if unit == "hours":
        days_span = max(1, math.ceil(value / 24))
    else:
        days_span = value
    start = now_utc().date()
    for i in range(days_span):
        scheduled = (start + timedelta(days=i)).isoformat()
        tasks.append({
            "id": str(uuid.uuid4()),
            "goal_id": goal_id,
            "title": label if days_span == 1 else f"Day {i + 1}: {label}",
            "scheduled_for": scheduled,
            "completed": False,
            "completed_at": None,
            "created_at": now_utc(),
        })
    return tasks


async def record_bless(user_id: str, delta: int, reason: str, ref_id: str) -> None:
    """Append a bless ledger row and update the user's balance + streak."""
    await db.bless_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "delta": delta,
        "reason": reason,
        "ref_id": ref_id,
        "created_at": now_utc(),
    })
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return
    today = today_iso()
    last = user.get("last_activity_date")
    new_streak = user.get("veda_streak", 0)
    if last == today:
        pass  # already counted today
    elif last is None:
        new_streak = 1
    else:
        last_date = date.fromisoformat(last)
        diff = (date.fromisoformat(today) - last_date).days
        new_streak = new_streak + 1 if diff == 1 else 1
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bless_points_balance": delta},
         "$set": {"veda_streak": new_streak, "last_activity_date": today}},
    )


# ----------------------------------------------------------------------------
# Health
# ----------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "psycheveda", "time": now_utc().isoformat()}


# ----------------------------------------------------------------------------
# Auth
# ----------------------------------------------------------------------------
@app.post("/api/auth/register", response_model=AuthResponse)
async def register(payload: UserCreate):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": payload.email.lower(),
        "full_name": payload.full_name.strip(),
        "password_hash": hash_password(payload.password),
        "bless_points_balance": 0,
        "veda_streak": 0,
        "last_activity_date": None,
        "onboarding_complete": False,
        "selected_pillars": [],
        "created_at": now_utc(),
    }
    await db.users.insert_one(user_doc.copy())
    token = create_token(user_doc["id"])
    return AuthResponse(token=token, user=serialize_user(user_doc))


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(payload: UserLogin):
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"])
    return AuthResponse(token=token, user=serialize_user(user))


@app.get("/api/auth/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return serialize_user(user)


# ----------------------------------------------------------------------------
# Onboarding & Pillars
# ----------------------------------------------------------------------------
@app.get("/api/pillars")
async def list_pillars():
    return [{"key": k, "label": PILLAR_LABELS[k]} for k in PILLARS]


@app.get("/api/pillars/{pillar}/suggestions")
async def goal_suggestions(pillar: str, user: dict = Depends(get_current_user)):
    if pillar not in GOAL_SUGGESTIONS:
        raise HTTPException(status_code=404, detail="Unknown pillar")
    return {
        "pillar": pillar,
        "pillar_label": PILLAR_LABELS[pillar],
        "suggestions": GOAL_SUGGESTIONS[pillar],
    }


class PillarsSelection(BaseModel):
    pillars: List[str]


@app.post("/api/onboarding/pillars")
async def set_selected_pillars(payload: PillarsSelection,
                               user: dict = Depends(get_current_user)):
    for p in payload.pillars:
        if p not in PILLARS:
            raise HTTPException(status_code=400, detail=f"Unknown pillar: {p}")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"selected_pillars": payload.pillars,
                  "onboarding_complete": True}},
    )
    return {"ok": True, "selected_pillars": payload.pillars}


# ----------------------------------------------------------------------------
# Goals + Mini-tasks
# ----------------------------------------------------------------------------
async def _serialize_goal(goal: dict) -> GoalOut:
    tasks_cursor = db.mini_tasks.find({"goal_id": goal["id"]}, {"_id": 0}).sort("scheduled_for", 1)
    tasks = [MiniTaskOut(**t) async for t in tasks_cursor]
    return GoalOut(
        id=goal["id"],
        pillar=goal["pillar"],
        pillar_label=PILLAR_LABELS.get(goal["pillar"], goal["pillar"]),
        title=goal["title"],
        estimate_unit=goal["estimate_unit"],
        estimate_value=goal["estimate_value"],
        deadline_at=goal["deadline_at"],
        created_at=goal["created_at"],
        mini_tasks=tasks,
    )


@app.post("/api/goals", response_model=GoalOut)
async def create_goal(payload: GoalCreate, user: dict = Depends(get_current_user)):
    goal_id = str(uuid.uuid4())
    deadline = compute_deadline(payload.estimate_unit, payload.estimate_value)
    goal_doc = {
        "id": goal_id,
        "user_id": user["id"],
        "pillar": payload.pillar,
        "title": payload.title.strip(),
        "estimate_unit": payload.estimate_unit,
        "estimate_value": payload.estimate_value,
        "deadline_at": deadline,
        "created_at": now_utc(),
    }
    await db.goals.insert_one(goal_doc.copy())
    tasks = generate_mini_tasks(goal_id, payload.title, payload.mini_task_template,
                                payload.estimate_unit, payload.estimate_value)
    if tasks:
        await db.mini_tasks.insert_many([t.copy() for t in tasks])
    return await _serialize_goal(goal_doc)


@app.get("/api/goals", response_model=List[GoalOut])
async def list_goals(user: dict = Depends(get_current_user)):
    goals_cursor = db.goals.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    out: list[GoalOut] = []
    async for g in goals_cursor:
        out.append(await _serialize_goal(g))
    return out


@app.get("/api/tasks/today", response_model=List[MiniTaskOut])
async def tasks_today(user: dict = Depends(get_current_user)):
    today = today_iso()
    goal_ids = [g["id"] async for g in db.goals.find({"user_id": user["id"]}, {"id": 1, "_id": 0})]
    cursor = db.mini_tasks.find(
        {"goal_id": {"$in": goal_ids}, "scheduled_for": today},
        {"_id": 0},
    ).sort("created_at", 1)
    return [MiniTaskOut(**t) async for t in cursor]


@app.patch("/api/tasks/{task_id}", response_model=MiniTaskOut)
async def toggle_task(task_id: str, user: dict = Depends(get_current_user)):
    task = await db.mini_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    goal = await db.goals.find_one({"id": task["goal_id"], "user_id": user["id"]}, {"_id": 0})
    if not goal:
        raise HTTPException(status_code=403, detail="Not your task")
    if task["completed"]:
        # Toggle off – revoke bless points (one-time +5 each completion)
        await db.mini_tasks.update_one(
            {"id": task_id},
            {"$set": {"completed": False, "completed_at": None}},
        )
        await record_bless(user["id"], -BLESS_PER_TASK, "mini_task_undone", task_id)
    else:
        await db.mini_tasks.update_one(
            {"id": task_id},
            {"$set": {"completed": True, "completed_at": now_utc()}},
        )
        await record_bless(user["id"], BLESS_PER_TASK, "mini_task_done", task_id)
    refreshed = await db.mini_tasks.find_one({"id": task_id}, {"_id": 0})
    return MiniTaskOut(**refreshed)


# ----------------------------------------------------------------------------
# Journal
# ----------------------------------------------------------------------------
@app.get("/api/journal/frames")
async def journal_frames():
    return {"frames": NLP_FRAMES}


@app.post("/api/journal", response_model=JournalOut)
async def create_journal(payload: JournalCreate, user: dict = Depends(get_current_user)):
    today = today_iso()
    count_today = await db.journal_entries.count_documents({
        "user_id": user["id"],
        "entry_date": today,
    })
    if count_today >= 2:
        raise HTTPException(status_code=400,
                            detail="Daily journal limit reached (max 2 entries per day)")
    entry_id = str(uuid.uuid4())
    doc = {
        "id": entry_id,
        "user_id": user["id"],
        "situation": payload.situation.strip(),
        "natural_emotion": payload.natural_emotion.strip(),
        "nlp_frame": payload.nlp_frame,
        "ease_of_transition": payload.ease_of_transition,
        "end_feeling": payload.end_feeling.strip(),
        "period": payload.period,
        "bless_gratitude": payload.bless_gratitude.strip() if payload.bless_gratitude else None,
        "entry_date": today,
        "created_at": now_utc(),
    }
    await db.journal_entries.insert_one(doc.copy())
    # NOTE: journaling no longer awards Bless Points (BLESS_PER_JOURNAL = 0).
    # Bless is now exclusively earned via the dedicated daily Gratitude ritual.
    if BLESS_PER_JOURNAL:
        await record_bless(user["id"], BLESS_PER_JOURNAL, "journal_entry", entry_id)
    if doc["bless_gratitude"] and BLESS_PER_GRATITUDE:
        await record_bless(user["id"], BLESS_PER_GRATITUDE, "bless_gratitude", entry_id)
    return JournalOut(**{k: doc[k] for k in JournalOut.model_fields.keys()})


@app.get("/api/journal")
async def list_journal(user: dict = Depends(get_current_user)):
    cursor = db.journal_entries.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    grouped: dict[str, list[dict]] = {}
    async for e in cursor:
        grouped.setdefault(e["entry_date"], []).append(JournalOut(
            **{k: e[k] for k in JournalOut.model_fields.keys()}
        ).model_dump(mode="json"))
    # date-wise descending
    sorted_keys = sorted(grouped.keys(), reverse=True)
    return [{"date": d, "entries": grouped[d]} for d in sorted_keys]


# ----------------------------------------------------------------------------
# Stats
# ----------------------------------------------------------------------------
@app.get("/api/stats", response_model=StatsOut)
async def stats(user: dict = Depends(get_current_user)):
    today = today_iso()
    total_goals = await db.goals.count_documents({"user_id": user["id"]})
    goal_ids = [g["id"] async for g in db.goals.find({"user_id": user["id"]}, {"id": 1, "_id": 0})]
    tasks_today_done = await db.mini_tasks.count_documents({
        "goal_id": {"$in": goal_ids},
        "scheduled_for": today,
        "completed": True,
    })
    journal_today = await db.journal_entries.count_documents({
        "user_id": user["id"],
        "entry_date": today,
    })
    gratitude_today = await db.gratitude_entries.count_documents({
        "user_id": user["id"],
        "entry_date": today,
    })
    return StatsOut(
        bless_points_balance=user.get("bless_points_balance", 0),
        veda_streak=user.get("veda_streak", 0),
        last_activity_date=user.get("last_activity_date"),
        total_goals=total_goals,
        tasks_completed_today=tasks_today_done,
        journal_entries_today=journal_today,
        gratitude_logged_today=gratitude_today > 0,
    )


# ----------------------------------------------------------------------------
# Gratitude — dedicated daily 3-point ritual (sole source of Bless Points
# besides mini-task completion). Limited to one entry per user per day.
# ----------------------------------------------------------------------------
@app.post("/api/gratitude", response_model=GratitudeOut)
async def create_gratitude(payload: GratitudeCreate, user: dict = Depends(get_current_user)):
    today = today_iso()
    existing = await db.gratitude_entries.find_one({
        "user_id": user["id"],
        "entry_date": today,
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Gratitude already logged today — return tomorrow with a fresh heart.",
        )
    entry_id = str(uuid.uuid4())
    doc = {
        "id": entry_id,
        "user_id": user["id"],
        "point_1": payload.point_1.strip(),
        "point_2": payload.point_2.strip(),
        "point_3": payload.point_3.strip(),
        "entry_date": today,
        "created_at": now_utc(),
    }
    await db.gratitude_entries.insert_one(doc.copy())
    await record_bless(user["id"], BLESS_PER_GRATITUDE_ENTRY, "gratitude_entry", entry_id)
    return GratitudeOut(**{k: doc[k] for k in GratitudeOut.model_fields.keys()})


@app.get("/api/gratitude")
async def list_gratitude(user: dict = Depends(get_current_user)):
    cursor = db.gratitude_entries.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    grouped: dict[str, list[dict]] = {}
    async for e in cursor:
        grouped.setdefault(e["entry_date"], []).append(GratitudeOut(
            **{k: e[k] for k in GratitudeOut.model_fields.keys()}
        ).model_dump(mode="json"))
    sorted_keys = sorted(grouped.keys(), reverse=True)
    return [{"date": d, "entries": grouped[d]} for d in sorted_keys]


# ----------------------------------------------------------------------------
# Premium HPA Axis (server hint — actual visual swap is client-side per spec)
# ----------------------------------------------------------------------------
@app.get("/api/hpa-axis/phase")
async def hpa_axis_phase():
    """Returns server's UTC hint; client uses local time for actual palette switch."""
    h = datetime.now().hour  # server local
    if 5 <= h < 14:
        phase = "cortisol_am"
    elif 17 <= h or h < 5:
        phase = "melatonin_pm"
    else:
        phase = "twilight"
    return {"phase": phase, "server_hour": h}

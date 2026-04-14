# 🎓 EduAdapt — AI-Powered Adaptive Learning Platform

> An intelligent exam preparation platform that reads student mood, adapts quiz difficulty in real-time, and generates personalized 7-day study plans with curated video resources.

![EduAdapt](https://img.shields.io/badge/EduAdapt-AI%20Learning-teal?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-FastAPI-blue?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)

---

## ✨ Features

### 🎭 Mood-Adaptive Learning Engine
- **5 mood states:** Focused 🔥, Okay 😊, Confused 😕, Tired 😴, Frustrated 😤
- Quiz difficulty automatically adjusts based on mood
- Tired students get fewer, easier questions; focused students get full challenge
- Mood history tracked in database for analytics

### 🐱 AI Pet Study Buddy
- Floating companion that greets, encourages, and guides students
- **Idle detection** — nudges after 2 minutes of inactivity
- **Struggle detection** — 3 wrong answers triggers support mode with video suggestions
- State-based animations (bounce, wave, pulse, glow)

### 📊 Adaptive Assessment
- 150+ questions across Mathematics, Physics, and Chemistry
- 60% weak topics / 40% strong topics allocation
- Avoids repeating questions from last 3 attempts
- Per-topic accuracy tracking and weak area identification

### 📅 Personalized 7-Day Study Plan
- Auto-generated based on diagnostic test results
- **Days 1-3:** Intensive focus on weak topics
- **Days 4-5:** Mixed review
- **Day 6:** Full revision
- **Day 7:** Simulated test
- Embedded YouTube videos from Khan Academy, 3Blue1Brown, Physics Wallah
- Practice questions with answers inside each day

### 🤖 AI Tutor Chatbot
- Mood-aware responses — adapts tone based on student state
- Concept explanations for MPC subjects
- Video recommendations from curated library
- Performance-based suggestions using real test data

### 🎨 Premium Dark Mode UI
- Glassmorphism design with frosted glass cards
- Animated gradient backgrounds and floating particles
- Micro-animations on hover, click, and state changes
- Custom scrollbar and gradient accent lines

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS v4, Custom Glassmorphism |
| **State** | Zustand |
| **UI Components** | shadcn/ui |
| **Backend** | Python FastAPI |
| **Database** | SQLite + SQLAlchemy ORM |
| **AI Engine** | Custom adaptive algorithm (mood × performance matrix) |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup
```bash
cd eduadapt
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd eduadapt/web
npm install
npm run dev
```

### Access
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 🌍 Deploy & Share (free hosting)

This project is **FastAPI (backend)** + **Next.js (frontend)**. For a shareable link, the easiest free setup is:

- **Frontend**: Vercel (best for Next.js)
- **Backend**: Render (simple FastAPI deploy; may sleep on free tier)

### 1) Deploy the backend (FastAPI) on Render

- Create a new Render **Web Service** from your GitHub repo
- **Runtime**: Python
- **Start command**:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

- Add an environment variable (optional): `PYTHON_VERSION=3.11`
- After deploy, copy your backend URL (example: `https://your-api.onrender.com`)

### 2) Deploy the frontend (Next.js) on Vercel

- Import the repo into Vercel
- Set **Root Directory** to `web`
- Add Environment Variable:
  - `NEXT_PUBLIC_API_URL` = your Render backend URL (no trailing slash)
- Deploy and share the Vercel link

### 3) Run locally (step-by-step)

In one terminal (backend):

```bash
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal (frontend):

```bash
cd web
npm install
copy .env.local.example .env.local
npm run dev
```

### Notes
- For Android builds (Capacitor), set `NEXT_PUBLIC_API_URL` to the hosted backend URL (HTTPS recommended).
- If your backend is sleeping on a free tier, the first request after idle may be slow.

---

## 📁 Project Structure

```
eduadapt/
├── main.py                  # FastAPI app entry point
├── database.py              # SQLAlchemy setup
├── seed_data.py             # Question bank seeder
├── models/
│   ├── db_models.py         # Database models (Student, Question, MoodLog)
│   └── schemas.py           # Pydantic schemas
├── routes/
│   ├── test.py              # Daily test generation + submission
│   ├── mood.py              # Mood API (POST/GET)
│   ├── analysis.py          # Performance analysis
│   ├── plan.py              # Study plan generation
│   ├── questions.py         # Question bank CRUD
│   └── students.py          # Student management
├── services/
│   ├── test_generator.py    # Adaptive test algorithm + mood engine
│   ├── plan_generator.py    # 7-day study plan builder
│   ├── weak_areas.py        # Performance analysis engine
│   └── llm_integration.py   # LLM integration module (extensible)
└── web/                     # Next.js frontend
    ├── app/
    │   ├── layout.tsx        # Root layout (dark mode)
    │   ├── page.tsx          # Main page with AI Pet overlay
    │   └── globals.css       # Premium dark theme + animations
    ├── components/
    │   ├── ai-pet.tsx        # Floating AI companion
    │   ├── navigation.tsx    # Glassmorphism header
    │   ├── registration-form.tsx
    │   ├── quiz-section.tsx  # Mood-adaptive quiz
    │   ├── progress-dashboard.tsx
    │   ├── topics-section.tsx # Study plan + YouTube embeds
    │   └── ai-chatbot.tsx    # Mood-aware tutor
    └── lib/
        ├── store.ts          # Zustand state (mood, streaks)
        ├── api.ts            # Backend API client
        └── youtube-data.ts   # Curated video library
```

---

## 🎭 Mood System — How It Works

```
Student sets mood via AI Pet → Mood saved to DB → Quiz API called with mood param
                                                        ↓
                                              Difficulty distribution adjusted:
                                              - Focused: 30E/40M/30H (12 Qs)
                                              - Confused: 50E/40M/10H (10 Qs)
                                              - Tired:    60E/40M/0H  (8 Qs)
```

**Automatic detection:**
- 3 wrong answers in a row → AI Pet triggers with video suggestion
- 2 minutes idle → AI Pet sends encouragement message

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/students` | Register new student |
| GET | `/students` | List all students |
| GET | `/daily-test?student_id=1&mood=focused` | Generate adaptive test |
| POST | `/submit-test` | Submit answers for evaluation |
| POST | `/analyze` | Analyze performance |
| POST | `/generate-plan` | Generate 7-day study plan |
| POST | `/mood` | Update student mood |
| GET | `/mood/{student_id}` | Get current mood |
| GET | `/questions` | Browse question bank |
| GET | `/docs` | Swagger API documentation |

---

## 👥 Team

Built at [Hackathon Name] 2026

---

## 📄 License

MIT License

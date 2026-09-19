# GroupPulse — AI Group Discussion Platform

An intelligent, rubric-first AI Group Discussion (GD) simulation and assessment platform built for B.Tech campus placements (TCS, Infosys, Amazon, Microsoft, Wipro, Accenture) and MBA admissions (IIMs, Deloitte, McKinsey).

GroupPulse simulates a real-time 5-candidate GD roundtable with autonomous AI personas, realistic conversational dynamics, instant "Steal the Mic" floor interventions, deterministic speech metrics computation, and automated evaluation against standard placement criteria.

---

## The Standard 5-Parameter Campus Rubric

The evaluation pipeline scores candidates across the standard 5-parameter rubric used across university recruitment drives and MBA admissions panels:

| # | Parameter | Weight | Assessment Method |
|---|---|---|---|
| 1 | **Content Quality & Relevance** | 25% | Anchor-locked LLM evaluation against fixed performance scales (0–2, 3–5, 6–8, 9–10) |
| 2 | **Communication & Fluency** | 25% | 50% computed metrics (WPM, filler word ratio, cadence) + 50% qualitative evaluation |
| 3 | **Leadership & Initiative** | 20% | Objective transcript analysis (discussion opener, new subtopics introduced, floor assertiveness) + LLM synthesis |
| 4 | **Listening & Team Behavior** | 20% | Objective metrics (interruptions made vs. received, references to peers by name) |
| 5 | **Analytical & Reasoning Ability** | 10% | Structural reasoning analysis (trade-offs, evidence citation, counter-argument handling) |

---

## Core Features

### 1. Pre-Session Orientation (`RubricExplainer`)
- Interactive orientation module detailing the 5 parameters, scoring weights, and 4 anchor levels (`0–2` Deficient, `3–5` Average, `6–8` Placement Ready, `9–10` Top Percentile).
- Placement strategy pro-tips for each parameter to guide candidates before starting the session.

### 2. Curated Placement GD Topics
- Comprehensive database of current GD topics categorized by:
  - **Technology & AI** (e.g., *Generative AI Impact on Software Engineering*, *DPDP Act & Privacy vs. Innovation*, *EV Infrastructure Readiness*)
  - **Economy & Business** (e.g., *India at $5 Trillion: Manufacturing vs. Services*, *Startup Winter & Governance*, *UPI & Digital Financial Inclusion*)
  - **Social & Current Affairs** (e.g., *Moonlighting in Tech*, *Economic Growth vs. Climate Sustainability*)
  - **Abstract & Lateral Thinking** (e.g., *Speed vs. Perfection*, *Knowledge vs. Wisdom*)
- Includes target company tags, difficulty tiers, and structured thinking frameworks (PESTLE, Two-Way Door decisions, Short vs. Long Term).

### 3. Interactive 5-Candidate Roundtable Room
- **4 Autonomous AI Personas**:
  - **Ananya Iyer**: Strategic Leader & Discussion Organizer
  - **Aarav Patel**: Data & Quantitative Systems Analyst
  - **Priya Sharma**: Consensus Builder & Empathetic Mediator
  - **Rohan Verma**: Contrarian & Critical Challenger
- **"Steal the Mic" Interruption Engine**: Real-time floor takeover mechanism that halts active speech, logs interruption events, and captures candidate arguments.
- **Speech Synthesis & Recognition**: Full voice interaction via Web Speech API with tailored pitches, rates, and accents for each persona, plus instant keyboard fallback.
- **Synchronized Transcript Feed**: Live chronological record of all candidate interventions and peer exchanges.

### 4. Comprehensive Performance Scorecard
- **5-Axis Radar Chart**: Spider visualization mapping candidate strengths against campus placement thresholds.
- **Deterministic Metrics Strip**: Exact talk time, speaking pace (WPM), filler word count, floor interventions, peer references, and subtopic novelty.
- **Criterion-by-Criterion Deep Dive**: Individual score, weight, achieved anchor band, and 1-line evidence justification.
- **Full Transcript Replay**: Chronological archive of the entire session with speaker labels and timing.

---

## Project Architecture

```
speckle-gd-srijan/
├── backend/                        # High-performance Go Backend Engine
│   ├── cmd/server/main.go          # Unified server entrypoint
│   ├── pkg/
│   │   ├── auth/                   # Crypto magic links & JWT issuance/revocation
│   │   ├── config/                 # Environment configuration loader
│   │   ├── db/                     # pgxpool PostgreSQL 16 connection pool
│   │   ├── gemini/                 # Google Gemini multimodal audio evaluator
│   │   ├── models/                 # Database models, REST DTOs, real-time events
│   │   ├── redis/                  # Ephemeral turn-taking state & pub/sub
│   │   └── statemachine/           # Sub-millisecond state machine & adaptive silence timer
│   └── services/
│       ├── apigateway/             # Go Fiber REST API Gateway
│       ├── sessiondirector/        # Roundtable state supervisor
│       ├── analysispipeline/       # STT and body language analyzer
│       └── reportgenerator/        # Post-session grading pipeline (Groq + Gemini)
│
├── frontend/                       # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── banani_designs/         # 12 Banani MCP imported screen components
│   │   ├── components/             # Reusable UI adapters (Icon, Image)
│   │   ├── App.tsx                 # Master view router with Web Speech API
│   │   └── index.css               # Design tokens and theme styling
│   ├── vite.config.ts
│   └── package.json
│
├── migrations/                     # PostgreSQL database migration scripts
│   ├── 000001_init_schema.sql      # 13 relational tables
│   └── 000002_seed_data.sql        # Seed data (topics, cohorts, personas)
│
├── docker-compose.yml              # PostgreSQL 16, Redis 7 & Redis Commander
├── start.bat                       # 1-click startup script for Windows
├── DESIGN_HANDOFF_SPEC.md          # Full design system & REST API specification
└── .env.example                    # Environment variables template
```

---

## Getting Started

### 1. Start Database & Redis (Docker)

```powershell
docker compose up -d
```

### 2. Start Backend Server (Port 8000)

```powershell
cd backend
go run ./cmd/server
```

*(Optional: Provide a `GROQ_API_KEY` for real-time persona dialogue and `GEMINI_API_KEY` for multimodal candidate audio evaluation in `.env`.)*

### 3. Start Frontend Client (Port 3000)

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

Alternatively, on Windows, double-click `start.bat` in the root folder to start all services together.

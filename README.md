# Space Observatory — Multi-Agent System

> **Real-time AI agents scanning deep-space telescope feeds for exoplanets, black hole signals, and galaxy morphology.**

```
space-observatory-agents/
├── frontend/          Next.js 14 + Tailwind CSS — dark starfield UI
├── backend/           FastAPI — REST + WebSocket API
├── agents/            Autonomous AI observation agents
├── pipelines/         Telescope telemetry & catalogue validation
└── docker-compose.yml Full-stack local orchestration
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                           │
│  ┌─────────────┐  ┌──────────┐  ┌───────────────┐  ┌───────────┐  │
│  │ Observatory │  │Sky Map   │  │ Discoveries   │  │ Telemetry │  │
│  │   (home)    │  │(canvas)  │  │  (catalogue)  │  │  (log)    │  │
│  └──────┬──────┘  └────┬─────┘  └───────┬───────┘  └─────┬─────┘  │
│         └──────────────┴────────────────┴─────────────────┘        │
│                  useObservatorySocket (WebSocket hook)              │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  ws://host:8000/ws/observatory
┌───────────────────────────▼─────────────────────────────────────────┐
│                       Backend (FastAPI)                             │
│  ┌──────────────────┐   ┌──────────────────┐   ┌─────────────────┐ │
│  │  WS Connection   │   │  REST Routers    │   │  ObservatoryState│ │
│  │    Manager       │   │  /api/agents     │   │  (in-memory)    │ │
│  │  (broadcast)     │   │  /api/discoveries│   │                 │ │
│  └────────┬─────────┘   └──────────────────┘   └────────┬────────┘ │
│           │                                              │          │
│  ┌────────▼─────────────────────────────────────────────▼────────┐ │
│  │                      Agent Runner (asyncio)                   │ │
│  └────────┬─────────────────────────────────────────────────────┘  │
└───────────┼─────────────────────────────────────────────────────────┘
            │  asyncio.gather()
┌───────────▼────────────────────────────────────────────────────────┐
│                        Agents Layer                                │
│                                                                    │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Coordinator   │  │ Exoplanet Hunter │  │  BH Signal       │   │
│  │  (orchestrator)│  │  (BLS transit    │  │  Hunter (matched │   │
│  │                │  │   detection)     │  │  filter GW/X-ray)│   │
│  └────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                    │
│  ┌──────────────────┐   ┌──────────────────────────────────────┐   │
│  │ Galaxy Classifier│   │      Pipelines                       │   │
│  │  (CNN morphology)│   │  TelescopeTelemetrySimulator         │   │
│  │                  │   │  CatalogueValidator                  │   │
│  └──────────────────┘   └──────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### Message Flow

Every agent and pipeline emits **typed WebSocket events** via the shared `ConnectionManager`:

| Event          | Payload                                         | Consumer              |
|----------------|-------------------------------------------------|-----------------------|
| `snapshot`     | `{ agents[], discoveries[] }`                   | New WS client         |
| `agent_update` | `AgentState` partial                            | `useObservatorySocket`|
| `discovery`    | Full discovery object                           | Sky Map + Timeline    |
| `telemetry`    | `{ timestamp, source, level, message }`         | TelemetryFeed         |
| `pong`         | `{}`                                            | Keepalive reply       |

---

## Directory Reference

### `frontend/`

```
src/
├── app/
│   ├── layout.tsx           Root layout — Navbar + StarfieldCanvas + footer
│   ├── page.tsx             Observatory home — hero + agent grid + sky map
│   ├── globals.css          Tailwind base + custom utility classes
│   ├── agents/page.tsx      Agent fleet control panel
│   ├── sky-map/page.tsx     Full-sky RA/Dec canvas + discovery table
│   ├── discoveries/page.tsx Catalogue with type stats
│   └── telemetry/page.tsx   Full-height scrollable telemetry log
├── components/
│   ├── StarfieldCanvas.tsx  Animated WebGL-free starfield on <canvas>
│   ├── Navbar.tsx           Sticky top nav with active-link highlight
│   ├── AgentStatusCard.tsx  Per-agent status, confidence bar, stats
│   ├── SkyMapMini.tsx       Canvas RA/Dec projection with glow markers
│   ├── TelemetryFeed.tsx    Colour-coded terminal-style log scroll
│   └── DiscoveryTimeline.tsx Scrollable list of recent detections
└── hooks/
    └── useObservatorySocket.ts  Auto-reconnecting WS hook + state management
```

**Colour palette** (`tailwind.config.ts`):

| Token              | Value       | Usage                        |
|--------------------|-------------|------------------------------|
| `cosmos-950`       | `#03010a`   | Page background              |
| `cosmos-900`       | `#07021a`   | Card surface                 |
| `nebula-purple`    | `#7c3aed`   | Accent / glow                |
| `nebula-cyan`      | `#06b6d4`   | Data values / highlights     |
| `star-white`       | `#f0f4ff`   | Primary text                 |
| `star-yellow`      | `#fbbf24`   | Exoplanet markers            |

---

### `backend/`

```
backend/
├── main.py              FastAPI app factory + lifespan (agent startup)
├── config.py            Pydantic Settings (env vars / .env file)
├── state.py             Thread-safe in-memory ObservatoryState singleton
├── ws/
│   ├── __init__.py
│   └── manager.py       ConnectionManager — async broadcast to all clients
├── routers/
│   ├── __init__.py
│   ├── observatory.py   WS endpoint /ws/observatory + snapshot-on-connect
│   ├── agents.py        GET /api/agents, GET /api/agents/{id}
│   └── discoveries.py   GET /api/discoveries (filterable + paginated)
└── services/
    ├── __init__.py
    └── agent_runner.py  AgentRunner — asyncio.gather for all agents
```

**Key design decisions:**
- `ObservatoryState` is a single in-memory singleton protected by `threading.Lock`. Replace with a Redis-backed store for multi-process/multi-host deployments.
- Each new WebSocket client receives a `snapshot` event containing the full current state, so late-joining browsers hydrate immediately without waiting for the next tick.
- All agent I/O is `asyncio`-native — no threads or thread pools needed.

---

### `agents/`

```
agents/
├── __init__.py
├── base_agent.py         BaseAgent ABC — run loop, _update_status, _emit_discovery
├── coordinator.py        CoordinatorAgent — target dispatching + cross-validation
├── exoplanet_hunter.py   ExoplanetHunterAgent — BLS transit detection simulation
├── blackhole_hunter.py   BlackHoleHunterAgent — matched-filter GW/X-ray analysis
└── galaxy_classifier.py  GalaxyClassifierAgent — CNN Hubble-type morphology
```

#### `BaseAgent` contract

```python
class MyAgent(BaseAgent):
    agent_id = "my-agent"
    name     = "My Agent"
    role     = "CUSTOM ROLE"
    icon     = "🔭"
    interval = 5.0           # seconds between ticks

    async def tick(self) -> None:
        # one unit of observation work
        await self._update_status("processing", "Scanning…")
        await self._emit_discovery(name, type, ra, dec, confidence, description)
        await self._emit_telemetry("info", "Done.")
```

#### Per-agent algorithm summary

| Agent                 | Algorithm                            | Detection threshold |
|-----------------------|--------------------------------------|---------------------|
| **CoordinatorAgent**  | Priority queue + cross-validation    | N/A (orchestration) |
| **ExoplanetHunterAgent** | Box Least Squares (BLS) SNR      | SNR ≥ 70%           |
| **BlackHoleHunterAgent** | Matched-filter GW strain + FALAP | SNR ≥ 8.0 σ         |
| **GalaxyClassifierAgent**| CNN softmax + Sérsic index hints | Confidence ≥ 65%    |

---

### `pipelines/`

```
pipelines/
├── __init__.py
├── telemetry_simulator.py    TelescopeTelemetrySimulator — realistic housekeeping logs
└── catalog_validator.py      CatalogueValidator — cross-match + SOA-ID assignment
```

#### `TelescopeTelemetrySimulator`

Emits JSON telemetry entries (info / data / warn / error) every 0.8–2.5 s
drawn from templated messages covering: field slewing, guide-star acquisition,
detector read-out, filter changes, seeing conditions, and fault events.

#### `CatalogueValidator`

Cross-matches candidate coordinates against a mock reference catalogue
using a Haversine angular-separation calculation. Returns:

- `"new"` — no match within radius → assigns `SOA-YYYY-XXXXXX` identifier
- `"known"` — positional coincidence with existing object
- `"duplicate_candidate"` — within 3× match radius, needs manual review

---

## Quick Start

### Local (dev mode)

```bash
# 1. Backend
cd space-observatory-agents
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev          # → http://localhost:3001
```

### Docker Compose

```bash
cd space-observatory-agents
docker compose up --build
# Frontend  → http://localhost:3000
# Backend   → http://localhost:8000
# Swagger   → http://localhost:8000/docs
```

### Environment variables

| Variable                    | Default                    | Description                    |
|-----------------------------|----------------------------|--------------------------------|
| `REDIS_URL`                 | `redis://localhost:6379`   | Redis connection (optional)    |
| `LOG_LEVEL`                 | `info`                     | structlog level                |
| `EXOPLANET_SCAN_INTERVAL`   | `4.0`                      | Seconds between BLS scans      |
| `BLACKHOLE_SCAN_INTERVAL`   | `6.0`                      | Seconds between GW checks      |
| `GALAXY_SCAN_INTERVAL`      | `8.0`                      | Seconds between CNN runs       |
| `COORDINATOR_HEARTBEAT`     | `2.0`                      | Coordinator tick rate (s)      |
| `NEXT_PUBLIC_API_URL`       | `http://localhost:8000`    | Frontend → backend HTTP URL    |
| `NEXT_PUBLIC_WS_URL`        | `ws://localhost:8000`      | Frontend → backend WS URL      |

---

## REST API

| Method | Path                        | Description                           |
|--------|-----------------------------|---------------------------------------|
| `GET`  | `/health`                   | Liveness check                        |
| `GET`  | `/api/agents`               | All agent states                      |
| `GET`  | `/api/agents/{id}`          | Single agent                          |
| `GET`  | `/api/discoveries`          | Discovery catalogue (filterable)      |
| `GET`  | `/api/discoveries/stats`    | Count by type                         |
| `WS`   | `/ws/observatory`           | Live event stream                     |

Interactive docs: **http://localhost:8000/docs**

---

## Extending the System

### Add a new agent

1. Create `agents/my_new_agent.py` subclassing `BaseAgent`
2. Implement `tick()` using `_update_status`, `_emit_discovery`, `_emit_telemetry`
3. Instantiate in [`backend/services/agent_runner.py`](backend/services/agent_runner.py) and add to `asyncio.gather()`
4. Add a matching card in [`frontend/src/components/AgentStatusCard.tsx`](frontend/src/components/AgentStatusCard.tsx)

### Add a new pipeline

1. Create `pipelines/my_pipeline.py` with an `async def run()` loop
2. Inject the `ConnectionManager` and call `manager.broadcast(event, payload)`
3. Register in `AgentRunner.run_all()`

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 14, React 18, TypeScript        |
| Styling    | Tailwind CSS 3, custom keyframes        |
| Charts     | Recharts (available for future panels)  |
| Backend    | FastAPI, Uvicorn, Pydantic v2           |
| Realtime   | Native WebSocket (browser ↔ FastAPI)    |
| Science    | NumPy, SciPy, Astropy                   |
| Logging    | structlog                               |
| Containers | Docker, Docker Compose                  |
| Cache/Pub  | Redis (optional, for multi-process)     |

---

*Space Observatory Agents — a template for multi-agent AI systems with real-time streaming UIs.*

<div align="center">

# 🚑 Handoff — Emergency Continuity & Triage Record

**One link. One scan. Nothing gets lost between the first rescuer and the paramedic.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TanStack Router](https://img.shields.io/badge/TanStack_Router-v1-ff4154?logo=tanstack&logoColor=white)](https://tanstack.com/router)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-v8-646cff?logo=vite&logoColor=white)](https://vite.dev/)

[**Live Demo**](https://aesthetic-assemblyarchitect.lovable.app) · [**Explore Documentation**](#-architecture--key-modules) · [**Report Issue**](../../issues)

</div>

---

## 📖 Overview

In emergency response situations, critical information frequently gets fragmented or lost during handover—from the initial bystander or first responder on scene to secondary responders and incoming emergency medical services (EMS).

**Handoff** is a rapid-response digital triage record application designed for high-stress, time-critical situations. It allows anyone on the scene to speak or type what they observe in natural language, automatically structuring the report into clinical triage points, tracking a live chronological timeline, flagging critical physiological changes, and facilitating instantaneous handover via dynamic QR codes.

---

## ✨ Key Features

- **🎙️ Voice & Natural Language Capture**: Responders can dictate hands-free or type short observations without worrying about medical jargon.
- **🧠 Automated Triage & Clinical Structuring**: Heuristic & AI-ready pipeline that classifies consciousness, respiratory status, suspected trauma locations, and priority triage level (`high` vs `normal`).
- **📲 Instant QR Code Handover**: Generates on-the-fly scannable QR codes and unique record links so incoming paramedics can immediately scan, review, and assume care.
- **⏱️ Immutable Chronological Timeline**: Every observation, status update, and timestamped change is preserved in sequence to maintain clear continuity of care.
- **⚠️ Critical Change & Escalation Detection**: Automatically flags critical deterioration (e.g., loss of consciousness, cessation of breathing, vomiting following head trauma, seizures, and severe hemorrhage).
- **🔒 Privacy & Local-First Resiliency**: Operates offline-first and stores records securely in on-device storage (`localStorage`) with zero mandatory cloud lock-in.
- **🎨 High-Stress Emergency UI**: Designed with calming, high-contrast, distraction-free visual aesthetics for optimal readability in extreme field conditions.

---

## 🛠️ Tech Stack

| Category              | Technology                                                                             |
| --------------------- | -------------------------------------------------------------------------------------- |
| **Framework**         | [React 19](https://react.dev/) + [TanStack Start](https://tanstack.com/start)          |
| **Routing**           | [TanStack Router](https://tanstack.com/router) (File-based routing)                    |
| **Language**          | [TypeScript](https://www.typescriptlang.org/) (Strict Mode)                            |
| **Styling**           | [Tailwind CSS v4](https://tailwindcss.com/) + CSS Design Tokens                        |
| **UI Components**     | [Radix UI Primitives](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/) |
| **Data & State**      | Local-First Storage + [TanStack Query](https://tanstack.com/query)                     |
| **Bundler & Tooling** | [Vite 8](https://vite.dev/) + [Bun](https://bun.sh/) / [Node.js](https://nodejs.org/)  |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have one of the following package managers installed:

- [Node.js](https://nodejs.org/) (v20+ recommended) and `npm` or `pnpm`
- Alternatively, [Bun](https://bun.sh/) (v1.2+)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd aesthetic-assemblyarchitect
   ```

2. **Install dependencies:**

   ```bash
   # Using npm
   npm install

   # Or using bun
   bun install
   ```

3. **Start the local development server:**

   ```bash
   npm run dev
   # or
   bun run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 📂 Project Structure

```
.
├── src/
│   ├── components/            # Reusable UI & triage components
│   │   ├── AppHeader.tsx      # Application header & status indicator
│   │   ├── IncidentForm.tsx   # Voice & text incident intake form
│   │   ├── StepNav.tsx        # Stage navigation component
│   │   └── ui/                # Radix UI primitives & design tokens
│   ├── lib/                   # Core business logic & state managers
│   │   ├── incidents.ts       # Storage, timeline, heuristic & AI analysis
│   │   ├── useVoiceInput.ts   # Hands-free speech-to-text Web Speech hook
│   │   └── utils.ts           # Classnames & styling helpers
│   ├── routes/                # File-based routing (TanStack Start)
│   │   ├── __root.tsx         # Root layout shell
│   │   ├── index.tsx          # Incident creation landing page
│   │   ├── incident.$id.index.tsx   # Live emergency record & timeline view
│   │   ├── incident.$id.share.tsx   # QR code & link sharing view
│   │   └── incident.$id.update.tsx  # Add sequential observation / update
│   ├── styles.css             # Tailwind v4 imports, gradients & design variables
│   └── start.ts / server.ts   # TanStack Start application server entrypoints
├── public/                    # Static public assets
├── package.json               # Dependencies and scripts
└── vite.config.ts             # Vite configuration
```

---

## 📜 Available Scripts

- `npm run dev` — Starts the development server with Hot Module Replacement (HMR).
- `npm run build` — Compiles and builds the application for production.
- `npm run preview` — Previews the production build locally.
- `npm run lint` — Runs ESLint across all TypeScript and React files.
- `npm run format` — Formats source code using Prettier.

---

## 🔌 AI & API Integration Extension Points

Handoff includes pre-configured integration hooks located in [`src/lib/incidents.ts`](src/lib/incidents.ts) to connect external Large Language Model (LLM) APIs (e.g., Google Gemini, OpenAI, or Anthropic):

1. **Initial Record Parsing (`analyzeInitialReport`)**:
   - Converts unstructured bystander speech/text into structured clinical parameters (`consciousness`, `breathing`, `trauma_suspected[]`, `priority`, `summary`).
2. **Sequential Delta Analysis (`analyzeUpdate`)**:
   - Evaluates state changes across consecutive updates and flags critical medical escalations in real-time.

> **Note**: For server-side AI model execution, configure your API keys in environment variables via Nitro / TanStack Start server routes rather than exposing them on the client.

---

## ⚠️ Medical & Emergency Disclaimer

> [!IMPORTANT]
> **Handoff is a communication and field-documentation tool.** It is designed to assist with continuity of information and does not replace certified medical triage systems, official emergency dispatch (e.g., 911 / 112 / 999), or professional emergency medical judgment. In any life-threatening situation, always contact your local emergency services immediately.

---

## 📄 License & Commercial Terms

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see the [LICENSE](LICENSE) file for complete details.

### Strong Copyleft Protection
- **Reciprocal Open Source**: Any distribution or network-hosted service (SaaS/web deployment) incorporating or modifying this codebase **must also release its complete source code under the same AGPLv3 license**.
- **Commercial & Proprietary Inquiries**: If you intend to integrate this software into a proprietary system, closed-source product, or private commercial service without releasing your modifications under the AGPLv3, you must contact the author to negotiate a custom commercial / dual-licensing agreement.

# Voice-Enabled Task Tracker

A full-stack Kanban-style task tracker with voice input and basic natural-language parsing. Users can:

- Create, edit, and delete tasks.
- Organize tasks on a 3-column board (To Do / In Progress / Done) with drag-and-drop.
- Record tasks via voice; the backend parses the transcript into title, description, due date, priority, and status suggestions.

This README is structured for the **SDE Assignment - Voice-Enabled Task Tracker** and explains the project from end to end.

---

## 1. Project Setup

### 1.a Prerequisites

**Core tools**

- **Node.js**: >= **20.x** recommended (works with modern Vite + Fastify + Prisma).
- **npm**: comes with Node (you can use pnpm/yarn if you prefer, but commands below use `npm`).
- **PostgreSQL**: >= **14** (any recent version is fine).

**Backend environment variables** (in `backend/.env`)

Copy `backend/.env.example` to `.env`:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/voice_task_tracker?schema=public"
PORT=4000
```

- `DATABASE_URL` must point to a valid Postgres instance.
- `PORT` is the HTTP port for the Fastify backend.

**Frontend environment variables** (in `frontend/.env`)

Create `frontend/.env` (no example file is provided):

```env
# URL of the backend Fastify server
VITE_API_BASE_URL="http://localhost:4000"

# Optional: Supabase, currently **not required** for core flows
VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_KEY"
```

Notes:

- If you run the backend on `http://localhost:4000`, `VITE_API_BASE_URL` can be omitted because the frontend defaults to `http://localhost:4000` in `src/api/client.ts`.
- Supabase is wired in as an experimental integration (`src/integrations/supabase`), but the core task and voice flows use the Fastify backend directly.

**API keys / AI providers**

- There is **no external AI provider** (no OpenAI / Anthropic, etc.).
- Voice parsing uses **local heuristics + `chrono-node`** for date extraction.
- Browser speech recognition uses the **Web Speech API** (Chrome / Edge), so no API key is needed.

**Email configuration**

- This repository **does not implement email sending or receiving**.
- All flows are driven by HTTP APIs and the web UI.
- See [Decisions & Assumptions](#4-decisions--assumptions) for how this relates to the assignment requirements.

---

### 1.b Install Steps (Frontend & Backend)

#### Backend

From the project root:

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations (creates tables in your Postgres DB)
npm run prisma:migrate
```

If this is the first time, `prisma migrate` will create the `voice_task_tracker` database (if it doesnt exist) and apply the `User`, `Task`, and `VoiceNote` models from `prisma/schema.prisma`.

#### Frontend

In a separate terminal, from the project root:

```bash
cd frontend

# Install dependencies
npm install
```

Thats enough to run locally. See the next section for actual run commands.

---

### 1.c Email Sending / Receiving Configuration

This implementation **does not currently support email sending or receiving**.

Assignment mapping:

- If the assignment expects end-to-end email ingestion (e.g., tasks created from incoming emails, notifications sent by email), that layer would need to be implemented on top of this codebase.
- At the moment, all state changes (creating tasks, completing tasks, etc.) are surfaced via the web UI and HTTP APIs only.

How you *could* extend it (not implemented):

- Add an email provider (e.g., Resend, SendGrid, AWS SES) in `backend/src/modules/email`.
- Expose webhook endpoints like `POST /api/email/inbound` and map email bodies into the existing `Task` model.
- Send notification emails from task lifecycle hooks in the task repository or via Fastify hooks.

This README focuses on the **actual code** in this repo rather than hypothetical future email features.

---

### 1.d How to Run Everything Locally

1. **Start Postgres**
   - Ensure your Postgres server is running and that `DATABASE_URL` in `backend/.env` is correct.

2. **Run backend (Fastify + Prisma)**

   ```bash
   cd backend
   npm run dev
   ```

   - Starts a Fastify server on `http://localhost:4000` (configurable via `PORT`).
   - Exposes `/health`, `/api/tasks`, and `/api/voice-notes` endpoints.

3. **Run frontend (Vite + React)**

   In another terminal:

   ```bash
   cd frontend
   npm run dev
   ```

   - Vite will start on something like `http://localhost:5173`.
   - The frontend talks to the backend via `VITE_API_BASE_URL` (default `http://localhost:4000`).

4. **Open the app**

   - Go to `http://localhost:5173` in your browser.
   - You should see the **Voice Task Tracker** UI with columns and filters.

---

### 1.e Seed Data / Initial Scripts

There is **no dedicated seed script**. Common ways to populate data:

- Use the **web UI**:
  - Click **Add Task** to create a manual task.
  - Or use **Voice Input** to create tasks via speech.

- Use **HTTP requests** (e.g., via `curl` or Postman):

```bash
# Create a task
curl -X POST "http://localhost:4000/api/tasks" \
  -H "Content-Type: application/json" \
  -H "x-user-id: local-dev-user" \
  -d '{
    "title": "Set up project",
    "description": "Install deps and run migrations",
    "status": "PENDING",
    "priority": "MEDIUM"
  }'
```

If you want a full seed script, you can easily add one (e.g., `backend/src/scripts/seed.ts` using the Prisma client) and run it with `tsx` or `npm run`.

---

## 2. Tech Stack

### 2.a Frontend

- **Framework**: React 18, TypeScript
- **Bundler / Dev server**: Vite
- **UI kit**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS
- **Routing**: `react-router-dom`
- **State / data fetching**: `@tanstack/react-query`
- **Drag and drop**: `react-beautiful-dnd`
- **Icons**: `lucide-react`
- **Notifications / toasts**: `sonner` and a custom toast hook (`src/hooks/use-toast.ts`)
- **Voice input**: Browser **Web Speech API** (no external SDK)

Key frontend directories:

- `frontend/src/pages/Index.tsx`  main Kanban board + filters + DnD + voice flows.
- `frontend/src/components/TaskCard.tsx`  individual task card UI.
- `frontend/src/components/TaskDialog.tsx`  create/edit task modal.
- `frontend/src/components/VoiceInput.tsx`  voice recording dialog using Web Speech API.
- `frontend/src/components/VoiceReviewDialog.tsx`  review/confirm parsed voice task.
- `frontend/src/api/tasks.ts`  React Query hooks for backend `/api/tasks`.
- `frontend/src/api/voice.ts`  React Query hooks for `/api/voice-notes`.
- `frontend/src/lib/mappers.ts`  maps backend enums to UI-friendly types and back.

### 2.b Backend

- **Runtime / platform**: Node.js + TypeScript
- **Web framework**: Fastify 5
- **ORM**: Prisma 6
- **Validation**: `zod`
- **Date parsing**: `chrono-node`
- **Security / middleware**:
  - `@fastify/helmet` for security headers
  - `@fastify/cors` for CORS
  - `@fastify/rate-limit` for basic rate limiting

Key backend files:

- `backend/src/index.ts`  bootstraps Fastify, plugins, health check, and module routes.
- `backend/src/lib/prisma.ts`  Prisma client singleton.
- `backend/prisma/schema.prisma`  DB models.
- `backend/src/modules/tasks/*`  task routes, controllers, repositories, and schemas.
- `backend/src/modules/voice/*`  voice note parsing and task creation.
- `backend/src/plugins/ensure-user.ts`  ensures a per-user row exists based on `x-user-id`.

### 2.c Database

- **DB**: PostgreSQL
- **Prisma schema** (`backend/prisma/schema.prisma`):

```prisma
model User {
  id        String  @id @default(cuid())
  email     String  @unique
  name      String?
  tasks     Task[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?
  status      TaskStatus   @default(PENDING)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  userId      String?
  user        User?        @relation(fields: [userId], references: [id])
  voiceNote   VoiceNote?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([userId, createdAt])
}

model VoiceNote {
  id         String  @id @default(cuid())
  audioUrl   String?
  transcript String?
  taskId     String? @unique
  task       Task?   @relation(fields: [taskId], references: [id])
  createdAt  DateTime @default(now())
}
```

### 2.d AI Provider & Email Solution

- **AI provider**: none. Parsing is implemented via:
  - Regex-based heuristics in `backend/src/modules/voice/voice.repository.ts` for priority and status.
  - `chrono-node` for extracting date/time from natural language.
- **Email solution**: not implemented. See [1.c](#1c-email-sending--receiving-configuration).

---

## 3. API Documentation

### 3.1 Conventions

- All responses are JSON.
- Errors use a consistent envelope in many cases:
  - 400 validation errors (Zod): `{ "errors": { ...flattenedZodErrors } }`
  - 404 not found: `{ "error": { "message": "Route not found", "path": "/..." } }`
  - 500+ internal errors: `{ "error": { "message": "Internal server error" } }` in production.
- **User scoping**:
  - The frontend generates a browser-specific user ID and sends it in `x-user-id` header (see `frontend/src/api/client.ts`).
  - Backend uses this to scope tasks per user.

### 3.2 Health Check

#### `GET /health`

**Description**: Check if the server and DB are reachable.

**Response 200**:

```json
{
  "status": "ok",
  "db": "up"
}
```

If DB is down:

```json
{
  "status": "degraded",
  "db": "down"
}
```

---

### 3.3 Tasks API

#### `GET /api/tasks`

**Description**: List tasks for the current user (based on `x-user-id`). If no `x-user-id` is provided, returns all tasks.

**Headers**:

- `x-user-id: <string>` (optional but recommended)

**Response 200** (example):

```json
[
  {
    "id": "clxy...",
    "title": "Set up project",
    "description": "Install deps and run migrations",
    "status": "PENDING",
    "priority": "MEDIUM",
    "dueDate": null,
    "userId": "local-dev-user",
    "createdAt": "2025-12-02T06:45:23.123Z",
    "updatedAt": "2025-12-02T06:45:23.123Z"
  }
]
```

#### `POST /api/tasks`

**Description**: Create a new task.

**Headers**:

- `Content-Type: application/json`
- `x-user-id: <string>` (optional; if provided, the task is scoped to that user, and a `User` row is upserted if needed).

**Request body** (`CreateTaskInput`):

```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "status": "PENDING" | "IN_PROGRESS" | "DONE" (optional),
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" (optional),
  "dueDate": "ISO-8601 datetime string" (optional)
}
```

Example:

```json
{
  "title": "Finish assignment",
  "description": "Write README and polish UI",
  "status": "PENDING",
  "priority": "HIGH",
  "dueDate": "2025-12-03T23:59:59.000Z"
}
```

**Response 201**:

```json
{
  "id": "clxz...",
  "title": "Finish assignment",
  "description": "Write README and polish UI",
  "status": "PENDING",
  "priority": "HIGH",
  "dueDate": "2025-12-03T23:59:59.000Z",
  "userId": "local-dev-user",
  "createdAt": "2025-12-02T07:00:00.000Z",
  "updatedAt": "2025-12-02T07:00:00.000Z"
}
```

**Response 400** (validation error):

```json
{
  "errors": {
    "fieldErrors": {
      "title": ["String must contain at least 1 character(s)"]
    },
    "formErrors": []
  }
}
```

#### `PATCH /api/tasks/:id`

**Description**: Update an existing task.

**Headers**: same as POST.

**Path params**:

- `id`: task ID (string)

**Request body** (`UpdateTaskInput`, all fields optional):

```json
{
  "title": "New title (optional)",
  "description": "Updated description (optional)",
  "status": "PENDING" | "IN_PROGRESS" | "DONE" (optional),
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" (optional),
  "dueDate": "ISO-8601 datetime string" (optional)
}
```

**Response 200**:

- Returns the updated `Task` record in the same shape as `POST /api/tasks`.

**Response 400**: Zod validation error.

**Response 500**: internal error (wrong ID, DB issue, etc.).

#### `DELETE /api/tasks/:id`

**Description**: Delete a task.

**Headers**: `x-user-id` is used to ensure that only tasks belonging to that user can be deleted when provided.

**Response 204**: empty body on success.

---

### 3.4 Voice Notes & Parsing API

#### `POST /api/voice-notes`

**Description**: Create a `VoiceNote` and a corresponding `Task` from a transcript.

**Headers**:

- `Content-Type: application/json`
- `x-user-id: <string>` (optional; if provided, task is associated with this user)

**Request body** (`CreateVoiceNoteInput`):

```json
{
  "transcript": "string (required)",
  "audioUrl": "https://optional-recording-url" (optional)
}
```

**Response 201**:

```json
{
  "voiceNote": {
    "id": "clxy...",
    "audioUrl": "https://...",
    "transcript": "I need to finish the report by tomorrow",
    "taskId": "clxz...",
    "createdAt": "2025-12-02T07:10:00.000Z"
  },
  "task": {
    "id": "clxz...",
    "title": "I need to finish the report by tomorrow",
    "description": "I need to finish the report by tomorrow",
    "status": "PENDING",
    "priority": "MEDIUM",
    "dueDate": null,
    "userId": "local-dev-user",
    "createdAt": "2025-12-02T07:10:00.000Z",
    "updatedAt": "2025-12-02T07:10:00.000Z"
  }
}
```

#### `POST /api/voice-notes/parse`

**Description**: Parse a voice transcript into a structured task suggestion **without** creating any DB records.

This is what the frontend uses for the **Voice Review** flow.

**Request body** (`CreateVoiceNoteInput` schema is reused; `audioUrl` is ignored for parsing):

```json
{
  "transcript": "Finish the SDE assignment by Friday, high priority",
  "audioUrl": null
}
```

**Response 200** (approximate shape):

```json
{
  "title": "Finish the SDE assignment by Friday, high priority",
  "description": "Finish the SDE assignment by Friday, high priority",
  "dueDate": "2025-12-05T23:59:59.000Z",  
  "priority": "HIGH",                
  "status": "PENDING",                
  "rawTranscript": "Finish the SDE assignment by Friday, high priority"
}
```

Parsing rules (see `backend/src/modules/voice/voice.repository.ts`):

- **Priority**:
  - `HIGH` if transcript matches `/\b(critical|urgent|high priority|asap)\b/i`.
  - `LOW` if matches `/\b(low priority|low)\b/i`.
  - `MEDIUM` if matches `/\b(medium priority|normal)\b/i`.
  - Default: `MEDIUM`.
- **Status**:
  - `DONE` if transcript mentions `done`, `completed`, `finished`, etc.
  - `IN_PROGRESS` if it mentions `in progress`, `doing`, `working`.
  - Otherwise `PENDING`.
- **Due date**:
  - Uses `chrono-node` to parse natural language dates ("tomorrow", "Friday", specific dates, etc.).
- **Title**:
  - Extracts the first sentence or truncates to ~80 chars.

The frontend then maps this backend representation to a UI-friendly `ParsedTask` via `parsedResponseToParsedTask` in `frontend/src/lib/mappers.ts`.

---

## 4. Decisions & Assumptions

### 4.a Key Design Decisions

1. **Per-browser user identity via `x-user-id`**
   - The frontend (`frontend/src/api/client.ts`) generates a unique user ID and stores it in `localStorage`.
   - Every backend request includes this as `x-user-id`.
   - The backend plugin `ensure-user` upserts a `User` row with this ID and a dummy email like `${id}@local`.
   - This gives us user-scoped tasks without full auth/OAuth.

2. **Task & VoiceNote modeling**
   - Tasks are the primary entities; `VoiceNote` is optional and linked 1:1 via `taskId`.
   - Voice-based creation can create both a `VoiceNote` and a `Task` together.

3. **Optimistic UI updates for drag-and-drop**
   - DnD uses `react-beautiful-dnd`.
   - On drop:
     - The frontend immediately sets a local `optimisticStatusById` override and `savingIds`.
     - The card visually moves to the new column right away, and a per-card + top-right spinner appears.
     - The backend update happens in the background via `useUpdateTask`.
     - On success, the React Query cache is updated and the spinners clear.
     - On failure, React Query rolls back and the card jumps back to its original column while an error toast is shown.

4. **Enum mapping between layers**
   - Backend uses enums:
     - `TaskStatus`: `PENDING`, `IN_PROGRESS`, `DONE`
     - `TaskPriority`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
   - Frontend uses more user-friendly strings:
     - `status`: `'to_do' | 'in_progress' | 'done'`
     - `priority`: `'low' | 'medium' | 'high' | 'critical'`
   - `frontend/src/lib/mappers.ts` centralizes this conversion both ways.

5. **Voice parsing on the backend, not in the browser**
   - Browser only handles speech-to-text (via Web Speech API).
   - The backend handles transcript parsing into structured fields, so logic is centralized and can be tested.

6. **Supabase integration as optional / deprecated for parsing**
   - There is a Supabase client (`src/integrations/supabase`) and a **deprecated** edge function `supabase/functions/parse-voice-task`.
   - The edge function now simply returns a `410` with a message saying to use the backend `POST /api/voice-notes/parse` endpoint instead.
   - Main source of truth is now the Node backend.

### 4.b Assumptions

1. **Email**
   - No end-to-end email processing is implemented.
   - Assumed acceptable for this assignment, focusing on voice + web instead.

2. **Authentication**
   - No login or auth system; we assume a single user per browser (via the random `x-user-id`).
   - If multiple browsers share the same localStorage, they share tasks.

3. **Language & format of voice input**
   - Voice recognition and parsing assume **English**.
   - Natural language date parsing and keyword detection are English-only.

4. **Failure modes**
   - If the backend is slow or unreachable, the UI still shows an optimistic move + "Saving changesc" spinner, then either succeeds or rolls back.
   - Critical errors (like DB down) surface as generic toasts and the `/health` endpoint showing `db: "down"`.

5. **AI / ML scope**
   - The assignment mentions "AI"; here it is interpreted as **smart parsing**, not an external LLM.
   - If a true LLM integration is required, it can be plugged into `parseVoiceInput` in `voice.repository.ts`.

---

## 5. AI Tools Usage

### 5.a Tools Used

- **ChatGPT (via Warp / Agent Mode)**
  - Used to help reason about architecture, implement optimistic drag-and-drop behavior, and generate this detailed README.
- **Lovable.dev**
  - The initial frontend template and structure (Vite + React + shadcn-ui) were scaffolded by Lovable, which internally uses LLMs.

*(If you used additional tools like GitHub Copilot or Claude, update this section accordingly.)*

### 5.b What They Helped With

- **Boilerplate & scaffolding**
  - Initial React + Vite setup, routing skeleton, and UI component structure.
- **Debugging & design**
  - Fixing drag-and-drop delays by reasoning about React Query cache, ID normalization, and optimistic updates.
  - Designing the `VoiceNote` and `Task` relationship and the voice parsing heuristics.
- **Parsing ideas**
  - Brainstorming keyword-based priority and status extraction rules and understanding how to integrate `chrono-node` for due date detection.
- **Documentation**
  - Producing a comprehensive README that reflects the actual code structure and behavior.

### 5.c Notable Prompts / Approaches

- Using the agent to **inspect actual files** (`Index.tsx`, `task.repository.ts`, `voice.repository.ts`) and then iteratively adjust logic (e.g., ensuring IDs are always strings across DnD and cache).
- Prompting for **end-to-end flow explanations** (voice input -> parse -> review dialog -> create task) and translating that into both code and documentation.

### 5.d What Changed Because of These Tools

- Switched from a naive "wait for server" drag-and-drop to a more robust **optimistic UI** with:
  - Local `optimisticStatusById` map.
  - React Query `onMutate` cache updates.
  - Consistent string IDs across backend, frontend, and DnD.
- Consolidated voice parsing in the backend instead of a Supabase edge function for clarity and testability.
- Clarified design decisions and assumptions in this README, making it easier for reviewers to understand the architecture quickly.

---

## 6. How Everything Fits Together (High-Level Flow)

1. **User opens the app**
   - Frontend (`frontend`) loads the Kanban board (`Index.tsx`).
   - `useTasks()` fetches tasks from `GET /api/tasks` with the generated `x-user-id` header.

2. **User creates a task manually**
   - Click **Add Task**.
   - `TaskDialog` opens and collects title/description/status/priority/due date.
   - On submit, `useCreateTask` posts to `POST /api/tasks`.
   - React Query invalidates the `['tasks']` query and refetches the list.

3. **User creates a task via voice**
   - Click **Voice Input**.
   - Browser uses Web Speech API to transcribe speech to text.
   - Transcript is sent to `POST /api/voice-notes/parse`.
   - Backend parses the text and returns a structured suggestion.
   - `VoiceReviewDialog` lets the user tweak title/description/priority/due date.
   - On confirm, the frontend maps the `ParsedTask` into a backend `CreateTaskInput` and calls `POST /api/tasks`.

4. **User drags a task between columns**
   - `react-beautiful-dnd` fires `onDragEnd` in `Index.tsx`.
   - The app sets `optimisticStatusById[id] = newStatus` and `savingIds` for that task.
   - The card instantly appears in the new column; a spinner appears on the card and in the top-right.
   - Backend `PATCH /api/tasks/:id` is called via `useUpdateTask`.
   - On success: query cache is refreshed; spinners clear.
   - On failure: cache is rolled back; the card snaps back; error toast appears.

5. **User closes and reopens the browser**
   - `x-user-id` is stored in `localStorage` so the same browser gets the same tasks again.
   - Multiple browsers = multiple logical users.

This completes the end-to-end story of the **Voice-Enabled Task Tracker** as implemented in this repository.

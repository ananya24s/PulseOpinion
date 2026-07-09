<p align="center">
  <img src="client/public/Pulselogo.png" alt="Pulse Opinion Logo" width="110" />
</p>

<h1 align="center">Pulse Opinion</h1>

<p align="center">
  <strong>Ask questions. Understand perspectives. Explore the context behind public discussion.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-beta-06B6D4" alt="Beta Status" />
  <img src="https://img.shields.io/badge/frontend-React-61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/backend-Node.js-339933" alt="Node.js" />
  <img src="https://img.shields.io/badge/database-MySQL-4479A1" alt="MySQL" />
  <img src="https://img.shields.io/badge/AI-Gemini-8E75B2" alt="Gemini AI" />
</p>

---

## About

**Pulse Opinion** is a full-stack, AI-assisted public discussion platform where users can ask questions, exchange viewpoints, vote, comment, and explore the context surrounding a conversation.

The platform is designed around a simple idea: public discussion should provide more than reactions alone. Pulse Opinion combines community participation with contextual AI assistance to help users understand how strongly a discussion relates to the original question, how meaningfully it is supported, and how useful it may be to someone exploring the same topic later.

> **Beta:** Pulse Opinion is under active development. The current deployment represents an evolving beta release, with additional discussion intelligence, verification, and platform features being added incrementally.

---

## Current Features

### Discussion Platform

- Create and publish questions across multiple categories
- Browse latest, most liked, and most debated discussions
- Search by question content, author, or category
- Like and dislike questions
- Add and explore comments
- Filter discussions by category
- View trending topics and platform activity insights

### Authentication and User Experience

- User registration and sign in
- JWT-based authentication
- Persistent authenticated sessions
- User profiles with activity statistics
- Personal **My Questions** view
- Ownership-based question deletion
- Role-aware admin dashboard access
- Light and dark themes
- Responsive interface built with CSS Modules
- Accessible profile dropdown behavior with outside-click and Escape-key dismissal

### AI-Assisted Attachment Context

Users can attach supported files while creating a question.

The current AI-assisted flow can:

1. Receive an uploaded image or PDF
2. Validate and process the attachment
3. Analyze the file using Gemini
4. Extract structured, discussion-relevant context
5. Present the generated context for user review
6. Allow the user to edit the context before publishing
7. Store the final context alongside the question

The extraction behavior is designed for several content types, including:

- certificates and credentials
- question papers and worksheets
- general documents
- product images
- general images with visible text or discussion context

The system is instructed to avoid fabricating unreadable or uncertain information.

### Discussion Verification and Relevance Assessment

Pulse Opinion includes an AI-assisted discussion assessment layer.

The system analyzes:

- the original question
- AI-extracted attachment context, when available
- community comments
- question-context alignment
- comment relevance
- discussion support
- discussion consistency
- usefulness for future users exploring the topic

Each assessed discussion can receive a **Pulse Opinion percentage score** and an explanation.

> **Important:** This score is **not a literal probability that a claim is true** and should not be interpreted as independent fact-checking. It represents the assessed relevance, support, coherence, and usefulness of the supplied discussion material.

Comments materially influence the assessment. Relevant and reasoned contributions may strengthen a discussion, while off-topic, unsupported, repetitive, or noisy contributions should not automatically increase confidence.

---

## Tech Stack

### Frontend

- React 18
- Vite 5
- CSS Modules
- React Router

### Backend

- Node.js
- Express.js
- REST APIs
- Multer for multipart file uploads

### Database

- MySQL
- `mysql2`

### Authentication

- JSON Web Tokens
- bcrypt / bcryptjs

### AI

- Google Gemini via `@google/genai`
- Multimodal attachment analysis
- AI-assisted discussion relevance and support assessment

---

## Architecture

Pulse Opinion uses a separated client-server architecture.

```text
PulseOpinion/
│
├── client/
│   ├── public/
│   │   ├── Pulselogo.png
│   │   └── favicon.png
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── ...
│   │
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── uploads/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
└── README.md
```

The backend separates routing, request handling, database access, middleware, and AI services to keep responsibilities clear as the platform evolves.

---

## Local Development

### Prerequisites

Install:

- Node.js
- npm
- MySQL

You will also need a Gemini API key for AI-assisted features.

### 1. Clone the repository

```bash
git clone git@github.com:ananya24s/PulseOpinion.git
cd PulseOpinion
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create:

```text
server/.env
```

Configure the variables required by your local environment, for example:

```env
PORT=5001

DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key
```

Do not commit `.env` files or secrets to version control.

For the frontend, configure the backend API base URL through the Vite environment configuration used by the application:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

### 5. Start the backend

From `server/`:

```bash
node server.js
```

### 6. Start the frontend

From `client/`:

```bash
npm run dev
```

Vite will provide the local frontend URL in the terminal.

---

## API Overview

### Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Sign in and receive authentication data |

### Questions and Discussions

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/questions` | Fetch discussions |
| POST | `/api/questions` | Create a question |
| PATCH | `/api/questions/:id/like` | Like or update a like vote |
| PATCH | `/api/questions/:id/dislike` | Dislike or update a dislike vote |
| POST | `/api/questions/:id/comments` | Add a comment |
| DELETE | `/api/questions/:id` | Delete an owned question |

### AI-Assisted Features

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/questions/analyze-attachment` | Analyze an uploaded attachment and extract context |
| POST | `/api/questions/:id/verify` | Assess discussion relevance, support, coherence, and usefulness |

Some routes require a valid JWT bearer token.

---

## Verification Backfill

The project includes a backfill utility for discussions that do not yet have a stored verification assessment.

From `server/`:

```bash
node scripts/backfillVerifications.js
```

The script processes unverified questions, includes available comments and attachment context, handles API rate-limit retries, and stores resulting assessments in MySQL.

Use this script deliberately because it performs AI API requests and writes verification records to the database.

---

## Beta Roadmap

Pulse Opinion is being developed incrementally. Near-term work includes:

- deeper discussion intelligence
- improved verification lifecycle and recalculation behavior
- richer context handling
- stronger mobile responsiveness
- expanded moderation and administrative tooling
- deployment hardening
- broader testing and reliability improvements

The roadmap may evolve as the beta is tested with real usage and feedback.

---

## Status

**Current stage:** Beta

The application is under active development. Core full-stack discussion flows, authentication, MySQL persistence, attachment understanding, and AI-assisted discussion assessment are implemented, while additional capabilities are being developed.

---

## Author

**Ananya Singh**

B.Tech Computer Science and Engineering  
Software Developer Intern

Built and actively developed as a full-stack product exploring meaningful online discussion, multimodal AI context extraction, and AI-assisted assessment of discussion relevance and usefulness.

---

<p align="center">
  <strong>Pulse Opinion</strong><br />
  Context before conclusions.
</p>

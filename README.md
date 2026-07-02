# 🗳️ PulseOpinion

PulseOpinion is a full-stack discussion platform where users can ask questions, participate in public discussions, and engage through likes, dislikes, and comments.

The project is being built incrementally with a focus on clean architecture, scalable backend design, and a responsive user experience.

---

## ✨ Current Features

- 📝 Ask new questions
- 🔍 Search questions
- 📊 Sort by Latest, Most Liked, and Most Commented
- 👍 Like & 👎 Dislike interactions
- 💬 Comment system
- 🔐 Sign In modal (UI)
- ⚡ Loading and error states
- 🌐 React frontend connected to an Express backend

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- CSS Modules

### Backend
- Node.js
- Express.js

### Current Data Layer
- In-memory storage (temporary)

---

## 📂 Project Structure

```text
PulseOpinion/
│
├── client/
│   ├── public/
│   ├── src/
│   └── ...
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── app.js
│   └── server.js
│
└── README.md
```

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/ananya24s/PulseOpinion.git
cd PulseOpinion
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Runs on:

```
http://localhost:5173
```

### Backend

```bash
cd server
npm install
node server.js
```

Runs on:

```
http://localhost:5000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/questions` | Fetch all questions |
| POST | `/api/questions` | Create a new question |
| PATCH | `/api/questions/:id/like` | Like a question |
| PATCH | `/api/questions/:id/dislike` | Dislike a question |
| POST | `/api/questions/:id/comments` | Add a comment |

---

## 📌 Roadmap

- ✅ Interactive React frontend
- ✅ Express backend
- ✅ REST API
- ✅ Frontend ↔ Backend integration
- ⏳ MySQL database integration
- ⏳ Authentication
- ⏳ Deployment

---

## 👩‍💻 Author

**Ananya Singh**

Built as a learning project to explore full-stack application development using React and Express while following clean architecture principles.# 🗳️ PulseOpinion

PulseOpinion is a full-stack discussion platform where users can ask questions, participate in public discussions, and engage through likes, dislikes, and comments.

The project is being built incrementally with a focus on clean architecture, scalable backend design, and a responsive user experience.

---

## ✨ Current Features

- 📝 Ask new questions
- 🔍 Search questions
- 📊 Sort by Latest, Most Liked, and Most Commented
- 👍 Like & 👎 Dislike interactions
- 💬 Comment system
- 🔐 Sign In modal (UI)
- ⚡ Loading and error states
- 🌐 React frontend connected to an Express backend

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- CSS Modules

### Backend
- Node.js
- Express.js

### Current Data Layer
- In-memory storage (temporary)

---

## 📂 Project Structure

```text
PulseOpinion/
│
├── client/
│   ├── public/
│   ├── src/
│   └── ...
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── app.js
│   └── server.js
│
└── README.md
```

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/ananya24s/PulseOpinion.git
cd PulseOpinion
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Runs on:

```
http://localhost:5173
```

### Backend

```bash
cd server
npm install
node server.js
```

Runs on:

```
http://localhost:5000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/questions` | Fetch all questions |
| POST | `/api/questions` | Create a new question |
| PATCH | `/api/questions/:id/like` | Like a question |
| PATCH | `/api/questions/:id/dislike` | Dislike a question |
| POST | `/api/questions/:id/comments` | Add a comment |

---

## 📌 Roadmap

- ✅ Interactive React frontend
- ✅ Express backend
- ✅ REST API
- ✅ Frontend ↔ Backend integration
- ⏳ MySQL database integration
- ⏳ Authentication
- ⏳ Deployment

---

## 👩‍💻 Author

**Ananya Singh**

Built as a learning project to explore full-stack application development using React and Express while following clean architecture principles.

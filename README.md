<img width="1728" height="1117" alt="image" src="https://github.com/user-attachments/assets/bba0c00d-d4f3-4f0a-a5bb-67625fc53985" /># ♔ 3D Immersive chess

A real-time 3D multiplayer chess game with rooms, authentication, and integrated messaging.  
Built with **React + Vite** (frontend) and **Express + Socket.IO** (backend).  

---

## 📦 Prerequisites

- Node.js v18 or higher  
- npm or yarn  
- A MongoDB database (Atlas or local)  

---

## 🗂️ Project structure

```
root/
├─ frontend/              # React app (Vite + Tailwind + R3F)
│   ├─ src/components/    # UI (Board, NavBar, etc.)
│   ├─ src/experience/    # 3D experience (Canvas, controls)
│   ├─ src/hooks/         # Custom hooks (useAuth, useWebSocket…)
│   ├─ src/store/         # Zustand stores (game state, messages)
│   └─ ...
└─ server/                # Express + Socket.IO API
    ├─ config/            # Environment variables
    ├─ controllers/       # Business logic (auth, rooms)
    ├─ middleware/        # JWT auth middleware
    ├─ routes/            # REST endpoints
    ├─ services/          # Socket.IO, MongoDB connection
    └─ utils/             # Logger, helpers
```

---

## 🔧 Environment variables

### Backend (`server/.env`)

| Variable       | Description                        | Example                |
|----------------|------------------------------------|------------------------|
| `PORT`        | Express server port                | 4000                   |
| `CORS_ORIGIN` | Allowed CORS origin (frontend)     | http://localhost:5173 |
| `MONGO_URI`   | MongoDB connection URI             | mongodb+srv://…        |
| `JWT_SECRET`  | JWT secret key                     | a_long_secure_secret   |

### Frontend (`frontend/.env`)

| Variable       | Description                        | Example                |
|----------------|------------------------------------|------------------------|
| `VITE_WS_URL` | Socket.IO server URL               | http://localhost:4000 |

👉 Tip: copy `.env.example` to `.env` in both **server/** and **frontend/** and fill in the values.  

---

## 🚀 Installation & Run

### Backend

```bash
cd server
npm install
# Create .env from .env.example and configure MONGO_URI + JWT_SECRET
npm start
```

### Frontend

```bash
cd frontend
npm install
# Create .env from .env.example and configure VITE_WS_URL
npm run dev
```

Frontend runs at: [http://localhost:5173](http://localhost:5173)  

---

## 🔐 Authentication

- **Register**:  
  `POST /api/auth/register`  
  Body: `{ email, password }` → Response: `{ userId, token }`

- **Login**:  
  `POST /api/auth/login`  
  Body: `{ email, password }` → Response: `{ userId, token }`

⚠️ Protected routes require:  
```
Authorization: Bearer <token>
```

---

## 🕹️ Features

- 🎨 **3D chessboard** with [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)  
- 🌐 **Real-time multiplayer** (Socket.IO)  
- 🏠 **Lobby**: create or join a room by ID  
- ↔️ **Integrated messaging** with notifications  
- 🔄 **Resume game** with a persistent banner  
- ♻️ **Rematch**: replay with the same opponent in one click  
- 🏳️ **Quit game** cleanly (server room released)  
- 📊 **Live captures & material balance**  
- 🔔 Sound & visual notifications for messages and events  

---

## 🔄 Basic workflow

1. **Register** or **log in** (API or UI).  
2. Token is stored on the frontend (localStorage/sessionStorage).  
3. From the **lobby UI**:  
   - Create a new game  
   - Or join an existing one by roomId.  
4. Play: moves are synced in real time.  
5. Options: send messages, quit, propose a rematch.  
6. Resume an active game thanks to the session banner.  

---

## 📸 Screenshots (optional)

<img width="1728" height="1117" alt="image" src="https://github.com/user-attachments/assets/38406131-7acc-42d4-aba3-59e4d9c15a13" />
  

---

## ⚡ Tech stack

**Frontend**:  
- React + Vite  
- TailwindCSS  
- Zustand (state management)  
- React Three Fiber (@react-three/fiber)  
- Socket.IO client  

**Backend**:  
- Express  
- Socket.IO  
- MongoDB + Mongoose  
- JWT (authentication)  

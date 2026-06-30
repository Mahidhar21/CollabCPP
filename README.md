# CollabCPP

A full-stack collaborative coding platform for real-time C++ programming and team collaboration.

**Live Demo:** https://collab-cpp.vercel.app/

## About

CollabCPP is a collaborative coding platform where multiple users can join the same room and work together in a shared coding environment. It combines authentication, room management, real-time code synchronization, chat, a shared whiteboard, and C++ code execution into a single application.

I built this project to explore how authentication, REST APIs, WebSockets, room-based state management, and code execution work together in a modern full-stack application. The goal was to build something similar to an online coding interview or pair-programming platform while keeping the UI clean and focusing on the backend and real-time functionality.

## Features

- User authentication with signup and login
- Protected routes using JWT
- Create and join collaborative coding rooms
- Real-time collaborative C++ editor
- Live cursor movement and typing indicators
- Room-based live chat
- Shared whiteboard
- Session persistence for code, chat, and whiteboard
- C++ code execution with compiler output and error handling
- Dockerized backend
- MongoDB Atlas integration

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Zustand
- Monaco Editor

### Backend

- Node.js
- Express.js
- JWT Authentication
- bcryptjs
- Mongoose

### Database

- MongoDB
- MongoDB Atlas

### Real-Time Communication

- Socket.IO

### Deployment

- Vercel
- Railway
- Docker
- MongoDB Atlas

## Project Architecture

```text
                  React + Vite
                        │
            REST API + Socket.IO
                        │
               Express + Node.js
               │               │
               │               │
        MongoDB Atlas    C++ Code Execution
```

The frontend communicates with the backend using REST APIs for authentication and room management. Socket.IO is responsible for real-time synchronization between users, including shared code editing, chat, cursor updates, presence tracking, and whiteboard events.

Each room maintains its own isolated collaborative session, ensuring that users only interact with others in the same workspace.

## Folder Structure

```text
CollabCPP/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── sockets/
│   │   └── store/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   └── package.json
│
├── Dockerfile
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- MongoDB or MongoDB Atlas
- g++
- Docker (optional)

### Clone the repository

```bash
git clone https://github.com/mahidhar/CollabCPP.git

cd CollabCPP
```

## Backend Setup

```bash
cd server

npm install
```

Create a `.env` file inside the `server` folder.

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

Start the backend.

```bash
npm run dev
```

## Frontend Setup

```bash
cd ../client

npm install

npm run dev
```

## Running Locally

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| API | http://localhost:5000/api |

## Deployment

The application is deployed using:

- **Frontend:** Vercel
- **Backend:** Railway
- **Database:** MongoDB Atlas

Live Demo:

https://collab-cpp.vercel.app/

## Screenshots

### Landing Page

_Add screenshot here._

### Dashboard

_Add screenshot here._

### Collaborative Editor

_Add screenshot here._

### Chat

_Add screenshot here._

### Whiteboard

_Add screenshot here._

## Future Improvements

Some features I'd like to add in the future:

- Support for multiple programming languages
- Secure sandboxing for code execution
- Automated test case evaluation
- Interview problem library
- Better editor customization
- Room invitations
- File explorer
- Voice and video calling

## Author

**Mahidhar Geddada**

GitHub: https://github.com/mahidhar

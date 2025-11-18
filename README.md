<div align="center">

# 🎓 CampusOne - Campus Management System

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge&logo=vercel)](https://campus-one-six.vercel.app)
[![GitHub](https://img.shields.io/badge/github-repository-blue?style=for-the-badge&logo=github)](https://github.com/shahdaksh050/CampusOne)
[![Backend API](https://img.shields.io/badge/API-live-orange?style=for-the-badge&logo=render)](https://campusone.onrender.com)

**A comprehensive, production-ready MERN stack campus management platform with real-time features, AI integration, and role-based access control.**

[Live Demo](https://campus-one-six.vercel.app) • [Report Bug](https://github.com/shahdaksh050/CampusOne/issues) • [Request Feature](https://github.com/shahdaksh050/CampusOne/issues)

</div>

---

## 🌟 Overview

CampusOne is a modern, full-stack web application designed to digitize and streamline educational institution operations. Built using the MERN Stack (MongoDB, Express.js, React.js, Node.js) with Firebase Authentication, Socket.IO for real-time features, and Google Gemini AI integration, this platform provides a complete solution for managing students, courses, attendance, messaging, and academic assistance.

### 🎯 Key Highlights

- 🤖 **AI-Powered Assistant** - Context-aware academic help using Google Gemini 2.0 Flash
- 💬 **Real-time Messaging** - Instant communication with Socket.IO integration
- ✅ **Smart Attendance** - Bulk marking, statistics, and active class detection
- 📊 **Role-based Dashboards** - Customized views for Students, Teachers, and Admins
- 🔒 **Enterprise Security** - Firebase Auth + JWT with role-based access control
- 📱 **Fully Responsive** - Modern glassmorphism UI with Tailwind CSS
- 🚀 **Production Ready** - Deployed on Vercel (frontend) and Render (backend)

---

## ✨ Core Features

### 🔐 Authentication & Authorization
- Firebase Authentication with email/password and Google Sign-In
- JWT token-based session management
- Role-based access control (Student, Teacher, Admin)
- Protected routes with authentication guards

### 📊 Role-based Dashboards
- **Students**: Attendance rate, enrolled courses, AI assistance
- **Teachers**: Active classes widget, attendance marking, student insights
- **Admins**: System-wide analytics, user management, monitoring

### 📚 Course Management
- Full CRUD operations for courses
- Student enrollment tracking with capacity limits
- Course status management (Active/Inactive/Completed)
- Auto-generated course conversations
- Search and filter capabilities

### 👥 Student Management
- Comprehensive student profiles with personal info
- Course enrollments with auto-sync
- Attendance records and statistics
- Status tracking (Active/Graduated/Dropped/Suspended)
- Bulk operations and export functionality

### ✅ Smart Attendance System
- Bulk attendance marking for entire classes
- Individual status tracking (Present/Absent/Late/Excused)
- Real-time statistics and analytics
- Active classes detection based on timetable
- Student self-service attendance view
- Export to CSV functionality

### 📅 Timetable Planner
- Visual weekly schedule management
- Time slots: 8:00 AM - 5:00 PM, Monday-Friday
- Conflict detection for overlapping schedules
- Student-specific timetable view
- Color-coded course blocks
- Responsive horizontal scrolling

### 💬 Real-time Messaging System
- Socket.IO integration for instant messaging
- Auto-generated course conversations
- Manual conversation creation (private/group)
- File attachments support
- Message history persistence
- Online/presence indicators
- Unread message counts

### 🤖 AI Assistant (Google Gemini Integration)
- Context-aware conversations based on user role
- Personalized responses using enrollment and attendance data
- Multiple conversation threads
- Conversation history management
- Role-based system prompts (Student/Teacher/Admin)
- Real-time message streaming

### 👤 User Management (Admin)
- View all system users with roles
- Update user roles dynamically
- User search and filtering
- Firebase UID mapping

---

## 🛠️ Technology Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7.1.2-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12.1.0-FFCA28?style=flat-square&logo=firebase&logoColor=black)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0+-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7.5-010101?style=flat-square&logo=socket.io&logoColor=white)

### AI & Real-time
![Google Gemini](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Real--time-Socket.IO-010101?style=flat-square&logo=socket.io&logoColor=white)

### Deployment
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=white)

</div>

### 📦 Complete Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React.js 18.2 | SPA framework with Hooks & Context API |
| | Vite 7.1 | Fast build tool & dev server |
| | Tailwind CSS 3.4 | Utility-first styling framework |
| | React Router 7.9 | Client-side routing |
| | Zustand 5.0 | Lightweight state management |
| **Backend** | Node.js 18+ | Server runtime environment |
| | Express.js 4.18 | RESTful API framework |
| | Mongoose 8.0 | MongoDB ODM |
| | Socket.IO 4.7 | Real-time bidirectional communication |
| **Database** | MongoDB 8.0+ | NoSQL database |
| **Authentication** | Firebase 12.1 | Auth & user management |
| | JWT | Token-based authorization |
| **AI** | Google Gemini AI | Context-aware academic assistant |
| **Deployment** | Vercel | Frontend hosting & CDN |
| | Render | Backend API hosting |

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v8.0 or higher) - [Atlas](https://www.mongodb.com/cloud/atlas) or Local
- **Firebase Project** - [Console](https://console.firebase.google.com/)
- **Google Gemini API Key** - [AI Studio](https://aistudio.google.com/)

### 💻 Installation

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/shahdaksh050/CampusOne.git
cd CampusOne
```

#### 2️⃣ Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

#### 3️⃣ Environment Configuration

**Create Frontend `.env` file:**
```bash
# Root directory
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**Create Backend `server/.env` file:**
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campusone
# Or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/campusone

JWT_SECRET=your_super_secret_jwt_key_here
FIREBASE_ADMIN_CREDENTIALS={"type":"service_account",...}
GEMINI_API_KEY=your_google_gemini_api_key
```

#### 4️⃣ Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Backend running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Frontend running on http://localhost:5173
```

#### 5️⃣ Access the Application

🌐 **Frontend:** [http://localhost:5173](http://localhost:5173)  
🔧 **Backend API:** [http://localhost:5000](http://localhost:5000)  
📡 **API Health Check:** [http://localhost:5000/health](http://localhost:5000/health)

### 🎮 Default Credentials

Create your first admin user by registering, then use the admin panel to promote users to different roles.

---

## 📁 Project Structure

```
CampusOne/
├── src/                          # 🎨 React Frontend
│   ├── components/              # Reusable UI components
│   │   ├── ActiveClassesWidget.jsx
│   │   ├── Navigation.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── Toast.jsx
│   ├── pages/                   # Route-based pages
│   │   ├── Dashboard.jsx
│   │   ├── AIAssistant.jsx
│   │   ├── Messages.jsx
│   │   ├── AttendancePage.jsx
│   │   ├── CourseManagement.jsx
│   │   ├── StudentRoster.jsx
│   │   └── TimetablePlanner.jsx
│   ├── services/               # API service layer
│   │   ├── api.js
│   │   └── apiBase.js
│   ├── context/                # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── AuthToken.js
│   ├── ui/                     # Shadcn-style components
│   ├── styles/                 # Global styles
│   └── main.jsx                # Entry point
│
├── server/                      # ⚙️ Express Backend
│   ├── models/                 # MongoDB Mongoose schemas
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Course.js
│   │   ├── Attendance.js
│   │   ├── Conversation.js
│   │   ├── Message.js
│   │   ├── AIConversation.js
│   │   └── TimetableEntry.js
│   ├── routes/                 # API endpoints
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── courses.js
│   │   ├── students.js
│   │   ├── attendance.js
│   │   ├── timetable.js
│   │   ├── messages.js
│   │   └── ai.js
│   ├── middleware/             # Custom middleware
│   │   └── auth.js
│   ├── utils/                  # Utility functions
│   └── server.js               # Entry point
│
├── public/                      # 📦 Static assets
├── vercel.json                  # Vercel config
├── Procfile                     # Render config
└── README.md                    # Documentation
```

---

## � API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /verify` - Token verification

### Users (`/api/users`)
- `GET /` - Get all users (authenticated)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update profile
- `PUT /:userId/role` - Update user role (admin)

### Courses (`/api/courses`)
- `GET /` - Get all courses
- `POST /` - Create course (teacher/admin)
- `GET /:id` - Get course by ID
- `PUT /:id` - Update course
- `DELETE /:id` - Delete course

### Students (`/api/students`)
- `GET /` - Get all students with filters
- `POST /` - Create student (teacher/admin)
- `GET /:id` - Get student by ID
- `PUT /:id` - Update student
- `PUT /:id/enrollments` - Update enrollments

### Attendance (`/api/attendance`)
- `POST /bulk` - Bulk mark attendance
- `GET /student/:id/stats` - Student statistics
- `GET /course/:id/stats` - Course statistics
- `GET /active-classes` - Get active classes

### Timetable (`/api/timetable`)
- `GET /` - Get all timetable entries
- `POST /` - Create timetable entry
- `PUT /:id` - Update entry
- `DELETE /:id` - Delete entry

### Messaging (`/api/conversations`, `/api/messages`)
- `GET /conversations` - Get user conversations
- `POST /conversations` - Create conversation
- `POST /conversations/:id/messages` - Send message
- `GET /conversations/:id/messages` - Get messages

### AI Assistant (`/api/ai`)
- `GET /conversations` - Get AI conversations
- `POST /conversations` - Create AI conversation
- `POST /conversations/:id/messages` - Send AI message

---

## 🎯 Available Scripts

### Frontend Commands
```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Commands
```bash
npm run dev          # Start with nodemon (auto-restart)
npm start            # Start production server
npm run seed         # Seed database with dummy data
```

---

## 🎨 Key Pages & Routes

| Route | Component | Description | Access |
|-------|-----------|-------------|--------|
| `/` | Dashboard | Overview with stats & widgets | All |
| `/auth` | AuthPage | Login/Register | Public |
| `/courses` | CourseManagement | CRUD operations for courses | Teacher/Admin |
| `/students` | StudentRoster | Student management | Teacher/Admin |
| `/attendance` | AttendancePage | Mark & view attendance | All |
| `/attendance-records` | StudentAttendanceRecords | Detailed records | Teacher/Admin |
| `/timetable` | TimetablePlanner | Weekly schedule | All |
| `/messages` | Messages | Real-time chat | All |
| `/ai-assistant` | AIAssistant | Gemini AI chat | All |
| `/profile` | UserProfilePage | User settings | All |
| `/users` | UserRoleManagement | Role management | Admin |

---

## 🚀 Deployment

### 🌐 Live Application

- **Frontend**: [https://campus-one-six.vercel.app](https://campus-one-six.vercel.app)
- **Backend API**: [https://campusone.onrender.com](https://campusone.onrender.com)

### Deploy Your Own

#### Frontend (Vercel)

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy automatically

```bash
# Or using Vercel CLI
npm run build
vercel --prod
```

#### Backend (Render)

1. Create new Web Service on [Render](https://render.com)
2. Connect GitHub repository
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `server`
4. Add environment variables
5. Deploy

**Environment Variables Required:**
- `NODE_ENV=production`
- `MONGODB_URI`
- `JWT_SECRET`
- `FIREBASE_ADMIN_CREDENTIALS`
- `GEMINI_API_KEY`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   React      │  │  Firebase    │  │  Socket.IO   │ │
│  │   Vite       │  │  Auth SDK    │  │  Client      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                    HTTPS / WSS
                          │
┌─────────────────────────────────────────────────────────┐
│                    API Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Express    │  │  Socket.IO   │  │  Firebase    │ │
│  │   REST API   │  │  Server      │  │  Admin SDK   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                  Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   MongoDB    │  │  Mongoose    │  │  Gemini AI   │ │
│  │   Atlas      │  │  ODM         │  │  API         │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork
   ```bash
   git clone https://github.com/your-username/CampusOne.git
   ```
3. **Create** a feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
4. **Make** your changes
5. **Commit** with descriptive messages
   ```bash
   git commit -m 'Add: New feature for XYZ'
   ```
6. **Push** to your branch
   ```bash
   git push origin feature/AmazingFeature
   ```
7. **Open** a Pull Request

### Code Standards

- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation when needed
- Test changes before submitting PR

---

## 🆘 Support & Contact

- 📧 **Email**: daksh.ks@somaiya.edu
- 🐛 **Issues**: [GitHub Issues](https://github.com/shahdaksh050/CampusOne/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/shahdaksh050/CampusOne/discussions)

---

## 🙏 Acknowledgments

- Firebase for authentication services
- MongoDB for database hosting
- Google Gemini AI for intelligent assistance
- Vercel & Render for deployment platforms
- All open-source contributors

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

[![GitHub stars](https://img.shields.io/github/stars/shahdaksh050/CampusOne?style=social)](https://github.com/shahdaksh050/CampusOne/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/shahdaksh050/CampusOne?style=social)](https://github.com/shahdaksh050/CampusOne/network/members)


</div>

# 🎓 CampusOne - Campus Management System

A modern, full-stack web application designed to digitize and streamline campus operations. Built with React.js frontend and Node.js/Express backend, CampusOne provides a complete solution for educational institutions to manage students, courses, attendance, and communication.

## ✨ Features

- **📊 Student Management** - Complete student lifecycle management with detailed profiles
- **📚 Course Administration** - Dynamic course creation, management, and curriculum planning
- **📍 Smart Attendance** - Location-based attendance tracking with Google Maps integration
- **💬 Integrated Messaging** - Real-time communication system between students, faculty, and administration
- **📅 Timetable Planning** - Intelligent scheduling system with conflict resolution
- **🔐 Secure Authentication** - Firebase-powered authentication with role-based access control
- **📱 Responsive Design** - Mobile-first design that works seamlessly across all devices

## 🛠️ Tech Stack

### Frontend
- **React.js 18** with Hooks
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **React Router** for navigation
- **Context API** for state management

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Firebase Authentication**
- **Socket.io** for real-time features
- **RESTful API** architecture

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Firebase project

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shahdaksh050/CampusOne.git
cd CampusOne
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install
```

3. **Environment Setup**
```bash
# Copy environment templates
cp server/.env.example server/.env
cp .env.example .env

# Edit the .env files with your configuration:
# - MongoDB connection string
# - Firebase project credentials
# - Google Maps API key
# - JWT secret keys
```

4. **Start development servers**
```bash
# Terminal 1: Start backend
cd server && npm run dev

# Terminal 2: Start frontend
npm run dev
```

## 📁 Project Structure

```
CampusOne/
├── src/                    # React frontend
│   ├── components/        # Reusable UI components
│   ├── pages/            # Route-based page components
│   ├── services/         # API service layer
│   ├── context/          # React context providers
│   └── styles/           # Global styles
├── server/               # Express backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Custom middleware
│   └── server.js         # Entry point
├── public/               # Static assets
└── README.md
```

## 🔧 Environment Variables

### Frontend (.env)
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend (server/.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campusone or your mongodb atlas url
JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

## 🎯 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## 📱 Pages & Features

- **Dashboard** - Overview of campus activities and quick actions
- **Student Roster** - Manage student profiles and records
- **Course Management** - Create and manage courses and curriculum
- **Attendance Map** - Location-based attendance tracking
- **Timetable Planner** - Schedule management and conflict resolution
- **Messages** - Real-time messaging between users
- **User Profile** - Personal settings and preferences

## 🔐 Authentication

The application uses Firebase Authentication with support for:
- Email/Password login
- Google Sign-In
- Role-based access control (Admin, Teacher, Student)

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
vercel --prod
```

### Backend (Heroku)
```bash
heroku create campusone-backend
git push heroku main
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email daksh@example.com or create an issue in the GitHub repository.

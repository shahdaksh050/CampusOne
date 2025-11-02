# CampusOne Authentication & RBAC Setup Guide

This guide walks you through configuring and running the new authentication system for CampusOne. It covers Firebase Authentication (client + Admin SDK), MongoDB Atlas, environment variables, local development, and role-based access control (RBAC) for teachers and students.

Contents
- Prerequisites
- 1) Configure Backend (.env)
- 2) Configure Frontend (.env)
- 3) Install Dependencies
- 4) Start Dev Servers (3000 and 5000)
- 5) Register/Login Flow
- 6) Promote a User to Teacher
- 7) Role-Based Behavior in the UI
- 8) API Security Notes
- 9) Troubleshooting
- 10) Production/Deployment Checklist

## Prerequisites
- Node.js LTS and npm
- A MongoDB Atlas cluster (or local MongoDB). If using Atlas, ensure a database user is created and your IP is allowed.
- A Firebase project with:
  - A Web App (for client SDK keys)
  - A Service Account (for Admin SDK on the backend)

## 1) Configure Backend (.env)
File: `d:\CampusOne\server\.env`

Required variables:

- Server
  - `PORT=5000`

- MongoDB
  - `MONGODB_URI` should be your Atlas SRV string including a database name (e.g., `campusone`). Example:
    ```
    MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/campusone?retryWrites=true&w=majority&appName=<cluster-name>
    ```
  - If your password contains special characters, URL-encode them.

- Firebase Admin (choose ONE of the following options)
  - Option A: Single JSON
    - `FIREBASE_ADMIN_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'`
  - Option B: Split variables
    - `FIREBASE_ADMIN_PROJECT_ID=your-project-id`
    - `FIREBASE_ADMIN_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com`
    - `FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

Notes:
- If using split variables, keep the newlines in `FIREBASE_ADMIN_PRIVATE_KEY` as literal `\n` sequences in `.env`. The server replaces them at runtime.
- The server will log a warning if Firebase Admin is not configured; authentication will fail until configured.

## 2) Configure Frontend (.env)
File: `d:\CampusOne\.env`

- API Base URL
  - `VITE_API_URL=http://localhost:5000/api`

- Firebase Web SDK (found in your Firebase project → App settings → SDK setup)
  - `VITE_FIREBASE_API_KEY=...`
  - `VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com`
  - `VITE_FIREBASE_PROJECT_ID=...`
  - `VITE_FIREBASE_APP_ID=...`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID=...`

## 3) Install Dependencies
- Backend:
  - `cd d:\CampusOne\server`
  - `npm install`
- Frontend:
  - `cd d:\CampusOne`
  - `npm install`

## 4) Start Dev Servers (3000 and 5000)
- Backend (port 5000):
  - `cd d:\CampusOne\server`
  - `npm run dev`
  - Expect: `MongoDB connected successfully` and `Server running on port 5000`
  - Verify: http://localhost:5000/api/health

- Frontend (port 3000):
  - `cd d:\CampusOne`
  - `npm run dev`
  - Open: http://localhost:3000

Ports are preconfigured: Vite on 3000, Express on 5000.

## 5) Register/Login Flow
- Open the app (http://localhost:3000). You will see the Auth screen.
- Register a new account with email + password.
  - The backend uses Firebase Admin to create the Firebase user and stores a corresponding document in MongoDB (`users` collection) with default `role=student`.
  - The frontend signs the user in with Firebase client SDK.
- Login:
  - On successful login, the frontend obtains a Firebase ID token and calls `POST /api/auth/login` to retrieve the role from MongoDB.
  - The app renders based on your role.

## 6) Promote a User to Teacher
New users default to `student`. To grant teacher privileges, update the `users` collection.

Using `mongosh` for Atlas (replace cluster/creds accordingly):
```js
use campusone
// by email
db.users.updateOne({ email: "teacher@campus.edu" }, { $set: { role: "teacher" } })
// or by firebaseUid
// db.users.updateOne({ firebaseUid: "<uid>" }, { $set: { role: "teacher" } })
```
After updating the role, have the user sign out and sign back in to refresh their role in the client.

## 7) Role-Based Behavior in the UI
- Student role:
  - Navigation hides the “Students” section.
  - CourseManagement hides the Add/Edit/Delete controls.
- Teacher role:
  - Full access to all navigation items.
  - Can add/edit/delete Courses, Students, Attendance, and Timetable entries.

## 8) API Security Notes
- All data routes are protected by Firebase ID token verification: requests must include `Authorization: Bearer <ID_TOKEN>`.
- Teacher-only endpoints:
  - POST/PUT/DELETE for `/api/courses`, `/api/students`, `/api/attendance`, `/api/timetable` require `role=teacher`.
- The frontend API service automatically attaches the ID token if available.

## 9) Troubleshooting
- 401 Unauthorized / Missing token:
  - Ensure you’re signed in; check the browser console for login errors.
  - Verify `localStorage` has `firebase_id_token` (debug).
  - Confirm `VITE_API_URL` points to the backend.

- Firebase Admin initialization failed:
  - Check `.env` service account variables.
  - If using the JSON block, ensure it’s valid JSON and properly quoted.
  - If using the split variables, ensure PRIVATE_KEY contains `\n` for newlines.

- MongoDB connection errors:
  - Verify `MONGODB_URI` includes a database name and correct user/password.
  - In Atlas, allow your IP or use `0.0.0.0/0` for development.

- CORS issues:
  - Backend uses default CORS; if you deploy, add explicit origin allowlist.

- Password special characters:
  - If your DB password contains `@` or other reserved characters, URL-encode them.

## 10) Production/Deployment Checklist
- Backend
  - Set the `.env` variables in your deployment environment (never commit secrets).
  - Run the server with a process manager (PM2) and behind a reverse proxy with HTTPS.

- Frontend
  - Set `VITE_API_URL` to your deployed API domain in `.env`.
  - `npm run build` and serve the `dist` folder behind a CDN or static host.

- Security
  - Use least-privilege roles in MongoDB Atlas.
  - Restrict Firebase Admin credentials to the backend.
  - Restrict CORS in production to trusted origins.

---

You can now run the backend and frontend, register/login users, promote teachers, and verify that role-based access works across the UI and API. If you modify roles in MongoDB, have users sign out and sign back in to refresh their permissions in the client.

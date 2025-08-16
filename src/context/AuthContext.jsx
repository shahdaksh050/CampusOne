import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import api from '../services/api';
import { toast } from '../components/Toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'student' | 'teacher' | null
  const [userEmail, setUserEmail] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get fresh ID token
          const idToken = await user.getIdToken(true);
          localStorage.setItem('firebase_id_token', idToken);
          setUserEmail(user.email || null);
          setIsAuthenticated(true);
          // Ask backend for role
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            });
            if (!res.ok) throw new Error('Failed to fetch role');
            const data = await res.json();
            setUserRole(data.role || null);
          } catch (err) {
            console.error('Role fetch failed', err);
            toast.error('Unable to fetch user role');
            setUserRole(null);
          }
        } else {
          localStorage.removeItem('firebase_id_token');
          setIsAuthenticated(false);
          setUserRole(null);
          setUserEmail(null);
        }
      } finally {
        setIsLoadingAuth(false);
      }
    });
    return () => unsub();
  }, []);

  async function register(email, password) {
    try {
      // Create user in Firebase via backend (Admin SDK) and in MongoDB with default role
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Registration failed');
      }

      // Sign in on client to establish session
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Registration successful');
    } catch (err) {
      console.error('Register error', err);
      toast.error(err.message || 'Registration failed');
      throw err;
    }
  }

  async function login(email, password) {
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in');
    } catch (err) {
      console.error('Login error', err);
      toast.error(err.message || 'Login failed');
      throw err;
    }
  }

  async function logout() {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      toast.success('Logged out');
    } catch (err) {
      console.error('Logout error', err);
      toast.error('Logout failed');
    }
  }

  const value = useMemo(() => ({
    isAuthenticated,
    userRole,
    userEmail,
    isLoadingAuth,
    login,
    register,
    logout,
  }), [isAuthenticated, userRole, userEmail, isLoadingAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Optional helper used by api.js lazy import to retrieve ID token

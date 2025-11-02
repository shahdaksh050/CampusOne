import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { toast } from '../components/Toast';
import { API_BASE_URL } from '../services/apiBase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'student' | 'teacher' | null
  const [userEmail, setUserEmail] = useState(null);
  const [userUid, setUserUid] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const fetchProfile = useCallback(async (tokenOverride) => {
    try {
      const token = tokenOverride || localStorage.getItem('firebase_id_token');
      if (!token) return null;
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Profile fetch failed');
      const data = await res.json();
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Profile fetch error', err);
      return null;
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get fresh ID token
          const idToken = await user.getIdToken(true);
          localStorage.setItem('firebase_id_token', idToken);
          setUserEmail(user.email || null);
          setUserUid(user.uid || null);
          setIsAuthenticated(true);
          // Ask backend for role
          try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            });
            if (!res.ok) throw new Error('Failed to fetch role');
            const data = await res.json();
            setUserRole(data.role || null);
            if (data.profile) setProfile(data.profile);
          } catch (err) {
            console.error('Role fetch failed', err);
            toast.error('Unable to fetch user role');
            setUserRole(null);
          }
          await fetchProfile(idToken);
        } else {
          localStorage.removeItem('firebase_id_token');
          setIsAuthenticated(false);
          setUserRole(null);
          setUserEmail(null);
          setUserUid(null);
          setProfile(null);
        }
      } finally {
        setIsLoadingAuth(false);
      }
    });
    return () => unsub();
  }, [fetchProfile]);

  async function register(email, password) {
    try {
      // Create user in Firebase via backend (Admin SDK) and in MongoDB with default role
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
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
    userUid,
    profile,
    isLoadingAuth,
    login,
    register,
    logout,
    refreshProfile: fetchProfile,
    isTeacher: userRole === 'teacher',
  }), [fetchProfile, isAuthenticated, userRole, userEmail, userUid, profile, isLoadingAuth]);

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

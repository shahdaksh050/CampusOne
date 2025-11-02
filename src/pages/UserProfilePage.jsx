import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import { API_BASE_URL } from '../services/apiBase';

export default function UserProfilePage() {
  const { userEmail, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: '', email: '', role: '' });
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
  const res = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('firebase_id_token') || ''}`,
        },
      });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      setProfile(data);
      setNameInput(data.name || '');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
  const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('firebase_id_token') || ''}`,
        },
        body: JSON.stringify({ name: nameInput }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      setProfile((p) => ({ ...p, name: nameInput }));
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update profile');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  const initials = (profile.name || userEmail || 'U').split(/[@\s]+/).filter(Boolean).slice(0,2).map(s => s[0].toUpperCase()).join('');

  return (
    <div className="page active p-6 space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account information</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="max-w-2xl mx-auto glass-card">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-black"
                 style={{ background: 'linear-gradient(135deg, var(--chart-1), var(--chart-2))' }}>
              {initials}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Name</label>
                {editing ? (
                  <input
                    className="w-full h-11 px-3 rounded-md bg-[var(--input-background)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                ) : (
                  <div className="text-lg font-semibold">{profile.name || '—'}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Email</label>
                <div className="text-[var(--foreground)]">{profile.email}</div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Role</label>
                <div className="text-[var(--foreground)]">{profile.role}</div>
              </div>
              <div className="flex gap-2 pt-2">
                {!editing ? (
                  <Button onClick={() => setEditing(true)} className="btn btn-primary">Edit</Button>
                ) : (
                  <>
                    <Button onClick={saveProfile} className="btn btn-primary">Save</Button>
                    <Button variant="outline" onClick={() => { setEditing(false); setNameInput(profile.name || ''); }} className="btn btn-secondary">Cancel</Button>
                  </>
                )}
                <Button variant="outline" onClick={loadProfile} className="btn btn-secondary">Refresh</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

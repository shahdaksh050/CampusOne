import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
        await login(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] font-sans">
      {/* Subtle background accent matching dashboard aesthetics */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-10"
             style={{ background: 'radial-gradient(closest-side, var(--chart-1), transparent)' }} />
        <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full blur-3xl opacity-10"
             style={{ background: 'radial-gradient(closest-side, var(--chart-2), transparent)' }} />
      </div>

      <Card className="w-full max-w-md bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] shadow-2xl rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold"
                 style={{ background: 'linear-gradient(135deg, var(--chart-1), var(--chart-2))' }}>
              C1
            </div>
            <div className="text-left">
              <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Welcome to</p>
              <h1 className="text-xl font-semibold leading-tight">CampusOne</h1>
            </div>
          </div>
          <CardTitle className="mt-4 text-center text-2xl font-bold">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {/* Accent divider */}
          <div className="h-px w-full mb-6" style={{ background: 'linear-gradient(90deg, transparent, var(--border), transparent)' }} />

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Email</label>
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                className="w-full h-12 px-4 bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none placeholder:text-[color:rgba(255,255,255,0.45)] rounded-md"
                placeholder="you@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                className="w-full h-12 px-4 bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none placeholder:text-[color:rgba(255,255,255,0.45)] rounded-md"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-md bg-[var(--primary)] text-black font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-[var(--primary)] hover:opacity-90 underline underline-offset-4"
                  onClick={() => setMode('register')}
                >
                  Sign up
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-[var(--primary)] hover:opacity-90 underline underline-offset-4"
                  onClick={() => setMode('login')}
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function AddStudentModal({ onClose, onCreateStudent }) {
  const [form, setForm] = useState({
    program: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    year: 1,
    status: 'Active',
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onCreateStudent && onCreateStudent(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] shadow-xl rounded-lg">
        <CardHeader>
          <CardTitle>Add Student</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Program</label>
              <Input className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                     value={form.program} onChange={(e) => update('program', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1 text-[var(--muted-foreground)]">First Name</label>
              <Input className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                     value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Last Name</label>
              <Input className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                     value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Email</label>
              <Input type="email" className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                     value={form.email} onChange={(e) => update('email', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Phone</label>
              <Input className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                     value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Year</label>
              <select className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                      value={form.year} onChange={(e) => update('year', Number(e.target.value))}>
                {[1,2,3,4].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Status</label>
              <select className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                      value={form.status} onChange={(e) => update('status', e.target.value)}>
                {['Active', 'Graduated', 'Dropped', 'Suspended'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2 flex gap-2 mt-2">
              <Button type="submit" className="flex-1">Create</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

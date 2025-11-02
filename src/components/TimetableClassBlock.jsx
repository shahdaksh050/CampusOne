import React from 'react';
import { Users, AlertTriangle, Edit3, Trash2 } from 'lucide-react';

function pickColor(token = '') {
  // Simple deterministic color chooser based on token hash
  let h = 0;
  for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) >>> 0;
  const idx = h % 3;
  if (idx === 0) return { bg: 'bg-[var(--chart-1)]/15', border: 'border-[var(--chart-1)]' };
  if (idx === 1) return { bg: 'bg-[var(--chart-2)]/15', border: 'border-[var(--chart-2)]' };
  return { bg: 'bg-emerald-500/15', border: 'border-emerald-500' };
}

export default function TimetableClassBlock({ entry, isTeacher = false, onEdit, onDelete }) {
  const title = entry?.courseId?.title || 'Course';
  const instructor = entry?.courseId?.instructor || entry?.instructor || 'Instructor';
  const room = entry?.room || 'Room';
  const start = entry?.startTime || '';
  const end = entry?.endTime || '';
  const students = entry?.studentsCount ?? 0;
  const conflict = !!entry?.conflict;

  const code = (title.split(/\s+/)[0] || 'CLS').toUpperCase();
  const colors = pickColor(code + room);

  return (
    <div className={`relative border-l-4 ${colors.border} ${colors.bg} rounded-md p-2 shadow-sm hover:shadow-md transition`}> 
      {conflict && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow">
          <AlertTriangle className="w-3 h-3" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold tracking-wide text-[var(--muted-foreground)]">{code}</div>
        <div className="text-[10px] text-[var(--muted-foreground)]">{start} - {end}</div>
      </div>
      <div className="text-sm font-semibold leading-snug text-[var(--foreground)]">{title}</div>
      <div className="text-xs text-[var(--muted-foreground)]">{instructor} • {room}</div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <div className="inline-flex items-center gap-1 text-[var(--muted-foreground)]">
          <Users className="w-3 h-3" />
          <span>{students} students</span>
        </div>
        {isTeacher && (
          <div className="inline-flex items-center gap-1">
            <button className="p-1 rounded hover:bg-[var(--muted)]" onClick={() => onEdit && onEdit(entry)} title="Edit"><Edit3 className="w-3 h-3" /></button>
            <button className="p-1 rounded hover:bg-[var(--muted)]" onClick={() => onDelete && onDelete(entry)} title="Delete"><Trash2 className="w-3 h-3" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Users, Clock, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import { API_BASE_URL } from '../services/apiBase';

export default function CourseCard({ course, studentEnrolledCourseIds = [] }) {
  const { userRole } = useAuth();
  const isStudent = userRole === 'student';
  const [enrolling, setEnrolling] = useState(false);
  const alreadyEnrolled = Array.isArray(studentEnrolledCourseIds) && studentEnrolledCourseIds.includes(course._id);

  const badgeClass = (status) => {
    const base = 'px-2 py-0.5 rounded-md text-xs font-semibold';
    if (status === 'active') return `${base} bg-[var(--chart-1)] text-black`;
    if (status === 'completed') return `${base} bg-[var(--chart-2)] text-black`;
    return `${base} bg-[var(--muted)] text-[var(--foreground)]`;
  };

  async function enroll() {
    try {
      setEnrolling(true);
      const res = await fetch(`${API_BASE_URL}/courses/${course._id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('firebase_id_token') || ''}`,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to enroll');
      }
      toast.success('Enrolled in course');
    } catch (err) {
      toast.error(err.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <div className="bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] rounded-lg shadow-md p-5 flex flex-col gap-4">
      {/* Header: Title + Status + Quick actions */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-[var(--muted-foreground)] mb-1">{course.id}</div>
          <h3 className="text-lg font-bold leading-tight text-[var(--foreground)]">{course.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={badgeClass(course.status)}>{course.status}</span>
          <button className="p-2 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)]" title="Edit">
            <Edit3 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)]" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
        <div className="text-[var(--muted-foreground)]">
          <span className="opacity-80">Instructor:</span> <span className="ml-1">{course.instructor}</span>
        </div>
        <div className="text-[var(--muted-foreground)]">
          <span className="opacity-80">Semester:</span> <span className="ml-1">{course.semester}</span>
        </div>
        <div className="text-[var(--muted-foreground)]">
          <span className="opacity-80">Credits:</span> <span className="ml-1">{course.credits}</span>
        </div>
        <div className="text-[var(--muted-foreground)] flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{course.students} students</span>
        </div>
        <div className="col-span-2 text-[var(--muted-foreground)] flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{course.schedule?.time || course.schedule?.days?.join(', ') || 'Schedule TBA'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-1">
        <button className="rounded-md px-3 py-2 text-[var(--chart-1)] hover:bg-[var(--muted)] transition text-sm font-medium">
          View Details
        </button>
        <button className="rounded-md px-3 py-2 bg-[var(--primary)] text-black hover:opacity-90 transition text-sm font-semibold">
          Manage
        </button>
        {isStudent && (
          <button
            disabled={enrolling || alreadyEnrolled}
            onClick={enroll}
            className={`rounded-md px-3 py-2 ${alreadyEnrolled ? 'bg-gray-500 text-white' : 'bg-[var(--primary)] text-black hover:opacity-90'} transition text-sm font-semibold`}
          >
            {alreadyEnrolled ? 'Enrolled' : (enrolling ? 'Enrolling…' : 'Enroll')}
          </button>
        )}
      </div>
    </div>
  );
}

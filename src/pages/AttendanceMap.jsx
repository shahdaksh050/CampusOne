import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import api from "../services/api";
import { toast } from "../components/Toast";

export default function AttendanceMap() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getAttendance();
        setRecords(data);
      } catch (err) {
        console.error("Failed to load attendance", err);
        toast.error("Failed to load attendance");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summary = useMemo(() => {
    // Aggregate attendance by student
    const map = new Map();
    for (const r of records) {
      const key = r.student?._id || r.student;
      if (!map.has(key)) {
        map.set(key, {
          studentId: key,
          name: r.student?.firstName && r.student?.lastName ? `${r.student.firstName} ${r.student.lastName}` : (r.student?.studentId || "Unknown"),
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        });
      }
      const s = map.get(key);
      s.total += 1;
      const st = (r.status || "Present").toLowerCase();
      if (st === "present") s.present += 1;
      else if (st === "absent") s.absent += 1;
      else if (st === "late") s.late += 1;
      else if (st === "excused") s.excused += 1;
    }
    return Array.from(map.values()).sort((a, b) => (b.present / Math.max(1, b.total)) - (a.present / Math.max(1, a.total)));
  }, [records]);

  const badgeClass = (pct) => {
    if (pct >= 0.9) return "bg-green-100 text-green-800";
    if (pct >= 0.75) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {summary.length === 0 ? (
          <div className="text-gray-500">No attendance records.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {summary.map((s) => {
              const pct = s.total ? s.present / s.total : 0;
              const pctText = `${Math.round(pct * 100)}%`;
              return (
                <div key={s.studentId} className="flex justify-between items-center p-2 border rounded">
                  <div className="flex flex-col">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-sm text-gray-600">{s.present} present, {s.absent} absent, {s.late} late, {s.excused} excused</span>
                  </div>
                  <Badge className={badgeClass(pct)}>{pctText}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

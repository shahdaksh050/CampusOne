import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Clock, MapPin, Users } from 'lucide-react';
import api from '../services/api';

export default function ActiveClassesWidget() {
  const [activeClasses, setActiveClasses] = useState([]);
  const [currentTime, setCurrentTime] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveClasses();
    const interval = setInterval(fetchActiveClasses, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function fetchActiveClasses() {
    try {
      const data = await api.getActiveClasses();
      setActiveClasses(data.activeClasses || []);
      setCurrentTime(data.currentTime || '');
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch active classes:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Active Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Active Classes
          </CardTitle>
          <div className="text-sm text-[var(--muted-foreground)]">
            {currentTime}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeClasses.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No classes in session right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeClasses.map((classItem) => (
              <div
                key={classItem._id}
                className="p-4 border border-[var(--border)] rounded-lg bg-gradient-to-r from-[var(--primary)]/10 to-transparent hover:shadow-md transition-shadow"
              >
                <div className="font-semibold text-lg mb-2">
                  {classItem.course?.title || 'Unknown Course'}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {classItem.startTime} - {classItem.endTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {classItem.room}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {classItem.instructor}
                  </div>
                </div>
                <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  ● In Session
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

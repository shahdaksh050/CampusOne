import React, { useState, useEffect } from 'react';
import { X, Users, Search, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import api from '../services/api';
import { toast } from './Toast';

export default function CreateConversationModal({ isOpen, onClose, onCreated }) {
  const [step, setStep] = useState(1); // 1: Type, 2: Details
  const [conversationType, setConversationType] = useState('group'); // 'private', 'group', 'course'
  const [conversationName, setConversationName] = useState('');
  const [conversationDescription, setConversationDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchCourses();
    }
  }, [isOpen]);

  async function fetchUsers() {
    try {
      setLoadingUsers(true);
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchCourses() {
    try {
      const data = await api.getCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    }
  }

  function handleClose() {
    setStep(1);
    setConversationType('group');
    setConversationName('');
    setConversationDescription('');
    setSelectedParticipants([]);
    setSelectedCourse(null);
    setSearchQuery('');
    onClose();
  }

  function toggleParticipant(userEmail) {
    setSelectedParticipants(prev => 
      prev.includes(userEmail) 
        ? prev.filter(email => email !== userEmail)
        : [...prev, userEmail]
    );
  }

  async function handleCreate() {
    try {
      setLoading(true);

      const payload = {
        type: conversationType === 'course' ? 'course' : conversationType,
        name: conversationName.trim() || undefined,
        description: conversationDescription.trim() || undefined,
      };

      if (conversationType === 'course' && selectedCourse) {
        payload.courseId = selectedCourse._id;
      } else {
        payload.participantsEmails = selectedParticipants;
      }

      await api.createConversation(payload);
      toast.success('Conversation created successfully!');
      
      if (onCreated) {
        await onCreated();
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error(error.response?.data?.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const name = (user.name || `${user.firstName || ''} ${user.lastName || ''}`).toLowerCase();
    const email = (user.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const filteredCourses = courses.filter(course => {
    const query = searchQuery.toLowerCase();
    return (course.title || '').toLowerCase().includes(query) || 
           (course.courseCode || '').toLowerCase().includes(query);
  });

  const canProceed = () => {
    if (step === 1) return true;
    if (conversationType === 'course') return selectedCourse !== null;
    return selectedParticipants.length > 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--primary)]" />
              Create New Conversation
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex gap-2 mt-4">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'}`} />
          </div>
        </CardHeader>

        <CardContent className="pt-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose Conversation Type</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setConversationType('private')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      conversationType === 'private'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">💬</div>
                    <div className="font-semibold">Private Chat</div>
                    <div className="text-sm text-[var(--muted-foreground)] mt-1">
                      One-on-one conversation
                    </div>
                  </button>

                  <button
                    onClick={() => setConversationType('group')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      conversationType === 'group'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">👥</div>
                    <div className="font-semibold">Group Chat</div>
                    <div className="text-sm text-[var(--muted-foreground)] mt-1">
                      Multiple participants
                    </div>
                  </button>

                  <button
                    onClick={() => setConversationType('course')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      conversationType === 'course'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">📚</div>
                    <div className="font-semibold">Course Group</div>
                    <div className="text-sm text-[var(--muted-foreground)] mt-1">
                      All course students
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Conversation Name (Optional)</label>
                  <Input
                    placeholder="e.g., Study Group, Project Team"
                    value={conversationName}
                    onChange={(e) => setConversationName(e.target.value)}
                    className="bg-[var(--background)] border-[var(--border)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                    placeholder="Describe the purpose of this conversation..."
                    value={conversationDescription}
                    onChange={(e) => setConversationDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && conversationType === 'course' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Course</h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <Input
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[var(--background)] border-[var(--border)]"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredCourses.map(course => (
                  <button
                    key={course._id}
                    onClick={() => setSelectedCourse(course)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedCourse?._id === course._id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{course.courseCode || 'N/A'}</div>
                        <div className="text-sm text-[var(--muted-foreground)]">{course.title}</div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-1">
                          {course.instructor} • {course.currentEnrollment || 0} students enrolled
                        </div>
                      </div>
                      {selectedCourse?._id === course._id && (
                        <Check className="w-5 h-5 text-[var(--primary)]" />
                      )}
                    </div>
                  </button>
                ))}
                {filteredCourses.length === 0 && (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    No courses found
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && conversationType !== 'course' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Participants</h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[var(--background)] border-[var(--border)]"
                  />
                </div>
                {selectedParticipants.length > 0 && (
                  <div className="mb-4 p-3 bg-[var(--muted)] rounded-lg">
                    <div className="text-sm font-medium mb-2">
                      Selected: {selectedParticipants.length} participant{selectedParticipants.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedParticipants.map(email => {
                        const user = users.find(u => u.email === email);
                        return (
                          <div key={email} className="px-3 py-1 bg-[var(--primary)]/20 text-[var(--primary)] rounded-full text-sm flex items-center gap-2">
                            {user?.name || email}
                            <button onClick={() => toggleParticipant(email)} className="hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {loadingUsers ? (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">No users found</div>
                ) : (
                  filteredUsers.map(user => {
                    const isSelected = selectedParticipants.includes(user.email);
                    const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                    
                    return (
                      <button
                        key={user._id}
                        onClick={() => toggleParticipant(user.email)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{displayName}</div>
                          <div className="text-sm text-[var(--muted-foreground)]">{user.email}</div>
                          {user.role && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                              {user.role}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-[var(--primary)]" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t border-[var(--border)] p-4 flex gap-3 flex-shrink-0">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
          )}
          {step === 1 ? (
            <Button onClick={() => setStep(2)} className="flex-1" disabled={!canProceed()}>
              Next
            </Button>
          ) : (
            <Button onClick={handleCreate} className="flex-1" disabled={!canProceed() || loading}>
              {loading ? 'Creating...' : 'Create Conversation'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

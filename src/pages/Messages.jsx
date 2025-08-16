import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Search,
  Phone,
  Video,
  MoreVertical, // Changed from MoreHorizontal to MoreVertical for header buttons
  Plus, // For New Conversation button
  FileText, // For file type messages
  Circle // For typing indicator dots
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast'; // Assuming you have a Toast component

// Import shadcn/ui components
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';

// Dynamic Socket.IO client import
let io;
async function getSocket() {
  if (!io) {
    const mod = await import('socket.io-client');
    io = mod.io;
  }
  return io;
}

// Re-using the logic for initials from previous Avatar, now as a helper for AvatarFallback
function getInitials(name) {
  return (name || 'C').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('');
}

// ConversationListItem component - Adapted to use shadcn/ui Avatar and Badge
function ConversationListItem({ active, title, subtitle, time, onClick, online, courseTag }) {
  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-start gap-3
        ${active
          ? 'bg-[var(--primary)]/10 border-l-4 border-[var(--primary)]'
          : 'hover:bg-[var(--secondary)]/50'
        }
      `}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          {/* AvatarImage src={conv.avatar || undefined}  - Assuming avatar URLs are not directly from backend yet */}
          <AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)]">
            {getInitials(title)}
          </AvatarFallback>
        </Avatar>
        {online && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--card)]"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium truncate text-[var(--foreground)]">{title}</h4>
          <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">{time}</span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)] truncate flex-1">
            {subtitle}
          </p>
          {/* Unread badge logic would go here if you pass unread count from backend */}
          {/* Example: {unread > 0 && <Badge variant="default" className="ml-2 px-2 h-5 text-xs">{unread}</Badge>} */}
        </div>

        {courseTag && (
          <Badge variant="outline" className="mt-1 text-xs bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]">
            {courseTag}
          </Badge>
        )}
      </div>
    </div>
  );
}

// MessageBubble component - Adapted for shadcn/ui based theme
function MessageBubble({ self, name, content, ts, type, fileUrl, fileName }) {
  // Styles adjusted to match the new image's bubbles with shadcn/ui colors
  const bgColor = self ? 'bg-[var(--primary)]' : 'bg-[var(--secondary)]';
  const textColor = self ? 'text-[var(--primary-foreground)]' : 'text-[var(--secondary-foreground)]';
  const borderRadius = self ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md';

  return (
    <div className={`max-w-[70%] px-4 py-3 text-sm shadow ${bgColor} ${textColor} ${borderRadius} whitespace-pre-wrap break-words flex flex-col`}>
      {!self && <div className="text-[var(--muted-foreground)] text-xs mb-0.5">{name}</div>}
      {type === 'file' ? (
        <a href={fileUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
          <Paperclip className="w-4 h-4" />
          <span className="font-medium">{fileName || content}</span> {/* Use fileName if available, else content */}
        </a>
      ) : (
        <p className="text-sm">{content}</p>
      )}
      <p className={`text-[10px] mt-1 ${self ? 'text-right text-black/70' : 'text-right text-[var(--muted-foreground)]'}`}>
        {ts}
      </p>
    </div>
  );
}

// NewConversationModal component - Remains mostly the same, ensuring shadcn/ui consistency
function NewConversationModal({ onClose, onCreated, isTeacher }) {
  const [name, setName] = useState('');
  const [emails, setEmails] = useState('');

  if (!isTeacher) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4"> {/* Using Card component */}
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <h3 className="text-lg font-semibold">New Conversation</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-3"> {/* Using CardContent */}
          <div>
            <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Name</label>
            <Input className="bg-[var(--input)] border-[var(--border)] focus-visible:ring-[var(--primary)]" value={name} onChange={e => setName(e.target.value)} placeholder="Study Group - CS101" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Participant emails (comma separated)</label>
            <textarea className="w-full min-h-[90px] px-3 py-2 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]" value={emails} onChange={e => setEmails(e.target.value)} placeholder="alice@campus.edu, bob@campus.edu" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
              onClick={async () => {
                try {
                  const list = emails.split(',').map(s => s.trim()).filter(Boolean);
                  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/conversations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('firebase_id_token') || ''}` },
                    body: JSON.stringify({ name, type: 'group', participantsEmails: list })
                  });
                  if (!res.ok) throw new Error('Failed to create conversation');
                  const conv = await res.json();
                  toast.success('Conversation created');
                  onCreated && onCreated(conv);
                  onClose();
                } catch (err) {
                  toast.error(err.message || 'Failed to create');
                }
              }}
            >Create</Button>
            <Button variant="outline" className="flex-1 border-[var(--border)] hover:bg-[var(--muted)]" onClick={onClose}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// Main Messages Component
export default function Messages() {
  const { userRole, userUid, userFirstName, userLastName } = useAuth();
  const isTeacher = userRole === 'teacher';

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null); // Ref for scrolling to bottom of messages

  // Effect to set up and manage the Socket.IO connection
  useEffect(() => {
    fetchConversations();
    setupSocket();
    return () => {
      try {
        socketRef.current && socketRef.current.disconnect();
      } catch (_) {}
    };
  }, []);

  // Effect to fetch messages when active conversation changes and scroll to bottom
  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
      try {
        socketRef.current?.emit('joinConversation', { conversationId: activeId });
      } catch (_) {}
    }
  }, [activeId]);

  // Effect to scroll messages to bottom whenever messages array updates
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  async function setupSocket() {
    try {
      const ioFactory = await getSocket();
      const socket = ioFactory(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
      socketRef.current = socket;

      socket.on('receiveMessage', (payload) => {
        if (payload?.conversationId === activeId) {
          setMessages((prev) => [...prev, payload]);
        }
      });

      socket.on('typing', (payload) => {
        if (payload.userId !== userUid) {
          setTypingUsers((prev) => [...new Set([...prev, payload.userId])]);
        }
      });

      socket.on('stopTyping', (payload) => {
        setTypingUsers((prev) => prev.filter(id => id !== payload.userId));
      });

      socket.on('disconnect', () => {
        console.warn('Socket disconnected');
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        toast.error('Chat connection failed. Please refresh.');
      });

    } catch (err) {
      console.error('Socket setup failed', err);
      toast.error('Failed to establish chat connection.');
    }
  }

  async function fetchConversations() {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('firebase_id_token') || ''}`
        }
      });
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data || []);
      // Set the first conversation as active if none is active and data exists
      if ((data || []).length && !activeId) {
        setActiveId(data[0]._id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(conversationId) {
    try {
      setLoading(true); // Indicate loading for messages too
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/conversations/${conversationId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('firebase_id_token') || ''}`
        }
      });
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false); // Done loading messages
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleTyping() {
    if (socketRef.current && activeId && userUid) {
      socketRef.current.emit('typing', { conversationId: activeId, userId: userUid });
    }
  }

  function handleStopTyping() {
    if (socketRef.current && activeId && userUid) {
      socketRef.current.emit('stopTyping', { conversationId: activeId, userId: userUid });
    }
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || !activeId) return;

    setInput('');
    handleStopTyping();

    try {
      // Optimistic update
      const optimisticMessage = {
        conversationId: activeId,
        content,
        type: 'text',
        senderUid: userUid,
        senderName: `${userFirstName || ''} ${userLastName || ''}`.trim() || 'You',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('firebase_id_token') || ''}`
        },
        body: JSON.stringify({ content, type: 'text' })
      });

      if (!res.ok) {
        throw new Error('Failed to send message to server');
      }

      socketRef.current?.emit('sendMessage', { conversationId: activeId, content, type: 'text' });

    } catch (err) {
      console.error('Send message failed:', err);
      toast.error(err.message || 'Failed to send message');
      setMessages((prev) => prev.filter(msg => msg !== optimisticMessage)); // Revert optimistic update
    }
  }

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c => (c.name || '').toLowerCase().includes(q) ||
      (c.participants || []).some(p => ((p.firstName || '') + ' ' + (p.lastName || '')).trim().toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q))
    );
  }, [conversations, search]);

  const activeConv = conversations.find(c => c._id === activeId);

  // Determine the active conversation's display name for the header
  const activeConversationDisplayName = activeConv
    ? (activeConv.name || activeConv.participants
        ?.filter(p => p.firebaseUid !== userUid)
        .map(p => `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email.split('@')[0])
        .join(', ') || 'Unnamed Conversation')
    : 'Select a conversation';


  return (
    <div className="p-6 space-y-6 bg-[var(--background)] text-[var(--foreground)] min-h-screen">
      {/* Header (Main Page Title) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Communicate with professors and study groups
          </p>
        </div>
        {/* New Conversation Button - Teachers only */}
        {isTeacher && (
          <Button className="h-10 px-4 rounded-md bg-[var(--primary)] text-black hover:opacity-90 font-semibold inline-flex items-center gap-2" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" /> New
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]"> {/* Adjusted height to fit screen */}
        {/* Conversations List Panel */}
        <Card className="glass-card flex flex-col">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-full"> {/* Make ScrollArea fill available height */}
              <div className="space-y-1 p-4">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => {
                    const isOnline = conv.online || false; // Placeholder for online status from backend
                    const convCourseTag = conv.courseTag || (conv.name?.includes('CS101') ? 'CS101' : conv.name?.includes('MATH201') ? 'MATH201' : null); // Placeholder for course tag

                    const itemTitle = conv.name || conv.participants
                      ?.filter(p => p.firebaseUid !== userUid) // Exclude self for DM name
                      .map(p => `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email.split('@')[0])
                      .join(', ') || 'Unnamed Conversation';

                    return (
                      <ConversationListItem
                        key={conv._id} // Use _id from backend
                        active={activeId === conv._id}
                        title={itemTitle}
                        subtitle={conv.lastMessage?.content || ''}
                        time={conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        onClick={() => setActiveId(conv._id)}
                        online={isOnline}
                        courseTag={convCourseTag}
                      />
                    );
                  })
                ) : (
                  !loading && <div className="text-center text-[var(--muted-foreground)] p-4">No conversations found.</div>
                )}
                {loading && <div className="text-center text-[var(--muted-foreground)] p-4">Loading conversations...</div>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window Panel */}
        <div className="lg:col-span-2">
          <Card className="glass-card h-full flex flex-col">
            {/* Chat Header */}
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      {/* AvatarImage src={currentConversation?.avatar || undefined} - Assuming avatar URLs are not directly from backend yet */}
                      <AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)]">
                        {getInitials(activeConversationDisplayName)}
                      </AvatarFallback>
                    </Avatar>
                    {activeConv?.online && ( // Online status for active conversation
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--card)]"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{activeConversationDisplayName}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {activeConv?.online ? 'Online now' : (activeConv?.participants?.length > 0 ? `${activeConv.participants.length} participants` : 'Offline')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4">
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg._id || msg.id} // Use _id from backend, fallback to hardcoded id
                        className={`flex ${msg.senderUid === userUid ? 'justify-end' : 'justify-start'}`}
                      >
                        <MessageBubble
                          self={msg.senderUid === userUid}
                          name={msg.senderName || 'Unknown'} // Sender name comes from backend
                          content={msg.content}
                          ts={new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          type={msg.type}
                          fileUrl={msg.fileUrl}
                          fileName={msg.fileName}
                        />
                      </div>
                    ))
                  ) : (
                    !loading && activeId && <div className="text-center text-[var(--muted-foreground)] py-4">No messages yet. Start the conversation!</div>
                  )}
                  {loading && activeId && !messages.length && <div className="text-center text-[var(--muted-foreground)] py-4">Loading messages...</div>}
                  {!activeId && !loading && <div className="text-center text-[var(--muted-foreground)] py-4">Select a conversation to view messages.</div>}

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && activeId && (
                    <div className="flex justify-start">
                      <div className="bg-[var(--secondary)] text-[var(--secondary-foreground)] px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex items-center gap-1">
                          <Circle className="w-2 h-2 fill-current animate-pulse" />
                          <Circle className="w-2 h-2 fill-current animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <Circle className="w-2 h-2 fill-current animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)] ml-2 self-center">
                        {typingUsers.map(uid => {
                          const typingUser = conversations.find(c => c._id === activeId)?.participants?.find(p => p.firebaseUid === uid);
                          return typingUser ? `${typingUser.firstName || typingUser.email.split('@')[0]} ` : `${uid.substring(0, 8)}... `;
                        }).join(', ')} is typing...
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} /> {/* For scrolling to bottom */}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Message Input (Composer) */}
            <div className="p-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-4 h-4 text-[var(--muted-foreground)]" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      if (e.target.value.length > 0) handleTyping();
                      else handleStopTyping();
                    }}
                    onBlur={handleStopTyping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        sendMessage();
                        e.preventDefault();
                      }
                    }}
                    className="pr-10 bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:ring-[var(--primary)]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  >
                    <Smile className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </Button>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNew && isTeacher && (
        <NewConversationModal
          isTeacher={isTeacher}
          onClose={() => setShowNew(false)}
          onCreated={(conv) => {
            setConversations(prev => [conv, ...prev]);
            setActiveId(conv._id);
          }}
        />
      )}
    </div>
  );
}

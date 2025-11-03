import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Paperclip, Smile, Search, Users, Phone, Video, MoreVertical, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import api from '../services/api';
import CreateConversationModal from '../components/CreateConversationModal';

function getInitials(name) {
  if (!name) return 'U';
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() || '')
      .join('') || 'U'
  );
}

function formatTime(date) {
  if (!date) return '';
  const timestamp = new Date(date);
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();

  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) {
    const hours = Math.floor(diff / 3_600_000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (diff < 604_800_000) {
    const days = Math.floor(diff / 86_400_000);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  return timestamp.toLocaleDateString();
}

function formatMessageTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDayLabel(date) {
  if (!date) return '';
  const target = new Date(date);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - target.setHours(0, 0, 0, 0)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return target.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatPresence(date) {
  if (!date) return 'Active recently';
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60_000) return 'Active just now';
  if (diff < 3_600_000) return `Active ${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `Active ${Math.floor(diff / 3_600_000)}h ago`;
  return `Last active on ${new Date(date).toLocaleDateString()}`;
}

export default function Messages() {
  const { userUid, userRole } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const messagesEndRef = useRef(null);

  async function fetchConversations() {
    try {
      setLoadingConversations(true);
      const data = await api.getConversations();
      const safeData = Array.isArray(data) ? data : [];
      setConversations(safeData);

      if (selectedConversationId) {
        const stillExists = safeData.some((conversation) => conversation._id === selectedConversationId);
        if (!stillExists) {
          setSelectedConversationId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }

  async function fetchMessages(conversationId) {
    try {
      setLoadingMessages(true);
      const data = await api.getConversationMessages(conversationId);
      setMessages(Array.isArray(data) ? data : []);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    if (!userUid) {
      setConversations([]);
      setSelectedConversationId(null);
      setMessages([]);
      setLoadingConversations(false);
      return;
    }
    fetchConversations();
  }, [userUid]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    fetchMessages(selectedConversationId);
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    const query = searchTerm.toLowerCase();
    return conversations.filter((conversation) => {
      const titleMatch = conversation.title?.toLowerCase().includes(query);
      const participantMatch = conversation.participants?.some((participant) =>
        participant.name?.toLowerCase().includes(query)
      );
      return titleMatch || participantMatch;
    });
  }, [conversations, searchTerm]);

  const totalUnread = useMemo(
    () => conversations.reduce((acc, conversation) => acc + (conversation.unreadCount || 0), 0),
    [conversations]
  );

  const onlineCount = useMemo(
    () => conversations.filter((conversation) => conversation.online).length,
    [conversations]
  );

  const groupedMessages = useMemo(() => {
    if (!messages.length) return [];
    const groups = [];
    messages.forEach((message) => {
      const timestamp = message.createdAt || message.timestamp || message.sentAt || Date.now();
      const dayKey = new Date(timestamp).toDateString();
      const currentGroup = groups[groups.length - 1];
      if (!currentGroup || currentGroup.key !== dayKey) {
        groups.push({
          key: dayKey,
          label: formatDayLabel(timestamp),
          items: [message],
        });
      } else {
        currentGroup.items.push(message);
      }
    });
    return groups;
  }, [messages]);

  const conversationSubtitle = useMemo(() => {
    if (!selectedConversation) return 'Conversation';
    if (selectedConversation.groupInfo) return selectedConversation.groupInfo;
    if (selectedConversation.courseTag) return selectedConversation.courseTag;
    const otherNames = (selectedConversation.participants || [])
      .filter((participant) => participant?.uid && participant.uid !== userUid)
      .map((participant) => participant.name)
      .filter(Boolean);
    return otherNames.length ? otherNames.join(', ') : 'Conversation';
  }, [selectedConversation, userUid]);

  const conversationPresence = useMemo(() => {
    if (!selectedConversation) return '';
    const reference =
      selectedConversation.lastMessage?.timestamp ||
      selectedConversation.lastMessageAt ||
      selectedConversation.createdAt;
    return formatPresence(reference);
  }, [selectedConversation]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    const text = messageInput.trim();
    if (!text || !selectedConversationId) return;

    try {
      const newMessage = await api.sendConversationMessage(selectedConversationId, {
        content: text,
        type: 'text',
      });

      setMessages((prev) => [...prev, newMessage]);
      setMessageInput('');
      scrollToBottom();
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message', error);
      toast.error('Failed to send message');
    }
  }

  function handleCreateConversation() {
    if (userRole !== 'teacher') {
      toast.error('Only teachers can create conversations');
      return;
    }
    setShowCreateModal(true);
  }

  async function handleConversationCreated() {
    await fetchConversations();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--background)] text-[var(--foreground)]">
      <CreateConversationModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onCreated={handleConversationCreated}
      />
      <div className="px-6 py-6 border-b border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--secondary)]">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Messages</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Communicate with professors and study groups</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
              <p className="text-2xl font-semibold text-[var(--foreground)]">{totalUnread}</p>
              <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Unread</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-[var(--foreground)]">{onlineCount}</p>
              <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Online</p>
            </div>
            <button
              type="button"
              onClick={handleCreateConversation}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-lg hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              New chat
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 border-r border-[var(--border)] bg-[var(--card)] flex flex-col">
          <div className="p-5 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
              <input
                type="search"
                placeholder="Search conversations..."
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[var(--input-background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
            {loadingConversations ? (
              <div className="flex justify-center items-center h-full text-[var(--muted-foreground)]">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted-foreground)]">No conversations found</div>
            ) : (
              filteredConversations.map((conversation) => {
                const isActive = selectedConversationId === conversation._id;
                const gradientStart = conversation.avatarColor || '#06b6d4';
                const gradientEnd = conversation.avatarColor2 || '#3b82f6';
                const unreadCount = conversation.unreadCount || 0;

                return (
                  <button
                    type="button"
                    key={conversation._id}
                    onClick={() => setSelectedConversationId(conversation._id)}
                    className={`group w-full text-left rounded-xl border transition-all ${
                      isActive
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg'
                        : 'border-[var(--border)] bg-[var(--secondary)] hover:border-[var(--primary)]/50 hover:bg-[var(--secondary)]/80'
                    }`}
                  >
                    <div className="p-4 flex items-start gap-3">
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shadow-lg"
                          style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
                        >
                          {conversation.type === 'group' ? <Users className="w-5 h-5" /> : getInitials(conversation.title)}
                        </div>
                        {conversation.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[var(--card)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-[var(--foreground)] truncate">
                              {conversation.title || 'Untitled Conversation'}
                            </h4>
                            <p className="text-sm text-[var(--muted-foreground)] truncate mt-1">
                              {conversation.lastMessage?.sender?.name ? `${conversation.lastMessage.sender.name}: ` : ''}
                              {conversation.preview || 'No messages yet'}
                            </p>
                          </div>
                          <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                            {formatTime(conversation.lastMessage?.timestamp || conversation.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-xs">
                          {conversation.courseTag && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--primary)]/20 text-[var(--primary)] font-medium border border-[var(--primary)]/30">
                              {conversation.courseTag}
                            </span>
                          )}
                          {conversation.groupInfo && <span className="text-[var(--muted-foreground)]">{conversation.groupInfo}</span>}
                          {unreadCount > 0 && (
                            <span className="ml-auto w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold flex items-center justify-center">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex-1 bg-[var(--background)] flex flex-col">
          {selectedConversation ? (
            <>
              <header className="h-24 border-b border-[var(--border)] bg-[var(--card)] px-6 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${selectedConversation.avatarColor || '#06b6d4'}, ${
                          selectedConversation.avatarColor2 || '#3b82f6'
                        })`,
                      }}
                    >
                      {selectedConversation.type === 'group' ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        getInitials(selectedConversation.title)
                      )}
                    </div>
                    {(selectedConversation.online || selectedConversation.type === 'private') && (
                      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[var(--card)] bg-green-400 shadow-lg" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">{selectedConversation.title}</h2>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center gap-2">
                      <span>{conversationSubtitle}</span>
                      {conversationPresence && (
                        <span className="flex items-center gap-1 text-[var(--primary)]">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                          {conversationPresence}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
                  <button className="w-10 h-10 rounded-full border border-[var(--border)] hover:bg-[var(--secondary)] flex items-center justify-center transition-colors" title="Start a call">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-full border border-[var(--border)] hover:bg-[var(--secondary)] flex items-center justify-center transition-colors" title="Start a video call">
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-full border border-[var(--border)] hover:bg-[var(--secondary)] flex items-center justify-center transition-colors" title="Conversation options">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[var(--background)]">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full text-[var(--muted-foreground)]">Loading messages...</div>
                ) : groupedMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 h-full text-[var(--muted-foreground)]">
                    <Users className="w-8 h-8" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  groupedMessages.map((group, groupIndex) => (
                    <div key={group.key} className="space-y-4">
                      <div className="sticky top-0 z-10">
                        <div className="mx-auto w-fit rounded-full bg-[var(--secondary)] border border-[var(--border)] px-4 py-1 text-xs font-medium text-[var(--foreground)] shadow-lg">
                          {group.label}
                        </div>
                      </div>
                      {group.items.map((message, index) => {
                        const senderUid = message.sender?.uid || message.senderUid;
                        const isSelf = senderUid === userUid;
                        const previousFromGroup = group.items[index - 1];
                        const previousFromPreviousGroup =
                          index === 0 && groupIndex > 0
                            ? groupedMessages[groupIndex - 1].items[groupedMessages[groupIndex - 1].items.length - 1]
                            : null;
                        const previousSender = previousFromGroup || previousFromPreviousGroup;
                        const previousSenderUid = previousSender ? previousSender.sender?.uid || previousSender.senderUid : null;
                        const showName = !isSelf && senderUid !== previousSenderUid;

                        return (
                          <div key={message._id || `${senderUid}-${message.timestamp}-${index}`} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[72%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                              {showName && (
                                <span className="text-xs text-[var(--muted-foreground)] mb-1">
                                  {message.sender?.name || 'Unknown participant'}
                                </span>
                              )}
                              <div
                                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
                                  isSelf
                                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] rounded-br-md'
                                    : 'bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] rounded-bl-md'
                                }`}
                              >
                                {message.content}
                              </div>
                              <span className="text-xs text-[var(--muted-foreground)] mt-2">
                                {formatMessageTime(message.createdAt || message.timestamp)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <footer className="border-t border-[var(--border)] bg-[var(--card)] px-6 py-5">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <button
                    type="button"
                    className="w-11 h-11 rounded-xl border border-[var(--border)] hover:bg-[var(--secondary)] flex items-center justify-center text-[var(--muted-foreground)] transition"
                    title="Attach file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="flex-1 h-12 rounded-xl bg-[var(--input-background)] border border-[var(--border)] flex items-center gap-3 px-3 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)] transition-all">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                    />
                    <button
                      type="button"
                      className="w-9 h-9 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] flex items-center justify-center text-[var(--muted-foreground)] transition"
                      title="Add emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="w-12 h-12 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-semibold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
                    title="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center flex-col gap-4 text-[var(--muted-foreground)]">
              <div className="w-16 h-16 rounded-full bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)]">
                <Users className="w-7 h-7" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Select a conversation</h3>
                <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
                  Choose a thread from the left to see the full message history and continue the discussion.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

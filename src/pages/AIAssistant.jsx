import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Sparkles, Send, Plus, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from '../components/Toast';

export default function AIAssistant() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadConversationMessages(activeConversation._id);
    }
  }, [activeConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await api.getAIConversations();
      setConversations(data.conversations || []);
      
      // Auto-select first conversation if available
      if (data.conversations?.length > 0 && !activeConversation) {
        setActiveConversation(data.conversations[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId) => {
    try {
      const data = await api.getAIConversation(conversationId);
      setMessages(data.conversation?.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const createNewConversation = async () => {
    if (creatingConversation) return;
    
    try {
      setCreatingConversation(true);
      const data = await api.createAIConversation('New Chat');
      setConversations([data.conversation, ...conversations]);
      setActiveConversation(data.conversation);
      setMessages([]);
      toast.success('New conversation created');
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create conversation');
    } finally {
      setCreatingConversation(false);
    }
  };

  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;

    try {
      await api.deleteAIConversation(conversationId);
      setConversations(conversations.filter(c => c._id !== conversationId));
      
      // If deleting active conversation, select first remaining one
      if (activeConversation?._id === conversationId) {
        const remaining = conversations.filter(c => c._id !== conversationId);
        setActiveConversation(remaining[0] || null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversation || sendingMessage) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSendingMessage(true);

    // Optimistically add user message
    const tempUserMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const data = await api.sendAIMessage(activeConversation._id, userMessage);
      
      console.log('Received response:', data);
      console.log('Messages count:', data.conversation?.messages?.length);
      
      // Replace with actual messages from server (includes full history)
      if (data.conversation?.messages) {
        console.log('Setting messages to:', data.conversation.messages.length);
        setMessages(data.conversation.messages);
      } else {
        console.error('No messages in response!');
      }
      
      // Update conversation title and timestamp if it changed
      if (data.conversation) {
        const updatedConv = {
          ...activeConversation,
          title: data.conversation.title,
          updatedAt: new Date().toISOString()
        };
        setActiveConversation(updatedConv);
        
        // Update in conversations list
        setConversations(conversations.map(c => 
          c._id === data.conversation._id ? updatedConv : c
        ));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <button
            onClick={createNewConversation}
            disabled={creatingConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingConversation ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            <span className="font-medium">New Conversation</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1 opacity-70">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => setActiveConversation(conv)}
                className={`p-4 border-b border-border cursor-pointer transition-all group hover:bg-accent ${
                  activeConversation?._id === conv._id
                    ? 'bg-accent border-l-4 border-l-primary'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate mb-1">
                      {conv.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(conv.updatedAt || conv.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{activeConversation.title}</h2>
                  <p className="text-xs text-muted-foreground">AI Assistant powered by Google Gemini</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Hello, {currentUser?.displayName || 'there'}! 👋
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      I'm your personal AI assistant. I have access to your courses, attendance records, and can help answer questions about your academic journey.
                    </p>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="p-3 bg-card rounded-lg text-left border border-border hover:border-primary/50 transition-colors cursor-pointer hover-lift">
                        <p className="text-foreground">💡 Try asking: "How's my attendance doing?"</p>
                      </div>
                      <div className="p-3 bg-card rounded-lg text-left border border-border hover:border-primary/50 transition-colors cursor-pointer hover-lift">
                        <p className="text-foreground">📚 Try asking: "What courses am I enrolled in?"</p>
                      </div>
                      <div className="p-3 bg-card rounded-lg text-left border border-border hover:border-primary/50 transition-colors cursor-pointer hover-lift">
                        <p className="text-foreground">🎯 Try asking: "Give me study tips for my courses"</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white/10">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-5 py-3.5 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg border border-primary/20'
                            : 'bg-card/80 backdrop-blur-sm border border-border/50 text-foreground shadow-md hover:shadow-lg transition-shadow'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-2 ${msg.role === 'user' ? 'opacity-70' : 'opacity-50'}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg border-2 border-white/10">
                          {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  ))}
                  {sendingMessage && (
                    <div className="flex gap-3 justify-start animate-fadeIn">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white/10">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl px-5 py-3.5 shadow-md">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background/95 backdrop-blur-md">
              <form onSubmit={sendMessage} className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about your courses, attendance, or academics..."
                    disabled={sendingMessage}
                    style={{ color: 'var(--foreground)' }}
                    className="w-full px-4 py-3.5 bg-[#0f172a] border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder:text-muted-foreground/70 disabled:opacity-50 transition-all shadow-sm hover:shadow-md hover:border-primary/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sendingMessage}
                  className="px-6 py-3.5 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover-lift"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span className="font-semibold">Send</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center opacity-50 shadow-lg">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to AI Assistant</h3>
              <p className="text-muted-foreground">Select a conversation or start a new one to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

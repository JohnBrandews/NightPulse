'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import { FiSend, FiMessageCircle, FiCheck, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [recipientOnline, setRecipientOnline] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to SSE stream
  const connectToStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/messages/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection established');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connected') {
        setCurrentUser(data.userId);
      } else if (data.type === 'new_message') {
        handleNewMessage(data.message);
      } else if (data.type === 'status_update') {
        handleMessageStatusUpdate(data.messageIds, data.status);
      } else if (data.type === 'unread_count') {
        // Optionally update unread count badge
        console.log('Unread count:', data.count);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connectToStream();
      }, 3000);
    };
  }, []);

  const handleNewMessage = useCallback((message: any) => {
    // If message is for the current conversation, add it
    if (selectedConversation) {
      const isFromSelectedUser = message.senderId === selectedConversation || message.recipientId === selectedConversation;
      if (isFromSelectedUser) {
        setMessages(prev => [...prev, message]);
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
    
    // Update conversations list
    setConversations(prev => {
      const existingIndex = prev.findIndex(c => 
        c.user?.id === message.senderId || c.user?.id === message.recipientId
      );
      
      const otherUserId = message.senderId === currentUser ? message.recipientId : message.senderId;
      const otherUser = message.senderId === currentUser ? message.recipient : message.sender;
      
      if (existingIndex >= 0) {
        // Move to top and update last message
        const updated = [...prev];
        const [removed] = updated.splice(existingIndex, 1);
        updated.unshift({
          ...removed,
          lastMessage: message,
        });
        return updated;
      } else {
        // Add new conversation at top
        return [{
          user: otherUser,
          lastMessage: message,
          unread: message.recipientId === currentUser ? 1 : 0,
        }, ...prev];
      }
    });

    // Mark message as read if viewing the conversation
    if (selectedConversation && message.senderId === selectedConversation) {
      fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: selectedConversation }),
      });
    }
  }, [selectedConversation, currentUser]);

  const handleMessageStatusUpdate = useCallback((messageIds: string[], status: string) => {
    setMessages(prev => prev.map(msg => 
      messageIds.includes(msg.id) ? { ...msg, status } : msg
    ));
  }, []);

  useEffect(() => {
    loadConversations();
    sendHeartbeat();
    connectToStream();
    heartbeatInterval.current = setInterval(sendHeartbeat, 60000); // Every 60 seconds

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectToStream]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      checkOnlineStatus(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendHeartbeat = async () => {
    try {
      await fetch('/api/users/online', { method: 'POST' });
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/messages?with=${userId}`);
      const data = await res.json();
      setMessages(data.messages || []);

      // Mark messages as read
      const unreadMessages = data.messages?.filter((m: any) =>
        (m.sender?.id === userId || m.sender?._id === userId) &&
        m.status !== 'read'
      ) || [];

      if (unreadMessages.length > 0) {
        await fetch('/api/messages/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderId: userId }),
        });
      }

      // Find recipient info from conversations
      const conv = conversations.find((c: any) => c.user?._id === userId || c.user?.id === userId);
      if (conv) {
        setRecipient(conv.user);
      } else if (data.messages && data.messages.length > 0) {
        const firstMsg = data.messages[0];
        const recipientId = firstMsg.sender?._id === userId ? firstMsg.recipient : firstMsg.sender;
        if (recipientId) setRecipient(recipientId);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const checkOnlineStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/online?ids=${userId}`);
      const data = await res.json();
      const user = data.users?.find((u: any) => u.id === userId);
      if (user) {
        // Consider online if last active was within 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        setRecipientOnline(user.isOnline && new Date(user.lastActive) > twoMinutesAgo);
      }
    } catch (error) {
      console.error('Failed to check online status:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedConversation) return;

    // Optimistically add message to UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: currentUser,
      recipientId: selectedConversation,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempMessage]);
    const contentToSend = messageContent;
    setMessageContent('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: selectedConversation,
          content: contentToSend,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Remove optimistic message and show error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        toast.error(data.error || 'Failed to send message');
      }
      // If successful, the SSE will deliver the real message
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      toast.error('An error occurred');
    }
  };

  // WhatsApp-style tick icons
  const MessageStatusIcon = ({ status }: { status: string }) => {
    if (status === 'sent') {
      return <FiCheck className="w-4 h-4 ml-1 opacity-70" />;
    } else if (status === 'delivered') {
      return (
        <span className="flex ml-1">
          <FiCheckCircle className="w-4 h-4 -mr-2 opacity-70" />
          <FiCheckCircle className="w-4 h-4 opacity-70" />
        </span>
      );
    } else if (status === 'read') {
      return (
        <span className="flex ml-1 text-blue-400">
          <FiCheckCircle className="w-4 h-4 -mr-2" />
          <FiCheckCircle className="w-4 h-4" />
        </span>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Messages</h1>
          <p className="text-gray-400">Chat with your matches and send club invites</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Conversations</h2>
            <div className="space-y-2">
              {conversations.map((conv) => {
                const userId = conv.user?._id || conv.user?.id;
                return (
                  <button
                    key={userId}
                    onClick={() => setSelectedConversation(userId)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversation === userId
                        ? 'bg-accent-primary/20 border border-accent-primary'
                        : 'hover:bg-night-lighter'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-night-lighter flex items-center justify-center overflow-hidden">
                            {conv.user?.profileImage ? (
                              <img
                                src={conv.user.profileImage}
                                alt={conv.user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <FiMessageCircle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          {/* Online indicator dot */}
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-night-dark ${
                            conv.user?.isOnline ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold">{conv.user?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-400 line-clamp-1">
                            {conv.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                      {conv.unread > 0 && (
                        <span className="bg-accent-primary text-white text-xs rounded-full px-2 py-1">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {conversations.length === 0 && (
                <p className="text-gray-400 text-center py-8">No conversations yet</p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="md:col-span-2 card flex flex-col h-[600px]">
            {selectedConversation ? (
              <>
                <div className="border-b border-night-lighter pb-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-night-lighter flex items-center justify-center overflow-hidden">
                        {recipient?.profileImage ? (
                          <img
                            src={recipient.profileImage}
                            alt={recipient.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <FiMessageCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      {/* Online indicator dot */}
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-night-dark ${
                        recipientOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{recipient?.name}</h3>
                      <p className="text-sm text-gray-400">
                        {recipientOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((msg) => {
                    const isFromOther = msg.sender?._id === selectedConversation || msg.sender?.id === selectedConversation;
                    return (
                      <div
                        key={msg._id || msg.id}
                        className={`flex ${isFromOther ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            isFromOther
                              ? 'bg-night-lighter'
                              : 'bg-accent-primary text-white'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <div className={`flex items-center justify-end mt-1 text-xs ${
                            isFromOther ? 'text-gray-400' : 'text-white/70'
                          }`}>
                            <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                            {!isFromOther && <MessageStatusIcon status={msg.status} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Type a message..."
                  />
                  <button type="submit" className="btn-primary">
                    <FiSend className="w-5 h-5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FiMessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

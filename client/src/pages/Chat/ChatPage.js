import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PaperAirplaneIcon, UserIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const ChatPage = () => {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const response = await api.get(`/chat/sessions/${sessionId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchMessages();
    } else {
      setLoading(false);
    }
  }, [sessionId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const userMessage = {
      id: Date.now(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setSending(true);

    try {
      // Prepare request body
      const requestBody = { message: newMessage };
      
      // Only add sessionId if it's a valid UUID
      if (sessionId && sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        requestBody.sessionId = sessionId;
      }
      
      const response = await api.post('/chat/message', requestBody);

      const aiMessage = {
        id: response.data.id,
        content: response.data.message,
        sender: 'ai',
        timestamp: response.data.timestamp,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h1 className="text-lg font-semibold text-gray-900">AI Medical Assistant</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Ask questions about your medical reports or general health queries
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Start a conversation</h3>
              <p className="mt-2 text-sm text-gray-600">
                Ask me anything about your medical reports or health questions.
              </p>
              <div className="mt-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setNewMessage("Can you explain my recent blood test results?")}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-900">Explain test results</p>
                    <p className="text-xs text-gray-500">Get help understanding medical tests</p>
                  </button>
                  <button
                    onClick={() => setNewMessage("What do these medical terms mean?")}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-900">Medical terminology</p>
                    <p className="text-xs text-gray-500">Learn about medical terms</p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-indigo-600 text-white'
                      : message.isError
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start">
                    {message.sender === 'ai' && (
                      <div className="flex-shrink-0 mr-2">
                        <div className="h-6 w-6 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-indigo-600">AI</span>
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                    {message.sender === 'user' && (
                      <div className="flex-shrink-0 ml-2">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-2">
                    <div className="h-6 w-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-indigo-600">AI</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={sending}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

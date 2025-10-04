import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { LoadingSpinner } from './UI/LoadingSpinner';
import { Card } from './UI/Card';

const RAGChat = ({ reportId = null, initialContext = {} }) => {
  const { user } = useContext(AuthContext);
  const { translate } = useContext(LanguageContext);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [ragHealth, setRagHealth] = useState(null);

  const sendMessage = async () => {
    if (!query.trim() || loading) return;

    const userMessage = { type: 'user', content: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const context = {
        ...initialContext,
        reportId,
        language: 'english',
        sessionId: `session_${Date.now()}`,
        technicalLevel: 'simplified'
      };

      const response = await fetch('/api/rag/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ query, context })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          type: 'ai',
          content: data.data.response,
          sources: data.data.sources || [],
          confidence: data.data.confidence,
          fallback: data.data.fallback,
          model: data.data.model,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('RAG chat error:', error);
      const errorMessage = {
        type: 'error',
        content: translate('chatError', 'Sorry, I encountered an error. Please try again.'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  const checkRAGHealth = async () => {
    try {
      const response = await fetch('/api/rag/health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setRagHealth(data.data);
    } catch (error) {
      console.error('RAG health check error:', error);
    }
  };

  const getRecommendations = async () => {
    if (!reportId || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/rag/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reportId })
      });

      const data = await response.json();

      if (data.success) {
        const recommendationMessage = {
          type: 'recommendations',
          content: data.data.recommendations.fullResponse || JSON.stringify(data.data.recommendations, null, 2),
          sources: data.data.sources || [],
          relatedDocuments: data.data.relatedDocuments || [],
          confidence: data.data.confidence,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, recommendationMessage]);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('RAG recommendations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {translate('ragChat', 'AI Medical Assistant')}
          </h3>
          <div className="flex gap-2">
            {reportId && (
              <button
                onClick={getRecommendations}
                disabled={loading}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
              >
                {translate('getRecommendations', 'Get Recommendations')}
              </button>
            )}
            <button
              onClick={checkRAGHealth}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              {translate('checkHealth', 'Health')}
            </button>
          </div>
        </div>
        
        {ragHealth && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-2">RAG System Status:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className={`flex items-center gap-2 ${ragHealth.documentProcessing ? 'text-green-600' : 'text-red-600'}`}>
                <span>{ragHealth.documentProcessing ? '✅' : '❌'}</span>
                Document Processing
              </div>
              <div className={`flex items-center gap-2 ${ragHealth.chatSystem ? 'text-green-600' : 'text-red-600'}`}>
                <span>{ragHealth.chatSystem ? '✅' : '❌'}</span>
                Chat System
              </div>
              <div className={`flex items-center gap-2 ${ragHealth.pineconeConnection ? 'text-green-600' : 'text-red-600'}`}>
                <span>{ragHealth.pineconeConnection ? '✅' : '❌'}</span>
                Vector Database
              </div>
              <div className={`flex items-center gap-2 ${ragHealth.n8nWorkflows ? 'text-green-600' : 'text-red-600'}`}>
                <span>{ragHealth.n8nWorkflows ? '✅' : '❌'}</span>
                n8n Workflows
              </div>
            </div>
            {ragHealth.errors && ragHealth.errors.length > 0 && (
              <div className="mt-2 text-xs text-red-600">
                Issues: {ragHealth.errors.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-4 h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">🤖</div>
              <div>{translate('ragWelcome', 'Ask me anything about your medical reports or health questions!')}</div>
              {reportId && (
                <div className="text-sm mt-2">
                  {translate('ragReportContext', 'I have access to your current report for context.')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.type === 'error'
                    ? 'bg-red-100 text-red-800'
                    : message.type === 'recommendations'
                    ? 'bg-green-50 text-green-900 border border-green-200'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ 
                      __html: message.content.replace(/\n/g, '<br>') 
                    }} />
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        📚 {message.sources.length} source{message.sources.length !== 1 ? 's' : ''} referenced
                      </div>
                    )}
                    
                    {message.fallback && (
                      <div className="mt-2 text-xs text-yellow-600">
                        ⚠️ Using fallback model (RAG system unavailable)
                      </div>
                    )}
                    
                    {message.confidence && (
                      <div className="mt-2 text-xs text-gray-500">
                        Confidence: {(message.confidence * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs opacity-75 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">{translate('thinking', 'Thinking...')}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={translate('ragPlaceholder', 'Ask about your medical reports, symptoms, or health questions...')}
          className="flex-1 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="2"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={!query.trim() || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <span>📤</span>
          )}
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        {translate('ragDisclaimer', 'This AI assistant provides general information only. Always consult healthcare professionals for medical advice.')}
      </div>
    </Card>
  );
};

export default RAGChat;
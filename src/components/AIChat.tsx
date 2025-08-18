import React, { useState, useRef, useEffect } from 'react';
import { OpenAIService, GeneratedPlay } from '../services/openai.service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  play?: GeneratedPlay;
  timestamp: Date;
}

interface Props {
  onPlayGenerated: (play: GeneratedPlay) => void;
  currentPlay?: GeneratedPlay;
}

const AIChat: React.FC<Props> = ({ onPlayGenerated, currentPlay }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hey Coach! I'm your AI offensive coordinator. Tell me what kind of play you want to run. For example:\n\n• 'Create a trips right formation with a mesh concept'\n• 'I need a red zone play from the 5 yard line'\n• 'Show me a play action pass with max protection'\n• 'Design a 3rd and short play'",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Check if this is a modification request
      const isModification = currentPlay && (
        userMessage.toLowerCase().includes('change') ||
        userMessage.toLowerCase().includes('modify') ||
        userMessage.toLowerCase().includes('update') ||
        userMessage.toLowerCase().includes('switch')
      );

      let generatedPlay: GeneratedPlay;
      
      if (isModification && currentPlay) {
        generatedPlay = await OpenAIService.modifyPlay(userMessage, currentPlay);
      } else {
        generatedPlay = await OpenAIService.generatePlay({ userMessage });
      }

      // Add assistant response
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generatedPlay.explanation,
        play: generatedPlay,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
      
      // Notify parent component
      onPlayGenerated(generatedPlay);
    } catch (error) {
      // Add error message
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry coach, I had trouble generating that play. Could you try describing it differently?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    "Create a trips right mesh concept",
    "Design a red zone play from the 10",
    "I need a 3rd and 7 play",
    "Show me a play action deep shot"
  ];

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      background: 'var(--panel)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'var(--panel-2)'
      }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🤖</span>
          AI Offensive Coordinator
        </h3>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.7 }}>
          Powered by GPT-5
        </p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: message.role === 'user' ? 'var(--accent)' : 'var(--panel-2)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
              
              {message.play && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}>
                  <p style={{ margin: 0, fontWeight: 600, marginBottom: '0.5rem' }}>
                    📋 Generated: {message.play.formationDetails.name} {message.play.concept}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>Personnel: {message.play.formationDetails.personnel}</span>
                    <span>Protection: {message.play.protection}</span>
                  </div>
                </div>
              )}
              
              <time style={{
                display: 'block',
                fontSize: '0.75rem',
                opacity: 0.5,
                marginTop: '0.25rem'
              }}>
                {message.timestamp.toLocaleTimeString()}
              </time>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
            <div className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
            AI is thinking...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length === 1 && (
        <div style={{
          padding: '0 1rem',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {suggestedPrompts.map(prompt => (
            <button
              key={prompt}
              onClick={() => handleSuggestedPrompt(prompt)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: 'var(--ink)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: '0.75rem'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me to design a play..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'var(--panel-2)',
            color: 'var(--ink)',
            fontSize: '1rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="button"
          style={{
            opacity: !input.trim() || isLoading ? 0.5 : 1,
            cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChat;
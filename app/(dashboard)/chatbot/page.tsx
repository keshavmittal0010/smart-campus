'use client';
import { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

const SUGGESTIONS = [
  "What is my attendance in OS?",
  "Show my timetable for today",
  "Predict my final grades",
  "Any pending assignments?"
];


export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'assistant',
    content: "Hi! I'm ARIA, your Smart Campus AI Assistant. How can I help you today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const stored = localStorage.getItem('sc_user');
      const u = stored ? JSON.parse(stored) : {};
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.id || '', message: text, role: u.role || 'student' }),
      });
      const data = await res.json();
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process that.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered a network error. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="page-container" style={{ height: 'calc(100vh - var(--topbar-height) - 2rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: '1rem' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 className="page-title">🤖 ARIA AI Assistant</h1>
        <p className="page-subtitle">Your personal campus intelligence guide</p>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, border: '1px solid var(--primary-500)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)' }}>
        
        {/* Chat Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', maxWidth: '80%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: msg.role === 'user' ? 'var(--surface-3)' : 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                  color: 'white', fontSize: '1rem'
                }}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>

                {/* Message Bubble */}
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '1.2rem',
                  borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '1.2rem',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '1.2rem',
                  background: msg.role === 'user' ? 'var(--primary-600)' : 'var(--surface-2)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {/* Basic markdown parsing for bold text */}
                  {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i} style={{ color: msg.role === 'user' ? 'white' : 'var(--primary-400)' }}>{part.slice(2, -2)}</strong>;
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: '0 2.5rem' }}>
                {msg.timestamp}
              </div>
            </div>
          ))}

          {isTyping && (
             <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
               <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🤖</div>
               <div style={{ background: 'var(--surface-2)', padding: '0.75rem 1rem', borderRadius: '1.2rem', borderBottomLeftRadius: '4px', border: '1px solid var(--border)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                 <div className="typing-dot" style={{ width: 6, height: 6, background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }} />
                 <div className="typing-dot" style={{ width: 6, height: 6, background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }} />
                 <div className="typing-dot" style={{ width: 6, height: 6, background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length < 3 && !isTyping && (
          <div style={{ padding: '0 1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {SUGGESTIONS.map(sug => (
              <button key={sug} onClick={() => handleSend(sug)} style={{
                background: 'var(--surface-2)', border: '1px solid var(--primary-500)', color: 'var(--primary-400)',
                padding: '0.4rem 0.8rem', borderRadius: '100px', fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-500/10)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}>
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask ARIA anything..."
              style={{
                flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)',
                outline: 'none', fontSize: '0.95rem'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: input.trim() && !isTyping ? 'var(--primary-600)' : 'var(--surface-3)',
                color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
                fontSize: '1.2rem'
              }}
            >
              🚀
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            ARIA can make mistakes. Consider verifying important information with the administration.
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}} />
    </div>
  );
}

import { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import useStore from '../store/useStore';

const QUICK_PROMPTS = [
  'Should I buy now or wait for a better entry?',
  'How can I reduce risk in my current portfolio?',
  'Explain diversification in simple terms.',
  'Give me a disciplined swing-trading checklist.'
];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chatbot() {
  const user = useStore(s => s.user);
  const holdings = useStore(s => s.holdings);
  const [messages, setMessages] = useState(() => ([
    {
      id: Date.now(),
      role: 'assistant',
      content: `Hi ${user?.name || 'there'}, I am your SimVesto market assistant. Ask me anything about stocks, risk, timing, or portfolio decisions.`,
      createdAt: Date.now(),
    }
  ]));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const historyForApi = useMemo(() => (
    messages
      .filter(m => m.role === 'assistant' || m.role === 'user')
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-10)
  ), [messages]);

  const sendMessage = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const response = await api.askAdvisor(
        text,
        [...historyForApi, { role: 'user', content: text }],
        {
          holdingsSnapshot: holdings.map(h => ({
            symbol: h.symbol,
            quantity: Number(h.quantity || 0),
            avgBuyPrice: Number(h.avgBuyPrice || 0),
          })),
        }
      );

      const replyText = response?.reply || response?.message || 'I could not generate a response right now.';
      const botMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: replyText,
        createdAt: Date.now(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setError('Unable to reach chatbot service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await sendMessage();
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Market Chatbot</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Ask for market insights, risk-aware advice, and educational stock guidance.
        </p>
      </motion.div>

      <div className="card" style={{ padding: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {QUICK_PROMPTS.map(prompt => (
            <button
              key={prompt}
              className="btn btn-ghost btn-sm"
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              style={{ border: '1px solid var(--border-default)', borderRadius: '999px' }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          ref={listRef}
          style={{
            height: '58vh',
            minHeight: '360px',
            maxHeight: '680px',
            overflowY: 'auto',
            padding: '18px',
            background: 'linear-gradient(180deg, var(--bg-surface), var(--bg-secondary))',
          }}
        >
          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            return (
              <motion.div
                key={m.id + i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '10px' }}
              >
                <div
                  style={{
                    maxWidth: '78%',
                    padding: '10px 12px',
                    borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: isUser ? 'var(--accent-purple)' : 'var(--bg-surface-3)',
                    color: isUser ? 'white' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border-default)',
                    boxShadow: isUser ? 'var(--shadow-glow-purple)' : 'none',
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: '13px' }}>{m.content}</div>
                  <div style={{ fontSize: '10px', opacity: 0.75, marginTop: '6px', textAlign: 'right' }}>
                    {formatTime(m.createdAt)}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '10px 12px',
                borderRadius: '12px 12px 12px 4px',
                background: 'var(--bg-surface-3)',
                border: '1px solid var(--border-default)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                Thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} style={{ borderTop: '1px solid var(--border-default)', padding: '12px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about stocks, risk, strategy, or portfolio..."
              maxLength={500}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>For educational use in simulation.</span>
            <span>{input.length}/500</span>
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '8px' }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}

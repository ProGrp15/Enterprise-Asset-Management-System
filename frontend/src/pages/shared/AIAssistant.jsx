import { useState, useRef, useEffect } from 'react';
import { FaRobot, FaUser, FaPaperPlane, FaMagic, FaChartLine, FaBoxOpen, FaClipboardCheck, FaStopCircle } from 'react-icons/fa';
import './AIAssistant.css';
import { askAssistant } from '../../services/notificationService';

const SUGGESTED_PROMPTS = [
  { icon: FaBoxOpen, text: "Show all Dell laptops in IT department" },
  { icon: FaChartLine, text: "Generate monthly asset utilization report" },
  { icon: FaClipboardCheck, text: "Which assets require maintenance next month?" },
  { icon: FaMagic, text: "How many licenses expire this quarter?" }
];

function renderLine(line) {
  const parts = line.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={index}>{part.slice(2, -2)}</strong>
    : <span key={index}>{part}</span>);
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const messageId = useRef(0);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    const query = text || input;
    if (!query.trim()) return;

    // Add user message
    const userMsg = { id: ++messageId.current, role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await askAssistant(query);
      const aiMsg = { id: ++messageId.current, role: 'ai', text: result?.reply || 'The assistant did not return a response.' };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { id: ++messageId.current, role: 'ai', text: 'The AI service is currently unavailable. Please try again shortly.' }]);
    } finally { setIsTyping(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-assistant-container">
      <div className="ai-header glass-header">
        <div className="d-flex align-items-center gap-3">
          <div className="ai-logo"><FaRobot /></div>
          <div>
            <h1 className="h5 fw-bold mb-0">AssetFlow AI</h1>
            <p className="text-muted small mb-0">Intelligent Enterprise Asset Assistant</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setMessages([])}>Clear Chat</button>
      </div>

      <div className="ai-chat-area">
        {messages.length === 0 ? (
          <div className="ai-welcome">
            <div className="ai-welcome-icon"><FaMagic /></div>
            <h2>How can I help you today?</h2>
            <p className="text-muted">Ask me anything about your assets, maintenance, or reports.</p>
            
            <div className="ai-suggestions mt-4">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button 
                  key={idx} 
                  className="ai-suggestion-card hover-lift"
                  onClick={() => handleSend(prompt.text)}
                >
                  <prompt.icon className="suggestion-icon" />
                  <span>{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-message-list">
            <div className="ai-message ai">
              <div className="message-avatar"><FaRobot /></div>
              <div className="message-content">
                Hello! I'm AssetFlow AI. How can I assist you with your enterprise assets today?
              </div>
            </div>
            
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'ai' ? <FaRobot /> : <FaUser />}
                </div>
                <div className="message-content">
                  {/* Simple markdown parsing for bold and lists */}
                  {msg.text.split('\n').map((line, i) => {
                    if (line.startsWith('* ')) {
                      return <li key={i}>{renderLine(line.substring(2))}</li>;
                    }
                    if (line.trim() === '') return <br key={i} />;
                    return <span key={i}>{renderLine(line)}</span>;
                  })}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="ai-message ai typing-indicator-wrapper">
                <div className="message-avatar"><FaRobot /></div>
                <div className="message-content typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="ai-input-area">
        <div className="ai-input-box">
          <textarea 
            placeholder="Ask AssetFlow AI to generate a report, check inventory, or schedule maintenance..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          {isTyping ? (
            <button className="ai-send-btn stop" onClick={() => {}} title="Stop generating">
              <FaStopCircle />
            </button>
          ) : (
            <button 
              className={`ai-send-btn ${input.trim() ? 'active' : ''}`}
              onClick={() => handleSend()}
              disabled={!input.trim()}
            >
              <FaPaperPlane />
            </button>
          )}
        </div>
        <div className="ai-footer-text">
          AssetFlow AI can make mistakes. Consider verifying important enterprise data.
        </div>
      </div>
    </div>
  );
}

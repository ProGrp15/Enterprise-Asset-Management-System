import { useState, useRef, useEffect } from 'react';
import { FaRobot, FaUser, FaPaperPlane, FaMagic, FaChartLine, FaBoxOpen, FaClipboardCheck, FaStopCircle } from 'react-icons/fa';
import './AIAssistant.css';

const SUGGESTED_PROMPTS = [
  { icon: FaBoxOpen, text: "Show all Dell laptops in IT department" },
  { icon: FaChartLine, text: "Generate monthly asset utilization report" },
  { icon: FaClipboardCheck, text: "Which assets require maintenance next month?" },
  { icon: FaMagic, text: "How many licenses expire this quarter?" }
];

const MOCK_RESPONSES = {
  "show all dell laptops in it department": "I found 42 Dell laptops assigned to the IT department. \n\n* **Active:** 38\n* **In Maintenance:** 4\n* **Average Age:** 1.2 years\n\nWould you like me to export this list as a CSV or create a maintenance ticket for the 4 inactive ones?",
  "generate monthly asset utilization report": "Here is the summary for the **October Asset Utilization Report**:\n\n* **Total Managed Assets:** 1,245 (+$42k in value)\n* **Overall Utilization Rate:** 91% (+2.4% vs last month)\n* **Underutilized Categories:** Printers (34% idle), Projectors (41% idle)\n* **High Maintenance Costs:** Dell XPS 15 fleet has incurred $1,200 in repairs.\n\nI have saved the full 12-page PDF report to your Documents.",
  "which assets require maintenance next month?": "There are **14 assets** scheduled for preventative maintenance next month:\n\n1. **HVAC System A** (Building 1) - Due Nov 12\n2. **Forklift #4** (Warehouse) - Due Nov 15\n3. **12 Apple MacBook Pros** (Design Team) - Battery diagnostics due Nov 20\n\nShould I automatically draft vendor quotation requests for these?",
  "how many licenses expire this quarter?": "You have **3 software licenses** expiring this quarter:\n\n* **Adobe Creative Cloud (50 seats)** - Expires Nov 30\n* **AutoCAD (5 seats)** - Expires Dec 15\n* **AWS Enterprise Support** - Expires Dec 31\n\nTotal estimated renewal cost is **$14,500**. Shall I notify the Finance department?",
  "default": "I'm your AssetFlow AI Assistant. I can analyze asset data, generate reports, schedule maintenance, and answer questions about your organization's inventory. How can I help you today?"
};

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text) => {
    const query = text || input;
    if (!query.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const lowerQuery = query.toLowerCase().trim();
      // Simple mock matching
      const matchedKey = Object.keys(MOCK_RESPONSES).find(k => k !== 'default' && lowerQuery.includes(k.replace('?', '')));
      
      const responseText = matchedKey ? MOCK_RESPONSES[matchedKey] : MOCK_RESPONSES['default'];
      
      const aiMsg = { id: Date.now() + 1, role: 'ai', text: responseText };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000); // 1.5 - 2.5s delay
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
        <button className="btn btn-ghost btn-sm">Clear Chat</button>
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
                      return <li key={i} dangerouslySetInnerHTML={{ __html: line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
                    }
                    if (line.trim() === '') return <br key={i} />;
                    return <span key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
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

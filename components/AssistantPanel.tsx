import React, { useState, useRef, useEffect } from 'react';
import { analyzeGraphWithGemini } from '../services/geminiService';
import { DataAsset, LineageEdge } from '../types';
import { MessageSquare, Send, Bot, Loader2, Sparkles } from 'lucide-react';

interface AssistantPanelProps {
  nodes: DataAsset[];
  edges: LineageEdge[];
  selectedNodeId?: string;
  isOpen: boolean;
  onToggle: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AssistantPanel: React.FC<AssistantPanelProps> = ({ nodes, edges, selectedNodeId, isOpen, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am Lumina AI. I can help you diagnose errors, analyze impact, or explain the data flow. Ask me anything about the current graph.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const response = await analyzeGraphWithGemini(userMsg, { nodes, edges, selectedNodeId });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center text-white z-50 hover:scale-110 transition-transform"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-[400px] h-[500px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-medium">
          <Bot className="text-primary-500" size={18} />
          <span>Lumina Assistant</span>
        </div>
        <button onClick={onToggle} className="text-slate-400 hover:text-white">
          &times;
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-slate-800 text-slate-200 border border-slate-700'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
               <Loader2 size={16} className="animate-spin text-primary-500" />
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-900">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about downstream impact..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-1 text-slate-400 hover:text-primary-500 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantPanel;
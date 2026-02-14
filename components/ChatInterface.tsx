
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Terminal } from 'lucide-react';
import { ChatMessage, RiskTolerance } from '../types';
import { geminiService } from '../services/geminiService';

interface Props {
  riskLevel: RiskTolerance;
}

const ChatInterface: React.FC<Props> = ({ riskLevel }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Authenticated session established. Profile: ${riskLevel}. System is monitoring real-time volatility. How shall we allocate risk today?`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const response = await geminiService.getRiskAdvice(input, riskLevel, messages);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[520px] glass border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
            <Terminal size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Reasoning Enclave</h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">TEE SECURED • 4096-BIT RSA</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 px-2 py-1 rounded-full bg-emerald-500/5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVE
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`mt-1 p-2 rounded-xl h-fit shadow-lg ${
                msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {msg.role === 'user' ? <User size={14} strokeWidth={2.5} /> : <Bot size={14} strokeWidth={2.5} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg border border-white/5 ${
                msg.role === 'user' 
                ? 'bg-cyan-600 font-semibold text-white' 
                : 'bg-white/5 text-slate-200'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex gap-4 max-w-[90%]">
              <div className="mt-1 p-2 rounded-xl h-fit bg-slate-800 text-slate-400">
                <Loader2 size={14} className="animate-spin" strokeWidth={2.5} />
              </div>
              <div className="p-4 rounded-2xl bg-white/5 text-slate-500 text-sm font-medium flex items-center gap-3">
                <span className="animate-pulse">Synthesizing risk response in TEE enclave...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-slate-950/60 border-t border-white/5">
        <div className="relative group">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Executive instruction..."
            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-5 pr-14 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:grayscale text-white rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <Send size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Sparkles size={10} className="text-cyan-400" />
          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">End-to-end encrypted reasoning path</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

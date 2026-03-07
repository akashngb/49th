import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip, 
  Mic, 
  Smile, 
  CheckCheck,
  Search,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  type?: 'text' | 'voice' | 'alert';
}

const initialMessages: Message[] = [
  { id: '1', text: "Welcome to Canada, Mateo! I'm your 49th companion. How was your flight?", sender: 'bot', timestamp: '09:00 AM' },
  { id: '2', text: "It was long but good! Just landed at Pearson.", sender: 'user', timestamp: '09:05 AM' },
  { id: '3', text: "Glad to hear. I've updated your Arrival Engine with your first steps. Have you applied for your SIN yet?", sender: 'bot', timestamp: '09:06 AM' },
  { id: '4', text: "Not yet, I'm heading to my Airbnb now.", sender: 'user', timestamp: '09:10 AM' },
  { id: '5', text: "Take your time. When you're ready, I can find the nearest Service Canada for you. Also, don't forget to grab a local SIM card at the airport if you haven't already!", sender: 'bot', timestamp: '09:12 AM' },
];

export const Messages = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMsg]);
    setInput('');

    // Mock bot response
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I've noted that! I'll remind you about it tomorrow morning. Is there anything else you need help with right now?",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-cream/20 overflow-hidden">
      {/* Editorial Chat Sidebar */}
      <div className="w-80 border-r border-taupe bg-white hidden lg:flex flex-col">
        <div className="p-8 border-b border-taupe">
          <h2 className="text-2xl font-serif font-bold text-forest mb-6 tracking-tighter">Archive.</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-3 bg-cream/50 border border-taupe/50 rounded-xl text-xs focus:outline-none focus:border-forest"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[
            { name: '49th Companion', last: 'How was your flight?', time: '09:00 AM', active: true, ai: true },
            { name: 'Sarah (Mentor)', last: 'See you at the gathering!', time: 'Yesterday', active: false },
            { name: 'Housing Support', last: 'Document verified.', time: '2 days ago', active: false },
          ].map((chat, i) => (
            <div key={i} className={`p-6 border-b border-taupe/30 cursor-pointer transition-all duration-300 ${chat.active ? 'bg-cream/50 border-l-4 border-l-forest' : 'hover:bg-cream/20'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${chat.ai ? 'bg-forest' : 'bg-taupe'}`}>
                    {chat.ai ? <Sparkles size={18} /> : chat.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-charcoal">{chat.name}</h4>
                    <p className="text-[10px] text-charcoal/40 uppercase tracking-widest">{chat.time}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-charcoal/50 truncate pl-13">{chat.last}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-taupe p-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-14 h-14 bg-forest rounded-2xl flex items-center justify-center text-white shadow-lg shadow-forest/20">
                <Sparkles size={28} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-mint border-2 border-white rounded-full" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-charcoal">49th Companion</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse" />
                <p className="text-[10px] text-forest font-bold uppercase tracking-[0.2em]">Active Intelligence</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center text-charcoal/40 hover:bg-cream hover:text-forest rounded-xl transition-all"><Phone size={20} /></button>
            <button className="w-10 h-10 flex items-center justify-center text-charcoal/40 hover:bg-cream hover:text-forest rounded-xl transition-all"><Video size={20} /></button>
            <button className="w-10 h-10 flex items-center justify-center text-charcoal/40 hover:bg-cream hover:text-forest rounded-xl transition-all"><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 scroll-smooth">
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-4">
              <span className="w-8 h-[1px] bg-taupe"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-charcoal/30">Session Started</span>
              <span className="w-8 h-[1px] bg-taupe"></span>
            </div>
          </div>

          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] md:max-w-[60%] group relative ${msg.sender === 'user' ? 'order-1' : 'order-2'}`}>
                <div className={`p-6 md:p-8 rounded-[2rem] shadow-sm relative transition-all duration-500 ${
                  msg.sender === 'user' 
                    ? 'bg-forest text-white rounded-tr-none shadow-xl shadow-forest/10' 
                    : 'bg-white border border-taupe text-charcoal rounded-tl-none'
                }`}>
                  <p className="text-base leading-relaxed font-light">{msg.text}</p>
                  <div className={`flex items-center justify-end gap-2 mt-4 text-[10px] font-bold uppercase tracking-widest ${msg.sender === 'user' ? 'text-white/40' : 'text-charcoal/20'}`}>
                    {msg.timestamp}
                    {msg.sender === 'user' && <CheckCheck size={14} />}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-8 bg-white/80 backdrop-blur-md border-t border-taupe">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 flex items-center justify-center text-charcoal/30 hover:text-forest hover:bg-cream rounded-xl transition-all">
                  <Smile size={22} />
                </button>
                <button className="w-10 h-10 flex items-center justify-center text-charcoal/30 hover:text-forest hover:bg-cream rounded-xl transition-all">
                  <Paperclip size={22} />
                </button>
              </div>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask your companion anything..." 
                  className="w-full pl-8 pr-16 py-5 bg-cream/30 border border-taupe/50 rounded-[2rem] focus:outline-none focus:border-forest text-sm font-light tracking-wide"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-forest text-white rounded-2xl flex items-center justify-center hover:bg-forest/90 transition-all shadow-xl shadow-forest/20 group"
                >
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
              <button className="w-14 h-14 bg-cream text-forest rounded-2xl flex items-center justify-center hover:bg-mint transition-all shadow-sm">
                <Mic size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, MessageCircle, Sparkles, User, Bot, Volume2, Mic, Square } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your 49th companion. How can I help you with your journey to Canada today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('🎤 Recording stopped. Blob size:', audioBlob.size);
        setIsTyping(true);
        try {
          const { transcribeVoice } = await import('../api');
          console.log('📡 Sending audio to transcription...');
          const transcribedText = await transcribeVoice(audioBlob);
          console.log('📝 Transcribed text received:', transcribedText);
          if (transcribedText) {
            handleSend(transcribedText);
          } else {
            console.warn('⚠️ Transcription returned empty text');
          }
        } catch (err) {
          console.error('❌ Transcription failed:', err);
        }
        setIsTyping(false);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setIsTyping(true);

    const currentInput = textToSend;

    try {
      // Try Backboard AI (persistent memory) first
      const { sendAIChat } = await import('../api');
      const responseText = await sendAIChat(currentInput);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      try {
        // Fallback to coordinator API
        const { sendChat } = await import('../api');
        const responseText = await sendChat(currentInput);
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      } catch {
        // Final fallback to mock
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: getMockResponse(currentInput),
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      }
    }
    setIsTyping(false);
  };

  const handleListen = async (text: string) => {
    try {
      const { textToSpeech } = await import('../api');
      const audioBlob = await textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch {
      console.error('TTS not available');
    }
  };

  const getMockResponse = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('sin')) return "To apply for a Social Insurance Number (SIN), you can apply online through the Service Canada website or in person at a Service Canada Centre. You'll need your primary identity document (like a PR card or Work Permit). Would you like me to find the nearest Service Canada office for you?";
    if (q.includes('school')) return "School registration usually happens at your local school board office. You'll need proof of address, your child's birth certificate, and immunization records. Which city are you in? I can find the specific board for you.";
    if (q.includes('nurse') || q.includes('nursing')) return "Nursing is a regulated profession in Canada. You'll need to start with the National Nursing Assessment Service (NNAS) to verify your credentials. It can take some time, but there are bridging programs to help you get licensed faster.";
    if (q.includes('first week')) return "In your first week, your top priorities should be: 1. Applying for your SIN, 2. Opening a bank account, 3. Getting a local SIM card, and 4. Registering for provincial healthcare. I've added these to your Arrival Engine roadmap!";
    return "That's a great question. Navigating that can be tricky, but I'm here to help. Could you tell me a bit more about your specific situation so I can give you the best guidance?";
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-forest text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <MessageCircle size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-taupe"
          >
            {/* Header */}
            <div className="bg-forest p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-mint/20 rounded-full flex items-center justify-center">
                  <Sparkles size={18} className="text-mint" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm">49th Assistant</h3>
                  <p className="text-[10px] opacity-80">Always here to help</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:opacity-70">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream/30">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 max-w-[85%]",
                    msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.sender === 'user' ? "bg-terracotta/10" : "bg-forest/10"
                  )}>
                    {msg.sender === 'user' ? <User size={16} className="text-terracotta" /> : <Bot size={16} className="text-forest" />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed",
                    msg.sender === 'user'
                      ? "bg-terracotta text-white rounded-tr-none"
                      : "bg-white border border-taupe text-charcoal rounded-tl-none shadow-sm"
                  )}>
                    {msg.text}
                    {msg.sender === 'bot' && (
                      <button
                        onClick={() => handleListen(msg.text)}
                        className="mt-2 flex items-center gap-1 text-[10px] text-forest/50 hover:text-forest transition-colors"
                        title="Listen"
                      >
                        <Volume2 size={12} /> Listen
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2 mr-auto">
                  <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center">
                    <Bot size={16} className="text-forest" />
                  </div>
                  <div className="bg-white border border-taupe p-3 rounded-2xl rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-taupe rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-taupe rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-taupe rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-taupe bg-white">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isRecording ? "Listening..." : "Ask me anything..."}
                  className={cn(
                    "w-full pl-4 pr-24 py-3 bg-cream/50 border border-taupe rounded-xl focus:outline-none focus:border-forest text-sm transition-all",
                    isRecording && "ring-2 ring-forest/20 bg-forest/5"
                  )}
                  disabled={isRecording}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                      isRecording
                        ? "bg-terracotta text-white animate-pulse"
                        : "bg-forest/10 text-forest hover:bg-forest/20"
                    )}
                    title={isRecording ? "Stop Recording" : "Voice Message"}
                  >
                    {isRecording ? <Square size={14} /> : <Mic size={16} />}
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={isRecording}
                    className="w-8 h-8 bg-forest text-white rounded-lg flex items-center justify-center hover:bg-forest/90 transition-colors disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

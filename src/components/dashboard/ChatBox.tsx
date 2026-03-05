import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import moonyImg from '@/assets/moony.png';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'moony';
  timestamp: Date;
}

interface ChatBoxProps {
  onSendExpense: (text: string) => string; // returns moony response
  onQuickAdd: () => void;
}

const ChatBox = ({ onSendExpense, onQuickAdd }: ChatBoxProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: "Hey! 🦆 Type what you spent and I'll log it! Like: \"Biryani 250\" or \"Uber 180\"",
      sender: 'moony',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    const response = onSendExpense(input);

    setTimeout(() => {
      const moonyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'moony',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, moonyMsg]);
    }, 400);

    setInput('');
  };

  return (
    <div className="retro-window h-full flex flex-col">
      <div className="retro-window-header">
        <div className="retro-dot bg-destructive" />
        <div className="retro-dot bg-warning" />
        <div className="retro-dot bg-success" />
        <span className="ml-2 text-sm font-semibold text-foreground font-display">💬 Chat with Mooney</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.sender === 'moony' && (
                <img src={moonyImg} alt="Mooney" className="w-8 h-8 rounded-full border border-secondary object-cover shrink-0 mt-1" />
              )}
              <div
                className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm ${
                  msg.sender === 'user'
                    ? 'gradient-primary text-primary-foreground rounded-br-sm'
                    : 'bg-secondary/40 text-foreground rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-3 border-t border-border bg-card">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onQuickAdd} title="Quick Add">
            <Plus className="w-4 h-4" />
          </Button>
          <Input
            placeholder="Spent 250 on biryani..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="bg-background border-border"
          />
          <Button onClick={handleSend} size="icon" className="gradient-primary text-primary-foreground border-0 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;

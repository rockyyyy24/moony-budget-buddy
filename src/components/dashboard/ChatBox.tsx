import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category } from '@/types/budget';
import { getSpendingSuggestions } from '@/utils/expenseParser';
import moonyImg from '@/assets/moony.png';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'moony';
  timestamp: Date;
}

interface ChatBoxProps {
  onSendExpense: (text: string) => string;
  onQuickAdd: () => void;
  currencySymbol: string;
  todaySpent: number;
  dailyLimit: number;
  totalSpent: number;
  monthlyBudget: number;
  categories: Category[];
  getCategorySpent: (id: string) => number;
}

const GREETINGS = ['hi', 'hello', 'hey', 'sup', 'yo', 'hola', 'howdy', 'what\'s up', 'whats up', 'wassup'];
const GREETING_RESPONSES = [
  "Heyyy! 🦆✨ What's up bestie? Spent anything today?",
  "Yo yo yo! 🎉 Mooney's here! Tell me about your spending or just chat!",
  "Hey friend! 🌟 How's your wallet doing today?",
  "Hiii! 🦆💕 Ready to track some expenses or just wanna hang?",
];

const HOW_ARE_YOU = ['how are you', 'how r u', 'how are u', 'how\'s it going', 'hows it going'];
const HOW_RESPONSES = [
  "I'm doing quack-tastic! 🦆 More importantly, how's YOUR spending today?",
  "Living my best duck life! 🌈 How about you? Need any budget help?",
  "I'm great! Been keeping an eye on your wallet 👀💰 Everything good?",
];

const THANKS = ['thanks', 'thank you', 'thx', 'ty', 'appreciate'];
const THANKS_RESPONSES = [
  "Aww you're welcome bestie! 🦆💕 That's what I'm here for!",
  "No prob! 🌟 Mooney's always got your back!",
  "Anytime friend! 🎉 Keep tracking and you'll be a budget boss!",
];

const HELP_KEYWORDS = ['help', 'how to', 'what can you do', 'guide', 'tutorial'];
const HELP_RESPONSE = `Here's what I can do! 🦆✨

💬 Log expenses — Type like "Pizza 250"
➕ Quick add — Tap the + button
📊 Tips — Ask "give me tips"
💰 Budget check — Ask "how am I doing?"
🗓️ Calendar — Check daily spending
🏆 Stickers — Earn & place stickers!

Just chat naturally! 🎉`;

const TIP_KEYWORDS = ['tip', 'tips', 'advice', 'suggest', 'suggestion', 'save', 'saving', 'how to save'];
const STATUS_KEYWORDS = ['how am i doing', 'status', 'budget status', 'how much', 'remaining', 'left', 'spent today', 'my budget', 'overview'];
const JOKE_KEYWORDS = ['joke', 'funny', 'make me laugh'];
const JOKES = [
  "Why did the penny go to therapy? Too many cents of anxiety! 🪙😂",
  "What did one wallet say to the other? 'Looking thin lately!' 👛😄",
  "What's a duck's favorite financial tool? The bill! 🦆💰",
];

const MOOD_SAD = ['sad', 'stressed', 'broke', 'poor', 'no money', 'overspent', 'worried'];
const MOOD_RESPONSES = [
  "Hey, don't worry! 🦆💕 Everyone has tough months. Let's cut back together!",
  "It's okay bestie! 🌈 Budget bumps happen. Tomorrow's a new day!",
  "Sending duck hugs! 🦆🤗 Want me to give you some saving tips?",
];

const BYE_KEYWORDS = ['bye', 'goodbye', 'see you', 'later', 'gotta go', 'cya'];
const BYE_RESPONSES = [
  "Bye bestie! 🦆👋 Keep tracking those expenses!",
  "See ya! 🌟 Don't forget to log your spending!",
  "Later friend! 💕 Your wallet says thanks!",
];

const randomPick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const ChatBox = ({ onSendExpense, onQuickAdd, currencySymbol, todaySpent, dailyLimit, totalSpent, monthlyBudget, categories, getCategorySpent }: ChatBoxProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: "Hey bestie! 🦆✨ I'm Mooney, your money manager! Type what you spent (like \"Pizza 250\") or just chat with me! Type \"help\" to see everything I can do!",
      sender: 'moony',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const getConversationalResponse = (text: string): string | null => {
    const lower = text.toLowerCase().trim();

    if (GREETINGS.some(g => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + '!'))) return randomPick(GREETING_RESPONSES);
    if (HOW_ARE_YOU.some(h => lower.includes(h))) return randomPick(HOW_RESPONSES);
    if (THANKS.some(t => lower.includes(t))) return randomPick(THANKS_RESPONSES);
    if (HELP_KEYWORDS.some(h => lower.includes(h))) return HELP_RESPONSE;
    if (BYE_KEYWORDS.some(b => lower === b || lower.startsWith(b + ' '))) return randomPick(BYE_RESPONSES);
    if (JOKE_KEYWORDS.some(j => lower.includes(j))) return randomPick(JOKES);
    if (MOOD_SAD.some(m => lower.includes(m))) return randomPick(MOOD_RESPONSES);

    if (TIP_KEYWORDS.some(t => lower.includes(t))) {
      const topCat = categories.reduce((best, cat) => {
        const spent = getCategorySpent(cat.id);
        return spent > (best.spent || 0) ? { cat, spent } : best;
      }, { cat: categories[0], spent: 0 } as { cat: Category; spent: number });

      if (topCat.cat && topCat.spent > 0) {
        const tips = getSpendingSuggestions(topCat.cat.name);
        return `Tips for ${topCat.cat.icon} ${topCat.cat.name} (${currencySymbol}${topCat.spent.toLocaleString()}):\n\n${tips.map(t => `• ${t}`).join('\n')}\n\nYou've got this! 💪🦆`;
      }
      return "Log some expenses first and I'll give you personalized tips! 🦆📊";
    }

    if (STATUS_KEYWORDS.some(s => lower.includes(s))) {
      const remaining = monthlyBudget - totalSpent;
      const dailyRemaining = dailyLimit - todaySpent;
      return `📊 Budget Status:\n\n${remaining > 0 ? '✅' : '🚨'} Monthly: ${currencySymbol}${totalSpent.toLocaleString()} / ${currencySymbol}${monthlyBudget.toLocaleString()} (${remaining > 0 ? currencySymbol + remaining.toLocaleString() + ' left' : 'Over by ' + currencySymbol + Math.abs(remaining).toLocaleString()})\n\n${dailyRemaining > 0 ? '✅' : '🚨'} Today: ${currencySymbol}${todaySpent.toLocaleString()} / ${currencySymbol}${Math.round(dailyLimit).toLocaleString()}\n\n${remaining > 0 ? "Great job bestie! 🌟" : "Let's cut back a bit! 💪🦆"}`;
    }

    return null;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    const convoResponse = getConversationalResponse(input);
    const response = convoResponse || onSendExpense(input);

    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: response, sender: 'moony', timestamp: new Date() }]);

      // Occasionally suggest a tip after expense logging
      if (!convoResponse && Math.random() > 0.6) {
        setTimeout(() => {
          const topCat = categories.reduce((best, cat) => {
            const spent = getCategorySpent(cat.id);
            return spent > (best.spent || 0) ? { cat, spent } : best;
          }, { cat: categories[0], spent: 0 } as { cat: Category; spent: number });

          if (topCat.cat && topCat.spent > 0) {
            const tips = getSpendingSuggestions(topCat.cat.name);
            const tip = tips[Math.floor(Math.random() * tips.length)];
            setMessages(prev => [...prev, { id: (Date.now() + 2).toString(), text: `💡 Quick tip: ${tip}`, sender: 'moony', timestamp: new Date() }]);
          }
        }, 1200);
      }
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
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.sender === 'moony' && (
                <img src={moonyImg} alt="Mooney" className="w-8 h-8 rounded-full border border-secondary object-cover shrink-0 mt-1" />
              )}
              <div className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm whitespace-pre-line ${
                msg.sender === 'user' ? 'gradient-primary text-primary-foreground rounded-br-sm' : 'bg-secondary/40 text-foreground rounded-bl-sm'
              }`}>
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
          <Input placeholder="Chat or log expense..." value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()} className="bg-background border-border" />
          <Button onClick={handleSend} size="icon" className="gradient-primary text-primary-foreground border-0 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;

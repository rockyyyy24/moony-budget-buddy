import { Category } from '@/types/budget';

interface ParsedExpense {
  amount: number;
  categoryId: string;
  note: string;
  confidence: number;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['food', 'biryani', 'pizza', 'burger', 'lunch', 'dinner', 'breakfast', 'snack', 'restaurant', 'cafe', 'coffee', 'tea', 'meal', 'eat', 'order', 'zomato', 'swiggy', 'doordash', 'ubereats', 'noodles', 'rice', 'chicken', 'sandwich'],
  travel: ['uber', 'ola', 'cab', 'taxi', 'bus', 'train', 'metro', 'flight', 'petrol', 'fuel', 'gas', 'lyft', 'travel', 'trip', 'auto', 'rickshaw', 'fare'],
  rent: ['rent', 'landlord', 'lease', 'housing', 'apartment'],
  shopping: ['shopping', 'clothes', 'shoes', 'amazon', 'flipkart', 'online', 'buy', 'bought', 'purchase', 'dress', 'shirt', 'mall'],
  bills: ['bill', 'electricity', 'water', 'internet', 'wifi', 'phone', 'recharge', 'utility', 'gas bill'],
  entertainment: ['movie', 'netflix', 'spotify', 'game', 'concert', 'show', 'ticket', 'cinema', 'theater', 'party', 'club', 'bar', 'drinks', 'beer', 'wine'],
  savings: ['savings', 'save', 'invest', 'deposit', 'fd', 'mutual fund', 'sip'],
  subscriptions: ['subscription', 'subscribe', 'premium', 'membership', 'plan', 'monthly'],
  health: ['medicine', 'doctor', 'hospital', 'pharmacy', 'health', 'gym', 'fitness', 'medical', 'dental', 'clinic'],
  groceries: ['grocery', 'groceries', 'vegetables', 'fruits', 'milk', 'eggs', 'bread', 'supermarket', 'store', 'mart'],
};

export const parseExpenseText = (text: string, categories: Category[]): ParsedExpense | null => {
  const lower = text.toLowerCase().trim();

  // Extract amount - look for numbers
  const amountMatch = lower.match(/(?:₹|rs\.?|inr|usd|\$)?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (amount <= 0 || isNaN(amount)) return null;

  // Remove amount from text to get the note
  const noteText = lower.replace(amountMatch[0], '').trim();

  // Find category
  let bestMatch = '';
  let bestScore = 0;

  const availableCatIds = new Set(categories.map(c => c.id));

  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!availableCatIds.has(catId)) continue;
    for (const kw of keywords) {
      if (lower.includes(kw) && kw.length > bestScore) {
        bestMatch = catId;
        bestScore = kw.length;
      }
    }
  }

  // Also check custom category names
  for (const cat of categories) {
    if (lower.includes(cat.name.toLowerCase())) {
      if (cat.name.length > bestScore) {
        bestMatch = cat.id;
        bestScore = cat.name.length;
      }
    }
  }

  // Default to food if no match
  const categoryId = bestMatch || (availableCatIds.has('food') ? 'food' : categories[0]?.id || 'other');
  const confidence = bestMatch ? 0.8 : 0.3;

  // Clean up note
  const cleanNote = noteText
    .replace(/(?:spent|paid|bought|got|for|on)\s*/gi, '')
    .replace(/^\s*[-,]\s*/, '')
    .trim();

  const finalNote = cleanNote || text.replace(/\d+/g, '').trim();

  return { amount, categoryId, note: finalNote, confidence };
};

export const getMoonyResponse = (amount: number, categoryName: string, note: string): string => {
  const responses = [
    `Got it! 🦆 Logged ₹${amount} for ${categoryName}${note ? ` (${note})` : ''}. Keep tracking! ✨`,
    `Quack! 🦆 ₹${amount} on ${categoryName}${note ? ` — ${note}` : ''}. I'm watching your wallet! 👀`,
    `Noted! ₹${amount} → ${categoryName} 📝${note ? ` "${note}"` : ''} You're doing great! 🌟`,
    `₹${amount} for ${categoryName}${note ? ` (${note})` : ''} — saved! 🦆💰 Stay awesome!`,
    `Quack quack! ₹${amount} on ${categoryName}${note ? ` — ${note}` : ''}. I've got your back! 🎉`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

export const getFisheWarning = (type: 'monthly' | 'category' | 'daily', name?: string): string => {
  const warnings: Record<string, string[]> = {
    monthly: [
      "Oiii! You're crossing the monthly budget! 🚨🐟 Time to slow down!",
      "ALERT! 🐟 Monthly budget breached! Let's reel it in!",
      "🚨 Fishe says: Monthly budget exceeded! Swim back to safe waters!",
    ],
    category: [
      `Oiii! ${name || 'This category'} is over budget! 🚨🐟 Watch out!`,
      `🐟 ALERT: ${name || 'Category'} limit crossed! Time to cut back!`,
      `Fishe is NOT happy! 🐟🚨 ${name || 'Category'} budget busted!`,
    ],
    daily: [
      "Oiii! You've spent too much today! 🚨🐟 Take a break!",
      "🐟 Daily limit crossed! Fishe is watching! 🚨",
      "Too much spending today! 🚨🐟 Save some for tomorrow!",
    ],
  };
  const msgs = warnings[type];
  return msgs[Math.floor(Math.random() * msgs.length)];
};

export const getSpendingSuggestions = (categoryName: string): string[] => {
  const suggestions: Record<string, string[]> = {
    food: [
      "🍳 Try meal prepping on weekends to save on weekday meals",
      "🏠 Cook at home more — it's healthier AND cheaper!",
      "📱 Limit food delivery apps to 2x per week",
    ],
    travel: [
      "🚌 Use public transport when possible",
      "🚗 Carpool with colleagues or friends",
      "📍 Plan your trips to combine errands",
    ],
    shopping: [
      "⏰ Apply the 24-hour rule before buying non-essentials",
      "📝 Maintain a wishlist and wait for sales",
      "🔄 Try swapping or thrifting instead of buying new",
    ],
    entertainment: [
      "🎬 Look for free events and activities in your area",
      "🏠 Host movie nights at home instead of going out",
      "📅 Set a monthly entertainment budget and stick to it",
    ],
    subscriptions: [
      "📱 Audit all subscriptions — cancel what you don't use",
      "👥 Share family plans with friends to split costs",
      "🔄 Switch to annual plans for discounts",
    ],
    default: [
      "📊 Track every expense to stay aware of spending",
      "🎯 Set specific savings goals to stay motivated",
      "💡 Find one thing to cut each week",
    ],
  };
  return suggestions[categoryName.toLowerCase()] || suggestions.default;
};

import { create } from 'zustand';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: any;
  nextSteps?: string[];
  ragContext?: string;
  dprAction?: string;
  dprQuestions?: any;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentSuggestions: any;
  currentNextSteps: string[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setSuggestions: (suggestions: any) => void;
  setNextSteps: (nextSteps: string[]) => void;
  clearSuggestions: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  currentSuggestions: null,
  currentNextSteps: [],
  addMessage: (message) =>
    set((state) => ({ 
      messages: [...state.messages, message],
      currentSuggestions: message.suggestions || state.currentSuggestions,
      currentNextSteps: message.nextSteps || state.currentNextSteps,
    })),
  clearMessages: () => set({ 
    messages: [],
    currentSuggestions: null,
    currentNextSteps: [],
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSuggestions: (suggestions) => set({ currentSuggestions: suggestions }),
  setNextSteps: (nextSteps) => set({ currentNextSteps: nextSteps }),
  clearSuggestions: () => set({ 
    currentSuggestions: null,
    currentNextSteps: [],
  }),
}));


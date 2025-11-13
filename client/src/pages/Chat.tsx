// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Navbar } from '@/components/layout/Navbar';
import { Send, Mic, MicOff, Trash2, Database, Bot, Languages, Loader2, Copy, Check, Sparkles, Volume2, VolumeX, WifiOff, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ttsService, TTSLanguage } from '@/lib/tts';
import { OfflineDetector } from '@/lib/offlineDetector';

export const Chat: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    messages,
    addMessage,
    clearMessages,
    isLoading,
    setLoading,
  } = useChatStore();
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [useRAG, setUseRAG] = useState(true);
  const [vectorStores, setVectorStores] = useState<any[]>([]);
  const [selectedVectorStores, setSelectedVectorStores] = useState<string[]>([]);
  const [voiceLanguage, setVoiceLanguage] = useState<'en' | 'te'>('en');
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(!OfflineDetector.getStatus());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollToBottom();
    loadVectorStores();
    
    // Monitor offline status
    const unsubscribe = OfflineDetector.addListener((online) => {
      setIsOffline(!online);
    });
    setIsOffline(!OfflineDetector.getStatus());
    
    return unsubscribe;
  }, [messages]);

  // Load voices when component mounts
  useEffect(() => {
    if (ttsService.isTTSSupported()) {
      // Chrome needs voices to be loaded
      const loadVoices = () => {
        if (window.speechSynthesis.getVoices().length > 0) {
          // Voices loaded
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [inputMessage]);

  const loadVectorStores = async () => {
    try {
      const response = await api.getVectorStores();
      setVectorStores(response.data);
      const mainVectorStoreId = import.meta.env.VITE_MAIN_VECTOR_STORE_ID;
      const mainStore = response.data.find((store: any) =>
        store.openaiVectorStoreId === mainVectorStoreId
      );
      if (mainStore) {
        setSelectedVectorStores([mainStore.openaiVectorStoreId]);
        setUseRAG(true);
      } else {
        const defaultStores = response.data.filter((store: any) => store.metadata?.isDefault);
        setSelectedVectorStores(defaultStores.map((store: any) => store.openaiVectorStoreId));
      }
    } catch (error: any) {
      console.error('Failed to load vector stores:', error);
      setVectorStores([]);
      setUseRAG(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (message: string = inputMessage) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputMessage('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await api.chat(
        message,
        conversationHistory,
        undefined,
        useRAG,
        selectedVectorStores
      );

      if (response.data && response.data.response) {
        addMessage({
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          suggestions: response.data.suggestions,
          nextSteps: response.data.nextSteps,
          ragContext: response.data.ragContext,
          dprAction: response.data.dprAction,
          dprQuestions: response.data.dprQuestions,
        });
      } else {
        throw new Error('No response data received from server');
      }

      if (response.data.generatePDF && response.data.pdfUrl) {
        try {
            const base64Data = response.data.pdfUrl.split(',')[1];
          if (base64Data) {
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const { downloadBlob } = await import('@/lib/utils');
            const filename = `DPR_Conversation_${new Date().toISOString().split('T')[0]}.pdf`;
            downloadBlob(blob, filename);
            toast.success(t('chat.pdfDownloadedSuccess'));
          }
          } catch (error: any) {
            console.error('Error downloading PDF:', error);
            toast.error(t('chat.failedToDownloadPDF', { error: error.message }));
          }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Check if it's a network error and try mock data fallback
      const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || 
                          error.message?.includes('Network Error') ||
                          error.message?.includes('ERR_CONNECTION_REFUSED') ||
                          error.message?.includes('Failed to fetch'));
      
      if (isNetworkError) {
        console.log('🌐 Network error detected, trying mock data fallback...');
        try {
          // Import and use mock data directly
          const { MockDataService } = await import('@/lib/mockData');
          const conversationHistory = messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));
          
          const mockResponse = await MockDataService.chat(message, conversationHistory);
          
          if (mockResponse.data && mockResponse.data.response) {
            addMessage({
              role: 'assistant',
              content: mockResponse.data.response,
              timestamp: new Date(),
              suggestions: mockResponse.data.suggestions,
              nextSteps: mockResponse.data.nextSteps,
              ragContext: mockResponse.data.ragContext,
              dprAction: mockResponse.data.dprAction,
              dprQuestions: mockResponse.data.dprQuestions,
            });
            toast.success('Using offline mode - Mock data', { duration: 2000 });
            return; // Successfully used mock data, exit early
          }
        } catch (mockError) {
          console.error('Mock data fallback also failed:', mockError);
        }
      }
      
      // If we reach here, either it's not a network error or mock data failed
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          t('chat.failedToGetResponse');
      toast.error(errorMessage);
      addMessage({
        role: 'assistant',
        content: t('chat.errorProcessingRequest'),
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
        
        try {
          setLoading(true);
          const response = await api.transcribeAudio(audioFile, voiceLanguage);
          const transcription = response.data.transcription;
          setInputMessage(transcription);
          toast.success(t('chat.audioTranscribedSuccess', { language: voiceLanguage === 'te' ? t('dpr.telugu') : t('dpr.english') }));
        } catch (error) {
          toast.error(t('chat.failedToTranscribe'));
        } finally {
          setLoading(false);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success(t('chat.listening'));
    } catch (error) {
      toast.error(t('chat.failedToAccessMicrophone'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = async (text: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      toast.success(t('chat.copiedToClipboard'));
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast.error(t('chat.failedToCopy'));
    }
  };

  const speakMessage = (text: string, messageId: number) => {
    if (!ttsService.isTTSSupported()) {
      toast.error(t('chat.textToSpeechNotSupported'));
      return;
    }

    // Stop any current speech
    if (speakingMessageId !== null) {
      ttsService.stop();
    }

    // Clean text for speech (remove markdown)
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^\*]+)\*\*/g, '$1')
      .replace(/\*([^\*]+)\*/g, '$1')
      .trim();

    if (!cleanText) {
      toast.error(t('chat.noTextToSpeak'));
      return;
    }

    setSpeakingMessageId(messageId);
    
    // speak is now async, handle it properly
    ttsService.speak(cleanText, {
      language: voiceLanguage as TTSLanguage,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      onEnd: () => {
        setSpeakingMessageId(null);
      },
      onError: (error) => {
        // Only show error toast for actual TTS failures, not interruptions
        const errorMessage = error.message || '';
        if (!errorMessage.includes('interrupted') && !errorMessage.includes('canceled')) {
          console.error('TTS Error:', error);
          toast.error(t('chat.failedToSpeak'));
        } else {
          // Interrupted/canceled is normal, just log for debugging
          console.log('TTS stopped:', errorMessage);
        }
        setSpeakingMessageId(null);
      },
    }).catch((error) => {
      console.error('TTS Error:', error);
      setSpeakingMessageId(null);
      toast.error(t('chat.failedToSpeak'));
    });
  };

  const stopSpeaking = () => {
    ttsService.stop();
    setSpeakingMessageId(null);
  };

  const exampleQuestions = [
    t('chat.howDoICreateDPR'),
    t('chat.whatMSMESchemes'),
    t('chat.helpWithFinancial'),
  ];

  // Offline mode example questions - loaded from Q&A database
  const [offlineExampleQuestions, setOfflineExampleQuestions] = React.useState<string[]>([
    'How do I create a DPR?',
    'What is PMEGP scheme?',
    'How do I calculate financial projections?',
    'What licenses do I need?',
    'What is break-even analysis?',
    'Which government scheme is best for my project?',
    'How do I write a market analysis?',
    'What is technical feasibility?',
  ]);

  // Load example questions from Q&A database when offline
  React.useEffect(() => {
    if (isOffline) {
      const loadExampleQuestions = async () => {
        try {
          const { getExampleQuestions } = await import('@/lib/offlineQAService');
          const examples = getExampleQuestions(8);
          setOfflineExampleQuestions(examples);
        } catch (error) {
          console.warn('Failed to load example questions from Q&A database:', error);
        }
      };
      loadExampleQuestions();
    }
  }, [isOffline]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />
      {/* Header */}
      <div className="border-b border-border bg-white flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{t('chat.title')}</h1>
                <p className="text-xs text-muted-foreground">{t('chat.getInstantHelp')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOffline && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
                  <WifiOff className="h-4 w-4 text-warning" />
                  <span className="text-xs font-medium text-warning">
                    Offline Mode
                  </span>
                </div>
              )}
              {useRAG && vectorStores.length > 0 && !isOffline && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {selectedVectorStores.length} KB{selectedVectorStores.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
                <Button
                variant="ghost"
                  size="sm"
                  onClick={() => setUseRAG(!useRAG)}
                className="text-xs h-8"
                >
                {useRAG ? t('chat.enhanced') : t('chat.standard')}
                </Button>
                <Button
                variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                  disabled={messages.length === 0}
                className="text-xs h-8"
                >
                <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
                </div>
              </div>

      {/* Knowledge Base Selection - Compact */}
            {useRAG && vectorStores.length > 0 && (
        <div className="border-b border-border bg-muted/30 flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">{t('chat.knowledgeBase')}</span>
                  {vectorStores.map((store) => (
                <label 
                  key={store._id} 
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                    selectedVectorStores.includes(store.openaiVectorStoreId)
                      ? 'bg-primary text-white'
                      : 'bg-background border border-border hover:bg-muted'
                  }`}
                >
                      <input
                        type="checkbox"
                        checked={selectedVectorStores.includes(store.openaiVectorStoreId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVectorStores(prev => [...prev, store.openaiVectorStoreId]);
                          } else {
                            setSelectedVectorStores(prev =>
                              prev.filter(id => id !== store.openaiVectorStoreId)
                            );
                          }
                        }}
                    className="sr-only"
                  />
                  <span>{store.name}</span>
                  <span className="opacity-70">({store.fileCount})</span>
                    </label>
                  ))}
                </div>
          </div>
              </div>
            )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-background scrollbar-hide">
        <div className="max-w-4xl mx-auto px-4 py-8">
            {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-8">
              <div className="text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-semibold text-foreground">
                  {t('chat.howCanIHelp')}
                </h2>
                <p className="text-muted-foreground max-w-md text-base">
                  {t('chat.askMeAnything')}
                  </p>
                </div>

              {/* Offline Mode Indicator */}
              {isOffline && (
                <div className="w-full max-w-2xl bg-warning/10 border border-warning/20 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <WifiOff className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Offline Mode Active</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        You're currently offline. I can still help you with a wide range of questions using our comprehensive offline Q&A database containing pre-loaded knowledge about DPR creation, MSME schemes, financial planning, and business guidance.
                      </p>
                      <div className="bg-background/50 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold text-foreground">I can answer questions about:</span>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                          <li>DPR creation and structure</li>
                          <li>Government schemes (PMEGP, MUDRA, CGTMSE, Stand-Up India)</li>
                          <li>Financial calculations (ROI, break-even, projections)</li>
                          <li>Market analysis and technical feasibility</li>
                          <li>Registration and licensing requirements</li>
                          <li>Risk analysis and business planning</li>
                          <li>Loan calculations and eligibility</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                          💡 All answers are retrieved from our local Q&A database, ensuring fast responses even without internet.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl">
                    {exampleQuestions.map((question, index) => (
                  <button
                        key={index}
                        onClick={() => handleSend(question)}
                    className="p-4 text-left rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors group"
                      >
                    <p className="text-sm font-medium text-foreground group-hover:text-primary">
                        {question}
                    </p>
                  </button>
                    ))}
                </div>

              {/* Offline Mode Example Questions */}
              {isOffline && (
                <div className="w-full max-w-2xl mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3 text-center">
                    More Questions I Can Answer Offline:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {offlineExampleQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSend(question)}
                        className="p-3 text-left rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-colors group bg-background/50"
                      >
                        <p className="text-xs font-medium text-foreground group-hover:text-primary">
                          {question}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              </div>
            )}

          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 group ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                
                <div className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%] ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}>
                  <div
                    className={`rounded-2xl px-4 py-3 group ${
                    message.role === 'user'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-muted border border-border'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="text-sm leading-relaxed text-foreground mb-2 last:mb-0">{children}</p>,
                            h1: ({ children }) => <h1 className="text-lg font-semibold text-foreground mt-4 mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mt-3 mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h3>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                            li: ({ children }) => <li className="text-sm text-foreground">{children}</li>,
                            code: ({ children, className }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-muted-foreground/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                              ) : (
                                <code className="block bg-muted-foreground/10 p-3 rounded-lg text-xs font-mono overflow-x-auto">{children}</code>
                              );
                            },
                            pre: ({ children }) => <pre className="bg-muted-foreground/10 p-3 rounded-lg overflow-x-auto my-2">{children}</pre>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  
                  <div className={`flex items-center gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => {
                          if (speakingMessageId === index) {
                            stopSpeaking();
                          } else {
                            speakMessage(message.content, index);
                          }
                        }}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title={speakingMessageId === index ? t('chat.stopSpeaking') : (voiceLanguage === 'te' ? t('chat.speakInTelugu') : t('chat.speakInEnglish'))}
                      >
                        {speakingMessageId === index ? (
                          <VolumeX className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(message.content, index)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title={t('chat.copyMessage')}
                    >
                      {copiedMessageId === index ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                    {message.role === 'assistant' && useRAG && selectedVectorStores.length > 0 && message.ragContext === 'RAG used' && (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-md font-medium">
                        {t('chat.enhanced')}
                          </span>
                    )}
                  </div>
                  
                  {/* Suggestions and Next Steps */}
                  {message.role === 'assistant' && (message.suggestions || message.nextSteps) && (
                    <div className="mt-2 space-y-2">
                      {message.suggestions && (
                        <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold text-foreground">{t('chat.suggestions')}</span>
                          </div>
                          {message.suggestions.financialSuggestions && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {typeof message.suggestions.financialSuggestions === 'string' 
                                ? message.suggestions.financialSuggestions
                                : JSON.stringify(message.suggestions.financialSuggestions, null, 2)}
                            </p>
                          )}
                        </div>
                      )}
                      {message.nextSteps && message.nextSteps.length > 0 && (
                        <div className="bg-success/5 border border-success/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="h-4 w-4 text-success" />
                            <span className="text-xs font-semibold text-foreground">{t('chat.nextSteps')}</span>
                          </div>
                          <ul className="space-y-1 pl-4">
                            {message.nextSteps.map((step, stepIndex) => (
                              <li key={stepIndex} className="text-xs text-muted-foreground leading-relaxed list-disc">
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-xs font-semibold text-white">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-muted border border-border rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">{t('chat.aiIsThinking')}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area - Sticky Bottom */}
      <div className="border-t border-border bg-white flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t('chat.messagePlaceholder')}
                disabled={isLoading || isRecording}
                rows={1}
                className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 max-h-[200px] overflow-y-auto shadow-sm"
              />
              {isRecording && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                  <span className="text-xs text-destructive font-medium">{t('chat.recording')}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-border bg-background">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <select
                  value={voiceLanguage}
                  onChange={(e) => setVoiceLanguage(e.target.value as 'en' | 'te')}
                  className="text-xs font-medium bg-transparent border-none outline-none cursor-pointer text-muted-foreground"
                  disabled={isRecording}
                >
                  <option value="en">EN</option>
                  <option value="te">TE</option>
                </select>
              </div>
              
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? 'destructive' : 'outline'}
                size="sm"
                disabled={isLoading}
                className="h-10 w-10 p-0 rounded-full"
                title={voiceLanguage === 'te' ? t('chat.recordInTelugu') : t('chat.recordInEnglish')}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || isLoading || isRecording}
                size="sm"
                className="h-10 w-10 p-0 rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t('chat.pressEnterToSend')}
          </p>
        </div>
      </div>
      </div>
  );
};

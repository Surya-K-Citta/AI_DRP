import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, Mic, MicOff, Trash2, Lightbulb, CheckCircle, TrendingUp, DollarSign, Database, Zap, Plus } from 'lucide-react';

export const Chat: React.FC = () => {
  const { t } = useTranslation();
  const {
    messages,
    addMessage,
    clearMessages,
    isLoading,
    setLoading,
    currentSuggestions,
    currentNextSteps,
    clearSuggestions
  } = useChatStore();
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [useRAG, setUseRAG] = useState(true);
  const [vectorStores, setVectorStores] = useState<any[]>([]);
  const [selectedVectorStores, setSelectedVectorStores] = useState<string[]>([]);
  const [dprMode, setDprMode] = useState(false);
  const [dprProgress, setDprProgress] = useState({ currentStep: 0, totalSteps: 0, progress: 0 });
  const [dprResponses, setDprResponses] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollToBottom();
    loadVectorStores();
  }, [messages]);

  const loadVectorStores = async () => {
    try {
      const response = await api.getVectorStores();
      setVectorStores(response.data);
      // Auto-select the main MSME Knowledge Base vector store
      const mainVectorStoreId = import.meta.env.VITE_MAIN_VECTOR_STORE_ID;
      const mainStore = response.data.find((store: any) =>
        store.openaiVectorStoreId === mainVectorStoreId
      );
      if (mainStore) {
        setSelectedVectorStores([mainStore.openaiVectorStoreId]);
        setUseRAG(true); // Enable RAG by default when main store is available
      } else {
        // Fallback to default stores if main store not found
        const defaultStores = response.data.filter((store: any) => store.metadata?.isDefault);
        setSelectedVectorStores(defaultStores.map((store: any) => store.openaiVectorStoreId));
      }
    } catch (error: any) {
      console.error('Failed to load vector stores:', error);
      // Don't block UI - continue without vector stores
      // User can still use chat, just without RAG
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

      // Always add AI response even if PDF generation failed
      // The AI response is the most important part
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

      // Handle PDF generation if requested
      if (response.data.generatePDF) {
        console.log('📄 PDF generation requested, checking for PDF URL...');
        
        if (response.data.pdfUrl) {
          try {
            console.log('📄 PDF URL found, converting to blob...');
            // Convert base64 data URL to blob and download
            const base64Data = response.data.pdfUrl.split(',')[1];
            if (!base64Data) {
              throw new Error('Invalid PDF data URL format');
            }
            
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/pdf' });
            
            // Download the PDF
            const { downloadBlob } = await import('@/lib/utils');
            const filename = `DPR_Conversation_${new Date().toISOString().split('T')[0]}.pdf`;
            downloadBlob(blob, filename);
            toast.success('PDF downloaded successfully!');
            console.log('✅ PDF downloaded:', filename);
          } catch (error: any) {
            console.error('Error downloading PDF:', error);
            toast.error(`Failed to download PDF: ${error.message}`);
          }
        } else {
          console.warn('⚠️  PDF generation requested but pdfUrl is missing');
          // PDF might be generating in background - show info message
          // Note: react-hot-toast doesn't have toast.info, using toast() instead
          toast('PDF is being generated. Please wait a moment and try again if download doesn\'t start automatically.', {
            icon: 'ℹ️',
            duration: 4000,
          });
        }
      }

      // Handle DPR creation mode
      if (response.data.dprAction === 'start_creation') {
        setDprMode(true);
        setDprProgress({ currentStep: 1, totalSteps: 1, progress: 0 });
      }

      // Update DPR progress if in DPR mode
      if (response.data.dprQuestions?.isDPRMode) {
        setDprMode(true);
        setDprProgress({
          currentStep: response.data.dprQuestions.currentStep || 1,
          totalSteps: response.data.dprQuestions.totalSteps || 1,
          progress: response.data.dprQuestions.progress || 0,
        });
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to get response from AI';
      
      toast.error(errorMessage);
      
      // Add error message to chat so user knows what happened
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
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
          const response = await api.transcribeAudio(audioFile);
          const transcription = response.data.transcription;
          setInputMessage(transcription);
          toast.success('Audio transcribed successfully!');
        } catch (error) {
          toast.error('Failed to transcribe audio');
        } finally {
          setLoading(false);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success(t('chat.listening'));
    } catch (error) {
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const exampleQuestions = [
    t('chat.howToStart'),
    t('chat.whichScheme'),
    t('chat.financialHelp'),
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center mb-4">
              <CardTitle>{t('chat.title')}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={useRAG ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseRAG(!useRAG)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {useRAG ? 'RAG On' : 'RAG Off'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearMessages}
                  disabled={messages.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('chat.startNewConversation')}
                </Button>
              </div>
            </div>

            {/* DPR Progress */}
            {dprMode && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">DPR Creation Progress</span>
                  <span className="text-xs text-blue-600">
                    Step {dprProgress.currentStep} of {dprProgress.totalSteps}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dprProgress.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Vector Store Selection */}
            {useRAG && vectorStores.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Knowledge Base:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vectorStores.map((store) => (
                    <label key={store._id} className="flex items-center gap-2 cursor-pointer">
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
                        className="rounded"
                      />
                      <span className="text-sm">{store.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({store.fileCount} files)
                      </span>
                    </label>
                  ))}
                </div>
                {selectedVectorStores.length === 0 && (
                  <p className="text-xs text-yellow-600">
                    ⚠️ No knowledge base selected. AI will respond without document context.
                  </p>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Welcome to MSME AI Assistant!
                  </h3>
                  <p className="text-muted-foreground">
                    I'm here to help you create your DPR. Ask me anything!
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      setInputMessage('How do I create the DPR?');
                      handleSend();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    How do I create the DPR?
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('chat.exampleQuestions')}</p>
                  <div className="space-y-2">
                    {exampleQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full text-left justify-start"
                        onClick={() => handleSend(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2">
                        {useRAG && selectedVectorStores.length > 0 && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            RAG
                          </span>
                        )}
                        {message.suggestions && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" />
                            AI
                          </span>
                        )}
                        {message.ragContext === 'RAG used' && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            Docs
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Display suggestions and next steps for assistant messages */}
                  {message.role === 'assistant' && (message.suggestions || message.nextSteps) && (
                    <div className="mt-4 space-y-3">
                      {message.suggestions && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              AI Suggestions
                            </span>
                          </div>
                          {message.suggestions.financialSuggestions && (
                            <div className="mb-2">
                              <div className="flex items-center gap-1 mb-1">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                  Financial Recommendations
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {JSON.stringify(message.suggestions.financialSuggestions, null, 2)}
                              </p>
                            </div>
                          )}
                          {message.suggestions.schemeSuggestions && (
                            <div className="mb-2">
                              <div className="flex items-center gap-1 mb-1">
                                <TrendingUp className="h-3 w-3 text-purple-600" />
                                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                  Government Schemes
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {JSON.stringify(message.suggestions.schemeSuggestions, null, 2)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {message.nextSteps && message.nextSteps.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                              Next Steps
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {message.nextSteps.map((step, stepIndex) => (
                              <li key={stepIndex} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                <span className="text-green-600 mt-1">•</span>
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                placeholder={t('chat.placeholder')}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? 'destructive' : 'outline'}
                size="sm"
                disabled={isLoading}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

    </Layout>
  );
};


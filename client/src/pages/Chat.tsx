import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, Mic, MicOff, Trash2, Lightbulb, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      const response = await api.chat(message, conversationHistory);
      
      addMessage({
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        suggestions: response.data.suggestions,
        nextSteps: response.data.nextSteps,
      });
    } catch (error) {
      toast.error('Failed to get response from AI');
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
            <div className="flex justify-between items-center">
              <CardTitle>{t('chat.title')}</CardTitle>
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
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                  
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


import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { StepChatPanel, StepChatMessage } from './StepChatPanel';

export interface AssistSuggestion {
  title: string;
  why: string;
  how: string;
}

interface StepAnalyzeAssistProps {
  stepTitle: string;
  analyzing: boolean;
  analyzed: boolean;
  suggestions: AssistSuggestion[];
  chatOpen: boolean;
  chatLoading: boolean;
  messages: StepChatMessage[];
  onAnalyze: () => void;
  onOpenChat: () => void;
  onCloseChat: () => void;
  onSendChat: (message: string) => void;
  children: React.ReactNode;
}

export const StepAnalyzeAssist: React.FC<StepAnalyzeAssistProps> = ({
  stepTitle,
  analyzing,
  analyzed,
  suggestions,
  chatOpen,
  chatLoading,
  messages,
  onAnalyze,
  onOpenChat,
  onCloseChat,
  onSendChat,
  children,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border-2 border-primary/15 bg-primary/5 p-4">
        <p className="text-sm text-muted-foreground">{t('dprBuilder.assist.helperText')}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onAnalyze}
          disabled={analyzing}
          className="border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary flex-shrink-0"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('dprBuilder.assist.analyzing')}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {t('dprBuilder.assist.analyzeButton')}
            </>
          )}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-primary mb-1">{t('dprBuilder.assist.suggestionsHeading')}</p>
                <p className="text-sm text-muted-foreground">{t('dprBuilder.assist.suggestionsHint')}</p>
              </div>
            </div>
            <div className="space-y-3">
              {suggestions.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-lg border border-primary/20 bg-white/70 p-3">
                  <p className="font-semibold text-foreground text-sm">{item.title}</p>
                  {item.why && <p className="text-sm text-muted-foreground mt-1">{item.why}</p>}
                  {item.how && <p className="text-sm text-foreground mt-2">{item.how}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {children}

      {analyzed && !chatOpen && (
        <button
          type="button"
          onClick={onOpenChat}
          className="fixed bottom-8 right-8 z-40 h-14 w-14 rounded-full bg-primary text-white shadow-2xl border-2 border-white flex items-center justify-center hover:scale-105 transition-transform"
          aria-label={t('dprBuilder.assist.openChat')}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {chatOpen && (
        <StepChatPanel
          stepTitle={stepTitle}
          messages={messages}
          loading={chatLoading}
          onClose={onCloseChat}
          onSend={onSendChat}
        />
      )}
    </div>
  );
};

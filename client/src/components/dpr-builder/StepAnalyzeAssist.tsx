import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Loader2, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { StepChatPanel, StepChatMessage } from './StepChatPanel';
import { DEFAULT_DPR_BUILDER_ASSIST_PROMPT, saveAssistPrompt } from '@/lib/dprBuilderAssistPrompt';

export interface AssistSuggestion {
  title: string;
  observation: string;
  recommendation: string;
  offloadingIdea?: string | null;
}

interface StepAnalyzeAssistProps {
  stepTitle: string;
  analyzing: boolean;
  analyzed: boolean;
  suggestions: AssistSuggestion[];
  chatOpen: boolean;
  chatLoading: boolean;
  messages: StepChatMessage[];
  customInstructions: string;
  onCustomInstructionsChange: (value: string) => void;
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
  customInstructions,
  onCustomInstructionsChange,
  onAnalyze,
  onOpenChat,
  onCloseChat,
  onSendChat,
  children,
}) => {
  const { t } = useTranslation();
  const [promptOpen, setPromptOpen] = useState(false);

  const persistPrompt = (value: string) => {
    onCustomInstructionsChange(value);
    saveAssistPrompt(value);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-primary/15 bg-primary/5 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t('dprBuilder.assist.helperText')}</p>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPromptOpen((open) => !open)}
              className="border-2"
            >
              {promptOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              {t('dprBuilder.assist.customInstructions')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyze}
              disabled={analyzing}
              className="border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
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
        </div>

        {promptOpen && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t('dprBuilder.assist.customInstructionsHint')}</p>
            <textarea
              value={customInstructions}
              onChange={(e) => persistPrompt(e.target.value)}
              rows={14}
              className="w-full text-xs font-mono p-3 border-2 border-primary/20 rounded-lg focus:border-primary focus:outline-none resize-y bg-white"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => persistPrompt(DEFAULT_DPR_BUILDER_ASSIST_PROMPT)}
            >
              {t('dprBuilder.assist.resetPrompt')}
            </Button>
          </div>
        )}
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
                  {item.observation && <p className="text-sm text-muted-foreground mt-1">{item.observation}</p>}
                  {item.recommendation && <p className="text-sm text-foreground mt-2">{item.recommendation}</p>}
                  {item.offloadingIdea && (
                    <p className="text-sm text-foreground mt-2">
                      <span className="font-medium">{t('dprBuilder.assist.offloadingLabel')}: </span>
                      {item.offloadingIdea}
                    </p>
                  )}
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

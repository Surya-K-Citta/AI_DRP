import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface StepChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StepChatPanelProps {
  stepTitle: string;
  messages: StepChatMessage[];
  loading: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

export const StepChatPanel: React.FC<StepChatPanelProps> = ({
  stepTitle,
  messages,
  loading,
  onClose,
  onSend,
}) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const submit = () => {
    const text = input.trim();
    if (!text || loading) return;
    onSend(text);
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label={t('dprBuilder.assist.closeChat')}
        onClick={onClose}
      />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l-2 border-primary/20">
        <div className="flex items-start justify-between gap-3 border-b border-primary/10 bg-primary p-4">
          <div>
            <p className="text-sm font-semibold text-white">{t('dprBuilder.assist.chatTitle')}</p>
            <p className="text-xs text-white/90 mt-1">{stepTitle}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/15"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white border border-primary/15 text-foreground'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('dprBuilder.assist.thinking')}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-primary/10 p-3 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder={t('dprBuilder.assist.chatPlaceholder')}
              className="flex-1 resize-none rounded-lg border-2 border-primary/20 p-2 text-sm focus:border-primary focus:outline-none"
            />
            <Button onClick={submit} disabled={loading || !input.trim()} className="h-10">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

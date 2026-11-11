import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Send, X } from 'lucide-react';
import { api } from '@/lib/api';
import { QuestionDef, VentureMatchAnswers } from '@/lib/ventureMatch/types';
import {
  ClarifyingQuestion,
  HelpReply,
  filterBudgetNarrowReplies,
  getHelpGuide,
  labelForReply,
  promptForQuestion,
  sanitizeOwnerOptionIds,
} from '@/lib/ventureMatch/helpGuides';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type ChatMsg = { role: 'user' | 'assistant'; content: string };
type HelpLang = 'en' | 'te';

type Recommend = {
  optionIds: string[];
  confidence: 'high' | 'low';
};

function resolveHelpLanguage(chatLang: HelpLang, userText: string): HelpLang {
  if (/[\u0C00-\u0C7F]/.test(userText)) return 'te';
  if (/[A-Za-z]{3,}/.test(userText)) return 'en';
  return chatLang;
}

interface VentureMatchHelpTriggerProps {
  onClick: () => void;
  className?: string;
}

/** Inline “Need help choosing?” pill — place beside Option A (desktop) or above the question (mobile). */
export const VentureMatchHelpTrigger: React.FC<VentureMatchHelpTriggerProps> = ({
  onClick,
  className,
}) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground',
        'h-11 w-11 text-sm font-medium shadow-md hover:bg-primary/90 whitespace-nowrap sm:h-auto sm:w-auto sm:px-3.5 sm:py-2',
        className
      )}
      aria-label={t('ventureMatch.help.open')}
    >
      <HelpCircle className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">{t('ventureMatch.help.open')}</span>
    </button>
  );
};

interface VentureMatchHelpBubbleProps {
  question: QuestionDef;
  answers: VentureMatchAnswers;
  onApply: (optionIds: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VentureMatchHelpBubble: React.FC<VentureMatchHelpBubbleProps> = ({
  question,
  answers,
  onApply,
  open,
  onOpenChange,
}) => {
  const { i18n } = useTranslation();
  const uiLang: HelpLang = i18n.language?.startsWith('te') ? 'te' : 'en';
  const [chatLang, setChatLang] = useState<HelpLang>(uiLang);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [guideChips, setGuideChips] = useState<HelpReply[]>([]);
  const [replyIds, setReplyIds] = useState<string[]>([]);
  const [recommend, setRecommend] = useState<Recommend | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sessionKey = useRef('');

  const guide = getHelpGuide(question.id);
  const tChat = i18n.getFixedT(chatLang);

  useEffect(() => {
    setChatLang(uiLang);
  }, [uiLang]);

  useEffect(() => {
    setMessages([]);
    setSuggested([]);
    setGuideChips([]);
    setReplyIds([]);
    setRecommend(null);
    setError(null);
    setDraft('');
    sessionKey.current = '';
  }, [question.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, recommend, guideChips]);

  const optionLabels = Object.fromEntries(
    question.optionIds.map((id) => [
      id,
      tChat(`ventureMatch.questions.${question.id}.options.${id}`),
    ])
  );

  const repliesForQuestion = (q: ClarifyingQuestion, collected: string[]): HelpReply[] => {
    if (question.id === 'budget' && q.id === 'bandNarrow') {
      return filterBudgetNarrowReplies(q.replies, collected);
    }
    return q.replies;
  };

  const startGuideSession = (lang: HelpLang) => {
    setMessages([{ role: 'assistant', content: tChat('ventureMatch.help.kickoff') }]);
    setReplyIds([]);
    setError(null);
    setRecommend(null);
    setSuggested([]);
    setDraft('');
    const idx = guide.nextQuestionIndex([]);
    if (idx !== null) {
      const q = guide.clarifyingQuestions[idx];
      setMessages((prev) => [...prev, { role: 'assistant', content: promptForQuestion(q, lang) }]);
      setGuideChips(repliesForQuestion(q, []));
    } else {
      setGuideChips([]);
    }
  };

  const showClarifying = (collected: string[], lang: HelpLang) => {
    const idx = guide.nextQuestionIndex(collected);
    if (idx === null) {
      setGuideChips([]);
      return;
    }
    const q = guide.clarifyingQuestions[idx];
    if (!q) {
      setGuideChips([]);
      return;
    }
    setMessages((prev) => [...prev, { role: 'assistant', content: promptForQuestion(q, lang) }]);
    setGuideChips(repliesForQuestion(q, collected));
    setSuggested([]);
    setRecommend(null);
  };

  const applyMapped = (
    optionIds: string[],
    lang: HelpLang,
    confidence: 'high' | 'low' = 'high',
    collected: string[] = []
  ) => {
    let ids = optionIds.filter((id) => question.optionIds.includes(id));
    if (question.id === 'owner') ids = sanitizeOwnerOptionIds(ids);
    if (!ids.length) {
      showClarifying(collected, lang);
      return;
    }
    const names = ids.map((id) => optionLabels[id] || id).join(', ');
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          lang === 'te'
            ? `దీనికి సరిపోయే ఎంపిక: ${names}`
            : `Based on Andhra Pradesh scheme rules, the matching choice is: ${names}`,
      },
    ]);
    setRecommend({ optionIds: ids, confidence });
    setGuideChips([]);
    setSuggested([]);
  };

  const callHelp = async (transcript: ChatMsg[], language: HelpLang) => {
    const response = await api.ventureMatchHelp({
      questionId: question.id,
      optionIds: question.optionIds,
      optionLabels,
      questionTitle: tChat(`ventureMatch.questions.${question.id}.title`),
      questionLabel: tChat(`ventureMatch.questions.${question.id}.label`),
      answersSoFar: answers as Record<string, unknown>,
      messages: transcript,
      language,
      apGuideNotes: guide.apRuleNotes,
      clarifyingScript: guide.clarifyingQuestions.map((q) => ({
        id: q.id,
        prompt: q.prompt.en,
        replies: q.replies.map((r) => ({ id: r.id, label: r.label.en })),
      })),
    });
    return response?.data;
  };

  const sendTurn = async (text: string, kickoff = false, forcedTranscript?: ChatMsg[]) => {
    const trimmed = text.trim();
    if (!kickoff && !trimmed) return;
    if (loading) return;

    const language = resolveHelpLanguage(chatLang, trimmed);
    const nextMessages: ChatMsg[] = kickoff
      ? messages
      : forcedTranscript || [...messages, { role: 'user', content: trimmed }];

    if (!kickoff && !forcedTranscript) {
      setMessages(nextMessages);
      setDraft('');
    } else if (!kickoff && forcedTranscript) {
      setDraft('');
    }
    setLoading(true);
    setError(null);
    setRecommend(null);
    setSuggested([]);
    setGuideChips([]);

    try {
      const data = await callHelp(nextMessages, language);
      const assistantMessage =
        typeof data?.assistantMessage === 'string' && data.assistantMessage.trim()
          ? data.assistantMessage.trim()
          : tChat('ventureMatch.help.error');
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }]);

      if (data?.mode === 'recommend' && Array.isArray(data.optionIds) && data.optionIds.length) {
        let valid = data.optionIds.filter((id: string) => question.optionIds.includes(id));
        if (question.id === 'owner') valid = sanitizeOwnerOptionIds(valid);
        if (valid.length) {
          setRecommend({
            optionIds: valid,
            confidence: data.confidence === 'low' ? 'low' : 'high',
          });
        }
      } else if (Array.isArray(data?.suggestedUserReplies)) {
        setSuggested(data.suggestedUserReplies.filter(Boolean).slice(0, 4));
      }
    } catch {
      setError(tChat('ventureMatch.help.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuideReply = (reply: HelpReply) => {
    if (loading || recommend) return;
    const lang = chatLang;
    const label = labelForReply(reply, lang);
    const nextCollected = [...replyIds, reply.id];
    setReplyIds(nextCollected);

    setMessages((prev) => {
      const withUser = [...prev, { role: 'user' as const, content: label }];
      const mapped = guide.mapToOption(nextCollected);
      if (mapped) {
        setGuideChips([]);
        queueMicrotask(() => applyMapped(mapped, lang, 'high', nextCollected));
        return withUser;
      }
      const nextIdx = guide.nextQuestionIndex(nextCollected);
      if (nextIdx !== null) {
        const q = guide.clarifyingQuestions[nextIdx];
        const chips = repliesForQuestion(q, nextCollected);
        queueMicrotask(() => {
          setGuideChips(chips);
          setSuggested([]);
          setRecommend(null);
        });
        return [...withUser, { role: 'assistant' as const, content: promptForQuestion(q, lang) }];
      }
      queueMicrotask(() => void sendTurn(label, false, withUser));
      return withUser;
    });
  };

  const switchChatLang = (lang: HelpLang) => {
    if (lang === chatLang) return;
    setChatLang(lang);
    sessionKey.current = '';
  };

  useEffect(() => {
    if (!open) return;
    const key = `${question.id}:${chatLang}`;
    if (sessionKey.current === key) return;
    sessionKey.current = key;
    startGuideSession(chatLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, question.id, chatLang]);

  const recommendedLabels = recommend
    ? recommend.optionIds.map((id) => optionLabels[id] || id).join(', ')
    : '';

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[min(100vw-2rem,360px)] rounded-[18px] border-2 border-primary/20 bg-card shadow-2xl flex flex-col max-h-[min(70vh,520px)]">
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="font-semibold text-sm">{tChat('ventureMatch.help.title')}</p>
            <div
              className="inline-flex rounded-full border border-border bg-muted/60 p-0.5 shrink-0"
              role="group"
              aria-label={tChat('ventureMatch.help.languageToggle')}
            >
              <button
                type="button"
                onClick={() => switchChatLang('en')}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
                  chatLang === 'en'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => switchChatLang('te')}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
                  chatLang === 'te'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                తెలుగు
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{tChat('ventureMatch.help.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-full p-1 hover:bg-muted shrink-0"
          aria-label={tChat('ventureMatch.help.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            className={cn(
              'rounded-[12px] px-3 py-2 whitespace-pre-wrap',
              msg.role === 'user'
                ? 'ml-8 bg-primary text-primary-foreground'
                : 'mr-8 bg-muted text-foreground'
            )}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <p className="text-xs text-muted-foreground">{tChat('ventureMatch.help.thinking')}</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        {recommend && (
          <div className="mr-8 rounded-[12px] border border-primary/30 bg-primary/5 p-3 space-y-2">
            <p className="text-sm font-medium">{recommendedLabels}</p>
            {recommend.confidence === 'low' && (
              <p className="text-xs text-muted-foreground">{tChat('ventureMatch.help.lowConfidence')}</p>
            )}
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                onApply(recommend.optionIds);
                onOpenChange(false);
              }}
            >
              {tChat('ventureMatch.help.useAnswer')}
            </Button>
          </div>
        )}
        {guideChips.length > 0 && !recommend && !loading && (
          <div className="flex flex-wrap gap-2">
            {guideChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleGuideReply(chip)}
                className="text-xs rounded-full border border-primary/30 px-3 py-1.5 hover:bg-primary/10"
              >
                {labelForReply(chip, chatLang)}
              </button>
            ))}
          </div>
        )}
        {suggested.length > 0 && !recommend && !loading && guideChips.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {suggested.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => void sendTurn(chip)}
                className="text-xs rounded-full border border-primary/30 px-3 py-1.5 hover:bg-primary/10"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        className="flex items-center gap-2 p-3 border-t border-border"
        onSubmit={(e) => {
          e.preventDefault();
          void sendTurn(draft);
        }}
      >
        <input
          className="flex-1 h-10 rounded-[10px] border border-input bg-background px-3 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={tChat('ventureMatch.help.placeholder')}
          disabled={loading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading || !draft.trim()}
          aria-label={tChat('ventureMatch.help.send')}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

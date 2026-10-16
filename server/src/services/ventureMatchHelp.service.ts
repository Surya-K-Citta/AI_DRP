// @ts-nocheck
import { openai } from '../lib/openaiClient';
import dotenv from 'dotenv';

export type HelpMessage = { role: 'user' | 'assistant'; content: string };

export type HelpResult =
  | {
      mode: 'ask';
      assistantMessage: string;
      suggestedUserReplies: string[];
    }
  | {
      mode: 'recommend';
      assistantMessage: string;
      optionIds: string[];
      confidence: 'high' | 'low';
    };

/** Fallback AP rule notes when client does not send guides (by questionId). */
const AP_GUIDE_NOTES: Record<string, string> = {
  activity:
    'AP CMEP targets Manufacturing or Knowledge Economy / tech services. AP MSME-EDP 4.0 targets manufacturing. AP Food Processing Policy 4.0 targets food processing in AP. OBMMS covers broader self-employment. Crop-only farming is not an MSME industrial unit under these AP schemes.',
  stage:
    'AP EDP 4.0 and AP CMEP focus on new (greenfield) enterprises. AP Technology Upgradation is for existing or restarted manufacturing. OBMMS needs a planned or running unit, not idea-only.',
  budget:
    'AP EDP / FPP / CMEP / OBMMS need a real project cost band (bank-linked credit for CMEP). Map to the closest cost option. Budget "none" means no loan and fails CMEP.',
  legal:
    'AP EDP needs registered sole / partnership / company. OBMMS often allows individual / unregistered. SHG/FPO/coop/trust/society is otherEntity.',
  owner:
    'AP CMEP enhanced subsidy needs AP domicile plus woman, transgender, ex-serviceman, or PWD. Combinable tags: female, pwd, transgender, exServiceman, plus at most ONE of sc, st, bc, generalMale (pick-one group). Exclusive tags: notDecided, noMajority, notSure. OBMMS needs SC/ST/BC/PWD.',
  domicile:
    'AP CMEP, EDP, FPP, OBMMS, and APIIC park rebates require Andhra Pradesh local domicile.',
  location:
    'AP EDP needs city/town, village, or APIIC park in AP — not home-only. AP MSME-PARKS needs APIIC. Outside AP fails state schemes.',
  riceCard:
    'AP OBMMS requires an Andhra Pradesh White Rice Card. Other ration cards are not enough.',
  age: 'AP OBMMS typically requires age 21 to 60.',
  education: 'Used for DIC / welfare paperwork completeness in Andhra Pradesh applications.',
  udyam:
    'AP MSME & EDP 4.0 and Food Processing Policy 4.0 require Udyam registration or readiness to register for MSME incentives.',
  priorSubsidy:
    'Ask about Andhra Pradesh government subsidy or welfare corporation loans in the last 5 years. Outstanding AP subsidy loans can block new welfare support.',
  govtFamily:
    'AP welfare corporation self-employment screening often asks whether a close family member holds a government job.',
  market:
    'Map how they mainly sell for AP unit context. Do not recommend central ONDC/RAMP or export incentive schemes.',
};

function extractJson(text: string): any {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(raw);
  } catch {
    const objectMatch = raw.match(/\{[\s\S]*\}/);
    if (!objectMatch) return null;
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      return null;
    }
  }
}

function userTurnCount(messages: HelpMessage[]): number {
  return messages.filter((m) => m.role === 'user').length;
}

function formatClarifyingScript(
  clarifyingScript?: Array<{
    id: string;
    prompt: string;
    replies: Array<{ id: string; label: string }>;
  }>
): string {
  if (!Array.isArray(clarifyingScript) || !clarifyingScript.length) return '';
  return clarifyingScript
    .map((q, i) => {
      const replies = (q.replies || []).map((r) => `${r.id}=${r.label}`).join('; ');
      return `Q${i + 1} (${q.id}): ${q.prompt} | replies: ${replies}`;
    })
    .join('\n');
}

export class VentureMatchHelpService {
  static async help(input: {
    questionId: string;
    optionIds: string[];
    optionLabels: Record<string, string>;
    questionTitle: string;
    questionLabel: string;
    answersSoFar: Record<string, any>;
    messages: HelpMessage[];
    language: 'en' | 'te';
    apGuideNotes?: string;
    clarifyingScript?: Array<{
      id: string;
      prompt: string;
      replies: Array<{ id: string; label: string }>;
    }>;
  }): Promise<HelpResult> {
    const allowed = new Set(input.optionIds || []);
    const lang = input.language === 'te' ? 'te' : 'en';
    const langRule =
      lang === 'te'
        ? 'Write assistantMessage and suggestedUserReplies entirely in Telugu script (తెలుగు). Do not use Hindi or English except option id codes.'
        : 'Write assistantMessage and suggestedUserReplies in simple English.';

    const turns = userTurnCount(input.messages || []);
    const mustRecommendSoon = turns >= 4;

    const apNotes =
      (typeof input.apGuideNotes === 'string' && input.apGuideNotes.trim()) ||
      AP_GUIDE_NOTES[input.questionId] ||
      'Use Andhra Pradesh Industries, Welfare Corporation, and APIIC rules only.';
    const script = formatClarifyingScript(input.clarifyingScript);

    const system = `You help an Andhra Pradesh MSME entrepreneur pick a Scheme Finder multiple-choice answer.
You are not a general chatbot. You only clarify the current question, then map their situation to allowed option ids.

STRICT SCOPE — Andhra Pradesh government / state rules ONLY:
- Ground every clarification and recommendation in AP Industries & Commerce policies (MSME-EDP 4.0, Food Processing Policy 4.0, Technology Upgradation, APIIC / MSME-PARKS) and AP State Welfare Corporation (OBMMS) rules.
- Do NOT cite, recommend, or compare central Government of India schemes (PMEGP, MUDRA, Stand-Up India, PMFME, SVANidhi, Vishwakarma, CGTMSE, RAMP, ONDC programmes, etc.).
- If the user mentions a central scheme, ignore it for matching and stay on the current AP Scheme Finder question.

${langRule}

Current question id: ${input.questionId}
Question heading: ${input.questionLabel}
Question text: ${input.questionTitle}
Allowed option ids and labels: ${JSON.stringify(input.optionLabels)}
Previous answers (context only): ${JSON.stringify(input.answersSoFar || {})}

AP guide for this question:
${apNotes}
${script ? `\nPreferred clarifying script (follow this order when asking):\n${script}` : ''}

Rules:
- Return JSON only. No markdown.
- Never invent option ids. Only use ids from the allowed list.
- Read negation carefully. "I don't own a company yet" / "no firm" / "not registered" is unregistered, not sole owner and not company.
- "I work on my own" with no registration is unregistered if they say they have no firm; sole only if they are a registered sole proprietor.
- Do not match on a single keyword if the sentence means the opposite.
- Never guarantee, promise or assure anything (eligibility, approval, subsidy amount, timelines). Do not say "you will get", "you qualify" or "guaranteed". You only point to the answer option that best matches what the person said.
- For questionId "owner": optionIds may be several tags (female, pwd, transgender, exServiceman) plus at most one of sc, st, bc, generalMale. Never combine notDecided, noMajority, or notSure with any other tag.
- Ask at most ONE short clarifying question per turn (mode "ask"). Prefer the clarifying script above.
- suggestedUserReplies: 2–4 short example answers the user might tap (same language as assistantMessage).
- When you are reasonably sure, use mode "recommend" with optionIds.
- For all other questions, optionIds must have exactly one id.
- If still unclear after several turns, recommend the closest fit with confidence "low" and tell them they can tap a different option on the card.
${mustRecommendSoon ? '- You MUST use mode "recommend" this turn (pick the best allowed id).' : ''}

JSON shapes:
{"mode":"ask","assistantMessage":"...","suggestedUserReplies":["...","..."]}
{"mode":"recommend","assistantMessage":"...","optionIds":["id"],"confidence":"high"}`;

    const transcript = (input.messages || [])
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content:
            transcript ||
            'The user does not know which option to choose. Start by asking one simple clarifying question from the AP clarifying script.',
        },
      ],
    });

    const parsed = extractJson(response.choices[0]?.message?.content || '');
    return this.normalize(parsed, allowed, lang, input.optionLabels);
  }

  private static normalize(
    parsed: any,
    allowed: Set<string>,
    lang: 'en' | 'te',
    labels: Record<string, string>
  ): HelpResult {
    const fallbackAsk: HelpResult = {
      mode: 'ask',
      assistantMessage:
        lang === 'te'
          ? 'మీ పరిస్థితి ఒక వాక్యంలో చెప్పండి. నేను సరైన ఎంపిక చూపిస్తాను.'
          : 'In one sentence, tell me your situation. I will point to the right choice.',
      suggestedUserReplies:
        lang === 'te' ? ['నాకు తెలియదు', 'సహాయం చేయండి'] : ['I am not sure', 'Help me pick'],
    };

    if (!parsed || typeof parsed !== 'object') return fallbackAsk;

    if (parsed.mode === 'recommend') {
      const raw = Array.isArray(parsed.optionIds) ? parsed.optionIds : [parsed.optionIds];
      let optionIds = raw.map((id: any) => String(id || '').trim()).filter((id: string) => allowed.has(id));
      const exclusiveOwner = optionIds.find((id: string) => ['notDecided', 'noMajority', 'notSure'].includes(id));
      if (exclusiveOwner) optionIds = [exclusiveOwner];
      else {
        const pickOne = ['sc', 'st', 'bc', 'generalMale'];
        const firstPick = optionIds.find((id: string) => pickOne.includes(id));
        optionIds = optionIds.filter((id: string) => !pickOne.includes(id) || id === firstPick);
      }
      if (!optionIds.length) return fallbackAsk;
      const names = optionIds.map((id: string) => labels[id] || id).join(', ');
      const confidence = parsed.confidence === 'low' ? 'low' : 'high';
      const assistantMessage =
        typeof parsed.assistantMessage === 'string' && parsed.assistantMessage.trim()
          ? parsed.assistantMessage.trim()
          : lang === 'te'
            ? `దీనికి సరిపోయే ఎంపిక: ${names}`
            : `The matching choice is: ${names}`;
      return { mode: 'recommend', assistantMessage, optionIds, confidence };
    }

    const assistantMessage =
      typeof parsed.assistantMessage === 'string' && parsed.assistantMessage.trim()
        ? parsed.assistantMessage.trim()
        : fallbackAsk.assistantMessage;
    const suggested = Array.isArray(parsed.suggestedUserReplies)
      ? parsed.suggestedUserReplies.map((s: any) => String(s || '').trim()).filter(Boolean).slice(0, 4)
      : fallbackAsk.suggestedUserReplies;
    return {
      mode: 'ask',
      assistantMessage,
      suggestedUserReplies: suggested.length ? suggested : fallbackAsk.suggestedUserReplies,
    };
  }
}

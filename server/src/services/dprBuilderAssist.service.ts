// @ts-nocheck
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { DEFAULT_DPR_BUILDER_ASSIST_PROMPT } from '../constants/dprBuilderAssistPrompt';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TEMPERATURE = 0.35;

export interface BuilderAssistSuggestion {
  title: string;
  observation: string;
  recommendation: string;
  offloadingIdea?: string | null;
}

export interface AnalyzeResult {
  suggestions: BuilderAssistSuggestion[];
}

function compactValue(value: any): any {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  if (Array.isArray(value)) {
    const items = value.map(compactValue).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (typeof value === 'object') {
    const next: Record<string, any> = {};
    for (const [key, child] of Object.entries(value)) {
      const compacted = compactValue(child);
      if (compacted !== undefined) next[key] = compacted;
    }
    return Object.keys(next).length ? next : undefined;
  }
  return value;
}

function extractJson(text: string): any {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(raw);
  } catch {
    const objectMatch = raw.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function splitFactSheet(factSheet: any) {
  const compact = compactValue(factSheet) || {};
  return {
    previousSteps: compact.previousSteps || {},
    currentStep: compact.currentStep || {},
  };
}

function reviewPayload(stepId: string, stepTitle: string, factSheet: any): string {
  const { previousSteps, currentStep } = splitFactSheet(factSheet);
  return `Step id: ${stepId}
Step title: ${stepTitle}

PREVIOUS STEPS (context only — do NOT review, comment on, or suggest about these values):
${JSON.stringify(previousSteps, null, 2)}

CURRENT STEP (the only values to review):
${JSON.stringify(currentStep, null, 2)}

Review ONLY the CURRENT STEP. Do not mention previous-step items (for example, do not discuss working capital on the financing step).`;
}

function resolveInstructions(customInstructions?: string): string {
  const trimmed = typeof customInstructions === 'string' ? customInstructions.trim() : '';
  return trimmed || DEFAULT_DPR_BUILDER_ASSIST_PROMPT;
}

function mapSuggestions(parsed: any): BuilderAssistSuggestion[] {
  if (!Array.isArray(parsed?.suggestions)) return [];
  return parsed.suggestions
    .filter((s: any) => s && (s.title || s.observation || s.recommendation || s.why || s.how))
    .map((s: any) => {
      const offloading =
        s.offloadingIdea === null || s.offloadingIdea === undefined || s.offloadingIdea === ''
          ? null
          : String(s.offloadingIdea);
      return {
        title: String(s.title || 'Suggestion'),
        observation: String(s.observation || s.why || ''),
        recommendation: String(s.recommendation || s.how || ''),
        offloadingIdea: offloading,
      };
    });
}

export class DprBuilderAssistService {
  static async analyzeStep(params: {
    stepId: string;
    stepTitle: string;
    factSheet: any;
    customInstructions?: string;
  }): Promise<AnalyzeResult> {
    const { stepId, stepTitle, factSheet, customInstructions } = params;
    const system = resolveInstructions(customInstructions);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: TEMPERATURE,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: reviewPayload(stepId, stepTitle, factSheet) },
      ],
    });

    const text = response.choices[0]?.message?.content || '';
    const suggestions = mapSuggestions(extractJson(text));

    if (!suggestions.length) {
      return {
        suggestions: [
          {
            title: 'Looks fine',
            observation: 'The current-step values look reasonable based on what you entered.',
            recommendation: 'Looks fine — no change needed unless you want to discuss a line in chat.',
            offloadingIdea: null,
          },
        ],
      };
    }

    return { suggestions };
  }

  static async chatStep(params: {
    stepId: string;
    stepTitle: string;
    factSheet: any;
    message: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    customInstructions?: string;
  }): Promise<{ response: string }> {
    const { stepId, stepTitle, factSheet, message, conversationHistory = [], customInstructions } = params;

    const system = `${resolveInstructions(customInstructions)}

You are now in a follow-up conversation about this same CURRENT step ("${stepTitle}", ${stepId}).
Reply in natural prose (not JSON) unless the user asks for JSON.
Keep following the rules above: current step only, no invented numbers, do not invent problems, be a practical mentor.

${reviewPayload(stepId, stepTitle, factSheet)}`;

    const history = conversationHistory
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .slice(-16)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content),
      }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: TEMPERATURE,
      max_tokens: 900,
      messages: [
        { role: 'system', content: system },
        ...history,
        { role: 'user', content: message },
      ],
    });

    const text =
      response.choices[0]?.message?.content?.trim() ||
      'Happy to talk through the current-step figures. What would you like to discuss?';

    return { response: text };
  }
}

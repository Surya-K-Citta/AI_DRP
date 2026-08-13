// @ts-nocheck
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TEMPERATURE = 0.35;

export interface BuilderAssistSuggestion {
  title: string;
  why: string;
  how: string;
}

export interface AnalyzeResult {
  suggestions: BuilderAssistSuggestion[];
}

const GROUNDING_RULES = `GROUNDING RULES (strict):
- Use ONLY facts, names, numbers, costs, areas, rates, quantities, and scheme names present in the PROJECT FACT SHEET.
- Never invent, estimate, round-up, or fill missing numbers, costs, names, locations, or scheme codes.
- If something is missing, say it is not provided and ask the user to supply it.
- Do not write values into the DPR or tell the user to treat invented figures as their own.
- Industry/geo patterns may be described as typical patterns, clearly labeled as such, never as this project's data.`;

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

function factSheetContext(factSheet: any, stepId: string, stepTitle: string): string {
  const compact = compactValue(factSheet) || {};
  return `Current step id: ${stepId}
Current step title: ${stepTitle}

PROJECT FACT SHEET (compact JSON of previous steps + current step values):
${JSON.stringify(compact, null, 2)}`;
}

export class DprBuilderAssistService {
  static async analyzeStep(params: {
    stepId: string;
    stepTitle: string;
    factSheet: any;
  }): Promise<AnalyzeResult> {
    const { stepId, stepTitle, factSheet } = params;

    const system = `You are a DPR improvement advisor for Indian MSME Detailed Project Reports.
You perform a one-shot review of the CURRENT STEP only.

${GROUNDING_RULES}

Return ONLY valid JSON (no markdown) with this shape:
{"suggestions":[{"title":"...","why":"...","how":"..."}]}

Each suggestion must be a practical improvement for the current step, grounded in the fact sheet.
If the current step is thin, suggest what to clarify or add — without inventing the values.
Limit to 3–6 suggestions. Be concise.`;

    const user = `${factSheetContext(factSheet, stepId, stepTitle)}

Produce proactive improvement suggestions for the "${stepTitle}" step only.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: TEMPERATURE,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const text = response.choices[0]?.message?.content || '';
    const parsed = extractJson(text);
    const suggestions = Array.isArray(parsed?.suggestions)
      ? parsed.suggestions
          .filter((s: any) => s && (s.title || s.why || s.how))
          .map((s: any) => ({
            title: String(s.title || 'Suggestion'),
            why: String(s.why || ''),
            how: String(s.how || ''),
          }))
      : [];

    if (!suggestions.length) {
      return {
        suggestions: [
          {
            title: 'Review this step with the facts you entered',
            why: 'The analysis could not produce structured suggestions from the current fact sheet.',
            how: 'Confirm the required fields on this step, then run Analyze & Suggestions again. Chat can help once analysis succeeds.',
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
  }): Promise<{ response: string }> {
    const { stepId, stepTitle, factSheet, message, conversationHistory = [] } = params;

    const researchNotes = await this.researchSimilarProjects(factSheet, stepId, stepTitle);

    const system = `You are a DPR improvement advisor in a step-scoped chat for an Indian MSME Detailed Project Report.

${GROUNDING_RULES}

SCOPE:
- You may ONLY discuss and suggest improvements relevant to the current step: "${stepTitle}" (${stepId}).
- If the user asks about another step, briefly say you can only help with this step right now, then offer a related angle for this step.
- Continue the conversation naturally. Ask clarifying questions when facts are missing or ambiguous.
- The project fact sheet is already in context. Do not ask the user to paste it.

SIMILAR PROJECTS:
- Use the RESEARCH NOTES below (similar real-world projects in relevant sectors and geographies).
- Map those patterns onto the user's own facts as optional improvements.
- If a comparable figure is not in the fact sheet, present it as an industry pattern and ask whether they want to consider it. Never treat it as this project's number.
- Do not fabricate named projects, costs, or statistics. If research is thin, say so.

RESEARCH NOTES:
${researchNotes || '(No live research available. You may refer only to well-known sector/geo patterns, clearly labeled as typical patterns, and must not invent named projects or fake costs.)'}

${factSheetContext(factSheet, stepId, stepTitle)}`;

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

    const text = response.choices[0]?.message?.content?.trim() ||
      'I can help improve this step using only the facts you have entered. What would you like to review?';

    return { response: text };
  }

  private static async researchSimilarProjects(
    factSheet: any,
    stepId: string,
    stepTitle: string
  ): Promise<string> {
    const compact = compactValue(factSheet) || {};
    const overview = compact.previousSteps?.businessOverview || compact.businessOverview || {};
    const sector = overview.industrySector || overview.subSector || 'MSME';
    const location = overview.location || compact.previousSteps?.projectAtGlance?.district || 'India';
    const projectName = overview.projectName || '';
    const query = `Similar real-world ${sector} MSME or industrial projects in ${location} (India). Patterns relevant to DPR step "${stepTitle}" (${stepId}): typical building/layout, machinery mix, working capital, utilities, or financing — not invented figures for "${projectName}". Cite public examples and sector practices.`;

    try {
      const notes = await Promise.race([
        this.tryWebSearch(query),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('research timeout')), 15000)
        ),
      ]);
      return notes || '';
    } catch (error: any) {
      console.warn('DPR builder research unavailable:', error?.message || error);
      return '';
    }
  }

  private static async tryWebSearch(query: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return '';

    const responsesAttempt = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: TEMPERATURE,
        tools: [{ type: 'web_search_preview' }],
        input: query,
      }),
    });

    if (responsesAttempt.ok) {
      const data: any = await responsesAttempt.json();
      const text = this.extractResponsesText(data);
      if (text) return text;
    } else {
      const errText = await responsesAttempt.text().catch(() => '');
      console.warn('OpenAI responses web_search failed:', responsesAttempt.status, errText.slice(0, 300));
    }

    const searchPreview = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-search-preview',
        messages: [
          {
            role: 'system',
            content:
              'Summarize similar real-world projects and sector/geo patterns. Do not invent statistics. Label uncertainty. Keep under 400 words.',
          },
          { role: 'user', content: query },
        ],
        temperature: TEMPERATURE,
      }),
    });

    if (searchPreview.ok) {
      const data: any = await searchPreview.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return String(text);
    } else {
      const errText = await searchPreview.text().catch(() => '');
      console.warn('OpenAI search-preview failed:', searchPreview.status, errText.slice(0, 300));
    }

    return '';
  }

  private static extractResponsesText(data: any): string {
    if (!data) return '';
    if (typeof data.output_text === 'string' && data.output_text.trim()) {
      return data.output_text.trim();
    }
    const parts: string[] = [];
    const output = Array.isArray(data.output) ? data.output : [];
    for (const item of output) {
      const content = item?.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (typeof c?.text === 'string') parts.push(c.text);
          else if (typeof c?.text?.value === 'string') parts.push(c.text.value);
        }
      }
    }
    return parts.join('\n').trim();
  }
}

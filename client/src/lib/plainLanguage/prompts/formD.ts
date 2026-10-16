export const PROMPTS: Record<string, { ask: string; help?: string; example?: string }> = {
  'District *': { ask: 'Which district is your unit in?', help: 'Pick your district first. The list of towns changes to match it.' },
  District: { ask: 'Which district is your unit in?', help: 'Pick your district first. The list of towns changes to match it.' },
};

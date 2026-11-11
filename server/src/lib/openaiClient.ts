import OpenAI from 'openai';
import { checkedBaseUrl, createGateway, gatewayConfig } from './aiGateway';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required.');
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: checkedBaseUrl(process.env.OPENAI_BASE_URL),
  organization: process.env.OPENAI_ORG_ID || undefined,
  project: process.env.OPENAI_PROJECT_ID || undefined,
  timeout: 120_000,
});

if (!gatewayConfig().zeroRetentionConfirmed) {
  console.warn('⚠️  OPENAI_ZDR_CONFIRMED is not "true": nobody has recorded that zero data retention is in force on the OpenAI account. See docs/ai-gateway.md.');
}

// Every call below goes through the gateway: one model, personal data removed, nothing stored, every call recorded.
export const openai = createGateway(client);

import { cfApi } from '../utils';
import { Env } from '../types';

export async function setupAIGateway(env: Env) {
  const accountId = env.CF_ACCOUNT_ID;
  const token = env.CF_API_TOKEN;

  const gateway = await cfApi(token, `/accounts/${accountId}/ai-gateway/gateways`, "POST", {
    id: "rj-supreme-gateway",
    name: "RJ Supreme AI Gateway",
    description: "Multi-provider AI routing with fallback",
    rate_limiting: { enabled: true, limit: 100, interval: 60 },
    cache: { enabled: true, ttl: 300 },
    log_requests: true,
  });

  return {
    gatewayId: gateway.result.id,
    usage: {
      openai: `https://gateway.ai.cloudflare.com/v1/${accountId}/rj-supreme-gateway/openai`,
      anthropic: `https://gateway.ai.cloudflare.com/v1/${accountId}/rj-supreme-gateway/anthropic`,
      workersAi: `https://gateway.ai.cloudflare.com/v1/${accountId}/rj-supreme-gateway/workers-ai`,
    },
  };
}

export async function aiWithFallback(env: Env, prompt: string, systemPrompt?: string) {
  const accountId = env.CF_ACCOUNT_ID;
  const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/rj-supreme-gateway`;

  // Fallback implementation logic (Simplified for Worker usage)
  const response = await fetch(gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([
      {
        provider: "openai",
        endpoint: "chat/completions",
        headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` }, // Use token or secret
        query: {
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }]
        }
      },
      {
        provider: "workers-ai",
        endpoint: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` },
        query: { messages: [{ role: "user", content: prompt }] }
      }
    ])
  });

  return response.json();
}

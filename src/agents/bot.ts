import { cfApi } from '../utils';
import { Env } from '../types';

export async function createTurnstileWidget(env: Env, config: { name: string, domains: string[] }) {
  const result = await cfApi(env.CF_API_TOKEN, `/accounts/${env.CF_ACCOUNT_ID}/challenges/widgets`, "POST", {
    name: config.name,
    domains: config.domains,
    mode: "managed",
    bot_fight_mode: true,
  });

  return {
    siteKey: result.result.sitekey,
    secretKey: result.result.secret,
    widgetId: result.result.id,
  };
}

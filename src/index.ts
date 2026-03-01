import { Hono } from 'hono';
import { Env } from './types';
import * as SecurityAgent from './agents/security';
import * as TunnelAgent from './agents/tunnel';
import * as AIAgent from './agents/ai';
import * as BrowserAgent from './agents/browser';
import * as EmailAgent from './agents/email';
import * as DataAgent from './agents/data';
import * as MonitorAgent from './agents/monitor';
import * as BotAgent from './agents/bot';

// Export Classes for CF Infrastructure
export { LiveDashboard } from './agents/realtime';

const app = new Hono<{ Bindings: Env }>();

// Auth Middleware
app.use('*', async (c, next) => {
  const secret = c.req.header('X-Admin-Secret');
  if (secret !== c.env.ADMIN_SECRET) return c.json({ error: 'Unauthorized' }, 401);
  await next();
});

app.get('/', (c) => c.text('RJ Business Solutions — Supreme Cloudflare One Agent ACTIVE.'));

// Elite API Routes
app.post('/api/security/audit', async (c) => c.json(await SecurityAgent.auditAndHardenSecurity(c.env)));

app.post('/api/tunnel/deploy', async (c) => {
  const { tunnelId, services } = await c.req.json();
  return c.json(await TunnelAgent.deployServiceMesh(c.env, tunnelId, services));
});

app.post('/api/ai/setup', async (c) => c.json(await AIAgent.setupAIGateway(c.env)));

app.post('/api/browser/screenshot', async (c) => {
  const { url } = await c.req.json();
  return c.json(await BrowserAgent.screenshotUrl(c.env, url));
});

app.post('/api/data/scaffold', async (c) => {
  const { projectName } = await c.req.json();
  return c.json(await DataAgent.scaffoldDataLayer(c.env, projectName));
});

app.post('/api/bot/setup', async (c) => {
  const config = await c.req.json();
  return c.json(await BotAgent.createTurnstileWidget(c.env, config));
});

export default {
  fetch: app.fetch,

  async scheduled(event: any, env: Env) {
    if (event.cron === "0 */4 * * *") await SecurityAgent.auditAndHardenSecurity(env);
    if (event.cron === "0 * * * *") {
        await MonitorAgent.checkUptime(env, { name: "Main Site", url: "https://rickjeffersonsolutions.com" });
    }
  },

  async email(message: any, env: Env) {
    await EmailAgent.handleInboundEmail(message, env);
  }
};

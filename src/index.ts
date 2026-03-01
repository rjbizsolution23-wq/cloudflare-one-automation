import { Hono } from 'hono';
import { CloudflareOneSetupAgent } from './cloudflare-one-setup-agent';

const app = new Hono<{
  Bindings: {
    CF_ACCOUNT_ID: string;
    CF_API_TOKEN: string;
    CF_ZONE_ID: string;
    CF_TEAM_NAME: string;
    ADMIN_SECRET: string;
  };
}>();

// Middleware for authentication
app.use('*', async (c, next) => {
  const secret = c.req.header('X-Admin-Secret');
  if (secret !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

app.get('/', (c) => c.text('Cloudflare One Automation Agent remains active.'));

app.post('/api/cloudflare-one/setup', async (c) => {
  const agent = new CloudflareOneSetupAgent(c.env);
  try {
    const results = await agent.runFullSetup();
    return c.json({ status: 'success', results });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

app.post('/api/cloudflare-one/policies', async (c) => {
  const agent = new CloudflareOneSetupAgent(c.env);
  try {
    const results = await agent.setupGatewayPolicies();
    return c.json({ status: 'success', results });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

export default app;

import { cfApi } from '../utils';
import { Env, ServiceConfig } from '../types';

export async function deployService(env: Env, tunnelId: string, service: ServiceConfig) {
  const accountId = env.CF_ACCOUNT_ID;
  const zoneId = env.CF_ZONE_ID;
  const token = env.CF_API_TOKEN;
  const domain = "rickjeffersonsolutions.com";
  const hostname = `${service.subdomain}.${domain}`;

  // 1. Get current tunnel config
  const currentConfig = await cfApi(token, `/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`, "GET");

  // 2. Add new ingress rule (before the catch-all)
  const existingIngress = currentConfig.result.config.ingress || [];
  const catchAll = existingIngress.pop() || { service: "http_status:404" };
  
  existingIngress.push({
    hostname,
    service: `${service.protocol}://localhost:${service.localPort}`,
  });
  existingIngress.push(catchAll); // re-add catch-all

  await cfApi(token, `/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`, "PUT", {
    config: { ingress: existingIngress }
  });

  // 3. Create DNS CNAME record
  await cfApi(token, `/zones/${zoneId}/dns_records`, "POST", {
    type: "CNAME",
    proxied: true,
    name: service.subdomain,
    content: `${tunnelId}.cfargotunnel.com`,
  });

  // 4. Optionally gate with Access
  let accessApp = null;
  if (service.requireAuth && service.allowedEmails?.length) {
    const app = await cfApi(token, `/accounts/${accountId}/access/apps`, "POST", {
      name: `RJ-${service.subdomain}`,
      domain: hostname,
      type: "self_hosted",
      session_duration: service.sessionDuration || "24h",
      auto_redirect_to_identity: true,
    });

    await cfApi(token, `/accounts/${accountId}/access/apps/${app.result.id}/policies`, "POST", {
      name: `Allow-${service.subdomain}`,
      decision: "allow",
      include: [{ email: { email: service.allowedEmails } }],
      precedence: 1,
    });

    accessApp = { id: app.result.id, aud: app.result.aud };
  }

  // 5. Log to D1
  await env.DB.prepare(
    "INSERT INTO deployed_services (subdomain, port, protocol, has_auth, tunnel_id, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
  ).bind(service.subdomain, service.localPort, service.protocol, service.requireAuth ? 1 : 0, tunnelId).run();

  return {
    url: `https://${hostname}`,
    tunnel: tunnelId,
    dns: "CNAME created",
    access: accessApp ? "Protected" : "Public",
  };
}

export async function deployServiceMesh(env: Env, tunnelId: string, services: ServiceConfig[]) {
  const results = [];
  for (const s of services) {
    results.push(await deployService(env, tunnelId, s));
  }
  return results;
}

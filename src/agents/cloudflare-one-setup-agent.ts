import { cfApi } from '../utils';
import { Env } from '../types';

export class CloudflareOneSetupAgent {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async runFullSetup() {
    return {
      policies: await this.setupGatewayPolicies(),
      tunnel: await this.provisionInitialTunnel(),
    };
  }

  async setupGatewayPolicies() {
    const accountId = this.env.CF_ACCOUNT_ID;
    const policies = [
      {
        name: "Block Security Threats",
        description: "Block high-risk security categories",
        enabled: true,
        action: "block",
        filters: ["dns"],
        traffic: "any(dns.security_category[*] in {82, 17, 107, 12, 114})",
        rule_settings: { block_page_enabled: true }
      }
    ];

    const results = [];
    for (const policy of policies) {
      const res = await cfApi(this.env.CF_API_TOKEN, `/accounts/${accountId}/gateway/rules`, 'POST', policy);
      results.push(res.result);
    }
    return results;
  }

  async provisionInitialTunnel() {
    const accountId = this.env.CF_ACCOUNT_ID;
    const tunnelName = `RJ-Automation-Tunnel-${Date.now()}`;
    
    // 1. Create Tunnel
    const tunnel = await cfApi(this.env.CF_API_TOKEN, `/accounts/${accountId}/cfd_tunnel`, 'POST', { name: tunnelName, config_src: "cloudflare" });

    const tunnelId = tunnel.result.id;
    const tunnelToken = tunnel.result.token;

    // 2. Configure Ingress
    await cfApi(this.env.CF_API_TOKEN, `/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`, 'PUT', {
      config: {
        ingress: [
          { hostname: `secure.${this.env.CF_TEAM_NAME}.cloudflareaccess.com`, service: "http://localhost:8080" },
          { service: "http_status:404" }
        ]
      }
    });

    return { tunnelId, tunnelName, tunnelToken };
  }
}

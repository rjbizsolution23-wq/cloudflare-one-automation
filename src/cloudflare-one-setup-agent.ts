export class CloudflareOneSetupAgent {
  private config: {
    CF_ACCOUNT_ID: string;
    CF_API_TOKEN: string;
    CF_ZONE_ID: string;
    CF_TEAM_NAME: string;
  };

  private baseUrl = 'https://api.cloudflare.com/client/v4';

  constructor(config: {
    CF_ACCOUNT_ID: string;
    CF_API_TOKEN: string;
    CF_ZONE_ID: string;
    CF_TEAM_NAME: string;
  }) {
    this.config = config;
  }

  private async cfFetch(endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json() as any;
    if (!response.ok) {
      throw new Error(`CF API Error: ${data.errors?.[0]?.message || response.statusText}`);
    }
    return data;
  }

  async runFullSetup() {
    return {
      policies: await this.setupGatewayPolicies(),
      tunnel: await this.provisionTunnel(),
      access: await this.setupAccessApplication(),
      warp: await this.configureWarp(),
    };
  }

  async setupGatewayPolicies() {
    const accountId = this.config.CF_ACCOUNT_ID;
    const policies = [
      {
        name: "Block Security Threats",
        description: "Block high-risk security categories",
        enabled: true,
        action: "block",
        filters: ["dns"],
        traffic: "any(dns.security_category[*] in {82, 17, 107, 12, 114})",
        rule_settings: { block_page_enabled: true }
      },
      {
        name: "Allow Corporate Domains",
        description: "Always allow rickjefferson.com",
        enabled: true,
        action: "allow",
        filters: ["dns"],
        traffic: "any(dns.domains_names[*] == \"rickjefferson.com\")",
        precedence: 1
      }
    ];

    const results = [];
    for (const policy of policies) {
      const res = await this.cfFetch(`/accounts/${accountId}/gateway/rules`, {
        method: 'POST',
        body: JSON.stringify(policy)
      });
      results.push(res.result);
    }
    return results;
  }

  async provisionTunnel() {
    const accountId = this.config.CF_ACCOUNT_ID;
    const tunnelName = `RJ-Automation-Tunnel-${Date.now()}`;
    
    // 1. Create Tunnel
    const tunnel = await this.cfFetch(`/accounts/${accountId}/cfd_tunnel`, {
      method: 'POST',
      body: JSON.stringify({ name: tunnelName, config_src: "cloudflare" })
    });

    const tunnelId = tunnel.result.id;
    const tunnelToken = tunnel.result.token;

    // 2. Configure Tunnel Ingress
    await this.cfFetch(`/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`, {
      method: 'PUT',
      body: JSON.stringify({
        config: {
          ingress: [
            { hostname: `secure.${this.config.CF_TEAM_NAME}.cloudflareaccess.com`, service: "http://localhost:8080" },
            { service: "http_status:404" }
          ]
        }
      })
    });

    return { tunnelId, tunnelName, tunnelToken, installCommand: `cloudflared service install ${tunnelToken}` };
  }

  async setupAccessApplication() {
    const accountId = this.config.CF_ACCOUNT_ID;
    const app = await this.cfFetch(`/accounts/${accountId}/access/apps`, {
      method: 'POST',
      body: JSON.stringify({
        name: "RJ-Supreme-Admin-Dashboard",
        domain: `secure-admin.${this.config.CF_TEAM_NAME}.cloudflareaccess.com`,
        type: "self_hosted",
        session_duration: "24h"
      })
    });

    const appId = app.result.id;

    // Add Policy
    await this.cfFetch(`/accounts/${accountId}/access/apps/${appId}/policies`, {
      method: 'POST',
      body: JSON.stringify({
        name: "Admin Enrollment",
        decision: "allow",
        include: [{ email_domain: { domain: "rickjefferson.com" } }],
      })
    });

    return app.result;
  }

  async configureWarp() {
    const accountId = this.config.CF_ACCOUNT_ID;

    // 1. Device Enrollment Permissions
    await this.cfFetch(`/accounts/${accountId}/access/organizations/revoke_all_tokens`, { method: 'POST' }); // Ensure fresh
    
    // 2. Split Tunnel configuration
    await this.cfFetch(`/accounts/${accountId}/devices/policy/exclude`, {
      method: 'POST',
      body: JSON.stringify({
        address: "192.168.1.0/24",
        description: "Exclude local home network"
      })
    });

    return { status: "WARP Configured" };
  }
}

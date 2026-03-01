import { cfApi } from '../utils';
import { Env } from '../types';

export async function auditAndHardenSecurity(env: Env) {
  const accountId = env.CF_ACCOUNT_ID;
  const token = env.CF_API_TOKEN;

  // 1. Pull current Gateway policies
  const currentPolicies = await cfApi(token, `/accounts/${accountId}/gateway/rules`, "GET");

  // 2. Pull the latest category list from Cloudflare
  const categories = await cfApi(token, `/accounts/${accountId}/gateway/categories`, "GET");

  // 3. Find all security threat subcategories
  const securityThreats = categories.result.find((c: any) => c.name === "Security threats");
  if (!securityThreats) return { status: "No security threats found" };

  const allThreatIds = securityThreats.subcategories.map((s: any) => s.id);

  // 4. Check which threat IDs are already blocked
  const blockedIds = new Set<number>();
  for (const policy of currentPolicies.result) {
    const match = policy.traffic?.match(/\{([0-9\s,]+)\}/);
    if (match) {
      match[1].split(/[\s,]+/).forEach((id: string) => {
        const parsed = parseInt(id);
        if (!isNaN(parsed)) blockedIds.add(parsed);
      });
    }
  }

  // 5. Find missing threat categories
  const missingIds = allThreatIds.filter((id: number) => !blockedIds.has(id));

  // 6. Auto-create policies for new threats
  if (missingIds.length > 0) {
    await cfApi(token, `/accounts/${accountId}/gateway/rules`, "POST", {
      name: `RJ-Auto-Block-New-Threats-${Date.now()}`,
      description: `Auto-detected ${missingIds.length} new threat categories`,
      action: "block",
      enabled: true,
      filters: ["dns"],
      traffic: `any(dns.security_category[*] in {${missingIds.join(" ")}})`,
      precedence: 15,
    });

    // Log the action to D1
    await env.DB.prepare(
      "INSERT INTO security_audit_log (action, details, created_at) VALUES (?, ?, datetime('now'))"
    ).bind("auto-hardened", JSON.stringify({ newThreats: missingIds })).run();
  }

  return {
    policiesAudited: currentPolicies.result.length,
    newThreatsBlocked: missingIds.length,
    timestamp: new Date().toISOString(),
  };
}

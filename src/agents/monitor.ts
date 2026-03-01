import { Env } from '../types';

export async function checkUptime(env: Env, service: { name: string, url: string }) {
  const start = Date.now();
  try {
    const res = await fetch(service.url, { method: "GET" });
    const latency = Date.now() - start;
    await env.DB.prepare(
      "INSERT INTO uptime_checks (service_name, url, status_code, latency_ms, checked_at) VALUES (?, ?, ?, ?, datetime('now'))"
    ).bind(service.name, service.url, res.status, latency).run();
    return { name: service.name, status: res.status, latency };
  } catch (err) {
    await env.DB.prepare(
      "INSERT INTO uptime_checks (service_name, url, status_code, error, checked_at) VALUES (?, ?, 0, ?, datetime('now'))"
    ).bind(service.name, service.url, String(err)).run();
    return { name: service.name, error: String(err) };
  }
}

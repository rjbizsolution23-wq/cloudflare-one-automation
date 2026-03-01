import { Env } from '../types';

export async function handleInboundEmail(message: any, env: Env) {
  const from = message.from;
  const to = message.to;
  const subject = message.headers.get("subject") || "";
  const rawEmail = await new Response(message.raw).text();

  // 1. Log to D1
  await env.DB.prepare(
    "INSERT INTO inbound_emails (sender, recipient, subject, body, received_at) VALUES (?, ?, ?, ?, datetime('now'))"
  ).bind(from, to, subject, rawEmail).run();

  // 2. Simple Routing
  if (to.includes("leads")) {
    await env.DB.prepare("INSERT INTO leads (email, source, created_at) VALUES (?, 'email', datetime('now'))").bind(from).run();
  } else {
    // Forward default
    await message.forward("rickjefferson@rickjeffersonsolutions.com");
  }
}

import { Env } from '../types';

export async function screenshotUrl(env: Env, url: string, options?: any) {
  const browser = await env.BROWSER.fetch(`https://production.browser-rendering.workers.dev`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      screenshotOptions: { fullPage: options?.fullPage ?? true, type: "png" },
      viewport: { width: options?.width ?? 1920, height: options?.height ?? 1080 },
      wait_until: "networkidle0",
    }),
  });

  const imageBuffer = await browser.arrayBuffer();
  const key = `screenshots/${Date.now()}-${url.replace(/[^a-z0-9]/gi, "-")}.png`;
  await env.STORAGE.put(key, imageBuffer, { httpMetadata: { contentType: "image/png" } });

  return { key, size: imageBuffer.byteLength };
}

export async function htmlToPdf(env: Env, html: string, filename: string) {
  const browser = await env.BROWSER.fetch(`https://production.browser-rendering.workers.dev`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      html,
      pdfOptions: { format: "A4", printBackground: true }
    }),
  });

  const pdfBuffer = await browser.arrayBuffer();
  const key = `pdfs/${filename}-${Date.now()}.pdf`;
  await env.STORAGE.put(key, pdfBuffer, { httpMetadata: { contentType: "application/pdf" } });

  return { key, size: pdfBuffer.byteLength };
}

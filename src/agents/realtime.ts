import { Env } from '../types';

export class LiveDashboard {
  state: any;
  env: Env;

  constructor(state: any, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      (server as any).accept();
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response("Durable Object Live Dashboard");
  }
}

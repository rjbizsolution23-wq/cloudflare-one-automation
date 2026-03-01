export interface Env {
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
  CF_ZONE_ID: string;
  CF_TEAM_NAME: string;
  ADMIN_SECRET: string;
  DB: D1Database;
  STORAGE: R2Bucket;
  CONFIG: KVNamespace;
  AI: any;
  BROWSER: any;
  VECTORS: any;
  JOBS: Queue;
}

export interface ServiceConfig {
  subdomain: string;
  localPort: number;
  protocol: 'http' | 'https';
  requireAuth: boolean;
  allowedEmails?: string[];
  sessionDuration?: string;
}

import { cfApi } from '../utils';
import { Env } from '../types';

export async function scaffoldDataLayer(env: Env, projectName: string) {
  const accountId = env.CF_ACCOUNT_ID;
  const token = env.CF_API_TOKEN;

  // 1. Create D1
  const db = await cfApi(token, `/accounts/${accountId}/d1/database`, "POST", { name: `${projectName}-db` });

  // 2. Create R2
  const bucket = await cfApi(token, `/accounts/${accountId}/r2/buckets`, "POST", { name: `${projectName}-storage` });

  // 3. Create KV
  const kv = await cfApi(token, `/accounts/${accountId}/storage/kv/namespaces`, "POST", { title: `${projectName}-config` });

  return {
    d1: { id: db.result.uuid, name: db.result.name },
    r2: { name: bucket.result.name },
    kv: { id: kv.result.id, title: kv.result.title },
  };
}

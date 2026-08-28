import { timingSafeEqual } from 'node:crypto';

export function internalBearerMatches(req, envName = 'IWW_NOTIFICATION_WORKER_SECRET') {
  const configured = process.env[envName];
  const authorization = req?.headers?.authorization;
  if (!configured || typeof authorization !== 'string') return false;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  const expected = Buffer.from(configured);
  const supplied = Buffer.from(match[1]);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

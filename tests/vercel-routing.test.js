import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

describe('Vercel API routing', () => {
  it('forwards protected API paths to the Express function before the SPA rewrite', () => {
    expect(config.rewrites[0]).toEqual({ source: '/api/v1/:path*', destination: '/api' });
    expect(config.rewrites[1].source).toContain('?!api');
  });
});

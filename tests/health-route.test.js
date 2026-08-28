import { describe, expect, it, vi } from 'vitest';
import health from '../api/health.js';

describe('Vercel health route', () => {
  it('reports the isolated IWW service and project', () => {
    const json = vi.fn();
    const response = { setHeader: vi.fn(), status: vi.fn(() => ({ json })) };
    health({}, response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control','no-store');
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ status:'ok', service:'iww-api', project:'fepfnzrpftxpxlgyujev' }));
  });
});

import { describe, expect, it } from 'vitest';
import { inquirySchema, parseBody } from '../services/api/src/validation.js';

describe('API input validation', () => {
  it('rejects invalid public inquiry input', () => {
    const parsed = parseBody(inquirySchema,{email:'not-an-email',message:''});
    expect(parsed.ok).toBe(false);
  });
  it('accepts bounded valid inquiry input', () => {
    const parsed = parseBody(inquirySchema,{fullName:'IWW Member',email:'member@example.com',message:'Please contact me.'});
    expect(parsed.ok).toBe(true);
  });
});

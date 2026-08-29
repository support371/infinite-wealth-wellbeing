import { describe, expect, it } from 'vitest';
import { transitionOptions } from '../src/app/AppointmentsPage.jsx';

const appointment = { status: 'requested', member_id: 'member-1', host_id: 'host-1' };

describe('appointment status workflow', () => {
  it('allows organization operators to confirm or cancel a request', () => {
    expect(transitionOptions(appointment, { role: 'owner', user: { id: 'owner-1' } })).toEqual(['confirmed','cancelled']);
  });

  it('allows the assigned host to manage the session', () => {
    expect(transitionOptions(appointment, { role: 'advisor', user: { id: 'host-1' } })).toEqual(['confirmed','cancelled']);
  });

  it('limits the member to cancelling their own request', () => {
    expect(transitionOptions(appointment, { role: 'member', user: { id: 'member-1' } })).toEqual(['cancelled']);
    expect(transitionOptions(appointment, { role: 'member', user: { id: 'member-2' } })).toEqual([]);
  });
});

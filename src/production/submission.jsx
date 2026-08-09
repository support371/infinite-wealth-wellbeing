import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './submission.css';

const CONTACT_SUBJECTS = [
  'General Inquiry',
  'Wealth Education',
  'Membership Questions',
  'Prayer Request',
  'Well-being Service Information',
  'Ministry Partnership',
  'Retreat Information',
  'Donation Enquiry',
  'Technical Support',
];

const MEMBERSHIP_TIERS = ['Explorer', 'Member', 'Guardian'];
const MEMBERSHIP_INTERESTS = [
  'Wealth & Financial Education',
  'Holistic Well-being Information',
  'Spiritual Well-being & Ministry',
  'Community & Connection',
  'All of the Above',
];

function createIdempotencyKey(flow) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${flow}-${crypto.randomUUID()}`;
  }
  return `${flow}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function submitJson(endpoint, payload, flow) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': createIdempotencyKey(flow),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'The request could not be completed. Please review the form and try again.');
    error.fields = data.fields || {};
    throw error;
  }
  return data;
}

function FieldError({ name, errors }) {
  if (!errors?.[name]) return null;
  return <small className="submission-field-error">Please review this field.</small>;
}

function StatusMessage({ status }) {
  if (!status.message) return null;
  return (
    <div className={`submission-status submission-status-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'} aria-live="polite">
      {status.message}
    </div>
  );
}

function Shell({ eyebrow, title, intro, children }) {
  return (
    <main className="submission-shell">
      <a className="submission-brand" href="/" aria-label="Infinite Wealth and Well-being home">
        <span className="submission-mark">IW</span>
        <span><strong>Infinite Wealth</strong><small>&amp; Well-being</small></span>
      </a>
      <section className="submission-layout">
        <aside className="submission-intro">
          <span className="submission-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <div className="submission-safety-note">
            <strong>Keep sensitive information out of this form.</strong>
            <span>Do not submit passwords, account credentials, payment-card details, Social Security numbers, medical records, or other highly sensitive data.</span>
          </div>
          <a className="submission-back" href="/">← Back to the main site</a>
        </aside>
        <section className="submission-card">{children}</section>
      </section>
    </main>
  );
}

function ContactForm() {
  const [status, setStatus] = useState({ type: 'idle', message: '', reference: '' });
  const [errors, setErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setStatus({ type: 'loading', message: 'Sending your message…', reference: '' });
    const form = new FormData(event.currentTarget);
    const payload = {
      firstName: form.get('firstName'),
      lastName: form.get('lastName'),
      email: form.get('email'),
      subject: form.get('subject'),
      message: form.get('message'),
      consent: form.get('consent') === 'yes',
      companyWebsite: form.get('companyWebsite'),
    };

    try {
      const result = await submitJson('/api/inquiries', payload, 'inquiry');
      event.currentTarget.reset();
      setStatus({
        type: 'success',
        message: `Your message was accepted. Reference: ${result.reference || 'recorded'}.`,
        reference: result.reference || '',
      });
    } catch (error) {
      setErrors(error.fields || {});
      setStatus({ type: 'error', message: error.message, reference: '' });
    }
  }

  return (
    <Shell
      eyebrow="Contact"
      title="Send one clear request."
      intro="Use this channel for general questions, membership information, prayer requests, well-being service information, ministry partnerships, retreat information, donation questions, or technical support."
    >
      <h2>Send a message</h2>
      <p className="submission-card-copy">Required fields are marked. A successful submission returns a reference you can keep.</p>
      <form className="submission-form" onSubmit={handleSubmit} noValidate>
        <div className="submission-honeypot" aria-hidden="true">
          <label>Company website<input name="companyWebsite" tabIndex="-1" autoComplete="off" /></label>
        </div>
        <div className="submission-row">
          <label>First name *<input name="firstName" autoComplete="given-name" maxLength="80" required /><FieldError name="firstName" errors={errors}/></label>
          <label>Last name *<input name="lastName" autoComplete="family-name" maxLength="80" required /><FieldError name="lastName" errors={errors}/></label>
        </div>
        <label>Email address *<input type="email" name="email" autoComplete="email" maxLength="254" required /><FieldError name="email" errors={errors}/></label>
        <label>Subject *
          <select name="subject" defaultValue="General Inquiry" required>
            {CONTACT_SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
          </select>
          <FieldError name="subject" errors={errors}/>
        </label>
        <label>Message *<textarea name="message" rows="7" minLength="10" maxLength="4000" required placeholder="Tell us what you need, without including sensitive account or health information." /><FieldError name="message" errors={errors}/></label>
        <label className="submission-consent"><input type="checkbox" name="consent" value="yes" required /><span>I consent to Infinite Wealth &amp; Well-being processing this submission and contacting me about this request.</span></label>
        <FieldError name="consent" errors={errors}/>
        <button className="submission-submit" type="submit" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Sending…' : 'Send message'}</button>
        <StatusMessage status={status}/>
      </form>
    </Shell>
  );
}

function MembershipForm() {
  const [status, setStatus] = useState({ type: 'idle', message: '', reference: '' });
  const [errors, setErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setStatus({ type: 'loading', message: 'Submitting your application…', reference: '' });
    const form = new FormData(event.currentTarget);
    const payload = {
      firstName: form.get('firstName'),
      lastName: form.get('lastName'),
      email: form.get('email'),
      tier: form.get('tier'),
      interest: form.get('interest'),
      introduction: form.get('introduction'),
      consent: form.get('consent') === 'yes',
      companyWebsite: form.get('companyWebsite'),
    };

    try {
      const result = await submitJson('/api/membership-applications', payload, 'membership');
      event.currentTarget.reset();
      setStatus({
        type: 'success',
        message: `Your application was accepted. Reference: ${result.reference || 'recorded'}. No paid membership is activated by this form.`,
        reference: result.reference || '',
      });
    } catch (error) {
      setErrors(error.fields || {});
      setStatus({ type: 'error', message: error.message, reference: '' });
    }
  }

  return (
    <Shell
      eyebrow="Membership application"
      title="Apply without pretending checkout is finished."
      intro="This application records your interest and requested tier. It does not charge a card, activate a paid subscription, or guarantee acceptance. Those steps remain separate until the platform's verified payment and membership provisioning systems are connected."
    >
      <h2>Membership application</h2>
      <p className="submission-card-copy">Choose the tier you are interested in. No payment information is collected here.</p>
      <form className="submission-form" onSubmit={handleSubmit} noValidate>
        <div className="submission-honeypot" aria-hidden="true">
          <label>Company website<input name="companyWebsite" tabIndex="-1" autoComplete="off" /></label>
        </div>
        <div className="submission-row">
          <label>First name *<input name="firstName" autoComplete="given-name" maxLength="80" required /><FieldError name="firstName" errors={errors}/></label>
          <label>Last name *<input name="lastName" autoComplete="family-name" maxLength="80" required /><FieldError name="lastName" errors={errors}/></label>
        </div>
        <label>Email address *<input type="email" name="email" autoComplete="email" maxLength="254" required /><FieldError name="email" errors={errors}/></label>
        <label>Requested tier *
          <select name="tier" defaultValue="Explorer" required>
            {MEMBERSHIP_TIERS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
          </select>
          <FieldError name="tier" errors={errors}/>
        </label>
        <label>Primary interest *
          <select name="interest" defaultValue="Wealth & Financial Education" required>
            {MEMBERSHIP_INTERESTS.map((interest) => <option key={interest} value={interest}>{interest}</option>)}
          </select>
          <FieldError name="interest" errors={errors}/>
        </label>
        <label>What brings you here? <textarea name="introduction" rows="6" maxLength="3000" placeholder="Optional. If you write something, please use at least a full sentence and avoid sensitive information." /><FieldError name="introduction" errors={errors}/></label>
        <label className="submission-consent"><input type="checkbox" name="consent" value="yes" required /><span>I consent to Infinite Wealth &amp; Well-being processing this application and contacting me about membership.</span></label>
        <FieldError name="consent" errors={errors}/>
        <button className="submission-submit" type="submit" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Submitting…' : 'Submit application'}</button>
        <StatusMessage status={status}/>
      </form>
    </Shell>
  );
}

const flow = document.body.dataset.flow;
createRoot(document.getElementById('root')).render(flow === 'membership' ? <MembershipForm/> : <ContactForm/>);

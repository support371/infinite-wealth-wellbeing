# API and Webhook Readiness

## Safe route labels

- GET /api/services
- POST /api/inquiries
- POST /api/membership/applications
- POST /api/practitioners/applications
- POST /api/compliance/records
- POST /webhooks/form-submitted
- POST /webhooks/donation-completed
- POST /webhooks/policy-approved

## Security

API keys and secrets must be configured in protected runtime environment variables. They must never be committed to GitHub or displayed in client bundles.

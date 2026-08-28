-- Separate IWW platform authority from client-organization ownership and
-- provide a shared 300+ application catalog with organization-scoped requests.

create table public.platform_staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('platform_owner','platform_admin','platform_support','platform_auditor')),
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integration_catalog (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique check (provider_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  display_name text not null,
  category text not null,
  description text,
  auth_strategy text not null default 'oauth2' check (auth_strategy in ('oauth2','api_key','webhook','service_account','native')),
  availability text not null default 'requestable' check (availability in ('native','requestable','private_preview')),
  status text not null default 'active' check (status in ('active','disabled','retired')),
  documentation_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index integration_catalog_category_idx on public.integration_catalog(category, display_name) where status = 'active';

create or replace function private.has_platform_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_staff staff
    where staff.user_id = (select auth.uid())
      and staff.status = 'active'
      and staff.role = any(required_roles)
  );
$$;
revoke all on function private.has_platform_role(text[]) from public, anon;
grant execute on function private.has_platform_role(text[]) to authenticated;

alter table public.platform_staff enable row level security;
alter table public.platform_staff force row level security;
alter table public.integration_catalog enable row level security;
alter table public.integration_catalog force row level security;

create policy platform_staff_select on public.platform_staff for select to authenticated using (
  user_id = (select auth.uid()) or private.has_platform_role(array['platform_owner','platform_admin'])
);
create policy platform_staff_insert on public.platform_staff for insert to authenticated with check (
  private.has_platform_role(array['platform_owner'])
);
create policy platform_staff_update on public.platform_staff for update to authenticated using (
  private.has_platform_role(array['platform_owner'])
) with check (private.has_platform_role(array['platform_owner']));
create policy platform_staff_delete on public.platform_staff for delete to authenticated using (
  private.has_platform_role(array['platform_owner'])
);

create policy integration_catalog_select on public.integration_catalog for select to authenticated using (status = 'active');
create policy integration_catalog_insert on public.integration_catalog for insert to authenticated with check (
  private.has_platform_role(array['platform_owner','platform_admin'])
);
create policy integration_catalog_update on public.integration_catalog for update to authenticated using (
  private.has_platform_role(array['platform_owner','platform_admin'])
) with check (private.has_platform_role(array['platform_owner','platform_admin']));

create policy organizations_platform_select on public.organizations for select to authenticated using (
  private.has_platform_role(array['platform_owner','platform_admin','platform_support','platform_auditor'])
);

create or replace function private.platform_organization_summary()
returns table (
  organization_id uuid,
  name text,
  slug text,
  status text,
  active_members bigint,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_platform_role(array['platform_owner','platform_admin','platform_support','platform_auditor']) then
    raise exception 'Platform authority is required' using errcode = '42501';
  end if;
  return query
    select organization.id, organization.name, organization.slug, organization.status,
      count(membership.id) filter (where membership.status = 'active'), organization.created_at
    from public.organizations organization
    left join public.memberships membership on membership.organization_id = organization.id
    group by organization.id
    order by organization.created_at desc;
end;
$$;
revoke all on function private.platform_organization_summary() from public, anon;
grant execute on function private.platform_organization_summary() to authenticated;

create or replace function public.platform_organization_summary()
returns table (
  organization_id uuid,
  name text,
  slug text,
  status text,
  active_members bigint,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$ select * from private.platform_organization_summary(); $$;
revoke all on function public.platform_organization_summary() from public, anon;
grant execute on function public.platform_organization_summary() to authenticated;

insert into public.integration_catalog (provider_key, display_name, category, description, auth_strategy, availability)
values
  ('stripe','Stripe','Finance','Subscription and billing reference workflows.','oauth2','native'),
  ('google_calendar','Google Calendar','Productivity','Consent-based appointment calendar synchronization.','oauth2','native'),
  ('microsoft_calendar','Microsoft Outlook Calendar','Productivity','Consent-based Microsoft calendar synchronization.','oauth2','native'),
  ('hubspot','HubSpot','CRM & Sales','Organization-authorized CRM workflows.','oauth2','native'),
  ('email','IWW Email Service','Communication','Server-side transactional email delivery.','native','native'),
  ('ai','IWW AI Gateway','AI & Automation','Policy-limited navigation, reflection, discovery and drafting.','native','native');

with catalog_seed(category, apps) as (
  values
  ('Productivity', array['Google Workspace','Microsoft 365','Slack','Microsoft Teams','Zoom','Notion','Airtable','Asana','Trello','monday.com','ClickUp','Jira','Confluence','Dropbox','Box','OneDrive','Google Drive','Calendly','Todoist','Evernote','Miro','Figma','Lucidchart','Smartsheet','Coda']),
  ('CRM & Sales', array['Salesforce','Pipedrive','Zoho CRM','Microsoft Dynamics 365','Freshsales','Copper','Close','Insightly','Keap','Nimble','SugarCRM','Zendesk Sell','Apollo','Outreach','Salesloft','Gong','Clari','Chili Piper','PandaDoc','DocuSign','Proposify','Qwilr','Lemlist','Reply.io','LeadSquared']),
  ('Marketing', array['Mailchimp','Klaviyo','ActiveCampaign','Campaign Monitor','Constant Contact','Brevo','SendGrid','Kit','Drip','Adobe Marketo Engage','Salesforce Marketing Cloud','Intercom','Drift','Hootsuite','Buffer','Sprout Social','Later','Typeform','Jotform','SurveyMonkey','Unbounce','Webflow','WordPress','Ghost','Beehiiv']),
  ('Finance', array['PayPal','Square','QuickBooks Online','Xero','FreshBooks','Wave Accounting','Sage Intacct','Oracle NetSuite','Chargebee','Recurly','Paddle','Braintree','Adyen','Plaid','Wise','Ramp','Brex','Expensify','BILL','Deel','Gusto','Carta','Airwallex','GoCardless','Mercury']),
  ('Developer Tools', array['GitHub','GitLab','Bitbucket','Vercel','Netlify','Cloudflare','Amazon Web Services','Microsoft Azure','Google Cloud','DigitalOcean','Heroku','Render','Railway','Docker Hub','Sentry','Datadog','New Relic','PagerDuty','Opsgenie','CircleCI','Travis CI','Jenkins','Linear','Postman','Supabase']),
  ('Data & Analytics', array['Snowflake','Google BigQuery','Amazon Redshift','Databricks','PostgreSQL','MySQL','MongoDB Atlas','Redis Cloud','Elasticsearch','Twilio Segment','RudderStack','Fivetran','Airbyte','dbt Cloud','Looker','Tableau','Power BI','Metabase','Mixpanel','Amplitude','Heap','Hotjar','FullStory','PostHog','Grafana Cloud']),
  ('Communication', array['Gmail','Microsoft Outlook','Twilio','WhatsApp Business','Telegram','Discord','Facebook Messenger','Vonage','RingCentral','Dialpad','Aircall','OpenPhone','Front','Help Scout','Zendesk Support','Freshdesk','Crisp','Smartsupp','tawk.to','LiveChat','Google Meet','Cisco Webex','GoTo Meeting','Loom','Vimeo']),
  ('People & Learning', array['Workday','BambooHR','Rippling','Personio','HiBob','ADP','Paychex','Greenhouse','Lever','Ashby','Workable','JazzHR','Lattice','Culture Amp','15Five','Betterworks','Cornerstone OnDemand','TalentLMS','Docebo','LearnUpon','Trainual','When I Work','Deputy','Homebase','UKG']),
  ('Commerce', array['Shopify','WooCommerce','BigCommerce','Adobe Commerce','Squarespace Commerce','Wix Commerce','Etsy','eBay','Amazon Seller Central','Walmart Marketplace','ShipStation','Shippo','EasyPost','AfterShip','Gorgias','Recharge','Yotpo','Judge.me','Printful','Printify','Gelato','Faire','Lightspeed Retail','Clover','Toast']),
  ('Security & Identity', array['Okta','Auth0','Microsoft Entra ID','OneLogin','JumpCloud','Duo Security','1Password','LastPass','Bitwarden','Dashlane','CrowdStrike','SentinelOne','Microsoft Defender','Cloudflare Zero Trust','Zscaler','Palo Alto Cortex','Splunk','Sumo Logic','Rapid7','Tenable','Qualys','Wiz','Lacework','Drata','Vanta']),
  ('AI & Automation', array['OpenAI','Anthropic','Google Gemini','Microsoft Copilot','Hugging Face','Cohere','Mistral AI','Perplexity','Groq','Together AI','Replicate','Stability AI','ElevenLabs','Deepgram','AssemblyAI','Pinecone','Weaviate','Qdrant','LangSmith','Langfuse','Vercel AI Gateway','Amazon Bedrock','Azure AI Foundry','Vertex AI','IBM watsonx']),
  ('Customer Experience', array['Gainsight','ChurnZero','Totango','Planhat','Vitally','Custify','ClientSuccess','Catalyst','Userpilot','Pendo','Appcues','WalkMe','UserGuiding','Whatfix','Productboard','Canny','ProductPlan','Aha!','Delighted','AskNicely','Nicereply','Trustpilot','Atlassian Statuspage','Better Uptime','UptimeRobot'])
), expanded as (
  select category, app_name, ordinality
  from catalog_seed cross join lateral unnest(apps) with ordinality as app(app_name, ordinality)
)
insert into public.integration_catalog (provider_key, display_name, category, description, auth_strategy, availability)
select trim(both '_' from regexp_replace(lower(app_name), '[^a-z0-9]+', '_', 'g')),
  app_name, category,
  app_name || ' integration for organization-authorized IWW workflows.',
  case when category in ('Developer Tools','Data & Analytics') then 'api_key' else 'oauth2' end,
  'requestable'
from expanded
on conflict (provider_key) do nothing;

drop policy if exists integration_connections_select on public.integration_connections;
drop policy if exists integration_connections_insert on public.integration_connections;
drop policy if exists integration_connections_update on public.integration_connections;
drop policy if exists integration_connections_delete on public.integration_connections;
alter table public.integration_connections drop constraint if exists integration_connections_provider_check;
alter table public.integration_connections
  add constraint integration_connections_provider_catalog_fk foreign key (provider)
  references public.integration_catalog(provider_key) on update cascade;

create policy integration_connections_select on public.integration_connections for select to authenticated using (
  private.has_org_role(organization_id, array['owner','admin']::public.app_role[])
);
create policy integration_connections_insert on public.integration_connections for insert to authenticated with check (
  private.has_org_role(organization_id, array['owner','admin']::public.app_role[])
  and connected_by = (select auth.uid())
);
create policy integration_connections_update on public.integration_connections for update to authenticated using (
  private.has_org_role(organization_id, array['owner','admin']::public.app_role[])
) with check (private.has_org_role(organization_id, array['owner','admin']::public.app_role[]));
create policy integration_connections_delete on public.integration_connections for delete to authenticated using (
  private.has_org_role(organization_id, array['owner','admin']::public.app_role[])
);

create trigger set_platform_staff_updated_at before update on public.platform_staff
for each row execute function private.set_updated_at();
create trigger set_integration_catalog_updated_at before update on public.integration_catalog
for each row execute function private.set_updated_at();

comment on table public.platform_staff is 'Internal IWW SaaS operators; separate from client organization ownership.';
comment on table public.integration_catalog is 'Shared application directory. A catalog entry does not imply an active provider credential.';

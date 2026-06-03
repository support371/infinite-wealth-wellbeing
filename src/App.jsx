import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './styles.css';

const pages = {
  services: ['wealth-empowerment','holistic-health','happiness-community','coaching-mentoring','education-workshops','practitioner-supported-care'],
  membership: ['how-it-works','member-benefits','apply','trust-and-responsibilities'],
  practitioners: ['apply','standards','verification-process','profile-guidance'],
  programs: ['programs','events','learning-tracks','create-interest'],
  resources: ['articles','guides','media-library','policies'],
  donate: ['campaigns','stewardship','receipts-transparency'],
  trust: ['manifesto-governance','compliance-records','508-tax-exempt-reference','privacy-consent','grievance-support','audit-readiness'],
  platform: ['member-dashboard','practitioner-dashboard','admin-ops','super-admin','devops-readiness','api-webhooks']
};

function Shell({ children }) {
  return <><header className="nav"><Link className="brand" to="/">infinite Wealth & Well-being</Link><nav><Link to="/services">Services</Link><Link to="/membership">Membership</Link><Link to="/practitioners">Practitioners</Link><Link to="/trust-center">Trust Center</Link><Link to="/platform">Platform</Link></nav></header>{children}<footer className="footer">Trust-led. Compliance-aware. Built for member, practitioner and trustee governance.</footer></>;
}
function VideoBlock({title}){return <section className="video"><span>Video ready</span><h3>{title}</h3><p>Upload-ready responsive media block with title, description, accessibility caption, status label and CTA. No broken embed is displayed until a real source is configured.</p><button>Upload or connect media</button></section>}
function Card({title,children,to}){return <Link className="card" to={to||'#'}><h3>{title}</h3><p>{children}</p></Link>}
function Home(){return <Shell><main className="hero"><p className="eyebrow">Trustee-ready organizational platform</p><h1>infinite Wealth & Well-being</h1><p>A modern digital headquarters for wealth, health, happiness, membership, practitioners, compliance records, resources and community stewardship.</p><div className="actions"><Link to="/membership/apply">Join the community</Link><Link to="/trust-center">Review trust center</Link></div></main><section className="grid"><Card title="Services" to="/services">Structured service pathways with routed detail pages and inquiry workflow readiness.</Card><Card title="Membership" to="/membership">Member onboarding, responsibilities, benefits and application routing.</Card><Card title="Practitioners" to="/practitioners">Application, standards, profile guidance and verification process.</Card><Card title="Compliance Records" to="/trust-center/compliance-records">Setup-ready record modules for official governance and review documents.</Card></section><VideoBlock title="Leadership welcome and manifesto media" /></Shell>}
function Listing({title,items,prefix}){return <Shell><main className="page"><p className="eyebrow">Routed section</p><h1>{title}</h1><p>This page lists the operational subpages for {title}. Each route is ready for future API-backed data and human review workflows.</p><div className="grid">{items.map(i=><Card key={i} title={i.replaceAll('-',' ')} to={`${prefix}/${i}`}>Open the dedicated page for this function, including media blocks, workflow notes, forms and related links.</Card>)}</div></main></Shell>}
function Detail({kind}){return <Shell><main className="page"><p className="eyebrow">{kind}</p><h1>{location.pathname.split('/').filter(Boolean).pop()?.replaceAll('-',' ') || 'Page'}</h1><p>This routed page is built for detailed content, governance notes, media upload readiness, accessibility captions, inquiry CTAs and API workflow mapping.</p><section className="panel"><h2>Workflow readiness</h2><ul><li>GET catalog/detail route label ready</li><li>POST inquiry or application workflow ready</li><li>Webhook and audit event mapping documented</li><li>Secrets must remain in protected environment variables</li></ul></section><VideoBlock title="Page media and video module" /></main></Shell>}
function Trust(){return <Listing title="Trust Center" items={pages.trust} prefix="/trust-center"/>}
function Platform(){return <Listing title="Platform & Operations" items={pages.platform} prefix="/platform"/>}
function App(){return <BrowserRouter><Routes><Route path="/" element={<Home/>}/><Route path="/services" element={<Listing title="Services" items={pages.services} prefix="/services"/>}/><Route path="/membership" element={<Listing title="Membership" items={pages.membership} prefix="/membership"/>}/><Route path="/practitioners" element={<Listing title="Practitioners" items={pages.practitioners} prefix="/practitioners"/>}/><Route path="/programs-events" element={<Listing title="Programs & Events" items={pages.programs} prefix="/programs-events"/>}/><Route path="/resources" element={<Listing title="Resources" items={pages.resources} prefix="/resources"/>}/><Route path="/donate" element={<Listing title="Donate & Stewardship" items={pages.donate} prefix="/donate"/>}/><Route path="/trust-center" element={<Trust/>}/><Route path="/platform" element={<Platform/>}/><Route path="/*" element={<Detail kind="Subpage"/>}/></Routes></BrowserRouter>}

createRoot(document.getElementById('root')).render(<App/>);

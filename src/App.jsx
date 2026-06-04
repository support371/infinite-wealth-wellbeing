import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './styles.css';

const serviceCards = [
  ['Wealth Guidance', 'Education, planning conversations and empowerment resources for practical financial confidence.'],
  ['Well-being Support', 'Holistic support for body, mind and spirit through trusted community-centered pathways.'],
  ['Community Programs', 'Workshops, learning circles, events and member resources designed to build connection.']
];

function Shell({ children }) {
  return <>
    <header className="nav">
      <Link className="brand" to="/">infinite Wealth & Well-being</Link>
      <nav>
        <Link to="/about">About</Link>
        <Link to="/services">Services</Link>
        <Link to="/membership">Membership</Link>
        <Link to="/practitioners">Practitioners</Link>
        <Link to="/programs-events">Programs</Link>
        <Link to="/resources">Resources</Link>
        <Link to="/donate">Donate</Link>
        <Link to="/contact">Contact</Link>
      </nav>
    </header>
    {children}
    <footer className="footer">
      <div>
        <strong>infinite Wealth & Well-being</strong>
        <p>A sincere, trust-led community for whole-person growth, learning and service.</p>
      </div>
      <div className="footerLinks"><Link to="/trust">Trust & Policies</Link><Link to="/membership">Join</Link><Link to="/practitioners">Apply as Practitioner</Link></div>
    </footer>
  </>;
}

function ButtonRow(){return <div className="actions"><Link to="/membership">Join the community</Link><Link className="secondary" to="/services">Explore services</Link></div>}
function MediaBlock({title}){return <section className="media"><span>Media area</span><h3>{title}</h3><p>This section is ready for a real image or video when the organization provides approved media.</p></section>}
function Card({title,children,to}){return <Link className="card" to={to || '#'}><h3>{title}</h3><p>{children}</p></Link>}

function Home(){return <Shell>
  <main className="hero cleanHero">
    <p className="eyebrow">A mission-led organization</p>
    <h1>infinite Wealth & Well-being</h1>
    <p>A trusted community for whole-person growth, compassionate service, practical learning and support across wealth, health and well-being.</p>
    <ButtonRow />
  </main>
  <section className="intro"><p>We help people find clearer pathways to support, learning, community connection and responsible guidance while keeping trust, dignity and transparency at the center.</p></section>
  <section className="section"><p className="eyebrow">Our pillars</p><h2>Built around wealth, health and well-being.</h2><div className="grid">{serviceCards.map(([title,body])=><Card key={title} title={title} to="/services">{body}</Card>)}</div></section>
  <section className="split"><div><p className="eyebrow">Membership</p><h2>Join a community designed for growth and support.</h2><p>Members can explore resources, attend programs, submit inquiries and participate in a guided well-being journey.</p><Link className="textLink" to="/membership">See membership pathway</Link></div><MediaBlock title="Membership explainer" /></section>
  <section className="split reverse"><MediaBlock title="Practitioner standards story" /><div><p className="eyebrow">Practitioners</p><h2>A values-led pathway for approved practitioners.</h2><p>Practitioners can apply to join the network, align with standards and serve members through approved offerings.</p><Link className="textLink" to="/practitioners">Learn about practitioner pathway</Link></div></section>
  <section className="trustBand"><p className="eyebrow">Trust</p><h2>Governance and care without overwhelming the visitor.</h2><p>Policies, consent, privacy, community standards and trustee stewardship are kept clear and accessible in the Trust area.</p><Link to="/trust">Review trust & policies</Link></section>
</Shell>}

function About(){return <SimplePage title="About Our Purpose" kicker="Who we are" copy="Infinite Wealth & Well-being exists to create a thoughtful community space for growth, support, learning and service. The organization is designed around respect, dignity, practical guidance and whole-person well-being." />}
function Services(){return <Shell><main className="page"><p className="eyebrow">What we offer</p><h1>Services</h1><p>Services are organized as clear pathways, not confusing technical systems. Each pathway can later connect to booking, intake and approved practitioner workflows.</p><div className="grid">{serviceCards.map(([title,body])=><Card key={title} title={title}>{body}</Card>)}</div><MediaBlock title="Service introduction media" /></main></Shell>}
function Membership(){return <SimplePage title="Membership" kicker="Join the community" copy="Membership gives people a guided way to engage with resources, programs, events and support. The application process should remain simple, respectful and transparent." />}
function Practitioners(){return <SimplePage title="Practitioners" kicker="Apply to serve" copy="The practitioner pathway explains how approved providers can align with standards, submit information for review and participate in a trustworthy community model." />}
function Programs(){return <SimplePage title="Programs & Events" kicker="Learn and connect" copy="Programs, workshops and events give the organization a practical way to build community, share knowledge and support well-being journeys." />}
function Resources(){return <SimplePage title="Resources" kicker="Learning hub" copy="Resources should include articles, guides, media and policy explainers that help visitors understand the mission and take the next step." />}
function Donate(){return <SimplePage title="Donate & Support" kicker="Stewardship" copy="Donation messaging should be transparent, mission-led and clear about how support helps programs, learning and community access." />}
function Contact(){return <SimplePage title="Contact" kicker="Reach the team" copy="Visitors should be able to contact the organization for membership, practitioner applications, partnerships, donations, support and general questions." />}
function Trust(){return <SimplePage title="Trust & Policies" kicker="Clear governance" copy="The Trust area should explain privacy, consent, community standards, practitioner expectations, grievance support and stewardship in simple public language. Technical compliance and DevOps details stay in internal documentation." />}

function SimplePage({title,kicker,copy}){return <Shell><main className="page"><p className="eyebrow">{kicker}</p><h1>{title}</h1><p>{copy}</p><div className="pageActions"><Link to="/contact">Contact us</Link><Link to="/membership">Membership</Link></div><MediaBlock title={`${title} media`} /></main></Shell>}

function App(){return <BrowserRouter><Routes><Route path="/" element={<Home/>}/><Route path="/about" element={<About/>}/><Route path="/services" element={<Services/>}/><Route path="/membership" element={<Membership/>}/><Route path="/practitioners" element={<Practitioners/>}/><Route path="/programs-events" element={<Programs/>}/><Route path="/resources" element={<Resources/>}/><Route path="/donate" element={<Donate/>}/><Route path="/contact" element={<Contact/>}/><Route path="/trust" element={<Trust/>}/><Route path="/*" element={<Home/>}/></Routes></BrowserRouter>}

createRoot(document.getElementById('root')).render(<App/>);

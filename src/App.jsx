import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Heart, Shield, Star, Users, BookOpen, Award, TrendingUp, Globe,
  ArrowRight, CheckCircle, ChevronRight, ChevronDown, Mail, Phone,
  MapPin, Calendar, Clock, Play, FileText, Lock, Leaf, Gift,
  DollarSign, BarChart2, Briefcase, MessageCircle, Menu, X, Search,
  Zap, Sun, Activity, Brain, Home as HomeIcon, Layers, Settings,
  ExternalLink
} from 'lucide-react';
import './styles.css';

/* ─── IMAGES ─── */
const I = {
  hero1: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1800&q=85',
  heroA: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
  heroB: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=900&q=80',
  about1: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80',
  about2: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=700&q=80',
  wealth: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=900&q=80',
  wellness: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=900&q=80',
  coaching: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=900&q=80',
  education: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80',
  community: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80',
  care: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=80',
  p1: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80',
  p2: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&q=80',
  p3: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80',
  p4: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=600&q=80',
  prog1: 'https://images.unsplash.com/photo-1517637382994-f02da38c6728?w=800&q=80',
  prog2: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  prog3: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
  prog4: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
  res1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80',
  res2: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=700&q=80',
  res3: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&q=80',
  trust: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80',
  members: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80',
  summit: 'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?w=1200&q=80',
};

/* ═══════════════════════════════════════════
   NAVBAR WITH MEGA-MENU
═══════════════════════════════════════════ */
const NAV_STRUCTURE = [
  {
    label: 'About',
    href: '/about',
    children: {
      items: [
        { icon: <HomeIcon />, label: 'Our Story', desc: 'Mission, vision, and values', href: '/about' },
        { icon: <Users />, label: 'Leadership', desc: 'Trustees and founding team', href: '/about#leadership' },
        { icon: <Shield />, label: 'Governance', desc: 'How we operate and decide', href: '/trust-center' },
        { icon: <Globe />, label: 'Impact Report', desc: 'Community outcomes and reach', href: '/about#impact' },
      ],
      cols: 2,
      featured: { label: 'Annual Report 2025', title: 'Transforming 5,000+ lives', desc: 'Read our latest impact report covering every program, donation, and outcome.', href: '/about' },
    },
  },
  {
    label: 'Services',
    href: '/services',
    children: {
      items: [
        { icon: <TrendingUp />, label: 'Wealth Empowerment', desc: 'Financial strategy & literacy', href: '/services/wealth-empowerment' },
        { icon: <Heart />, label: 'Holistic Health', desc: 'Integrative wellness programs', href: '/services/holistic-health' },
        { icon: <Star />, label: 'Coaching & Mentoring', desc: 'Certified 1-on-1 guidance', href: '/services/coaching' },
        { icon: <BookOpen />, label: 'Education & Workshops', desc: 'Live & online learning tracks', href: '/services/education' },
        { icon: <Users />, label: 'Happiness Community', desc: 'Moderated member network', href: '/services/community' },
        { icon: <Activity />, label: 'Practitioner Care', desc: 'Vetted expert support', href: '/services/practitioner-care' },
      ],
      cols: 3,
    },
  },
  {
    label: 'Membership',
    href: '/membership',
    children: {
      items: [
        { icon: <Layers />, label: 'How It Works', desc: 'Your path to membership', href: '/membership' },
        { icon: <Award />, label: 'Member Benefits', desc: 'What every tier includes', href: '/membership#benefits' },
        { icon: <CheckCircle />, label: 'Apply Now', desc: 'Start your application', href: '/membership/apply' },
        { icon: <Shield />, label: 'Trust & Responsibilities', desc: 'Community guidelines', href: '/membership#trust' },
      ],
      cols: 2,
    },
  },
  {
    label: 'Practitioners',
    href: '/practitioners',
    children: {
      items: [
        { icon: <Users />, label: 'Find a Practitioner', desc: 'Browse verified professionals', href: '/practitioners' },
        { icon: <CheckCircle />, label: 'Apply as Practitioner', desc: 'Join our expert network', href: '/practitioners/apply' },
        { icon: <Shield />, label: 'Our Standards', desc: 'Verification and ethics code', href: '/practitioners/standards' },
        { icon: <Star />, label: 'Profile Guidance', desc: 'Tips for practitioners', href: '/practitioners/guidance' },
      ],
      cols: 2,
    },
  },
  { label: 'Programs', href: '/programs' },
  { label: 'Resources', href: '/resources' },
  {
    label: 'Trust Center',
    href: '/trust-center',
    children: {
      items: [
        { icon: <FileText />, label: 'Governance Charter', desc: 'Manifesto & policies', href: '/trust-center' },
        { icon: <Lock />, label: 'Privacy & Consent', desc: 'Data protection policy', href: '/trust-center#privacy' },
        { icon: <BarChart2 />, label: 'Audit Records', desc: 'Financial transparency', href: '/trust-center#audit' },
        { icon: <MessageCircle />, label: 'Grievance Support', desc: 'File a concern safely', href: '/trust-center#grievance' },
      ],
      cols: 2,
    },
  },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setMobileExpanded(null); }, [loc]);

  return (
    <>
      <header className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Brand */}
          <Link to="/" className="nav-brand">
            <div className="nav-emblem">
              <div className="nav-emblem-ring">
                <span className="nav-emblem-inner">IW</span>
              </div>
            </div>
            <div className="nav-wordmark">
              <span className="nav-wordmark-primary">Infinite Wealth</span>
              <span className="nav-wordmark-secondary">&amp; Well-being</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <ul className="nav-menu">
            {NAV_STRUCTURE.map((item) => (
              <li key={item.label} className="nav-item">
                {item.children ? (
                  <>
                    <button className={`nav-link${loc.pathname.startsWith(item.href) ? ' active' : ''}`}>
                      {item.label}
                      <svg className="nav-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6l4 4 4-4" />
                      </svg>
                    </button>
                    <div className="nav-dropdown">
                      {item.children.featured && (
                        <div style={{ padding: '4px 4px 0' }}>
                          <Link to={item.children.featured.href} className="dropdown-featured">
                            <div className="dropdown-featured-label">Featured</div>
                            <div className="dropdown-featured-title">{item.children.featured.title}</div>
                            <div className="dropdown-featured-desc">{item.children.featured.desc}</div>
                            <div className="dropdown-featured-cta">
                              Read more <ChevronRight size={12} />
                            </div>
                          </Link>
                          <div style={{ height: 6 }} />
                        </div>
                      )}
                      <div className={`dropdown-grid cols-${item.children.cols || 2}`}>
                        {item.children.items.map((child) => (
                          <Link to={child.href} key={child.label} className="dropdown-item">
                            <div className="dropdown-item-icon">{child.icon}</div>
                            <div className="dropdown-item-text">
                              <span className="dropdown-item-label">{child.label}</span>
                              <span className="dropdown-item-desc">{child.desc}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link to={item.href} className={`nav-link${loc.pathname === item.href ? ' active' : ''}`}>
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Right cluster */}
          <div className="nav-actions">
            <button className="nav-search-btn" aria-label="Search">
              <Search size={16} />
            </button>
            <Link to="/donate" className="btn btn-outline-gold btn-sm" style={{ display: 'none' }}>
              Donate
            </Link>
            <Link to="/membership/apply" className="btn btn-gold btn-sm">
              Join Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className={`nav-hamburger${mobileOpen ? ' open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        {NAV_STRUCTURE.map((item) => (
          <div className="mobile-nav-group" key={item.label}>
            {item.children ? (
              <>
                <button
                  className="mobile-nav-link"
                  onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                >
                  {item.label}
                  <ChevronDown size={18} style={{ transform: mobileExpanded === item.label ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5 }} />
                </button>
                {mobileExpanded === item.label && (
                  <div className="mobile-sub-links">
                    {item.children.items.map((child) => (
                      <Link to={child.href} key={child.label} className="mobile-sub-link">{child.label}</Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link to={item.href} className="mobile-nav-link">{item.label}</Link>
            )}
          </div>
        ))}
        <div className="mobile-menu-footer">
          <Link to="/donate" className="btn btn-ghost btn-lg" style={{ justifyContent: 'center' }}>
            <Gift size={16} /> Make a Donation
          </Link>
          <Link to="/membership/apply" className="btn btn-gold btn-lg" style={{ justifyContent: 'center' }}>
            Join the Community <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <div className="footer-brand-logo">
              <div className="nav-emblem-ring" style={{ width: 40, height: 40, borderRadius: 10 }}>
                <span className="nav-emblem-inner" style={{ fontSize: 15 }}>IW</span>
              </div>
              <div>
                <div className="footer-brand-name">Infinite Wealth &amp; Well-being</div>
                <div className="footer-brand-sub">Trust-Led · Mission-Driven</div>
              </div>
            </div>
            <p className="footer-about">
              A governed digital headquarters for wealth empowerment, holistic health, happiness, membership, practitioners, and community stewardship — open to all.
            </p>
            <div className="footer-socials">
              {[{ l: 'X', h: '#' }, { l: 'in', h: '#' }, { l: 'f', h: '#' }, { l: '▶', h: '#' }].map(s => (
                <a key={s.l} href={s.h} className="footer-social-btn">{s.l}</a>
              ))}
            </div>
          </div>
          <div className="footer-col">
            <h5>Organization</h5>
            <ul>
              {[['About Us', '/about'], ['Our Mission', '/about'], ['Leadership', '/about#leadership'], ['Governance', '/trust-center'], ['Careers', '/contact']].map(([l, h]) => (
                <li key={l}><Link to={h}>{l}</Link></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h5>Services</h5>
            <ul>
              {[['Wealth Empowerment', '/services/wealth-empowerment'], ['Holistic Health', '/services/holistic-health'], ['Coaching', '/services/coaching'], ['Education', '/services/education'], ['Community', '/services/community'], ['Practitioner Care', '/services/practitioner-care']].map(([l, h]) => (
                <li key={l}><Link to={h}>{l}</Link></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h5>Support</h5>
            <ul>
              {[['Membership', '/membership'], ['Apply Now', '/membership/apply'], ['Practitioners', '/practitioners'], ['Trust Center', '/trust-center'], ['Donate', '/donate'], ['Contact', '/contact']].map(([l, h]) => (
                <li key={l}><Link to={h}>{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Infinite Wealth &amp; Well-being. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Use', 'Cookie Settings'].map(l => (
              <a href="#" key={l}>{l}</a>
            ))}
          </div>
          <div className="footer-cert-row">
            <Shield size={13} />
            <span>508(c)(1)(a) Tax-Exempt Reference · Governed with Integrity</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── LAYOUT ─── */
function Layout({ children }) {
  return <><Navbar /><main>{children}</main><Footer /></>;
}

/* ═══════════════════════════════════════════
   HOME
═══════════════════════════════════════════ */
function Home() {
  const [donateAmt, setDonateAmt] = useState('$50');

  return (
    <Layout>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-media">
          <img src={I.hero1} alt="Community" loading="eager" />
        </div>
        <div className="hero-overlay" />
        <div className="hero-noise" />

        <div className="hero-aside">
          <img src={I.heroA} alt="" className="hero-aside-img" />
          <img src={I.heroB} alt="" className="hero-aside-img" />
        </div>

        <div className="hero-content">
          <div className="hero-label-row">
            <div className="hero-pill">
              <div className="hero-pill-dot" />
              <span>Trust-Led · Compliance-Aware · Community-First</span>
            </div>
            <div className="hero-label-line" />
          </div>

          <h1 className="hero-headline">
            <span className="line-break">Infinite</span>
            <em>Wealth</em> <span style={{ fontStyle: 'normal' }}>&amp;</span>
            <span className="line-break"><em>Well-being</em></span>
          </h1>

          <p className="hero-body">
            A modern sanctuary where financial empowerment, holistic health, and authentic happiness converge — guided by wisdom, governed by trust, open to everyone.
          </p>

          <div className="hero-cta-row">
            <Link to="/membership/apply" className="btn btn-gold btn-lg">
              Begin Your Journey <ArrowRight size={18} />
            </Link>
            <div className="hero-play">
              <div className="hero-play-btn"><Play size={18} /></div>
              <span>Watch Our Story</span>
            </div>
          </div>

          <div className="hero-metrics">
            {[
              { val: '5', sup: 'K+', label: 'Community Members' },
              { val: '120', sup: '+', label: 'Verified Practitioners' },
              { val: '98', sup: '%', label: 'Satisfaction Rate' },
              { val: '12', sup: '+', label: 'Years of Service' },
            ].map((m, i) => (
              <React.Fragment key={m.label}>
                {i > 0 && <div className="hero-metrics-divider" />}
                <div className="hero-metric">
                  <div className="hero-metric-value">{m.val}<span>{m.sup}</span></div>
                  <div className="hero-metric-label">{m.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="hero-scroll-cue">
          <div className="scroll-line" />
          <span className="scroll-text">Scroll</span>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-strip">
        <div className="marquee-inner" aria-hidden>
          {[...Array(2)].map((_, i) => (
            <React.Fragment key={i}>
              {['Wealth Empowerment', 'Holistic Health', 'Happiness & Community', 'Coaching & Mentoring', 'Education & Workshops', 'Practitioner-Supported Care', 'Trust-Led Governance', 'Ethical Standards', 'Member Well-being'].map(t => (
                <span className="marquee-item" key={t}>
                  <span className="marquee-dot" />
                  {t}
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="section-xs">
        <div className="container">
          <div className="stats-row">
            {[
              { val: '5,200', sup: '', label: 'Active Members' },
              { val: '120', sup: '+', label: 'Verified Practitioners' },
              { val: '$2.4', sup: 'M', label: 'Scholarships Awarded' },
              { val: '98', sup: '%', label: 'Member Satisfaction' },
            ].map(s => (
              <div className="stat-cell" key={s.label}>
                <div className="stat-value">{s.val}<sup>{s.sup}</sup></div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT SPLIT ── */}
      <section className="section">
        <div className="container">
          <div className="split">
            <div style={{ position: 'relative' }}>
              <div className="img-composition">
                <img src={I.about1} alt="Community" className="img-composition-main" />
                <img src={I.about2} alt="Coaching" className="img-composition-accent" />
                <div className="img-composition-badge">
                  <div className="img-composition-badge-num">12+</div>
                  <div className="img-composition-badge-text">Years of<br />Service</div>
                </div>
              </div>
            </div>
            <div className="content-block">
              <span className="label">Our Foundation</span>
              <div className="divider"><div className="divider-line" /><div className="divider-dot" /></div>
              <h2>Built on Trust.<br />Driven by <em>Purpose</em>.</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Infinite Wealth &amp; Well-being was founded on the belief that true prosperity is never purely financial — it is the harmony of health, happiness, community, and purpose working together.
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                We are a trust-led, mission-driven organization connecting members with verified practitioners, empowering communities through education, and stewarding every resource with radical transparency.
              </p>
              <div className="feature-list">
                {[
                  { icon: <Leaf size={18} />, title: 'Holistic Philosophy', desc: 'True wealth spans physical, mental, spiritual, and financial dimensions.' },
                  { icon: <Shield size={18} />, title: 'Governed with Integrity', desc: 'Transparent compliance and a trustee framework guide every decision.' },
                  { icon: <Globe size={18} />, title: 'Radically Inclusive', desc: 'Open to all who seek growth — regardless of background or starting point.' },
                ].map(f => (
                  <div className="feature-item" key={f.title}>
                    <div className="feature-icon">{f.icon}</div>
                    <div className="feature-text">
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 36 }}>
                <Link to="/about" className="btn btn-dark">
                  Our Full Story <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES BENTO ── */}
      <section className="section section-ivory">
        <div className="container">
          <div className="section-head centered">
            <span className="label">What We Offer</span>
            <div className="divider center"><div className="divider-line" /><div className="divider-dot" /><div className="divider-line" /></div>
            <h2>Services Designed for<br />Your Whole Life</h2>
            <p>Six interconnected domains of service — each crafted to transform a different dimension of your well-being.</p>
          </div>

          <div className="bento-grid">
            {/* Row 1 */}
            <Link to="/services/wealth-empowerment" className="bento-card col-span-7">
              <img src={I.wealth} alt="Wealth Empowerment" className="bento-card-img short" />
              <div className="bento-card-body">
                <div className="bento-card-icon"><TrendingUp /></div>
                <h3>Wealth Empowerment</h3>
                <p>Comprehensive financial literacy, investment strategy, debt elimination, and generational wealth planning for every income level.</p>
                <div className="bento-arrow">Explore Service <ChevronRight size={14} /></div>
              </div>
            </Link>
            <Link to="/services/holistic-health" className="bento-card col-span-5">
              <img src={I.wellness} alt="Holistic Health" className="bento-card-img short" />
              <div className="bento-card-body">
                <div className="bento-card-icon"><Heart /></div>
                <h3>Holistic Health</h3>
                <p>Integrative wellness programs combining nutrition, movement, mental health, and spiritual grounding.</p>
                <div className="bento-arrow">Explore Service <ChevronRight size={14} /></div>
              </div>
            </Link>

            {/* Row 2 */}
            <Link to="/services/coaching" className="bento-card col-span-4 dark">
              <div className="bento-card-body">
                <div className="bento-card-icon"><Star /></div>
                <h3>Coaching &amp; Mentoring</h3>
                <p>Personalized guidance from certified practitioners through life transitions with evidence-based methods.</p>
                <div className="bento-arrow">Explore Service <ChevronRight size={14} /></div>
              </div>
            </Link>
            <Link to="/services/education" className="bento-card col-span-4">
              <img src={I.education} alt="Education" className="bento-card-img" />
              <div className="bento-card-body">
                <div className="bento-card-icon"><BookOpen /></div>
                <h3>Education &amp; Workshops</h3>
                <p>Structured learning tracks, live workshops, and a growing library of practical resources.</p>
                <div className="bento-arrow">Explore Service <ChevronRight size={14} /></div>
              </div>
            </Link>
            <Link to="/services/community" className="bento-card col-span-4 gold">
              <div className="bento-card-body">
                <div className="bento-card-icon"><Users /></div>
                <h3>Happiness Community</h3>
                <p>A curated, moderated space where members share progress and build authentic human connections.</p>
                <div className="bento-arrow">Explore Service <ChevronRight size={14} /></div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED SUMMIT ── */}
      <section className="section-xs">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner-bg" style={{ backgroundImage: `url(${I.summit})` }} />
            <div className="cta-banner-glow" />
            <div className="cta-banner-content">
              <div className="cta-banner-text">
                <span className="label label-light">Annual Signature Event</span>
                <div className="divider"><div className="divider-line" /><div className="divider-dot" /></div>
                <h2 style={{ color: 'white', fontSize: 'clamp(1.8rem,3.5vw,2.8rem)' }}>
                  Wealth &amp; Wellness Summit 2025
                </h2>
                <p>Three transformative days of keynotes, workshops, and community connection. Join 1,000+ members in our most powerful gathering of the year — October 14–16.</p>
                <Link to="/programs" className="btn btn-gold" style={{ marginTop: 28, display: 'inline-flex' }}>
                  Reserve Your Seat <ArrowRight size={16} />
                </Link>
              </div>
              <div style={{ flexShrink: 0 }}>
                <img src={I.prog1} alt="Summit" style={{ width: 320, height: 220, objectFit: 'cover', borderRadius: 20, opacity: 0.75 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MEMBERSHIP ── */}
      <section className="section">
        <div className="container">
          <div className="section-head centered">
            <span className="label">Membership</span>
            <div className="divider center"><div className="divider-line" /><div className="divider-dot" /><div className="divider-line" /></div>
            <h2>Choose Your Path to<br />Transformation</h2>
            <p>Every tier meets you where you are and grows with you. No barriers — just community, wisdom, and genuine support.</p>
          </div>

          <div className="membership-deck">
            {[
              {
                tier: 'Foundation', name: 'Explorer', price: 'Free', period: 'forever · always',
                desc: 'Begin your journey with open access to community, resources, and education.',
                features: ['Community Forum Access', 'Monthly Newsletter', 'Free Resource Library', 'Event Invitations', 'Basic Wellness Guides'],
                featured: false,
              },
              {
                tier: 'Core', name: 'Member', price: '$49', period: '/ month · cancel anytime',
                badge: 'Most Popular',
                desc: 'The full experience — practitioners, programs, and priority access.',
                features: ['All Explorer Benefits', 'Practitioner Directory Access', '4 Group Sessions / Month', '30% Workshop Discounts', 'Member Dashboard', 'Progress Tracking', 'Accountability Partner'],
                featured: true,
              },
              {
                tier: 'Elite', name: 'Guardian', price: '$149', period: '/ month · cancel anytime',
                desc: 'Unlimited access, personal coaching, governance rights, and exclusive experiences.',
                features: ['All Member Benefits', 'Monthly 1-on-1 Coaching', 'Priority Practitioner Access', 'Governance Voting Rights', 'Exclusive Annual Retreat', 'Annual Strategy Session'],
                featured: false,
              },
            ].map(p => (
              <div className={`plan-card${p.featured ? ' featured' : ''}`} key={p.name}>
                {p.badge && <div className="plan-badge">{p.badge}</div>}
                <div className="plan-tier">{p.tier}</div>
                <div className="plan-name">{p.name}</div>
                <p className="plan-desc">{p.desc}</p>
                <div className="plan-price-wrap">
                  <div className="plan-price">{p.price}</div>
                  <div className="plan-price-period">{p.period}</div>
                </div>
                <div className="plan-divider" />
                <ul className="plan-features">
                  {p.features.map(f => (
                    <li className="plan-feature" key={f}>
                      <CheckCircle size={15} className="plan-feature-icon" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/membership/apply"
                  className={`btn ${p.featured ? 'btn-gold' : 'btn-outline-gold'} btn-lg`}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Get Started <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRACTITIONERS ── */}
      <section className="section section-ivory">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56, flexWrap: 'wrap', gap: 20 }}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <span className="label">Practitioners</span>
              <div className="divider"><div className="divider-line" /><div className="divider-dot" /></div>
              <h2>Verified Experts.<br /><em style={{ fontStyle: 'italic' }}>Genuine Care.</em></h2>
            </div>
            <Link to="/practitioners" className="btn btn-outline-gold">
              Browse All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="team-grid">
            {[
              { img: I.p1, name: 'Dr. Amelia Foster', role: 'Holistic Health Coach', bio: 'Board-certified integrative physician specializing in mind-body wellness and chronic stress reversal.' },
              { img: I.p2, name: 'James Okafor, CFP', role: 'Wealth Strategist', bio: 'Certified Financial Planner guiding families from debt to multi-generational wealth for 15 years.' },
              { img: I.p3, name: 'Dr. Priya Sharma', role: 'Clinical Psychologist', bio: 'Trauma-informed therapist integrating CBT, mindfulness, and positive psychology for deep healing.' },
              { img: I.p4, name: 'Michael Torres', role: 'Life & Business Coach', bio: 'ICF-certified executive coach aligning career trajectory with deepest personal values.' },
            ].map(p => (
              <Link to="/practitioners" className="team-card" key={p.name}>
                <div className="team-card-img-wrap">
                  <img src={p.img} alt={p.name} className="team-card-img" />
                  <div className="team-card-overlay" />
                  <div className="team-verified"><CheckCircle size={11} /> Verified</div>
                </div>
                <div className="team-card-body">
                  <div className="team-card-name">{p.name}</div>
                  <div className="team-card-role">{p.role}</div>
                  <p className="team-card-bio">{p.bio}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section">
        <div className="container">
          <div className="section-head centered">
            <span className="label">Member Stories</span>
            <div className="divider center"><div className="divider-line" /><div className="divider-dot" /><div className="divider-line" /></div>
            <h2>Lives Transformed</h2>
            <p>Unfiltered voices from the community.</p>
          </div>
          <div className="testimonial-grid">
            {[
              { text: 'Joining Infinite Wealth changed the trajectory of my family\'s financial future. The wealth empowerment program gave us a clarity we had never had before. Truly life-changing work.', name: 'Amara Johnson', role: 'Member since 2021', img: I.p1 },
              { text: 'The holistic health coaching combined with community support helped me heal from burnout in ways traditional medicine simply could not. This organization genuinely cares about you.', name: 'Dr. Marcus Williams', role: 'Guardian Member', img: I.p2 },
              { text: 'As a practitioner on the platform, I\'ve never worked within such a rigorously ethical and supportive framework. My clients are thriving and so is my practice.', name: 'Sarah Chen, LCSW', role: 'Verified Practitioner', img: I.p3 },
            ].map(t => (
              <div className="testimonial-card" key={t.name}>
                <div className="t-stars">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.92 5.33L10 13.17l-4.78 2.55.92-5.33L2.27 6.62l5.34-.78z"/></svg>
                  ))}
                </div>
                <div className="t-mark">"</div>
                <p className="t-text">{t.text}</p>
                <div className="t-author">
                  <img src={t.img} alt={t.name} className="t-avatar" />
                  <div>
                    <div className="t-name">{t.name}</div>
                    <div className="t-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DONATE BANNER ── */}
      <section className="section-xs section-dark">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner-bg" />
            <div className="cta-banner-glow" />
            <div className="cta-banner-content">
              <div className="cta-banner-text">
                <span className="label label-light">Stewardship</span>
                <div className="divider"><div className="divider-line" /><div className="divider-dot" /></div>
                <h2 style={{ color: 'white' }}>Support the Mission</h2>
                <p>Your generosity funds scholarships, community programs, and outreach extending well-being to those who need it most.</p>
                <div className="donate-amounts">
                  {['$25', '$50', '$100', '$250', 'Custom'].map(a => (
                    <button key={a} className={`donate-pill${donateAmt === a ? ' selected' : ''}`} onClick={() => setDonateAmt(a)}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="cta-banner-actions">
                <Link to="/donate" className="btn btn-gold btn-lg">
                  <Gift size={18} /> Donate {donateAmt !== 'Custom' ? donateAmt : 'Now'}
                </Link>
                <Link to="/donate" className="btn btn-ghost btn-lg" style={{ justifyContent: 'center' }}>
                  Learn How We Steward Funds
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   PAGE HERO COMPONENT
═══════════════════════════════════════════ */
function PageHero({ img, label, title, subtitle, titleEm }) {
  return (
    <div className="page-hero">
      {img && <div className="page-hero-bg" style={{ backgroundImage: `url(${img})` }} />}
      <div className="page-hero-overlay" />
      <div className="container">
        <div className="page-hero-content">
          <span className="label label-light">{label}</span>
          <div className="divider"><div className="divider-line" /><div className="divider-dot" /></div>
          <h1>{title}{titleEm && <><br /><em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#dfc068,#a97522)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{titleEm}</em></>}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ABOUT
═══════════════════════════════════════════ */
function About() {
  return (
    <Layout>
      <PageHero img={I.community} label="Our Story" title="Built on Trust." titleEm="Driven by Purpose." subtitle="From a small circle of visionaries to a thriving community of thousands — this is the Infinite Wealth & Well-being story." />
      <section className="section">
        <div className="container">
          <div className="split split-ratio-2-3">
            <div className="img-composition">
              <img src={I.about1} alt="Founders" className="img-composition-main" />
            </div>
            <div className="content-block">
              <span className="label">Our Foundation</span>
              <div className="divider"><div className="divider-line" /><div className="divider-dot" /></div>
              <h2>A Vision Born from Necessity</h2>
              <p style={{ color: 'var(--text-muted)' }}>Infinite Wealth &amp; Well-being was founded when a group of practitioners, educators, and community leaders recognized a profound gap: most wellness and wealth platforms served the already-privileged, leaving everyone else behind.</p>
              <p style={{ color: 'var(--text-muted)' }}>We set out to build something radically different — an organization governed not by profit, but by the genuine well-being of every member it serves. Every policy, every program, every practitioner relationship is filtered through one question: <em>does this truly serve our community?</em></p>
              <p style={{ color: 'var(--text-muted)' }}>Today, we are a living, breathing organism of human potential — expanding in reach while staying rooted in our founding values of trust, transparency, and transformative care.</p>
              <div style={{ marginTop: 32 }}>
                <Link to="/membership/apply" className="btn btn-gold btn-lg">Join Our Mission <ArrowRight size={16} /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <div className="section-head centered">
            <span className="label label-light">Leadership</span>
            <div className="divider center"><div className="divider-line" /><div className="divider-dot" /><div className="divider-line" /></div>
            <h2>The Trustees &amp; Founding Team</h2>
            <p>Our governance structure ensures accountability, ethical operation, and mission alignment at every level.</p>
          </div>
          <div className="team-grid">
            {[
              { img: I.p1, name: 'Dr. Eleanor James', role: 'Founder & Chief Visionary', bio: 'Holistic health pioneer with 20 years building wellness institutions rooted in equity and access for all.' },
              { img: I.p2, name: 'Marcus Adeyemi', role: 'Director of Wealth Programs', bio: 'Former investment banker turned financial educator, committed to democratizing wealth knowledge globally.' },
              { img: I.p3, name: 'Sarah Mitchell', role: 'Lead Trustee & Compliance', bio: 'Legal and governance expert ensuring every operation meets the highest ethical and regulatory standards.' },
              { img: I.p4, name: 'Dr. Kwame Osei', role: 'Head of Practitioner Standards', bio: 'Clinical psychologist developing the framework for practitioner verification and member safety protocols.' },
            ].map(p => (
              <div className="team-card" key={p.name}>
                <div className="team-card-img-wrap">
                  <img src={p.img} alt={p.name} className="team-card-img" />
                  <div className="team-card-overlay" />
                </div>
                <div className="team-card-body">
                  <div className="team-card-name">{p.name}</div>
                  <div className="team-card-role">{p.role}</div>
                  <p className="team-card-bio">{p.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   SERVICES
═══════════════════════════════════════════ */
function Services() {
  return (
    <Layout>
      <PageHero img={I.wellness} label="Our Services" title="Everything You Need" titleEm="to Flourish." subtitle="Six interconnected service domains designed to transform every dimension of your well-being — financial, physical, emotional, and communal." />
      <section className="section">
        <div className="container">
          <div className="bento-grid">
            {[
              { img: I.wealth, icon: <TrendingUp />, title: 'Wealth Empowerment', desc: 'Financial literacy, investment strategy, debt elimination, and generational wealth planning for individuals and families at every income level.', col: 'col-span-6', link: '/services/wealth-empowerment' },
              { img: I.wellness, icon: <Heart />, title: 'Holistic Health', desc: 'Integrated wellness combining evidence-based nutrition, movement practices, mental health support, and spiritual grounding.', col: 'col-span-6', link: '/services/holistic-health' },
              { img: I.coaching, icon: <Star />, title: 'Coaching & Mentoring', desc: 'Personalized coaching with certified practitioners through life transitions using evidence-based methods and deep human compassion.', col: 'col-span-4', link: '/services/coaching' },
              { img: I.education, icon: <BookOpen />, title: 'Education & Workshops', desc: 'Structured learning tracks, live workshops, and a library of resources covering finance, wellness, leadership, and practical skills.', col: 'col-span-4', link: '/services/education' },
              { img: I.community, icon: <Users />, title: 'Happiness Community', desc: 'A curated community where members share victories, support each other, and build authentic relationships centered on mutual growth.', col: 'col-span-4', link: '/services/community' },
              { img: I.care, icon: <Activity />, title: 'Practitioner Care', desc: 'Access to our carefully vetted network of health, wellness, and financial practitioners delivering individualized care plans.', col: 'col-span-12', link: '/services/practitioner-care' },
            ].map(s => (
              <Link to={s.link} className={`bento-card ${s.col}`} key={s.title}>
                {s.col !== 'col-span-12' && <img src={s.img} alt={s.title} className="bento-card-img" />}
                <div className="bento-card-body" style={s.col === 'col-span-12' ? { flexDirection: 'row', alignItems: 'center', gap: 32 } : {}}>
                  {s.col === 'col-span-12' && <img src={s.img} alt={s.title} style={{ width: 280, height: 160, objectFit: 'cover', borderRadius: 16, flexShrink: 0 }} />}
                  <div>
                    <div className="bento-card-icon">{s.icon}</div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                    <div className="bento-arrow">Explore Service <ChevronRight size={14} /></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   MEMBERSHIP
═══════════════════════════════════════════ */
function Membership() {
  const loc = useLocation();
  if (loc.pathname.includes('/apply')) return <MembershipApply />;

  return (
    <Layout>
      <PageHero img={I.members} label="Membership" title="Find Your" titleEm="Membership Path." subtitle="Every tier is designed to meet you where you are and grow with you. No barriers — just community, wisdom, and support." />
      <section className="section">
        <div className="container">
          <div className="section-head centered">
            <span className="label">How It Works</span>
            <div className="divider center"><div className="divider-line" /><div className="divider-dot" /><div className="divider-line" /></div>
            <h2>Four Steps to Your<br />Transformation</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, marginBottom: 96 }}>
            {[
              { num: '01', title: 'Choose Your Tier', desc: 'Select the membership level that aligns with your current goals and needs.' },
              { num: '02', title: 'Build Your Profile', desc: 'Tell us about yourself so we can match you with the right practitioners and programs.' },
              { num: '03', title: 'Join the Community', desc: 'Instant access to resources, forums, and your personal member dashboard.' },
              { num: '04', title: 'Grow Together', desc: 'Attend sessions, track progress, and flourish alongside thousands of members.' },
            ].map((s, i) => (
              <div key={s.num} style={{ textAlign: 'center', position: 'relative' }}>
                {i < 3 && <div style={{ position: 'absolute', top: 22, left: 'calc(50% + 40px)', right: '-40px', height: 1, background: 'linear-gradient(90deg, var(--border-dark), transparent)' }} />}
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '4.5rem', fontWeight: 300, color: 'var(--gold-200)', lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                <h3 style={{ marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="membership-deck">
            {[
              { tier: 'Foundation', name: 'Explorer', price: 'Free', period: 'forever · always free', desc: 'Start with open access to community, resources, and education.', features: ['Community Forum Access', 'Monthly Newsletter', 'Free Resource Library', 'Event Invitations', 'Basic Wellness Guides'], featured: false },
              { tier: 'Core', name: 'Member', price: '$49', period: '/ month · cancel anytime', badge: 'Most Popular', desc: 'The full experience — practitioners, programs, and priority access.', features: ['All Explorer Benefits', 'Practitioner Directory', '4 Group Sessions / Month', '30% Workshop Discounts', 'Member Dashboard', 'Progress Tracking', 'Accountability Partner'], featured: true },
              { tier: 'Elite', name: 'Guardian', price: '$149', period: '/ month · cancel anytime', desc: 'Unlimited access, personal coaching, and governance rights.', features: ['All Member Benefits', 'Monthly 1-on-1 Coaching', 'Priority Practitioner Access', 'Governance Voting Rights', 'Exclusive Retreats', 'Annual Strategy Session', 'Direct Trustee Access'], featured: false },
            ].map(p => (
              <div className={`plan-card${p.featured ? ' featured' : ''}`} key={p.name}>
                {p.badge && <div className="plan-badge">{p.badge}</div>}
                <div className="plan-tier">{p.tier}</div>
                <div className="plan-name">{p.name}</div>
                <p className="plan-desc">{p.desc}</p>
                <div className="plan-price-wrap">
                  <div className="plan-price">{p.price}</div>
                  <div className="plan-price-period">{p.period}</div>
                </div>
                <div className="plan-divider" />
                <ul className="plan-features">
                  {p.features.map(f => (<li className="plan-feature" key={f}><CheckCircle size={15} className="plan-feature-icon" />{f}</li>))}
                </ul>
                <Link to="/membership/apply" className={`btn ${p.featured ? 'btn-gold' : 'btn-outline-gold'} btn-lg`} style={{ width: '100%', justifyContent: 'center' }}>
                  Get Started <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function MembershipApply() {
  return (
    <Layout>
      <PageHero img={I.members} label="Apply Now" title="Start Your" titleEm="Transformation." subtitle="Complete this short form and our team will welcome you within 24 hours." />
      <section className="section section-dark">
        <div className="container">
          <div className="contact-wrap">
            <div className="contact-side">
              <span className="label label-light">Application</span>
              <div className="divider"><div className="divider-line" /><div className="divider-dot" /></div>
              <h2>We're Honored You're Here</h2>
              <p>Becoming a member means joining a community of people committed to growing — financially, physically, and spiritually.</p>
              {[
                { icon: <CheckCircle size={18} />, t: 'Instant Access', d: 'Community forum and resource library the same day' },
                { icon: <Shield size={18} />, t: 'Safe & Private', d: 'Governed under our strict privacy policy' },
                { icon: <Users size={18} />, t: 'Real Community', d: 'Connect with members who share your goals' },
              ].map(i => (
                <div className="contact-detail-item" key={i.t}>
                  <div className="contact-detail-icon">{i.icon}</div>
                  <div className="contact-detail-text">
                    <h5>{i.t}</h5>
                    <p>{i.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="contact-card">
              <h3>Membership Application</h3>
              <p>No commitment required for the free Explorer tier.</p>
              <div className="form-row2">
                <div className="field"><label>First Name</label><input type="text" placeholder="Jane" /></div>
                <div className="field"><label>Last Name</label><input type="text" placeholder="Smith" /></div>
              </div>
              <div className="field"><label>Email Address</label><input type="email" placeholder="jane@example.com" /></div>
              <div className="field"><label>Membership Tier</label>
                <select>
                  <option>Explorer (Free)</option>
                  <option>Member ($49/month)</option>
                  <option>Guardian ($149/month)</option>
                </select>
              </div>
              <div className="field"><label>Primary Goal</label>
                <select>
                  <option>Financial Freedom</option>
                  <option>Holistic Health & Wellness</option>
                  <option>Community & Connection</option>
                  <option>Personal Development</option>
                  <option>All of the Above</option>
                </select>
              </div>
              <div className="field"><label>About You</label><textarea placeholder="Share what brings you here..." /></div>
              <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                Submit Application <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   PRACTITIONERS
═══════════════════════════════════════════ */
function Practitioners() {
  return (
    <Layout>
      <PageHero img={I.coaching} label="Our Practitioners" title="Verified Experts." titleEm="Genuine Care." subtitle="Every practitioner in our network is rigorously vetted, ethically committed, and passionate about your transformation." />
      <section className="section section-ivory">
        <div className="container">
          <div className="section-head centered">
            <span className="label">Meet Our Team</span>
            <div className="divider center"><div className="divider-line" /><div className="divider-dot" /><div className="divider-line" /></div>
            <h2>Practitioners Ready to Serve You</h2>
          </div>
          <div className="team-grid">
            {[
              { img: I.p1, name: 'Dr. Amelia Foster', role: 'Holistic Health Coach', bio: 'Board-certified integrative physician specializing in mind-body wellness and chronic stress reversal protocols.' },
              { img: I.p2, name: 'James Okafor, CFP', role: 'Wealth Strategist', bio: '15 years guiding families from debt to multi-generational wealth through disciplined, personalized strategy.' },
              { img: I.p3, name: 'Dr. Priya Sharma', role: 'Clinical Psychologist', bio: 'Trauma-informed therapist integrating CBT, mindfulness, and positive psychology for lasting emotional resilience.' },
              { img: I.p4, name: 'Michael Torres', role: 'Life & Business Coach', bio: 'ICF-certified executive coach helping high-achievers align career with their deepest personal values.' },
            ].map(p => (
              <div className="team-card" key={p.name}>
                <div className="team-card-img-wrap">
                  <img src={p.img} alt={p.name} className="team-card-img" />
                  <div className="team-card-overlay" />
                  <div className="team-verified"><CheckCircle size={11} /> Verified</div>
                </div>
                <div className="team-card-body">
                  <div className="team-card-name">{p.name}</div>
                  <div className="team-card-role">{p.role}</div>
                  <p className="team-card-bio">{p.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-dark">
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="label label-light">For Practitioners</span>
          <div className="divider center" style={{ marginTop: 12 }}><div className="divider-line" /><div className="divider-dot" /><div className="divider-line" /></div>
          <h2 style={{ color: 'white', marginBottom: 16 }}>Join Our Practitioner Network</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 560, margin: '0 auto 40px' }}>We're always looking for aligned, ethical, highly skilled practitioners who want to make a meaningful difference in people's lives.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/practitioners/apply" className="btn btn-gold btn-lg">Apply as a Practitioner <ArrowRight size={16} /></Link>
            <Link to="/practitioners/standards" className="btn btn-ghost btn-lg">View Our Standards</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   PROGRAMS
═══════════════════════════════════════════ */
function Programs() {
  return (
    <Layout>
      <PageHero img={I.prog1} label="Programs & Events" title="Experiences That" titleEm="Change Everything." subtitle="Immersive programs, live events, and structured learning tracks designed to accelerate your growth at every level." />
      <section className="section">
        <div className="container">
          {[
            { img: I.prog1, tag: 'Annual Event', title: 'Wealth & Wellness Summit 2025', desc: 'Three days of transformational keynotes, workshops, networking, and community. The premier annual gathering for Infinite Wealth members and the broader wellness community.', date: 'Oct 14–16, 2025', dur: '3 Days', spots: '200 spots remaining' },
            { img: I.prog2, tag: 'Ongoing Program', title: 'The 90-Day Wealth Builder Track', desc: 'A structured, practitioner-guided 90-day program taking you from financial confusion to clear strategy. Weekly live sessions, daily exercises, and a personal accountability partner throughout.', date: 'Starts monthly', dur: '90 Days', spots: 'Open enrollment' },
            { img: I.prog3, tag: 'Workshop Series', title: 'Holistic Health Immersion', desc: 'A 6-week deep dive into integrative health covering nutrition, movement, sleep, stress management, and mental resilience — guided by certified health practitioners.', date: 'Rolling start', dur: '6 Weeks', spots: '24 per cohort' },
            { img: I.prog4, tag: 'Learning Track', title: 'Inner Peace & Happiness Foundations', desc: 'Evidence-based curriculum drawing from positive psychology, mindfulness, and contemplative traditions to build a lasting foundation of genuine, durable happiness.', date: 'Self-paced', dur: '8 Modules', spots: 'Unlimited' },
          ].map(p => (
            <Link to="/programs/detail" className="program-row" key={p.title}>
              <img src={p.img} alt={p.title} className="program-row-img" />
              <div className="program-row-body">
                <span className="program-type">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="program-meta">
                  <span><Calendar size={14} />{p.date}</span>
                  <span><Clock size={14} />{p.dur}</span>
                  <span><Users size={14} />{p.spots}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   RESOURCES
═══════════════════════════════════════════ */
function Resources() {
  return (
    <Layout>
      <PageHero img={I.education} label="Resources" title="Knowledge Is" titleEm="the Foundation." subtitle="Articles, guides, media, and tools to deepen your understanding and accelerate your transformation." />
      <section className="section">
        <div className="container">
          <div className="article-grid">
            {[
              { img: I.res1, tag: 'Wealth', title: '7 Wealth-Building Habits That Will Transform Your Financial Future', desc: 'Practical, proven strategies from certified financial planners designed for real people with real budgets.', time: '8 min read' },
              { img: I.res2, tag: 'Wellness', title: 'The Mind-Body Connection: Science-Backed Practices for Lasting Health', desc: 'How integrating physical and mental wellness creates a compounding effect on your overall well-being.', time: '6 min read' },
              { img: I.res3, tag: 'Community', title: 'Building Authentic Connection in a Disconnected World', desc: 'Why community is the missing ingredient in most wellness journeys — and how to find yours.', time: '5 min read' },
              { img: I.about2, tag: 'Coaching', title: 'Finding the Right Coach: A Complete Guide for First-Timers', desc: 'What to look for, what to avoid, and how to get maximum value from a coaching relationship.', time: '10 min read' },
              { img: I.prog3, tag: 'Education', title: 'Financial Literacy at Every Age: Where to Start', desc: 'A life-stage guide to the financial concepts and skills that matter most at every decade of life.', time: '7 min read' },
              { img: I.prog4, tag: 'Happiness', title: 'The Science of Happiness: What Research Actually Shows', desc: 'Separating myth from evidence — the habits, practices, and mindsets that genuinely increase joy.', time: '9 min read' },
            ].map(a => (
              <Link to="/resources/article" className="article-card" key={a.title}>
                <div className="article-img-wrap">
                  <img src={a.img} alt={a.title} className="article-img" />
                </div>
                <div className="article-body">
                  <span className="article-tag">{a.tag}</span>
                  <h4>{a.title}</h4>
                  <p>{a.desc}</p>
                  <div className="article-foot">
                    <span><Clock size={12} />{a.time}</span>
                    <span style={{ color: 'var(--gold-600)', fontWeight: 600, fontSize: 12 }}>Read Article <ChevronRight size={12} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   TRUST CENTER
═══════════════════════════════════════════ */
function TrustCenter() {
  return (
    <Layout>
      <PageHero img={I.trust} label="Trust Center" title="Governed with" titleEm="Full Transparency." subtitle="Every policy, record, and governance document — open for review. Trust is not claimed; it is demonstrated." />
      <section className="section section-dark">
        <div className="container">
          <div className="section-head">
            <span className="label label-light">Governance & Compliance</span>
            <div className="divider"><div className="divider-line" /><div className="divider-dot" /></div>
            <h2>Our Commitment to Accountability</h2>
            <p>We operate under a rigorous governance framework that prioritizes member safety, financial transparency, and ethical conduct at every level.</p>
          </div>
          <div className="trust-grid">
            {[
              { icon: <FileText />, title: 'Manifesto & Governance Charter', desc: 'Our founding document outlining values, governance structure, decision-making processes, and member rights.', meta: 'Reviewed Annually' },
              { icon: <Shield />, title: 'Compliance Records', desc: 'A living record of all compliance actions, regulatory filings, and governance decisions — accessible to members.', meta: 'Updated Quarterly' },
              { icon: <Award />, title: '508(c)(1)(a) Tax-Exempt Reference', desc: 'Documentation related to organizational tax-exempt status and its implications for donations and operations.', meta: 'Professionally Reviewed' },
              { icon: <Lock />, title: 'Privacy & Consent Policy', desc: 'A plain-language policy explaining exactly how member data is collected, stored, used, and protected.', meta: 'GDPR Aligned' },
              { icon: <MessageCircle />, title: 'Grievance Support Process', desc: 'A clear, safe, confidential process for any member to raise concerns or request organizational review.', meta: '48h Response SLA' },
              { icon: <BarChart2 />, title: 'Audit Readiness Documentation', desc: 'Comprehensive financial and operational records prepared for external audit at any time.', meta: 'Independent Auditor' },
            ].map(t => (
              <Link to="/trust-center/doc" className="trust-item" key={t.title}>
                <div className="trust-item-icon">{t.icon}</div>
                <div>
                  <h4>{t.title}</h4>
                  <p>{t.desc}</p>
                  <div className="trust-meta"><CheckCircle size={11} />{t.meta}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   DONATE
═══════════════════════════════════════════ */
function Donate() {
  const [amt, setAmt] = useState('$50');
  return (
    <Layout>
      <PageHero img={I.trust} label="Stewardship & Giving" title="Give the Gift of" titleEm="Infinite Well-being." subtitle="Your generosity directly funds scholarships, community programs, and outreach extending our mission to those who need it most." />
      <section className="section">
        <div className="container">
          <div className="contact-wrap" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
            <div className="content-block">
              <span className="label">Your Impact</span>
              <div className="divider"><div className="divider-line" /><div className="divider-dot" /></div>
              <h2>Where Your Gift Goes</h2>
              <div className="feature-list">
                {[
                  { icon: <Award size={18} />, t: 'Scholarships', d: '$25 provides one month of Explorer membership to someone who cannot afford it.' },
                  { icon: <Users size={18} />, t: 'Community Outreach', d: '$50 sponsors a community workshop reaching up to 30 participants.' },
                  { icon: <BookOpen size={18} />, t: 'Resource Development', d: '$100 funds the creation of a new educational guide or wellness resource.' },
                  { icon: <Globe size={18} />, t: 'Global Mission', d: '$250 supports a full month of international community expansion programs.' },
                ].map(i => (
                  <div className="feature-item" key={i.t}>
                    <div className="feature-icon">{i.icon}</div>
                    <div className="feature-text"><h4>{i.t}</h4><p>{i.d}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="contact-card">
              <h3>Make a Contribution</h3>
              <p>Every gift, regardless of size, creates ripples of transformation in our community.</p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 10 }}>Select Amount</label>
                <div className="donate-amounts" style={{ marginTop: 0 }}>
                  {['$25', '$50', '$100', '$250', 'Custom'].map(a => (
                    <button key={a} className={`donate-pill${amt === a ? ' selected' : ''}`} onClick={() => setAmt(a)} style={{ background: amt === a ? 'linear-gradient(135deg,var(--gold-400),var(--gold-600))' : 'rgba(196,146,42,0.06)', border: amt === a ? 'none' : '1.5px solid var(--border-dark)', color: amt === a ? 'white' : 'var(--gold-700)' }}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="form-row2">
                <div className="field"><label>First Name</label><input type="text" placeholder="Jane" /></div>
                <div className="field"><label>Last Name</label><input type="text" placeholder="Smith" /></div>
              </div>
              <div className="field"><label>Email</label><input type="email" placeholder="jane@example.com" /></div>
              <div className="field"><label>Dedication (Optional)</label><input type="text" placeholder="In honor of..." /></div>
              <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                <Gift size={18} /> Complete Donation
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Shield size={12} /> Secure · Tax receipt provided · 100% mission-directed
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   CONTACT
═══════════════════════════════════════════ */
function Contact() {
  return (
    <Layout>
      <section className="section section-dark" style={{ paddingTop: 'calc(var(--nav-height) + 80px)' }}>
        <div className="container">
          <div className="contact-wrap">
            <div className="contact-side">
              <span className="label label-light">Get in Touch</span>
              <div className="divider"><div className="divider-line" /><div className="divider-dot" /></div>
              <h2>We'd Love to<br /><em style={{ fontStyle: 'italic' }}>Hear From You</em></h2>
              <p>Whether you have a question about membership, practitioner opportunities, or our programs — we are here and we genuinely care about your journey.</p>
              {[
                { icon: <Mail size={18} />, t: 'Email Us', d: 'hello@infinitewealthwellbeing.org' },
                { icon: <Phone size={18} />, t: 'Call Us', d: '+1 (800) IW-WELLBEING' },
                { icon: <MapPin size={18} />, t: 'Our Reach', d: 'Serving members globally, with hubs across North America' },
                { icon: <Clock size={18} />, t: 'Response Time', d: 'We reply to all inquiries within 24 business hours' },
              ].map(d => (
                <div className="contact-detail-item" key={d.t}>
                  <div className="contact-detail-icon">{d.icon}</div>
                  <div className="contact-detail-text">
                    <h5>{d.t}</h5>
                    <p>{d.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="contact-card">
              <h3>Send a Message</h3>
              <p>A member of our team will be in touch within one business day.</p>
              <div className="form-row2">
                <div className="field"><label>First Name</label><input type="text" placeholder="Jane" /></div>
                <div className="field"><label>Last Name</label><input type="text" placeholder="Smith" /></div>
              </div>
              <div className="field"><label>Email Address</label><input type="email" placeholder="jane@example.com" /></div>
              <div className="field"><label>Subject</label>
                <select>
                  <option>General Inquiry</option>
                  <option>Membership Questions</option>
                  <option>Practitioner Application</option>
                  <option>Donation / Stewardship</option>
                  <option>Technical Support</option>
                  <option>Partnership & Collaboration</option>
                </select>
              </div>
              <div className="field"><label>Message</label><textarea placeholder="How can we help you?" /></div>
              <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                Send Message <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   404
═══════════════════════════════════════════ */
function NotFound() {
  return (
    <Layout>
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: '140px 6vw 80px' }}>
        <span className="label">404 — Not Found</span>
        <div className="divider center" style={{ marginTop: 12 }}><div className="divider-line" /><div className="divider-dot" /><div className="divider-line" /></div>
        <h1 style={{ marginBottom: 20 }}>Page Not Found</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 500, marginBottom: 40 }}>The page you are looking for doesn't exist or has been moved. Let's get you back on your journey.</p>
        <Link to="/" className="btn btn-gold btn-lg">Return Home <ArrowRight size={16} /></Link>
      </div>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   ROUTER
═══════════════════════════════════════════ */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:slug" element={<Services />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/membership/:slug" element={<Membership />} />
        <Route path="/practitioners" element={<Practitioners />} />
        <Route path="/practitioners/:slug" element={<Practitioners />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/programs/:slug" element={<Programs />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:slug" element={<Resources />} />
        <Route path="/trust-center" element={<TrustCenter />} />
        <Route path="/trust-center/:slug" element={<TrustCenter />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);

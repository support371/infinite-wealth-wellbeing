import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Heart, Shield, Star, Users, BookOpen, Award, TrendingUp, Globe,
  ArrowRight, CheckCircle, ChevronRight, Mail, Phone, MapPin,
  Calendar, Clock, Play, FileText, Lock, Leaf, Sun, Zap,
  DollarSign, Gift, BarChart2, Briefcase, MessageCircle, Menu, X
} from 'lucide-react';
import './styles.css';

/* ─── UNSPLASH IMAGE HELPERS ─── */
const IMG = {
  hero:        'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1800&q=80',
  about1:      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80',
  about2:      'https://images.unsplash.com/photo-1552581234-26160f608093?w=700&q=80',
  wellness:    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
  wealth:      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=900&q=80',
  community:   'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80',
  coaching:    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=900&q=80',
  education:   'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80',
  care:        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=80',
  p1:          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80',
  p2:          'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&q=80',
  p3:          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80',
  p4:          'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=600&q=80',
  prog1:       'https://images.unsplash.com/photo-1517637382994-f02da38c6728?w=700&q=80',
  prog2:       'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=700&q=80',
  prog3:       'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=700&q=80',
  prog4:       'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=700&q=80',
  res1:        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80',
  res2:        'https://images.unsplash.com/photo-1589998059171-988d887df646?w=700&q=80',
  res3:        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&q=80',
  donate:      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1600&q=80',
  trust:       'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80',
  members:     'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80',
};

/* ─── NAVIGATION ─── */
function Nav() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const active = (p) => loc.pathname === p || loc.pathname.startsWith(p + '/');

  const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/services', label: 'Services' },
    { to: '/membership', label: 'Membership' },
    { to: '/practitioners', label: 'Practitioners' },
    { to: '/programs', label: 'Programs' },
    { to: '/resources', label: 'Resources' },
    { to: '/trust-center', label: 'Trust Center' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">
        <div className="nav-logo-mark">IW</div>
        <div className="nav-brand-text">
          <span className="nav-brand-name">Infinite Wealth</span>
          <span className="nav-brand-tagline">&amp; Well-being</span>
        </div>
      </Link>

      <ul className="nav-links">
        {links.slice(1, -1).map(l => (
          <li key={l.to}>
            <Link to={l.to} className={active(l.to) && l.to !== '/' ? 'active' : ''}>
              {l.label}
            </Link>
          </li>
        ))}
        <li>
          <Link to="/membership/apply" className="nav-cta">Join Now</Link>
        </li>
      </ul>

      <button className="nav-mobile-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, top: 80,
          background: 'rgba(13,27,42,0.98)',
          padding: '32px 6vw', zIndex: 99,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {links.map(l => (
            <Link key={l.to} to={l.to}
              onClick={() => setOpen(false)}
              style={{
                color: 'white', textDecoration: 'none',
                padding: '14px 0', fontSize: '1.2rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                fontFamily: "'Cormorant Garamond', serif",
              }}>
              {l.label}
            </Link>
          ))}
          <Link to="/membership/apply" onClick={() => setOpen(false)}
            style={{ marginTop: 24 }} className="btn-primary">
            Join the Community <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="nav-logo-mark" style={{ width: 38, height: 38, fontSize: 16 }}>IW</div>
          </div>
          <div className="footer-brand-name">Infinite Wealth &amp; Well-being</div>
          <p className="footer-tagline">
            A trust-led, mission-driven organization dedicated to holistic wealth, health, happiness, and community stewardship for all.
          </p>
          <div className="footer-socials">
            {['𝕏', 'in', 'f', '📷'].map((s, i) => (
              <a href="#" key={i} className="footer-social">{s}</a>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h5>Organization</h5>
          <ul>
            {['About Us', 'Our Mission', 'Leadership', 'Governance', 'Careers'].map(l => (
              <li key={l}><Link to="/about">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h5>Services</h5>
          <ul>
            {['Wealth Empowerment', 'Holistic Health', 'Coaching', 'Education', 'Community', 'Practitioner Care'].map(l => (
              <li key={l}><Link to="/services">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h5>Support</h5>
          <ul>
            {[
              { l: 'Become a Member', to: '/membership/apply' },
              { l: 'For Practitioners', to: '/practitioners' },
              { l: 'Trust Center', to: '/trust-center' },
              { l: 'Donate', to: '/donate' },
              { l: 'Contact Us', to: '/contact' },
              { l: 'Resources', to: '/resources' },
            ].map(({ l, to }) => (
              <li key={l}><Link to={to}>{l}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Infinite Wealth &amp; Well-being. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 13 }}>Privacy Policy</a>
          <a href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 13 }}>Terms of Use</a>
          <a href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 13 }}>Cookie Settings</a>
        </div>
        <div className="footer-cert">
          <Shield size={14} />
          <span>508(c)(1)(a) Tax-Exempt Reference · Trust-Led Governance</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── LAYOUT WRAPPER ─── */
function Layout({ children }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}

/* ═══════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════ */
function Home() {
  return (
    <Layout>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-gradient" />
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            <span>Trust-Led · Mission-Driven · Community-First</span>
          </div>
          <h1>
            Infinite <em>Wealth</em> &amp;<br />
            Well-being
          </h1>
          <p className="hero-subtitle">
            A modern digital sanctuary where financial empowerment, holistic health, and authentic happiness converge — guided by wisdom, governed by trust.
          </p>
          <div className="hero-actions">
            <Link to="/membership/apply" className="btn-primary">
              Begin Your Journey <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="btn-outline">
              <Play size={16} /> Our Mission
            </Link>
          </div>
        </div>

        <div className="hero-stats">
          {[
            { num: '5K+', label: 'Community Members' },
            { num: '120+', label: 'Practitioners' },
            { num: '98%', label: 'Satisfaction Rate' },
          ].map(s => (
            <div className="hero-stat" key={s.label}>
              <div className="hero-stat-num">{s.num}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="hero-scroll">
          <div className="hero-scroll-line" />
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* MISSION STRIP */}
      <div className="mission-strip">
        {[
          { icon: <Heart size={22} />, title: 'Holistic Wellness', text: 'Integrating mind, body and spirit for complete well-being' },
          { icon: <TrendingUp size={22} />, title: 'Wealth Empowerment', text: 'Practical tools and knowledge for lasting financial freedom' },
          { icon: <Users size={22} />, title: 'Community Trust', text: 'A governed, safe space built on accountability and care' },
          { icon: <Shield size={22} />, title: 'Ethical Standards', text: 'Compliance-first with transparent governance at every level' },
          { icon: <Star size={22} />, title: 'Expert Practitioners', text: 'Verified professionals committed to your transformation' },
        ].map(m => (
          <div className="mission-item" key={m.title}>
            <div className="mission-icon">{m.icon}</div>
            <h4>{m.title}</h4>
            <p>{m.text}</p>
          </div>
        ))}
      </div>

      {/* ABOUT SPLIT */}
      <section className="section">
        <div className="about-grid">
          <div className="about-image-wrap">
            <img src={IMG.about1} alt="Community gathering" className="about-image" />
            <img src={IMG.about2} alt="Coaching session" className="about-image-accent" />
            <div className="about-badge">
              <div className="about-badge-num">12+</div>
              <div className="about-badge-label">Years of<br/>Service</div>
            </div>
          </div>
          <div className="about-content">
            <span className="eyebrow">Who We Are</span>
            <div className="gold-divider" />
            <h2>A Sanctuary for Growth, Health &amp; Prosperity</h2>
            <p>
              Infinite Wealth &amp; Well-being was founded on the belief that true prosperity is not just financial — it is the harmony of health, happiness, community, and purpose.
            </p>
            <p>
              We operate as a trust-led, mission-driven organization, connecting members with verified practitioners, empowering communities through education, and stewarding resources with radical transparency.
            </p>
            <div className="values-list">
              {[
                { icon: <Leaf size={18} />, title: 'Holistic Philosophy', desc: 'We believe wealth encompasses physical, mental, spiritual, and financial dimensions.' },
                { icon: <Shield size={18} />, title: 'Governed with Integrity', desc: 'Every decision is made within a transparent compliance and trustee framework.' },
                { icon: <Globe size={18} />, title: 'Inclusive Community', desc: 'Open to all who seek growth — regardless of background or starting point.' },
              ].map(v => (
                <div className="value-item" key={v.title}>
                  <div className="value-icon">{v.icon}</div>
                  <div className="value-text">
                    <h4>{v.title}</h4>
                    <p>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 36 }}>
              <Link to="/about" className="btn-primary">Learn Our Story <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section section-cream">
        <div className="section-header centered">
          <span className="eyebrow">What We Offer</span>
          <div className="gold-divider centered" />
          <h2>Services Designed for Your Whole Life</h2>
          <p>From financial strategy to holistic health — every service is designed with your complete transformation in mind.</p>
        </div>
        <div className="services-grid">
          {[
            { img: IMG.wealth, icon: <TrendingUp size={20} />, title: 'Wealth Empowerment', desc: 'Comprehensive financial strategies, investment guidance, and wealth-building frameworks tailored for individuals and families at every stage.', link: '/services/wealth-empowerment' },
            { img: IMG.wellness, icon: <Heart size={20} />, title: 'Holistic Health', desc: 'Integrative health programs combining nutrition, mental wellness, physical fitness, and spiritual practices into one cohesive journey.', link: '/services/holistic-health' },
            { img: IMG.coaching, icon: <Star size={20} />, title: 'Coaching &amp; Mentoring', desc: 'One-on-one and group coaching with certified practitioners who guide you through life transitions with wisdom and compassion.', link: '/services/coaching-mentoring' },
            { img: IMG.education, icon: <BookOpen size={20} />, title: 'Education &amp; Workshops', desc: 'Live workshops, online courses, and educational tracks covering personal finance, wellness science, leadership, and community building.', link: '/services/education-workshops' },
            { img: IMG.community, icon: <Users size={20} />, title: 'Happiness Community', desc: 'A vibrant, moderated community of like-minded individuals sharing progress, accountability, and authentic human connection.', link: '/services/happiness-community' },
            { img: IMG.care, icon: <Shield size={20} />, title: 'Practitioner-Supported Care', desc: 'Access to our verified network of health, wellness, and financial practitioners for personalized support and ongoing care management.', link: '/services/practitioner-supported-care' },
          ].map(s => (
            <Link to={s.link} className="service-card" key={s.title}>
              <img src={s.img} alt={s.title} className="service-card-img" />
              <div className="service-card-body">
                <div className="service-card-icon">{s.icon}</div>
                <h3 dangerouslySetInnerHTML={{ __html: s.title }} />
                <p>{s.desc}</p>
                <div className="service-card-link">
                  Explore Service <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED BANNER */}
      <section style={{ padding: '60px 0' }}>
        <div className="featured-banner">
          <div className="featured-banner-bg" />
          <div className="featured-banner-overlay" />
          <div className="featured-banner-content">
            <span className="eyebrow">Upcoming Experience</span>
            <div className="gold-divider" />
            <h2>The Annual Wealth &amp; Wellness Summit</h2>
            <p>Three transformative days of keynotes, workshops, and community connection. Join 1,000+ members in our most powerful gathering of the year.</p>
            <Link to="/programs" className="btn-primary">
              Reserve Your Seat <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* MEMBERSHIP TIERS */}
      <section className="section">
        <div className="section-header centered">
          <span className="eyebrow">Membership</span>
          <div className="gold-divider centered" />
          <h2>Choose Your Path to Transformation</h2>
          <p>Every membership tier is designed to meet you exactly where you are — and take you further than you imagined.</p>
        </div>
        <div className="membership-grid">
          {[
            {
              tier: 'Foundation', name: 'Explorer', price: 'Free', period: 'forever',
              desc: 'Begin your journey with full access to community resources.',
              features: ['Community Forum Access', 'Monthly Newsletter', 'Free Resource Library', 'Event Invitations'],
              featured: false,
            },
            {
              tier: 'Core', name: 'Member', price: '$49', period: 'per month',
              desc: 'The full experience — practitioners, programs, and priority access.',
              features: ['All Explorer Benefits', 'Practitioner Directory', '4 Group Sessions / Month', 'Workshop Discounts 30%', 'Member Dashboard', 'Progress Tracking'],
              featured: true,
            },
            {
              tier: 'Elite', name: 'Guardian', price: '$149', period: 'per month',
              desc: 'Unlimited access, personal coaching, and governance participation.',
              features: ['All Member Benefits', 'Monthly 1-on-1 Coaching', 'Priority Practitioner Access', 'Governance Voting Rights', 'Exclusive Retreats', 'Annual Strategy Session'],
              featured: false,
            },
          ].map(m => (
            <div className={`membership-card${m.featured ? ' featured' : ''}`} key={m.name}>
              <div className="membership-tier">{m.tier}</div>
              <h3>{m.name}</h3>
              <p style={{ fontSize: 13, opacity: 0.7, margin: '8px 0' }}>{m.desc}</p>
              <div className="price">{m.price}</div>
              <div className="period">{m.period}</div>
              <ul className="membership-features">
                {m.features.map(f => (
                  <li key={f}>
                    <CheckCircle size={16} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/membership/apply" className={m.featured ? 'btn-primary' : 'btn-outline'}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                  ...(m.featured ? {} : { borderColor: 'var(--gold)', color: 'var(--gold-dark)' }) }}>
                Get Started <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section section-cream">
        <div className="section-header centered">
          <span className="eyebrow">Member Stories</span>
          <div className="gold-divider centered" />
          <h2>Lives Transformed</h2>
          <p>Real voices from our community — unfiltered and authentic.</p>
        </div>
        <div className="testimonials-grid">
          {[
            {
              text: 'Joining Infinite Wealth changed the trajectory of my family\'s financial future. The wealth empowerment program gave us clarity we had never had before. Truly life-changing.',
              name: 'Amara Johnson', role: 'Member since 2021', avatar: IMG.p1, stars: 5,
            },
            {
              text: 'The holistic health coaching combined with community support helped me heal from burnout in ways that traditional medicine simply could not. This organization genuinely cares.',
              name: 'Dr. Marcus Williams', role: 'Guardian Member', avatar: IMG.p2, stars: 5,
            },
            {
              text: 'As a practitioner on the platform, I\'ve never worked within such a rigorously ethical and supportive framework. My clients are thriving and so is my practice.',
              name: 'Sarah Chen, LCSW', role: 'Verified Practitioner', avatar: IMG.p3, stars: 5,
            },
          ].map(t => (
            <div className="testimonial-card" key={t.name}>
              <div className="stars">{'★'.repeat(t.stars)}</div>
              <div className="testimonial-quote">"</div>
              <p>{t.text}</p>
              <div className="testimonial-author">
                <img src={t.avatar} alt={t.name} className="testimonial-avatar" />
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DONATE CTA */}
      <section className="donate-section section-dark">
        <div className="donate-bg" style={{ backgroundImage: `url(${IMG.donate})` }} />
        <div className="content">
          <span className="eyebrow">Stewardship</span>
          <div className="gold-divider centered" />
          <h2 style={{ color: 'white' }}>Support the Mission</h2>
          <p>Your generosity funds scholarships, community programs, and outreach initiatives that extend well-being to those who need it most.</p>
          <div className="donate-options">
            {['$25', '$50', '$100', '$250', 'Custom'].map(a => (
              <button key={a} className="donate-amount">{a}</button>
            ))}
          </div>
          <Link to="/donate" className="btn-primary">
            <Gift size={18} /> Make a Contribution
          </Link>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   ABOUT PAGE
═══════════════════════════════════════════ */
function About() {
  return (
    <Layout>
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: `url(${IMG.community})` }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="eyebrow">Our Story</span>
          <div className="gold-divider" />
          <h1>Built on Trust.<br /><em>Driven by Purpose.</em></h1>
          <p>From a small circle of visionaries to a thriving community of thousands — this is the Infinite Wealth &amp; Well-being story.</p>
        </div>
      </div>

      <section className="section">
        <div className="about-grid">
          <div className="about-image-wrap">
            <img src={IMG.about1} alt="Founders" className="about-image" />
          </div>
          <div className="about-content">
            <span className="eyebrow">Our Foundation</span>
            <div className="gold-divider" />
            <h2>A Vision Born from Necessity</h2>
            <p>Infinite Wealth &amp; Well-being was founded when a group of practitioners, educators, and community leaders recognized a profound gap: most wellness and wealth platforms served the already-privileged.</p>
            <p>We set out to build something radically different — an organization governed not by profit, but by the genuine well-being of every member it serves. Every policy, every program, every practitioner relationship is filtered through one question: <em>does this truly serve our community?</em></p>
            <p>Today, we are a living, breathing organism of human potential — expanding in reach while staying rooted in our founding values of trust, transparency, and transformative care.</p>
            <div style={{ marginTop: 32 }}>
              <Link to="/membership/apply" className="btn-primary">Join Our Mission <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mission-strip">
        {[
          { icon: <Heart size={22} />, title: 'Our Mission', text: 'To empower individuals with the tools, community, and wisdom to achieve infinite well-being across all dimensions of life.' },
          { icon: <Globe size={22} />, title: 'Our Vision', text: 'A world where holistic prosperity is accessible to every human being, regardless of background or circumstance.' },
          { icon: <Shield size={22} />, title: 'Our Values', text: 'Integrity, Compassion, Inclusion, Excellence, Transparency, and the relentless pursuit of human flourishing.' },
        ].map(m => (
          <div className="mission-item" key={m.title}>
            <div className="mission-icon">{m.icon}</div>
            <h4>{m.title}</h4>
            <p>{m.text}</p>
          </div>
        ))}
      </section>

      <section className="section section-cream">
        <div className="section-header centered">
          <span className="eyebrow">Leadership</span>
          <div className="gold-divider centered" />
          <h2>The Trustees &amp; Founding Team</h2>
          <p>Our governance structure ensures accountability, ethical operation, and mission alignment at every level.</p>
        </div>
        <div className="practitioners-grid">
          {[
            { img: IMG.p1, name: 'Dr. Eleanor James', role: 'Founder &amp; Chief Visionary', bio: 'Holistic health pioneer with 20 years building wellness institutions rooted in equity and access.' },
            { img: IMG.p2, name: 'Marcus Adeyemi', role: 'Director of Wealth Programs', bio: 'Former investment banker turned financial educator, committed to democratizing wealth knowledge.' },
            { img: IMG.p3, name: 'Sarah Mitchell', role: 'Lead Trustee &amp; Compliance', bio: 'Legal and governance expert ensuring every operation meets the highest ethical and regulatory standards.' },
            { img: IMG.p4, name: 'Dr. Kwame Osei', role: 'Head of Practitioner Standards', bio: 'Clinical psychologist developing the framework for practitioner verification and member safety.' },
          ].map(p => (
            <div className="practitioner-card" key={p.name}>
              <img src={p.img} alt={p.name} className="practitioner-card-img" />
              <div className="practitioner-card-body">
                <h4 dangerouslySetInnerHTML={{ __html: p.name }} />
                <div className="practitioner-card-specialty" dangerouslySetInnerHTML={{ __html: p.role }} />
                <p>{p.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   SERVICES PAGE
═══════════════════════════════════════════ */
function Services() {
  const services = [
    { img: IMG.wealth, icon: <TrendingUp size={20} />, title: 'Wealth Empowerment', desc: 'Comprehensive financial literacy, investment strategy workshops, debt elimination frameworks, and generational wealth planning for individuals and families at every income level.', link: '/services/wealth-empowerment' },
    { img: IMG.wellness, icon: <Heart size={20} />, title: 'Holistic Health', desc: 'Integrated wellness programs combining evidence-based nutrition guidance, movement practices, mental health support, and spiritual grounding for whole-body transformation.', link: '/services/holistic-health' },
    { img: IMG.community, icon: <Users size={20} />, title: 'Happiness Community', desc: 'A curated, moderated community space where members share victories, support each other through challenges, and build authentic relationships centered on mutual growth.', link: '/services/happiness-community' },
    { img: IMG.coaching, icon: <Star size={20} />, title: 'Coaching &amp; Mentoring', desc: 'Personalized coaching with certified practitioners who meet you where you are and guide you through life transitions with evidence-based methods and deep human compassion.', link: '/services/coaching-mentoring' },
    { img: IMG.education, icon: <BookOpen size={20} />, title: 'Education &amp; Workshops', desc: 'Structured learning tracks, live workshops, and a growing library of resources covering personal finance, wellness science, leadership development, and practical life skills.', link: '/services/education-workshops' },
    { img: IMG.care, icon: <Shield size={20} />, title: 'Practitioner-Supported Care', desc: 'Access to our carefully vetted network of health, wellness, and financial practitioners who deliver individualized care plans within our ethics-first framework.', link: '/services/practitioner-supported-care' },
  ];

  return (
    <Layout>
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: `url(${IMG.wellness})` }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="eyebrow">Our Services</span>
          <div className="gold-divider" />
          <h1>Everything You Need<br /><em>to Flourish</em></h1>
          <p>Six interconnected service domains designed to transform every dimension of your well-being — financial, physical, emotional, and communal.</p>
        </div>
      </div>
      <section className="section">
        <div className="services-grid">
          {services.map(s => (
            <Link to={s.link} className="service-card" key={s.title}>
              <img src={s.img} alt={s.title} className="service-card-img" />
              <div className="service-card-body">
                <div className="service-card-icon">{s.icon}</div>
                <h3 dangerouslySetInnerHTML={{ __html: s.title }} />
                <p>{s.desc}</p>
                <div className="service-card-link">Explore Service <ChevronRight size={14} /></div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   MEMBERSHIP PAGE
═══════════════════════════════════════════ */
function Membership() {
  const loc = useLocation();
  const isApply = loc.pathname.includes('/apply');

  if (isApply) return <MembershipApply />;

  return (
    <Layout>
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: `url(${IMG.members})` }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="eyebrow">Membership</span>
          <div className="gold-divider" />
          <h1>Find Your<br /><em>Membership Path</em></h1>
          <p>Every tier is designed to meet you where you are and grow with you. No barriers — just community, wisdom, and support.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-header centered">
          <span className="eyebrow">How It Works</span>
          <div className="gold-divider centered" />
          <h2>Your Journey Begins Here</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, marginBottom: 80 }}>
          {[
            { num: '01', title: 'Choose Your Tier', desc: 'Select the membership level that aligns with your goals and current needs.' },
            { num: '02', title: 'Complete Your Profile', desc: 'Tell us about yourself so we can match you with the right practitioners and programs.' },
            { num: '03', title: 'Join the Community', desc: 'Get instant access to resources, community forums, and your member dashboard.' },
            { num: '04', title: 'Transform Together', desc: 'Attend sessions, track your progress, and grow alongside thousands of fellow members.' },
          ].map(s => (
            <div key={s.num} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '4rem', fontWeight: 300, color: 'var(--gold)', lineHeight: 1, opacity: 0.4, marginBottom: 12 }}>{s.num}</div>
              <h3 style={{ marginBottom: 10 }}>{s.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="membership-grid">
          {[
            { tier: 'Foundation', name: 'Explorer', price: 'Free', period: 'forever', desc: 'Start your journey with open access to community resources and educational content.', features: ['Community Forum Access', 'Monthly Newsletter', 'Free Resource Library', 'Event Invitations', 'Basic Wellness Guides'], featured: false },
            { tier: 'Core', name: 'Member', price: '$49', period: 'per month', desc: 'The full experience — practitioners, programs, and priority access to all platform features.', features: ['All Explorer Benefits', 'Practitioner Directory', '4 Group Sessions / Month', 'Workshop Discounts 30%', 'Member Dashboard', 'Progress Tracking', 'Accountability Partner'], featured: true },
            { tier: 'Elite', name: 'Guardian', price: '$149', period: 'per month', desc: 'Unlimited access, personal coaching, governance rights, and exclusive community experiences.', features: ['All Member Benefits', 'Monthly 1-on-1 Coaching', 'Priority Practitioner Access', 'Governance Voting Rights', 'Exclusive Retreats', 'Annual Strategy Session', 'Direct Trustee Access'], featured: false },
          ].map(m => (
            <div className={`membership-card${m.featured ? ' featured' : ''}`} key={m.name}>
              <div className="membership-tier">{m.tier}</div>
              <h3>{m.name}</h3>
              <p style={{ fontSize: 13, opacity: 0.7, margin: '8px 0' }}>{m.desc}</p>
              <div className="price">{m.price}</div>
              <div className="period">{m.period}</div>
              <ul className="membership-features">
                {m.features.map(f => (<li key={f}><CheckCircle size={16} /><span>{f}</span></li>))}
              </ul>
              <Link to="/membership/apply" className={m.featured ? 'btn-primary' : 'btn-outline'}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                  ...(m.featured ? {} : { borderColor: 'var(--gold)', color: 'var(--gold-dark)' }) }}>
                Get Started <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}

function MembershipApply() {
  return (
    <Layout>
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: `url(${IMG.members})` }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="eyebrow">Apply Now</span>
          <div className="gold-divider" />
          <h1>Start Your<br /><em>Transformation</em></h1>
          <p>Complete this short application and our team will reach out within 24 hours to welcome you into the community.</p>
        </div>
      </div>
      <section className="section section-dark">
        <div className="contact-grid" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="contact-info">
            <span className="eyebrow">Membership Application</span>
            <div className="gold-divider" />
            <h2>We're Honored You're Here</h2>
            <p>Becoming a member means joining a community of people committed to growing — financially, physically, and spiritually. We can't wait to meet you.</p>
            {[
              { icon: <CheckCircle size={20} />, title: 'Instant Access', desc: 'Get into the community forum and resource library the same day' },
              { icon: <Shield size={20} />, title: 'Safe &amp; Private', desc: 'Your information is governed under our strict privacy policy' },
              { icon: <Users size={20} />, title: 'Real Community', desc: 'Connect with members who share your goals and values' },
            ].map(i => (
              <div className="contact-detail" key={i.title}>
                <div className="contact-detail-icon">{i.icon}</div>
                <div>
                  <h4 dangerouslySetInnerHTML={{ __html: i.title }} />
                  <p dangerouslySetInnerHTML={{ __html: i.desc }} />
                </div>
              </div>
            ))}
          </div>
          <div className="contact-form">
            <h3>Membership Application</h3>
            <p>Fill out your details below — no commitment required for the free Explorer tier.</p>
            <div className="form-row">
              <div className="form-group"><label>First Name</label><input type="text" placeholder="Jane" /></div>
              <div className="form-group"><label>Last Name</label><input type="text" placeholder="Smith" /></div>
            </div>
            <div className="form-group"><label>Email Address</label><input type="email" placeholder="jane@example.com" /></div>
            <div className="form-group"><label>Phone Number</label><input type="tel" placeholder="+1 (555) 000-0000" /></div>
            <div className="form-group">
              <label>Membership Tier</label>
              <select>
                <option>Explorer (Free)</option>
                <option>Member ($49/month)</option>
                <option>Guardian ($149/month)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Primary Goal</label>
              <select>
                <option>Financial Freedom</option>
                <option>Holistic Health &amp; Wellness</option>
                <option>Community &amp; Connection</option>
                <option>Personal Development</option>
                <option>All of the Above</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tell Us About Yourself</label>
              <textarea placeholder="Share what brings you to Infinite Wealth & Well-being..." />
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Submit Application <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   PRACTITIONERS PAGE
═══════════════════════════════════════════ */
function Practitioners() {
  return (
    <Layout>
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: `url(${IMG.coaching})` }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="eyebrow">Our Practitioners</span>
          <div className="gold-divider" />
          <h1>Verified Experts.<br /><em>Genuine Care.</em></h1>
          <p>Every practitioner in our network is rigorously vetted, ethically committed, and genuinely passionate about your transformation.</p>
        </div>
      </div>

      <section className="section section-cream">
        <div className="section-header centered">
          <span className="eyebrow">Meet Our Team</span>
          <div className="gold-divider centered" />
          <h2>Practitioners Ready to Serve You</h2>
        </div>
        <div className="practitioners-grid">
          {[
            { img: IMG.p1, name: 'Dr. Amelia Foster', specialty: 'Holistic Health Coach', bio: 'Board-certified integrative medicine physician specializing in mind-body wellness protocols and chronic stress reversal.', verified: true },
            { img: IMG.p2, name: 'James Okafor, CFP', specialty: 'Wealth Strategist', bio: 'Certified Financial Planner with 15 years guiding families from debt to multi-generational wealth through disciplined strategy.', verified: true },
            { img: IMG.p3, name: 'Dr. Priya Sharma', specialty: 'Clinical Psychologist', bio: 'Trauma-informed therapist integrating CBT, mindfulness, and positive psychology to support emotional resilience and healing.', verified: true },
            { img: IMG.p4, name: 'Michael Torres', specialty: 'Life &amp; Business Coach', bio: 'ICF-certified executive coach who helps high-achievers align their career trajectory with their deepest personal values.', verified: true },
          ].map(p => (
            <div className="practitioner-card" key={p.name}>
              <img src={p.img} alt={p.name} className="practitioner-card-img" />
              <div className="practitioner-card-body">
                <h4 dangerouslySetInnerHTML={{ __html: p.name }} />
                <div className="practitioner-card-specialty" dangerouslySetInnerHTML={{ __html: p.specialty }} />
                <p>{p.bio}</p>
                {p.verified && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                    <CheckCircle size={14} /> Verified Practitioner
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-dark">
        <div className="section-header centered">
          <span className="eyebrow">For Practitioners</span>
          <div className="gold-divider centered" style={{ margin: '12px auto 20px' }} />
          <h2 style={{ color: 'white' }}>Join Our Practitioner Network</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>We're always looking for aligned, ethical, highly skilled practitioners who want to make a meaningful difference.</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          <Link to="/practitioners/apply" className="btn-primary">Apply as a Practitioner <ArrowRight size={16} /></Link>
          <Link to="/practitioners/standards" className="btn-outline">View Our Standards</Link>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   PROGRAMS PAGE
═══════════════════════════════════════════ */
function Programs() {
  return (
    <Layout>
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: `url(${IMG.prog1})` }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="eyebrow">Programs &amp; Events</span>
          <div className="gold-divider" />
          <h1>Experiences That<br /><em>Change Everything</em></h1>
          <p>Immersive programs, live events, and learning tracks designed to accelerate your growth at every level.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Featured Programs</span>
          <div className="gold-divider" />
          <h2>Current &amp; Upcoming</h2>
        </div>
        <div className="programs-list">
          {[
            {
              img: IMG.prog1, tag: 'Annual Event', title: 'Wealth &amp; Wellness Summit 2025',
              desc: 'Three days of transformational keynotes, workshops, networking, and community. The premier annual gathering for Infinite Wealth members and the broader wellness community.',
              date: 'Oct 14–16, 2025', duration: '3 Days', spots: '200 spots remaining',
            },
            {
              img: IMG.prog2, tag: 'Ongoing Program', title: 'The 90-Day Wealth Builder Track',
              desc: 'A structured, practitioner-guided 90-day program taking you from financial confusion to clear strategy. Weekly live sessions, daily exercises, and a personal accountability partner.',
              date: 'Starts monthly', duration: '90 Days', spots: 'Open enrollment',
            },
            {
              img: IMG.prog3, tag: 'Workshop Series', title: 'Holistic Health Immersion',
              desc: 'A 6-week deep dive into integrative health covering nutrition, movement, sleep, stress management, and mental resilience — guided by our certified health practitioners.',
              date: 'Rolling start', duration: '6 Weeks', spots: '24 spots per cohort',
            },
            {
              img: IMG.prog4, tag: 'Learning Track', title: 'Inner Peace &amp; Happiness Foundations',
              desc: 'An evidence-based curriculum drawing from positive psychology, mindfulness, and contemplative traditions to help you build a lasting foundation of genuine happiness.',
              date: 'Self-paced', duration: '8 Modules', spots: 'Unlimited access',
            },
          ].map(p => (
            <Link to="/programs/detail" className="program-item" key={p.title}>
              <img src={p.img} alt={p.title} className="program-item-img" />
              <div className="program-item-body">
                <span className="program-tag">{p.tag}</span>
                <h3 dangerouslySetInnerHTML={{ __html: p.title }} />
                <p>{p.desc}</p>
                <div className="program-meta">
                  <span><Calendar size={14} /> {p.date}</span>
                  <span><Clock size={14} /> {p.duration}</span>
                  <span><Users size={14} /> {p.spots}</span>
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
   RESOURCES PAGE
═══════════════════════════════════════════ */
function Resources() {
  return (
    <Layout>
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: `url(${IMG.education})` }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="eyebrow">Resources</span>
          <div className="gold-divider" />
          <h1>Knowledge Is<br /><em>the Foundation</em></h1>
          <p>Articles, guides, media, and tools to deepen your understanding and accelerate your transformation.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-header centered">
          <span className="eyebrow">Featured Articles</span>
          <div className="gold-divider centered" />
          <h2>Latest from Our Experts</h2>
        </div>
        <div className="resources-grid">
          {[
            { img: IMG.res1, tag: 'Wealth', title: '7 Wealth-Building Habits That Will Transform Your Financial Future', desc: 'Practical, proven strategies from certified financial planners — designed for real people with real budgets.', time: '8 min read' },
            { img: IMG.res2, tag: 'Wellness', title: 'The Mind-Body Connection: Science-Backed Practices for Lasting Health', desc: 'How integrating physical and mental wellness creates a compounding effect on your overall well-being.', time: '6 min read' },
            { img: IMG.res3, tag: 'Community', title: 'Building Authentic Connection in a Disconnected World', desc: 'Why community is the missing ingredient in most wellness journeys — and how to find yours.', time: '5 min read' },
            { img: IMG.about2, tag: 'Coaching', title: 'Finding the Right Coach: A Complete Guide for First-Timers', desc: 'What to look for, what to avoid, and how to get maximum value from a coaching relationship.', time: '10 min read' },
            { img: IMG.prog3, tag: 'Education', title: 'Financial Literacy at Every Age: Where to Start', desc: 'A life-stage guide to the financial concepts and skills that matter most at every decade.', time: '7 min read' },
            { img: IMG.prog4, tag: 'Happiness', title: 'The Science of Happiness: What Research Actually Shows', desc: 'Separating myth from evidence — the habits, practices, and mindsets that genuinely increase lasting joy.', time: '9 min read' },
          ].map(r => (
            <Link to="/resources/article" className="resource-card" key={r.title}>
              <img src={r.img} alt={r.title} className="resource-card-img" />
              <div className="resource-card-body">
                <span className="resource-tag">{r.tag}</span>
                <h4>{r.title}</h4>
                <p>{r.desc}</p>
                <div className="resource-read-time"><Clock size={12} /> {r.time}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   TRUST CENTER PAGE
═══════════════════════════════════════════ */
function TrustCenter() {
  return (
    <Layout>
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: `url(${IMG.trust})` }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="eyebrow">Trust Center</span>
          <div className="gold-divider" />
          <h1>Governed with<br /><em>Full Transparency</em></h1>
          <p>Every policy, record, and governance document — open for review. Trust is not claimed; it is demonstrated.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Governance &amp; Compliance</span>
          <div className="gold-divider" />
          <h2>Our Commitment to Accountability</h2>
          <p style={{ color: 'var(--text-muted)' }}>We operate under a rigorous governance framework that prioritizes member safety, financial transparency, and ethical conduct at every level of the organization.</p>
        </div>
        <div className="trust-grid">
          {[
            { icon: <FileText size={22} />, title: 'Manifesto &amp; Governance Charter', desc: 'Our founding document outlining organizational values, governance structure, decision-making processes, and member rights.', meta: 'Reviewed Annually' },
            { icon: <Shield size={22} />, title: 'Compliance Records', desc: 'A living record of all compliance actions, regulatory filings, and governance decisions — accessible to members in good standing.', meta: 'Updated Quarterly' },
            { icon: <Award size={22} />, title: '508(c)(1)(a) Tax-Exempt Reference', desc: 'Documentation and reference materials related to our organizational tax-exempt status and its implications for donations and operations.', meta: 'Professionally Reviewed' },
            { icon: <Lock size={22} />, title: 'Privacy &amp; Consent Policy', desc: 'A comprehensive, plain-language policy explaining exactly how member data is collected, stored, used, and protected.', meta: 'GDPR Aligned' },
            { icon: <MessageCircle size={22} />, title: 'Grievance Support Process', desc: 'A clear, safe, and confidential process for any member to raise concerns, file complaints, or request organizational review.', meta: '48h Response SLA' },
            { icon: <BarChart2 size={22} />, title: 'Audit Readiness Documentation', desc: 'Comprehensive financial and operational records prepared for external audit at any time, demonstrating our radical commitment to transparency.', meta: 'Independent Auditor' },
          ].map(t => (
            <Link to="/trust-center/document" className="trust-card" key={t.title}>
              <div className="trust-card-icon">{t.icon}</div>
              <div>
                <h4 dangerouslySetInnerHTML={{ __html: t.title }} />
                <p>{t.desc}</p>
                <div className="trust-card-meta"><CheckCircle size={12} /> {t.meta}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   DONATE PAGE
═══════════════════════════════════════════ */
function Donate() {
  const [amount, setAmount] = useState('$50');
  return (
    <Layout>
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: `url(${IMG.donate})` }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="eyebrow">Stewardship &amp; Giving</span>
          <div className="gold-divider" />
          <h1>Give the Gift of<br /><em>Infinite Well-being</em></h1>
          <p>Your generosity directly funds scholarships, community programs, and outreach that extends our mission to those who need it most.</p>
        </div>
      </div>

      <section className="section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 80, alignItems: 'start', maxWidth: 1100, margin: '0 auto' }}>
          <div>
            <span className="eyebrow">Your Impact</span>
            <div className="gold-divider" />
            <h2>Where Your Gift Goes</h2>
            {[
              { icon: <Award size={20} />, title: 'Scholarships', desc: '$25 provides one month of Explorer membership to someone who cannot afford it.' },
              { icon: <Users size={20} />, title: 'Community Outreach', desc: '$50 sponsors a community workshop session reaching up to 30 participants.' },
              { icon: <BookOpen size={20} />, title: 'Resource Development', desc: '$100 funds the creation of a new educational guide or wellness resource.' },
              { icon: <Globe size={20} />, title: 'Global Mission', desc: '$250 supports a full month of international community expansion programs.' },
            ].map(i => (
              <div className="value-item" key={i.title} style={{ marginBottom: 24 }}>
                <div className="value-icon">{i.icon}</div>
                <div className="value-text">
                  <h4>{i.title}</h4>
                  <p>{i.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="contact-form">
            <h3>Make a Contribution</h3>
            <p>Every gift, regardless of size, creates ripples of transformation in our community.</p>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Select Amount</label>
              <div className="donate-options" style={{ justifyContent: 'flex-start' }}>
                {['$25', '$50', '$100', '$250', 'Custom'].map(a => (
                  <button key={a} className={`donate-amount${amount === a ? ' active' : ''}`} onClick={() => setAmount(a)}>{a}</button>
                ))}
              </div>
            </div>
            {amount === 'Custom' && (
              <div className="form-group"><label>Custom Amount</label><input type="number" placeholder="Enter amount in USD" /></div>
            )}
            <div className="form-row">
              <div className="form-group"><label>First Name</label><input type="text" placeholder="Jane" /></div>
              <div className="form-group"><label>Last Name</label><input type="text" placeholder="Smith" /></div>
            </div>
            <div className="form-group"><label>Email</label><input type="email" placeholder="jane@example.com" /></div>
            <div className="form-group">
              <label>Dedication (Optional)</label>
              <input type="text" placeholder="In honor of..." />
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              <Gift size={18} /> Complete Donation
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
              <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
              Secure donation processing · Tax receipt provided · 100% mission-directed
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   CONTACT PAGE
═══════════════════════════════════════════ */
function Contact() {
  return (
    <Layout>
      <section className="section section-dark" style={{ paddingTop: 140 }}>
        <div className="contact-grid">
          <div className="contact-info">
            <span className="eyebrow">Get in Touch</span>
            <div className="gold-divider" />
            <h2>We'd Love to<br /><em>Hear From You</em></h2>
            <p>Whether you have a question about membership, practitioner opportunities, or our programs — we are here and we care about your journey.</p>
            {[
              { icon: <Mail size={20} />, title: 'Email Us', desc: 'hello@infinitewealthwellbeing.org' },
              { icon: <Phone size={20} />, title: 'Call Us', desc: '+1 (800) IW-WELLBEING' },
              { icon: <MapPin size={20} />, title: 'Our Location', desc: 'Serving members globally, with community hubs across North America' },
              { icon: <Clock size={20} />, title: 'Response Time', desc: 'We reply to all inquiries within 24 business hours' },
            ].map(d => (
              <div className="contact-detail" key={d.title}>
                <div className="contact-detail-icon">{d.icon}</div>
                <div>
                  <h4>{d.title}</h4>
                  <p>{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="contact-form">
            <h3>Send a Message</h3>
            <p>Fill out the form and a member of our team will be in touch within one business day.</p>
            <div className="form-row">
              <div className="form-group"><label>First Name</label><input type="text" placeholder="Jane" /></div>
              <div className="form-group"><label>Last Name</label><input type="text" placeholder="Smith" /></div>
            </div>
            <div className="form-group"><label>Email Address</label><input type="email" placeholder="jane@example.com" /></div>
            <div className="form-group"><label>Subject</label>
              <select>
                <option>General Inquiry</option>
                <option>Membership Questions</option>
                <option>Practitioner Application</option>
                <option>Donation / Stewardship</option>
                <option>Technical Support</option>
                <option>Partnership &amp; Collaboration</option>
              </select>
            </div>
            <div className="form-group"><label>Message</label><textarea placeholder="How can we help you?" /></div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Send Message <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   404 PAGE
═══════════════════════════════════════════ */
function NotFound() {
  return (
    <Layout>
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: '100px 6vw' }}>
        <span className="eyebrow">404 — Not Found</span>
        <div className="gold-divider centered" />
        <h1 style={{ marginBottom: 20 }}>Page Not Found</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 500, marginBottom: 40 }}>The page you are looking for doesn't exist or has been moved. Let's get you back on your journey.</p>
        <Link to="/" className="btn-primary">Return Home <ArrowRight size={16} /></Link>
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

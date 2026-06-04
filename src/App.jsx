import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Heart, Shield, Star, Users, BookOpen, Award, TrendingUp, Globe,
  ArrowRight, CheckCircle, ChevronRight, ChevronDown, Mail, Phone,
  MapPin, Clock, Leaf, Feather, Wind, Flame, Gift, Lock, Search,
  BarChart2, Briefcase, FileText, Layers, Activity, Sun, DollarSign
} from 'lucide-react';
import './styles.css';

const LEONARD = "https://base44.app/api/apps/69d42975b7b1794c3dc01661/files/mp/public/69d42975b7b1794c3dc01661/74db28267_file_30.jpg";

const I = {
  hero1:     'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1800&q=85',
  heroA:     'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
  heroB:     'https://images.unsplash.com/photo-1552581234-26160f608093?w=900&q=80',
  about1:    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80',
  about2:    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=700&q=80',
  wealth:    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=900&q=80',
  invest:    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&q=80',
  coaching:  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=900&q=80',
  education: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80',
  community: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80',
  advisory:  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&q=80',
  prayer:    'https://images.unsplash.com/photo-1510325081338-c5d95dfa1b39?w=900&q=80',
  healing:   'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&q=80',
  herbal:    'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=900&q=80',
  nature:    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80',
  sound:     'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80',
  retreat:   'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?w=900&q=80',
  trust:     'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80',
  summit:    'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?w=1200&q=80',
  members:   'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80',
  t1: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&q=80',
  t2: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=500&q=80',
  t3: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&q=80',
  t4: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
  prog1: 'https://images.unsplash.com/photo-1517637382994-f02da38c6728?w=800&q=80',
  prog2: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  prog3: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
  prog4: 'https://images.unsplash.com/photo-1510325081338-c5d95dfa1b39?w=800&q=80',
  res1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80',
  res2: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=700&q=80',
  res3: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&q=80',
  res4: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=700&q=80',
  res5: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700&q=80',
  res6: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=700&q=80',
};

/* ═══════════════════════════════════════════════════════
   MEGA-MENU NAVIGATION STRUCTURE
   One site — Wealth + Well-being + Ministry combined
═══════════════════════════════════════════════════════ */
const NAV = [
  {
    label: 'About',
    href: '/about',
    children: {
      cols: 2,
      featured: { label: 'Our Foundation', title: 'Infinite Wealth & Well-being', desc: 'One unified platform — wealth management, holistic well-being, and spiritual healing — guided by Leonard M. Diana.', href: '/about' },
      items: [
        { icon: <Heart />, label: 'Our Story', desc: 'Mission, vision & founding values', href: '/about' },
        { icon: <Users />, label: 'Leonard M. Diana', desc: 'Founder, advisor & minister', href: '/about#founder' },
        { icon: <Shield />, label: 'Governance & Trust', desc: 'How we operate with integrity', href: '/trust-center' },
        { icon: <Globe />, label: 'Impact & Community', desc: 'Hartford, CT & beyond', href: '/about#impact' },
      ],
    },
  },
  {
    label: 'Wealth',
    href: '/wealth',
    children: {
      cols: 3,
      items: [
        { icon: <TrendingUp />, label: 'Wealth Empowerment', desc: 'Financial strategy & planning', href: '/wealth/empowerment' },
        { icon: <BarChart2 />, label: 'Investment Strategy', desc: 'Portfolio & asset management', href: '/wealth/investment' },
        { icon: <Shield />, label: 'Asset Protection', desc: 'Defend what you build', href: '/wealth/protection' },
        { icon: <BookOpen />, label: 'Financial Education', desc: 'Workshops & learning tracks', href: '/wealth/education' },
        { icon: <Briefcase />, label: 'Business Wealth', desc: 'Entrepreneur financial strategy', href: '/wealth/business' },
        { icon: <Users />, label: 'Community Prosperity', desc: 'Group wealth-building programs', href: '/wealth/community' },
      ],
    },
  },
  {
    label: 'Well-being',
    href: '/wellbeing',
    children: {
      cols: 3,
      items: [
        { icon: <Feather />, label: 'Spiritual Healing & Prayer', desc: 'Faith-rooted restoration', href: '/wellbeing/spiritual', am: true },
        { icon: <Sun />, label: 'Energy & Body Wellness', desc: 'Somatic & integrative healing', href: '/wellbeing/energy', am: true },
        { icon: <Leaf />, label: 'Herbal & Natural Medicine', desc: 'Plant-based healing protocols', href: '/wellbeing/herbal', am: true },
        { icon: <Wind />, label: 'Sound & Vibrational Therapy', desc: 'Frequency & sacred sound', href: '/wellbeing/sound', am: true },
        { icon: <Heart />, label: 'Emotional & Mental Health', desc: 'Trauma-informed wholeness', href: '/wellbeing/mental', am: true },
        { icon: <Activity />, label: 'Holistic Coaching', desc: 'Whole-life guidance', href: '/wellbeing/coaching', am: true },
      ],
    },
  },
  {
    label: 'Ministry',
    href: '/ministry',
    children: {
      cols: 2,
      featured: { label: '508(c)(1)(a)', title: 'Spiritual Healing Ministry', desc: 'A legally recognized, faith-governed Private Holistic Association — open to all covenant members. Wholly sacred, wholly separate in purpose.', href: '/ministry', am: true },
      items: [
        { icon: <Feather />, label: 'Ministry Charter', desc: 'Founding values & governance', href: '/ministry', am: true },
        { icon: <Lock />, label: 'Private Holistic Assoc.', desc: 'PHA structure & member rights', href: '/ministry#pha', am: true },
        { icon: <Award />, label: 'Healing Programs', desc: 'Retreats, circles & ceremonies', href: '/programs', am: true },
        { icon: <Users />, label: 'Enter the Covenant', desc: 'Join the healing community', href: '/membership/apply', am: true },
      ],
    },
  },
  {
    label: 'Membership',
    href: '/membership',
    children: {
      cols: 2,
      items: [
        { icon: <Layers />, label: 'How It Works', desc: 'Your path to membership', href: '/membership' },
        { icon: <Award />, label: 'All Benefits', desc: 'Every tier explained', href: '/membership#benefits' },
        { icon: <CheckCircle />, label: 'Apply Now', desc: 'Start your application today', href: '/membership/apply' },
        { icon: <Shield />, label: 'Trust & Covenant', desc: 'Community standards', href: '/trust-center' },
      ],
    },
  },
  { label: 'Programs', href: '/programs' },
  { label: 'Resources', href: '/resources' },
  { label: 'Contact', href: '/contact' },
];

/* ─── NAVBAR ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const loc = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => { setMobileOpen(false); setExpanded(null); }, [loc]);

  return (
    <>
      <header className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/" className="nav-brand">
            <div className="nav-emblem-ring">
              <span className="nav-emblem-inner">IW</span>
            </div>
            <div className="nav-wordmark">
              <span className="nav-wordmark-primary">Infinite Wealth</span>
              <span className="nav-wordmark-secondary">&amp; Well-being</span>
            </div>
          </Link>

          <ul className="nav-menu">
            {NAV.map(item => (
              <li key={item.label} className="nav-item">
                {item.children ? (
                  <>
                    <Link to={item.href} className={`nav-link${loc.pathname.startsWith(item.href) ? ' active' : ''}`}>
                      {item.label}
                      <svg className="nav-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6l4 4 4-4" />
                      </svg>
                    </Link>
                    <div className="nav-dropdown">
                      {item.children.featured && (
                        <div style={{ padding: '4px 4px 0' }}>
                          <Link to={item.children.featured.href} className={`dropdown-featured${item.children.featured.am ? ' am-feat' : ''}`}>
                            <div className="dropdown-featured-label">{item.children.featured.label}</div>
                            <div className="dropdown-featured-title">{item.children.featured.title}</div>
                            <div className="dropdown-featured-desc">{item.children.featured.desc}</div>
                            <div className="dropdown-featured-cta">Explore <ChevronRight size={11} /></div>
                          </Link>
                          <div style={{ height: 6 }} />
                        </div>
                      )}
                      <div className={`dropdown-grid cols-${item.children.cols || 2}`}>
                        {item.children.items.map(child => (
                          <Link to={child.href} key={child.label} className={`dropdown-item${child.am ? ' am-item' : ''}`}>
                            <div className={`dropdown-item-icon${child.am ? ' am' : ''}`}>{child.icon}</div>
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
                  <Link to={item.href} className={`nav-link${loc.pathname === item.href ? ' active' : ''}`}>{item.label}</Link>
                )}
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <button className="nav-search-btn" aria-label="Search"><Search size={15} /></button>
            <Link to="/donate" className="btn btn-outline-gold btn-sm" style={{ display: 'flex' }}>Donate</Link>
            <Link to="/membership/apply" className="btn btn-gold btn-sm">Join Now</Link>
          </div>

          <button className={`nav-hamburger${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        {NAV.map(item => (
          <div className="mobile-nav-group" key={item.label}>
            {item.children ? (
              <>
                <button className="mobile-nav-link" onClick={() => setExpanded(expanded === item.label ? null : item.label)}>
                  {item.label}
                  <ChevronDown size={17} style={{ transform: expanded === item.label ? 'rotate(180deg)' : 'none', transition: 'transform .2s', opacity: 0.5 }} />
                </button>
                {expanded === item.label && (
                  <div className="mobile-sub-links">
                    {item.children.items.map(c => <Link to={c.href} key={c.label} className="mobile-sub-link">{c.label}</Link>)}
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
            Join Now <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <div className="footer-brand-logo">
              <div className="nav-emblem-ring" style={{ width: 40, height: 40, borderRadius: 10 }}>
                <span className="nav-emblem-inner" style={{ fontSize: 14 }}>IW</span>
              </div>
              <div>
                <div className="footer-brand-name">Infinite Wealth &amp; Well-being</div>
                <div className="footer-brand-sub">Wealth · Well-being · Ministry · Hartford CT</div>
              </div>
            </div>
            <p className="footer-about">
              One unified platform where financial empowerment, holistic well-being, and spiritual healing converge — led by Leonard M. Diana, Alignable Alliance Ambassador of Hartford, CT.
            </p>
            <div className="footer-socials">
              {[{l:'X',h:'#'},{l:'f',h:'#'},{l:'▶',h:'#'},{l:'📷',h:'#'}].map(s => (
                <a key={s.l} href={s.h} className="footer-social-btn">{s.l}</a>
              ))}
            </div>
          </div>
          <div className="footer-col">
            <h5>Wealth Services</h5>
            <ul>
              {[['Wealth Empowerment','/wealth/empowerment'],['Investment Strategy','/wealth/investment'],['Asset Protection','/wealth/protection'],['Financial Education','/wealth/education'],['Business Wealth','/wealth/business'],['Community Prosperity','/wealth/community']].map(([l,h]) => <li key={l}><Link to={h}>{l}</Link></li>)}
            </ul>
          </div>
          <div className="footer-col">
            <h5>Well-being &amp; Ministry</h5>
            <ul>
              {[['Spiritual Healing','/wellbeing/spiritual'],['Energy Wellness','/wellbeing/energy'],['Herbal Medicine','/wellbeing/herbal'],['Sound Therapy','/wellbeing/sound'],['Ministry Charter','/ministry'],['Enter Covenant','/membership/apply']].map(([l,h]) => <li key={l}><Link to={h}>{l}</Link></li>)}
            </ul>
          </div>
          <div className="footer-col">
            <h5>Community</h5>
            <ul>
              {[['About Us','/about'],['Membership','/membership'],['Programs','/programs'],['Resources','/resources'],['Donate','/donate'],['Contact','/contact'],['Trust Center','/trust-center']].map(([l,h]) => <li key={l}><Link to={h}>{l}</Link></li>)}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Infinite Wealth &amp; Well-being. All rights reserved.</span>
          <div style={{display:'flex',gap:18}}>
            {['Privacy Policy','Terms of Use','Member Agreement'].map(l => <a href="#" key={l}>{l}</a>)}
          </div>
          <div className="footer-cert-row">
            <Shield size={12}/>
            <span>508(c)(1)(a) Spiritual Healing Ministry · Hartford, CT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Layout({ children }) {
  return <><Navbar /><main>{children}</main><Footer /></>;
}

/* ─── PAGE HERO ─── */
function PageHero({ img, label, title, titleEm, sub, am = false }) {
  return (
    <div className="page-hero">
      {img && <div className="page-hero-bg" style={{ backgroundImage: `url(${img})` }} />}
      <div className="page-hero-overlay" />
      <div className="container">
        <div className="page-hero-content">
          <span className={`label label-light${am ? ' label-am' : ''}`}>{label}</span>
          <div className={`divider${am ? ' am' : ''}`}><div className="divider-line" /><div className="divider-dot" /></div>
          <h1>
            {title}
            {titleEm && <><br /><em style={{ fontStyle:'italic', background: am ? 'linear-gradient(135deg,#c4a8d8,#7e4da3)' : 'linear-gradient(135deg,#dfc068,#a97522)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{titleEm}</em></>}
          </h1>
          {sub && <p>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════ */
function Home() {
  const [donateAmt, setDonateAmt] = useState('$50');

  return (
    <Layout>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-media"><img src={I.hero1} alt="Infinite Wealth & Well-being" loading="eager" /></div>
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
              <span>Wealth · Well-being · Ministry · Hartford, CT</span>
            </div>
            <div className="hero-label-line" />
          </div>
          <h1 className="hero-headline">
            <span className="line-break">Infinite</span>
            <em>Wealth</em> <span style={{fontStyle:'normal'}}>&amp;</span>
            <span className="line-break"><em>Well-being</em></span>
          </h1>
          <p className="hero-body">
            One unified platform where financial empowerment, holistic health, and spiritual well-being converge — guided by Leonard M. Diana, Alignable Alliance Ambassador of Hartford, CT.
          </p>
          <div className="hero-cta-row">
            <Link to="/membership/apply" className="btn btn-gold btn-lg">Begin Your Journey <ArrowRight size={18} /></Link>
            <Link to="/about" className="btn btn-ghost btn-lg">Our Story</Link>
          </div>
          <div className="hero-metrics">
            {[
              {val:'5',sup:'K+',label:'Community Members'},
              {val:'12',sup:'+',label:'Healing Modalities'},
              {val:'$2.4',sup:'M',label:'Wealth Plans Guided'},
              {val:'98',sup:'%',label:'Satisfaction Rate'},
            ].map((m,i) => (
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
        <div className="hero-scroll-cue"><div className="scroll-line" /><span className="scroll-text">Scroll</span></div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-strip">
        <div className="marquee-inner" aria-hidden>
          {[...Array(2)].map((_,i) => (
            <React.Fragment key={i}>
              {['Wealth Empowerment','Investment Strategy','Asset Protection','Financial Education','Spiritual Healing','Herbal Medicine','Energy Wellness','Sound Therapy','Holistic Coaching','508(c)(1)(a) Ministry','Community Prosperity','Hartford CT'].map(t => (
                <span className="marquee-item" key={t}><span className="marquee-dot" />{t}</span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="section-xs">
        <div className="container">
          <div className="stats-row">
            {[{val:'5,200',sup:'',label:'Active Members'},{val:'120',sup:'+',label:'Wealth Plans Delivered'},{val:'12',sup:'+',label:'Healing Modalities'},{val:'98',sup:'%',label:'Member Satisfaction'}].map(s => (
              <div className="stat-cell" key={s.label}>
                <div className="stat-value">{s.val}<sup>{s.sup}</sup></div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUNDER / ABOUT SPLIT ── */}
      <section className="section">
        <div className="container">
          <div className="split">
            <div style={{position:'relative'}}>
              <div className="img-composition">
                <img src={LEONARD} alt="Leonard M. Diana — Founder" className="img-composition-main" />
                <img src={I.community} alt="Community" className="img-composition-accent" />
                <div className="img-composition-badge">
                  <div className="img-composition-badge-num">12+</div>
                  <div className="img-composition-badge-text">Years of<br />Service</div>
                </div>
              </div>
            </div>
            <div className="content-block">
              <span className="label">Our Founder</span>
              <div className="divider"><div className="divider-line" /><div className="divider-dot" /></div>
              <h2>Leonard M. Diana.<br /><em style={{fontStyle:'italic'}}>One Vision.</em></h2>
              <p>Leonard M. Diana is a wealth strategist, holistic health advocate, minister, and the formal Ambassador of the Alignable Alliance of Hartford, CT. He founded Infinite Wealth &amp; Well-being on a singular conviction: true prosperity encompasses your finances, your health, and your spirit — all together.</p>
              <p>This platform is the living expression of that conviction — one unified home where professional wealth management and sacred healing coexist, governed with integrity and open to all.</p>
              <div className="feature-list">
                {[
                  {icon:<TrendingUp size={18}/>,cls:'',title:'Wealth Advisory',desc:'Professional-grade financial strategy, investment planning, and asset protection for every income level.'},
                  {icon:<Heart size={18}/>,cls:'am',title:'Holistic Well-being',desc:'Integrative health, spiritual healing, and a 508(c)(1)(a) ministry — honoring the whole person.'},
                  {icon:<Users size={18}/>,cls:'sg',title:'Community Ambassador',desc:'Rooted in Hartford, CT — building bridges between wealth, wellness, and community.'},
                ].map(f => (
                  <div className="feature-item" key={f.title}>
                    <div className={`feature-icon${f.cls ? ' '+f.cls : ''}`}>{f.icon}</div>
                    <div className="feature-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:34}}>
                <Link to="/about" className="btn btn-dark">Full Story <ArrowRight size={16} /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WEALTH SERVICES BENTO ── */}
      <section className="section section-ivory">
        <div className="container">
          <div className="section-head centered">
            <span className="label">Wealth Services</span>
            <div className="divider center"><div className="divider-line"/><div className="divider-dot"/><div className="divider-line"/></div>
            <h2>Build, Protect &amp; Grow<br />Your Financial Future</h2>
            <p>Six wealth service domains — from financial literacy to investment strategy — designed to take you from where you are to where you deserve to be.</p>
          </div>
          <div className="bento-grid">
            <Link to="/wealth/empowerment" className="bento-card col-span-7">
              <img src={I.wealth} alt="Wealth Empowerment" className="bento-card-img short" />
              <div className="bento-card-body">
                <div className="bento-card-icon"><TrendingUp /></div>
                <h3>Wealth Empowerment</h3>
                <p>Comprehensive financial literacy, debt elimination, and generational wealth planning for individuals and families at every income level.</p>
                <div className="bento-arrow">Explore <ChevronRight size={14}/></div>
              </div>
            </Link>
            <Link to="/wealth/investment" className="bento-card col-span-5">
              <img src={I.invest} alt="Investment Strategy" className="bento-card-img short" />
              <div className="bento-card-body">
                <div className="bento-card-icon"><BarChart2 /></div>
                <h3>Investment Strategy</h3>
                <p>Portfolio construction, asset allocation, and long-term investment planning tailored to your goals and risk profile.</p>
                <div className="bento-arrow">Explore <ChevronRight size={14}/></div>
              </div>
            </Link>
            <Link to="/wealth/protection" className="bento-card col-span-4 dark">
              <div className="bento-card-body">
                <div className="bento-card-icon"><Shield /></div>
                <h3>Asset Protection</h3>
                <p>Legal structures, risk management, and estate planning that defend and preserve everything you've worked to build.</p>
                <div className="bento-arrow">Explore <ChevronRight size={14}/></div>
              </div>
            </Link>
            <Link to="/wealth/education" className="bento-card col-span-4">
              <img src={I.education} alt="Education" className="bento-card-img" />
              <div className="bento-card-body">
                <div className="bento-card-icon"><BookOpen /></div>
                <h3>Financial Education</h3>
                <p>Structured workshops, live seminars, and a growing library of wealth-building resources for every knowledge level.</p>
                <div className="bento-arrow">Explore <ChevronRight size={14}/></div>
              </div>
            </Link>
            <Link to="/wealth/community" className="bento-card col-span-4 gold-card">
              <div className="bento-card-body">
                <div className="bento-card-icon"><Users /></div>
                <h3>Community Prosperity</h3>
                <p>Group wealth-building cohorts, peer accountability, and community investment networks that accelerate everyone's progress.</p>
                <div className="bento-arrow">Explore <ChevronRight size={14}/></div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── WELL-BEING BENTO ── */}
      <section className="section section-ministry">
        <div className="container">
          <div className="section-head centered">
            <span className="label label-am">Well-being &amp; Ministry</span>
            <div className="divider center am"><div className="divider-line"/><div className="divider-dot"/><div className="divider-line"/></div>
            <h2>Heal, Restore &amp;<br />Thrive in Wholeness</h2>
            <p>Integrative healing services offered through our 508(c)(1)(a) Spiritual Healing Ministry and Private Holistic Association — honouring body, mind, and spirit.</p>
          </div>
          <div className="bento-grid">
            <Link to="/wellbeing/spiritual" className="bento-card col-span-7">
              <img src={I.prayer} alt="Spiritual Healing" className="bento-card-img short" />
              <div className="bento-card-body">
                <div className="bento-card-icon am"><Feather /></div>
                <h3>Spiritual Healing &amp; Prayer</h3>
                <p>Intercessory prayer ministry, prophetic encouragement, and spiritual restoration — faith-rooted, covenant-protected, and open to all members.</p>
                <div className="bento-arrow" style={{color:'var(--am-500)'}}>Explore <ChevronRight size={14}/></div>
              </div>
            </Link>
            <Link to="/wellbeing/herbal" className="bento-card col-span-5">
              <img src={I.herbal} alt="Herbal Medicine" className="bento-card-img short" />
              <div className="bento-card-body">
                <div className="bento-card-icon sg"><Leaf /></div>
                <h3>Herbal &amp; Natural Medicine</h3>
                <p>Plant-based healing protocols, nutritional guidance, and traditional natural remedies rooted in integrative medicine wisdom.</p>
                <div className="bento-arrow" style={{color:'var(--sg-500)'}}>Explore <ChevronRight size={14}/></div>
              </div>
            </Link>
            <Link to="/wellbeing/energy" className="bento-card col-span-4 am-card">
              <div className="bento-card-body">
                <div className="bento-card-icon"><Sun /></div>
                <h3>Energy &amp; Body Wellness</h3>
                <p>Reiki, breathwork, somatic healing, and body-based practices that release stored tension and restore your natural energetic balance.</p>
                <div className="bento-arrow">Explore <ChevronRight size={14}/></div>
              </div>
            </Link>
            <Link to="/wellbeing/sound" className="bento-card col-span-4">
              <img src={I.sound} alt="Sound Therapy" className="bento-card-img" />
              <div className="bento-card-body">
                <div className="bento-card-icon am"><Wind /></div>
                <h3>Sound &amp; Vibrational Therapy</h3>
                <p>Sacred sound ceremonies, frequency healing, and vibrational tools that harmonize the nervous system.</p>
                <div className="bento-arrow" style={{color:'var(--am-500)'}}>Explore <ChevronRight size={14}/></div>
              </div>
            </Link>
            <Link to="/wellbeing/coaching" className="bento-card col-span-4">
              <img src={I.healing} alt="Holistic Coaching" className="bento-card-img" />
              <div className="bento-card-body">
                <div className="bento-card-icon sg"><Heart /></div>
                <h3>Holistic Coaching</h3>
                <p>Whole-life coaching combining emotional wellness, spiritual formation, and practical life strategy for lasting transformation.</p>
                <div className="bento-arrow" style={{color:'var(--sg-500)'}}>Explore <ChevronRight size={14}/></div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SUMMIT BANNER ── */}
      <section className="section-xs">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner-bg" style={{backgroundImage:`url(${I.summit})`}} />
            <div className="cta-banner-glow" />
            <div className="cta-banner-content">
              <div className="cta-banner-text">
                <span className="label label-light">Signature Annual Event</span>
                <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
                <h2 style={{color:'white',fontSize:'clamp(1.8rem,3.5vw,2.8rem)'}}>Infinite Wealth &amp; Well-being<br />Summit 2026</h2>
                <p>Three transformative days of wealth strategy, holistic healing, spiritual renewal, and authentic community connection — Hartford, CT.</p>
                <Link to="/programs" className="btn btn-gold" style={{marginTop:28,display:'inline-flex'}}>Reserve Your Place <ArrowRight size={16}/></Link>
              </div>
              <div style={{flexShrink:0}}>
                <img src={I.nature} alt="Summit" style={{width:300,height:200,objectFit:'cover',borderRadius:20,opacity:0.72}} />
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
            <div className="divider center"><div className="divider-line"/><div className="divider-dot"/><div className="divider-line"/></div>
            <h2>Choose Your Path<br />to Transformation</h2>
            <p>Every tier gives you access to both wealth advisory services and well-being resources. Free to begin, always.</p>
          </div>
          <div className="membership-deck">
            {[
              {tier:'Foundation',name:'Explorer',price:'Free',period:'always · open to all',
               desc:'Start your journey — wealth resources, community, and open healing events.',
               features:['Community Forum Access','Monthly Newsletter','Wealth Resource Library','Open Healing Events','Prayer Request Portal'],
               btn:'btn-outline-gold',badge:null,featured:false},
              {tier:'Member',name:'Member',price:'$49',period:'/ month · cancel anytime',
               desc:'Full access — wealth advisory, healing services, coaching, and priority practitioner access.',
               features:['All Explorer Benefits','Wealth Advisory Access','4 Strategy Sessions / Month','Healing Service Access','Practitioner Booking','Progress Dashboard','Accountability Partner'],
               btn:'btn-gold',badge:{text:'Most Popular',cls:'gold'},featured:true},
              {tier:'Guardian',name:'Guardian',price:'$149',period:'/ month · cancel anytime',
               desc:'Unlimited — personal wealth coaching, 1-on-1 ministry, governance rights, and annual retreat.',
               features:['All Member Benefits','Monthly 1-on-1 Advisory','Monthly Ministry Session','Priority Access','Annual Retreat Included','Governance Voting Rights','Direct Access to Leonard'],
               btn:'btn-outline-gold',badge:null,featured:false},
            ].map(p => (
              <div className={`plan-card${p.featured ? ' featured' : ''}`} key={p.name}>
                {p.badge && <div className={`plan-badge ${p.badge.cls}`}>{p.badge.text}</div>}
                <div className="plan-tier">{p.tier}</div>
                <div className="plan-name">{p.name}</div>
                <p className="plan-desc">{p.desc}</p>
                <div className="plan-price">{p.price}</div>
                <div className="plan-period">{p.period}</div>
                <div className="plan-divider" />
                <ul className="plan-features">
                  {p.features.map(f => <li className="plan-feature" key={f}><CheckCircle size={14} className="plan-feature-icon"/>{f}</li>)}
                </ul>
                <Link to="/membership/apply" className={`btn ${p.btn} btn-lg`} style={{width:'100%',justifyContent:'center'}}>
                  Get Started <ArrowRight size={15}/>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section section-ivory">
        <div className="container">
          <div className="section-head centered">
            <span className="label">Member Stories</span>
            <div className="divider center"><div className="divider-line"/><div className="divider-dot"/><div className="divider-line"/></div>
            <h2>Lives Transformed</h2>
          </div>
          <div className="testimonial-grid">
            {[
              {text:"Leonard's wealth advisory helped my family move from financial confusion to a clear 10-year prosperity plan. We paid off $40,000 in debt and started investing — all in 18 months.",name:'Amara Johnson',role:'Wealth Member',img:I.t1},
              {text:"The spiritual healing and herbal protocols gave me back energy I hadn't felt in years. The integration of faith and natural medicine here is unlike anything I've experienced.",name:'Marcus Williams',role:'Guardian Member',img:I.t2,scripture:'Isaiah 53:5'},
              {text:"I came for the financial workshops and stayed for the community. Having both the wealth strategy and the holistic well-being resources in one place is genuinely life-changing.",name:'Dr. Priya S.',role:'Member since 2024',img:I.t3},
            ].map(t => (
              <div className="testimonial-card" key={t.name}>
                <div className="t-stars">{[...Array(5)].map((_,i) => <svg key={i} viewBox="0 0 20 20"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.92 5.33L10 13.17l-4.78 2.55.92-5.33L2.27 6.62l5.34-.78z"/></svg>)}</div>
                <div className="t-mark">"</div>
                <p className="t-text">{t.text}</p>
                {t.scripture && <div className="t-scripture">{t.scripture}</div>}
                <div className="t-author">
                  <img src={t.img} alt={t.name} className="t-avatar" />
                  <div><div className="t-name">{t.name}</div><div className="t-role">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DONATE ── */}
      <section className="section-xs section-dark">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner-bg" />
            <div className="cta-banner-glow" />
            <div className="cta-banner-content">
              <div className="cta-banner-text">
                <span className="label label-light">Stewardship</span>
                <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
                <h2 style={{color:'white'}}>Support the Mission</h2>
                <p>Your generosity funds financial literacy scholarships, free community healing events, and outreach extending our mission across Hartford and beyond.</p>
                <div className="donate-amounts">
                  {['$25','$50','$100','$250','Custom'].map(a => (
                    <button key={a} className={`donate-pill${donateAmt===a?' selected':''}`} onClick={()=>setDonateAmt(a)}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="cta-banner-actions">
                <Link to="/donate" className="btn btn-gold btn-lg"><Gift size={18}/> Donate {donateAmt!=='Custom'?donateAmt:'Now'}</Link>
                <Link to="/about" className="btn btn-ghost btn-lg" style={{justifyContent:'center'}}>How We Steward Funds</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════════
   ABOUT PAGE
═══════════════════════════════════════════════════════ */
function About() {
  return (
    <Layout>
      <PageHero img={I.about1} label="Our Story" title="One Vision." titleEm="Two Dimensions." sub="Infinite Wealth & Well-being is the unified expression of Leonard M. Diana's life work — bringing professional wealth management and sacred healing under one roof, for everyone." />
      <section className="section">
        <div className="container">
          <div className="split split-2-3">
            <div className="img-composition">
              <img src={LEONARD} alt="Leonard M. Diana" className="img-composition-main" />
            </div>
            <div className="content-block">
              <span className="label">Leonard M. Diana</span>
              <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2>Wealth Strategist. Minister. Ambassador.</h2>
              <p>Leonard M. Diana is the founder of Infinite Wealth &amp; Well-being, a certified wealth advisor, an ordained minister, and the formal Ambassador of the Alignable Alliance of Hartford, CT. For over a decade, Leonard has worked at the intersection of financial empowerment and whole-person healing — refusing to believe these worlds must be separate.</p>
              <p>His unique position — simultaneously guiding families toward financial freedom and walking community members through spiritual and holistic healing — is not accidental. It is the expression of a clear calling: <em>true abundance is never one-dimensional.</em></p>
              <p>Infinite Wealth &amp; Well-being is the platform he built to make that integrated vision accessible to everyone — not just the privileged few.</p>
              <div className="scripture-block">
                <p className="scripture-text">"I came that they may have life, and have it abundantly."</p>
                <cite className="scripture-ref">— John 10:10</cite>
              </div>
              <Link to="/contact" className="btn btn-gold" style={{marginTop:16}}>Connect with Leonard <ArrowRight size={15}/></Link>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="section section-dark">
        <div className="container">
          <div className="section-head centered">
            <span className="label">Our Foundation</span>
            <div className="divider center"><div className="divider-line"/><div className="divider-dot"/><div className="divider-line"/></div>
            <h2>Values That Govern Everything</h2>
            <p>Every service, every relationship, every program filtered through these six commitments.</p>
          </div>
          <div className="trust-grid">
            {[
              {icon:<TrendingUp/>,title:'Wealth for All',desc:'Professional-grade financial guidance must be accessible to everyone — not just the already-wealthy.',meta:'Core Mandate'},
              {icon:<Feather/>,cls:'am',title:'Faith-Governed',desc:'Our ministry dimension is rooted in scripture and faith — governed with the integrity of a 508(c)(1)(a) Spiritual Healing Ministry.',meta:'Ministry Standard',am:true},
              {icon:<Heart/>,title:'Whole-Person Care',desc:'We refuse to separate financial health from physical, emotional, and spiritual well-being. All are connected.',meta:'Integrated Approach'},
              {icon:<Shield/>,title:'Fiduciary Standard',desc:'Every wealth recommendation is made in your best interest — transparent, independent, and accountable.',meta:'Advisory Ethics'},
              {icon:<Lock/>,cls:'am',title:'Sacred Confidentiality',desc:'Ministry and healing matters are held in sacred covenant confidence — protected under our PHA agreement.',meta:'Covenant Protected',am:true},
              {icon:<Users/>,title:'Community First',desc:'Rooted in Hartford, CT — serving the community that shaped this vision, and expanding from there.',meta:'Ambassador-Led'},
            ].map(v => (
              <Link to="/trust-center" className={`trust-item${v.am?' am-item':''}`} key={v.title}>
                <div className={`trust-item-icon${v.am?' am':''}`}>{v.icon}</div>
                <div>
                  <h4>{v.title}</h4><p>{v.desc}</p>
                  <div className={`trust-meta${v.am?' am':''}`}><CheckCircle size={10}/>{v.meta}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════════
   WEALTH PAGE
═══════════════════════════════════════════════════════ */
function Wealth() {
  return (
    <Layout>
      <PageHero img={I.wealth} label="Wealth Services" title="Build. Protect." titleEm="Grow." sub="Six comprehensive wealth service domains — from foundational financial literacy to sophisticated investment strategy — designed to create lasting prosperity." />
      <section className="section">
        <div className="container">
          {[
            {img:I.wealth,tag:'Core Service',title:'Wealth Empowerment',desc:'Comprehensive financial literacy, debt elimination strategy, budgeting systems, and generational wealth planning. The foundation every financial journey needs — delivered in plain language, with real results.',date:'Ongoing',dur:'Personal',spots:'Open Access'},
            {img:I.invest,tag:'Advisory Service',title:'Investment Strategy',desc:'Portfolio construction, asset allocation, equity and alternative investment guidance — tailored to your goals, timeline, and risk tolerance. From your first investment to advanced portfolio management.',date:'Ongoing',dur:'1-on-1',spots:'Limited Spots'},
            {img:I.advisory,tag:'Protection',title:'Asset Protection',desc:'Legal structures, insurance strategy, estate planning, and risk management frameworks that defend everything you build from lawsuits, creditors, and unexpected life events.',date:'By Appointment',dur:'Custom',spots:'Open'},
            {img:I.education,tag:'Education',title:'Financial Education Workshops',desc:'Live and online workshops covering every dimension of personal finance — from budgeting basics to retirement planning, tax strategy, and investment fundamentals.',date:'Monthly',dur:'Various',spots:'Open Enrollment'},
            {img:I.coaching,tag:'Coaching',title:'Wealth Coaching',desc:"One-on-one wealth coaching sessions with Leonard and the advisory team — building your personalized wealth roadmap, eliminating obstacles, and keeping you accountable to your financial goals.",date:'Weekly/Monthly',dur:'60 min',spots:'Members Only'},
            {img:I.community,tag:'Community',title:'Community Prosperity Programs',desc:'Group wealth-building cohorts where members learn together, hold each other accountable, and build collective financial momentum. Strength in community.',date:'Rolling Start',dur:'90 Days',spots:'20 per cohort'},
          ].map(p => (
            <Link to="/wealth/empowerment" className="program-row" key={p.title}>
              <img src={p.img} alt={p.title} className="program-row-img" />
              <div className="program-row-body">
                <span className="program-type">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="program-meta">
                  <span><Clock size={13}/>{p.date}</span>
                  <span><BookOpen size={13}/>{p.dur}</span>
                  <span><Users size={13}/>{p.spots}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════════
   WELL-BEING PAGE
═══════════════════════════════════════════════════════ */
function WellBeing() {
  return (
    <Layout>
      <PageHero img={I.healing} label="Well-being Services" title="Heal. Restore." titleEm="Thrive." sub="Integrative healing services offered through our 508(c)(1)(a) Spiritual Healing Ministry and Private Holistic Association — honouring the whole person." am={true} />

      <section className="section-xs section-ministry">
        <div className="container">
          <div className="pma-notice">
            <div className="pma-icon"><Lock size={19}/></div>
            <div>
              <h4>Private Holistic Association — Member Access</h4>
              <p>Our well-being and healing services are offered through a 508(c)(1)(a) Spiritual Healing Ministry and Private Holistic Association (PHA). Full access is available to all covenant members. Membership is free to begin — <Link to="/membership/apply" style={{color:'var(--am-300)',fontWeight:700}}>enter the covenant here</Link>.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {[
            {img:I.prayer,tag:'Ministry Core',title:'Spiritual Healing & Prayer Ministry',desc:'Individual and group prayer ministry, intercessory healing, prophetic encouragement, and spiritual restoration. The sacred cornerstone of our well-being offerings — faith-governed, covenant-protected.',am:true},
            {img:I.herbal,tag:'Natural Medicine',title:'Herbal & Natural Medicine',desc:'Traditional and integrative herbal protocols, nutritional guidance, and plant-based healing remedies rooted in centuries of wisdom and modern integrative science.',am:false},
            {img:I.healing,tag:'Energy & Body',title:'Energy & Body Wellness',desc:'Reiki, breathwork, somatic healing, and body-based practices that release stored tension and trauma, restoring your body\'s natural energetic balance and vitality.',am:true},
            {img:I.sound,tag:'Vibrational',title:'Sound & Vibrational Therapy',desc:'Frequency healing, sacred sound ceremonies, tuning fork therapy, and vibrational healing tools that restore harmony to the nervous system and deepen inner rest.',am:true},
            {img:I.community,tag:'Community',title:'Community Healing Circles',desc:'Monthly group healing sessions where members share their journey, witness each other\'s healing, and receive collective ministry in a safe, covenant-held container.',am:false},
            {img:I.retreat,tag:'Immersive',title:'Guided Healing Retreats',desc:'Multi-day retreat experiences combining prayer, nature immersion, integrative healing practices, and sacred community — our most transformative offering.',am:true},
          ].map(p => (
            <Link to="/wellbeing/spiritual" className="program-row" key={p.title}>
              <img src={p.img} alt={p.title} className="program-row-img" />
              <div className="program-row-body">
                <span className={`program-type${p.am?' am':''}`}>{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="program-meta">
                  <span><CheckCircle size={13}/>Members Only</span>
                  <span><Shield size={13}/>PHA Protected</span>
                  <span><Heart size={13}/>Faith-Governed</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════════
   MINISTRY PAGE
═══════════════════════════════════════════════════════ */
function Ministry() {
  return (
    <Layout>
      <PageHero img={I.prayer} label="Our Ministry" title="508(c)(1)(a)" titleEm="Spiritual Healing Ministry." sub="A legally recognized, faith-governed Spiritual Healing Ministry and Private Holistic Association — operating within the Infinite Wealth & Well-being platform." am={true} />
      <section className="section">
        <div className="container">
          <div className="split split-3-2">
            <div className="content-block">
              <span className="label label-am">What is a 508(c)(1)(a)?</span>
              <div className="divider am"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2>A Legally Distinct<br /><em style={{fontStyle:'italic'}}>Sacred Structure</em></h2>
              <p>A 508(c)(1)(a) organization is a Mandatory Exception church/ministry under the Internal Revenue Code — automatically tax-exempt, operating under the Free Exercise Clause of the First Amendment.</p>
              <p>This designation allows us to operate a genuine faith-based healing ministry within this platform — not a commercial healthcare business. Our Private Holistic Association (PHA) further protects members under private contract law.</p>
              <p>The ministry dimension of Infinite Wealth &amp; Well-being is <strong>sacred in purpose</strong> and distinct in its governance — while operating under the same unified membership structure.</p>
              <div className="scripture-block" style={{marginTop:8}}>
                <p className="scripture-text">"Beloved, I pray that you may prosper in all things and be in health, just as your soul prospers."</p>
                <cite className="scripture-ref">— 3 John 1:2</cite>
              </div>
              <div className="feature-list" style={{marginTop:8}}>
                {[
                  {icon:<Shield size={17}/>,cls:'am',title:'Legally Separate in Governance',desc:'Ministry operations are governed by the Ministry Charter — faith-first, member-protected.'},
                  {icon:<Lock size={17}/>,cls:'am',title:'PHA Covenant Protection',desc:'All healing services operate under private contract law through the PHA agreement.'},
                  {icon:<Feather size={17}/>,cls:'sg',title:'Faith Governs All Ministry Work',desc:'Every healing service is offered in the context of faith, prayer, and covenant community.'},
                ].map(f => (
                  <div className="feature-item" key={f.title}>
                    <div className={`feature-icon ${f.cls}`}>{f.icon}</div>
                    <div className="feature-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img src={I.nature} alt="Ministry" style={{width:'100%',borderRadius:24,aspectRatio:'3/4',objectFit:'cover',boxShadow:'var(--shadow-lg)'}} />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════════
   MEMBERSHIP PAGE
═══════════════════════════════════════════════════════ */
function Membership() {
  const loc = useLocation();
  if (loc.pathname.includes('/apply')) return <MemberApply />;
  return (
    <Layout>
      <PageHero img={I.members} label="Membership" title="Find Your Path" titleEm="to Transformation." sub="One membership — full access to both wealth advisory services and well-being resources. Every tier meets you where you are." />
      <section className="section">
        <div className="container">
          <div className="membership-deck">
            {[
              {tier:'Foundation',name:'Explorer',price:'Free',period:'always · open to all',
               desc:'Begin your journey. Wealth resources, community, and open healing events.',
               features:['Community Forum Access','Monthly Newsletter','Wealth Resource Library','Open Healing Events','Prayer Request Portal','Basic Financial Guides'],
               btn:'btn-outline-gold',badge:null,featured:false},
              {tier:'Member',name:'Member',price:'$49',period:'/ month · cancel anytime',
               desc:'Full access — wealth advisory, healing services, coaching, and practitioner booking.',
               features:['All Explorer Benefits','Wealth Advisory Access','4 Strategy Sessions / Month','Healing Service Access','Practitioner Booking','Progress Dashboard','Accountability Partner','Retreat Discounts 30%'],
               btn:'btn-gold',badge:{text:'Most Popular',cls:'gold'},featured:true},
              {tier:'Guardian',name:'Guardian',price:'$149',period:'/ month · cancel anytime',
               desc:'Unlimited access — personal wealth coaching, 1-on-1 ministry, governance rights, and annual retreat.',
               features:['All Member Benefits','Monthly 1-on-1 Wealth Advisory','Monthly Ministry/Healing Session','Priority Practitioner Access','Annual Retreat Included','Governance Voting Rights','Direct Access to Leonard'],
               btn:'btn-outline-gold',badge:null,featured:false},
            ].map(p => (
              <div className={`plan-card${p.featured?' featured':''}`} key={p.name}>
                {p.badge && <div className={`plan-badge ${p.badge.cls}`}>{p.badge.text}</div>}
                <div className="plan-tier">{p.tier}</div>
                <div className="plan-name">{p.name}</div>
                <p className="plan-desc">{p.desc}</p>
                <div className="plan-price">{p.price}</div>
                <div className="plan-period">{p.period}</div>
                <div className="plan-divider" />
                <ul className="plan-features">
                  {p.features.map(f => <li className="plan-feature" key={f}><CheckCircle size={14} className="plan-feature-icon"/>{f}</li>)}
                </ul>
                <Link to="/membership/apply" className={`btn ${p.btn} btn-lg`} style={{width:'100%',justifyContent:'center'}}>
                  Get Started <ArrowRight size={15}/>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function MemberApply() {
  return (
    <Layout>
      <PageHero img={I.members} label="Apply Now" title="Your Journey" titleEm="Begins Here." sub="Complete this short form and our team will welcome you within 24 hours — with full access to both wealth and well-being resources." />
      <section className="section section-dark">
        <div className="container">
          <div className="contact-wrap">
            <div className="contact-side">
              <span className="label label-light">Application</span>
              <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2>We're Honored<br />You're Here</h2>
              <p>Membership gives you simultaneous access to professional wealth advisory and sacred healing resources — under one roof, governed with integrity.</p>
              {[
                {icon:<CheckCircle size={17}/>,t:'Same-Day Access',d:'Community, resources, and open events available immediately'},
                {icon:<Shield size={17}/>,t:'Fully Private',d:'Covenant and healing matters held in sacred confidence'},
                {icon:<Heart size={17}/>,t:'Free to Begin',d:'Explorer membership requires no payment or commitment'},
              ].map(i => (
                <div className="contact-detail-item" key={i.t}>
                  <div className="contact-detail-icon">{i.icon}</div>
                  <div className="contact-detail-text"><h5>{i.t}</h5><p>{i.d}</p></div>
                </div>
              ))}
            </div>
            <div className="contact-card">
              <h3>Membership Application</h3>
              <p>No commitment required for the free Explorer tier.</p>
              <div className="form-row2">
                <div className="field"><label>First Name</label><input type="text" placeholder="Your name" /></div>
                <div className="field"><label>Last Name</label><input type="text" placeholder="Last name" /></div>
              </div>
              <div className="field"><label>Email Address</label><input type="email" placeholder="your@email.com" /></div>
              <div className="field"><label>Membership Tier</label>
                <select><option>Explorer (Free)</option><option>Member ($49/month)</option><option>Guardian ($149/month)</option></select>
              </div>
              <div className="field"><label>Primary Interest</label>
                <select><option>Wealth & Financial Planning</option><option>Holistic Health & Healing</option><option>Spiritual Well-being & Ministry</option><option>Community & Connection</option><option>All of the Above</option></select>
              </div>
              <div className="field"><label>Tell Us About Yourself</label><textarea placeholder="Share what brings you here and what you're hoping to achieve..." /></div>
              <button className="btn btn-gold btn-lg" style={{width:'100%',justifyContent:'center'}}>Submit Application <ArrowRight size={16}/></button>
              <p style={{fontSize:12,color:'var(--text-faint)',textAlign:'center',marginTop:14,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Shield size={11}/> All applications held in complete confidence</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════════
   PROGRAMS PAGE
═══════════════════════════════════════════════════════ */
function Programs() {
  return (
    <Layout>
      <PageHero img={I.prog1} label="Programs & Events" title="Experiences That" titleEm="Change Everything." sub="Wealth programs, healing retreats, live events, and structured learning tracks — combining financial empowerment with holistic transformation." />
      <section className="section">
        <div className="container">
          {[
            {img:I.summit,tag:'Annual Event',title:'Infinite Wealth & Well-being Summit 2026',desc:'Three transformative days of wealth strategy sessions, holistic healing workshops, spiritual renewal, and community connection. Our flagship annual gathering — Hartford, CT.',date:'Oct 12–14, 2026',dur:'3 Days',spots:'200 spots — reserve early',am:false},
            {img:I.prog2,tag:'Wealth Program',title:'The 90-Day Wealth Builder Track',desc:"Leonard's signature 90-day program — from financial confusion to a clear, executable wealth strategy. Weekly advisor-led sessions, daily action steps, and a personal accountability partner throughout.",date:'Starts monthly',dur:'90 Days',spots:'Open enrollment',am:false},
            {img:I.retreat,tag:'Ministry Retreat',title:'Healing & Wholeness Retreat 2026',desc:'Three days of prayer ministry, integrative healing workshops, nature immersion, and sacred community. Our most immersive annual healing gathering — limited to 40 covenant members.',date:'August 2026 (TBD)',dur:'3 Days',spots:'40 covenant members',am:true},
            {img:I.prog3,tag:'Workshop Series',title:'Financial Foundations Intensive',desc:'A 6-week live workshop series covering budgeting, debt elimination, investment basics, tax strategy, and building your first wealth plan — led by Leonard and the advisory team.',date:'Rolling start',dur:'6 Weeks',spots:'24 per cohort',am:false},
            {img:I.prog4,tag:'Ministry Program',title:'Spirit, Mind & Body — 90-Day Wholeness Journey',desc:"Leonard's integrative 90-day program combining spiritual formation, holistic healing practices, and community covenant for deep, lasting transformation across every dimension of life.",date:'Starts monthly',dur:'90 Days',spots:'Open enrollment',am:true},
            {img:I.nature,tag:'Learning Track',title:'Financial Well-being & Life Prosperity',desc:'A self-paced learning track exploring the proven connection between financial security and overall life satisfaction — with practical tools to build both simultaneously.',date:'Self-paced',dur:'8 Modules',spots:'Unlimited access',am:false},
          ].map(p => (
            <Link to="/programs" className="program-row" key={p.title}>
              <img src={p.img} alt={p.title} className="program-row-img" />
              <div className="program-row-body">
                <span className={`program-type${p.am?' am':''}`}>{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="program-meta">
                  <span><Clock size={13}/>{p.date}</span>
                  <span><BookOpen size={13}/>{p.dur}</span>
                  <span><Users size={13}/>{p.spots}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════════
   RESOURCES PAGE
═══════════════════════════════════════════════════════ */
function Resources() {
  return (
    <Layout>
      <PageHero img={I.education} label="Resources" title="Knowledge Is" titleEm="the Foundation." sub="Articles, guides, and tools covering both wealth management and holistic well-being — freely available to all members." />
      <section className="section">
        <div className="container">
          <div className="article-grid">
            {[
              {img:I.res1,tag:'Wealth',title:'7 Wealth-Building Habits That Will Transform Your Financial Future',desc:'Practical, proven strategies from certified financial planners designed for real people with real budgets.',time:'8 min'},
              {img:I.res2,tag:'Investing',title:'The Compounding Effect: Why Starting Now Is Everything',desc:'How time in the market — not timing the market — creates the compounding wealth effect that separates the prosperous from everyone else.',time:'6 min'},
              {img:I.res3,tag:'Protection',title:'Asset Protection 101: Shielding Your Wealth from Risk',desc:'Legal structures, insurance strategies, and planning tools that protect what you build from lawsuits, creditors, and unexpected events.',time:'5 min'},
              {img:I.res4,tag:'Healing',title:'Herbal Medicine Foundations: Five Plants That Heal',desc:'An introduction to plant-based healing — five foundational herbs, their applications, and how they support the body\'s natural capacity for restoration.',time:'7 min'},
              {img:I.res5,tag:'Ministry',title:'What the Bible Says About Divine Health & Prosperity',desc:'Scriptural foundations for whole-person healing — what God\'s word says about financial abundance and physical restoration together.',time:'9 min'},
              {img:I.res6,tag:'Well-being',title:'Financial Well-being: How Money Peace Creates Life Peace',desc:'The research-backed connection between financial security and overall life satisfaction — and the practical steps to get there.',time:'6 min'},
            ].map(a => (
              <Link to="/resources" className="article-card" key={a.title}>
                <div className="article-img-wrap"><img src={a.img} alt={a.title} className="article-img" /></div>
                <div className="article-body">
                  <span className={`article-tag${['Healing','Ministry','Well-being'].includes(a.tag)?' am':''}`}>{a.tag}</span>
                  <h4>{a.title}</h4>
                  <p>{a.desc}</p>
                  <div className="article-foot">
                    <span><Clock size={11}/>{a.time} read</span>
                    <span style={{color:'var(--gold-600)',fontWeight:600,fontSize:11.5}}>Read <ChevronRight size={11}/></span>
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

/* ═══════════════════════════════════════════════════════
   TRUST CENTER
═══════════════════════════════════════════════════════ */
function TrustCenter() {
  return (
    <Layout>
      <PageHero img={I.trust} label="Trust Center" title="Governed with" titleEm="Full Transparency." sub="Every policy, charter, and governance record — open to all members. Trust is demonstrated through consistent action, not claimed through words." />
      <section className="section section-dark">
        <div className="container">
          <div className="section-head">
            <span className="label">Governance & Accountability</span>
            <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
            <h2>Our Commitment to Accountability</h2>
            <p>We operate under a rigorous governance framework covering both wealth advisory ethics and ministry covenant standards — with full transparency to every member.</p>
          </div>
          <div className="trust-grid">
            {[
              {icon:<FileText/>,title:'Organization Charter',desc:'Our founding document — values, governance structure, decision-making processes, and all member rights across both wealth and ministry dimensions.',meta:'Reviewed Annually'},
              {icon:<Shield/>,title:'Advisory Ethics Code',desc:'Full fiduciary standard documentation — how every wealth recommendation is made, disclosed, and verified to be in the member\'s best interest.',meta:'Fiduciary Standard'},
              {icon:<Feather/>,title:'Ministry Covenant Charter',desc:'The complete charter governing our 508(c)(1)(a) Spiritual Healing Ministry — faith governance, practitioner standards, and covenant member rights.',meta:'508(c)(1)(a) Governed',am:true},
              {icon:<Lock/>,title:'Privacy & Consent Policy',desc:'Plain-language policy explaining exactly how member data, ministry communications, and healing session details are held and protected.',meta:'GDPR + Covenant Aligned',am:true},
              {icon:<Award/>,title:'Practitioner Standards',desc:'Verification requirements, ethical codes, and accountability frameworks governing every advisor and healing practitioner in our network.',meta:'Independent Review'},
              {icon:<Users/>,title:'Grievance & Support Process',desc:'A clear, confidential process for any member to raise concerns about wealth services, ministry matters, or any aspect of their membership.',meta:'48h Response SLA'},
            ].map(v => (
              <Link to="/trust-center" className={`trust-item${v.am?' am-item':''}`} key={v.title}>
                <div className={`trust-item-icon${v.am?' am':''}`}>{v.icon}</div>
                <div>
                  <h4>{v.title}</h4><p>{v.desc}</p>
                  <div className={`trust-meta${v.am?' am':''}`}><CheckCircle size={10}/>{v.meta}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════════
   DONATE PAGE
═══════════════════════════════════════════════════════ */
function Donate() {
  const [amt, setAmt] = useState('$50');
  return (
    <Layout>
      <PageHero img={I.community} label="Stewardship & Giving" title="Invest in the" titleEm="Community." sub="Your gift directly funds financial literacy scholarships, free community healing events, and outreach extending this mission across Hartford and beyond." />
      <section className="section">
        <div className="container">
          <div className="contact-wrap" style={{gridTemplateColumns:'1fr 1.4fr'}}>
            <div className="content-block">
              <span className="label">Your Impact</span>
              <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2>Where Every Dollar Goes</h2>
              <div className="feature-list">
                {[
                  {icon:<Award size={17}/>,cls:'',title:'Financial Scholarships',d:'$25 provides one month of full membership to a Hartford community member who cannot afford it.'},
                  {icon:<Users size={17}/>,cls:'',title:'Free Community Workshops',d:'$50 sponsors a free financial literacy or healing workshop reaching up to 30 local residents.'},
                  {icon:<Feather size={17}/>,cls:'am',title:'Ministry Resources',d:'$100 funds the creation of a new healing guide, educational resource, or ministry program tool.'},
                  {icon:<Globe size={17}/>,cls:'',title:'Outreach Expansion',d:'$250 supports a full month of community outreach programs extending beyond Hartford.'},
                ].map(i => (
                  <div className="feature-item" key={i.title}>
                    <div className={`feature-icon${i.cls?' '+i.cls:''}`}>{i.icon}</div>
                    <div className="feature-text"><h4>{i.title}</h4><p>{i.d}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="contact-card">
              <h3>Make a Contribution</h3>
              <p>Every gift — regardless of size — creates lasting impact in our community.</p>
              <div style={{marginBottom:18}}>
                <label style={{display:'block',fontSize:10.5,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:9}}>Select Amount</label>
                <div className="donate-amounts" style={{marginTop:0}}>
                  {['$25','$50','$100','$250','Custom'].map(a => (
                    <button key={a} className={`donate-pill${amt===a?' selected':''}`} onClick={()=>setAmt(a)} style={{background:amt===a?'linear-gradient(135deg,var(--gold-400),var(--gold-600))':'rgba(196,146,42,0.06)',border:amt===a?'none':'1.5px solid var(--border-dark)',color:amt===a?'white':'var(--gold-700)'}}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="form-row2">
                <div className="field"><label>First Name</label><input type="text" placeholder="Jane" /></div>
                <div className="field"><label>Last Name</label><input type="text" placeholder="Smith" /></div>
              </div>
              <div className="field"><label>Email</label><input type="email" placeholder="jane@example.com" /></div>
              <div className="field"><label>Dedication (Optional)</label><input type="text" placeholder="In honor / memory of..." /></div>
              <button className="btn btn-gold btn-lg" style={{width:'100%',justifyContent:'center',marginTop:8}}>
                <Gift size={17}/> Complete Donation
              </button>
              <p style={{fontSize:12,color:'var(--text-faint)',textAlign:'center',marginTop:13,display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                <Shield size={11}/> Secure · Tax receipt provided · 100% mission-directed
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════════
   CONTACT PAGE
═══════════════════════════════════════════════════════ */
function Contact() {
  return (
    <Layout>
      <section className="section section-dark" style={{paddingTop:'calc(var(--nav-height) + 80px)'}}>
        <div className="container">
          <div className="contact-wrap">
            <div className="contact-side">
              <span className="label label-light">Get in Touch</span>
              <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2>We'd Love to<br /><em style={{fontStyle:'italic'}}>Hear From You</em></h2>
              <p>Whether you have a question about membership, want to book a wealth advisory session, need prayer, or want to connect with a healing practitioner — we are here and we genuinely care.</p>
              {[
                {icon:<Mail size={17}/>,t:'Email Us',d:'hello@infinitewealthwellbeing.org'},
                {icon:<Phone size={17}/>,t:'Call Us',d:'Hartford, CT — 401-702-2460'},
                {icon:<MapPin size={17}/>,t:'Location',d:'Hartford, CT — serving locally and online'},
                {icon:<Clock size={17}/>,t:'Response Time',d:'All inquiries answered within 24 business hours'},
              ].map(d => (
                <div className="contact-detail-item" key={d.t}>
                  <div className="contact-detail-icon">{d.icon}</div>
                  <div className="contact-detail-text"><h5>{d.t}</h5><p>{d.d}</p></div>
                </div>
              ))}
            </div>
            <div className="contact-card">
              <h3>Send a Message</h3>
              <p>A member of our team will respond personally within one business day.</p>
              <div className="form-row2">
                <div className="field"><label>First Name</label><input type="text" placeholder="Jane" /></div>
                <div className="field"><label>Last Name</label><input type="text" placeholder="Smith" /></div>
              </div>
              <div className="field"><label>Email Address</label><input type="email" placeholder="your@email.com" /></div>
              <div className="field"><label>Subject</label>
                <select>
                  <option>General Inquiry</option>
                  <option>Wealth Advisory Inquiry</option>
                  <option>Membership Questions</option>
                  <option>Prayer Request</option>
                  <option>Healing Service Booking</option>
                  <option>Ministry Partnership</option>
                  <option>Retreat Information</option>
                  <option>Donation / Stewardship</option>
                  <option>Technical Support</option>
                </select>
              </div>
              <div className="field"><label>Message</label><textarea placeholder="How can we serve you?" /></div>
              <button className="btn btn-gold btn-lg" style={{width:'100%',justifyContent:'center'}}>Send Message <ArrowRight size={16}/></button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════════
   ROUTER
═══════════════════════════════════════════════════════ */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/about"              element={<About />} />
        <Route path="/wealth"             element={<Wealth />} />
        <Route path="/wealth/:slug"       element={<Wealth />} />
        <Route path="/wellbeing"          element={<WellBeing />} />
        <Route path="/wellbeing/:slug"    element={<WellBeing />} />
        <Route path="/ministry"           element={<Ministry />} />
        <Route path="/membership"         element={<Membership />} />
        <Route path="/membership/:slug"   element={<Membership />} />
        <Route path="/programs"           element={<Programs />} />
        <Route path="/programs/:slug"     element={<Programs />} />
        <Route path="/resources"          element={<Resources />} />
        <Route path="/resources/:slug"    element={<Resources />} />
        <Route path="/trust-center"       element={<TrustCenter />} />
        <Route path="/trust-center/:slug" element={<TrustCenter />} />
        <Route path="/donate"             element={<Donate />} />
        <Route path="/contact"            element={<Contact />} />
        <Route path="*"                   element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);

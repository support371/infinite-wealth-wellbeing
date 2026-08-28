import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Heart, Shield, Star, Users, BookOpen, Award, TrendingUp, Globe,
  ArrowRight, CheckCircle, ChevronRight, ChevronDown, Mail, Phone,
  MapPin, Clock, Leaf, Feather, Wind, Gift, Lock,
  BarChart2, Briefcase, FileText, Layers, Activity, Sun, DollarSign,
  Home as HomeIcon, AlertCircle, Zap, Target, PieChart, UserCheck
} from 'lucide-react';
import './styles.css';

const LEONARD = "https://base44.app/api/apps/69d42975b7b1794c3dc01661/files/mp/public/69d42975b7b1794c3dc01661/74db28267_file_30.jpg";

const I = {
  hero1:     'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1800&q=85',
  heroA:     'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
  heroB:     'https://images.unsplash.com/photo-1552581234-26160f608093?w=900&q=80',
  about1:    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=85',
  about2:    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=900&q=80',
  wealth:    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1400&q=85',
  invest:    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1400&q=85',
  protect:   'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1400&q=85',
  educate:   'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=85',
  business:  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1400&q=85',
  community: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&q=85',
  coaching:  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1400&q=85',
  prayer:    'https://images.unsplash.com/photo-1510325081338-c5d95dfa1b39?w=1400&q=85',
  healing:   'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1400&q=85',
  herbal:    'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=1400&q=85',
  nature:    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400&q=85',
  sound:     'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1400&q=85',
  retreat:   'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?w=1400&q=85',
  energy:    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=85',
  mental:    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1400&q=85',
  trust:     'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1400&q=85',
  summit:    'https://images.unsplash.com/photo-1517637382994-f02da38c6728?w=1400&q=85',
  members:   'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&q=85',
  prog2:     'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&q=80',
  prog3:     'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&q=80',
  t1: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&q=80',
  t2: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=500&q=80',
  t3: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&q=80',
};

/* ═══════════════════════════════════════════════
   MEGA-MENU — every item has a real href
═══════════════════════════════════════════════ */
const NAV = [
  {
    label: 'About',
    href: '/about',
    children: [
      { icon: <Heart size={15}/>, label: 'Our Story',           desc: 'Mission, vision & founding values',    href: '/about' },
      { icon: <Users size={15}/>, label: 'Leonard M. Diana',    desc: 'Founder, advisor & minister',          href: '/about/founder' },
      { icon: <Shield size={15}/>,label: 'Governance & Trust',  desc: 'How we operate with integrity',        href: '/trust-center' },
      { icon: <Globe size={15}/>, label: 'Community Impact',    desc: 'Hartford, CT & beyond',                href: '/about/impact' },
    ],
  },
  {
    label: 'Wealth',
    href: '/wealth',
    children: [
      { icon: <TrendingUp size={15}/>,  label: 'Wealth Empowerment',    desc: 'Financial strategy & planning',         href: '/wealth/empowerment' },
      { icon: <BarChart2 size={15}/>,   label: 'Investment Strategy',   desc: 'Portfolio & asset management',          href: '/wealth/investment' },
      { icon: <Shield size={15}/>,      label: 'Asset Protection',      desc: 'Defend what you build',                 href: '/wealth/protection' },
      { icon: <BookOpen size={15}/>,    label: 'Financial Education',   desc: 'Workshops & learning tracks',           href: '/wealth/education' },
      { icon: <Briefcase size={15}/>,   label: 'Business Wealth',       desc: 'Entrepreneur financial strategy',       href: '/wealth/business' },
      { icon: <Users size={15}/>,       label: 'Community Prosperity',  desc: 'Group wealth-building programs',        href: '/wealth/community' },
    ],
    cols: 3,
  },
  {
    label: 'Well-being',
    href: '/wellbeing',
    children: [
      { icon: <Feather size={15}/>, label: 'Spiritual Healing & Prayer', desc: 'Faith-rooted restoration',           href: '/wellbeing/spiritual', am: true },
      { icon: <Sun size={15}/>,     label: 'Energy & Body Wellness',     desc: 'Somatic & integrative healing',      href: '/wellbeing/energy',    am: true },
      { icon: <Leaf size={15}/>,    label: 'Herbal & Natural Medicine',  desc: 'Plant-based healing protocols',      href: '/wellbeing/herbal',    am: true },
      { icon: <Wind size={15}/>,    label: 'Sound & Vibration Therapy',  desc: 'Frequency & sacred sound',           href: '/wellbeing/sound',     am: true },
      { icon: <Heart size={15}/>,   label: 'Emotional & Mental Health',  desc: 'Trauma-informed wholeness',          href: '/wellbeing/mental',    am: true },
      { icon: <Activity size={15}/>,label: 'Holistic Coaching',          desc: 'Whole-life guidance',                href: '/wellbeing/coaching',  am: true },
    ],
    cols: 3,
  },
  {
    label: 'Ministry',
    href: '/ministry',
    children: [
      { icon: <Feather size={15}/>, label: 'Ministry Charter',      desc: 'Founding values & governance',        href: '/ministry',            am: true },
      { icon: <Lock size={15}/>,    label: 'Private Holistic Assoc.', desc: 'PHA structure & member rights',     href: '/ministry/pha',        am: true },
      { icon: <Award size={15}/>,   label: 'Healing Programs',       desc: 'Retreats, circles & ceremonies',     href: '/programs',            am: true },
      { icon: <Users size={15}/>,   label: 'Enter the Covenant',     desc: 'Join the healing community',         href: '/membership/apply',    am: true },
    ],
  },
  {
    label: 'Membership',
    href: '/membership',
    children: [
      { icon: <Layers size={15}/>,      label: 'How It Works',    desc: 'Your path to membership',       href: '/membership' },
      { icon: <Award size={15}/>,       label: 'All Benefits',    desc: 'Every tier explained',          href: '/membership/benefits' },
      { icon: <CheckCircle size={15}/>, label: 'Apply Now',       desc: 'Start your application today',  href: '/membership/apply' },
      { icon: <Shield size={15}/>,      label: 'Trust & Covenant',desc: 'Community standards & rights',  href: '/trust-center' },
    ],
  },
  {
    label: 'Programs',
    href: '/programs',
    children: [
      { icon: <Star size={15}/>,      label: 'IWW Summit 2026',        desc: 'Our flagship annual event',       href: '/programs/summit' },
      { icon: <TrendingUp size={15}/>,label: '90-Day Wealth Builder',  desc: 'Transform your finances',         href: '/programs/wealth-builder' },
      { icon: <Feather size={15}/>,   label: 'Healing Retreat 2026',   desc: 'Sacred healing immersion',        href: '/programs/healing-retreat', am: true },
      { icon: <BookOpen size={15}/>,  label: 'Financial Foundations',  desc: '6-week intensive workshop',       href: '/programs/foundations' },
      { icon: <Heart size={15}/>,     label: '90-Day Wholeness Journey',desc: 'Spirit, mind & body',            href: '/programs/wholeness',       am: true },
      { icon: <Globe size={15}/>,     label: 'View All Programs',      desc: 'Full program catalogue',          href: '/programs' },
    ],
    cols: 3,
  },
  {
    label: 'Resources',
    href: '/resources',
    children: [
      { icon: <FileText size={15}/>,  label: 'Wealth Articles',     desc: 'Financial guides & insights',      href: '/resources/wealth' },
      { icon: <Feather size={15}/>,   label: 'Healing Resources',   desc: 'Holistic health & ministry',       href: '/resources/healing',  am: true },
      { icon: <BookOpen size={15}/>,  label: 'Free Tools',          desc: 'Calculators & planners',           href: '/resources/tools' },
      { icon: <Globe size={15}/>,     label: 'All Resources',       desc: 'Complete resource library',        href: '/resources' },
    ],
  },
  { label: 'Contact', href: '/contact' },
];

/* ─── SCROLL TO TOP ON ROUTE CHANGE ─── */
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/* ─── NAVBAR ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const loc = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => { setMobileOpen(false); setMobileExpanded(null); }, [loc]);

  return (
    <>
      <header className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">

          {/* Brand */}
          <Link to="/" className="nav-brand">
            <div className="nav-emblem-ring">
              <span className="nav-emblem-inner">IW</span>
            </div>
            <div className="nav-wordmark">
              <span className="nav-wordmark-primary">Infinite Wealth</span>
              <span className="nav-wordmark-secondary">&amp; Well-being</span>
            </div>
          </Link>

          {/* Desktop menu */}
          <ul className="nav-menu">
            {NAV.map(item => (
              <li key={item.label} className="nav-item">
                {item.children ? (
                  <>
                    {/* Parent link — navigates to section AND shows dropdown on hover */}
                    <Link
                      to={item.href}
                      className={`nav-link${loc.pathname.startsWith(item.href) ? ' active' : ''}`}
                    >
                      {item.label}
                      <svg className="nav-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6l4 4 4-4"/>
                      </svg>
                    </Link>

                    {/* Dropdown panel */}
                    <div className="nav-dropdown">
                      <div className={`dropdown-grid cols-${item.cols || 2}`}>
                        {item.children.map(child => (
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
                  <Link to={item.href} className={`nav-link${loc.pathname === item.href ? ' active' : ''}`}>
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Nav actions */}
          <div className="nav-actions">
            <Link to="/donate" className="btn btn-outline-gold btn-sm">Donate</Link>
            <Link to="/auth/sign-in" className="btn btn-outline-gold btn-sm">Sign In</Link>
            <Link to="/membership/apply" className="btn btn-gold btn-sm">Join Now</Link>
          </div>

          {/* Hamburger */}
          <button className={`nav-hamburger${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)}>
            <span/><span/><span/>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        {NAV.map(item => (
          <div className="mobile-nav-group" key={item.label}>
            {item.children ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Link to={item.href} className="mobile-nav-link" style={{ flex: 1, borderBottom: 'none', paddingRight: 0 }}>
                    {item.label}
                  </Link>
                  <button
                    style={{ background: 'none', border: 'none', padding: '15px 8px', cursor: 'pointer' }}
                    onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                  >
                    <ChevronDown size={17} style={{ color: 'rgba(255,255,255,0.5)', transform: mobileExpanded === item.label ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                  </button>
                </div>
                {mobileExpanded === item.label && (
                  <div className="mobile-sub-links">
                    {item.children.map(c => (
                      <Link to={c.href} key={c.label} className="mobile-sub-link">{c.label}</Link>
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
          <Link to="/auth/sign-in" className="btn btn-ghost btn-lg" style={{ justifyContent: 'center' }}>
            <Lock size={16}/> Member Sign In
          </Link>
          <Link to="/donate" className="btn btn-ghost btn-lg" style={{ justifyContent: 'center' }}>
            <Gift size={16}/> Donate
          </Link>
          <Link to="/membership/apply" className="btn btn-gold btn-lg" style={{ justifyContent: 'center' }}>
            Join Now <ArrowRight size={16}/>
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
            <p className="footer-about">One unified platform — financial empowerment, holistic healing, and spiritual well-being — led by Leonard M. Diana, Ambassador of Hartford, CT.</p>
            <div className="footer-socials">
              {['X','f','▶','📷'].map(s => <a key={s} href="#" className="footer-social-btn">{s}</a>)}
            </div>
          </div>
          <div className="footer-col">
            <h5>Wealth</h5>
            <ul>
              {[['Wealth Empowerment','/wealth/empowerment'],['Investment Strategy','/wealth/investment'],['Asset Protection','/wealth/protection'],['Financial Education','/wealth/education'],['Business Wealth','/wealth/business'],['Community Prosperity','/wealth/community']].map(([l,h])=><li key={l}><Link to={h}>{l}</Link></li>)}
            </ul>
          </div>
          <div className="footer-col">
            <h5>Well-being &amp; Ministry</h5>
            <ul>
              {[['Spiritual Healing','/wellbeing/spiritual'],['Energy Wellness','/wellbeing/energy'],['Herbal Medicine','/wellbeing/herbal'],['Sound Therapy','/wellbeing/sound'],['Emotional Health','/wellbeing/mental'],['Holistic Coaching','/wellbeing/coaching'],['Ministry Charter','/ministry']].map(([l,h])=><li key={l}><Link to={h}>{l}</Link></li>)}
            </ul>
          </div>
          <div className="footer-col">
            <h5>Platform</h5>
            <ul>
              {[['About Us','/about'],['Membership','/membership'],['Programs','/programs'],['Resources','/resources'],['Trust Center','/trust-center'],['Donate','/donate'],['Contact','/contact']].map(([l,h])=><li key={l}><Link to={h}>{l}</Link></li>)}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Infinite Wealth &amp; Well-being. All rights reserved.</span>
          <div style={{display:'flex',gap:18}}>
            {['Privacy Policy','Terms of Use','Member Agreement'].map(l=><a href="#" key={l}>{l}</a>)}
          </div>
          <div className="footer-cert-row"><Shield size={12}/><span>508(c)(1)(a) Ministry · Private Holistic Association · Hartford, CT</span></div>
        </div>
      </div>
    </footer>
  );
}

function Layout({ children }) {
  return <><Navbar/><main>{children}</main><Footer/></>;
}

/* ─── REUSABLE PAGE HERO ─── */
function PageHero({ img, label, title, titleEm, sub, am = false, breadcrumb = [] }) {
  return (
    <div className="page-hero">
      {img && <div className="page-hero-bg" style={{ backgroundImage: `url(${img})` }}/>}
      <div className="page-hero-overlay"/>
      <div className="container">
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="breadcrumb">
            <Link to="/" className="bc-link"><HomeIcon size={11}/> Home</Link>
            {breadcrumb.map((b,i) => (
              <React.Fragment key={b.label}>
                <span className="bc-sep"><ChevronRight size={11}/></span>
                {i === breadcrumb.length - 1
                  ? <span className="bc-current">{b.label}</span>
                  : <Link to={b.href} className="bc-link">{b.label}</Link>
                }
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="page-hero-content">
          <span className={`label label-light${am ? ' label-am' : ''}`}>{label}</span>
          <div className={`divider${am ? ' am' : ''}`}><div className="divider-line"/><div className="divider-dot"/></div>
          <h1>
            {title}
            {titleEm && (
              <><br/>
                <em style={{ fontStyle:'italic', background: am ? 'linear-gradient(135deg,#c4a8d8,#7e4da3)' : 'linear-gradient(135deg,#dfc068,#a97522)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  {titleEm}
                </em>
              </>
            )}
          </h1>
          {sub && <p>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── REUSABLE SERVICE DETAIL PAGE ─── */
function ServicePage({ img, label, breadcrumb, title, titleEm, sub, am, intro, features, relatedLinks, cta }) {
  return (
    <Layout>
      <PageHero img={img} label={label} title={title} titleEm={titleEm} sub={sub} am={am} breadcrumb={breadcrumb}/>
      <section className="section">
        <div className="container">
          <div className="split split-3-2">
            <div className="content-block">
              {intro.map((para, i) => <p key={i} style={{ marginBottom: 16 }}>{para}</p>)}
              {features && (
                <div className="feature-list" style={{ marginTop: 24 }}>
                  {features.map(f => (
                    <div className="feature-item" key={f.title}>
                      <div className={`feature-icon${f.am ? ' am' : f.sg ? ' sg' : ''}`}>{f.icon}</div>
                      <div className="feature-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 36, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to={cta?.href || '/membership/apply'} className={`btn ${am ? 'btn-am' : 'btn-gold'} btn-lg`}>
                  {cta?.label || 'Get Started'} <ArrowRight size={16}/>
                </Link>
                <Link to="/contact" className="btn btn-outline-gold btn-lg">Ask a Question</Link>
              </div>
            </div>
            <div>
              <img src={img} alt={title} style={{ width:'100%', borderRadius:24, aspectRatio:'4/5', objectFit:'cover', boxShadow:'var(--shadow-lg)' }}/>
            </div>
          </div>
        </div>
      </section>

      {/* Related links */}
      {relatedLinks && (
        <section className="section-sm section-ivory">
          <div className="container">
            <h3 style={{ marginBottom: 28 }}>Explore More</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
              {relatedLinks.map(r => (
                <Link to={r.href} key={r.label} style={{ background:'white', border:'1px solid var(--border)', borderRadius:16, padding:'20px 22px', textDecoration:'none', color:'var(--text-primary)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, transition:'all .25s', boxShadow:'var(--shadow-xs)' }}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow-md)';e.currentTarget.style.transform='translateY(-3px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--shadow-xs)';e.currentTarget.style.transform='none';}}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.93rem', marginBottom:3 }}>{r.label}</div>
                    <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{r.desc}</div>
                  </div>
                  <ChevronRight size={16} style={{ color:'var(--gold-500)', flexShrink:0 }}/>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}

/* ═══════════════════════════════════════════════
   HOME
═══════════════════════════════════════════════ */
function Home() {
  const [donateAmt, setDonateAmt] = useState('$50');
  return (
    <Layout>
      {/* HERO */}
      <section className="hero">
        <div className="hero-media"><img src={I.hero1} alt="Infinite Wealth & Well-being" loading="eager"/></div>
        <div className="hero-overlay"/>
        <div className="hero-noise"/>
        <div className="hero-aside">
          <img src={I.heroA} alt="" className="hero-aside-img"/>
          <img src={I.heroB} alt="" className="hero-aside-img"/>
        </div>
        <div className="hero-content">
          <div className="hero-label-row">
            <div className="hero-pill"><div className="hero-pill-dot"/><span>Wealth · Well-being · Ministry · Hartford, CT</span></div>
            <div className="hero-label-line"/>
          </div>
          <h1 className="hero-headline">
            <span className="line-break">Infinite</span>
            <em>Wealth</em> <span style={{fontStyle:'normal'}}>&amp;</span>
            <span className="line-break"><em>Well-being</em></span>
          </h1>
          <p className="hero-body">One unified platform — financial empowerment, holistic healing, and spiritual well-being — guided by Leonard M. Diana, Alignable Alliance Ambassador of Hartford, CT.</p>
          <div className="hero-cta-row">
            <Link to="/membership/apply" className="btn btn-gold btn-lg">Begin Your Journey <ArrowRight size={18}/></Link>
            <Link to="/about" className="btn btn-ghost btn-lg">Our Story</Link>
          </div>
          <div className="hero-metrics">
            {[{val:'5',sup:'K+',label:'Community Members'},{val:'12',sup:'+',label:'Healing Modalities'},{val:'$2.4',sup:'M',label:'Wealth Guided'},{val:'98',sup:'%',label:'Satisfaction'}].map((m,i)=>(
              <React.Fragment key={m.label}>
                {i>0 && <div className="hero-metrics-divider"/>}
                <div className="hero-metric">
                  <div className="hero-metric-value">{m.val}<span>{m.sup}</span></div>
                  <div className="hero-metric-label">{m.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="hero-scroll-cue"><div className="scroll-line"/><span className="scroll-text">Scroll</span></div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-strip">
        <div className="marquee-inner" aria-hidden>
          {[...Array(2)].map((_,i)=>(
            <React.Fragment key={i}>
              {['Wealth Empowerment','Investment Strategy','Asset Protection','Financial Education','Spiritual Healing','Herbal Medicine','Energy Wellness','Sound Therapy','Holistic Coaching','508(c)(1)(a) Ministry','Community Prosperity','Hartford CT'].map(t=>(
                <span className="marquee-item" key={t}><span className="marquee-dot"/>{t}</span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section className="section-xs">
        <div className="container">
          <div className="stats-row">
            {[{val:'5,200',sup:'',label:'Active Members'},{val:'120',sup:'+',label:'Wealth Plans'},{val:'12',sup:'+',label:'Healing Modalities'},{val:'98',sup:'%',label:'Satisfaction'}].map(s=>(
              <div className="stat-cell" key={s.label}><div className="stat-value">{s.val}<sup>{s.sup}</sup></div><div className="stat-label">{s.label}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="section">
        <div className="container">
          <div className="split">
            <div className="img-composition">
              <img src={LEONARD} alt="Leonard M. Diana" className="img-composition-main"/>
              <img src={I.community} alt="" className="img-composition-accent"/>
              <div className="img-composition-badge"><div className="img-composition-badge-num">12+</div><div className="img-composition-badge-text">Years of<br/>Service</div></div>
            </div>
            <div className="content-block">
              <span className="label">Our Founder</span>
              <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2>Leonard M. Diana.<br/><em style={{fontStyle:'italic'}}>One Vision.</em></h2>
              <p>Wealth strategist, minister, holistic health advocate, and Alignable Alliance Ambassador of Hartford, CT — Leonard founded this platform on the conviction that true prosperity is never one-dimensional.</p>
              <div className="feature-list">
                {[
                  {icon:<TrendingUp size={18}/>,cls:'',title:'Wealth Advisory',desc:'Professional-grade strategy, investment planning, and asset protection for every income level.'},
                  {icon:<Heart size={18}/>,cls:'am',title:'Holistic Well-being',desc:'Integrative healing and a 508(c)(1)(a) ministry — honouring the whole person.'},
                  {icon:<Users size={18}/>,cls:'sg',title:'Community Ambassador',desc:'Rooted in Hartford, CT — building bridges between wealth, wellness, and community.'},
                ].map(f=>(
                  <div className="feature-item" key={f.title}>
                    <div className={`feature-icon${f.cls?' '+f.cls:''}`}>{f.icon}</div>
                    <div className="feature-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:32}}><Link to="/about" className="btn btn-dark">Full Story <ArrowRight size={16}/></Link></div>
            </div>
          </div>
        </div>
      </section>

      {/* WEALTH BENTO */}
      <section className="section section-ivory">
        <div className="container">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:56,flexWrap:'wrap',gap:20}}>
            <div className="section-head" style={{marginBottom:0}}>
              <span className="label">Wealth Services</span>
              <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2>Build. Protect. Grow.</h2>
            </div>
            <Link to="/wealth" className="btn btn-outline-gold">All Services <ChevronRight size={14}/></Link>
          </div>
          <div className="bento-grid">
            <Link to="/wealth/empowerment" className="bento-card col-span-7">
              <img src={I.wealth} alt="" className="bento-card-img short"/>
              <div className="bento-card-body"><div className="bento-card-icon"><TrendingUp/></div><h3>Wealth Empowerment</h3><p>Financial literacy, debt elimination, and generational wealth planning for every income level.</p><div className="bento-arrow">Explore <ChevronRight size={14}/></div></div>
            </Link>
            <Link to="/wealth/investment" className="bento-card col-span-5">
              <img src={I.invest} alt="" className="bento-card-img short"/>
              <div className="bento-card-body"><div className="bento-card-icon"><BarChart2/></div><h3>Investment Strategy</h3><p>Portfolio construction and long-term investment planning tailored to your goals.</p><div className="bento-arrow">Explore <ChevronRight size={14}/></div></div>
            </Link>
            <Link to="/wealth/protection" className="bento-card col-span-4 dark">
              <div className="bento-card-body"><div className="bento-card-icon"><Shield/></div><h3>Asset Protection</h3><p>Legal structures and risk management to defend what you build.</p><div className="bento-arrow">Explore <ChevronRight size={14}/></div></div>
            </Link>
            <Link to="/wealth/education" className="bento-card col-span-4">
              <img src={I.educate} alt="" className="bento-card-img"/>
              <div className="bento-card-body"><div className="bento-card-icon"><BookOpen/></div><h3>Financial Education</h3><p>Workshops, seminars, and a growing library of wealth-building resources.</p><div className="bento-arrow">Explore <ChevronRight size={14}/></div></div>
            </Link>
            <Link to="/wealth/community" className="bento-card col-span-4 gold-card">
              <div className="bento-card-body"><div className="bento-card-icon"><Users/></div><h3>Community Prosperity</h3><p>Group wealth-building cohorts and peer networks that accelerate everyone's progress.</p><div className="bento-arrow">Explore <ChevronRight size={14}/></div></div>
            </Link>
          </div>
        </div>
      </section>

      {/* WELL-BEING BENTO */}
      <section className="section section-ministry">
        <div className="container">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:56,flexWrap:'wrap',gap:20}}>
            <div className="section-head" style={{marginBottom:0}}>
              <span className="label label-am">Well-being &amp; Ministry</span>
              <div className="divider am"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2 style={{color:'white'}}>Heal. Restore. Thrive.</h2>
            </div>
            <Link to="/wellbeing" className="btn btn-outline-am">All Services <ChevronRight size={14}/></Link>
          </div>
          <div className="bento-grid">
            <Link to="/wellbeing/spiritual" className="bento-card col-span-7">
              <img src={I.prayer} alt="" className="bento-card-img short"/>
              <div className="bento-card-body"><div className="bento-card-icon am"><Feather/></div><h3>Spiritual Healing &amp; Prayer</h3><p>Intercessory prayer, prophetic encouragement, and spiritual restoration — the sacred cornerstone.</p><div className="bento-arrow" style={{color:'var(--am-500)'}}>Explore <ChevronRight size={14}/></div></div>
            </Link>
            <Link to="/wellbeing/herbal" className="bento-card col-span-5">
              <img src={I.herbal} alt="" className="bento-card-img short"/>
              <div className="bento-card-body"><div className="bento-card-icon sg"><Leaf/></div><h3>Herbal &amp; Natural Medicine</h3><p>Plant-based healing protocols and nutritional guidance rooted in integrative wisdom.</p><div className="bento-arrow" style={{color:'var(--sg-500)'}}>Explore <ChevronRight size={14}/></div></div>
            </Link>
            <Link to="/wellbeing/energy" className="bento-card col-span-4 am-card">
              <div className="bento-card-body"><div className="bento-card-icon"><Sun/></div><h3>Energy &amp; Body Wellness</h3><p>Somatic healing and body-based practices that release stored tension and restore balance.</p><div className="bento-arrow">Explore <ChevronRight size={14}/></div></div>
            </Link>
            <Link to="/wellbeing/sound" className="bento-card col-span-4">
              <img src={I.sound} alt="" className="bento-card-img"/>
              <div className="bento-card-body"><div className="bento-card-icon am"><Wind/></div><h3>Sound &amp; Vibration Therapy</h3><p>Frequency healing and sacred sound ceremonies that harmonize the nervous system.</p><div className="bento-arrow" style={{color:'var(--am-500)'}}>Explore <ChevronRight size={14}/></div></div>
            </Link>
            <Link to="/wellbeing/coaching" className="bento-card col-span-4">
              <img src={I.coaching} alt="" className="bento-card-img"/>
              <div className="bento-card-body"><div className="bento-card-icon sg"><Activity/></div><h3>Holistic Coaching</h3><p>Whole-life coaching combining spiritual, emotional, and practical strategy.</p><div className="bento-arrow" style={{color:'var(--sg-500)'}}>Explore <ChevronRight size={14}/></div></div>
            </Link>
          </div>
        </div>
      </section>

      {/* MEMBERSHIP */}
      <section className="section">
        <div className="container">
          <div className="section-head centered">
            <span className="label">Membership</span>
            <div className="divider center"><div className="divider-line"/><div className="divider-dot"/><div className="divider-line"/></div>
            <h2>Choose Your Path</h2>
            <p>Full access to both wealth advisory and well-being resources. Free to begin.</p>
          </div>
          <div className="membership-deck">
            {[
              {tier:'Foundation',name:'Explorer',price:'Free',period:'always open',desc:'Wealth resources, community & open healing events.',features:['Community Forum','Monthly Newsletter','Wealth Library','Open Healing Events','Prayer Portal'],btn:'btn-outline-gold',featured:false},
              {tier:'Member',name:'Member',price:'$49',period:'/ month',desc:'Full access — wealth advisory, healing services & coaching.',features:['All Explorer Benefits','Wealth Advisory','4 Strategy Sessions/Mo','Healing Services','Practitioner Booking','Progress Dashboard','Accountability Partner'],btn:'btn-gold',badge:'Most Popular',featured:true},
              {tier:'Guardian',name:'Guardian',price:'$149',period:'/ month',desc:'Unlimited — personal coaching, 1-on-1 ministry & annual retreat.',features:['All Member Benefits','Monthly 1-on-1 Advisory','Ministry Session/Mo','Priority Access','Annual Retreat','Governance Rights','Direct Access to Leonard'],btn:'btn-outline-gold',featured:false},
            ].map(p=>(
              <div className={`plan-card${p.featured?' featured':''}`} key={p.name}>
                {p.badge && <div className="plan-badge gold">{p.badge}</div>}
                <div className="plan-tier">{p.tier}</div>
                <div className="plan-name">{p.name}</div>
                <p className="plan-desc">{p.desc}</p>
                <div className="plan-price">{p.price}</div>
                <div className="plan-period">{p.period}</div>
                <div className="plan-divider"/>
                <ul className="plan-features">
                  {p.features.map(f=><li className="plan-feature" key={f}><CheckCircle size={14} className="plan-feature-icon"/>{f}</li>)}
                </ul>
                <Link to="/membership/apply" className={`btn ${p.btn} btn-lg`} style={{width:'100%',justifyContent:'center'}}>
                  Get Started <ArrowRight size={15}/>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section section-ivory">
        <div className="container">
          <div className="section-head centered">
            <span className="label">Member Stories</span>
            <div className="divider center"><div className="divider-line"/><div className="divider-dot"/><div className="divider-line"/></div>
            <h2>Lives Transformed</h2>
          </div>
          <div className="testimonial-grid">
            {[
              {text:"Leonard's wealth advisory moved my family from confusion to a clear 10-year plan. We paid off $40K in debt and started investing — all within 18 months.",name:'Amara Johnson',role:'Wealth Member',img:I.t1},
              {text:"The spiritual healing and herbal protocols gave me back energy I hadn't felt in years. Faith and natural medicine working together — unlike anything I've experienced.",name:'Marcus Williams',role:'Guardian Member',img:I.t2,scripture:'Isaiah 53:5'},
              {text:"I came for the financial workshops and stayed for the community. Having both wealth strategy and holistic well-being in one place is genuinely life-changing.",name:'Dr. Priya S.',role:'Member since 2024',img:I.t3},
            ].map(t=>(
              <div className="testimonial-card" key={t.name}>
                <div className="t-stars">{[...Array(5)].map((_,i)=><svg key={i} viewBox="0 0 20 20"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.92 5.33L10 13.17l-4.78 2.55.92-5.33L2.27 6.62l5.34-.78z"/></svg>)}</div>
                <div className="t-mark">"</div>
                <p className="t-text">{t.text}</p>
                {t.scripture && <div className="t-scripture">{t.scripture}</div>}
                <div className="t-author"><img src={t.img} alt={t.name} className="t-avatar"/><div><div className="t-name">{t.name}</div><div className="t-role">{t.role}</div></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DONATE */}
      <section className="section-xs section-dark">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner-glow"/>
            <div className="cta-banner-content">
              <div className="cta-banner-text">
                <span className="label label-light">Support the Mission</span>
                <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
                <h2 style={{color:'white'}}>Invest in the Community</h2>
                <p>Fund financial literacy scholarships, free community healing events, and Hartford outreach.</p>
                <div className="donate-amounts">
                  {['$25','$50','$100','$250','Custom'].map(a=><button key={a} className={`donate-pill${donateAmt===a?' selected':''}`} onClick={()=>setDonateAmt(a)}>{a}</button>)}
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

/* ═══════════════════════════════════════════════
   ABOUT PAGES
═══════════════════════════════════════════════ */
function About() {
  return (
    <Layout>
      <PageHero img={I.about1} label="About Us" title="One Vision." titleEm="Two Dimensions." sub="Infinite Wealth & Well-being is the unified expression of Leonard M. Diana's life work — professional wealth management and sacred healing, under one roof." breadcrumb={[{label:'About',href:'/about'}]}/>
      <section className="section">
        <div className="container">
          <div className="split split-2-3">
            <div className="img-composition"><img src={LEONARD} alt="Leonard M. Diana" className="img-composition-main"/></div>
            <div className="content-block">
              <span className="label">Leonard M. Diana</span>
              <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2>Wealth Strategist.<br/>Minister. Ambassador.</h2>
              <p>Leonard M. Diana founded Infinite Wealth & Well-being as the full expression of his calling — refusing to believe wealth and well-being must be separate pursuits.</p>
              <p>As Alignable Alliance Ambassador of Hartford, CT, an ordained minister, and a certified wealth advisor, Leonard uniquely bridges the world of professional financial planning with sacred, integrative healing.</p>
              <div className="scripture-block">
                <p className="scripture-text">"I came that they may have life, and have it abundantly."</p>
                <cite className="scripture-ref">— John 10:10</cite>
              </div>
              <div style={{marginTop:12,display:'flex',gap:12,flexWrap:'wrap'}}>
                <Link to="/about/founder" className="btn btn-gold">Full Founder Story <ArrowRight size={15}/></Link>
                <Link to="/contact" className="btn btn-outline-gold">Connect with Leonard</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section section-dark">
        <div className="container">
          <div className="section-head centered">
            <span className="label">Our Values</span>
            <div className="divider center"><div className="divider-line"/><div className="divider-dot"/><div className="divider-line"/></div>
            <h2>What We Stand For</h2>
          </div>
          <div className="trust-grid">
            {[
              {icon:<TrendingUp/>,title:'Wealth for All',desc:'Professional-grade financial guidance accessible to everyone.',meta:'Core Mandate'},
              {icon:<Feather/>,title:'Faith-Governed',desc:'Our ministry is rooted in scripture and 508(c)(1)(a) governance.',meta:'Ministry Standard',am:true},
              {icon:<Heart/>,title:'Whole-Person Care',desc:'Financial, physical, emotional, and spiritual health are inseparable.',meta:'Integrated'},
              {icon:<Shield/>,title:'Fiduciary Standard',desc:'Every wealth recommendation made in your best interest.',meta:'Advisory Ethics'},
              {icon:<Lock/>,title:'Sacred Privacy',desc:'Ministry and healing matters protected under PHA covenant.',meta:'Covenant Protected',am:true},
              {icon:<Users/>,title:'Community First',desc:'Rooted in Hartford — building bridges from here outward.',meta:'Ambassador-Led'},
            ].map(v=>(
              <Link to="/trust-center" className={`trust-item${v.am?' am-item':''}`} key={v.title}>
                <div className={`trust-item-icon${v.am?' am':''}`}>{v.icon}</div>
                <div><h4>{v.title}</h4><p>{v.desc}</p><div className={`trust-meta${v.am?' am':''}`}><CheckCircle size={10}/>{v.meta}</div></div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function AboutFounder() {
  return (
    <Layout>
      <PageHero img={LEONARD} label="Our Founder" title="Leonard M. Diana" titleEm="Full Story." sub="Minister, wealth strategist, holistic practitioner, and Alignable Alliance Ambassador of Hartford, CT." breadcrumb={[{label:'About',href:'/about'},{label:'Leonard M. Diana',href:'/about/founder'}]}/>
      <section className="section">
        <div className="container" style={{maxWidth:900,margin:'0 auto'}}>
          {[
            "Leonard M. Diana's work is built on a singular, unwavering conviction: true abundance is never one-dimensional. Real prosperity encompasses your finances, your physical health, your emotional wholeness, and your spiritual life — all together, not in isolation.",
            "As the formal Ambassador of the Alignable Alliance of Hartford, CT, Leonard has spent over a decade serving his community at the intersection of financial empowerment and holistic healing. He is both a certified wealth advisor who has guided families through debt elimination, investment planning, and generational wealth creation — and an ordained minister who has walked community members through spiritual healing, prayer ministry, and holistic restoration.",
            "Infinite Wealth & Well-being is the platform he built to make that integrated vision accessible to everyone — not just the already-privileged. A place where a working family in Hartford can get the same quality of financial guidance as a high-net-worth individual, and where the spiritual and physical dimensions of their wellbeing are honoured in the same breath.",
            "The ministry dimension of this platform — governed as a 508(c)(1)(a) Spiritual Healing Ministry and Private Holistic Association — was not an afterthought. It is the sacred root from which everything else grows. Leonard believes that sustainable financial prosperity is impossible without inner healing, and that genuine healing is incomplete without provision and security.",
          ].map((p,i)=><p key={i} style={{color:'var(--text-muted)',lineHeight:1.9,marginBottom:22,fontSize:'1.08rem'}}>{p}</p>)}
          <div className="scripture-block" style={{margin:'32px 0'}}>
            <p className="scripture-text">"Beloved, I pray that you may prosper in all things and be in health, just as your soul prospers."</p>
            <cite className="scripture-ref">— 3 John 1:2</cite>
          </div>
          <div style={{display:'flex',gap:14,flexWrap:'wrap',marginTop:36}}>
            <Link to="/membership/apply" className="btn btn-gold btn-lg">Join the Community <ArrowRight size={16}/></Link>
            <Link to="/contact" className="btn btn-outline-gold btn-lg">Send Leonard a Message</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function AboutImpact() {
  return (
    <Layout>
      <PageHero img={I.community} label="Community Impact" title="Hartford &amp; Beyond." titleEm="" sub="How Infinite Wealth & Well-being is changing lives across the Hartford community and growing nationally." breadcrumb={[{label:'About',href:'/about'},{label:'Community Impact',href:'/about/impact'}]}/>
      <section className="section">
        <div className="container">
          <div className="stats-row">
            {[{val:'5,200',sup:'',label:'Active Members'},{val:'120',sup:'+',label:'Wealth Plans'},{val:'$2.4',sup:'M',label:'Wealth Guided'},{val:'98',sup:'%',label:'Satisfaction'}].map(s=>(
              <div className="stat-cell" key={s.label}><div className="stat-value">{s.val}<sup>{s.sup}</sup></div><div className="stat-label">{s.label}</div></div>
            ))}
          </div>
          <div style={{marginTop:80,display:'grid',gridTemplateColumns:'1fr 1fr',gap:40}}>
            {[
              {title:'Financial Literacy Scholarships',desc:'Over 200 community members in Hartford have received fully subsidized memberships — accessing wealth advisory and healing resources they could not otherwise afford.'},
              {title:'Free Community Workshops',desc:'Monthly free financial literacy and healing workshops open to all Hartford residents — regardless of membership status. No barrier to entry.'},
              {title:'Alignable Alliance Partnership',desc:'As the Alignable Alliance Ambassador of Hartford, Leonard activates a network of local business owners and community leaders committed to collective prosperity.'},
              {title:'508(c)(1)(a) Ministry Outreach',desc:'Our healing ministry has served hundreds of community members through prayer, holistic health interventions, and free healing circles open to all.'},
            ].map(i=>(
              <div key={i.title} style={{padding:'32px 28px',background:'white',border:'1px solid var(--border)',borderRadius:20,boxShadow:'var(--shadow-xs)'}}>
                <h4 style={{marginBottom:10,fontSize:'1.1rem'}}>{i.title}</h4>
                <p style={{color:'var(--text-muted)',fontSize:'0.95rem',lineHeight:1.72}}>{i.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════
   WEALTH SERVICE PAGES — each with full content
═══════════════════════════════════════════════ */
const wealthRelated = [
  {label:'Investment Strategy',desc:'Portfolio & growth planning',href:'/wealth/investment'},
  {label:'Asset Protection',desc:'Defend what you build',href:'/wealth/protection'},
  {label:'Financial Education',desc:'Workshops & learning',href:'/wealth/education'},
  {label:'Business Wealth',desc:'Entrepreneur strategy',href:'/wealth/business'},
  {label:'Community Prosperity',desc:'Group wealth-building',href:'/wealth/community'},
];

function WealthEmpowerment() {
  return <ServicePage img={I.wealth} label="Wealth Services" am={false}
    breadcrumb={[{label:'Wealth',href:'/wealth'},{label:'Wealth Empowerment',href:'/wealth/empowerment'}]}
    title="Wealth" titleEm="Empowerment."
    sub="Comprehensive financial literacy, debt elimination, and generational wealth planning — for every income level."
    intro={[
      "Wealth Empowerment is the foundation of everything we do in the financial advisory dimension of this platform. It starts with a simple belief: every person, regardless of income level, deserves access to the same quality of financial guidance that has historically only been available to the wealthy.",
      "Leonard and the advisory team work with members to build a complete picture of their financial life — income, debt, assets, goals — and then create an executable strategy that moves them from where they are to where they deserve to be.",
      "From budgeting and debt elimination to long-term wealth accumulation and generational planning, this service covers the full wealth journey."
    ]}
    features={[
      {icon:<Target size={18}/>,title:'Personal Wealth Roadmap',desc:'A complete, written financial plan covering every dimension of your money life.',},
      {icon:<Zap size={18}/>,title:'Debt Elimination Strategy',desc:'Proven frameworks to systematically eliminate debt and free up wealth-building capital.'},
      {icon:<PieChart size={18}/>,title:'Generational Wealth Planning',desc:'Structures and strategies to build wealth that outlives you and benefits your family.'},
      {icon:<UserCheck size={18}/>,title:'Accountability Coaching',desc:'Regular check-ins and milestone reviews to keep you on track and progressing.'},
    ]}
    relatedLinks={wealthRelated.filter(r=>r.href!=='/wealth/empowerment')}
    cta={{label:'Start Your Wealth Plan',href:'/membership/apply'}}
  />;
}

function WealthInvestment() {
  return <ServicePage img={I.invest} label="Wealth Services" am={false}
    breadcrumb={[{label:'Wealth',href:'/wealth'},{label:'Investment Strategy',href:'/wealth/investment'}]}
    title="Investment" titleEm="Strategy."
    sub="Portfolio construction, asset allocation, and long-term investment planning tailored to your goals and risk profile."
    intro={[
      "Smart investing is not about picking hot stocks or chasing trends. It's about building a diversified, goal-aligned portfolio that compounds steadily over time — and having the discipline to stay the course.",
      "Our investment advisory services meet you where you are: whether you're making your first investment or managing a mature portfolio. Leonard and the team guide you through asset allocation, investment vehicle selection, risk management, and long-term portfolio strategy.",
      "Every investment recommendation is made as a fiduciary — in your best interest, with full transparency."
    ]}
    features={[
      {icon:<BarChart2 size={18}/>,title:'Portfolio Construction',desc:'Diversified, goal-aligned portfolios built for your specific timeline and risk tolerance.'},
      {icon:<Shield size={18}/>,title:'Risk Management',desc:'Strategies to protect your portfolio from market volatility and unexpected events.'},
      {icon:<TrendingUp size={18}/>,title:'Growth Strategy',desc:'Long-term compounding strategies designed to accelerate your wealth accumulation.'},
      {icon:<PieChart size={18}/>,title:'Asset Allocation',desc:'Balancing equity, fixed income, real assets, and alternative investments for optimal returns.'},
    ]}
    relatedLinks={wealthRelated.filter(r=>r.href!=='/wealth/investment')}
    cta={{label:'Build Your Portfolio',href:'/membership/apply'}}
  />;
}

function WealthProtection() {
  return <ServicePage img={I.protect} label="Wealth Services" am={false}
    breadcrumb={[{label:'Wealth',href:'/wealth'},{label:'Asset Protection',href:'/wealth/protection'}]}
    title="Asset" titleEm="Protection."
    sub="Legal structures, risk management, and estate planning that defend everything you've worked to build."
    intro={[
      "Building wealth is only half the equation. Protecting it — from lawsuits, creditors, market shocks, and life's unexpected events — is equally critical. Most people don't think about protection until it's too late.",
      "Our asset protection advisory covers the full spectrum: legal entity structuring, insurance strategy, estate planning, trust structures, and risk management frameworks designed to keep your wealth safe through every life stage.",
      "Leonard works with qualified legal and insurance professionals to ensure every protection strategy is both legally sound and practically executable."
    ]}
    features={[
      {icon:<Shield size={18}/>,title:'Legal Entity Structuring',desc:'LLCs, trusts, and holding structures that legally separate your personal assets from liability.'},
      {icon:<FileText size={18}/>,title:'Estate Planning',desc:'Wills, trusts, and succession plans that ensure your wealth transfers according to your wishes.'},
      {icon:<Lock size={18}/>,title:'Insurance Strategy',desc:'Comprehensive insurance planning covering life, disability, liability, and asset-specific coverage.'},
      {icon:<AlertCircle size={18}/>,title:'Risk Assessment',desc:'A full review of your current exposure and a plan to systematically close every vulnerability.'},
    ]}
    relatedLinks={wealthRelated.filter(r=>r.href!=='/wealth/protection')}
    cta={{label:'Protect Your Assets',href:'/membership/apply'}}
  />;
}

function WealthEducation() {
  return <ServicePage img={I.educate} label="Wealth Services" am={false}
    breadcrumb={[{label:'Wealth',href:'/wealth'},{label:'Financial Education',href:'/wealth/education'}]}
    title="Financial" titleEm="Education."
    sub="Structured workshops, live seminars, and a growing library of wealth-building resources for every knowledge level."
    intro={[
      "Financial education is the great equalizer. When people understand how money works — how compound interest grows wealth, how taxes can be legally minimized, how to read financial statements — they make better decisions and build better lives.",
      "Our education programs are designed to be accessible and practical: no jargon, no condescension, just clear, actionable financial knowledge that you can apply immediately.",
      "Offerings range from monthly group workshops in Hartford to self-paced online modules, covering topics from basic budgeting to advanced investment strategy."
    ]}
    features={[
      {icon:<BookOpen size={18}/>,title:'Monthly Workshops',desc:'Live, in-person and online workshops covering a new financial topic each month.'},
      {icon:<Layers size={18}/>,title:'Self-Paced Modules',desc:'A growing library of on-demand financial education courses accessible 24/7.'},
      {icon:<Users size={18}/>,title:'Group Learning Cohorts',desc:'Small-group learning experiences with peer accountability and shared progress.'},
      {icon:<Award size={18}/>,title:'Certification Tracks',desc:'Structured learning tracks with completion certificates for foundational financial literacy.'},
    ]}
    relatedLinks={wealthRelated.filter(r=>r.href!=='/wealth/education')}
    cta={{label:'Access Education',href:'/membership/apply'}}
  />;
}

function WealthBusiness() {
  return <ServicePage img={I.business} label="Wealth Services" am={false}
    breadcrumb={[{label:'Wealth',href:'/wealth'},{label:'Business Wealth',href:'/wealth/business'}]}
    title="Business" titleEm="Wealth."
    sub="Entrepreneur-focused financial strategy — from startup cash flow to exit planning and everything in between."
    intro={[
      "Business ownership is one of the most powerful wealth-building vehicles available — but only when the financial side is managed with discipline and strategy. Too many entrepreneurs are cash-flow rich but wealth-poor.",
      "Our business wealth advisory helps entrepreneurs build personal wealth alongside their business: separating personal and business finances, optimizing owner compensation, building business value, and planning for long-term exit or succession.",
      "Whether you're a solo entrepreneur or managing a growing team, we build a financial strategy that serves both your business and your personal wealth simultaneously."
    ]}
    features={[
      {icon:<Briefcase size={18}/>,title:'Business Financial Strategy',desc:'A complete financial plan for your business — cash flow, profitability, and growth optimization.'},
      {icon:<DollarSign size={18}/>,title:'Owner Compensation Planning',desc:'Structuring how you pay yourself to maximize both business efficiency and personal wealth.'},
      {icon:<TrendingUp size={18}/>,title:'Business Value Building',desc:'Strategies to increase your company\'s value for future sale, investment, or succession.'},
      {icon:<Target size={18}/>,title:'Exit & Succession Planning',desc:'Planning your business exit to maximize wealth transfer and protect what you\'ve built.'},
    ]}
    relatedLinks={wealthRelated.filter(r=>r.href!=='/wealth/business')}
    cta={{label:'Grow Your Business Wealth',href:'/membership/apply'}}
  />;
}

function WealthCommunity() {
  return <ServicePage img={I.community} label="Wealth Services" am={false}
    breadcrumb={[{label:'Wealth',href:'/wealth'},{label:'Community Prosperity',href:'/wealth/community'}]}
    title="Community" titleEm="Prosperity."
    sub="Group wealth-building cohorts, peer accountability, and community investment networks that lift everyone together."
    intro={[
      "Individual financial empowerment is powerful. But collective financial momentum is transformational. When a community learns together, holds each other accountable, and builds wealth in relationship — the results compound.",
      "Our Community Prosperity programs bring members together in intentional wealth-building cohorts: learning the same frameworks, supporting each other's progress, and creating peer networks that sustain financial discipline over the long term.",
      "Rooted in Hartford, CT — and expanding nationally — these programs reflect Leonard's conviction that community is not a nice-to-have in wealth building. It is the accelerant."
    ]}
    features={[
      {icon:<Users size={18}/>,title:'Wealth-Building Cohorts',desc:'Small groups of 8–15 members following the same 90-day wealth curriculum together.'},
      {icon:<Heart size={18}/>,title:'Peer Accountability',desc:'Structured accountability partnerships that keep you committed to your financial goals.'},
      {icon:<Globe size={18}/>,title:'Community Investment Networks',desc:'Collective investment opportunities and group financial vehicles available to members.'},
      {icon:<Award size={18}/>,title:'Mentorship Pairing',desc:'Experienced members paired with newer members to accelerate learning and progress.'},
    ]}
    relatedLinks={wealthRelated.filter(r=>r.href!=='/wealth/community')}
    cta={{label:'Join a Cohort',href:'/membership/apply'}}
  />;
}

/* Wealth overview */
function Wealth() {
  return (
    <Layout>
      <PageHero img={I.wealth} label="Wealth Services" title="Build. Protect." titleEm="Grow." sub="Six comprehensive wealth service domains designed to create lasting prosperity for every member." breadcrumb={[{label:'Wealth',href:'/wealth'}]}/>
      <section className="section">
        <div className="container">
          {[
            {img:I.wealth,href:'/wealth/empowerment',tag:'Core Service',title:'Wealth Empowerment',desc:'Financial literacy, debt elimination, and generational wealth planning. The foundation every financial journey needs.'},
            {img:I.invest,href:'/wealth/investment',tag:'Advisory',title:'Investment Strategy',desc:'Portfolio construction and long-term investment planning tailored to your goals and risk tolerance.'},
            {img:I.protect,href:'/wealth/protection',tag:'Protection',title:'Asset Protection',desc:'Legal structures, estate planning, and risk management frameworks that defend everything you build.'},
            {img:I.educate,href:'/wealth/education',tag:'Education',title:'Financial Education',desc:'Workshops, seminars, and a growing resource library for every financial knowledge level.'},
            {img:I.business,href:'/wealth/business',tag:'Entrepreneurs',title:'Business Wealth',desc:'Entrepreneur-focused strategy from startup cash flow to exit planning and everything between.'},
            {img:I.community,href:'/wealth/community',tag:'Community',title:'Community Prosperity',desc:'Group wealth-building cohorts and peer networks that accelerate everyone\'s financial progress.'},
          ].map(p=>(
            <Link to={p.href} className="program-row" key={p.title}>
              <img src={p.img} alt={p.title} className="program-row-img"/>
              <div className="program-row-body">
                <span className="program-type">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="program-meta"><span><ChevronRight size={13}/>View full service</span></div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════
   WELL-BEING SERVICE PAGES
═══════════════════════════════════════════════ */
const wbRelated = [
  {label:'Energy & Body Wellness',desc:'Somatic healing',href:'/wellbeing/energy'},
  {label:'Herbal & Natural Medicine',desc:'Plant-based healing',href:'/wellbeing/herbal'},
  {label:'Sound & Vibration',desc:'Frequency healing',href:'/wellbeing/sound'},
  {label:'Emotional & Mental Health',desc:'Trauma-informed care',href:'/wellbeing/mental'},
  {label:'Holistic Coaching',desc:'Whole-life guidance',href:'/wellbeing/coaching'},
  {label:'Spiritual Healing',desc:'Prayer & restoration',href:'/wellbeing/spiritual'},
];

function WellbeingSpiritual() {
  return <ServicePage img={I.prayer} label="Well-being & Ministry" am={true}
    breadcrumb={[{label:'Well-being',href:'/wellbeing'},{label:'Spiritual Healing',href:'/wellbeing/spiritual'}]}
    title="Spiritual Healing" titleEm="& Prayer."
    sub="Faith-rooted, covenant-protected healing — intercessory prayer, prophetic encouragement, and spiritual restoration."
    intro={[
      "Spiritual healing is the sacred cornerstone of everything we offer in the well-being dimension of this platform. Offered through our 508(c)(1)(a) Spiritual Healing Ministry and Private Holistic Association, it is governed by faith, protected by covenant, and open to all members.",
      "One-on-one and group prayer ministry sessions address the spiritual roots of physical, emotional, and financial struggle — because Leonard believes, as scripture attests, that healing begins in the spirit.",
      "Whether you need intercessory prayer in a crisis, prophetic encouragement for clarity, or sustained spiritual restoration through a season of transformation — our prayer ministry team is here and committed to walking with you."
    ]}
    features={[
      {icon:<Feather size={18}/>,am:true,title:'Intercessory Prayer Ministry',desc:'One-on-one and group prayer ministry sessions with trained, ordained ministers.'},
      {icon:<Heart size={18}/>,am:true,title:'Prophetic Encouragement',desc:'Spirit-led encouragement and discernment sessions to bring clarity and direction.'},
      {icon:<Users size={18}/>,am:true,title:'Healing Prayer Circles',desc:'Group prayer gatherings where the community holds each other in collective faith.'},
      {icon:<Shield size={18}/>,am:true,title:'Spiritual Restoration Counselling',desc:'Sustained ministry support for members walking through extended seasons of challenge.'},
    ]}
    relatedLinks={wbRelated.filter(r=>r.href!=='/wellbeing/spiritual')}
    cta={{label:'Request Prayer Ministry',href:'/membership/apply'}}
  />;
}

function WellbeingEnergy() {
  return <ServicePage img={I.energy} label="Well-being & Ministry" am={true}
    breadcrumb={[{label:'Well-being',href:'/wellbeing'},{label:'Energy & Body Wellness',href:'/wellbeing/energy'}]}
    title="Energy &amp; Body" titleEm="Wellness."
    sub="Somatic healing, Reiki, breathwork, and body-based practices that release stored trauma and restore natural balance."
    intro={[
      "The body holds everything we have experienced — joy, trauma, stress, and grief — stored at a cellular level. Energy and body wellness work addresses this directly: releasing what the body has been carrying and restoring its natural capacity for healing and vitality.",
      "Our certified energy practitioners guide members through Reiki, breathwork, somatic healing sessions, and body-based trauma release practices — all within the sacred covenant container of our Private Holistic Association.",
      "Members consistently report reduced chronic pain, improved sleep, emotional release, and a restored sense of embodied well-being within weeks of beginning these practices."
    ]}
    features={[
      {icon:<Sun size={18}/>,am:true,title:'Reiki Energy Healing',desc:'Hands-on and distance energy healing that clears blockages and restores flow.'},
      {icon:<Wind size={18}/>,am:true,title:'Breathwork Sessions',desc:'Guided breathing practices that regulate the nervous system and release stored tension.'},
      {icon:<Activity size={18}/>,am:true,title:'Somatic Trauma Release',desc:'Body-based practices that safely process and release trauma stored in the physical body.'},
      {icon:<Heart size={18}/>,am:true,title:'Movement Therapy',desc:'Gentle, intentional movement practices that restore body awareness and ease.'},
    ]}
    relatedLinks={wbRelated.filter(r=>r.href!=='/wellbeing/energy')}
    cta={{label:'Book a Session',href:'/membership/apply'}}
  />;
}

function WellbeingHerbal() {
  return <ServicePage img={I.herbal} label="Well-being & Ministry" am={false}
    breadcrumb={[{label:'Well-being',href:'/wellbeing'},{label:'Herbal Medicine',href:'/wellbeing/herbal'}]}
    title="Herbal &amp; Natural" titleEm="Medicine."
    sub="Plant-based healing protocols, nutritional guidance, and traditional natural remedies rooted in integrative medicine."
    intro={[
      "Plants have healed humanity for millennia. Herbal and natural medicine is not a rejection of modern healthcare — it is the honoring of ancient wisdom that modern science is increasingly validating.",
      "Our herbal medicine practitioners work with members to design personalized plant-based protocols addressing specific health concerns — from immune support and gut health to hormonal balance and stress resilience.",
      "Every protocol is built collaboratively, respecting your existing medical care and integrating natural remedies as a complement to, not replacement for, your broader healthcare approach."
    ]}
    features={[
      {icon:<Leaf size={18}/>,sg:true,title:'Personalized Herbal Protocols',desc:'Custom herbal formulas and supplement plans designed for your specific health goals.'},
      {icon:<BookOpen size={18}/>,sg:true,title:'Nutritional Guidance',desc:'Whole-food nutrition planning that supports healing and long-term vitality.'},
      {icon:<Activity size={18}/>,sg:true,title:'Integrative Health Assessment',desc:'A comprehensive review of your health history to identify natural intervention opportunities.'},
      {icon:<Shield size={18}/>,sg:true,title:'Ongoing Protocol Review',desc:'Regular check-ins to adjust your herbal and nutritional plan as you progress.'},
    ]}
    relatedLinks={wbRelated.filter(r=>r.href!=='/wellbeing/herbal')}
    cta={{label:'Begin Your Protocol',href:'/membership/apply'}}
  />;
}

function WellbeingSound() {
  return <ServicePage img={I.sound} label="Well-being & Ministry" am={true}
    breadcrumb={[{label:'Well-being',href:'/wellbeing'},{label:'Sound Therapy',href:'/wellbeing/sound'}]}
    title="Sound &amp; Vibration" titleEm="Therapy."
    sub="Frequency healing, sacred sound ceremonies, and vibrational tools that harmonize the nervous system and open channels of deep rest."
    intro={[
      "Sound has been used as a healing tool in sacred traditions across every culture for thousands of years. Modern science now confirms what ancient healers knew intuitively: specific frequencies and vibrational patterns directly affect the nervous system, brain wave activity, and cellular function.",
      "Our sound healing practitioners offer individual and group sessions using singing bowls, tuning forks, vocal toning, and other sacred instruments — creating immersive healing environments that guide participants into deep states of rest, restoration, and spiritual openness.",
      "Sound therapy is particularly effective for anxiety, insomnia, chronic stress, and emotional processing — and complements every other healing modality we offer."
    ]}
    features={[
      {icon:<Wind size={18}/>,am:true,title:'Singing Bowl Ceremonies',desc:'Immersive group and individual sessions using crystal and Tibetan singing bowls.'},
      {icon:<Activity size={18}/>,am:true,title:'Tuning Fork Therapy',desc:'Precision frequency work applied to specific meridian points and energy centers.'},
      {icon:<Feather size={18}/>,am:true,title:'Vocal Toning & Chanting',desc:'Sacred vocal practices that use the resonance of the human voice as a healing instrument.'},
      {icon:<Heart size={18}/>,am:true,title:'Frequency Healing Sessions',desc:'Personalized sessions using specific healing frequencies for targeted therapeutic outcomes.'},
    ]}
    relatedLinks={wbRelated.filter(r=>r.href!=='/wellbeing/sound')}
    cta={{label:'Book a Sound Session',href:'/membership/apply'}}
  />;
}

function WellbeingMental() {
  return <ServicePage img={I.mental} label="Well-being & Ministry" am={true}
    breadcrumb={[{label:'Well-being',href:'/wellbeing'},{label:'Emotional & Mental Health',href:'/wellbeing/mental'}]}
    title="Emotional &amp; Mental" titleEm="Health."
    sub="Trauma-informed, faith-integrated emotional wellness — safe, sacred support for healing grief, anxiety, and emotional wounds."
    intro={[
      "Emotional and mental health is not separate from spiritual or physical health — it is the thread that connects them. Unresolved grief, chronic anxiety, and emotional trauma affect every dimension of a person's wellbeing, including their financial decisions and relationship health.",
      "Our faith-informed emotional wellness support combines pastoral counseling, integrative therapeutic approaches, and community-held healing to provide members with safe, shame-free spaces for emotional processing and restoration.",
      "This is not clinical mental health treatment — it is holistic, faith-governed emotional wellness care offered within the sacred covenant of our Private Holistic Association, as a complement to any professional mental health services you may receive."
    ]}
    features={[
      {icon:<Heart size={18}/>,am:true,title:'Faith-Informed Pastoral Support',desc:'Compassionate, non-judgmental support from ordained ministers trained in trauma-informed care.'},
      {icon:<Users size={18}/>,am:true,title:'Grief & Loss Processing',desc:'Safe, held spaces for walking through seasons of loss, transition, and life change.'},
      {icon:<Shield size={18}/>,am:true,title:'Anxiety & Stress Wellness',desc:'Holistic practices — breathwork, prayer, and somatic tools — for chronic stress and anxiety.'},
      {icon:<Feather size={18}/>,am:true,title:'Emotional Restoration Journeys',desc:'Structured 8-week individual or group journeys through specific emotional healing tracks.'},
    ]}
    relatedLinks={wbRelated.filter(r=>r.href!=='/wellbeing/mental')}
    cta={{label:'Begin Emotional Healing',href:'/membership/apply'}}
  />;
}

function WellbeingCoaching() {
  return <ServicePage img={I.coaching} label="Well-being & Ministry" am={false}
    breadcrumb={[{label:'Well-being',href:'/wellbeing'},{label:'Holistic Coaching',href:'/wellbeing/coaching'}]}
    title="Holistic" titleEm="Coaching."
    sub="Whole-life guidance combining spiritual formation, emotional wellness, physical health, and practical life strategy."
    intro={[
      "Holistic coaching is the bridge between every dimension of this platform. It combines financial strategy, emotional wellness, spiritual formation, and practical life planning into a unified, personalized coaching relationship.",
      "Working with a certified holistic coach, members build a comprehensive life vision and the practical strategy to achieve it — addressing not just financial goals, but the internal blocks, patterns, and belief systems that shape every outcome.",
      "Holistic coaching sessions are available individually or as part of structured programs — and are available to all Member and Guardian tier members."
    ]}
    features={[
      {icon:<Target size={18}/>,title:'Life Vision Mapping',desc:'Defining your complete vision for financial, physical, spiritual, and relational flourishing.'},
      {icon:<Zap size={18}/>,title:'Belief & Pattern Work',desc:'Identifying and transforming limiting beliefs and patterns that block your progress.'},
      {icon:<UserCheck size={18}/>,title:'Accountability Partnerships',desc:'Regular check-ins that keep you aligned, progressing, and celebrating wins.'},
      {icon:<Layers size={18}/>,title:'Integrated Life Strategy',desc:'A unified strategy that aligns your financial, wellness, and spiritual goals into one coherent plan.'},
    ]}
    relatedLinks={wbRelated.filter(r=>r.href!=='/wellbeing/coaching')}
    cta={{label:'Book a Coaching Session',href:'/membership/apply'}}
  />;
}

/* Well-being overview */
function WellBeing() {
  return (
    <Layout>
      <PageHero img={I.healing} label="Well-being Services" title="Heal. Restore." titleEm="Thrive." sub="Six integrative healing services offered through our 508(c)(1)(a) Spiritual Healing Ministry and Private Holistic Association." am={true} breadcrumb={[{label:'Well-being',href:'/wellbeing'}]}/>
      <section className="section-xs section-ministry">
        <div className="container">
          <div className="pma-notice">
            <div className="pma-icon"><Lock size={19}/></div>
            <div>
              <h4>Private Holistic Association — Member Access</h4>
              <p>Healing services are offered through our 508(c)(1)(a) Ministry and Private Holistic Association. Full access for all covenant members. <Link to="/membership/apply" style={{color:'var(--am-300)',fontWeight:700}}>Enter the covenant here →</Link></p>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {[
            {img:I.prayer,href:'/wellbeing/spiritual',tag:'Ministry Core',title:'Spiritual Healing & Prayer',desc:'Intercessory prayer, prophetic encouragement, and spiritual restoration — the sacred cornerstone.',am:true},
            {img:I.energy,href:'/wellbeing/energy',tag:'Energy & Body',title:'Energy & Body Wellness',desc:'Reiki, breathwork, and somatic healing that releases stored tension and restores natural balance.',am:true},
            {img:I.herbal,href:'/wellbeing/herbal',tag:'Natural Medicine',title:'Herbal & Natural Medicine',desc:'Plant-based protocols and nutritional guidance rooted in integrative medicine wisdom.',am:false},
            {img:I.sound,href:'/wellbeing/sound',tag:'Vibrational',title:'Sound & Vibration Therapy',desc:'Sacred sound ceremonies and frequency healing that harmonize the nervous system.',am:true},
            {img:I.mental,href:'/wellbeing/mental',tag:'Emotional Health',title:'Emotional & Mental Health',desc:'Trauma-informed, faith-integrated emotional wellness for grief, anxiety, and healing.',am:true},
            {img:I.coaching,href:'/wellbeing/coaching',tag:'Coaching',title:'Holistic Coaching',desc:'Whole-life guidance — spiritual, emotional, physical, and practical strategy unified.',am:false},
          ].map(p=>(
            <Link to={p.href} className="program-row" key={p.title}>
              <img src={p.img} alt={p.title} className="program-row-img"/>
              <div className="program-row-body">
                <span className={`program-type${p.am?' am':''}`}>{p.tag}</span>
                <h3>{p.title}</h3><p>{p.desc}</p>
                <div className="program-meta"><span><ChevronRight size={13}/>View full service</span></div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════
   MINISTRY, MEMBERSHIP, PROGRAMS, RESOURCES,
   TRUST CENTER, DONATE, CONTACT
═══════════════════════════════════════════════ */
function Ministry() {
  return (
    <Layout>
      <PageHero img={I.prayer} label="Our Ministry" title="508(c)(1)(a)" titleEm="Spiritual Healing Ministry." am={true} sub="A legally recognized, faith-governed Spiritual Healing Ministry and Private Holistic Association." breadcrumb={[{label:'Ministry',href:'/ministry'}]}/>
      <section className="section">
        <div className="container">
          <div className="split split-3-2">
            <div className="content-block">
              <span className="label label-am">What is a 508(c)(1)(a)?</span>
              <div className="divider am"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2>A Legally Distinct<br/><em style={{fontStyle:'italic'}}>Sacred Structure</em></h2>
              <p>A 508(c)(1)(a) organization is a Mandatory Exception church/ministry under the Internal Revenue Code — automatically tax-exempt without requiring a 501(c)(3) application, operating under the First Amendment Free Exercise Clause.</p>
              <p>This designation allows us to operate a genuine faith-based healing ministry within this platform — with full legal protections for ministers, practitioners, and members. Our Private Holistic Association (PHA) further protects members under private contract law.</p>
              <div className="scripture-block" style={{margin:'16px 0'}}>
                <p className="scripture-text">"Beloved, I pray that you may prosper in all things and be in health, just as your soul prospers."</p>
                <cite className="scripture-ref">— 3 John 1:2</cite>
              </div>
              <div className="feature-list">
                {[
                  {icon:<Shield size={17}/>,am:true,title:'Legally Separate in Governance',desc:'Ministry operations governed by the Ministry Charter — faith-first, covenant-protected.'},
                  {icon:<Lock size={17}/>,am:true,title:'PHA Covenant Protection',desc:'All healing services operate under private contract law through the PHA member agreement.'},
                  {icon:<Feather size={17}/>,sg:true,title:'Faith Governs All Ministry Work',desc:'Every healing service offered in the context of faith, prayer, and covenant community.'},
                ].map(f=>(
                  <div className="feature-item" key={f.title}>
                    <div className={`feature-icon${f.am?' am':f.sg?' sg':''}`}>{f.icon}</div>
                    <div className="feature-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:32,display:'flex',gap:12,flexWrap:'wrap'}}>
                <Link to="/ministry/pha" className="btn btn-am btn-lg">About the PHA <ArrowRight size={15}/></Link>
                <Link to="/membership/apply" className="btn btn-outline-am btn-lg">Enter the Covenant</Link>
              </div>
            </div>
            <div><img src={I.nature} alt="" style={{width:'100%',borderRadius:24,aspectRatio:'3/4',objectFit:'cover',boxShadow:'var(--shadow-lg)'}}/></div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function MinistryPHA() {
  return (
    <Layout>
      <PageHero img={I.nature} label="Private Holistic Association" title="PHA Structure" titleEm="& Member Rights." am={true} sub="Understanding your rights, protections, and the legal framework governing all healing services." breadcrumb={[{label:'Ministry',href:'/ministry'},{label:'Private Holistic Association',href:'/ministry/pha'}]}/>
      <section className="section">
        <div className="container" style={{maxWidth:900,margin:'0 auto'}}>
          {['A Private Holistic Association (PHA) is a membership organization that operates under private contract law rather than public commercial law. Members voluntarily join the association by signing a Covenant Agreement, which governs the terms of their access to healing services within the association.',
            "Because services are offered within a private member covenant — not as commercial healthcare — our practitioners can offer a broader range of holistic and integrative healing modalities without the restrictions that apply to public commercial healthcare businesses.",
            "This structure is entirely legal and widely used by holistic health organizations across the United States. It protects both members and practitioners — ensuring that healing services are offered in a sacred, consent-based, covenant-governed environment.",
            "Every member who joins Infinite Wealth & Well-being receives a full copy of the PHA Covenant Agreement explaining their rights, the association's obligations, and the parameters of the healing services offered."
          ].map((p,i)=><p key={i} style={{color:'var(--text-muted)',lineHeight:1.9,marginBottom:20,fontSize:'1.05rem'}}>{p}</p>)}
          <div style={{marginTop:36,display:'flex',gap:12,flexWrap:'wrap'}}>
            <Link to="/membership/apply" className="btn btn-am btn-lg">Join the Association <ArrowRight size={16}/></Link>
            <Link to="/trust-center" className="btn btn-outline-gold btn-lg">View Trust Center</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Membership() {
  return (
    <Layout>
      <PageHero img={I.members} label="Membership" title="Find Your Path" titleEm="to Transformation." sub="One membership gives you access to both wealth advisory and well-being resources." breadcrumb={[{label:'Membership',href:'/membership'}]}/>
      <section className="section">
        <div className="container">
          <div className="membership-deck">
            {[
              {tier:'Foundation',name:'Explorer',price:'Free',period:'always open',desc:'Wealth resources, community & open healing events.',features:['Community Forum','Monthly Newsletter','Wealth Resource Library','Open Healing Events','Prayer Request Portal','Basic Financial Guides'],btn:'btn-outline-gold',featured:false},
              {tier:'Member',name:'Member',price:'$49',period:'/ month',desc:'Full access — wealth advisory, healing services & coaching.',features:['All Explorer Benefits','Wealth Advisory Access','4 Strategy Sessions/Mo','All Healing Services','Practitioner Booking','Progress Dashboard','Accountability Partner','Retreat Discounts 30%'],btn:'btn-gold',badge:'Most Popular',featured:true},
              {tier:'Guardian',name:'Guardian',price:'$149',period:'/ month',desc:'Unlimited — personal coaching, 1-on-1 ministry & annual retreat.',features:['All Member Benefits','Monthly 1-on-1 Advisory','Ministry Session/Mo','Priority Practitioner Access','Annual Retreat Included','Governance Voting Rights','Direct Access to Leonard'],btn:'btn-outline-gold',featured:false},
            ].map(p=>(
              <div className={`plan-card${p.featured?' featured':''}`} key={p.name}>
                {p.badge && <div className="plan-badge gold">{p.badge}</div>}
                <div className="plan-tier">{p.tier}</div>
                <div className="plan-name">{p.name}</div>
                <p className="plan-desc">{p.desc}</p>
                <div className="plan-price">{p.price}</div>
                <div className="plan-period">{p.period}</div>
                <div className="plan-divider"/>
                <ul className="plan-features">
                  {p.features.map(f=><li className="plan-feature" key={f}><CheckCircle size={14} className="plan-feature-icon"/>{f}</li>)}
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

function MemberBenefits() {
  return (
    <Layout>
      <PageHero img={I.members} label="Member Benefits" title="Everything You" titleEm="Get Access To." sub="A complete breakdown of every benefit across all three membership tiers." breadcrumb={[{label:'Membership',href:'/membership'},{label:'All Benefits',href:'/membership/benefits'}]}/>
      <section className="section">
        <div className="container">
          <div className="trust-grid">
            {[
              {icon:<TrendingUp/>,title:'Wealth Advisory Access',desc:'Professional wealth planning, investment guidance, and financial strategy sessions with our certified advisory team.',meta:'Member & Guardian'},
              {icon:<Heart/>,title:'Healing Service Access',desc:'Full access to all six well-being service categories — spiritual healing, energy work, herbal medicine, sound therapy, emotional health, and holistic coaching.',meta:'Member & Guardian',am:true},
              {icon:<Users/>,title:'Community & Accountability',desc:'Access to the full member community forum, accountability partnerships, and peer wealth-building cohorts.',meta:'All Tiers'},
              {icon:<Feather/>,title:'Ministry & Prayer Access',desc:'Personal and group prayer ministry, intercessory healing, and spiritual restoration sessions.',meta:'Member & Guardian',am:true},
              {icon:<Award/>,title:'Annual Retreat Included',desc:'Guardian members receive a fully included place at our annual Infinite Wealth & Well-being retreat.',meta:'Guardian Only'},
              {icon:<Star/>,title:'Direct Access to Leonard',desc:'Guardian members have direct personal access to Leonard M. Diana for advisory and ministry matters.',meta:'Guardian Only'},
            ].map(v=>(
              <div className={`trust-item${v.am?' am-item':''}`} key={v.title} style={{cursor:'default'}}>
                <div className={`trust-item-icon${v.am?' am':''}`}>{v.icon}</div>
                <div><h4>{v.title}</h4><p>{v.desc}</p><div className={`trust-meta${v.am?' am':''}`}><CheckCircle size={10}/>{v.meta}</div></div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:56}}>
            <Link to="/membership/apply" className="btn btn-gold btn-lg">Apply for Membership <ArrowRight size={16}/></Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function MemberApply() {
  return (
    <Layout>
      <PageHero img={I.about1} label="Apply Now" title="Your Journey" titleEm="Begins Here." sub="Complete this short form and our team will welcome you within 24 hours." breadcrumb={[{label:'Membership',href:'/membership'},{label:'Apply',href:'/membership/apply'}]}/>
      <section className="section section-dark">
        <div className="container">
          <div className="contact-wrap">
            <div className="contact-side">
              <span className="label label-light">Application</span>
              <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2>We're Honored<br/>You're Here</h2>
              <p>Membership gives you simultaneous access to professional wealth advisory and sacred healing — under one roof, governed with integrity.</p>
              {[
                {icon:<CheckCircle size={17}/>,t:'Same-Day Access',d:'Community, resources & open events available immediately'},
                {icon:<Shield size={17}/>,t:'Fully Private',d:'All covenant and healing matters held in sacred confidence'},
                {icon:<Heart size={17}/>,t:'Free to Begin',d:'Explorer membership requires no payment or commitment'},
              ].map(i=>(
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
                <div className="field"><label>First Name</label><input type="text" placeholder="Your name"/></div>
                <div className="field"><label>Last Name</label><input type="text" placeholder="Last name"/></div>
              </div>
              <div className="field"><label>Email Address</label><input type="email" placeholder="your@email.com"/></div>
              <div className="field"><label>Membership Tier</label>
                <select><option>Explorer (Free)</option><option>Member ($49/mo)</option><option>Guardian ($149/mo)</option></select>
              </div>
              <div className="field"><label>Primary Interest</label>
                <select><option>Wealth & Financial Planning</option><option>Holistic Health & Healing</option><option>Spiritual Well-being & Ministry</option><option>Community & Connection</option><option>All of the Above</option></select>
              </div>
              <div className="field"><label>Tell Us About Yourself</label><textarea placeholder="Share what brings you here..."/></div>
              <button className="btn btn-gold btn-lg" style={{width:'100%',justifyContent:'center'}}>Submit Application <ArrowRight size={16}/></button>
              <p style={{fontSize:12,color:'var(--text-faint)',textAlign:'center',marginTop:13,display:'flex',alignItems:'center',justifyContent:'center',gap:5}}><Shield size={11}/> All applications held in complete confidence</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Programs() {
  return (
    <Layout>
      <PageHero img={I.summit} label="Programs & Events" title="Experiences That" titleEm="Change Everything." sub="Wealth programs, healing retreats, live events — combining financial empowerment with holistic transformation." breadcrumb={[{label:'Programs',href:'/programs'}]}/>
      <section className="section">
        <div className="container">
          {[
            {img:I.summit,href:'/programs/summit',tag:'Annual Event',title:'IWW Summit 2026',desc:'Three transformative days — wealth strategy, holistic healing, spiritual renewal, and community. Hartford, CT.',date:'Oct 12–14, 2026',dur:'3 Days',spots:'200 places',am:false},
            {img:I.prog2,href:'/programs/wealth-builder',tag:'Wealth Program',title:'90-Day Wealth Builder',desc:"Leonard's signature program — financial confusion to a clear executable wealth strategy in 90 days.",date:'Starts monthly',dur:'90 Days',spots:'Open enrollment',am:false},
            {img:I.retreat,href:'/programs/healing-retreat',tag:'Ministry Retreat',title:'Healing & Wholeness Retreat 2026',desc:'Three days of prayer ministry, healing workshops, nature immersion, and sacred community.',date:'August 2026',dur:'3 Days',spots:'40 covenant members',am:true},
            {img:I.prog3,href:'/programs/foundations',tag:'Workshop Series',title:'Financial Foundations Intensive',desc:'6-week live workshop series — budgeting, debt, investing, tax strategy, and your first wealth plan.',date:'Rolling start',dur:'6 Weeks',spots:'24 per cohort',am:false},
            {img:I.prayer,href:'/programs/wholeness',tag:'Ministry Program',title:'90-Day Wholeness Journey',desc:'Spiritual formation, holistic healing, and covenant community — deep transformation across every dimension.',date:'Starts monthly',dur:'90 Days',spots:'Open enrollment',am:true},
            {img:I.nature,href:'/programs',tag:'Learning Track',title:'Financial Well-being Track',desc:'Self-paced learning exploring the connection between financial security and overall life satisfaction.',date:'Self-paced',dur:'8 Modules',spots:'Unlimited',am:false},
          ].map(p=>(
            <Link to={p.href} className="program-row" key={p.title}>
              <img src={p.img} alt={p.title} className="program-row-img"/>
              <div className="program-row-body">
                <span className={`program-type${p.am?' am':''}`}>{p.tag}</span>
                <h3>{p.title}</h3><p>{p.desc}</p>
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

function ProgramDetail({ img, tag, am, title, titleEm, sub, body, parentLabel='Programs', parentHref='/programs' }) {
  return (
    <Layout>
      <PageHero img={img} label={tag} title={title} titleEm={titleEm} sub={sub} am={am} breadcrumb={[{label:parentLabel,href:parentHref},{label:title+' '+titleEm,href:'#'}]}/>
      <section className="section">
        <div className="container" style={{maxWidth:900,margin:'0 auto'}}>
          {body.map((p,i)=><p key={i} style={{color:'var(--text-muted)',lineHeight:1.9,marginBottom:20,fontSize:'1.05rem'}}>{p}</p>)}
          <div style={{marginTop:40,display:'flex',gap:14,flexWrap:'wrap'}}>
            <Link to="/membership/apply" className={`btn ${am?'btn-am':'btn-gold'} btn-lg`}>Reserve Your Place <ArrowRight size={16}/></Link>
            <Link to="/programs" className="btn btn-outline-gold btn-lg">All Programs</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Resources() {
  return (
    <Layout>
      <PageHero img={I.educate} label="Resources" title="Knowledge Is" titleEm="the Foundation." sub="Articles, guides, and tools covering both wealth management and holistic well-being." breadcrumb={[{label:'Resources',href:'/resources'}]}/>
      <section className="section">
        <div className="container">
          <div className="article-grid">
            {[
              {img:I.wealth,tag:'Wealth',href:'/resources/wealth',title:'7 Wealth-Building Habits That Transform Your Financial Future',desc:'Practical, proven strategies from certified financial planners designed for real people with real budgets.',time:'8 min'},
              {img:I.invest,tag:'Investing',href:'/resources/wealth',title:'The Compounding Effect: Why Starting Now Is Everything',desc:'How time in the market — not timing the market — creates the compounding wealth effect that separates the prosperous from everyone else.',time:'6 min'},
              {img:I.protect,tag:'Protection',href:'/resources/wealth',title:'Asset Protection 101: Shielding Your Wealth from Risk',desc:'Legal structures and planning tools that protect what you build from lawsuits, creditors, and unexpected events.',time:'5 min'},
              {img:I.herbal,tag:'Healing',href:'/resources/healing',title:'Herbal Medicine Foundations: Five Plants That Heal',desc:'Five foundational herbs, their applications, and how they support the body\'s natural capacity for restoration.',time:'7 min'},
              {img:I.prayer,tag:'Ministry',href:'/resources/healing',title:'What the Bible Says About Divine Health & Prosperity',desc:'Scriptural foundations for whole-person healing — what God\'s word says about financial and physical wholeness together.',time:'9 min'},
              {img:I.mental,tag:'Well-being',href:'/resources/healing',title:'Financial Well-being: How Money Peace Creates Life Peace',desc:'The research-backed connection between financial security and overall life satisfaction — and the practical steps to get there.',time:'6 min'},
            ].map(a=>(
              <Link to={a.href} className="article-card" key={a.title}>
                <div className="article-img-wrap"><img src={a.img} alt={a.title} className="article-img"/></div>
                <div className="article-body">
                  <span className={`article-tag${['Healing','Ministry','Well-being'].includes(a.tag)?' am':''}`}>{a.tag}</span>
                  <h4>{a.title}</h4><p>{a.desc}</p>
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

function TrustCenter() {
  return (
    <Layout>
      <PageHero img={I.trust} label="Trust Center" title="Governed with" titleEm="Full Transparency." sub="Every policy, charter, and governance record — open to all members." breadcrumb={[{label:'Trust Center',href:'/trust-center'}]}/>
      <section className="section section-dark">
        <div className="container">
          <div className="trust-grid">
            {[
              {icon:<FileText/>,title:'Organization Charter',desc:'Founding document — values, governance, decision processes, and all member rights.',meta:'Reviewed Annually'},
              {icon:<Shield/>,title:'Advisory Ethics Code',desc:'Full fiduciary standard documentation — every wealth recommendation made in your interest.',meta:'Fiduciary Standard'},
              {icon:<Feather/>,title:'Ministry Covenant Charter',desc:'Complete charter governing our 508(c)(1)(a) Ministry — faith governance and covenant rights.',meta:'Ministry Governed',am:true},
              {icon:<Lock/>,title:'Privacy & Consent Policy',desc:'Plain-language policy: exactly how member data, ministry communications, and healing details are protected.',meta:'Covenant Protected',am:true},
              {icon:<Award/>,title:'Practitioner Standards',desc:'Verification requirements and ethical codes governing every advisor and practitioner in our network.',meta:'Independent Review'},
              {icon:<Users/>,title:'Grievance & Support Process',desc:'A clear, confidential process for any member to raise concerns or request pastoral and advisory support.',meta:'48h Response SLA'},
            ].map(v=>(
              <div className={`trust-item${v.am?' am-item':''}`} key={v.title} style={{cursor:'default'}}>
                <div className={`trust-item-icon${v.am?' am':''}`}>{v.icon}</div>
                <div><h4>{v.title}</h4><p>{v.desc}</p><div className={`trust-meta${v.am?' am':''}`}><CheckCircle size={10}/>{v.meta}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Donate() {
  const [amt, setAmt] = useState('$50');
  return (
    <Layout>
      <PageHero img={I.community} label="Stewardship" title="Invest in the" titleEm="Community." sub="Fund financial literacy scholarships, free healing events, and Hartford community outreach." breadcrumb={[{label:'Donate',href:'/donate'}]}/>
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
                  {icon:<Users size={17}/>,cls:'',title:'Free Workshops',d:'$50 sponsors a free financial literacy or healing workshop for up to 30 local residents.'},
                  {icon:<Feather size={17}/>,cls:'am',title:'Ministry Resources',d:'$100 funds a new healing guide, educational resource, or ministry program tool.'},
                  {icon:<Globe size={17}/>,cls:'',title:'Outreach Expansion',d:'$250 supports a full month of community outreach programs beyond Hartford.'},
                ].map(i=>(
                  <div className="feature-item" key={i.title}>
                    <div className={`feature-icon${i.cls?' '+i.cls:''}`}>{i.icon}</div>
                    <div className="feature-text"><h4>{i.title}</h4><p>{i.d}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="contact-card">
              <h3>Make a Contribution</h3>
              <p>Every gift creates lasting impact in our community.</p>
              <label style={{display:'block',fontSize:10.5,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:9}}>Select Amount</label>
              <div className="donate-amounts" style={{marginTop:0,marginBottom:20}}>
                {['$25','$50','$100','$250','Custom'].map(a=>(
                  <button key={a} className={`donate-pill${amt===a?' selected':''}`} onClick={()=>setAmt(a)} style={{background:amt===a?'linear-gradient(135deg,var(--gold-400),var(--gold-600))':'rgba(196,146,42,0.06)',border:amt===a?'none':'1.5px solid var(--border-dark)',color:amt===a?'white':'var(--gold-700)'}}>{a}</button>
                ))}
              </div>
              <div className="form-row2">
                <div className="field"><label>First Name</label><input type="text" placeholder="Jane"/></div>
                <div className="field"><label>Last Name</label><input type="text" placeholder="Smith"/></div>
              </div>
              <div className="field"><label>Email</label><input type="email" placeholder="jane@example.com"/></div>
              <div className="field"><label>Dedication (Optional)</label><input type="text" placeholder="In honor / memory of..."/></div>
              <button className="btn btn-gold btn-lg" style={{width:'100%',justifyContent:'center',marginTop:8}}><Gift size={17}/> Complete Donation</button>
              <p style={{fontSize:12,color:'var(--text-faint)',textAlign:'center',marginTop:13,display:'flex',alignItems:'center',justifyContent:'center',gap:5}}><Shield size={11}/> Secure · Tax receipt provided · 100% mission-directed</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Contact() {
  return (
    <Layout>
      <section className="section section-dark" style={{paddingTop:'calc(var(--nav-height) + 80px)'}}>
        <div className="container">
          <div className="contact-wrap">
            <div className="contact-side">
              <span className="label label-light">Get in Touch</span>
              <div className="divider"><div className="divider-line"/><div className="divider-dot"/></div>
              <h2>We'd Love to<br/><em style={{fontStyle:'italic'}}>Hear From You</em></h2>
              <p>Whether you have a wealth question, need prayer, or want to connect with a healing practitioner — we're here and we genuinely care.</p>
              {[
                {icon:<Mail size={17}/>,t:'Email Us',d:'hello@infinitewealthwellbeing.org'},
                {icon:<Phone size={17}/>,t:'Call Us',d:'401-702-2460'},
                {icon:<MapPin size={17}/>,t:'Location',d:'Hartford, CT — serving locally and online'},
                {icon:<Clock size={17}/>,t:'Response Time',d:'All inquiries answered within 24 business hours'},
              ].map(d=>(
                <div className="contact-detail-item" key={d.t}>
                  <div className="contact-detail-icon">{d.icon}</div>
                  <div className="contact-detail-text"><h5>{d.t}</h5><p>{d.d}</p></div>
                </div>
              ))}
            </div>
            <div className="contact-card">
              <h3>Send a Message</h3>
              <p>Our team responds personally within one business day.</p>
              <div className="form-row2">
                <div className="field"><label>First Name</label><input type="text" placeholder="Jane"/></div>
                <div className="field"><label>Last Name</label><input type="text" placeholder="Smith"/></div>
              </div>
              <div className="field"><label>Email Address</label><input type="email" placeholder="your@email.com"/></div>
              <div className="field"><label>Subject</label>
                <select>
                  <option>General Inquiry</option><option>Wealth Advisory</option><option>Membership Questions</option>
                  <option>Prayer Request</option><option>Healing Service Booking</option><option>Ministry Partnership</option>
                  <option>Retreat Information</option><option>Donation Enquiry</option><option>Technical Support</option>
                </select>
              </div>
              <div className="field"><label>Message</label><textarea placeholder="How can we serve you?"/></div>
              <button className="btn btn-gold btn-lg" style={{width:'100%',justifyContent:'center'}}>Send Message <ArrowRight size={16}/></button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════
   CSS ADDITIONS — breadcrumb + page hero fixes
═══════════════════════════════════════════════ */
const extraCSS = `
.breadcrumb { display:flex; align-items:center; gap:6px; margin-bottom:20px; flex-wrap:wrap; }
.bc-link { font-size:12px; font-weight:600; color:rgba(255,255,255,0.45); text-decoration:none; display:flex; align-items:center; gap:4px; transition:color .15s; }
.bc-link:hover { color:var(--gold-300); }
.bc-sep { color:rgba(255,255,255,0.25); display:flex; align-items:center; }
.bc-current { font-size:12px; font-weight:600; color:var(--gold-300); }
.nav-dropdown { min-width:460px; }
`;

// Inject extra CSS
if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = extraCSS;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════
   ROUTER — every route has a dedicated page
═══════════════════════════════════════════════ */
export default function PublicSite() {
  return (
    <>
      <ScrollTop/>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home/>}/>

        {/* About */}
        <Route path="/about"          element={<About/>}/>
        <Route path="/about/founder"  element={<AboutFounder/>}/>
        <Route path="/about/impact"   element={<AboutImpact/>}/>

        {/* Wealth — overview + 6 service pages */}
        <Route path="/wealth"                element={<Wealth/>}/>
        <Route path="/wealth/empowerment"    element={<WealthEmpowerment/>}/>
        <Route path="/wealth/investment"     element={<WealthInvestment/>}/>
        <Route path="/wealth/protection"     element={<WealthProtection/>}/>
        <Route path="/wealth/education"      element={<WealthEducation/>}/>
        <Route path="/wealth/business"       element={<WealthBusiness/>}/>
        <Route path="/wealth/community"      element={<WealthCommunity/>}/>

        {/* Well-being — overview + 6 service pages */}
        <Route path="/wellbeing"             element={<WellBeing/>}/>
        <Route path="/wellbeing/spiritual"   element={<WellbeingSpiritual/>}/>
        <Route path="/wellbeing/energy"      element={<WellbeingEnergy/>}/>
        <Route path="/wellbeing/herbal"      element={<WellbeingHerbal/>}/>
        <Route path="/wellbeing/sound"       element={<WellbeingSound/>}/>
        <Route path="/wellbeing/mental"      element={<WellbeingMental/>}/>
        <Route path="/wellbeing/coaching"    element={<WellbeingCoaching/>}/>

        {/* Ministry */}
        <Route path="/ministry"      element={<Ministry/>}/>
        <Route path="/ministry/pha"  element={<MinistryPHA/>}/>

        {/* Membership */}
        <Route path="/membership"          element={<Membership/>}/>
        <Route path="/membership/benefits" element={<MemberBenefits/>}/>
        <Route path="/membership/apply"    element={<MemberApply/>}/>

        {/* Programs */}
        <Route path="/programs"                element={<Programs/>}/>
        <Route path="/programs/summit"         element={<ProgramDetail img={I.summit} tag="Annual Event" am={false} title="IWW Summit" titleEm="2026." sub="Three transformative days — wealth strategy, holistic healing, spiritual renewal, and community." body={["The Infinite Wealth & Well-being Summit is our flagship annual gathering — three days that bring the entire community together for wealth strategy sessions, holistic healing workshops, spiritual renewal, and authentic community connection.","Day 1 focuses on financial empowerment: Leonard and the advisory team lead intensive wealth strategy sessions, investment workshops, and financial planning clinics. Day 2 shifts to well-being and healing: group sound ceremonies, herbal medicine workshops, energy healing sessions, and holistic coaching intensives. Day 3 integrates both: joint sessions exploring the intersection of financial and holistic well-being, community covenant renewal, and celebration.","The Summit is open to all Member and Guardian tier members. Guardian members attend at no additional cost. Member tier members receive a significant event discount. A limited number of general admission places are also available."]}/>}/>
        <Route path="/programs/wealth-builder" element={<ProgramDetail img={I.wealth} tag="Wealth Program" am={false} title="90-Day Wealth" titleEm="Builder." sub="From financial confusion to a clear, executable wealth strategy — in 90 days." body={["The 90-Day Wealth Builder is Leonard's signature financial transformation program — the most direct path from where you are financially to where you deserve to be. Designed for members who are ready to move from financial confusion, debt, and uncertainty to clarity, strategy, and momentum.","The program runs across 12 weeks with weekly group advisory sessions led by Leonard and the wealth team, personalized financial assessments, weekly action items, peer accountability partnerships, and a final written wealth plan you walk away with and own.","Every participant begins with a complete financial assessment that forms the foundation of their personalized plan. The curriculum covers debt elimination, income optimization, investment basics, emergency fund building, and long-term wealth strategy — in that order, for good reason."]}/>}/>
        <Route path="/programs/healing-retreat" element={<ProgramDetail img={I.retreat} tag="Ministry Retreat" am={true} title="Healing & Wholeness" titleEm="Retreat 2026." sub="Three sacred days of prayer ministry, integrative healing, nature immersion, and covenant community." body={["The Healing & Wholeness Retreat is the most immersive and transformative experience we offer in the well-being dimension of this platform. Limited to 40 covenant members, it is a three-day sacred gathering in a natural setting near Hartford, CT.","Day 1 centers on arrival, community covenant, and opening prayer ceremonies — establishing the sacred container for everything that follows. Day 2 is the heart of the retreat: individual and group prayer ministry sessions, energy healing workshops, sound healing ceremonies, herbal medicine presentations, and time in nature. Day 3 focuses on integration: what you've received, how to carry it home, and the practical steps of continued healing.","Every session is led by ministry-approved, covenant-committed practitioners. All healing work is offered within the sacred protection of our 508(c)(1)(a) Ministry and Private Holistic Association."]}/>}/>
        <Route path="/programs/foundations"    element={<ProgramDetail img={I.educate} tag="Workshop Series" am={false} title="Financial Foundations" titleEm="Intensive." sub="Six weeks — from financial basics to your first complete wealth plan." body={["The Financial Foundations Intensive is our most accessible structured learning experience — a six-week live workshop series that takes participants from financial basics all the way to a complete, personalized wealth plan.","Week 1 covers the foundations: understanding your financial picture, building a budget that works, and identifying your biggest financial leaks. Weeks 2 and 3 address debt: understanding it, eliminating it strategically, and freeing up capital for wealth building. Week 4 introduces investing: the basics of portfolio construction, compound growth, and how to start regardless of your starting balance. Week 5 covers tax strategy and legal structures. Week 6 brings it all together: each participant leaves with a written, executable financial plan.","Cohorts are limited to 24 participants to ensure personalized attention and genuine community."]}/>}/>
        <Route path="/programs/wholeness"      element={<ProgramDetail img={I.healing} tag="Ministry Program" am={true} title="90-Day Wholeness" titleEm="Journey." sub="Spirit, mind, and body — deep transformation across every dimension of life." body={["The 90-Day Wholeness Journey is our most comprehensive integrative healing program — combining spiritual formation, holistic health practices, emotional wellness support, and covenant community accountability into a single, transformative 90-day experience.","Participants move through four 3-week phases: Groundwork (weeks 1–3, establishing spiritual and physical baseline practices), Excavation (weeks 4–6, addressing the deeper roots of physical and emotional patterns), Integration (weeks 7–9, building new holistic health rhythms), and Flourishing (weeks 10–12, sustaining transformation and celebrating growth).","Weekly group sessions, individual practitioner check-ins, a curated herbal and nutritional protocol, prayer ministry access, and peer accountability are all included. This is not a surface-level program — it is designed for members who are ready for real, lasting transformation."]}/>}/>

        {/* Resources */}
        <Route path="/resources"         element={<Resources/>}/>
        <Route path="/resources/wealth"  element={<Resources/>}/>
        <Route path="/resources/healing" element={<Resources/>}/>
        <Route path="/resources/tools"   element={<Resources/>}/>

        {/* Other pages */}
        <Route path="/trust-center"       element={<TrustCenter/>}/>
        <Route path="/trust-center/:slug" element={<TrustCenter/>}/>
        <Route path="/donate"             element={<Donate/>}/>
        <Route path="/contact"            element={<Contact/>}/>

        {/* 404 fallback */}
        <Route path="*" element={<Home/>}/>
      </Routes>
    </>
  );
}

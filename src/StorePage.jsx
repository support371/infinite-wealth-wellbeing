import {
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  HeartHandshake,
  Landmark,
  Leaf,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const STORE_URL = 'https://muscular-aether-axis-core.base44.app/';

const STORE_CATEGORIES = [
  {
    name: 'Wealth Services',
    count: 47,
    icon: Landmark,
    description: 'Wealth empowerment, investment strategy, asset protection and financial education.',
  },
  {
    name: 'Well-being',
    count: 35,
    icon: Leaf,
    description: 'Spiritual healing, herbal medicine, energy wellness, sound therapy and holistic coaching.',
  },
  {
    name: 'Ministry',
    count: 4,
    icon: HeartHandshake,
    description: 'Ministry formation, credentials, officiant services and faith-centered counseling.',
  },
  {
    name: 'Membership',
    count: 2,
    icon: ShieldCheck,
    description: 'Ongoing access designed for people building a more supported and resilient life.',
  },
  {
    name: 'Programs',
    count: 8,
    icon: Sparkles,
    description: 'Guided experiences that bring wealth, well-being and community into one plan.',
  },
  {
    name: 'Resources',
    count: 4,
    icon: BookOpen,
    description: 'Practical learning materials and tools for progress between sessions.',
  },
];

export default function StorePage() {
  return (
    <div className="store-page">
      <section className="store-hero">
        <div className="container store-hero-inner">
          <div>
            <span className="label label-light">Aether &amp; Axis · Official Base44 store</span>
            <h1>One trusted destination for wealth and whole-person well-being.</h1>
            <p>Explore Leonard M. Diana’s complete Infinite Wealth &amp; Well-being catalog—100 verified listings spanning financial empowerment, healing, ministry, programs and practical resources.</p>
            <div className="store-hero-actions">
              <a href={STORE_URL} target="_blank" rel="noreferrer" className="btn btn-gold btn-lg">
                Open the official store <ArrowUpRight size={17}/>
              </a>
              <Link to="/contact" className="btn btn-ghost btn-lg">Get personal guidance</Link>
            </div>
          </div>
          <aside className="store-trust-card">
            <ShieldCheck/>
            <strong>A verified connection</strong>
            <p>This gateway now points directly to the Aether &amp; Axis storefront you identified, so visitors reach the complete and current catalog.</p>
            <span><CheckCircle/> 100 listings available</span>
            <span><CheckCircle/> Secure checkout on Base44</span>
            <span><CheckCircle/> Wealth, wellness and ministry in one place</span>
          </aside>
        </div>
      </section>

      <section className="section section-ivory" id="catalog">
        <div className="container">
          <div className="store-catalog-head">
            <div>
              <span className="label">Explore the catalog</span>
              <h2>Choose the support that moves you forward.</h2>
              <p>Browse by outcome here, then continue to the official Aether &amp; Axis store for full details, availability and checkout.</p>
            </div>
            <div className="store-status" data-live="true"><span/>Verified Base44 destination</div>
          </div>

          <div className="store-grid">
            {STORE_CATEGORIES.map(({ name, count, icon: Icon, description }) => (
              <article className="store-card store-category-card" key={name}>
                <div className="store-card-media">
                  <div className="store-card-mark"><Icon/><span>{count} listings</span></div>
                  <span>{name}</span>
                </div>
                <div className="store-card-body">
                  <h2>{name}</h2>
                  <p>{description}</p>
                  <div className="store-card-foot">
                    <span>{count} options</span>
                    <a href={STORE_URL} target="_blank" rel="noreferrer">
                      Browse in store <ArrowUpRight size={14}/>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="store-final-cta">
            <div>
              <span className="label">All services</span>
              <h2>Ready to see the full collection?</h2>
              <p>Search, filter, compare and purchase from the complete official storefront.</p>
            </div>
            <a href={STORE_URL} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
              Visit Aether &amp; Axis <ArrowUpRight size={17}/>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

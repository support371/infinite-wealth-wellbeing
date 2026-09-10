import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@base44/sdk';
import { ArrowRight, Building2, CheckCircle, LockKeyhole, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const STORE_APP_ID = '6a4b77b56397f06ba1da0abc';
const store = createClient({ appId: STORE_APP_ID });

const CATEGORY_LABELS = {
  cybersecurity: 'Cybersecurity',
  real_estate: 'Property & real estate',
  consulting: 'Advisory & consulting',
  other: 'Specialist services',
};

const FALLBACK_PRODUCTS = [
  { id: 'fallback-1', name: 'GEM Phishing Test & Awareness Report', description: 'A team phishing simulation with a practical findings and training report.', category: 'cybersecurity', price: 15 },
  { id: 'fallback-2', name: 'Alliance Trust — Lease Agreement Review', description: 'Pre-signing review and risk screening for residential or commercial lease agreements.', category: 'real_estate', price: 45 },
  { id: 'fallback-3', name: 'Investment Property Consultation', description: 'A focused consultation covering property strategy, risk and portfolio priorities.', category: 'consulting', price: 149 },
  { id: 'fallback-4', name: 'GEM Identity Theft Recovery Kit', description: 'A structured recovery toolkit with dispute, monitoring and response guidance.', category: 'cybersecurity', price: 65 },
];

export default function StorePage() {
  const [state, setState] = useState({ loading: true, products: [], live: false, error: '' });
  const [category, setCategory] = useState('all');

  async function loadCatalog() {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const products = await store.entities.Product.filter({ in_stock: true }, 'sort_order', 24, 0);
      setState({ loading: false, products, live: true, error: '' });
    } catch {
      setState({
        loading: false,
        products: FALLBACK_PRODUCTS,
        live: false,
        error: 'The live Base44 inventory is temporarily unavailable, so this page is showing the verified catalog preview.',
      });
    }
  }

  useEffect(() => { loadCatalog(); }, []);

  const categories = useMemo(
    () => ['all', ...new Set(state.products.map((product) => product.category).filter(Boolean))],
    [state.products],
  );
  const visible = category === 'all'
    ? state.products
    : state.products.filter((product) => product.category === category);

  return (
    <div className="store-page">
      <section className="store-hero">
        <div className="container store-hero-inner">
          <div>
            <span className="label label-light">Leonard Store · Base44 connected</span>
            <h1>Practical services for a more secure, resilient future.</h1>
            <p>Explore the managed GEM and Alliance Trust service catalog from inside Infinite Wealth &amp; Well-being. Every request is reviewed before delivery or payment.</p>
            <div className="store-hero-actions">
              <a href="#catalog" className="btn btn-gold btn-lg">Explore catalog <ArrowRight size={17}/></a>
              <Link to="/contact" className="btn btn-ghost btn-lg">Talk with the team</Link>
            </div>
          </div>
          <aside className="store-trust-card">
            <ShieldCheck/>
            <strong>Governed service access</strong>
            <p>No automatic charge, investment action or security operation begins from this page. Scope and delivery are confirmed first.</p>
            <span><CheckCircle/> Catalog source identified</span>
            <span><CheckCircle/> Human review before fulfillment</span>
            <span><CheckCircle/> Secure member workspace available</span>
          </aside>
        </div>
      </section>

      <section className="section section-ivory" id="catalog">
        <div className="container">
          <div className="store-catalog-head">
            <div>
              <span className="label">Managed catalog</span>
              <h2>Choose the outcome you need.</h2>
              <p>Live inventory is read from the connected Base44 Leonard Store when public catalog access is available.</p>
            </div>
            <div className="store-status" data-live={state.live}>
              <span/>{state.live ? 'Live Base44 catalog' : 'Verified catalog preview'}
            </div>
          </div>

          {state.error && <div className="store-notice"><LockKeyhole/>{state.error}<button onClick={loadCatalog}><RefreshCcw/> Retry</button></div>}

          <div className="store-filters" aria-label="Filter catalog">
            {categories.map((item) => (
              <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>
                {item === 'all' ? 'All services' : CATEGORY_LABELS[item] || item.replaceAll('_', ' ')}
              </button>
            ))}
          </div>

          {state.loading ? <div className="store-loading" role="status"><span className="spinner"/>Connecting to Leonard Store…</div> : (
            <div className="store-grid">
              {visible.map((product) => (
                <article className="store-card" key={product.id}>
                  <div className="store-card-media">
                    {product.image_url
                      ? <img src={product.image_url} alt="" loading="lazy"/>
                      : <div className="store-card-mark"><Building2/><span>{CATEGORY_LABELS[product.category] || 'IWW'}</span></div>}
                    <span>{CATEGORY_LABELS[product.category] || 'Specialist service'}</span>
                  </div>
                  <div className="store-card-body">
                    <h2>{product.name}</h2>
                    <p>{product.description}</p>
                    <div className="store-card-foot">
                      <span>{Number.isFinite(Number(product.price)) ? `From $${Number(product.price).toFixed(2)}` : 'Scope-based pricing'}</span>
                      <Link to="/contact">Request service <ArrowRight size={14}/></Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

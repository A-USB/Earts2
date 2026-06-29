import { useEffect, useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import './Products.css';

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products').then(setProducts).catch(console.error);
  }, []);

  const subscriptions = products.filter(p => p.type === 'subscription');
  const addons = products.filter(p => p.type === 'addon');

  return (
    <div className="products-page page-wrapper">
      <div className="products-hero">
        <div className="container">
          <span className="eyebrow">Our Products</span>
          <h1>Tools that put artists first</h1>
          <p>Everything you need to build your creative career on Earts. Start free, scale as you grow.</p>
        </div>
      </div>

      <div className="container products-body">
        {/* Plans */}
        <div className="plans-section">
          <div className="section-center" style={{textAlign:'center',marginBottom:'40px'}}>
            <h2>Choose your plan</h2>
            <p style={{color:'var(--text-mid)', marginTop:'8px'}}>Start free, upgrade when you're ready.</p>
          </div>
          <div className="plans-grid">
            {subscriptions.map(plan => (
              <div key={plan.id} className={`plan-card card ${plan.popular ? 'plan-popular' : ''}`}>
                {plan.popular && <div className="popular-badge"><Zap size={12}/> Most popular</div>}
                <div className="plan-icon" style={{background: plan.color}} />
                <h3>{plan.name}</h3>
                <p className="plan-desc">{plan.description}</p>
                <div className="plan-price">
                  <span className="price-amt">${plan.price}</span>
                  <span className="price-period">/month</span>
                </div>
                <ul className="plan-features">
                  {plan.features.map(f => (
                    <li key={f}><Check size={14} /> {f}</li>
                  ))}
                </ul>
                <Link to="/signup" className={plan.popular ? 'btn-primary' : 'btn-outline'} style={{justifyContent:'center', marginTop:'auto'}}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Add-ons */}
        <div className="addons-section">
          <h2>Power-ups & Add-ons</h2>
          <p>Enhance your Earts experience with these optional tools.</p>
          <div className="addons-grid">
            {addons.map(addon => (
              <div key={addon.id} className="addon-card card">
                <div className="addon-icon" style={{background: addon.color}} />
                <div className="addon-content">
                  <h4>{addon.name}</h4>
                  <p>{addon.description}</p>
                  <div className="addon-features">
                    {addon.features.map(f => <span key={f} className="addon-feat">{f}</span>)}
                  </div>
                </div>
                <div className="addon-price">
                  {addon.price === 0 ? <span className="free-tag">Free</span> : <span>${addon.price}/mo</span>}
                  <button className="btn-outline" style={{padding:'6px 16px',fontSize:'13px'}}>Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="faq-section">
          <h2>Frequently asked questions</h2>
          <div className="faq-grid">
            {[
              { q: 'Can I switch plans anytime?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.' },
              { q: 'How do payouts work?', a: "We process payouts monthly to your connected bank account or PayPal. You keep 85% of every sale." },
              { q: 'Is there a free tier?', a: 'Yes! You can create a profile and browse for free. The Starter Kit unlocks selling and advanced features.' },
              { q: 'Can I cancel anytime?', a: 'Absolutely. No lock-in contracts. Cancel from your account settings with one click.' },
            ].map(faq => (
              <div key={faq.q} className="faq-item card">
                <h4>{faq.q}</h4>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

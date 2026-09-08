import React, { useState, useRef } from 'react';
import {
  Receipt, Plus, Minus, Trash2, Printer,
  CreditCard, Smartphone, Banknote, CheckCircle2,
  ArrowLeft, Award
} from 'lucide-react';

const GST_RATE = 0.18;

/**
 * POSBillingView — Full POS Invoice & Payment Screen
 */
function POSBillingView({ customer, stylistId, stylists, services, bills, onCreateBill, onBack }) {
  const [cartItems, setCartItems] = useState([]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [billCreated, setBillCreated] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const printRef = useRef();

  const stylist = stylists.find(s => String(s.id) === String(stylistId)) || null;

  // ─── Cart Operations ───
  const addService = (service) => {
    setCartItems(prev => {
      const exists = prev.find(i => i.service_id === service.id);
      if (exists) return prev.map(i => i.service_id === service.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { service_id: service.id, service_name: service.name, price: parseFloat(service.price), qty: 1 }];
    });
  };

  const removeOne = (service_id) => {
    setCartItems(prev =>
      prev.map(i => i.service_id === service_id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0)
    );
  };

  const removeAll = (service_id) => {
    setCartItems(prev => prev.filter(i => i.service_id !== service_id));
  };

  // ─── Totals ───
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = parseFloat((subtotal * GST_RATE).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));
  const loyaltyEarned = Math.floor(total / 10);

  // ─── Submit Bill ───
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const billData = {
        customer_id: customer?.id || null,
        stylist_id: stylistId || null,
        branch_id: null,
        items: cartItems,
        payment_mode: paymentMode,
        notes: customer?.isWalkIn ? `Walk-in: ${customer.name} (${customer.phone})` : null,
      };
      const created = await onCreateBill(billData);
      setBillCreated({ ...created, customer, stylist, items: cartItems, subtotal, tax, total, paymentMode, loyaltyEarned });
    } catch (e) {
      console.error('Billing error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Print Invoice ───
  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>SalonPulse Invoice</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 24px; max-width: 400px; margin: auto; color: #111; }
            h1 { font-size: 1.4rem; margin-bottom: 4px; }
            .salon-name { font-size: 1.6rem; font-weight: 900; }
            .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 0.9rem; }
            .total-row { font-weight: 900; font-size: 1.1rem; }
            .footer { text-align: center; margin-top: 16px; font-size: 0.8rem; color: #555; }
            .badge { display: inline-block; background: #f59e0b; color: #fff; border-radius: 6px; padding: 2px 8px; font-size: 0.75rem; font-weight: 700; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  // ─── SUCCESS STATE: Invoice Display ───
  if (billCreated) {
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <CheckCircle2 size={54} style={{ color: '#34d399', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: '900' }}>Payment Successful! 🎉</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Invoice generated for {billCreated.customer?.name}</p>
        </div>

        {/* Printable Invoice */}
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '500px', margin: '0 auto' }}>
          <div ref={printRef}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div className="salon-name" style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '0.05em' }}>✂️ SalonPulse</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>ERP & CRM Management System</div>
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Invoice #{billCreated.id || 'NEW'} · {new Date().toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', padding: '14px 0', margin: '14px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                <strong>{billCreated.customer?.name} {billCreated.customer?.isWalkIn ? '(Walk-in)' : ''}</strong>
              </div>
              {billCreated.stylist && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Stylist:</span>
                  <strong>{billCreated.stylist.name}</strong>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: '14px' }}>
              {billCreated.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                  <div>
                    <div style={{ fontWeight: '700' }}>{item.service_name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>₹{item.price} × {item.qty}</div>
                  </div>
                  <span style={{ fontWeight: '700' }}>₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'var(--text-sub)' }}>
                <span>Subtotal</span><span>₹{billCreated.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'var(--text-sub)' }}>
                <span>GST (18%)</span><span>₹{billCreated.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1.5px solid var(--border)', fontWeight: '900', fontSize: '1.1rem' }}>
                <span>TOTAL</span><span style={{ color: 'var(--accent-gold)' }}>₹{billCreated.total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <span style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)', padding: '5px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '800' }}>
                Payment: {billCreated.paymentMode}
              </span>
            </div>

            {billCreated.loyaltyEarned > 0 && (
              <div style={{ textAlign: 'center', marginTop: '12px', padding: '10px', background: 'rgba(52,211,153,0.08)', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.2)', fontSize: '0.82rem', color: '#34d399', fontWeight: '700' }}>
                <Award size={14} style={{ display: 'inline', marginRight: '6px' }} />
                +{billCreated.loyaltyEarned} Loyalty Points earned! 🎁
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Thank you for visiting SalonPulse! 💛<br />See you again soon.
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={16} /> Print Invoice
            </button>
            <button className="glass-card" onClick={onBack} style={{ padding: '10px 18px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={15} /> New Check-in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN POS SCREEN ───
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <button
          className="glass-card"
          onClick={onBack}
          style={{ padding: '8px 14px', cursor: 'pointer', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
            POS Billing — {customer?.name}
            {customer?.isWalkIn && <span style={{ marginLeft: '8px', fontSize: '0.72rem', background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>Walk-in</span>}
          </h2>
          {stylist && <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Stylist: {stylist.name}</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px' }}>
        {/* ─── LEFT: Service Menu Selector ─── */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '16px' }}>Select Services</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {services.map(s => (
              <div
                key={s.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{s.category} · ⏱ {s.duration_minutes} min</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: '900', color: 'var(--accent-gold)' }}>₹{s.price}</span>
                  <button
                    onClick={() => addService(s)}
                    style={{ background: 'var(--accent-gold)', border: 'none', color: '#000', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: Cart + Payment ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Cart */}
          <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
            <h3 style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={17} style={{ color: 'var(--accent-gold)' }} /> Cart
              {cartItems.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cartItems.length} item(s)</span>}
            </h3>

            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Add services from the menu →
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {cartItems.map(item => (
                  <div key={item.service_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{item.service_name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>₹{item.price} × {item.qty} = ₹{(item.price * item.qty).toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => removeOne(item.service_id)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={11} />
                      </button>
                      <span style={{ fontWeight: '800', width: '18px', textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                      <button onClick={() => addService({ id: item.service_id, name: item.service_name, price: item.price })} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={11} />
                      </button>
                      <button onClick={() => removeAll(item.service_id)} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            {cartItems.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--text-sub)' }}>
                  <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--text-sub)' }}>
                  <span>GST (18%)</span><span>₹{tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border)', fontWeight: '900', fontSize: '1.1rem', marginTop: '6px' }}>
                  <span>TOTAL</span>
                  <span style={{ color: 'var(--accent-gold)' }}>₹{total.toFixed(2)}</span>
                </div>
                {loyaltyEarned > 0 && (
                  <div style={{ fontSize: '0.76rem', color: '#34d399', textAlign: 'right' }}>
                    +{loyaltyEarned} loyalty points will be added
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Mode */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '0.95rem', marginBottom: '12px' }}>Payment Mode</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[
                { mode: 'Cash', icon: <Banknote size={18} />, color: '#34d399' },
                { mode: 'Card', icon: <CreditCard size={18} />, color: '#818cf8' },
                { mode: 'UPI', icon: <Smartphone size={18} />, color: 'var(--accent-gold)' },
              ].map(({ mode, icon, color }) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '12px',
                    border: paymentMode === mode ? `2px solid ${color}` : '1px solid var(--border)',
                    background: paymentMode === mode ? `${color}18` : 'rgba(255,255,255,0.03)',
                    color: paymentMode === mode ? color : 'var(--text-sub)',
                    cursor: 'pointer',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  {icon} {mode}
                </button>
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || isSubmitting}
              style={{ width: '100%', fontSize: '1rem', padding: '14px', opacity: cartItems.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isSubmitting ? 'Processing...' : <><CheckCircle2 size={18} /> Confirm & Generate Invoice</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POSBillingView;

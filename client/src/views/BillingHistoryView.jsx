import React, { useState, useRef } from 'react';
import {
  Receipt, Search, Printer, CheckCircle2, X,
  Banknote, Smartphone, CreditCard, DollarSign,
  TrendingUp, Users, Calendar, Filter, Eye
} from 'lucide-react';

function BillingHistoryView({ bills = [], customers = [], stylists = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedBill, setSelectedBill] = useState(null);
  const printRef = useRef();

  // Metrics calculation
  const totalRevenue = bills.reduce((sum, b) => sum + parseFloat(b.total || 0), 0);
  const totalTax = bills.reduce((sum, b) => sum + parseFloat(b.tax_amount || 0), 0);
  const cashTotal = bills.filter(b => b.payment_mode === 'Cash').reduce((sum, b) => sum + parseFloat(b.total || 0), 0);
  const upiTotal = bills.filter(b => b.payment_mode === 'UPI').reduce((sum, b) => sum + parseFloat(b.total || 0), 0);
  const cardTotal = bills.filter(b => b.payment_mode === 'Card').reduce((sum, b) => sum + parseFloat(b.total || 0), 0);

  // Filtered bills
  const filteredBills = bills.filter(b => {
    const matchesPayment = paymentFilter === 'All' || b.payment_mode === paymentFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery.trim() ||
      String(b.id).includes(searchQuery) ||
      b.customer_name?.toLowerCase().includes(searchLower) ||
      b.stylist_name?.toLowerCase().includes(searchLower) ||
      b.payment_mode?.toLowerCase().includes(searchLower);
    return matchesPayment && matchesSearch;
  });

  // Print Invoice Popup
  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>SalonPulse Tax Invoice #${selectedBill?.id}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 24px; max-width: 420px; margin: auto; color: #111; line-height: 1.4; }
            h1 { font-size: 1.4rem; margin-bottom: 2px; text-align: center; }
            .salon-name { font-size: 1.6rem; font-weight: 900; text-align: center; color: #0f172a; }
            .subtitle { font-size: 0.8rem; text-align: center; color: #64748b; margin-bottom: 16px; }
            .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 0.9rem; }
            .total-row { font-weight: 900; font-size: 1.1rem; border-top: 1px solid #111; padding-top: 8px; margin-top: 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 0.8rem; color: #64748b; }
            .badge { display: inline-block; background: #059669; color: #fff; border-radius: 6px; padding: 2px 8px; font-size: 0.75rem; font-weight: 700; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div>
      {/* ─── Summary Financial Metrics Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <TrendingUp size={18} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Total Sales Revenue</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
            ₹{totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Receipt size={18} style={{ color: '#818cf8' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Total Invoices</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff' }}>
            {bills.length}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <DollarSign size={18} style={{ color: '#34d399' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>GST Collected (18%)</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#34d399' }}>
            ₹{totalTax.toFixed(2)}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Banknote size={18} style={{ color: '#f59e0b' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Payment Split</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            <div>💵 Cash: <strong style={{ color: 'var(--text-main)' }}>₹{cashTotal.toFixed(0)}</strong></div>
            <div>📱 UPI: <strong style={{ color: 'var(--text-main)' }}>₹{upiTotal.toFixed(0)}</strong></div>
            <div>💳 Card: <strong style={{ color: 'var(--text-main)' }}>₹{cardTotal.toFixed(0)}</strong></div>
          </div>
        </div>
      </div>

      {/* ─── Search & Filter Bar ─── */}
      <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search invoice #, customer name, phone, stylist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <select className="select-filter" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="All">All Payment Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI / QR Code</option>
            <option value="Card">Card Checkout</option>
          </select>
        </div>
      </div>

      {/* ─── Billing History Table ─── */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Receipt size={18} style={{ color: 'var(--accent-gold)' }} />
            POS Invoice History Logs
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {filteredBills.length} of {bills.length} invoices
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px' }}>Invoice ID</th>
                <th style={{ padding: '12px 16px' }}>Customer Name</th>
                <th style={{ padding: '12px 16px' }}>Stylist</th>
                <th style={{ padding: '12px 16px' }}>Subtotal</th>
                <th style={{ padding: '12px 16px' }}>GST (18%)</th>
                <th style={{ padding: '12px 16px' }}>Total Paid</th>
                <th style={{ padding: '12px 16px' }}>Payment Mode</th>
                <th style={{ padding: '12px 16px' }}>Date & Time</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No billing invoices generated yet.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>#INV-{b.id}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {b.customer_name || 'Walk-in Guest'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                      {b.stylist_name || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                      ₹{parseFloat(b.subtotal || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#34d399' }}>
                      ₹{parseFloat(b.tax_amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '800', color: 'var(--text-main)' }}>
                      ₹{parseFloat(b.total || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: b.payment_mode === 'Cash' ? 'rgba(52,211,153,0.15)' : b.payment_mode === 'UPI' ? 'rgba(245,158,11,0.15)' : 'rgba(129,140,248,0.15)',
                        color: b.payment_mode === 'Cash' ? '#059669' : b.payment_mode === 'UPI' ? '#d97706' : '#4f46e5',
                        padding: '3px 10px',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        fontWeight: '800'
                      }}>
                        {b.payment_mode === 'Cash' && '💵 '}
                        {b.payment_mode === 'UPI' && '📱 '}
                        {b.payment_mode === 'Card' && '💳 '}
                        {b.payment_mode}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(b.created_at || Date.now()).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedBill(b)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'rgba(99,102,241,0.12)',
                          border: '1px solid var(--primary-indigo)',
                          borderRadius: '8px',
                          color: 'var(--primary-indigo)',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={13} /> View Invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── PRINTABLE INVOICE RECEIPT MODAL ─── */}
      {selectedBill && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '440px', width: '90%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Receipt size={18} style={{ color: 'var(--accent-gold)' }} /> Invoice #{selectedBill.id}
              </h3>
              <button onClick={() => setSelectedBill(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Printable Area */}
            <div ref={printRef} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', color: 'var(--text-main)' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '0.04em', color: 'var(--text-main)' }}>
                  ✂️ SalonPulse ERP
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Multi-Branch Luxury Salon & Wellness Spa
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  GSTIN: 07AAAAA0000A1Z5 · Tax Invoice
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', padding: '10px 0', margin: '12px 0', fontSize: '0.82rem', color: 'var(--text-sub)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Invoice No:</span> <strong style={{ color: 'var(--text-main)' }}>#INV-{selectedBill.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Date:</span> <span>{new Date(selectedBill.created_at || Date.now()).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Customer:</span> <strong style={{ color: 'var(--text-main)' }}>{selectedBill.customer_name || 'Walk-in Guest'}</strong>
                </div>
                {selectedBill.stylist_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Stylist:</span> <span>{selectedBill.stylist_name}</span>
                  </div>
                )}
              </div>

              {/* Items Breakdown */}
              <div style={{ fontSize: '0.84rem', margin: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <span>Service</span>
                  <span>Amount</span>
                </div>
                {selectedBill.items && Array.isArray(selectedBill.items) ? (
                  selectedBill.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                      <span>{item.service_name || 'Salon Service'} (x{item.qty || 1})</span>
                      <span>₹{(parseFloat(item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>Salon Services Rendered</span>
                    <span>₹{parseFloat(selectedBill.subtotal || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div style={{ fontSize: '0.85rem', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Subtotal:</span> <span>₹{parseFloat(selectedBill.subtotal || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', color: '#34d399' }}>
                  <span>GST (18%):</span> <span>₹{parseFloat(selectedBill.tax_amount || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-main)', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                  <span>Total Paid:</span> <span style={{ color: 'var(--accent-gold)' }}>₹{parseFloat(selectedBill.total || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Payment Mode:</span> <strong>{selectedBill.payment_mode || 'Cash'}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Thank you for visiting SalonPulse! ✨
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setSelectedBill(null)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                Close
              </button>
              <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={15} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingHistoryView;

import React, { useState, useRef } from 'react';
import {
  Receipt, Search, Printer, CheckCircle2, X,
  Banknote, Smartphone, CreditCard, DollarSign,
  TrendingUp, Users, Calendar, Filter, Eye, Tag, Award, Sparkles
} from 'lucide-react';

function BillingHistoryView({ bills = [], customers = [], stylists = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedBill, setSelectedBill] = useState(null);
  const printRef = useRef();

  // Financial Metrics Calculation
  const totalRevenue = bills.reduce((sum, b) => sum + parseFloat(b.total || 0), 0);
  const totalTax = bills.reduce((sum, b) => sum + parseFloat(b.tax_amount || 0), 0);
  const totalDiscounts = bills.reduce((sum, b) => sum + parseFloat(b.discount_amount || 0), 0);
  const totalTips = bills.reduce((sum, b) => sum + parseFloat(b.tip_amount || 0), 0);

  const cashTotal = bills.filter(b => b.payment_mode === 'Cash').reduce((sum, b) => sum + parseFloat(b.total || 0), 0);
  const upiTotal = bills.filter(b => b.payment_mode === 'UPI').reduce((sum, b) => sum + parseFloat(b.total || 0), 0);
  const cardTotal = bills.filter(b => b.payment_mode === 'Card').reduce((sum, b) => sum + parseFloat(b.total || 0), 0);
  const splitTotal = bills.filter(b => b.payment_mode === 'Split').reduce((sum, b) => sum + parseFloat(b.total || 0), 0);

  // Filtered bills
  const filteredBills = bills.filter(b => {
    const matchesPayment = paymentFilter === 'All' || b.payment_mode === paymentFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery.trim() ||
      String(b.id).includes(searchQuery) ||
      b.customer_name?.toLowerCase().includes(searchLower) ||
      b.stylist_name?.toLowerCase().includes(searchLower) ||
      b.discount_code?.toLowerCase().includes(searchLower) ||
      b.payment_mode?.toLowerCase().includes(searchLower);
    return matchesPayment && matchesSearch;
  });

  // Print Invoice Thermal Receipt
  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>SalonPulse Tax Invoice #${selectedBill?.id}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 20px; max-width: 400px; margin: auto; color: #111; line-height: 1.4; }
            .salon-name { font-size: 1.5rem; font-weight: 900; text-align: center; }
            .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 0.85rem; }
            .total-row { font-weight: 900; font-size: 1.1rem; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; margin: 10px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 0.8rem; color: #64748b; }
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
      {/* ─── Summary Financial Metrics Cards (Module 5) ─── */}
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
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>GST Collected</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#34d399' }}>
            ₹{totalTax.toFixed(2)}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Tag size={18} style={{ color: '#ec4899' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Discount & Tips</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            <div>🏷️ Discounts: <strong style={{ color: '#ef4444' }}>₹{totalDiscounts.toFixed(0)}</strong></div>
            <div>✨ Stylist Tips: <strong style={{ color: 'var(--accent-gold)' }}>₹{totalTips.toFixed(0)}</strong></div>
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
              placeholder="Search invoice #, customer, stylist, coupon, payment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px',
                background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem'
              }}
            />
          </div>

          <select className="select-filter" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="All">All Payment Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI / QR Code</option>
            <option value="Card">Card Checkout</option>
            <option value="Split">Split Payment</option>
          </select>
        </div>
      </div>

      {/* ─── Billing History Table ─── */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Receipt size={18} style={{ color: 'var(--accent-gold)' }} />
            POS Invoice History & Audit Logs
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {filteredBills.length} of {bills.length} invoices
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 14px' }}>Invoice ID</th>
                <th style={{ padding: '12px 14px' }}>Customer Name</th>
                <th style={{ padding: '12px 14px' }}>Stylist</th>
                <th style={{ padding: '12px 14px' }}>Subtotal</th>
                <th style={{ padding: '12px 14px' }}>Discount</th>
                <th style={{ padding: '12px 14px' }}>GST</th>
                <th style={{ padding: '12px 14px' }}>Total Paid</th>
                <th style={{ padding: '12px 14px' }}>Payment Mode</th>
                <th style={{ padding: '12px 14px' }}>Date</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No billing invoices generated yet.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>#INV-{b.id}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {b.customer_name || 'Walk-in Guest'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                      {b.stylist_name || '—'}
                      {parseFloat(b.commission_amount || 0) > 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)' }}>Tag: ₹{parseFloat(b.commission_amount).toFixed(0)}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>
                      ₹{parseFloat(b.subtotal || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: parseFloat(b.discount_amount || 0) > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                      {parseFloat(b.discount_amount || 0) > 0 ? `-₹${parseFloat(b.discount_amount).toFixed(2)}` : '—'}
                      {b.discount_code && <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>{b.discount_code}</div>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#34d399' }}>
                      ₹{parseFloat(b.tax_amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '900', color: 'var(--text-main)' }}>
                      ₹{parseFloat(b.total || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        background: b.payment_mode === 'Cash' ? 'rgba(52,211,153,0.15)' : b.payment_mode === 'UPI' ? 'rgba(245,158,11,0.15)' : b.payment_mode === 'Split' ? 'rgba(236,72,153,0.15)' : 'rgba(129,140,248,0.15)',
                        color: b.payment_mode === 'Cash' ? '#059669' : b.payment_mode === 'UPI' ? '#d97706' : b.payment_mode === 'Split' ? '#ec4899' : '#4f46e5',
                        padding: '3px 10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '800'
                      }}>
                        {b.payment_mode === 'Cash' && '💵 '}
                        {b.payment_mode === 'UPI' && '📱 '}
                        {b.payment_mode === 'Card' && '💳 '}
                        {b.payment_mode === 'Split' && '🔀 '}
                        {b.payment_mode}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(b.created_at || Date.now()).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedBill(b)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                          background: 'rgba(99,102,241,0.12)', border: '1px solid var(--primary-indigo)',
                          borderRadius: '8px', color: 'var(--primary-indigo)', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer'
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
          <div className="glass-panel modal-content" style={{ maxWidth: '460px', width: '90%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Receipt size={18} style={{ color: 'var(--accent-gold)' }} /> Invoice #{selectedBill.id}
              </h3>
              <button onClick={() => setSelectedBill(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Printable Area */}
            <div ref={printRef} style={{ background: '#fff', color: '#000', borderRadius: '12px', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px', borderBottom: '2px dashed #ccc', paddingBottom: '10px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '0.04em' }}>✂️ SalonPulse ERP</div>
                <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '2px' }}>Multi-Branch Luxury Salon & Wellness Spa</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>GSTIN: 07AAAAA0000A1Z5 · Tax Invoice</div>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Invoice No:</span> <strong>#INV-{selectedBill.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Date:</span> <span>{new Date(selectedBill.created_at || Date.now()).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Customer:</span> <strong>{selectedBill.customer_name || 'Walk-in Guest'}</strong>
                </div>
                {selectedBill.stylist_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Stylist Tagged:</span> <strong>{selectedBill.stylist_name}</strong>
                  </div>
                )}
              </div>

              {/* Items Breakdown */}
              <div style={{ fontSize: '0.84rem', margin: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
                  <span>Service</span>
                  <span>Amount</span>
                </div>
                {selectedBill.items && Array.isArray(selectedBill.items) ? (
                  selectedBill.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #eee' }}>
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
              <div style={{ fontSize: '0.85rem', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #ccc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Subtotal:</span> <span>₹{parseFloat(selectedBill.subtotal || 0).toFixed(2)}</span>
                </div>

                {parseFloat(selectedBill.discount_amount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', color: '#b91c1c', fontWeight: '700' }}>
                    <span>Discount Savings {selectedBill.discount_code ? `(${selectedBill.discount_code})` : ''}:</span>
                    <span>-₹{parseFloat(selectedBill.discount_amount).toFixed(2)}</span>
                  </div>
                )}

                {parseFloat(selectedBill.tax_amount || 0) > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', color: '#444', fontSize: '0.78rem' }}>
                      <span>CGST ({(parseFloat(selectedBill.tax_rate || 18) / 2).toFixed(1)}%):</span>
                      <span>₹{(parseFloat(selectedBill.tax_amount) / 2).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', color: '#444', fontSize: '0.78rem' }}>
                      <span>SGST ({(parseFloat(selectedBill.tax_rate || 18) / 2).toFixed(1)}%):</span>
                      <span>₹{(parseFloat(selectedBill.tax_amount) / 2).toFixed(2)}</span>
                    </div>
                  </>
                )}

                {parseFloat(selectedBill.tip_amount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', color: '#047857', fontWeight: '700' }}>
                    <span>Stylist Tip:</span> <span>+₹{parseFloat(selectedBill.tip_amount).toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '1.05rem', fontWeight: '900', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0' }}>
                  <span>Total Amount Paid:</span> <span>₹{parseFloat(selectedBill.total || 0).toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '0.8rem', color: '#555' }}>
                  <span>Payment Mode:</span> <strong>{selectedBill.payment_mode || 'Cash'}</strong>
                </div>

                {selectedBill.split_details && typeof selectedBill.split_details === 'object' && Object.keys(selectedBill.split_details).length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#666', background: '#f3f4f6', padding: '6px 8px', borderRadius: '6px', marginTop: '4px' }}>
                    Split Breakdown: Cash ₹{selectedBill.split_details.cash || 0} | UPI ₹{selectedBill.split_details.upi || 0} | Card ₹{selectedBill.split_details.card || 0}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: '#666' }}>
                Thank you for visiting SalonPulse! ✨
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setSelectedBill(null)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                Close
              </button>
              <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={15} /> Print Thermal Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingHistoryView;

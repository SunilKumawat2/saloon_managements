import React, { useState, useRef, useEffect } from 'react';
import {
  Receipt, Search, Printer, CheckCircle2, X,
  Banknote, Smartphone, CreditCard, DollarSign,
  TrendingUp, Users, Calendar, Filter, Eye, Tag, Award, Sparkles, Crown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2
} from 'lucide-react';

function BillingHistoryView({ bills = [], customers = [], stylists = [], members = [], onDeleteBill, onClearAllBills, selectedBranchId = 'all' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedBill, setSelectedBill] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const printRef = useRef();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentFilter, pageSize]);

  // Helper for robust financial & meta calculations per bill
  const getBillCalculations = (b) => {
    if (!b) return { subtotal: 0, discount: 0, tax: 0, total: 0, tip: 0, taxRate: 18, custName: 'Walk-in Guest', stylistName: '—', items: [] };
    
    const itemsList = Array.isArray(b.items) ? b.items : [];
    let itemsSubtotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (parseInt(item.qty) || 1)), 0);
    let subtotal = parseFloat(b.subtotal || 0);
    if (!subtotal || subtotal === 0) {
      subtotal = itemsSubtotal > 0 ? itemsSubtotal : (parseFloat(b.total) || 0);
    }

    const isMemberMode = b.payment_mode === 'Membership Wallet Credit' || String(b.payment_mode || '').toLowerCase().includes('membership');
    const matchedCust = customers.find(c => String(c.id) === String(b.customer_id));
    const custName = b.customer_name || matchedCust?.name || (b.customer?.name) || 'Walk-in Guest';
    
    const matchedMember = (members || []).find(m => 
      (b.customer_id && m.customer_id && String(m.customer_id) === String(b.customer_id)) ||
      (b.customer_phone && m.customer_phone && String(m.customer_phone).replace(/\D/g, '').slice(-10) === String(b.customer_phone).replace(/\D/g, '').slice(-10))
    );

    const membershipName = matchedMember?.membership_name || matchedCust?.membership_name || (b.discount_code?.includes('MEMBERSHIP') || isMemberMode ? 'Active Member' : null);

    const discount = isMemberMode ? subtotal : parseFloat(b.discount_amount || 0);
    const taxable = Math.max(0, subtotal - discount);
    const taxRate = isMemberMode ? 0 : (parseFloat(b.tax_rate) || 18);
    
    let tax = isMemberMode ? 0 : parseFloat(b.tax_amount || 0);
    if (!isMemberMode && (!tax || tax === 0) && subtotal > 0) {
      tax = parseFloat(((taxable * taxRate) / 100).toFixed(2));
    }

    const tip = parseFloat(b.tip_amount || 0);

    let total = isMemberMode ? 0 : parseFloat(b.total || 0);
    if (!isMemberMode && (!total || total === 0) && subtotal > 0) {
      total = parseFloat((taxable + tax + tip).toFixed(2));
    }

    const matchedStylist = stylists.find(s => String(s.id) === String(b.stylist_id));
    const stylistName = b.stylist_name || matchedStylist?.name || (b.stylist?.name) || '—';

    return { subtotal, discount, tax, total, tip, taxRate, custName, stylistName, membershipName, isMemberMode, items: itemsList };
  };

  // Financial Metrics Calculation
  const totalRevenue = bills.reduce((sum, b) => sum + getBillCalculations(b).total, 0);
  const totalTax = bills.reduce((sum, b) => sum + getBillCalculations(b).tax, 0);
  const totalDiscounts = bills.reduce((sum, b) => sum + getBillCalculations(b).discount, 0);
  const totalTips = bills.reduce((sum, b) => sum + getBillCalculations(b).tip, 0);

  const cashTotal = bills.filter(b => b.payment_mode === 'Cash').reduce((sum, b) => sum + getBillCalculations(b).total, 0);
  const upiTotal = bills.filter(b => b.payment_mode === 'UPI').reduce((sum, b) => sum + getBillCalculations(b).total, 0);
  const cardTotal = bills.filter(b => b.payment_mode === 'Card').reduce((sum, b) => sum + getBillCalculations(b).total, 0);
  const splitTotal = bills.filter(b => b.payment_mode === 'Split').reduce((sum, b) => sum + getBillCalculations(b).total, 0);

  // Filtered bills
  const filteredBills = bills.filter(b => {
    const calc = getBillCalculations(b);
    const matchesPayment = paymentFilter === 'All' || b.payment_mode === paymentFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery.trim() ||
      String(b.id).includes(searchQuery) ||
      calc.custName.toLowerCase().includes(searchLower) ||
      calc.stylistName.toLowerCase().includes(searchLower) ||
      b.discount_code?.toLowerCase().includes(searchLower) ||
      b.payment_mode?.toLowerCase().includes(searchLower);
    return matchesPayment && matchesSearch;
  });

  // Pagination Math
  const isAll = pageSize === 'all';
  const totalItems = filteredBills.length;
  const totalPages = isAll ? 1 : Math.ceil(totalItems / (Number(pageSize) || 10)) || 1;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  const startIndex = isAll ? 0 : (safePage - 1) * Number(pageSize);
  const endIndex = isAll ? totalItems : Math.min(startIndex + Number(pageSize), totalItems);
  const paginatedBills = isAll ? filteredBills : filteredBills.slice(startIndex, endIndex);

  // Download PDF Invoice
  const handleDownloadPDF = (b) => {
    if (!b) return;
    const calc = getBillCalculations(b);
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice #INV-${b.id} - ${calc.custName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 20px; line-height: 1.5; }
    .invoice-card { max-width: 750px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0f172a; padding-bottom: 18px; margin-bottom: 24px; }
    .brand-title { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
    .brand-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
    .badge { background: #2563eb; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; display: inline-block; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 10px; font-size: 13px; border: 1px solid #e2e8f0; }
    .info-label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .info-val { font-weight: 800; color: #0f172a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th { background: #0f172a; color: #fff; text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 800; text-transform: uppercase; }
    td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; }
    .totals { width: 320px; margin-left: auto; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .grand-total { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-weight: 900; font-size: 16px; color: #2563eb; padding: 8px 0; margin-top: 8px; }
    .footer { text-align: center; margin-top: 36px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand-title">✂️ SALONPULSE ERP</div>
        <div class="brand-sub">Multi-Branch Luxury Salon & Spa Enterprise</div>
        <div class="brand-sub">GSTIN: 07AAAAA0000A1Z5 · Official Tax Invoice</div>
      </div>
      <div style="text-align: right;">
        <div class="badge">PAID IN FULL</div>
        <div style="font-size: 18px; font-weight: 900; margin-top: 6px; color: #0f172a;">#INV-${b.id}</div>
        <div style="font-size: 12px; color: #64748b;">${new Date(b.created_at || Date.now()).toLocaleDateString('en-IN')}</div>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-label">Customer Details</div>
        <div class="info-val">${calc.custName}</div>
      </div>
      <div>
        <div class="info-label">Stylist Tagged</div>
        <div class="info-val">${calc.stylistName || 'Salon Team'}</div>
      </div>
      <div>
        <div class="info-label">Payment Mode</div>
        <div class="info-val">${b.payment_mode || 'Cash'}</div>
      </div>
      <div>
        <div class="info-label">Date & Time</div>
        <div class="info-val">${new Date(b.created_at || Date.now()).toLocaleString('en-IN')}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Service / Package Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${calc.items.length > 0 ? calc.items.map(item => `
          <tr>
            <td><strong>${item.service_name || 'Salon Service'}</strong></td>
            <td style="text-align: center;">${item.qty || 1}</td>
            <td style="text-align: right;">₹${parseFloat(item.price || 0).toFixed(2)}</td>
            <td style="text-align: right;">₹${(parseFloat(item.price || 0) * (item.qty || 1)).toFixed(2)}</td>
          </tr>
        `).join('') : `
          <tr>
            <td><strong>Salon Services Rendered</strong></td>
            <td style="text-align: center;">1</td>
            <td style="text-align: right;">₹${calc.subtotal.toFixed(2)}</td>
            <td style="text-align: right;">₹${calc.subtotal.toFixed(2)}</td>
          </tr>
        `}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Subtotal:</span><span>₹${calc.subtotal.toFixed(2)}</span></div>
      ${calc.discount > 0 ? `<div class="totals-row" style="color: #dc2626;"><span>Discount (${b.discount_code || 'PROMO'}):</span><span>-₹${calc.discount.toFixed(2)}</span></div>` : ''}
      ${calc.tax > 0 ? `<div class="totals-row"><span>GST (${calc.taxRate}%):</span><span>₹${calc.tax.toFixed(2)}</span></div>` : ''}
      ${calc.tip > 0 ? `<div class="totals-row" style="color: #2563eb;"><span>Stylist Tip:</span><span>+₹${calc.tip.toFixed(2)}</span></div>` : ''}
      <div class="totals-row grand-total"><span>Total Amount Paid:</span><span>₹${calc.total.toFixed(2)}</span></div>
    </div>

    <div class="footer">
      🔒 Secured Transaction processed via SalonPulse ERP & Razorpay Engine<br>
      Thank you for visiting SalonPulse! Have a wonderful day ✨
    </div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
    }
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
            <DollarSign size={18} style={{ color: '#38bdf8' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>GST Collected</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#38bdf8' }}>
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
            <option value="Membership Wallet Credit">👑 Membership Wallet Credit</option>
            <option value="Split">Split Payment</option>
          </select>

          {onClearAllBills && bills.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('⚠️ Are you sure you want to CLEAR ALL billing history & invoices from the database? This action cannot be undone.')) {
                  onClearAllBills();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                color: '#ef4444',
                fontWeight: '800',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} /> Clear All Invoices
            </button>
          )}
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
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px' }}>Date</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {totalItems === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No billing invoices generated yet.
                  </td>
                </tr>
              ) : (
                paginatedBills.map((b) => {
                  const calc = getBillCalculations(b);
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>#INV-{b.id}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-main)' }}>
                        <div>{calc.custName}</div>
                        {calc.membershipName && (
                          <div style={{
                            fontSize: '0.68rem',
                            color: '#f59e0b',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            fontWeight: '800',
                            marginTop: '3px',
                            width: 'fit-content',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Crown size={10} /> {calc.membershipName}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                        {calc.stylistName}
                        {parseFloat(b.commission_amount || 0) > 0 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)' }}>Tag: ₹{parseFloat(b.commission_amount).toFixed(0)}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>
                        ₹{calc.subtotal.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: (calc.discount > 0 || calc.isMemberMode) ? '#ef4444' : 'var(--text-muted)' }}>
                        {(calc.discount > 0 || calc.isMemberMode) ? `-₹${calc.discount.toFixed(2)}` : '—'}
                        {(b.discount_code || calc.isMemberMode) && (
                          <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: '800', marginTop: '2px' }}>
                            {calc.isMemberMode || b.discount_code === 'MEMBERSHIP_WALLET_REDEMPTION' ? '👑 Membership Wallet Credit' : b.discount_code === 'MEMBERSHIP_TIER' ? '👑 Member OFF' : b.discount_code}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: calc.isMemberMode ? 'var(--text-muted)' : '#38bdf8' }}>
                        ₹{calc.tax.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '900', color: calc.isMemberMode ? '#10b981' : 'var(--text-main)' }}>
                        <div>₹{calc.total.toFixed(2)}</div>
                        {calc.isMemberMode && (
                          <div style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: '800', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            👑 Wallet Settled
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {(() => {
                          const isMemberMode = b.payment_mode === 'Membership Wallet Credit' || String(b.payment_mode || '').toLowerCase().includes('membership');
                          const isCash = b.payment_mode === 'Cash';
                          const isUPI = b.payment_mode === 'UPI';
                          const isCard = b.payment_mode === 'Card' || b.payment_mode === 'Razorpay Gateway';
                          const isSplit = b.payment_mode === 'Split';

                          return (
                            <span style={{
                              background: isMemberMode ? 'rgba(245, 158, 11, 0.18)' : isCash ? 'rgba(37,99,235,0.15)' : isUPI ? 'rgba(16,185,129,0.15)' : isSplit ? 'rgba(236,72,153,0.15)' : 'rgba(129,140,248,0.15)',
                              color: isMemberMode ? '#f59e0b' : isCash ? '#38bdf8' : isUPI ? '#10b981' : isSplit ? '#ec4899' : '#818cf8',
                              border: `1px solid ${isMemberMode ? '#f59e0b' : 'transparent'}`,
                              padding: '3px 10px',
                              borderRadius: '10px',
                              fontSize: '0.78rem',
                              fontWeight: '800',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {isMemberMode && <Crown size={12} />}
                              {isCash && '💵 '}
                              {isUPI && '📱 '}
                              {isCard && '💳 '}
                              {isSplit && '🔀 '}
                              {b.payment_mode}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          border: '1px solid #10b981',
                          padding: '3px 10px',
                          borderRadius: '10px',
                          fontSize: '0.76rem',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle2 size={12} /> Paid
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(b.created_at || Date.now()).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedBill(b)}
                            title="View Invoice Receipt"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
                              background: 'rgba(99,102,241,0.12)', border: '1px solid var(--primary-indigo)',
                              borderRadius: '8px', color: 'var(--primary-indigo)', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer'
                            }}
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(b)}
                            title="Download PDF Invoice"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
                              background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.4)',
                              borderRadius: '8px', color: '#38bdf8', fontSize: '0.76rem', fontWeight: '800', cursor: 'pointer'
                            }}
                          >
                            📥 PDF
                          </button>
                          {onDeleteBill && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete Invoice #INV-${b.id}?`)) {
                                  onDeleteBill(b.id);
                                }
                              }}
                              title="Delete Invoice Record"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
                                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '8px', color: '#ef4444', fontSize: '0.76rem', fontWeight: '800', cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Control Bar ─── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          fontSize: '0.85rem',
          color: 'var(--text-sub)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <span>Show invoices:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                style={{
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">All</option>
              </select>
            </label>
          </div>

          <div>
            Showing <strong style={{ color: 'var(--text-main)' }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong style={{ color: 'var(--text-main)' }}>{endIndex}</strong> of{' '}
            <strong style={{ color: 'var(--text-main)' }}>{totalItems}</strong> invoices
          </div>

          {!isAll && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage(1)}
                style={{
                  padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--input-bg)', color: 'var(--text-main)',
                  cursor: safePage === 1 ? 'not-allowed' : 'pointer', opacity: safePage === 1 ? 0.4 : 1
                }}
                title="First Page"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--input-bg)', color: 'var(--text-main)',
                  cursor: safePage === 1 ? 'not-allowed' : 'pointer', opacity: safePage === 1 ? 0.4 : 1
                }}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              <span style={{ padding: '0 8px', fontWeight: '700', color: 'var(--text-main)' }}>
                Page {safePage} of {totalPages}
              </span>

              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--input-bg)', color: 'var(--text-main)',
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages ? 0.4 : 1
                }}
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                style={{
                  padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--input-bg)', color: 'var(--text-main)',
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages ? 0.4 : 1
                }}
                title="Last Page"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── PRINTABLE INVOICE RECEIPT MODAL ─── */}
      {selectedBill && (() => {
        const calc = getBillCalculations(selectedBill);
        return (
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
                    <span>Customer:</span> <strong>{calc.custName}</strong>
                  </div>
                  {calc.stylistName && calc.stylistName !== '—' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Stylist Tagged:</span> <strong>{calc.stylistName}</strong>
                    </div>
                  )}
                </div>

                {/* Items Breakdown */}
                <div style={{ fontSize: '0.84rem', margin: '12px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
                    <span>Service</span>
                    <span>Amount</span>
                  </div>
                  {calc.items.length > 0 ? (
                    calc.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #eee' }}>
                        <span>{item.service_name || 'Salon Service'} (x{item.qty || 1})</span>
                        <span>₹{(parseFloat(item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>Salon Services Rendered</span>
                      <span>₹{calc.subtotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div style={{ fontSize: '0.85rem', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #ccc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                    <span>Subtotal:</span> <span>₹{calc.subtotal.toFixed(2)}</span>
                  </div>

                  {calc.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', color: '#b91c1c', fontWeight: '700' }}>
                      <span>Discount Savings {selectedBill.discount_code ? `(${selectedBill.discount_code})` : ''}:</span>
                      <span>-₹{calc.discount.toFixed(2)}</span>
                    </div>
                  )}

                  {calc.tax > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', color: '#444', fontSize: '0.78rem' }}>
                        <span>CGST ({(calc.taxRate / 2).toFixed(1)}%):</span>
                        <span>₹{(calc.tax / 2).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', color: '#444', fontSize: '0.78rem' }}>
                        <span>SGST ({(calc.taxRate / 2).toFixed(1)}%):</span>
                        <span>₹{(calc.tax / 2).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {calc.tip > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', color: '#047857', fontWeight: '700' }}>
                      <span>Stylist Tip:</span> <span>+₹{calc.tip.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '1.05rem', fontWeight: '900', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0' }}>
                    <span>Total Amount Paid:</span> <span>₹{calc.total.toFixed(2)}</span>
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
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button onClick={() => setSelectedBill(null)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Close
                </button>
                <button
                  onClick={() => handleDownloadPDF(selectedBill)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                    background: 'rgba(37,99,235,0.15)', border: '1px solid #2563eb', color: '#38bdf8',
                    borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem'
                  }}
                >
                  📥 Download PDF
                </button>
                <button onClick={() => handleDownloadPDF(selectedBill)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
                  <Printer size={15} /> Print Invoice / PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default BillingHistoryView;

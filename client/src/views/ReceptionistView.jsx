import React, { useState } from 'react';
import {
  UserCheck, Search, Plus, Phone, CheckCircle2,
  Clock, Users, ArrowRight, Scissors, AlertCircle
} from 'lucide-react';

/**
 * ReceptionistView — Walk-in Customer Check-in Counter
 * Receptionist searches an existing customer (or quick-adds a new one),
 * then hands off to the POS billing screen.
 */
function ReceptionistView({ customers, stylists, services, onCheckIn }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState('');
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  // Live search results
  const searchResults = searchTerm.length >= 2
    ? customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      ).slice(0, 6)
    : [];

  const handleSelectCustomer = (c) => {
    setSelectedCustomer(c);
    setSearchTerm('');
    setQuickAddMode(false);
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    // Create a temporary customer object for walk-in (no DB save yet)
    const walkInCustomer = {
      id: null,
      name: quickName,
      phone: quickPhone,
      email: '',
      loyalty_points: 0,
      isWalkIn: true,
    };
    setSelectedCustomer(walkInCustomer);
    setQuickAddMode(false);
    setQuickName('');
    setQuickPhone('');
  };

  const handleProceedToBilling = () => {
    if (!selectedCustomer) return;
    onCheckIn(selectedCustomer, selectedStylist || null);
  };

  return (
    <div>
      {/* ─── Header Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Users size={18} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Total Customers</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900' }}>{customers.length}</div>
        </div>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Scissors size={18} style={{ color: '#818cf8' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Available Stylists</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900' }}>{stylists.filter(s => s.is_available).length}</div>
        </div>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <CheckCircle2 size={18} style={{ color: '#34d399' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Services Available</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900' }}>{services.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* ─── LEFT: Customer Search & Selection ─── */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={20} style={{ color: 'var(--accent-gold)' }} />
            Walk-in Customer Check-in
          </h3>

          {/* Search Box */}
          {!selectedCustomer && (
            <>
              <div className="form-group">
                <label>Search Customer (Name or Phone)</label>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    style={{ paddingLeft: '36px' }}
                    placeholder="Type customer name or mobile number..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div style={{ marginTop: '-8px', marginBottom: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {searchResults.map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <Phone size={10} style={{ display: 'inline', marginRight: '4px' }} />{c.phone}
                          {' · '} 🏆 {c.loyalty_points || 0} pts
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                    </div>
                  ))}
                </div>
              )}

              {searchTerm.length >= 2 && searchResults.length === 0 && (
                <div style={{ padding: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  No existing customer found. Add as walk-in below.
                </div>
              )}

              {/* Quick Walk-in Add */}
              {!quickAddMode ? (
                <button
                  className="glass-card"
                  onClick={() => setQuickAddMode(true)}
                  style={{ width: '100%', padding: '12px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
                >
                  <Plus size={15} /> Quick Walk-in (New Customer)
                </button>
              ) : (
                <form onSubmit={handleQuickAdd} style={{ marginTop: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>Customer Name</label>
                      <input type="text" required placeholder="Full Name" value={quickName} onChange={e => setQuickName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="text" required placeholder="9876543210" value={quickPhone} onChange={e => setQuickPhone(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Check In Walk-in</button>
                    <button type="button" onClick={() => setQuickAddMode(false)} className="glass-card" style={{ padding: '8px 14px', cursor: 'pointer', color: 'var(--text-sub)' }}>✕</button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ─── Selected Customer Card ─── */}
          {selectedCustomer && (
            <div>
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1.5px solid rgba(52,211,153,0.3)', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                  <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #34d399, #059669)', width: '48px', height: '48px', fontSize: '1.2rem' }}>
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{selectedCustomer.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedCustomer.phone}</div>
                    {selectedCustomer.isWalkIn && (
                      <span style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                        Walk-in Guest
                      </span>
                    )}
                  </div>
                  <CheckCircle2 size={22} style={{ marginLeft: 'auto', color: '#34d399' }} />
                </div>
                {!selectedCustomer.isWalkIn && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    🏆 Loyalty Points: <strong style={{ color: 'var(--accent-gold)' }}>{selectedCustomer.loyalty_points || 0}</strong>
                    {' · '} After this visit you'll earn more points!
                  </div>
                )}
              </div>

              {/* Stylist Selection */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Assign Stylist / Staff</label>
                <select value={selectedStylist} onChange={e => setSelectedStylist(e.target.value)}>
                  <option value="">— Any Available Stylist —</option>
                  {stylists.map(s => (
                    <option key={s.id} value={s.id} disabled={!s.is_available}>
                      {s.name} — {s.specialization} {!s.is_available ? '(Busy)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn-primary"
                  onClick={handleProceedToBilling}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  Proceed to POS Billing <ArrowRight size={16} />
                </button>
                <button
                  className="glass-card"
                  onClick={() => setSelectedCustomer(null)}
                  style={{ padding: '10px 14px', cursor: 'pointer', color: 'var(--text-sub)' }}
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Today's Appointments (Quick Reference) ─── */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} style={{ color: '#818cf8' }} />
            Today's Service Menu
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {services.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No services loaded.</div>
            ) : services.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {s.category} · ⏱ {s.duration_minutes} min
                  </div>
                </div>
                <span style={{ fontWeight: '900', color: 'var(--accent-gold)', fontSize: '1rem' }}>₹{s.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceptionistView;

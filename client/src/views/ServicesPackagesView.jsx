import React, { useState } from 'react';
import { 
  Scissors, 
  Sparkles, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Clock, 
  DollarSign, 
  Percent, 
  CheckCircle2, 
  Tag, 
  Layers, 
  Gift, 
  X, 
  LayoutGrid, 
  List, 
  Check, 
  Calendar,
  Zap,
  Info
} from 'lucide-react';

function ServicesPackagesView({ 
  services = [], 
  packages = [], 
  onAddService, 
  onUpdateService, 
  onDeleteService,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null); // { type: 'service'|'package', item }

  // Service Form State
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'Hair',
    price: '',
    duration_minutes: 30,
    buffer_time_minutes: 15,
    commission_rate: 10.0,
    description: '',
    is_active: true
  });

  // Package Form State
  const [packageForm, setPackageForm] = useState({
    name: '',
    category: 'Combo Package',
    package_price: '',
    validity_days: 30,
    description: '',
    is_active: true,
    service_ids: []
  });

  // ─── Handlers for Service Modal ───
  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      category: 'Hair',
      price: '',
      duration_minutes: 30,
      buffer_time_minutes: 15,
      commission_rate: 10.0,
      description: '',
      is_active: true
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name || '',
      category: service.category || 'Hair',
      price: service.price || '',
      duration_minutes: service.duration_minutes || 30,
      buffer_time_minutes: service.buffer_time_minutes || 15,
      commission_rate: service.commission_rate || 10.0,
      description: service.description || '',
      is_active: service.is_active !== undefined ? service.is_active : true
    });
    setIsServiceModalOpen(true);
  };

  const handleServiceSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...serviceForm,
      price: parseFloat(serviceForm.price),
      duration_minutes: parseInt(serviceForm.duration_minutes),
      buffer_time_minutes: parseInt(serviceForm.buffer_time_minutes),
      commission_rate: parseFloat(serviceForm.commission_rate)
    };

    if (editingService && onUpdateService) {
      onUpdateService(editingService.id, payload);
    } else if (onAddService) {
      onAddService(payload);
    }
    setIsServiceModalOpen(false);
  };

  // ─── Handlers for Package Modal ───
  const handleOpenAddPackage = () => {
    setEditingPackage(null);
    setPackageForm({
      name: '',
      category: 'Combo Package',
      package_price: '',
      validity_days: 30,
      description: '',
      is_active: true,
      service_ids: []
    });
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name || '',
      category: pkg.category || 'Combo Package',
      package_price: pkg.package_price || '',
      validity_days: pkg.validity_days || 30,
      description: pkg.description || '',
      is_active: pkg.is_active !== undefined ? pkg.is_active : true,
      service_ids: pkg.service_ids || []
    });
    setIsPackageModalOpen(true);
  };

  const togglePackageServiceId = (serviceId) => {
    setPackageForm(prev => {
      const exists = prev.service_ids.includes(serviceId);
      const updated = exists 
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId];
      return { ...prev, service_ids: updated };
    });
  };

  // Calculate Standalone total price for selected services in Package Form
  const selectedStandaloneTotal = packageForm.service_ids.reduce((sum, id) => {
    const s = services.find(srv => String(srv.id) === String(id));
    return sum + (s ? parseFloat(s.price || 0) : 0);
  }, 0);

  const calculatedDiscountPct = selectedStandaloneTotal > 0 && packageForm.package_price
    ? Math.max(0, (((selectedStandaloneTotal - parseFloat(packageForm.package_price)) / selectedStandaloneTotal) * 100)).toFixed(1)
    : 0;

  const handlePackageSubmit = (e) => {
    e.preventDefault();
    const pkgPrice = parseFloat(packageForm.package_price);
    const payload = {
      ...packageForm,
      package_price: pkgPrice,
      standalone_price: selectedStandaloneTotal > 0 ? selectedStandaloneTotal : pkgPrice,
      discount_percentage: parseFloat(calculatedDiscountPct),
      validity_days: parseInt(packageForm.validity_days || 30)
    };

    if (editingPackage && onUpdatePackage) {
      onUpdatePackage(editingPackage.id, payload);
    } else if (onAddPackage) {
      onAddPackage(payload);
    }
    setIsPackageModalOpen(false);
  };

  // ─── Delete Confirmation Handler ───
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    if (deletingItem.type === 'service' && onDeleteService) {
      onDeleteService(deletingItem.item.id);
    } else if (deletingItem.type === 'package' && onDeletePackage) {
      onDeletePackage(deletingItem.item.id);
    }
    setDeletingItem(null);
  };

  // Categories list
  const CATEGORIES = ['All', 'Hair', 'Beard', 'Facial', 'Hair Spa', 'Color', 'Packages & Combos'];

  // Filtered Services & Packages
  const filteredServices = services.filter(s => {
    const matchesCat = activeCategory === 'All' || activeCategory === 'Packages & Combos' ? (activeCategory !== 'Packages & Combos') : s.category === activeCategory;
    const matchesSearch = !searchQuery.trim() || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const filteredPackages = packages.filter(p => {
    const matchesCat = activeCategory === 'All' || activeCategory === 'Packages & Combos';
    const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Calculate Header Stats
  const activeServicesCount = services.filter(s => s.is_active !== false).length;
  const activePackagesCount = packages.filter(p => p.is_active !== false).length;
  const avgDuration = services.length > 0
    ? Math.round(services.reduce((acc, s) => acc + parseInt(s.duration_minutes || 30), 0) / services.length)
    : 30;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ─── HEADER STATS CARDS ─── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        
        <div className="glass-card stat-box">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)' }}>
            <Scissors size={24} />
          </div>
          <div className="stat-info">
            <h3>{activeServicesCount}</h3>
            <p>Active Service Catalog</p>
          </div>
        </div>

        <div className="glass-card stat-box">
          <div className="stat-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#10b981' }}>
            <Gift size={24} />
          </div>
          <div className="stat-info">
            <h3>{activePackagesCount}</h3>
            <p>Bundled Combo Packages</p>
          </div>
        </div>

        <div className="glass-card stat-box">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-indigo)' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>{avgDuration} mins</h3>
            <p>Avg Service Duration</p>
          </div>
        </div>

        <div className="glass-card stat-box">
          <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
            <Zap size={24} />
          </div>
          <div className="stat-info">
            <h3>Top Categories</h3>
            <p>Hair, Facial & Hair Spa</p>
          </div>
        </div>

      </div>

      {/* ─── CONTROL TOOLBAR: CATEGORY TABS & ACTION BUTTONS ─── */}
      <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--input-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeCategory === cat ? 'var(--primary-indigo)' : 'transparent',
                color: activeCategory === cat ? '#fff' : 'var(--text-sub)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {cat === 'Packages & Combos' && <Gift size={13} style={{ display: 'inline', marginRight: '6px' }} />}
              {cat}
            </button>
          ))}
        </div>

        {/* Right Controls: Search, Layout Switcher & Create Buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search service or package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '36px',
                paddingRight: '14px',
                paddingTop: '8px',
                paddingBottom: '8px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                minWidth: '220px'
              }}
            />
          </div>

          {/* Grid / Table View Switcher */}
          <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '10px', border: '1px solid var(--border)', padding: '2px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--primary-indigo)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Grid Cards View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'table' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: viewMode === 'table' ? 'var(--primary-indigo)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Table List View"
            >
              <List size={16} />
            </button>
          </div>

          {/* Action Buttons */}
          <button onClick={handleOpenAddService} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
            <Plus size={16} /> Add Standalone Service
          </button>
          
          <button 
            onClick={handleOpenAddPackage} 
            className="glass-card" 
            style={{ padding: '8px 16px', fontSize: '0.84rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))', border: '1px solid #10b981', color: '#10b981', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Gift size={16} /> Create Combo Package
          </button>

        </div>

      </div>

      {/* ─── CATALOG DISPLAY (GRID VIEW MODE) ─── */}
      {viewMode === 'grid' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Standalone Services Grid */}
          {activeCategory !== 'Packages & Combos' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scissors size={18} style={{ color: 'var(--accent-gold)' }} />
                  Standalone Services ({filteredServices.length})
                </h3>
              </div>

              {filteredServices.length === 0 ? (
                <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No services found in this category. Click "Add Standalone Service" to create one.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '18px' }}>
                  {filteredServices.map(srv => (
                    <div 
                      key={srv.id} 
                      className="glass-card"
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid var(--border)',
                        position: 'relative',
                        transition: 'transform 0.2s ease, border-color 0.2s ease'
                      }}
                    >
                      <div>
                        {/* Top Meta Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '0.74rem', background: 'rgba(99,102,241,0.12)', color: 'var(--primary-indigo)', border: '1px solid rgba(99,102,241,0.3)', padding: '3px 10px', borderRadius: '20px', fontWeight: '800' }}>
                            {srv.category}
                          </span>
                          <span style={{ fontSize: '0.74rem', background: srv.is_active !== false ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: srv.is_active !== false ? '#10b981' : '#ef4444', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                            {srv.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
                          {srv.name}
                        </h4>

                        <p style={{ fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: '1.5', marginBottom: '16px', minHeight: '36px' }}>
                          {srv.description || 'Standard salon service with dedicated stylist care.'}
                        </p>

                        {/* Duration & Commission Info */}
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} style={{ color: 'var(--accent-gold)' }} /> {srv.duration_minutes || 30} mins (+{srv.buffer_time_minutes || 15}m buffer)
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Percent size={13} style={{ color: '#10b981' }} /> {srv.commission_rate || 10}% Commission
                          </span>
                        </div>
                      </div>

                      {/* Footer: Price & Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
                          ₹{parseFloat(srv.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEditService(srv)}
                            title="Edit Service"
                            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid var(--primary-indigo)', color: 'var(--primary-indigo)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: 'service', item: srv })}
                            title="Delete Service"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Bundled Combo Packages Grid */}
          {(activeCategory === 'All' || activeCategory === 'Packages & Combos') && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gift size={18} style={{ color: '#10b981' }} />
                  Bundled Combo Packages ({filteredPackages.length})
                </h3>
              </div>

              {filteredPackages.length === 0 ? (
                <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No combo packages created yet. Click "Create Combo Package" to bundle multiple services with discounts.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {filteredPackages.map(pkg => {
                    // Find names of included services
                    const includedServiceNames = (pkg.service_ids || []).map(id => {
                      const s = services.find(srv => String(srv.id) === String(id));
                      return s ? s.name : `Service #${id}`;
                    });

                    return (
                      <div 
                        key={pkg.id} 
                        className="glass-card"
                        style={{
                          padding: '22px',
                          borderRadius: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justify: 'space-between',
                          border: '1.5px solid rgba(16, 185, 129, 0.3)',
                          background: 'linear-gradient(145deg, var(--bg-card), rgba(16, 185, 129, 0.04))',
                          position: 'relative'
                        }}
                      >
                        <div>
                          {/* Top Meta Badges */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.74rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 10px', borderRadius: '20px', fontWeight: '800' }}>
                              {pkg.category || 'Combo Package'}
                            </span>

                            {pkg.discount_percentage > 0 && (
                              <span style={{ fontSize: '0.74rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', padding: '3px 10px', borderRadius: '20px', fontWeight: '900' }}>
                                {pkg.discount_percentage}% OFF
                              </span>
                            )}
                          </div>

                          <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
                            {pkg.name}
                          </h4>

                          <p style={{ fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: '1.5', marginBottom: '14px' }}>
                            {pkg.description || 'Special combo deal bundling multiple salon services.'}
                          </p>

                          {/* Included Services Checklist Box */}
                          <div style={{ background: 'var(--input-bg)', borderRadius: '10px', padding: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              🎁 Included Combo Services ({includedServiceNames.length}):
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {includedServiceNames.map((srvName, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-main)' }}>
                                  <CheckCircle2 size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                                  <span>{srvName}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> Package Validity: <strong>{pkg.validity_days || 30} Days</strong>
                          </div>
                        </div>

                        {/* Footer: Price Comparison & Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#10b981' }}>
                              ₹{parseFloat(pkg.package_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            {pkg.standalone_price > pkg.package_price && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                Standalone: ₹{parseFloat(pkg.standalone_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEditPackage(pkg)}
                              title="Edit Combo Package"
                              style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingItem({ type: 'package', item: pkg })}
                              title="Delete Package"
                              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ─── CATALOG DISPLAY (TABLE VIEW MODE) ─── */}
      {viewMode === 'table' && (
        <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
          
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)' }}>
            Service & Package Master Catalog List
          </h3>

          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px' }}>Item Name & Type</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Duration / Validity</th>
                <th style={{ padding: '12px 16px' }}>Commission / Savings</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Price (₹)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Render Standalone Services */}
              {activeCategory !== 'Packages & Combos' && filteredServices.map(srv => (
                <tr key={`srv-${srv.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Scissors size={15} style={{ color: 'var(--accent-gold)' }} />
                      {srv.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>{srv.description || 'Standalone service'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.74rem', background: 'rgba(99,102,241,0.12)', color: 'var(--primary-indigo)', border: '1px solid rgba(99,102,241,0.3)', padding: '3px 8px', borderRadius: '12px', fontWeight: '800' }}>
                      {srv.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    {srv.duration_minutes || 30} mins (+{srv.buffer_time_minutes || 15}m buffer)
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.84rem', color: '#10b981', fontWeight: '700' }}>
                    {srv.commission_rate || 10}% Stylist Comm.
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.74rem', background: srv.is_active !== false ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: srv.is_active !== false ? '#10b981' : '#ef4444', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                      {srv.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '900', color: 'var(--accent-gold)', fontSize: '0.95rem' }}>
                    ₹{parseFloat(srv.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenEditService(srv)} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', color: 'var(--primary-indigo)', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => setDeletingItem({ type: 'service', item: srv })} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Render Packages */}
              {(activeCategory === 'All' || activeCategory === 'Packages & Combos') && filteredPackages.map(pkg => (
                <tr key={`pkg-${pkg.id}`} style={{ borderBottom: '1px solid var(--border)', background: 'rgba(16, 185, 129, 0.02)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Gift size={15} style={{ color: '#10b981' }} />
                      {pkg.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>{pkg.description || 'Combo package bundle'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.74rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 8px', borderRadius: '12px', fontWeight: '800' }}>
                      {pkg.category || 'Combo Package'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    {pkg.validity_days || 30} Days Validity
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.84rem', color: 'var(--accent-gold)', fontWeight: '800' }}>
                    {pkg.discount_percentage > 0 ? `${pkg.discount_percentage}% OFF` : 'Standard Bundle'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.74rem', background: pkg.is_active !== false ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: pkg.is_active !== false ? '#10b981' : '#ef4444', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                      {pkg.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '900', color: '#10b981', fontSize: '0.95rem' }}>
                    ₹{parseFloat(pkg.package_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenEditPackage(pkg)} style={{ background: 'rgba(16,185,129,0.15)', border: 'none', color: '#10b981', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => setDeletingItem({ type: 'package', item: pkg })} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      )}

      {/* ─── MODAL 1: ADD / EDIT STANDALONE SERVICE MODAL ─── */}
      {isServiceModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '520px', width: '92%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scissors size={20} style={{ color: 'var(--accent-gold)' }} />
                {editingService ? 'Edit Standalone Service' : 'Add New Standalone Service'}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleServiceSubmit}>
              <div className="form-group">
                <label>Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Keratin Hair Spa & Treatment"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  >
                    <option value="Hair">Hair</option>
                    <option value="Beard">Beard</option>
                    <option value="Facial">Facial</option>
                    <option value="Hair Spa">Hair Spa</option>
                    <option value="Color">Color</option>
                    <option value="Nails">Nails</option>
                    <option value="Makeup">Makeup</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Service Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="350.00"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Duration (mins)</label>
                  <input
                    type="number"
                    value={serviceForm.duration_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Buffer Time (mins)</label>
                  <input
                    type="number"
                    value={serviceForm.buffer_time_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, buffer_time_minutes: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Commission (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={serviceForm.commission_rate}
                    onChange={(e) => setServiceForm({ ...serviceForm, commission_rate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description / Notes</label>
                <textarea
                  rows="3"
                  placeholder="Describe what the service includes..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="glass-card" style={{ padding: '10px 18px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 22px' }}>
                  {editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD / EDIT BUNDLED COMBO PACKAGE MODAL ─── */}
      {isPackageModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '580px', width: '92%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gift size={20} style={{ color: '#10b981' }} />
                {editingPackage ? 'Edit Combo Package' : 'Create Bundled Combo Package'}
              </h3>
              <button onClick={() => setIsPackageModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePackageSubmit}>
              <div className="form-group">
                <label>Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Groom Gentleman Combo Special"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                />
              </div>

              {/* Included Multi-Service Checklist */}
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Select Included Services *</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>
                    Standalone Total: ₹{selectedStandaloneTotal.toFixed(2)}
                  </span>
                </label>

                <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {services.map(srv => {
                    const isChecked = packageForm.service_ids.includes(srv.id);
                    return (
                      <label 
                        key={srv.id} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePackageServiceId(srv.id)}
                          />
                          <span>{srv.name} <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>({srv.category})</span></span>
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-gold)' }}>₹{srv.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Package Discounted Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1450.00"
                    value={packageForm.package_price}
                    onChange={(e) => setPackageForm({ ...packageForm, package_price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Validity (Days)</label>
                  <input
                    type="number"
                    value={packageForm.validity_days}
                    onChange={(e) => setPackageForm({ ...packageForm, validity_days: e.target.value })}
                  />
                </div>
              </div>

              {/* Real-time Discount & Savings Badge */}
              {selectedStandaloneTotal > 0 && packageForm.package_price && (
                <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '16px', fontSize: '0.83rem', color: '#10b981', fontWeight: '800', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Calculated Savings for Client:</span>
                  <span>₹{(selectedStandaloneTotal - parseFloat(packageForm.package_price)).toFixed(2)} ({calculatedDiscountPct}% Discount)</span>
                </div>
              )}

              <div className="form-group">
                <label>Package Description</label>
                <textarea
                  rows="3"
                  placeholder="Details about combo offers and guidelines..."
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsPackageModalOpen(false)} className="glass-card" style={{ padding: '10px 18px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 22px', background: '#10b981' }}>
                  {editingPackage ? 'Save Package' : 'Create Package'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ─── MODAL 3: DELETE CONFIRMATION ─── */}
      {deletingItem && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '420px', width: '90%', padding: '28px', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: '#ef4444'
            }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)' }}>
              Delete {deletingItem.type === 'service' ? 'Service' : 'Combo Package'}?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>{deletingItem.item.name}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeletingItem(null)}
                className="glass-card"
                style={{ padding: '10px 20px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '700' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '10px 24px', background: '#ef4444', color: '#fff',
                  border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer'
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ServicesPackagesView;

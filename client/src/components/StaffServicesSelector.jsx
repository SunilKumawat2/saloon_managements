import React, { useState, useMemo } from 'react';
import { Scissors, Check, Search, Sparkles, X, CheckSquare, Square } from 'lucide-react';

/**
 * Reusable Staff Services Multi-Selector Component
 * Allows assigning multiple services from the active catalog to a staff/stylist.
 */
const StaffServicesSelector = ({
  services = [],
  selectedServiceIds = [],
  specialization = '',
  onChange
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize selected IDs as strings for reliable comparisons
  const safeSelectedIds = useMemo(() => {
    if (Array.isArray(selectedServiceIds)) {
      return selectedServiceIds.map(String);
    }
    if (typeof selectedServiceIds === 'string') {
      try {
        const parsed = JSON.parse(selectedServiceIds);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch (e) {}
    }
    return [];
  }, [selectedServiceIds]);

  // Extract distinct categories from services
  const categories = useMemo(() => {
    const set = new Set();
    (services || []).forEach(s => {
      if (s?.category && typeof s.category === 'string') {
        set.add(s.category.trim());
      }
    });
    return ['All', ...Array.from(set)];
  }, [services]);

  // Filter services by category and search query
  const filteredServices = useMemo(() => {
    return (services || []).filter(s => {
      if (!s || s.is_active === false) return false;
      const matchCat = selectedCategory === 'All' || String(s.category).toLowerCase() === selectedCategory.toLowerCase();
      const term = searchQuery.toLowerCase().trim();
      const matchSearch = !term ||
        String(s.name || '').toLowerCase().includes(term) ||
        String(s.category || '').toLowerCase().includes(term);
      return matchCat && matchSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  // Toggle a single service
  const handleToggleService = (serviceId) => {
    const strId = String(serviceId);
    let newIds;
    if (safeSelectedIds.includes(strId)) {
      newIds = safeSelectedIds.filter(id => id !== strId);
    } else {
      newIds = [...safeSelectedIds, strId];
    }

    const numIds = newIds.map(Number);
    // Build auto specialization text from selected service names
    const selectedNames = (services || [])
      .filter(s => newIds.includes(String(s.id)))
      .map(s => s.name);
    const autoSpecialization = selectedNames.length > 0
      ? selectedNames.join(', ')
      : '';

    onChange?.({
      service_ids: numIds,
      specialization: autoSpecialization
    });
  };

  // Select all filtered services
  const handleSelectAll = () => {
    const currentFilteredIds = filteredServices.map(s => String(s.id));
    const merged = Array.from(new Set([...safeSelectedIds, ...currentFilteredIds]));
    const numIds = merged.map(Number);
    const selectedNames = (services || [])
      .filter(s => merged.includes(String(s.id)))
      .map(s => s.name);

    onChange?.({
      service_ids: numIds,
      specialization: selectedNames.join(', ')
    });
  };

  // Clear all selections
  const handleClearAll = () => {
    onChange?.({
      service_ids: [],
      specialization: ''
    });
  };

  return (
    <div style={{
      marginTop: '12px',
      marginBottom: '16px',
      padding: '14px',
      background: 'rgba(15, 23, 42, 0.7)',
      border: '1.5px solid rgba(99, 102, 241, 0.35)',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
    }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8'
          }}>
            <Scissors size={14} />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Specialized Services (Services Offered)
              <span style={{ fontSize: '0.66rem', color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                Multi-Select
              </span>
            </label>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>
              Select which services this staff member provides in the salon
            </div>
          </div>
        </div>

        {/* Counter & Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.70rem',
            fontWeight: '700',
            color: safeSelectedIds.length > 0 ? '#34d399' : '#94a3b8',
            background: safeSelectedIds.length > 0 ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${safeSelectedIds.length > 0 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            padding: '2px 8px',
            borderRadius: '6px'
          }}>
            {safeSelectedIds.length} Selected
          </span>
          {safeSelectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                fontSize: '0.66rem',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '5px',
                padding: '2px 7px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              fontSize: '0.66rem',
              color: '#818cf8',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '5px',
              padding: '2px 7px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Select All
          </button>
        </div>
      </div>

      {/* Category Pills & Quick Search Filter */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: '0.68rem',
                fontWeight: selectedCategory === cat ? '700' : '500',
                padding: '2px 8px',
                borderRadius: '5px',
                border: selectedCategory === cat ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                background: selectedCategory === cat ? '#6366f1' : 'rgba(255, 255, 255, 0.04)',
                color: selectedCategory === cat ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div style={{ position: 'relative', width: '130px' }}>
          <Search size={11} style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '24px',
              padding: '2px 6px 2px 22px',
              fontSize: '0.68rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '5px',
              color: '#ffffff',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Services List / Cards Grid */}
      <div style={{
        maxHeight: '160px',
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '6px',
        padding: '2px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px'
      }}>
        {filteredServices.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.72rem' }}>
            No active services found in catalog. Create services in Services & Packages module first.
          </div>
        ) : (
          filteredServices.map(service => {
            const isSelected = safeSelectedIds.includes(String(service.id));
            return (
              <div
                key={service.id}
                onClick={() => handleToggleService(service.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '7px',
                  background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1.5px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  border: isSelected ? '1.5px solid #6366f1' : '1.5px solid rgba(255, 255, 255, 0.25)',
                  background: isSelected ? '#6366f1' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  {isSelected && <Check size={11} strokeWidth={3} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? '700' : '600',
                    color: isSelected ? '#ffffff' : '#e2e8f0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {service.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.64rem', color: '#94a3b8', marginTop: '1px' }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>₹{service.price}</span>
                    <span>•</span>
                    <span>{service.duration_minutes || 30}m</span>
                    <span style={{
                      padding: '0 4px',
                      borderRadius: '3px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      fontSize: '0.58rem'
                    }}>
                      {service.category || 'General'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Services Tags Preview & Specialization Note */}
      <div style={{ marginTop: '10px' }}>
        <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
          Specialization Summary Title (Displayed to Clients)
        </label>
        <input
          type="text"
          placeholder="e.g. Hair Artist, Beard Styling & Facial Specialist"
          value={specialization}
          onChange={(e) => {
            onChange?.({
              service_ids: safeSelectedIds.map(Number),
              specialization: e.target.value
            });
          }}
          style={{
            width: '100%',
            height: '30px',
            padding: '4px 10px',
            fontSize: '0.72rem',
            fontWeight: '500',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            color: '#f8fafc',
            outline: 'none'
          }}
        />
      </div>
    </div>
  );
};

export default StaffServicesSelector;

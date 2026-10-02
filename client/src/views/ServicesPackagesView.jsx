import React, { useState, useEffect } from 'react';
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
  Info,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building2
} from 'lucide-react';
import { Admin_Get_Services, Admin_Get_Packages } from '../services/apiService';
import { getPackageExpirationStatus } from '../utils/packageUtils';

function ServicesPackagesView({ 
  services = [], 
  packages = [], 
  categories = [],
  branches = [],
  onAddService, 
  onUpdateService, 
  onDeleteService,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
  onAddCategory,
  onUpdateCategory,
  selectedBranchId = 'all',
  currentUser
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [searchQuery, setSearchQuery] = useState('');

  // Standalone Services Server-side Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [serverServices, setServerServices] = useState(null);
  const [totalServicesCount, setTotalServicesCount] = useState(0);
  const [totalServicesPages, setTotalServicesPages] = useState(1);
  const [loadingBackend, setLoadingBackend] = useState(false);

  // Combo Packages Server-side Pagination State
  const [packagePageSize, setPackagePageSize] = useState(10);
  const [packageCurrentPage, setPackageCurrentPage] = useState(1);
  const [serverPackages, setServerPackages] = useState(null);
  const [totalPackagesCount, setTotalPackagesCount] = useState(0);
  const [totalPackagesPages, setTotalPackagesPages] = useState(1);
  const [loadingBackendPackages, setLoadingBackendPackages] = useState(false);

  const fetchServicesData = async () => {
    setLoadingBackend(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize === 'all' ? 'all' : pageSize,
        search: searchQuery,
        category: activeCategory
      };
      if (selectedBranchId && selectedBranchId !== 'all') {
        params.branch_id = selectedBranchId;
      }
      const res = await Admin_Get_Services(params);
      if (res?.data?.status === 'success') {
        if (res.data.pagination) {
          setServerServices(res.data.data || []);
          setTotalServicesCount(res.data.pagination.total || 0);
          setTotalServicesPages(res.data.pagination.totalPages || 1);
        } else if (Array.isArray(res.data.data)) {
          setServerServices(res.data.data);
          setTotalServicesCount(res.data.data.length);
          setTotalServicesPages(1);
        }
      }
    } catch (err) {
      console.error('Error fetching services via pagination:', err);
    } finally {
      setLoadingBackend(false);
    }
  };

  const fetchPackagesData = async () => {
    setLoadingBackendPackages(true);
    try {
      const params = {
        page: packageCurrentPage,
        limit: packagePageSize === 'all' ? 'all' : packagePageSize,
        search: searchQuery
      };
      if (selectedBranchId && selectedBranchId !== 'all') {
        params.branch_id = selectedBranchId;
      }
      const res = await Admin_Get_Packages(params);
      if (res?.data?.status === 'success') {
        if (res.data.pagination) {
          setServerPackages(res.data.data || []);
          setTotalPackagesCount(res.data.pagination.total || 0);
          setTotalPackagesPages(res.data.pagination.totalPages || 1);
        } else if (Array.isArray(res.data.data)) {
          setServerPackages(res.data.data);
          setTotalPackagesCount(res.data.data.length);
          setTotalPackagesPages(1);
        }
      }
    } catch (err) {
      console.error('Error fetching packages via pagination:', err);
    } finally {
      setLoadingBackendPackages(false);
    }
  };

  useEffect(() => {
    fetchServicesData();
  }, [currentPage, pageSize, searchQuery, activeCategory, selectedBranchId]);

  useEffect(() => {
    fetchPackagesData();
  }, [packageCurrentPage, packagePageSize, searchQuery, selectedBranchId]);

  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null); // { type: 'service'|'package'|'category', item }

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  // Quick Service Form State (inside Package Modal)
  const [showQuickAddService, setShowQuickAddService] = useState(false);
  const [quickServiceForm, setQuickServiceForm] = useState({
    name: '',
    category: 'Hair',
    price: '',
    duration_minutes: 30
  });

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
    valid_until: '',
    description: '',
    is_active: true,
    service_ids: []
  });

  const [isSavingService, setIsSavingService] = useState(false);
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // ─── Handlers for Service Modal ───
  const handleOpenAddService = () => {
    const defaultBranch = selectedBranchId !== 'all' ? String(selectedBranchId) : String(branches[0]?.id || '1');
    setEditingService(null);
    setServiceForm({
      name: '',
      category: 'Hair',
      price: '',
      duration_minutes: 30,
      buffer_time_minutes: 15,
      commission_rate: 10.0,
      description: '',
      is_active: true,
      branch_id: defaultBranch
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service) => {
    const defaultBranch = service.branch_id ? String(service.branch_id) : (selectedBranchId !== 'all' ? String(selectedBranchId) : String(branches[0]?.id || '1'));
    setEditingService(service);
    setServiceForm({
      name: service.name || '',
      category: service.category || 'Hair',
      price: service.price || '',
      duration_minutes: service.duration_minutes || 30,
      buffer_time_minutes: service.buffer_time_minutes || 15,
      commission_rate: service.commission_rate || 10.0,
      description: service.description || '',
      is_active: service.is_active !== undefined ? service.is_active : true,
      branch_id: defaultBranch
    });
    setIsServiceModalOpen(true);
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (isSavingService) return;
    setIsSavingService(true);
    try {
      const activeBranch = serviceForm.branch_id ? parseInt(serviceForm.branch_id) : (selectedBranchId !== 'all' ? parseInt(selectedBranchId) : (branches[0]?.id || 1));
      const payload = {
        ...serviceForm,
        price: parseFloat(serviceForm.price),
        duration_minutes: parseInt(serviceForm.duration_minutes),
        buffer_time_minutes: parseInt(serviceForm.buffer_time_minutes),
        commission_rate: parseFloat(serviceForm.commission_rate),
        branch_id: activeBranch
      };

      if (editingService && onUpdateService) {
        await onUpdateService(editingService.id, payload);
        if (serverServices) {
          setServerServices(prev => prev ? prev.map(s => String(s.id) === String(editingService.id) ? { ...s, ...payload } : s) : null);
        }
      } else if (onAddService) {
        const created = await onAddService(payload);
        if (created && serverServices) {
          setServerServices(prev => prev ? [created, ...prev] : [created]);
        }
      }
      setIsServiceModalOpen(false);
      setTimeout(() => { fetchServicesData(); }, 300);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingService(false);
    }
  };

  // Helper to safely parse service_ids from string JSON or Array
  const parseServiceIds = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // ─── Handlers for Package Modal ───
  const handleOpenAddPackage = () => {
    const defaultBranch = selectedBranchId !== 'all' ? String(selectedBranchId) : String(branches[0]?.id || '1');
    setEditingPackage(null);
    setShowQuickAddService(false);
    setPackageForm({
      name: '',
      category: 'Combo Package',
      package_price: '',
      validity_days: 30,
      valid_until: '',
      description: '',
      is_active: true,
      service_ids: [],
      branch_id: defaultBranch
    });
    setIsPackageModalOpen(true);
  };

  const handleSubmitQuickService = async () => {
    if (!quickServiceForm.name.trim() || !quickServiceForm.price) return;
    const activeBranch = packageForm.branch_id ? parseInt(packageForm.branch_id) : (selectedBranchId !== 'all' ? parseInt(selectedBranchId) : (branches[0]?.id || 1));
    const payload = {
      ...quickServiceForm,
      price: parseFloat(quickServiceForm.price),
      duration_minutes: parseInt(quickServiceForm.duration_minutes || 30),
      buffer_time_minutes: 15,
      commission_rate: 10.0,
      is_active: true,
      branch_id: activeBranch
    };
    
    if (onAddService) {
      const created = await onAddService(payload);
      if (created?.id) {
        setPackageForm(prev => ({
          ...prev,
          service_ids: [...parseServiceIds(prev.service_ids), created.id]
        }));
      }
    }
    setQuickServiceForm({ name: '', category: 'Hair', price: '', duration_minutes: 30 });
    setShowQuickAddService(false);
  };

  const handleOpenEditPackage = (pkg) => {
    setEditingPackage(pkg);
    let validUntilStr = '';
    if (pkg.valid_until) {
      const d = new Date(pkg.valid_until);
      if (!isNaN(d.getTime())) {
        validUntilStr = d.toISOString().split('T')[0];
      }
    }
    const defaultBranch = pkg.branch_id ? String(pkg.branch_id) : (selectedBranchId !== 'all' ? String(selectedBranchId) : String(branches[0]?.id || '1'));
    setPackageForm({
      name: pkg.name || '',
      category: pkg.category || 'Combo Package',
      package_price: pkg.package_price || '',
      validity_days: pkg.validity_days || 30,
      valid_until: validUntilStr,
      description: pkg.description || '',
      is_active: pkg.is_active !== undefined ? pkg.is_active : true,
      service_ids: parseServiceIds(pkg.service_ids),
      branch_id: defaultBranch
    });
    setIsPackageModalOpen(true);
  };

  const togglePackageServiceId = (serviceId) => {
    setPackageForm(prev => {
      const currentIds = parseServiceIds(prev.service_ids);
      const exists = currentIds.some(id => String(id) === String(serviceId));
      const updated = exists 
        ? currentIds.filter(id => String(id) !== String(serviceId))
        : [...currentIds, serviceId];
      return { ...prev, service_ids: updated };
    });
  };

  // Calculate Standalone total price for selected services in Package Form
  const selectedStandaloneTotal = parseServiceIds(packageForm.service_ids).reduce((sum, id) => {
    const s = services.find(srv => String(srv.id) === String(id));
    return sum + (s ? parseFloat(s.price || 0) : 0);
  }, 0);

  const calculatedDiscountPct = selectedStandaloneTotal > 0 && packageForm.package_price
    ? Math.max(0, (((selectedStandaloneTotal - parseFloat(packageForm.package_price)) / selectedStandaloneTotal) * 100)).toFixed(1)
    : 0;

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    if (isSavingPackage) return;
    setIsSavingPackage(true);
    try {
      const pkgPrice = parseFloat(packageForm.package_price);
      const activeBranch = packageForm.branch_id ? parseInt(packageForm.branch_id) : (selectedBranchId !== 'all' ? parseInt(selectedBranchId) : (branches[0]?.id || 1));
      const payload = {
        ...packageForm,
        package_price: pkgPrice,
        standalone_price: selectedStandaloneTotal > 0 ? selectedStandaloneTotal : pkgPrice,
        discount_percentage: parseFloat(calculatedDiscountPct),
        validity_days: parseInt(packageForm.validity_days || 30),
        valid_until: packageForm.valid_until || null,
        branch_id: activeBranch
      };

      if (editingPackage && onUpdatePackage) {
        await onUpdatePackage(editingPackage.id, payload);
        if (serverPackages) {
          setServerPackages(prev => prev ? prev.map(p => String(p.id) === String(editingPackage.id) ? { ...p, ...payload } : p) : null);
        }
      } else if (onAddPackage) {
        const created = await onAddPackage(payload);
        if (created && serverPackages) {
          setServerPackages(prev => prev ? [created, ...prev] : [created]);
        }
      }
      setIsPackageModalOpen(false);
      setTimeout(() => { fetchPackagesData(); }, 300);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingPackage(false);
    }
  };

  // ─── Handlers for Category Modal ───
  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    if (editingCategory && onUpdateCategory) {
      onUpdateCategory(editingCategory.id, categoryForm);
    } else if (onAddCategory) {
      onAddCategory(categoryForm);
    }
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
  };

  const handleStartEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name || '', description: cat.description || '' });
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
  };

  // ─── Delete Confirmation Handler ───
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const targetId = deletingItem.item.id;
    if (deletingItem.type === 'service') {
      setServerServices(prev => prev ? prev.filter(s => String(s.id) !== String(targetId)) : null);
      if (onDeleteService) await onDeleteService(targetId);
      setTimeout(() => { fetchServicesData(); }, 300);
    } else if (deletingItem.type === 'package') {
      setServerPackages(prev => prev ? prev.filter(p => String(p.id) !== String(targetId)) : null);
      if (onDeletePackage) await onDeletePackage(targetId);
      setTimeout(() => { fetchPackagesData(); }, 300);
    } else if (deletingItem.type === 'category' && onDeleteCategory) {
      onDeleteCategory(targetId);
    }
    setDeletingItem(null);
  };

  // Dynamic Categories list
  const categoryNamesList = categories && categories.length > 0
    ? categories.map(c => typeof c === 'string' ? c : c.name)
    : ['Hair', 'Beard', 'Facial', 'Hair Spa', 'Color'];

  const CATEGORIES = Array.from(new Set(['All', ...categoryNamesList, 'Packages & Combos']));

  // Filtered Services & Packages by selected branch
  const rawServicesList = serverServices !== null ? serverServices : services;
  const rawPackagesList = serverPackages !== null ? serverPackages : packages;

  const isMatchBranch = (itemBranchId) => {
    if (!currentUser) return false;
    const isMaster = currentUser.is_super_admin === true || currentUser.email === 'admin@saloon.com' || currentUser.id === 1 || String(currentUser.role || '').toLowerCase().includes('super');
    if (isMaster) {
      if (selectedBranchId === 'all' || !selectedBranchId) return true;
      return String(itemBranchId) === String(selectedBranchId);
    }

    // Salon Admin & Branch Scoped Staff: Strictly check against authorized branches
    const allowedBranchIds = new Set((branches || []).map(b => String(b.id)));
    if (itemBranchId != null && itemBranchId !== undefined && itemBranchId !== 'all') {
      if (!allowedBranchIds.has(String(itemBranchId))) {
        return false; // Does not belong to this Salon Admin's salon branches!
      }
    }

    if (selectedBranchId === 'all' || !selectedBranchId) return true;
    return String(itemBranchId) === String(selectedBranchId);
  };

  const displayedServices = rawServicesList.filter(s => {
    if (!s) return false;
    if (!isMatchBranch(s.branch_id)) return false;
    const matchesCat = activeCategory === 'All' || activeCategory === 'Packages & Combos' ? (activeCategory !== 'Packages & Combos') : s.category === activeCategory;
    const matchesSearch = !searchQuery.trim() || String(s.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.category && String(s.category).toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const displayedPackages = rawPackagesList.filter(p => {
    if (!p) return false;
    if (!isMatchBranch(p.branch_id)) return false;
    const matchesCat = activeCategory === 'All' || activeCategory === 'Packages & Combos';
    const matchesSearch = !searchQuery.trim() || String(p.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.category && String(p.category).toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const branchFilteredServices = services.filter(s => {
    if (!s) return false;
    return isMatchBranch(s.branch_id);
  });

  const branchFilteredPackages = packages.filter(p => {
    if (!p) return false;
    return isMatchBranch(p.branch_id);
  });

  // Live services & packages list currently active in the view
  const currentServicesList = serverServices !== null ? serverServices : branchFilteredServices;
  const currentPackagesList = serverPackages !== null ? serverPackages : branchFilteredPackages;

  // Calculate Header Stats dynamically from actual live active data
  const activeServicesCount = currentServicesList.filter(s => s && s.is_active !== false).length;
  const activePackagesCount = currentPackagesList.filter(p => p && p.is_active !== false).length;
  const avgDuration = currentServicesList.length > 0
    ? Math.round(currentServicesList.reduce((acc, s) => acc + parseInt(s.duration_minutes || 30), 0) / currentServicesList.length)
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
          <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6' }}>
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
              onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
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
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
          <button 
            onClick={() => setIsCategoryModalOpen(true)} 
            className="glass-card" 
            style={{ padding: '8px 16px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-main)', border: '1px solid var(--border)', fontWeight: '700' }}
          >
            <Tag size={15} style={{ color: 'var(--accent-gold)' }} /> Manage Categories
          </button>

          <button onClick={handleOpenAddService} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
            <Plus size={16} /> Add Standalone Service
          </button>
          
          <button 
            onClick={handleOpenAddPackage} 
            className="glass-card" 
            style={{ padding: '8px 16px', fontSize: '0.84rem', background: '#2563eb', border: 'none', color: '#ffffff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
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
                  Standalone Services ({displayedServices.length})
                </h3>
              </div>

              {loadingBackend ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sub)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-indigo)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading Standalone Services...</span>
                </div>
              ) : displayedServices.length === 0 ? (
                <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No services found in this category for the active branch. Click "Add Standalone Service" to create one.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '18px' }}>
                  {displayedServices.map(srv => (
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateService) {
                                onUpdateService(srv.id, { ...srv, is_active: srv.is_active === false ? true : false });
                              }
                            }}
                            title="Click to toggle Active / Inactive status in database"
                            style={{ 
                              fontSize: '0.74rem', 
                              background: srv.is_active !== false ? 'rgba(37,99,235,0.15)' : 'rgba(239,68,68,0.15)', 
                              color: srv.is_active !== false ? '#38bdf8' : '#ef4444', 
                              border: srv.is_active !== false ? '1px solid rgba(37,99,235,0.4)' : '1px solid rgba(239,68,68,0.4)',
                              padding: '3px 9px', 
                              borderRadius: '6px', 
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: srv.is_active !== false ? '#38bdf8' : '#ef4444' }}></span>
                            {srv.is_active !== false ? 'Active' : 'Inactive'}
                          </button>
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
                            <Percent size={13} style={{ color: '#38bdf8' }} /> {srv.commission_rate || 10}% Commission
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

              {/* Standalone Services Pagination Bar */}
              <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderRadius: '12px', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                  <span>Show standalone services per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                      setPageSize(val);
                      setCurrentPage(1);
                    }}
                    style={{
                      background: 'var(--input-bg)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.84rem',
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
                  <span style={{ color: 'var(--text-muted)' }}>
                    ({totalServicesCount || displayedServices.length} total services)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    disabled={currentPage <= 1 || loadingBackend}
                    onClick={() => setCurrentPage(1)}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-main)',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="First Page"
                  >
                    <ChevronsLeft size={16} />
                  </button>

                  <button
                    disabled={currentPage <= 1 || loadingBackend}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-main)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>

                  <span style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', padding: '0 8px' }}>
                    Page {currentPage} of {totalServicesPages || 1}
                  </span>

                  <button
                    disabled={currentPage >= totalServicesPages || loadingBackend}
                    onClick={() => setCurrentPage(prev => Math.min(totalServicesPages, prev + 1))}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: currentPage >= totalServicesPages ? 'var(--text-muted)' : 'var(--text-main)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      cursor: currentPage >= totalServicesPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Next <ChevronRight size={16} />
                  </button>

                  <button
                    disabled={currentPage >= totalServicesPages || loadingBackend}
                    onClick={() => setCurrentPage(totalServicesPages)}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: currentPage >= totalServicesPages ? 'var(--text-muted)' : 'var(--text-main)',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      cursor: currentPage >= totalServicesPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Last Page"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Bundled Combo Packages Grid */}
          {(activeCategory === 'All' || activeCategory === 'Packages & Combos') && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gift size={18} style={{ color: '#38bdf8' }} />
                  Bundled Combo Packages ({displayedPackages.length})
                </h3>
              </div>

              {loadingBackendPackages ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sub)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: '#38bdf8' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading Combo Packages...</span>
                </div>
              ) : displayedPackages.length === 0 ? (
                <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No combo packages created yet. Click "Create Combo Package" to bundle multiple services with discounts.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {displayedPackages.map(pkg => {
                    const expStatus = getPackageExpirationStatus(pkg);
                    // Find names of included services
                    const includedServiceNames = parseServiceIds(pkg.service_ids).map(id => {
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
                          justifyContent: 'space-between',
                          border: expStatus.isInactive || expStatus.isExpired ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid rgba(37, 99, 235, 0.35)',
                          background: 'var(--bg-card)',
                          position: 'relative',
                          opacity: expStatus.isInactive || expStatus.isExpired ? 0.85 : 1
                        }}
                      >
                        <div>
                          {/* Top Meta Badges & Active Expiration Status */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.74rem', background: 'rgba(37, 99, 235, 0.15)', color: '#38bdf8', border: '1px solid rgba(37, 99, 235, 0.35)', padding: '3px 10px', borderRadius: '20px', fontWeight: '800' }}>
                              {pkg.category || 'Combo Package'}
                            </span>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {pkg.discount_percentage > 0 && (
                                <span style={{ fontSize: '0.74rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', padding: '3px 8px', borderRadius: '20px', fontWeight: '900' }}>
                                  {pkg.discount_percentage}% OFF
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onUpdatePackage) {
                                    onUpdatePackage(pkg.id, { ...pkg, is_active: pkg.is_active === false ? true : false });
                                    setTimeout(() => fetchPackagesData(), 300);
                                  }
                                }}
                                title="Click to toggle Active / Inactive status in database"
                                style={{ 
                                  fontSize: '0.74rem', 
                                  background: expStatus.bg, 
                                  color: expStatus.color, 
                                  border: `1px solid ${expStatus.color}`,
                                  padding: '3px 9px', 
                                  borderRadius: '6px', 
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: expStatus.color }}></span>
                                {expStatus.label}
                              </button>
                            </div>
                          </div>

                          <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
                            {pkg.name}
                          </h4>

                          <p style={{ fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: '1.5', marginBottom: '14px' }}>
                            {pkg.description || 'Special combo deal bundling multiple salon services.'}
                          </p>

                          {/* Included Services Checklist Box */}
                          <div style={{ background: 'var(--input-bg)', borderRadius: '10px', padding: '12px', marginBottom: '14px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              🎁 Included Combo Services ({includedServiceNames.length}):
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {includedServiceNames.map((srvName, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-main)' }}>
                                  <CheckCircle2 size={13} style={{ color: expStatus.isExpired ? '#ef4444' : '#38bdf8', flexShrink: 0 }} />
                                  <span>{srvName}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Validity & Expiration details */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '14px', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} style={{ color: 'var(--accent-gold)' }} /> Validity Period:
                              </span>
                              <strong style={{ color: 'var(--text-main)' }}>{pkg.validity_days || 30} Days</strong>
                            </div>
                            {pkg.valid_until && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Calendar size={12} style={{ color: 'var(--primary-indigo)' }} /> Valid Until:
                                </span>
                                <strong style={{ color: expStatus.isExpired ? '#ef4444' : 'var(--text-main)' }}>
                                  {new Date(pkg.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </strong>
                              </div>
                            )}
                            {expStatus.expiryDate && (
                              <div style={{ fontSize: '0.72rem', color: expStatus.isExpired ? '#ef4444' : expStatus.color, fontWeight: '700', marginTop: '2px' }}>
                                {expStatus.isExpired ? '⚠️ Expired date passed - auto inactivated' : `⏳ Expiration Date: ${expStatus.expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer: Price Comparison & Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: expStatus.isExpired ? '#ef4444' : '#38bdf8' }}>
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
                              style={{ background: 'rgba(37, 99, 235, 0.15)', border: '1px solid #2563eb', color: '#38bdf8', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
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

              {/* Bundled Combo Packages Pagination Bar */}
              <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderRadius: '12px', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                  <span>Show packages per page:</span>
                  <select
                    value={packagePageSize}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                      setPackagePageSize(val);
                      setPackageCurrentPage(1);
                    }}
                    style={{
                      background: 'var(--input-bg)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.84rem',
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
                  <span style={{ color: 'var(--text-muted)' }}>
                    ({totalPackagesCount || displayedPackages.length} total packages)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    disabled={packageCurrentPage <= 1 || loadingBackendPackages}
                    onClick={() => setPackageCurrentPage(1)}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: packageCurrentPage <= 1 ? 'var(--text-muted)' : 'var(--text-main)',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      cursor: packageCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="First Page"
                  >
                    <ChevronsLeft size={16} />
                  </button>

                  <button
                    disabled={packageCurrentPage <= 1 || loadingBackendPackages}
                    onClick={() => setPackageCurrentPage(prev => Math.max(1, prev - 1))}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: packageCurrentPage <= 1 ? 'var(--text-muted)' : 'var(--text-main)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      cursor: packageCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>

                  <span style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', padding: '0 8px' }}>
                    Page {packageCurrentPage} of {totalPackagesPages || 1}
                  </span>

                  <button
                    disabled={packageCurrentPage >= totalPackagesPages || loadingBackendPackages}
                    onClick={() => setPackageCurrentPage(prev => Math.min(totalPackagesPages, prev + 1))}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: packageCurrentPage >= totalPackagesPages ? 'var(--text-muted)' : 'var(--text-main)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      cursor: packageCurrentPage >= totalPackagesPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Next <ChevronRight size={16} />
                  </button>

                  <button
                    disabled={packageCurrentPage >= totalPackagesPages || loadingBackendPackages}
                    onClick={() => setPackageCurrentPage(totalPackagesPages)}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: packageCurrentPage >= totalPackagesPages ? 'var(--text-muted)' : 'var(--text-main)',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      cursor: packageCurrentPage >= totalPackagesPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Last Page"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
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
              {activeCategory !== 'Packages & Combos' && (
                loadingBackend ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sub)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-indigo)' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading Standalone Services...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedServices.map(srv => (
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
                      <td style={{ padding: '12px 16px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        {srv.duration_minutes || 30} mins (+{srv.buffer_time_minutes || 15}m buffer)
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.84rem', color: '#38bdf8', fontWeight: '700' }}>
                        {srv.commission_rate || 10}% Stylist Comm.
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onUpdateService) {
                              onUpdateService(srv.id, { ...srv, is_active: srv.is_active === false ? true : false });
                            }
                          }}
                          title="Click to toggle Active / Inactive status in database"
                          style={{ 
                            fontSize: '0.74rem', 
                            background: srv.is_active !== false ? 'rgba(37,99,235,0.15)' : 'rgba(239,68,68,0.15)', 
                            color: srv.is_active !== false ? '#38bdf8' : '#ef4444', 
                            border: srv.is_active !== false ? '1px solid rgba(37,99,235,0.4)' : '1px solid rgba(239,68,68,0.4)',
                            padding: '3px 9px', 
                            borderRadius: '6px', 
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: srv.is_active !== false ? '#38bdf8' : '#ef4444' }}></span>
                          {srv.is_active !== false ? 'Active' : 'Inactive'}
                        </button>
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
                  ))
                )
              )}

              {/* Render Packages */}
              {(activeCategory === 'All' || activeCategory === 'Packages & Combos') && (
                loadingBackendPackages ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sub)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Loader2 size={32} className="animate-spin" style={{ color: '#38bdf8' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading Combo Packages...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedPackages.map(pkg => {
                    const expStatus = getPackageExpirationStatus(pkg);
                    const incNames = parseServiceIds(pkg.service_ids).map(id => {
                      const s = services.find(srv => String(srv.id) === String(id));
                      return s ? s.name : `Service #${id}`;
                    });
                    return (
                      <tr key={`pkg-${pkg.id}`} style={{ borderBottom: '1px solid var(--border)', background: expStatus.isInactive || expStatus.isExpired ? 'rgba(239, 68, 68, 0.03)' : 'rgba(37, 99, 235, 0.03)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Gift size={15} style={{ color: expStatus.isExpired ? '#ef4444' : '#38bdf8' }} />
                            {pkg.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>{pkg.description || 'Combo package bundle'}</div>
                          {incNames.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {incNames.map((sName, i) => (
                                <span key={i} style={{ fontSize: '0.7rem', background: 'rgba(37,99,235,0.12)', color: '#38bdf8', padding: '2px 7px', borderRadius: '6px', border: '1px solid rgba(37,99,235,0.25)', fontWeight: '600' }}>
                                  ✓ {sName}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '0.74rem', background: 'rgba(37,99,235,0.15)', color: '#38bdf8', border: '1px solid rgba(37,99,235,0.3)', padding: '3px 8px', borderRadius: '12px', fontWeight: '800' }}>
                          {pkg.category || 'Combo Package'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        <div>{pkg.validity_days || 30} Days Validity</div>
                        {pkg.valid_until && (
                          <div style={{ fontSize: '0.75rem', color: expStatus.isExpired ? '#ef4444' : 'var(--text-sub)', fontWeight: '600' }}>
                            Valid until: {new Date(pkg.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.84rem', color: 'var(--accent-gold)', fontWeight: '800' }}>
                        {pkg.discount_percentage > 0 ? `${pkg.discount_percentage}% OFF` : 'Standard Bundle'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onUpdatePackage) {
                              onUpdatePackage(pkg.id, { ...pkg, is_active: pkg.is_active === false ? true : false });
                              setTimeout(() => fetchPackagesData(), 300);
                            }
                          }}
                          title="Click to toggle Active / Inactive status in database"
                          style={{ 
                            fontSize: '0.74rem', 
                            background: expStatus.bg, 
                            color: expStatus.color, 
                            border: `1px solid ${expStatus.color}`,
                            padding: '3px 9px', 
                            borderRadius: '6px', 
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: expStatus.color }}></span>
                          {expStatus.label}
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '900', color: expStatus.isExpired ? '#ef4444' : '#38bdf8', fontSize: '0.95rem' }}>
                        ₹{parseFloat(pkg.package_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenEditPackage(pkg)} style={{ background: 'rgba(37,99,235,0.15)', border: 'none', color: '#38bdf8', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => setDeletingItem({ type: 'package', item: pkg })} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )
            )}
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
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  <Building2 size={15} style={{ color: '#38bdf8' }} /> Target Branch Location *
                </label>
                <select
                  value={serviceForm.branch_id || ''}
                  onChange={(e) => setServiceForm({ ...serviceForm, branch_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  {branches && branches.length > 0 ? (
                    branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code || `B-${b.id}`})</option>
                    ))
                  ) : (
                    <option value="1">Main Salon Branch</option>
                  )}
                </select>
              </div>

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
                    {categoryNamesList.map(catName => (
                      <option key={catName} value={catName}>{catName}</option>
                    ))}
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

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '700' }}>
                  <input
                    type="checkbox"
                    checked={serviceForm.is_active !== false}
                    onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
                  />
                  <span>Service Active & Available for Salon Booking</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="glass-card" style={{ padding: '10px 18px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="btn-primary"
                  style={{
                    padding: '10px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSavingService ? 0.75 : 1,
                    cursor: isSavingService ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSavingService ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> {editingService ? 'Saving Changes...' : 'Creating Service...'}
                    </>
                  ) : (
                    editingService ? 'Save Changes' : 'Create Service'
                  )}
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
                <Gift size={20} style={{ color: '#38bdf8' }} />
                {editingPackage ? 'Edit Combo Package' : 'Create Bundled Combo Package'}
              </h3>
              <button onClick={() => setIsPackageModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePackageSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  <Building2 size={15} style={{ color: '#38bdf8' }} /> Target Branch Location *
                </label>
                <select
                  value={packageForm.branch_id || ''}
                  onChange={(e) => setPackageForm({ ...packageForm, branch_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  {branches && branches.length > 0 ? (
                    branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code || `B-${b.id}`})</option>
                    ))
                  ) : (
                    <option value="1">Main Salon Branch</option>
                  )}
                </select>
              </div>

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
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span>Select Included Services *</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: '700', fontSize: '0.84rem' }}>
                    Standalone Total: ₹{selectedStandaloneTotal.toFixed(2)}
                  </span>
                </label>

                <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {services && services.length > 0 ? (
                    services.map(srv => {
                      const currentIds = parseServiceIds(packageForm.service_ids);
                      const isChecked = currentIds.some(id => String(id) === String(srv.id));
                      return (
                        <label 
                          key={srv.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '8px 12px', 
                            background: isChecked ? 'rgba(37, 99, 235, 0.12)' : 'transparent', 
                            border: isChecked ? '1px solid rgba(37, 99, 235, 0.35)' : '1px solid var(--border)',
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-main)', flex: 1, minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePackageServiceId(srv.id)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb', flexShrink: 0, margin: 0 }}
                            />
                            <span style={{ fontWeight: isChecked ? '600' : '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {srv.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({srv.category})</span>
                            </span>
                          </div>

                          <span style={{ fontSize: '0.84rem', fontWeight: '700', color: isChecked ? '#38bdf8' : 'var(--accent-gold)', marginLeft: '12px', flexShrink: 0 }}>
                            ₹{parseFloat(srv.price).toFixed(2)}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                      No services available. Create a service first.
                    </div>
                  )}
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
                  <label>Validity Duration (Days)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={packageForm.validity_days}
                    onChange={(e) => setPackageForm({ ...packageForm, validity_days: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} style={{ color: 'var(--primary-indigo)' }} />
                  <span>Specific Expiry Date (Valid Until) - Optional</span>
                </label>
                <input
                  type="date"
                  value={packageForm.valid_until || ''}
                  onChange={(e) => setPackageForm({ ...packageForm, valid_until: e.target.value })}
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  💡 Expiration Rule: Package will automatically deactivate & expire after validity days or valid until date passes.
                </span>
              </div>

              {/* Real-time Discount & Savings Badge */}
              {selectedStandaloneTotal > 0 && packageForm.package_price && (
                <div style={{ padding: '10px 14px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid #2563eb', borderRadius: '8px', marginBottom: '16px', fontSize: '0.83rem', color: '#38bdf8', fontWeight: '800', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '700' }}>
                  <input
                    type="checkbox"
                    checked={packageForm.is_active !== false}
                    onChange={(e) => setPackageForm({ ...packageForm, is_active: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
                  />
                  <span>Combo Package Active & Published</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsPackageModalOpen(false)} className="glass-card" style={{ padding: '10px 18px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPackage}
                  className="btn-primary"
                  style={{
                    padding: '10px 22px',
                    background: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSavingPackage ? 0.75 : 1,
                    cursor: isSavingPackage ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSavingPackage ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> {editingPackage ? 'Saving Package...' : 'Creating Package...'}
                    </>
                  ) : (
                    editingPackage ? 'Save Package' : 'Create Package'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ─── MODAL 3: DYNAMIC CATEGORY MANAGER MODAL ─── */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '580px', width: '92%', padding: '28px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={20} style={{ color: 'var(--accent-gold)' }} />
                Manage Service Categories
              </h3>
              <button onClick={() => { setIsCategoryModalOpen(false); handleCancelCategoryEdit(); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Category Create / Edit Form */}
            <form onSubmit={handleCategorySubmit} style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '10px' }}>
                {editingCategory ? `Edit Category: "${editingCategory.name}"` : '+ Create New Dynamic Category'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nail Care, Facial Spa"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Category details..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                {editingCategory && (
                  <button type="button" onClick={handleCancelCategoryEdit} className="glass-card" style={{ padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-primary" style={{ padding: '6px 18px', fontSize: '0.82rem' }}>
                  {editingCategory ? 'Update Category' : '+ Add Category'}
                </button>
              </div>
            </form>

            {/* Existing Categories Table */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: 'var(--text-main)' }}>
                <thead>
                  <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Category Name</th>
                    <th style={{ padding: '10px 14px' }}>Description</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories && categories.length > 0 ? (
                    categories.map(cat => {
                      const catObj = typeof cat === 'string' ? { id: cat, name: cat, description: '' } : cat;
                      return (
                        <tr key={catObj.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: '700', color: 'var(--accent-gold)' }}>
                            {catObj.name}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-sub)' }}>
                            {catObj.description || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleStartEditCategory(catObj)}
                                style={{ background: 'rgba(99,102,241,0.15)', border: 'none', color: 'var(--primary-indigo)', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer' }}
                                title="Edit Category"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                onClick={() => setDeletingItem({ type: 'category', item: catObj })}
                                style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer' }}
                                title="Delete Category"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => { setIsCategoryModalOpen(false); handleCancelCategoryEdit(); }} className="glass-card" style={{ padding: '8px 20px', cursor: 'pointer', color: 'var(--text-main)' }}>
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 4: DELETE CONFIRMATION ─── */}
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
              Delete {deletingItem.type === 'service' ? 'Service' : deletingItem.type === 'package' ? 'Combo Package' : 'Category'}?
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

import React, { useState, useEffect } from 'react';
import {
  Package, Plus, Search, Filter, Building2, User, Wrench, ShieldCheck,
  Calendar, DollarSign, ArrowRightLeft, Edit2, Trash2, CheckCircle2,
  AlertTriangle, XCircle, Tag, MapPin, Info, Sparkles, RefreshCw, Layers,
  ChevronDown, ChevronUp, Maximize2, Minimize2, TrendingUp, Clock, HelpCircle,
  Table as TableIcon, LayoutGrid, Eye, X
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Styling Equipment',
  'Salon Furniture',
  'Electrical Appliances',
  'IT & Electronics',
  'Beauty & Spa Tools',
  'General Equipment'
];

const CONDITION_OPTIONS = [
  'Operational',
  'Needs Maintenance',
  'Under Repair',
  'In Storage',
  'Decommissioned'
];

const AssetsTrackingManagementView = ({
  assets = [],
  branches = [],
  users = [],
  staff = [],
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  onTransferAsset,
  currentUser,
  userBranch
}) => {
  // Main Tab State: 'RENTAL_HUB' (Dedicated Loans & Rentals Tracking) or 'INVENTORY' (Equipment Directory)
  const [activeTab, setActiveTab] = useState('RENTAL_HUB');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [selectedAdminFilter, setSelectedAdminFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [selectedRentalModeFilter, setSelectedRentalModeFilter] = useState('ALL');
  const [selectedExpiryFilter, setSelectedExpiryFilter] = useState('ALL');

  // Card Expansion State (Default: closed/collapsed)
  const [expandedCardIds, setExpandedCardIds] = useState({});
  const [viewMode, setViewMode] = useState('table'); // 'table' (default) or 'cards'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBranch, selectedCategory, selectedCondition, selectedAdminFilter, selectedTypeFilter, selectedRentalModeFilter, selectedExpiryFilter, activeTab]);

  const toggleExpandCard = (id) => {
    setExpandedCardIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const adminUsersList = ((users && users.length > 0 ? users : staff) || []).filter(u => u && u.name);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState('OWNED'); // 'OWNED' or 'RENTAL'
  const [selectedAssetId, setSelectedAssetId] = useState('CUSTOM');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [transferAssetItem, setTransferAssetItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedDetailAsset, setSelectedDetailAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_code: '',
    category: 'Styling Equipment',
    branch_id: currentUser?.branch_id || branches[0]?.id || '',
    assigned_to_admin_id: currentUser?.id || '',
    assigned_person_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_cost: '',
    warranty_expiry: '',
    condition_status: 'Operational',
    location_room: 'Main Salon Floor',
    notes: '',
    asset_type: 'Owned',
    rental_mode: 'Free',
    daily_rent_rate: '0',
    issue_date: new Date().toISOString().split('T')[0],
    return_due_date: '',
    vendor_party_name: ''
  });

  // Transfer Form State
  const [transferData, setTransferData] = useState({
    branch_id: '',
    assigned_to_admin_id: '',
    assigned_person_name: '',
    location_room: ''
  });

  // Open Add Owned Asset Modal
  const openAddOwnedModal = () => {
    setEditingAsset(null);
    setModalMode('OWNED');
    const defaultBranchId = currentUser?.branch_id || branches[0]?.id || '';
    setFormData({
      asset_name: '',
      asset_code: `AST-${Date.now().toString().slice(-5)}`,
      category: 'Styling Equipment',
      branch_id: defaultBranchId,
      assigned_to_admin_id: currentUser?.id || '',
      assigned_person_name: currentUser?.name || '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_cost: '',
      warranty_expiry: '',
      condition_status: 'Operational',
      location_room: 'Main Salon Floor',
      notes: '',
      asset_type: 'Owned',
      rental_mode: 'Free',
      daily_rent_rate: '0',
      issue_date: '',
      return_due_date: '',
      vendor_party_name: ''
    });
    setErrorMsg('');
    setShowAddModal(true);
  };

  // Open Add Rental / Loan Entry Modal
  const openAddRentalModal = () => {
    setEditingAsset(null);
    setModalMode('RENTAL');
    setSelectedAssetId('CUSTOM');
    const defaultBranchId = currentUser?.branch_id || branches[0]?.id || '';
    setFormData({
      asset_name: '',
      asset_code: `RNT-${Date.now().toString().slice(-5)}`,
      category: 'Styling Equipment',
      branch_id: defaultBranchId,
      assigned_to_admin_id: currentUser?.id || '',
      assigned_person_name: currentUser?.name || '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_cost: '',
      warranty_expiry: '',
      condition_status: 'Operational',
      location_room: 'Main Salon Floor',
      notes: '',
      asset_type: 'Rented Out',
      rental_mode: 'Daily Rent',
      daily_rent_rate: '150',
      issue_date: new Date().toISOString().split('T')[0],
      return_due_date: '',
      vendor_party_name: ''
    });
    setErrorMsg('');
    setShowAddModal(true);
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    const isRental = asset.asset_type && asset.asset_type !== 'Owned';
    setModalMode(isRental ? 'RENTAL' : 'OWNED');
    setFormData({
      asset_name: asset.asset_name || '',
      asset_code: asset.asset_code || '',
      category: asset.category || 'Styling Equipment',
      branch_id: asset.branch_id || '',
      assigned_to_admin_id: asset.assigned_to_admin_id || '',
      assigned_person_name: asset.assigned_person_name || '',
      purchase_date: asset.purchase_date || '',
      purchase_cost: asset.purchase_cost || '',
      warranty_expiry: asset.warranty_expiry || '',
      condition_status: asset.condition_status || 'Operational',
      location_room: asset.location_room || 'Main Salon Floor',
      notes: asset.notes || '',
      asset_type: asset.asset_type || (isRental ? 'Rented Out' : 'Owned'),
      rental_mode: asset.rental_mode || (isRental ? 'Daily Rent' : 'Free'),
      daily_rent_rate: asset.daily_rent_rate || '0',
      issue_date: asset.issue_date || '',
      return_due_date: asset.return_due_date || asset.warranty_expiry || '',
      vendor_party_name: asset.vendor_party_name || ''
    });
    setErrorMsg('');
    setShowAddModal(true);
  };

  const openTransferModal = (asset) => {
    setTransferAssetItem(asset);
    setTransferData({
      branch_id: asset.branch_id || branches[0]?.id || '',
      assigned_to_admin_id: asset.assigned_to_admin_id || '',
      assigned_person_name: asset.assigned_person_name || '',
      location_room: asset.location_room || 'Main Salon Floor'
    });
    setErrorMsg('');
    setShowTransferModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.asset_name.trim()) {
      setErrorMsg('Asset Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAsset) {
        await onUpdateAsset(editingAsset.id, formData);
        setSuccessMsg('Record updated successfully!');
      } else {
        await onAddAsset(formData);
        setSuccessMsg(modalMode === 'RENTAL' ? 'New Rental / Loan entry added!' : 'New salon asset added!');
      }
      setShowAddModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferAssetItem) return;

    setIsSubmitting(true);
    try {
      await onTransferAsset(transferAssetItem.id, transferData);
      setSuccessMsg(`Asset ${transferAssetItem.asset_code} reassigned successfully!`);
      setShowTransferModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to transfer asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await onDeleteAsset(id);
      setDeleteConfirmId(null);
      setSuccessMsg('Record deleted permanently.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to delete asset');
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'No Due Date Set', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.2)', status: 'none' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);

    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Overdue (${Math.abs(diffDays)}d ago)`, color: '#f87171', bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', status: 'expired' };
    } else if (diffDays <= 30) {
      return { label: `Due in ${diffDays} days!`, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', status: 'expiring' };
    } else {
      return { label: `Active (${diffDays} days left)`, color: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', status: 'active' };
    }
  };

  const calculateTotalRent = (asset) => {
    const rate = parseFloat(asset.daily_rent_rate || 0);
    if (!rate || rate <= 0 || asset.rental_mode === 'Free') return null;
    const issue = asset.issue_date ? new Date(asset.issue_date) : new Date();
    const target = asset.return_due_date ? new Date(asset.return_due_date) : new Date();
    const days = Math.max(1, Math.ceil((target - issue) / (1000 * 60 * 60 * 24)));

    let units = days;
    let unitLabel = 'days';
    let rateLabel = `₹${rate}/day`;
    let total = days * rate;

    if (asset.rental_mode === 'Weekly Rent' || asset.rental_mode === 'Weekly') {
      units = Math.max(1, Math.ceil(days / 7));
      unitLabel = 'weeks';
      rateLabel = `₹${rate}/week`;
      total = units * rate;
    } else if (asset.rental_mode === 'Monthly Rent' || asset.rental_mode === 'Monthly') {
      units = Math.max(1, Math.ceil(days / 30));
      unitLabel = 'months';
      rateLabel = `₹${rate}/month`;
      total = units * rate;
    }

    return { days, units, unitLabel, rateLabel, total, dailyRate: rate };
  };

  // Filter Assets List based on Tab
  const filteredAssets = assets.filter(a => {
    const isLoanOrRental = a.asset_type && a.asset_type !== 'Owned';

    // Tab Filter
    if (activeTab === 'RENTAL_HUB' && !isLoanOrRental) return false;
    if (activeTab === 'INVENTORY' && isLoanOrRental) return false;

    const nameMatch = (a.asset_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.asset_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.assigned_person_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.vendor_party_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.assigned_admin_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.location_room || '').toLowerCase().includes(searchTerm.toLowerCase());

    const branchMatch = selectedBranch === 'ALL' || String(a.branch_id) === String(selectedBranch);
    const categoryMatch = selectedCategory === 'ALL' || a.category === selectedCategory;
    const conditionMatch = selectedCondition === 'ALL' || a.condition_status === selectedCondition;
    const adminMatch = selectedAdminFilter === 'ALL' ||
      String(a.admin_id) === String(selectedAdminFilter) ||
      String(a.created_by_admin_id) === String(selectedAdminFilter) ||
      String(a.assigned_to_admin_id) === String(selectedAdminFilter);

    const typeMatch = selectedTypeFilter === 'ALL' || a.asset_type === selectedTypeFilter;

    let rentalModeMatch = true;
    if (selectedRentalModeFilter !== 'ALL') {
      if (selectedRentalModeFilter === 'Daily') rentalModeMatch = a.rental_mode === 'Daily Rent' || a.rental_mode === 'Daily';
      if (selectedRentalModeFilter === 'Weekly') rentalModeMatch = a.rental_mode === 'Weekly Rent' || a.rental_mode === 'Weekly';
      if (selectedRentalModeFilter === 'Monthly') rentalModeMatch = a.rental_mode === 'Monthly Rent' || a.rental_mode === 'Monthly';
      if (selectedRentalModeFilter === 'Free') rentalModeMatch = a.rental_mode === 'Free';
    }

    const expInfo = getExpiryStatus(a.return_due_date || a.warranty_expiry);
    let expiryMatch = true;
    if (selectedExpiryFilter === 'EXPIRING_SOON') expiryMatch = expInfo.status === 'expiring';
    if (selectedExpiryFilter === 'EXPIRED') expiryMatch = expInfo.status === 'expired';
    if (selectedExpiryFilter === 'ACTIVE') expiryMatch = expInfo.status === 'active';

    return nameMatch && branchMatch && categoryMatch && conditionMatch && adminMatch && typeMatch && rentalModeMatch && expiryMatch;
  });

  // Metrics
  const ownedCount = assets.filter(a => !a.asset_type || a.asset_type === 'Owned').length;
  const activeLoansRentals = assets.filter(a => a.asset_type && a.asset_type !== 'Owned').length;

  const rentedOutList = assets.filter(a => a.asset_type === 'Rented Out');
  const rentedInList = assets.filter(a => a.asset_type === 'Rented In');
  const freeLoansList = assets.filter(a => a.asset_type?.includes('Free'));

  const totalReceivableRent = rentedOutList.reduce((sum, a) => {
    const calc = calculateTotalRent(a);
    return sum + (calc ? calc.total : 0);
  }, 0);

  const totalPayableRent = rentedInList.reduce((sum, a) => {
    const calc = calculateTotalRent(a);
    return sum + (calc ? calc.total : 0);
  }, 0);

  const expiringCount = assets.filter(a => {
    const st = getExpiryStatus(a.return_due_date || a.warranty_expiry).status;
    return st === 'expiring' || st === 'expired';
  }).length;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const getConditionColor = (cond) => {
    switch (cond) {
      case 'Operational':
        return { color: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)' };
      case 'Needs Maintenance':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
      case 'Under Repair':
        return { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
      case 'In Storage':
        return { color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)' };
      default:
        return { color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.08)', border: 'rgba(255, 255, 255, 0.15)' };
    }
  };

  const isAllExpanded = filteredAssets.length > 0 && filteredAssets.every(a => expandedCardIds[a.id] === true);

  const toggleAllCards = () => {
    const nextState = {};
    const targetState = !isAllExpanded;
    filteredAssets.forEach(a => {
      nextState[a.id] = targetState;
    });
    setExpandedCardIds(nextState);
  };

  // Pagination calculations
  const totalItems = filteredAssets.length;
  const isAll = pageSize === 'all';
  const effectivePageSize = isAll ? totalItems : Number(pageSize);
  const totalPages = isAll || effectivePageSize <= 0 ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isAll ? 0 : (safePage - 1) * effectivePageSize;
  const endIndex = isAll ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);
  const paginatedAssets = isAll ? filteredAssets : filteredAssets.slice(startIndex, endIndex);

  return (
    <div style={{ padding: '10px 14px', color: '#e2e8f0', minHeight: '100vh' }}>
      {/* Top Banner Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Package style={{ color: '#6366f1' }} size={18} />
            Salon Assets & Equipment Tracking
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '2px', marginBottom: 0 }}>
            Isolate admin assets, track loans, calculate day/week/month rentals, and maintain return due dates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* View Mode Switcher (Table / Cards) */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#6366f1' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                height: '24px',
                padding: '0 8px',
                fontSize: '0.72rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Data Table View"
            >
              <TableIcon size={12} /> Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? '#6366f1' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                height: '24px',
                padding: '0 8px',
                fontSize: '0.72rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Cards View"
            >
              <LayoutGrid size={12} /> Cards
            </button>
          </div>

          {viewMode === 'cards' && filteredAssets.length > 0 && (
            <button
              type="button"
              onClick={toggleAllCards}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                borderRadius: '6px',
                height: '28px',
                padding: '2px 10px',
                fontWeight: '600',
                fontSize: '0.72rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              {isAllExpanded ? (
                <>
                  <Minimize2 size={12} style={{ color: '#818cf8' }} /> Minimize All
                </>
              ) : (
                <>
                  <Maximize2 size={12} style={{ color: '#818cf8' }} /> Expand All
                </>
              )}
            </button>
          )}

          {activeTab === 'RENTAL_HUB' ? (
            <button
              onClick={openAddRentalModal}
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                height: '28px',
                padding: '2px 12px',
                fontWeight: '600',
                fontSize: '0.74rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(56, 189, 248, 0.3)',
                cursor: 'pointer'
              }}
            >
              <ArrowRightLeft size={14} /> + Add Rental / Loan Entry
            </button>
          ) : (
            <button
              onClick={openAddOwnedModal}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                height: '28px',
                padding: '2px 12px',
                fontWeight: '600',
                fontSize: '0.74rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> + Add Owned Salon Asset
            </button>
          )}
        </div>
      </div>

      {/* Global Success Banner Notification */}
      {successMsg && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          color: '#4ade80',
          padding: '5px 12px',
          borderRadius: '6px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={14} /> {successMsg}
        </div>
      )}

      {/* Main Section Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '6px'
      }}>
        <button
          onClick={() => setActiveTab('RENTAL_HUB')}
          style={{
            height: '28px',
            padding: '4px 12px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'RENTAL_HUB'
              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
              : 'rgba(30, 41, 59, 0.6)',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '0.74rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: activeTab === 'RENTAL_HUB' ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'
          }}
        >
          <ArrowRightLeft size={14} />
          Asset Loans & Rental Tracking Hub
          {activeLoansRentals > 0 && (
            <span style={{
              background: '#38bdf8',
              color: '#0f172a',
              borderRadius: '6px',
              padding: '1px 6px',
              fontSize: '0.64rem',
              fontWeight: '800'
            }}>
              {activeLoansRentals} Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('INVENTORY')}
          style={{
            height: '28px',
            padding: '4px 12px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'INVENTORY'
              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
              : 'rgba(30, 41, 59, 0.6)',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '0.74rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: activeTab === 'INVENTORY' ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'
          }}
        >
          <Package size={14} />
          Owned Salon Equipment ({ownedCount})
        </button>
      </div>

      {/* DEDICATED TAB 1: ASSET LOANS & RENTAL TRACKING HUB */}
      {activeTab === 'RENTAL_HUB' && (
        <>
          {/* Dedicated KPI Summary Analytics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '8px',
            marginBottom: '8px'
          }}>
            {/* Rented Out Summary Card (Receivable) */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: '700', color: '#38bdf8' }}>ASSETS RENTED OUT</span>
                <span style={{ fontSize: '0.62rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 6px', borderRadius: '6px', fontWeight: '700' }}>
                  Receivable
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
                {rentedOutList.length} <span style={{ fontSize: '0.68rem', fontWeight: '500', color: '#94a3b8' }}>Items Lent</span>
              </div>
              <div style={{ fontSize: '0.70rem', fontWeight: '600', color: '#4ade80', marginTop: '2px' }}>
                Est. Rent: {formatCurrency(totalReceivableRent)}
              </div>
            </div>

            {/* Rented In Summary Card (Payable) */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: '700', color: '#f59e0b' }}>ASSETS RENTED IN</span>
                <span style={{ fontSize: '0.62rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '1px 6px', borderRadius: '6px', fontWeight: '700' }}>
                  Leased In
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
                {rentedInList.length} <span style={{ fontSize: '0.68rem', fontWeight: '500', color: '#94a3b8' }}>Items Leased</span>
              </div>
              <div style={{ fontSize: '0.70rem', fontWeight: '600', color: '#f87171', marginTop: '2px' }}>
                Est. Rent: {formatCurrency(totalPayableRent)}
              </div>
            </div>

            {/* Free Loans Card */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: '700', color: '#a855f7' }}>FREE / COMPLIMENTARY</span>
                <span style={{ fontSize: '0.62rem', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', padding: '1px 6px', borderRadius: '6px', fontWeight: '700' }}>
                  ₹0 Rent
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
                {freeLoansList.length} <span style={{ fontSize: '0.68rem', fontWeight: '500', color: '#94a3b8' }}>Units</span>
              </div>
              <div style={{ fontSize: '0.70rem', color: '#c084fc', marginTop: '2px' }}>
                Free Demo / Partner Loans
              </div>
            </div>

            {/* Expiry Alerts Card */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: '700', color: '#f87171' }}>RETURN DUE ALERTS</span>
                <span style={{ fontSize: '0.62rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '1px 6px', borderRadius: '6px', fontWeight: '700' }}>
                  Urgent
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
                {expiringCount} <span style={{ fontSize: '0.68rem', fontWeight: '500', color: '#94a3b8' }}>Due / Overdue</span>
              </div>
              <div style={{ fontSize: '0.70rem', color: '#cbd5e1', marginTop: '2px' }}>
                Requires return or renewal action
              </div>
            </div>
          </div>

          {/* Rental Hub Sub-Filters Bar */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '5px 8px',
            marginBottom: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', flex: '1 1 300px' }}>
              <div style={{ position: 'relative', minWidth: '180px', flex: '1' }}>
                <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search rental asset, party name, holder..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    height: '26px',
                    padding: '3px 8px 3px 26px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '5px',
                    color: '#e2e8f0',
                    fontSize: '0.68rem',
                    fontWeight: '400'
                  }}
                />
              </div>

              {/* Loan Direction Filter */}
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                style={{
                  height: '26px',
                  padding: '2px 6px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '5px',
                  color: '#cbd5e1',
                  fontSize: '0.68rem',
                  fontWeight: '400',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Loan Types</option>
                <option value="Rented Out">Rented Out (Lent to Party)</option>
                <option value="Rented In">Rented In (Leased from Vendor)</option>
                <option value="Free Loan In">Free Loan In</option>
                <option value="Free Loan Out">Free Loan Out</option>
              </select>

              {/* Rental Billing Frequency Filter */}
              <select
                value={selectedRentalModeFilter}
                onChange={(e) => setSelectedRentalModeFilter(e.target.value)}
                style={{
                  height: '26px',
                  padding: '2px 6px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '5px',
                  color: '#cbd5e1',
                  fontSize: '0.68rem',
                  fontWeight: '400',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Billing Frequencies</option>
                <option value="Daily">Daily Rent (Per Day)</option>
                <option value="Weekly">Weekly Rent (Per Week)</option>
                <option value="Monthly">Monthly Rent (Per Month)</option>
                <option value="Free">Free / Complimentary</option>
              </select>

              {/* Expiry Filter */}
              <select
                value={selectedExpiryFilter}
                onChange={(e) => setSelectedExpiryFilter(e.target.value)}
                style={{
                  height: '26px',
                  padding: '2px 6px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '5px',
                  color: '#cbd5e1',
                  fontSize: '0.68rem',
                  fontWeight: '400',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Return Due Statuses</option>
                <option value="EXPIRING_SOON">Due within 30 Days</option>
                <option value="EXPIRED">Return Overdue</option>
                <option value="ACTIVE">Active & Valid</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* DEDICATED TAB 2: OWNED INVENTORY DIRECTORY */}
      {activeTab === 'INVENTORY' && (
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '6px',
          padding: '5px 8px',
          marginBottom: '8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', minWidth: '200px', flex: '1' }}>
            <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search owned equipment name, code, station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: '26px',
                padding: '3px 8px 3px 26px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '5px',
                color: '#e2e8f0',
                fontSize: '0.68rem',
                fontWeight: '400'
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              height: '26px',
              padding: '2px 6px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '5px',
              color: '#cbd5e1',
              fontSize: '0.68rem',
              fontWeight: '400',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Categories</option>
            {CATEGORY_OPTIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            style={{
              height: '26px',
              padding: '2px 6px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '5px',
              color: '#cbd5e1',
              fontSize: '0.68rem',
              fontWeight: '400',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Operating Conditions</option>
            {CONDITION_OPTIONS.map(cond => (
              <option key={cond} value={cond}>{cond}</option>
            ))}
          </select>
        </div>
      )}

      {/* Asset Data Table or Cards Grid */}
      {filteredAssets.length === 0 ? (
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          padding: '28px 16px',
          textAlign: 'center'
        }}>
          <Package size={32} style={{ color: '#475569', marginBottom: '8px' }} />
          <h3 style={{ fontSize: '0.88rem', fontWeight: '600', color: '#cbd5e1', margin: 0 }}>
            {activeTab === 'RENTAL_HUB' ? 'No Rental / Loan Tracking Records Found' : 'No Salon Assets Found'}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.74rem', margin: '4px auto 12px', maxWidth: '400px' }}>
            {searchTerm ? 'No item matches your search filters.' : (activeTab === 'RENTAL_HUB' ? 'Click below to create a new asset rental, lease, or loan entry.' : 'Click below to register your first salon asset.')}
          </p>
          <button
            onClick={() => activeTab === 'RENTAL_HUB' ? openAddRentalModal() : openAddOwnedModal()}
            style={{
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '0.74rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {activeTab === 'RENTAL_HUB' ? '+ Add Rental Entry' : '+ Add Salon Asset'}
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ─── DATA TABLE VIEW (CLEAN & DENSE SAAS TABLE) ─── */
        <div style={{
          background: 'rgba(30, 41, 59, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.75)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '7px 10px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px' }}>
                    Asset Code
                  </th>
                  <th style={{ padding: '7px 10px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Asset Name & Category
                  </th>
                  <th style={{ padding: '7px 10px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Type & Condition
                  </th>
                  <th style={{ padding: '7px 10px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {activeTab === 'RENTAL_HUB' ? 'Rental / Billing Rate' : 'Valuation / Cost'}
                  </th>
                  <th style={{ padding: '7px 10px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {activeTab === 'RENTAL_HUB' ? 'Lease Due & Location' : 'Warranty & Location'}
                  </th>
                  <th style={{ padding: '7px 10px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAssets.map(asset => {
                  const condStyle = getConditionColor(asset.condition_status);
                  const branchObj = branches.find(b => String(b.id) === String(asset.branch_id));
                  const rentCalc = calculateTotalRent(asset);
                  const expInfo = getExpiryStatus(asset.return_due_date || asset.warranty_expiry);

                  return (
                    <tr
                      key={asset.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Col 1: Asset Code */}
                      <td style={{ padding: '6px 10px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: '0.70rem',
                          fontWeight: '800',
                          fontFamily: 'monospace',
                          color: '#6366f1',
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          display: 'inline-block'
                        }}>
                          {asset.asset_code}
                        </span>
                      </td>

                      {/* Col 2: Asset Name & Category */}
                      <td style={{ padding: '6px 10px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '0.76rem' }}>
                          {asset.asset_name}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#818cf8', marginTop: '1px' }}>
                          {asset.category}
                        </div>
                      </td>

                      {/* Col 2: Type & Condition */}
                      <td style={{ padding: '6px 10px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '700',
                            color: asset.asset_type === 'Rented Out' ? '#38bdf8' : (asset.asset_type === 'Rented In' ? '#f59e0b' : (asset.asset_type?.includes('Free') ? '#a855f7' : '#94a3b8')),
                            background: asset.asset_type === 'Rented Out' ? 'rgba(56, 189, 248, 0.12)' : (asset.asset_type === 'Rented In' ? 'rgba(245, 158, 11, 0.12)' : (asset.asset_type?.includes('Free') ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.05)')),
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            {asset.asset_type === 'Rented Out' ? 'Rented Out (Lent)' : (asset.asset_type === 'Rented In' ? 'Rented In (Leased)' : (asset.asset_type?.includes('Free') ? 'Free Loan' : 'Owned'))}
                          </span>

                          <span style={{
                            fontSize: '9px',
                            fontWeight: '700',
                            color: condStyle.color,
                            background: condStyle.bg,
                            border: `1px solid ${condStyle.border}`,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Wrench size={10} /> {asset.condition_status}
                          </span>
                        </div>
                      </td>

                      {/* Col 3: Rental / Billing Rate */}
                      <td style={{ padding: '6px 10px', verticalAlign: 'middle' }}>
                        {activeTab === 'RENTAL_HUB' ? (
                          rentCalc ? (
                            <div>
                              <strong style={{ color: '#38bdf8', fontSize: '0.72rem' }}>{rentCalc.rateLabel}</strong>
                              <div style={{ fontSize: '0.66rem', color: '#4ade80', marginTop: '1px' }}>
                                Est: ₹{rentCalc.total.toLocaleString()} ({rentCalc.units} {rentCalc.unitLabel})
                              </div>
                            </div>
                          ) : asset.rental_mode === 'Free' ? (
                            <span style={{ color: '#c084fc', fontSize: '0.70rem', fontWeight: '600' }}>
                              Complimentary (₹0)
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.70rem' }}>
                              {formatCurrency(asset.purchase_cost)}
                            </span>
                          )
                        ) : (
                          <div>
                            <strong style={{ color: '#4ade80', fontSize: '0.74rem' }}>{formatCurrency(asset.purchase_cost)}</strong>
                            {asset.issue_date && (
                              <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Pur: {asset.issue_date}</div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Col 4: Due Status & Location */}
                      <td style={{ padding: '6px 10px', verticalAlign: 'middle' }}>
                        <div>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '700',
                            color: expInfo.color,
                            background: expInfo.bg,
                            border: `1px solid ${expInfo.border}`,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <ShieldCheck size={10} /> {expInfo.label}
                          </span>
                          <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '2px' }}>
                            <strong>{branchObj ? branchObj.name : (asset.branch_name || '🌐 HQ')}</strong>
                            {asset.location_room ? ` • ${asset.location_room}` : ''}
                          </div>
                        </div>
                      </td>

                      {/* Col 5: Actions */}
                      <td style={{ padding: '6px 10px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          {/* Eye Details Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailAsset(asset)}
                            title="View Complete Asset Details"
                            style={{
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              color: '#38bdf8',
                              borderRadius: '4px',
                              height: '24px',
                              padding: '0 7px',
                              fontSize: '0.68rem',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={12} /> View
                          </button>

                          <button
                            type="button"
                            onClick={() => openTransferModal(asset)}
                            title="Reassign or Transfer Asset"
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              color: '#818cf8',
                              borderRadius: '4px',
                              height: '24px',
                              padding: '0 6px',
                              fontSize: '0.68rem',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            <ArrowRightLeft size={11} /> Transfer
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(asset)}
                            title="Edit Asset Details"
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#cbd5e1',
                              borderRadius: '4px',
                              height: '24px',
                              padding: '0 6px',
                              fontSize: '0.68rem',
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit2 size={11} /> Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(asset)}
                            title="Delete Asset"
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#f87171',
                              borderRadius: '4px',
                              height: '24px',
                              padding: '0 6px',
                              fontSize: '0.68rem',
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── CARDS GRID VIEW ─── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: isAllExpanded ? '10px' : '6px',
          alignItems: 'start'
        }}>
          {paginatedAssets.map(asset => {
            const condStyle = getConditionColor(asset.condition_status);
            const branchObj = branches.find(b => String(b.id) === String(asset.branch_id));
            const isExpanded = expandedCardIds[asset.id] === true;
            const rentCalc = calculateTotalRent(asset);

            return (
              <div
                key={asset.id}
                style={{
                  background: isExpanded ? 'rgba(30, 41, 59, 0.75)' : 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(12px)',
                  border: isExpanded ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: isExpanded ? '10px' : '6px',
                  padding: isExpanded ? '10px 12px' : '6px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isExpanded ? '0 4px 14px rgba(0, 0, 0, 0.25)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  alignSelf: 'start',
                  height: 'fit-content'
                }}
              >
                {!isExpanded ? (
                  /* --- MINIMIZED (COLLAPSED) CARD STRIP --- */
                  <div
                    onClick={() => toggleExpandCard(asset.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      gap: '8px',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        fontFamily: 'monospace',
                        color: '#6366f1',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        flexShrink: 0
                      }}>
                        {asset.asset_code}
                      </span>

                      <h4 style={{
                        fontSize: '0.76rem',
                        fontWeight: '600',
                        color: '#ffffff',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {asset.asset_name}
                      </h4>

                      <span style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        color: asset.asset_type === 'Rented Out' ? '#38bdf8' : (asset.asset_type === 'Rented In' ? '#f59e0b' : (asset.asset_type?.includes('Free') ? '#a855f7' : '#94a3b8')),
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        flexShrink: 0
                      }}>
                        {asset.asset_type === 'Rented Out' ? 'Rented Out' : (asset.asset_type === 'Rented In' ? 'Leased In' : (asset.asset_type?.includes('Free') ? 'Free' : 'Owned'))}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {rentCalc ? (
                        <span style={{ fontSize: '0.70rem', fontWeight: '700', color: '#38bdf8' }}>
                          {rentCalc.rateLabel}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: '700',
                          color: condStyle.color,
                          background: condStyle.bg,
                          border: `1px solid ${condStyle.border}`,
                          padding: '1px 6px',
                          borderRadius: '6px'
                        }}>
                          {asset.condition_status}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandCard(asset.id);
                        }}
                        title="Expand Card"
                        style={{
                          background: 'rgba(99, 102, 241, 0.2)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          color: '#818cf8',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: '0.68rem',
                          fontWeight: '600'
                        }}
                      >
                        Expand <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* --- EXPANDED CARD VIEW --- */
                  <>
                    <div>
                      {/* Top Bar: Code Tag, Ownership Type & Condition + Expand Toggle Button */}
                      <div
                        onClick={() => toggleExpandCard(asset.id)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                          flexWrap: 'wrap',
                          gap: '6px',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            fontFamily: 'monospace',
                            color: '#6366f1',
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Tag size={12} /> {asset.asset_code}
                          </span>

                          {/* Ownership Type Badge */}
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: asset.asset_type === 'Rented Out' ? '#38bdf8' : (asset.asset_type === 'Rented In' ? '#f59e0b' : (asset.asset_type?.includes('Free') ? '#a855f7' : '#cbd5e1')),
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            {asset.asset_type === 'Rented Out' && 'Rented Out (Lent)'}
                            {asset.asset_type === 'Rented In' && 'Rented In (Leased)'}
                            {asset.asset_type === 'Free Loan In' && 'Free Loan In'}
                            {asset.asset_type === 'Free Loan Out' && 'Free Loan Out'}
                            {(!asset.asset_type || asset.asset_type === 'Owned') && 'Owned Equipment'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: condStyle.color,
                            background: condStyle.bg,
                            border: `1px solid ${condStyle.border}`,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Wrench size={11} /> {asset.condition_status}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandCard(asset.id);
                            }}
                            title="Minimize Card"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                          >
                            Minimize <ChevronUp size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Asset Title & Category */}
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>
                        {asset.asset_name}
                      </h3>

                      <div style={{ fontSize: '12px', color: '#818cf8', fontWeight: '600', marginBottom: '12px' }}>
                        {asset.category}
                      </div>

                      {/* Expiry & Due Return Badge Alert */}
                      {(() => {
                        const expInfo = getExpiryStatus(asset.return_due_date || asset.warranty_expiry);
                        return (
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: expInfo.color,
                            background: expInfo.bg,
                            border: `1px solid ${expInfo.border}`,
                            borderRadius: '8px',
                            padding: '6px 10px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <ShieldCheck size={13} /> {asset.return_due_date ? 'Lease / Return Due:' : 'Warranty Exp:'}
                            </span>
                            <span>{expInfo.label}</span>
                          </div>
                        );
                      })()}

                      {/* Dynamic Rental Rate & Calculated Amount (Day / Week / Month) */}
                      {(() => {
                        if (!rentCalc && asset.rental_mode === 'Free') {
                          return (
                            <div style={{
                              background: 'rgba(168, 85, 247, 0.12)',
                              border: '1px solid rgba(168, 85, 247, 0.25)',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              color: '#c084fc',
                              fontWeight: '600',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              Complimentary / Free Loan (₹0 Rent)
                            </div>
                          );
                        }
                        if (rentCalc) {
                          return (
                            <div style={{
                              background: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              color: '#38bdf8',
                              marginBottom: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div>
                                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Billing Rate: </span>
                                <strong>{rentCalc.rateLabel}</strong>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Est. Total ({rentCalc.units} {rentCalc.unitLabel}): </span>
                                <strong style={{ color: '#4ade80', fontSize: '13px' }}>₹{rentCalc.total.toLocaleString()}</strong>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Tracking Assignment Details */}
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '12px'
                      }}>
                        {/* Branch Assignment */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                          <Building2 size={14} style={{ color: '#6366f1' }} />
                          <span>
                            <strong style={{ color: '#94a3b8' }}>Branch Location: </strong>
                            {branchObj ? branchObj.name : (asset.branch_name || '🌐 Unassigned (Headquarters)')}
                          </span>
                        </div>

                        {/* Admin / Person Assignment */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                          <User size={14} style={{ color: '#38bdf8' }} />
                          <span>
                            <strong style={{ color: '#94a3b8' }}>Assigned Holder / Admin: </strong>
                            {asset.assigned_person_name || asset.assigned_admin_name || 'Unassigned'}
                          </span>
                        </div>

                        {/* External Vendor / Supplier / Party Name */}
                        {asset.vendor_party_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                            <ArrowRightLeft size={14} style={{ color: '#a855f7' }} />
                            <span>
                              <strong style={{ color: '#94a3b8' }}>Vendor / Client Party: </strong>
                              {asset.vendor_party_name}
                            </span>
                          </div>
                        )}

                        {/* Room / Location */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                          <MapPin size={14} style={{ color: '#f59e0b' }} />
                          <span>
                            <strong style={{ color: '#94a3b8' }}>Location / Room: </strong>
                            {asset.location_room || 'Main Floor'}
                          </span>
                        </div>
                      </div>

                      {/* Purchase & Dates Meta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                        <div>
                          <span>Cost / Valuation: </span>
                          <strong style={{ color: '#4ade80' }}>{formatCurrency(asset.purchase_cost)}</strong>
                        </div>
                        {asset.issue_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} style={{ color: '#38bdf8' }} />
                            <span>Issued: {asset.issue_date}</span>
                          </div>
                        )}
                      </div>

                      {asset.notes && (
                        <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginBottom: '12px' }}>
                          "{asset.notes}"
                        </div>
                      )}
                    </div>

                    {/* Footer Action Buttons */}
                    <div style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '6px'
                    }}>
                      <button
                        onClick={() => openTransferModal(asset)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#818cf8',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <ArrowRightLeft size={12} /> Transfer
                      </button>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(asset)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#cbd5e1',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(asset)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#f87171',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── PAGINATION BAR ─── */}
      {filteredAssets.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '10px',
          padding: '5px 10px',
          background: 'rgba(30, 41, 59, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px'
        }}>
          {/* Left: Rows per page selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#94a3b8' }}>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '4px',
                height: '24px',
                padding: '1px 6px',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: '700',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={50}>50</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Middle: Showing Range Info */}
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: '500' }}>
            Showing <strong style={{ color: '#ffffff' }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> – <strong style={{ color: '#ffffff' }}>{endIndex}</strong> of <strong style={{ color: '#38bdf8' }}>{totalItems}</strong> assets
          </div>

          {/* Right: Page Navigation Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              disabled={isAll || safePage <= 1}
              onClick={() => setCurrentPage(1)}
              style={{
                height: '24px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: (isAll || safePage <= 1) ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.08)',
                color: (isAll || safePage <= 1) ? '#64748b' : '#cbd5e1',
                cursor: (isAll || safePage <= 1) ? 'not-allowed' : 'pointer',
                fontSize: '0.70rem',
                fontWeight: '600',
                opacity: (isAll || safePage <= 1) ? 0.4 : 1
              }}
              title="First Page"
            >
              « First
            </button>

            <button
              disabled={isAll || safePage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              style={{
                height: '24px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: (isAll || safePage <= 1) ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(99, 102, 241, 0.4)',
                background: (isAll || safePage <= 1) ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.2)',
                color: (isAll || safePage <= 1) ? '#64748b' : '#818cf8',
                cursor: (isAll || safePage <= 1) ? 'not-allowed' : 'pointer',
                fontSize: '0.70rem',
                fontWeight: '700',
                opacity: (isAll || safePage <= 1) ? 0.4 : 1
              }}
            >
              ‹ Prev
            </button>

            {!isAll && Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  height: '24px',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  border: pageNum === safePage ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: pageNum === safePage ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.70rem',
                  cursor: 'pointer'
                }}
              >
                {pageNum}
              </button>
            ))}

            <button
              disabled={isAll || safePage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              style={{
                height: '24px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: (isAll || safePage >= totalPages) ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(99, 102, 241, 0.4)',
                background: (isAll || safePage >= totalPages) ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.2)',
                color: (isAll || safePage >= totalPages) ? '#64748b' : '#818cf8',
                cursor: (isAll || safePage >= totalPages) ? 'not-allowed' : 'pointer',
                fontSize: '0.70rem',
                fontWeight: '700',
                opacity: (isAll || safePage >= totalPages) ? 0.4 : 1
              }}
            >
              Next ›
            </button>

            <button
              disabled={isAll || safePage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              style={{
                height: '24px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: (isAll || safePage >= totalPages) ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.08)',
                color: (isAll || safePage >= totalPages) ? '#64748b' : '#cbd5e1',
                cursor: (isAll || safePage >= totalPages) ? 'not-allowed' : 'pointer',
                fontSize: '0.70rem',
                fontWeight: '600',
                opacity: (isAll || safePage >= totalPages) ? 0.4 : 1
              }}
              title="Last Page"
            >
              Last »
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 0: ASSET COMPLETE DETAILS MODAL (Eye Icon Trigger) */}
      {/* ========================================================= */}
      {selectedDetailAsset && (() => {
        const condStyle = getConditionColor(selectedDetailAsset.condition_status);
        const branchObj = branches.find(b => String(b.id) === String(selectedDetailAsset.branch_id));
        const rentCalc = calculateTotalRent(selectedDetailAsset);
        const expInfo = getExpiryStatus(selectedDetailAsset.return_due_date || selectedDetailAsset.warranty_expiry);

        return (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px'
          }}>
            <div style={{
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '620px',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.75)',
              overflow: 'hidden',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Modal Top Header */}
              <div style={{
                padding: '12px 18px',
                background: 'rgba(30, 41, 59, 0.75)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: '800',
                      fontSize: '0.68rem',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#818cf8',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}>
                      {selectedDetailAsset.asset_code}
                    </span>
                    <span style={{
                      fontSize: '0.66rem',
                      fontWeight: '700',
                      color: selectedDetailAsset.asset_type === 'Rented Out' ? '#38bdf8' : (selectedDetailAsset.asset_type === 'Rented In' ? '#f59e0b' : (selectedDetailAsset.asset_type?.includes('Free') ? '#a855f7' : '#94a3b8')),
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}>
                      {selectedDetailAsset.asset_type === 'Rented Out' ? 'Rented Out (Lent)' : (selectedDetailAsset.asset_type === 'Rented In' ? 'Rented In (Leased)' : (selectedDetailAsset.asset_type?.includes('Free') ? 'Free Loan' : 'Owned Equipment'))}
                    </span>
                    <span style={{
                      fontSize: '0.66rem',
                      fontWeight: '700',
                      color: condStyle.color,
                      background: condStyle.bg,
                      border: `1px solid ${condStyle.border}`,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <Wrench size={10} /> {selectedDetailAsset.condition_status}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff', margin: '0 0 2px 0' }}>
                    {selectedDetailAsset.asset_name}
                  </h2>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Category: <strong style={{ color: '#cbd5e1' }}>{selectedDetailAsset.category}</strong>
                    {selectedDetailAsset.location_room && ` • Location: ${selectedDetailAsset.location_room}`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDetailAsset(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#94a3b8',
                    borderRadius: '6px',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Close Details"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Modal Body Content */}
              <div style={{ padding: '14px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* 1. Rental & Financial Summary */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '0.70rem', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <DollarSign size={13} /> Rental & Financial Terms
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Billing Mode / Frequency</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '600', color: '#ffffff' }}>
                        {selectedDetailAsset.rental_mode || (selectedDetailAsset.asset_type?.includes('Free') ? 'Free / Complimentary' : 'Standard')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Rate</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '700', color: rentCalc ? '#38bdf8' : (selectedDetailAsset.rental_mode === 'Free' ? '#c084fc' : '#4ade80') }}>
                        {rentCalc ? rentCalc.rateLabel : (selectedDetailAsset.rental_mode === 'Free' ? '₹0 (Complimentary)' : formatCurrency(selectedDetailAsset.purchase_cost))}
                      </div>
                    </div>
                    {rentCalc && (
                      <div>
                        <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Est. Total ({rentCalc.units} {rentCalc.unitLabel})</div>
                        <div style={{ fontSize: '0.76rem', fontWeight: '700', color: '#4ade80' }}>
                          ₹{rentCalc.total.toLocaleString()}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Purchase / Valuation Cost</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '600', color: '#ffffff' }}>
                        {formatCurrency(selectedDetailAsset.purchase_cost)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Timeline & Due Status */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '0.70rem', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} /> Return & Warranty Deadlines
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Issue / Start Date</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '600', color: '#ffffff' }}>
                        {selectedDetailAsset.issue_date || selectedDetailAsset.purchase_date || 'Not Recorded'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Lease / Return Due Date</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '600', color: '#ffffff' }}>
                        {selectedDetailAsset.return_due_date || 'None (Open-ended)'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Due Status Alert</div>
                      <span style={{
                        color: expInfo.color,
                        background: expInfo.bg,
                        border: `1px solid ${expInfo.border}`,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '0.68rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        marginTop: '2px'
                      }}>
                        <ShieldCheck size={10} /> {expInfo.label}
                      </span>
                    </div>
                    {selectedDetailAsset.warranty_expiry && (
                      <div>
                        <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Warranty Expiry</div>
                        <div style={{ fontSize: '0.76rem', fontWeight: '600', color: '#ffffff' }}>
                          {selectedDetailAsset.warranty_expiry}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Location, Staff & Party Assignment */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '0.70rem', fontWeight: '700', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Building2 size={13} /> Location & Custody Assignment
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Salon Branch</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '600', color: '#ffffff' }}>
                        {branchObj ? branchObj.name : (selectedDetailAsset.branch_name || '🌐 Unassigned (Headquarters)')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Room / Station</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '600', color: '#ffffff' }}>
                        {selectedDetailAsset.location_room || 'Main Salon Floor'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Assigned Staff / Admin</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '600', color: '#38bdf8' }}>
                        {selectedDetailAsset.assigned_person_name || selectedDetailAsset.assigned_admin_name || 'Unassigned'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Vendor / Client Party</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '600', color: selectedDetailAsset.vendor_party_name ? '#c084fc' : '#94a3b8' }}>
                        {selectedDetailAsset.vendor_party_name || 'None (Internal Custody)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Notes & Remarks */}
                {selectedDetailAsset.notes && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}>
                    <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginBottom: '2px' }}>Notes & Remarks:</div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                      "{selectedDetailAsset.notes}"
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '8px 18px',
                background: 'rgba(30, 41, 59, 0.75)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={() => setSelectedDetailAsset(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '6px',
                    height: '26px',
                    padding: '0 12px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>

                <div style={{ display: 'inline-flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedDetailAsset;
                      setSelectedDetailAsset(null);
                      openTransferModal(cur);
                    }}
                    style={{
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#818cf8',
                      borderRadius: '6px',
                      height: '26px',
                      padding: '0 10px',
                      fontSize: '0.70rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowRightLeft size={11} /> Transfer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedDetailAsset;
                      setSelectedDetailAsset(null);
                      openEditModal(cur);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '6px',
                      height: '26px',
                      padding: '0 12px',
                      fontSize: '0.70rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={11} /> Edit Asset
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT OWNED SALON ASSET (Simple & Clean)   */}
      {/* ========================================================= */}
      {showAddModal && modalMode === 'OWNED' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} style={{ color: '#6366f1' }} />
                {editingAsset ? 'Edit Owned Salon Asset' : 'Add New Owned Salon Asset'}
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px', overflowY: 'auto' }}>
              {errorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Name & Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Asset / Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dyson Supersonic Hair Dryer"
                    value={formData.asset_name}
                    onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Asset Tag / Serial Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AST-58492"
                    value={formData.asset_code}
                    onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Category & Operating Condition */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Operating Status
                  </label>
                  <select
                    value={formData.condition_status}
                    onChange={(e) => setFormData({ ...formData, condition_status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  >
                    {CONDITION_OPTIONS.map(cond => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Branch & Admin Holder */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Salon Branch Location
                  </label>
                  <select
                    value={formData.branch_id || 'ALL'}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value === 'ALL' ? '' : e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  >
                    <option value="ALL">🌐 Unassigned / Main Office</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Assigned Admin / Holder
                  </label>
                  <select
                    value={formData.assigned_to_admin_id || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedUser = adminUsersList.find(u => String(u.id) === String(selectedId));
                      setFormData({
                        ...formData,
                        assigned_to_admin_id: selectedId,
                        assigned_person_name: selectedUser ? selectedUser.name : formData.assigned_person_name
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">👤 Select Admin / Holder...</option>
                    {adminUsersList.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role || 'Admin/Staff'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Purchase Cost & Room Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Purchase Cost / Valuation (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 35000"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Room / Station Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Styling Station 1"
                    value={formData.location_room}
                    onChange={(e) => setFormData({ ...formData, location_room: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Warranty Date & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Warranty Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.warranty_expiry}
                    onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Heavy duty hydraulic model"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? 'Saving...' : (editingAsset ? 'Update Asset' : 'Save Salon Asset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT ASSET RENTAL & LOAN TRANSACTION (Dedicated Rental Form) */}
      {/* ========================================================================= */}
      {showAddModal && modalMode === 'RENTAL' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(56, 189, 248, 0.2)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(56, 189, 248, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={18} />
                {editingAsset ? 'Edit Asset Rental / Loan Entry' : 'New Asset Rental & Loan Entry'}
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px', overflowY: 'auto' }}>
              {errorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Loan Type & Rental Commercial Terms */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#38bdf8', marginBottom: '6px' }}>
                    Ownership / Loan Direction *
                  </label>
                  <select
                    value={formData.asset_type || 'Rented Out'}
                    onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    <option value="Rented Out">📤 Rented Out (Lent to Client/Party)</option>
                    <option value="Rented In">📥 Rented In (Leased from Vendor)</option>
                    <option value="Free Loan In">🎁 Free Loan In (Demo Unit)</option>
                    <option value="Free Loan Out">🤝 Free Loan Out (Partner Unit)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#38bdf8', marginBottom: '6px' }}>
                    Rental Billing Terms *
                  </label>
                  <select
                    value={formData.rental_mode || 'Daily Rent'}
                    onChange={(e) => setFormData({ ...formData, rental_mode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    <option value="Daily Rent">📅 Daily Rent (Per Day Rate)</option>
                    <option value="Weekly Rent">🗓️ Weekly Rent (Per Week Rate)</option>
                    <option value="Monthly Rent">📆 Monthly Rent (Per Month Rate)</option>
                    <option value="Free">🎁 Free / Complimentary (₹0)</option>
                  </select>
                </div>
              </div>

              {/* Select Existing Salon Asset Dropdown */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#38bdf8', marginBottom: '6px' }}>
                  📦 Select Salon Asset from Inventory (Or Custom Entry) *
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedAssetId(id);
                    if (id !== 'CUSTOM') {
                      const found = assets.find(a => String(a.id) === String(id));
                      if (found) {
                        setFormData(prev => ({
                          ...prev,
                          asset_name: found.asset_name,
                          asset_code: found.asset_code,
                          category: found.category || prev.category,
                          branch_id: found.branch_id || prev.branch_id,
                          assigned_to_admin_id: found.assigned_to_admin_id || prev.assigned_to_admin_id,
                          assigned_person_name: found.assigned_person_name || prev.assigned_person_name,
                          purchase_cost: found.purchase_cost || prev.purchase_cost
                        }));
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <option value="CUSTOM">➕ Type Custom / External Asset Name...</option>
                  {assets.filter(a => !a.asset_type || a.asset_type === 'Owned').map(a => (
                    <option key={a.id} value={a.id}>
                      📦 {a.asset_name} ({a.asset_code}) - {a.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asset Name & Tag Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Asset / Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ring Light & Vlog Rig"
                    value={formData.asset_name}
                    onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Serial / Rental Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RNT-94021"
                    value={formData.asset_code}
                    onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* External Vendor / Supplier / Client Party Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#a855f7', marginBottom: '6px' }}>
                  External Vendor / Client / Party Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Glamour Events Media / MediEquip Suppliers Pvt Ltd"
                  value={formData.vendor_party_name}
                  onChange={(e) => setFormData({ ...formData, vendor_party_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Rate Amount (If not Free) */}
              {formData.rental_mode !== 'Free' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4ade80', marginBottom: '6px' }}>
                    Rental Rate Amount (₹ rate for {formData.rental_mode || 'Daily'}) *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 150 (Day), 1000 (Week), 5000 (Month)"
                    value={formData.daily_rent_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rent_rate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(74, 222, 128, 0.3)',
                      borderRadius: '8px',
                      color: '#4ade80',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}

              {/* Dates: Issue Date & Return Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Issue / Loan Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#f59e0b', marginBottom: '6px' }}>
                    Return / Renewal Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.return_due_date}
                    onChange={(e) => setFormData({ ...formData, return_due_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '8px',
                      color: '#f59e0b',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              {/* Branch & Holder */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Branch Location
                  </label>
                  <select
                    value={formData.branch_id || 'ALL'}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value === 'ALL' ? '' : e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px'
                    }}
                  >
                    <option value="ALL">🌐 Headquarters / Main Office</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Internal Admin / Holder
                  </label>
                  <select
                    value={formData.assigned_to_admin_id || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedUser = adminUsersList.find(u => String(u.id) === String(selectedId));
                      setFormData({
                        ...formData,
                        assigned_to_admin_id: selectedId,
                        assigned_person_name: selectedUser ? selectedUser.name : formData.assigned_person_name
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px'
                    }}
                  >
                    <option value="">👤 Select Admin Holder...</option>
                    {adminUsersList.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role || 'Admin/Staff'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                  Rental Agreement Notes / Usage Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lent on daily rent for IPL shoot."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#38bdf8',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {isSubmitting ? 'Saving...' : (editingAsset ? 'Update Rental Entry' : 'Save Rental Entry')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Asset Modal */}
      {showTransferModal && transferAssetItem && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={18} style={{ color: '#818cf8' }} />
                Reassign / Transfer Asset
              </h2>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} style={{ padding: '20px' }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selected Asset</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                  {transferAssetItem.asset_name}
                </div>
                <div style={{ fontSize: '12px', color: '#818cf8', fontWeight: '600', marginTop: '2px' }}>
                  {transferAssetItem.asset_code}
                </div>
              </div>

              {/* Target Branch */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                  Transfer to Branch Location
                </label>
                <select
                  value={transferData.branch_id}
                  onChange={(e) => setTransferData({ ...transferData, branch_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                >
                  <option value="">🌐 Headquarters / Main Office</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Target Admin / Holder */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                  Reassign to Admin / Holder
                </label>
                <select
                  value={transferData.assigned_to_admin_id || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedUser = adminUsersList.find(u => String(u.id) === String(selectedId));
                    setTransferData({
                      ...transferData,
                      assigned_to_admin_id: selectedId,
                      assigned_person_name: selectedUser ? selectedUser.name : transferData.assigned_person_name
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                >
                  <option value="">👤 Unassigned</option>
                  {adminUsersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role || 'Admin/Staff'})</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Or type custom person name..."
                  value={transferData.assigned_person_name}
                  onChange={(e) => setTransferData({ ...transferData, assigned_person_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    fontSize: '12px'
                  }}
                />
              </div>

              {/* Target Room */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                  New Room / Station Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Station 3 / VIP Room"
                  value={transferData.location_room}
                  onChange={(e) => setTransferData({ ...transferData, location_room: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#818cf8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Themed Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0' }}>
              Confirm Delete Record?
            </h3>

            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete <strong style={{ color: '#ffffff' }}>"{deleteConfirmId.asset_name}"</strong> (<span style={{ color: '#818cf8' }}>{deleteConfirmId.asset_code}</span>)?
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#cbd5e1',
              textAlign: 'left',
              marginBottom: '20px'
            }}>
              <div>📍 <strong>Branch:</strong> {deleteConfirmId.branch_name || 'Main Office'}</div>
              <div>👤 <strong>Holder/Party:</strong> {deleteConfirmId.vendor_party_name || deleteConfirmId.assigned_person_name || 'Unassigned'}</div>
              <div>💰 <strong>Valuation/Rate:</strong> {formatCurrency(deleteConfirmId.purchase_cost || deleteConfirmId.daily_rent_rate)}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId.id)}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsTrackingManagementView;

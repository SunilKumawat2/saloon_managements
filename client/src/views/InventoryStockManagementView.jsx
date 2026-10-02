import React, { useState } from 'react';
import {
  Package, AlertTriangle, Truck, ShoppingCart, Activity, Plus, Minus, Search, Filter,
  Edit3, Trash2, CheckCircle2, RefreshCw, ChevronRight, X, ArrowUpRight, ArrowDownRight,
  TrendingUp, Tag, ShieldAlert, Sparkles, Building, Phone, Mail, FileText, Check, Loader2
} from 'lucide-react';

function InventoryStockManagementView({
  products = [],
  suppliers = [],
  purchaseOrders = [],
  consumptions = [],
  services = [],
  onAddProduct,
  onUpdateProduct,
  onAdjustStock,
  onDeleteProduct,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onCreatePO,
  onUpdatePOStatus,
  onAddConsumption,
  onUpdateConsumption,
  onDeleteConsumption,
  selectedBranchId = 'all'
}) {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'low_stock', 'suppliers', 'pos', 'consumption'

  // ─── Products State ───
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isAddProductModal, setIsAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState(null);
  const [stockChangeVal, setStockChangeVal] = useState('');
  const [stockAdjustReason, setStockAdjustReason] = useState('Manual Adjustment');
  const [stockAdjustNotes, setStockAdjustNotes] = useState('');

  const [prodFormData, setProdFormData] = useState({
    sku: '',
    name: '',
    category: 'Hair Care',
    type: 'Both',
    unit: 'pcs',
    quantity: 10,
    min_threshold: 5,
    cost_price: 100,
    retail_price: 150,
    supplier_id: '',
    description: ''
  });

  // ─── Suppliers State ───
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isAddSupplierModal, setIsAddSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    company_name: '',
    phone: '',
    email: '',
    gstin: '',
    address: ''
  });

  // ─── Purchase Orders State ───
  const [isCreatePOModal, setIsCreatePOModal] = useState(false);
  const [selectedPOSupplierId, setSelectedPOSupplierId] = useState('');
  const [poNotes, setPONotes] = useState('');
  const [poCartItems, setPOCartItems] = useState([]); // { product_id, unit_cost, quantity }
  const [selectedPOProduct, setSelectedPOProduct] = useState('');
  const [poItemCost, setPOItemCost] = useState('');
  const [poItemQty, setPOItemQty] = useState(1);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState(null);

  // ─── Consumption Mapping State ───
  const [isAddConsumptionModal, setIsAddConsumptionModal] = useState(false);
  const [editingConsumption, setEditingConsumption] = useState(null);
  const [consumptionFormData, setConsumptionFormData] = useState({
    service_id: '',
    product_id: '',
    quantity_consumed: 10,
    unit: 'ml',
    notes: ''
  });

  // ─── Low Stock Items ───
  const lowStockProducts = products.filter(p => parseInt(p.quantity || 0) <= parseInt(p.min_threshold || 10));

  // ─── Products Pagination State ───
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Filtered Products ───
  const allFilteredProducts = products.filter(p => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesType = typeFilter === 'All' || p.type === typeFilter;
    const searchLower = productSearch.toLowerCase();
    const matchesSearch = !productSearch.trim() ||
      String(p.name ?? '').toLowerCase().includes(searchLower) ||
      String(p.sku ?? '').toLowerCase().includes(searchLower) ||
      String(p.category ?? '').toLowerCase().includes(searchLower) ||
      String(p.supplier_name ?? '').toLowerCase().includes(searchLower);
    return matchesCat && matchesType && matchesSearch;
  });

  const isAll = pageSize === 'all';
  const totalItems = allFilteredProducts.length;
  const totalPages = isAll ? 1 : Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = isAll ? 0 : (safePage - 1) * pageSize;
  const endIndex = isAll ? totalItems : Math.min(startIndex + (pageSize === 'all' ? totalItems : Number(pageSize)), totalItems);

  const paginatedProducts = isAll ? allFilteredProducts : allFilteredProducts.slice(startIndex, endIndex);

  // ─── Filtered Suppliers ───
  const filteredSuppliers = suppliers.filter(s => {
    const searchLower = supplierSearch.toLowerCase();
    return !supplierSearch.trim() ||
      String(s.name ?? '').toLowerCase().includes(searchLower) ||
      (s.company_name && String(s.company_name).toLowerCase().includes(searchLower)) ||
      String(s.phone ?? '').includes(supplierSearch);
  });

  // ─── Low Stock Pagination State ───
  const [lowStockPageSize, setLowStockPageSize] = useState(10);
  const [lowStockCurrentPage, setLowStockCurrentPage] = useState(1);

  const isLowStockAll = lowStockPageSize === 'all';
  const totalLowStock = lowStockProducts.length;
  const totalLowStockPages = isLowStockAll ? 1 : Math.ceil(totalLowStock / lowStockPageSize) || 1;
  const safeLowStockPage = Math.min(Math.max(1, lowStockCurrentPage), totalLowStockPages);
  const lowStockStartIndex = isLowStockAll ? 0 : (safeLowStockPage - 1) * lowStockPageSize;
  const lowStockEndIndex = isLowStockAll ? totalLowStock : Math.min(lowStockStartIndex + (lowStockPageSize === 'all' ? totalLowStock : Number(lowStockPageSize)), totalLowStock);
  const paginatedLowStock = isLowStockAll ? lowStockProducts : lowStockProducts.slice(lowStockStartIndex, lowStockEndIndex);

  // ─── Suppliers Pagination State ───
  const [supplierPageSize, setSupplierPageSize] = useState(10);
  const [supplierCurrentPage, setSupplierCurrentPage] = useState(1);

  const isSupplierAll = supplierPageSize === 'all';
  const totalSuppliers = filteredSuppliers.length;
  const totalSupplierPages = isSupplierAll ? 1 : Math.ceil(totalSuppliers / supplierPageSize) || 1;
  const safeSupplierPage = Math.min(Math.max(1, supplierCurrentPage), totalSupplierPages);
  const supplierStartIndex = isSupplierAll ? 0 : (safeSupplierPage - 1) * supplierPageSize;
  const supplierEndIndex = isSupplierAll ? totalSuppliers : Math.min(supplierStartIndex + (supplierPageSize === 'all' ? totalSuppliers : Number(supplierPageSize)), totalSuppliers);
  const paginatedSuppliers = isSupplierAll ? filteredSuppliers : filteredSuppliers.slice(supplierStartIndex, supplierEndIndex);

  // ─── Purchase Orders Pagination State ───
  const [poPageSize, setPOPageSize] = useState(10);
  const [poCurrentPage, setPOCurrentPage] = useState(1);

  const isPOAll = poPageSize === 'all';
  const totalPOs = purchaseOrders.length;
  const totalPOPages = isPOAll ? 1 : Math.ceil(totalPOs / poPageSize) || 1;
  const safePOPage = Math.min(Math.max(1, poCurrentPage), totalPOPages);
  const poStartIndex = isPOAll ? 0 : (safePOPage - 1) * poPageSize;
  const poEndIndex = isPOAll ? totalPOs : Math.min(poStartIndex + (poPageSize === 'all' ? totalPOs : Number(poPageSize)), totalPOs);
  const paginatedPOs = isPOAll ? purchaseOrders : purchaseOrders.slice(poStartIndex, poEndIndex);

  // ─── Consumption Pagination State ───
  const [consumptionPageSize, setConsumptionPageSize] = useState(10);
  const [consumptionCurrentPage, setConsumptionCurrentPage] = useState(1);

  const isConsumptionAll = consumptionPageSize === 'all';
  const totalConsumptions = consumptions.length;
  const totalConsumptionPages = isConsumptionAll ? 1 : Math.ceil(totalConsumptions / consumptionPageSize) || 1;
  const safeConsumptionPage = Math.min(Math.max(1, consumptionCurrentPage), totalConsumptionPages);
  const consumptionStartIndex = isConsumptionAll ? 0 : (safeConsumptionPage - 1) * consumptionPageSize;
  const consumptionEndIndex = isConsumptionAll ? totalConsumptions : Math.min(consumptionStartIndex + (consumptionPageSize === 'all' ? totalConsumptions : Number(consumptionPageSize)), totalConsumptions);
  const paginatedConsumptions = isConsumptionAll ? consumptions : consumptions.slice(consumptionStartIndex, consumptionEndIndex);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Handlers: Product ───
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!prodFormData.name || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, prodFormData);
      } else {
        await onAddProduct(prodFormData);
      }
      setIsAddProductModal(false);
      setEditingProduct(null);
      resetProdForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockAdjustProduct || !stockChangeVal) return;
    await onAdjustStock(stockAdjustProduct.id, parseInt(stockChangeVal), stockAdjustReason, stockAdjustNotes);
    setStockAdjustProduct(null);
    setStockChangeVal('');
    setStockAdjustNotes('');
  };

  const resetProdForm = () => {
    setProdFormData({
      sku: '', name: '', category: 'Hair Care', type: 'Both', unit: 'pcs',
      quantity: 10, min_threshold: 5, cost_price: 100, retail_price: 150,
      supplier_id: '', description: ''
    });
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setProdFormData({
      sku: p.sku || '', name: p.name || '', category: p.category || 'Hair Care',
      type: p.type || 'Both', unit: p.unit || 'pcs', quantity: p.quantity || 0,
      min_threshold: p.min_threshold || 5, cost_price: p.cost_price || 0,
      retail_price: p.retail_price || 0, supplier_id: p.supplier_id || '', description: p.description || ''
    });
    setIsAddProductModal(true);
  };

  // ─── Handlers: Supplier ───
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!supplierFormData.name || !supplierFormData.phone) return;
    if (editingSupplier) {
      await onUpdateSupplier(editingSupplier.id, supplierFormData);
    } else {
      await onAddSupplier(supplierFormData);
    }
    setIsAddSupplierModal(false);
    setEditingSupplier(null);
    setSupplierFormData({ name: '', company_name: '', phone: '', email: '', gstin: '', address: '' });
  };

  // ─── Handlers: PO ───
  const addPOItemToCart = () => {
    if (!selectedPOProduct || !poItemCost || poItemQty < 1) return;
    const prod = products.find(p => String(p.id) === String(selectedPOProduct));
    if (!prod) return;

    setPOCartItems(prev => {
      const exists = prev.find(i => String(i.product_id) === String(selectedPOProduct));
      if (exists) {
        return prev.map(i => String(i.product_id) === String(selectedPOProduct) ? { ...i, quantity: i.quantity + parseInt(poItemQty) } : i);
      }
      return [...prev, {
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        unit_cost: parseFloat(poItemCost),
        quantity: parseInt(poItemQty)
      }];
    });
    setSelectedPOProduct('');
    setPOItemCost('');
    setPOItemQty(1);
  };

  const removePOItemFromCart = (productId) => {
    setPOCartItems(prev => prev.filter(i => String(i.product_id) !== String(productId)));
  };

  const updatePOItemQty = (productId, delta) => {
    setPOCartItems(prev => prev.map(item => {
      if (String(item.product_id) === String(productId)) {
        const nextQty = Math.max(1, (Number(item.quantity) || 1) + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  const handlePOSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPOSupplierId || poCartItems.length === 0) return;
    await onCreatePO({
      supplier_id: selectedPOSupplierId,
      items: poCartItems,
      notes: poNotes
    });
    setIsCreatePOModal(false);
    setPOCartItems([]);
    setSelectedPOSupplierId('');
    setPONotes('');
  };

  // ─── Handlers: Consumption ───
  const openEditConsumption = (c) => {
    setEditingConsumption(c);
    setConsumptionFormData({
      service_id: c.service_id || '',
      product_id: c.product_id || '',
      quantity_consumed: c.quantity_consumed || 10,
      unit: c.unit || 'ml',
      notes: c.notes || ''
    });
    setIsAddConsumptionModal(true);
  };

  const handleConsumptionSubmit = async (e) => {
    e.preventDefault();
    if (!consumptionFormData.service_id || !consumptionFormData.product_id) return;
    if (editingConsumption && onUpdateConsumption) {
      await onUpdateConsumption(editingConsumption.id, consumptionFormData);
    } else if (onAddConsumption) {
      await onAddConsumption(consumptionFormData);
    }
    setIsAddConsumptionModal(false);
    setEditingConsumption(null);
    setConsumptionFormData({ service_id: '', product_id: '', quantity_consumed: 10, unit: 'ml', notes: '' });
  };

  return (
    <div>
      {/* ─── MODULE 6 TOP METRICS CARDS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Package size={18} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Total Stock SKUs</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
            {products.length}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', border: lowStockProducts.length > 0 ? '1.5px solid rgba(239,68,68,0.4)' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <AlertTriangle size={18} style={{ color: lowStockProducts.length > 0 ? '#ef4444' : '#34d399' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Low Stock Alerts</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: lowStockProducts.length > 0 ? '#ef4444' : '#34d399' }}>
            {lowStockProducts.length}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Truck size={18} style={{ color: '#818cf8' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Registered Suppliers</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#818cf8' }}>
            {suppliers.length}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <ShoppingCart size={18} style={{ color: '#ec4899' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Purchase Orders</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ec4899' }}>
            {purchaseOrders.length}
          </div>
        </div>
      </div>

      {/* ─── MODULE TABS NAVIGATION BAR ─── */}
      <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {[
            { id: 'products', label: `Stock Products (${products.length})`, badge: null },
            { id: 'low_stock', label: `Low Stock Alerts`, badge: lowStockProducts.length },
            { id: 'suppliers', label: `Suppliers (${suppliers.length})`, badge: null },
            { id: 'pos', label: `Purchase Orders (${purchaseOrders.length})`, badge: null },
            { id: 'consumption', label: `Service Product Usage (${consumptions.length})`, badge: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px', borderRadius: '10px',
                border: activeTab === tab.id ? '1px solid var(--accent-gold)' : '1px solid var(--border)',
                background: activeTab === tab.id ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.03)',
                color: activeTab === tab.id ? 'var(--accent-gold)' : 'var(--text-sub)',
                fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '0.72rem' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Action Primary Button */}
        {activeTab === 'products' && (
          <button className="btn-primary" onClick={() => { resetProdForm(); setIsAddProductModal(true); }}>
            <Plus size={16} /> Add Product Item
          </button>
        )}
        {activeTab === 'suppliers' && (
          <button className="btn-primary" onClick={() => { setEditingSupplier(null); setSupplierFormData({ name: '', company_name: '', phone: '', email: '', gstin: '', address: '' }); setIsAddSupplierModal(true); }}>
            <Plus size={16} /> Register Supplier
          </button>
        )}
        {activeTab === 'pos' && (
          <button className="btn-primary" onClick={() => setIsCreatePOModal(true)}>
            <Plus size={16} /> Create Purchase Order
          </button>
        )}
        {activeTab === 'consumption' && (
          <button className="btn-primary" onClick={() => { setEditingConsumption(null); setConsumptionFormData({ service_id: '', product_id: '', quantity_consumed: 10, unit: 'ml', notes: '' }); setIsAddConsumptionModal(true); }}>
            <Plus size={16} /> Map Service Consumption
          </button>
        )}
      </div>

      {/* ─── TAB 1: PRODUCTS & STOCK LIST ─── */}
      {activeTab === 'products' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search product name, SKU, category..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              </div>

              <select className="select-filter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="All">All Categories</option>
                <option value="Hair Care">Hair Care</option>
                <option value="Facial & Skin">Facial & Skin</option>
                <option value="Hair Spa">Hair Spa</option>
                <option value="Beard & Grooming">Beard & Grooming</option>
              </select>

              <select className="select-filter" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="All">All Usage Types</option>
                <option value="Retail">Retail Sale</option>
                <option value="Internal Usage">Internal Salon Use</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--input-bg)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 14px' }}>SKU / Product Name</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px' }}>Usage Type</th>
                  <th style={{ padding: '12px 14px' }}>Stock Quantity</th>
                  <th style={{ padding: '12px 14px' }}>Min Threshold</th>
                  <th style={{ padding: '12px 14px' }}>Cost / Retail Price</th>
                  <th style={{ padding: '12px 14px' }}>Supplier</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No inventory products found.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map(p => {
                    const isLow = parseInt(p.quantity) <= parseInt(p.min_threshold);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--accent-gold)' }}>{p.sku}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>{p.category}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '8px', background: p.type === 'Retail' ? 'rgba(52,211,153,0.15)' : p.type === 'Internal Usage' ? 'rgba(129,140,248,0.15)' : 'rgba(245,158,11,0.15)', color: p.type === 'Retail' ? '#34d399' : p.type === 'Internal Usage' ? '#818cf8' : 'var(--accent-gold)', fontWeight: '800' }}>
                            {p.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: '900', fontSize: '1rem', color: isLow ? '#ef4444' : '#34d399' }}>
                            {p.quantity} {p.unit || 'pcs'}
                          </span>
                          {isLow && <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>LOW</span>}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {p.min_threshold} {p.unit}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>
                          <div>Cost: ₹{p.cost_price}</div>
                          {parseFloat(p.retail_price) > 0 && <div style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>MRP: ₹{p.retail_price}</div>}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-sub)' }}>
                          {p.supplier_name || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button onClick={() => { setStockAdjustProduct(p); setStockChangeVal(''); }} style={{ padding: '5px 10px', background: 'rgba(245,158,11,0.15)', border: '1px solid var(--accent-gold)', borderRadius: '6px', color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>
                              ± Stock
                            </button>
                            <button onClick={() => openEditProduct(p)} style={{ padding: '5px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
                              <Edit3 size={13} />
                            </button>
                            <button onClick={() => onDeleteProduct(p.id)} style={{ padding: '5px 8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Stock Products Pagination Footer ─── */}
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
                <span>Show products:</span>
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
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">All</option>
                </select>
              </label>
            </div>

            <div>
              Showing <strong style={{ color: 'var(--text-main)' }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> to{' '}
              <strong style={{ color: 'var(--text-main)' }}>{endIndex}</strong> of{' '}
              <strong style={{ color: 'var(--text-main)' }}>{totalItems}</strong> entries
            </div>

            {!isAll && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '5px 12px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: safePage === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                    cursor: safePage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '700'
                  }}
                >
                  Previous
                </button>
                <span style={{ fontWeight: '700', padding: '0 8px' }}>
                  Page {safePage} of {totalPages}
                </span>
                <button
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '5px 12px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: safePage === totalPages ? 'var(--text-muted)' : 'var(--text-main)',
                    cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: '700'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: LOW STOCK ALERTS ─── */}
      {activeTab === 'low_stock' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Low Stock & Inventory Replenishment Thresholds
          </h3>

          {totalLowStock === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#34d399', fontSize: '0.95rem' }}>
              <CheckCircle2 size={36} style={{ marginBottom: '8px' }} /><br />
              All inventory products are above minimum safety thresholds! 🎉
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {paginatedLowStock.map(p => (
                  <div key={p.id} style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{p.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>{p.sku} · {p.category}</div>
                      </div>
                      <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '900' }}>
                        ALERT
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', margin: '10px 0' }}>
                      <div>Current Quantity: <strong style={{ color: '#ef4444', fontSize: '1.1rem' }}>{p.quantity} {p.unit}</strong></div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Min Safety Level: {p.min_threshold} {p.unit}</div>
                    </div>

                    <button
                      onClick={() => { setSelectedPOProduct(String(p.id)); setPOItemCost(String(p.cost_price)); setPOItemQty(20); setIsCreatePOModal(true); }}
                      style={{ width: '100%', padding: '8px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <ShoppingCart size={14} /> Reorder Stock via PO
                    </button>
                  </div>
                ))}
              </div>

              {/* Low Stock Pagination Footer */}
              <div style={{
                display: 'flex',
                justify: 'space-between',
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
                    <span>Show alerts:</span>
                    <select
                      value={lowStockPageSize}
                      onChange={(e) => {
                        const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                        setLowStockPageSize(val);
                        setLowStockCurrentPage(1);
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
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value="all">All</option>
                    </select>
                  </label>
                </div>

                <div>
                  Showing <strong style={{ color: 'var(--text-main)' }}>{totalLowStock > 0 ? lowStockStartIndex + 1 : 0}</strong> to{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{lowStockEndIndex}</strong> of{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{totalLowStock}</strong> entries
                </div>

                {!isLowStockAll && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      disabled={safeLowStockPage === 1}
                      onClick={() => setLowStockCurrentPage(p => Math.max(1, p - 1))}
                      style={{
                        padding: '5px 12px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: safeLowStockPage === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                        cursor: safeLowStockPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ fontWeight: '700', padding: '0 8px' }}>
                      Page {safeLowStockPage} of {totalLowStockPages}
                    </span>
                    <button
                      disabled={safeLowStockPage === totalLowStockPages}
                      onClick={() => setLowStockCurrentPage(p => Math.min(totalLowStockPages, p + 1))}
                      style={{
                        padding: '5px 12px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: safeLowStockPage === totalLowStockPages ? 'var(--text-muted)' : 'var(--text-main)',
                        cursor: safeLowStockPage === totalLowStockPages ? 'not-allowed' : 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 3: SUPPLIERS DIRECTORY ─── */}
      {activeTab === 'suppliers' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search supplier name, company, phone..."
                value={supplierSearch}
                onChange={e => {
                  setSupplierSearch(e.target.value);
                  setSupplierCurrentPage(1);
                }}
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {totalSuppliers === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No suppliers found.
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {paginatedSuppliers.map(s => (
                  <div key={s.id} className="glass-card" style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{s.name}</strong>
                        {s.company_name && <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: '700' }}>{s.company_name}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => { setEditingSupplier(s); setSupplierFormData({ name: s.name, company_name: s.company_name || '', phone: s.phone || '', email: s.email || '', gstin: s.gstin || '', address: s.address || '' }); setIsAddSupplierModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer' }}>
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => onDeleteSupplier(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                      <div>📞 Mobile: <strong>{s.phone}</strong></div>
                      {s.email && <div>✉️ Email: {s.email}</div>}
                      {s.gstin && <div>🏢 GSTIN: <code style={{ color: 'var(--accent-gold)' }}>{s.gstin}</code></div>}
                      {s.address && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>📍 {s.address}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Suppliers Pagination Footer */}
              <div style={{
                display: 'flex',
                justify: 'space-between',
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
                    <span>Show suppliers:</span>
                    <select
                      value={supplierPageSize}
                      onChange={(e) => {
                        const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                        setSupplierPageSize(val);
                        setSupplierCurrentPage(1);
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
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value="all">All</option>
                    </select>
                  </label>
                </div>

                <div>
                  Showing <strong style={{ color: 'var(--text-main)' }}>{totalSuppliers > 0 ? supplierStartIndex + 1 : 0}</strong> to{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{supplierEndIndex}</strong> of{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{totalSuppliers}</strong> entries
                </div>

                {!isSupplierAll && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      disabled={safeSupplierPage === 1}
                      onClick={() => setSupplierCurrentPage(p => Math.max(1, p - 1))}
                      style={{
                        padding: '5px 12px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: safeSupplierPage === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                        cursor: safeSupplierPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ fontWeight: '700', padding: '0 8px' }}>
                      Page {safeSupplierPage} of {totalSupplierPages}
                    </span>
                    <button
                      disabled={safeSupplierPage === totalSupplierPages}
                      onClick={() => setSupplierCurrentPage(p => Math.min(totalSupplierPages, p + 1))}
                      style={{
                        padding: '5px 12px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: safeSupplierPage === totalSupplierPages ? 'var(--text-muted)' : 'var(--text-main)',
                        cursor: safeSupplierPage === totalSupplierPages ? 'not-allowed' : 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 4: PURCHASE ORDERS (POs) ─── */}
      {activeTab === 'pos' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} style={{ color: 'var(--accent-gold)' }} /> Purchase Orders & Stock Intake Logs
          </h3>

          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 14px' }}>PO Number</th>
                <th style={{ padding: '12px 14px' }}>Supplier</th>
                <th style={{ padding: '12px 14px' }}>Total Amount</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px' }}>Order Date</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {totalPOs === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                paginatedPOs.map(po => (
                  <tr key={po.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--accent-gold)' }}>
                      #{po.po_number}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem' }}>
                      {po.supplier_name || 'Vendor'}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '900', color: 'var(--text-main)' }}>
                      ₹{parseFloat(po.total_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '800', background: po.status === 'Received' ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)', color: po.status === 'Received' ? '#34d399' : 'var(--accent-gold)' }}>
                        {po.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(po.order_date).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {po.status !== 'Received' ? (
                        <button
                          onClick={() => onUpdatePOStatus(po.id, 'Received')}
                          style={{ padding: '5px 10px', background: 'rgba(52,211,153,0.18)', border: '1px solid #34d399', color: '#34d399', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
                        >
                          ✓ Mark Stock Received
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: '700' }}>✓ Stock Injected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Purchase Orders Pagination Footer */}
          {totalPOs > 0 && (
            <div style={{
              display: 'flex',
              justify: 'space-between',
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
                  <span>Show orders:</span>
                  <select
                    value={poPageSize}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                      setPOPageSize(val);
                      setPOCurrentPage(1);
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
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value="all">All</option>
                  </select>
                </label>
              </div>

              <div>
                Showing <strong style={{ color: 'var(--text-main)' }}>{totalPOs > 0 ? poStartIndex + 1 : 0}</strong> to{' '}
                <strong style={{ color: 'var(--text-main)' }}>{poEndIndex}</strong> of{' '}
                <strong style={{ color: 'var(--text-main)' }}>{totalPOs}</strong> entries
              </div>

              {!isPOAll && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    disabled={safePOPage === 1}
                    onClick={() => setPOCurrentPage(p => Math.max(1, p - 1))}
                    style={{
                      padding: '5px 12px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: safePOPage === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                      cursor: safePOPage === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: '700'
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ fontWeight: '700', padding: '0 8px' }}>
                    Page {safePOPage} of {totalPOPages}
                  </span>
                  <button
                    disabled={safePOPage === totalPOPages}
                    onClick={() => setPOCurrentPage(p => Math.min(totalPOPages, p + 1))}
                    style={{
                      padding: '5px 12px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: safePOPage === totalPOPages ? 'var(--text-muted)' : 'var(--text-main)',
                      cursor: safePOPage === totalPOPages ? 'not-allowed' : 'pointer',
                      fontWeight: '700'
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: SERVICE PRODUCT USAGE MAPPING ─── */}
      {activeTab === 'consumption' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--accent-gold)' }} /> Service-wise Internal Product Consumption Tracking
          </h3>

          {totalConsumptions === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No service consumption mappings found.
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {paginatedConsumptions.map(c => (
                  <div key={c.id} className="glass-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: '800', textTransform: 'uppercase' }}>
                        💈 {c.service_category || 'Service'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => openEditConsumption(c)}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#60a5fa', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Edit Mapping"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteConsumption(c.id)}
                          style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Delete Mapping"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff', marginBottom: '6px' }}>
                      {c.service_name}
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                      <div>Consumes: <strong style={{ color: '#34d399' }}>{c.product_name}</strong></div>
                      <div>Qty Per Service: <strong style={{ color: 'var(--accent-gold)' }}>{c.quantity_consumed} {c.unit}</strong></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Service Product Usage Pagination Footer */}
              <div style={{
                display: 'flex',
                justify: 'space-between',
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
                    <span>Show mappings:</span>
                    <select
                      value={consumptionPageSize}
                      onChange={(e) => {
                        const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                        setConsumptionPageSize(val);
                        setConsumptionCurrentPage(1);
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
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value="all">All</option>
                    </select>
                  </label>
                </div>

                <div>
                  Showing <strong style={{ color: 'var(--text-main)' }}>{totalConsumptions > 0 ? consumptionStartIndex + 1 : 0}</strong> to{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{consumptionEndIndex}</strong> of{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{totalConsumptions}</strong> entries
                </div>

                {!isConsumptionAll && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      disabled={safeConsumptionPage === 1}
                      onClick={() => setConsumptionCurrentPage(p => Math.max(1, p - 1))}
                      style={{
                        padding: '5px 12px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: safeConsumptionPage === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                        cursor: safeConsumptionPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ fontWeight: '700', padding: '0 8px' }}>
                      Page {safeConsumptionPage} of {totalConsumptionPages}
                    </span>
                    <button
                      disabled={safeConsumptionPage === totalConsumptionPages}
                      onClick={() => setConsumptionCurrentPage(p => Math.min(totalConsumptionPages, p + 1))}
                      style={{
                        padding: '5px 12px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: safeConsumptionPage === totalConsumptionPages ? 'var(--text-muted)' : 'var(--text-main)',
                        cursor: safeConsumptionPage === totalConsumptionPages ? 'not-allowed' : 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── MODAL: ADD / EDIT PRODUCT ─── */}
      {isAddProductModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '520px', width: '90%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {editingProduct ? 'Edit Inventory Item' : 'Add New Inventory Product'}
              </h3>
              <button onClick={() => setIsAddProductModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Product Name *</label>
                <input type="text" required value={prodFormData.name} onChange={e => setProdFormData({ ...prodFormData, name: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Category</label>
                <select value={prodFormData.category} onChange={e => setProdFormData({ ...prodFormData, category: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}>
                  <option value="Hair Care">Hair Care</option>
                  <option value="Facial & Skin">Facial & Skin</option>
                  <option value="Hair Spa">Hair Spa</option>
                  <option value="Beard & Grooming">Beard & Grooming</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Usage Type</label>
                <select value={prodFormData.type} onChange={e => setProdFormData({ ...prodFormData, type: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}>
                  <option value="Retail">Retail Sale</option>
                  <option value="Internal Usage">Internal Salon Use</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Current Quantity</label>
                <input type="number" required value={prodFormData.quantity} onChange={e => setProdFormData({ ...prodFormData, quantity: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Min Safety Threshold</label>
                <input type="number" required value={prodFormData.min_threshold} onChange={e => setProdFormData({ ...prodFormData, min_threshold: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cost Price (₹)</label>
                <input type="number" step="0.01" required value={prodFormData.cost_price} onChange={e => setProdFormData({ ...prodFormData, cost_price: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Retail Price (₹)</label>
                <input type="number" step="0.01" value={prodFormData.retail_price} onChange={e => setProdFormData({ ...prodFormData, retail_price: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Supplier Vendor</label>
                <select value={prodFormData.supplier_id} onChange={e => setProdFormData({ ...prodFormData, supplier_id: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}>
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.company_name || 'Vendor'})</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: isSubmitting ? 0.75 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> {editingProduct ? 'Updating...' : 'Saving Product...'}
                    </>
                  ) : (
                    editingProduct ? 'Update Inventory Item' : 'Save Product to Inventory'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADJUST STOCK ─── */}
      {stockAdjustProduct && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px', width: '90%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                Adjust Stock — {stockAdjustProduct.name}
              </h3>
              <button onClick={() => setStockAdjustProduct(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>
                Current Level: <strong style={{ color: 'var(--accent-gold)' }}>{stockAdjustProduct.quantity} {stockAdjustProduct.unit}</strong>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Change Quantity (+ to add, - to subtract)</label>
                <input type="number" required placeholder="e.g. +10 or -5" value={stockChangeVal} onChange={e => setStockChangeVal(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Reason</label>
                <select value={stockAdjustReason} onChange={e => setStockAdjustReason(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}>
                  <option value="Manual Adjustment">Manual Stock Check</option>
                  <option value="Internal Service Usage">Internal Usage</option>
                  <option value="Damaged/Expired">Damaged / Expired Product</option>
                  <option value="Purchase Order Delivered">Stock Delivery</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px', marginTop: '6px' }}>
                Confirm Stock Adjustment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD / EDIT SUPPLIER ─── */}
      {isAddSupplierModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '440px', width: '90%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {editingSupplier ? 'Edit Supplier Details' : 'Register New Supplier Vendor'}
              </h3>
              <button onClick={() => setIsAddSupplierModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Contact Person Name *</label>
                <input type="text" required value={supplierFormData.name} onChange={e => setSupplierFormData({ ...supplierFormData, name: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Company Name</label>
                <input type="text" value={supplierFormData.company_name} onChange={e => setSupplierFormData({ ...supplierFormData, company_name: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Phone Number *</label>
                <input type="text" required value={supplierFormData.phone} onChange={e => setSupplierFormData({ ...supplierFormData, phone: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Email Address</label>
                <input type="email" value={supplierFormData.email} onChange={e => setSupplierFormData({ ...supplierFormData, email: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>GSTIN Number</label>
                <input type="text" value={supplierFormData.gstin} onChange={e => setSupplierFormData({ ...supplierFormData, gstin: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px', marginTop: '10px' }}>
                Save Supplier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE PURCHASE ORDER ─── */}
      {isCreatePOModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(0, 0, 0, 0.78)' }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '680px', width: '94%', padding: '28px', borderRadius: '18px', border: '1px solid rgba(59, 130, 246, 0.25)', background: '#0a0a0a', boxShadow: '0 24px 60px rgba(0,0,0,0.8)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShoppingCart size={22} style={{ color: 'var(--accent-gold)' }} />
                  Create Purchase Order (PO)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Select vendor supplier & add product inventory items to build order.
                </p>
              </div>
              <button
                onClick={() => setIsCreatePOModal(false)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePOSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Supplier Selection */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>
                  Select Supplier Vendor *
                </label>
                <select
                  required
                  value={selectedPOSupplierId}
                  onChange={e => setSelectedPOSupplierId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                >
                  <option value="">-- Choose Supplier / Vendor --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.company_name || 'Vendor'}) — {s.phone || 'No phone'}</option>
                  ))}
                </select>
              </div>

              {/* Add Items to PO Section Card */}
              <div style={{ background: 'rgba(255,255,255,0.025)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-gold)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={16} /> Add Products to Order Cart:
                </div>

                {/* Inputs Grid with clear labels */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 2fr) minmax(100px, 1fr) minmax(80px, 1fr) auto', gap: '10px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>
                      Select Product
                    </label>
                    <select
                      value={selectedPOProduct}
                      onChange={e => {
                        setSelectedPOProduct(e.target.value);
                        const pr = products.find(p => String(p.id) === String(e.target.value));
                        if (pr) setPOItemCost(String(pr.cost_price));
                      }}
                      style={{ width: '100%', padding: '9px 10px', fontSize: '0.82rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                    >
                      <option value="">-- Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>
                      Unit Cost (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Cost"
                      value={poItemCost}
                      onChange={e => setPOItemCost(e.target.value)}
                      style={{ width: '100%', padding: '9px 10px', fontSize: '0.82rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>
                      Quantity
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setPOItemQty(prev => Math.max(1, (Number(prev) || 1) - 1))}
                        style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '9px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Decrease"
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={poItemQty}
                        onChange={e => setPOItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '38px', padding: '9px 0', fontSize: '0.82rem', fontWeight: '800', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => setPOItemQty(prev => (Number(prev) || 1) + 1)}
                        style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '9px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Increase"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={addPOItemToCart}
                      style={{
                        padding: '9px 16px',
                        background: '#2563eb',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                      }}
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* PO Items List & Order Summary */}
              {poCartItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-sub)' }}>
                    Order Items ({poCartItems.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                    {poCartItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0, paddingRight: '12px' }}>
                          <span style={{ fontWeight: '700', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {item.product_name}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            Unit Cost: ₹{item.unit_cost}
                          </span>
                        </div>

                        {/* Interactive Quantity Stepper (+ / -) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
                            <button
                              type="button"
                              onClick={() => updatePOItemQty(item.product_id, -1)}
                              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                              title="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>

                            <span style={{ padding: '0 8px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-gold)', minWidth: '22px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => updatePOItemQty(item.product_id, 1)}
                              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                              title="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <strong style={{ color: '#34d399', fontSize: '0.9rem', minWidth: '70px', textAlign: 'right' }}>
                            ₹{(item.quantity * item.unit_cost).toFixed(2)}
                          </strong>

                          <button
                            type="button"
                            onClick={() => removePOItemFromCart(item.product_id)}
                            style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-sub)' }}>
                      Total PO Items: <strong style={{ color: '#fff' }}>{poCartItems.reduce((acc, i) => acc + i.quantity, 0)} pcs</strong>
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                      Estimated Order Total: <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>₹{poCartItems.reduce((acc, i) => acc + (i.quantity * i.unit_cost), 0).toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No items added to Purchase Order cart yet. Choose product above and click "+ Add Item".
                </div>
              )}

              {/* Submit Action */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreatePOModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={poCartItems.length === 0 || !selectedPOSupplierId}
                  style={{ flex: 2, padding: '11px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '800', opacity: (poCartItems.length === 0 || !selectedPOSupplierId) ? 0.5 : 1 }}
                >
                  Confirm & Create Purchase Order
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: MAP SERVICE PRODUCT CONSUMPTION ─── */}
      {isAddConsumptionModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '440px', width: '90%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {editingConsumption ? 'Edit Service Product Consumption Mapping' : 'Map Service Product Consumption'}
              </h3>
              <button onClick={() => { setIsAddConsumptionModal(false); setEditingConsumption(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConsumptionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select Salon Service *</label>
                <select required value={consumptionFormData.service_id} onChange={e => setConsumptionFormData({ ...consumptionFormData, service_id: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}>
                  <option value="">-- Choose Service --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select Internal Usage Product *</label>
                <select required value={consumptionFormData.product_id} onChange={e => setConsumptionFormData({ ...consumptionFormData, product_id: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}>
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Qty Consumed per Session</label>
                  <input type="number" required value={consumptionFormData.quantity_consumed} onChange={e => setConsumptionFormData({ ...consumptionFormData, quantity_consumed: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unit</label>
                  <input type="text" value={consumptionFormData.unit} onChange={e => setConsumptionFormData({ ...consumptionFormData, unit: e.target.value })} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px', marginTop: '10px' }}>
                {editingConsumption ? 'Update Consumption Mapping' : 'Save Consumption Mapping'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default InventoryStockManagementView;

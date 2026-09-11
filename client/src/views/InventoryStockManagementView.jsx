import React, { useState } from 'react';
import {
  Package, AlertTriangle, Truck, ShoppingCart, Activity, Plus, Search, Filter,
  Edit3, Trash2, CheckCircle2, RefreshCw, ChevronRight, X, ArrowUpRight, ArrowDownRight,
  TrendingUp, Tag, ShieldAlert, Sparkles, Building, Phone, Mail, FileText, Check
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
  onDeleteConsumption
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
  const [consumptionFormData, setConsumptionFormData] = useState({
    service_id: '',
    product_id: '',
    quantity_consumed: 10,
    unit: 'ml',
    notes: ''
  });

  // ─── Low Stock Items ───
  const lowStockProducts = products.filter(p => parseInt(p.quantity || 0) <= parseInt(p.min_threshold || 10));

  // ─── Filtered Products ───
  const filteredProducts = products.filter(p => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesType = typeFilter === 'All' || p.type === typeFilter;
    const searchLower = productSearch.toLowerCase();
    const matchesSearch = !productSearch.trim() ||
      String(p.name ?? '').toLowerCase().includes(searchLower) ||
      String(p.sku ?? '').toLowerCase().includes(searchLower) ||
      String(p.category ?? '').toLowerCase().includes(searchLower);
    return matchesCat && matchesType && matchesSearch;
  });

  // ─── Filtered Suppliers ───
  const filteredSuppliers = suppliers.filter(s => {
    const searchLower = supplierSearch.toLowerCase();
    return !supplierSearch.trim() ||
      String(s.name ?? '').toLowerCase().includes(searchLower) ||
      (s.company_name && String(s.company_name).toLowerCase().includes(searchLower)) ||
      String(s.phone ?? '').includes(supplierSearch);
  });

  // ─── Handlers: Product ───
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!prodFormData.name) return;
    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, prodFormData);
    } else {
      await onAddProduct(prodFormData);
    }
    setIsAddProductModal(false);
    setEditingProduct(null);
    resetProdForm();
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
  const handleConsumptionSubmit = async (e) => {
    e.preventDefault();
    if (!consumptionFormData.service_id || !consumptionFormData.product_id) return;
    await onAddConsumption(consumptionFormData);
    setIsAddConsumptionModal(false);
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
            { id: 'products', label: `📦 Stock Products (${products.length})`, badge: null },
            { id: 'low_stock', label: `⚠️ Low Stock Alerts`, badge: lowStockProducts.length },
            { id: 'suppliers', label: `🏭 Suppliers (${suppliers.length})`, badge: null },
            { id: 'pos', label: `📝 Purchase Orders (${purchaseOrders.length})`, badge: null },
            { id: 'consumption', label: `🧪 Service Product Usage (${consumptions.length})`, badge: null },
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
          <button className="btn-primary" onClick={() => setIsAddConsumptionModal(true)}>
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
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No inventory products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
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
        </div>
      )}

      {/* ─── TAB 2: LOW STOCK ALERTS ─── */}
      {activeTab === 'low_stock' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Low Stock & Inventory Replenishment Thresholds
          </h3>

          {lowStockProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#34d399', fontSize: '0.95rem' }}>
              <CheckCircle2 size={36} style={{ marginBottom: '8px' }} /><br />
              All inventory products are above minimum safety thresholds! 🎉
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {lowStockProducts.map(p => (
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
                onChange={e => setSupplierSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filteredSuppliers.map(s => (
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
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map(po => (
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
        </div>
      )}

      {/* ─── TAB 5: SERVICE PRODUCT USAGE MAPPING ─── */}
      {activeTab === 'consumption' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--accent-gold)' }} /> Service-wise Internal Product Consumption Tracking
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {consumptions.map(c => (
              <div key={c.id} className="glass-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: '800', textTransform: 'uppercase' }}>
                    💈 {c.service_category || 'Service'}
                  </span>
                  <button onClick={() => onDeleteConsumption(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
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
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px' }}>
                  {editingProduct ? 'Update Inventory Item' : 'Save Product to Inventory'}
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
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '580px', width: '90%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                Create Purchase Order (PO)
              </h3>
              <button onClick={() => setIsCreatePOModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePOSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select Supplier *</label>
                <select required value={selectedPOSupplierId} onChange={e => setSelectedPOSupplierId(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}>
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.company_name || 'Vendor'})</option>
                  ))}
                </select>
              </div>

              {/* Add Items to PO Cart */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-gold)', marginBottom: '8px' }}>Add Products to PO:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '6px' }}>
                  <select value={selectedPOProduct} onChange={e => {
                    setSelectedPOProduct(e.target.value);
                    const pr = products.find(p => String(p.id) === String(e.target.value));
                    if (pr) setPOItemCost(String(pr.cost_price));
                  }} style={{ padding: '6px', fontSize: '0.78rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}>
                    <option value="">-- Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Cost" value={poItemCost} onChange={e => setPOItemCost(e.target.value)} style={{ padding: '6px', fontSize: '0.78rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }} />
                  <input type="number" placeholder="Qty" value={poItemQty} onChange={e => setPOItemQty(e.target.value)} style={{ padding: '6px', fontSize: '0.78rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }} />
                  <button type="button" onClick={addPOItemToCart} style={{ padding: '6px 12px', background: 'var(--accent-gold)', border: 'none', borderRadius: '6px', color: '#000', fontWeight: '800', cursor: 'pointer' }}>+ Add</button>
                </div>
              </div>

              {/* PO Items List */}
              {poCartItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                  {poCartItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <span>{item.product_name} ({item.quantity} × ₹{item.unit_cost})</span>
                      <strong style={{ color: 'var(--accent-gold)' }}>₹{(item.quantity * item.unit_cost).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={poCartItems.length === 0} style={{ width: '100%', padding: '10px', marginTop: '6px', opacity: poCartItems.length === 0 ? 0.5 : 1 }}>
                Confirm & Create Purchase Order
              </button>
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
                Map Service Product Consumption
              </h3>
              <button onClick={() => setIsAddConsumptionModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
                Save Consumption Mapping
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default InventoryStockManagementView;

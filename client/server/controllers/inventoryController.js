import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Consumption from '../models/Consumption.js';

// ==================== PRODUCTS CONTROLLERS ====================
export const getProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory products.' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product, message: 'Product added to stock!' });
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.update(req.params.id, req.body);
    res.json({ success: true, data: product, message: 'Product updated successfully!' });
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { change_qty, reason, notes } = req.body;
    const product = await Product.adjustStock(req.params.id, change_qty, reason, req.user?.name, notes);
    res.json({ success: true, data: product, message: 'Stock level updated!' });
  } catch (err) {
    console.error('adjustStock error:', err);
    res.status(500).json({ success: false, message: 'Failed to adjust stock level.' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await Product.delete(req.params.id);
    res.json({ success: true, message: 'Product removed from inventory.' });
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};

// ==================== SUPPLIERS CONTROLLERS ====================
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.getAll();
    res.json({ success: true, data: suppliers });
  } catch (err) {
    console.error('getSuppliers error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch suppliers.' });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier, message: 'Supplier registered successfully!' });
  } catch (err) {
    console.error('createSupplier error:', err);
    res.status(500).json({ success: false, message: 'Failed to create supplier.' });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.update(req.params.id, req.body);
    res.json({ success: true, data: supplier, message: 'Supplier updated!' });
  } catch (err) {
    console.error('updateSupplier error:', err);
    res.status(500).json({ success: false, message: 'Failed to update supplier.' });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    await Supplier.delete(req.params.id);
    res.json({ success: true, message: 'Supplier removed.' });
  } catch (err) {
    console.error('deleteSupplier error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete supplier.' });
  }
};

// ==================== PURCHASE ORDERS CONTROLLERS ====================
export const getPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.getAll();
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('getPurchaseOrders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch purchase orders.' });
  }
};

export const createPurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.create(req.body);
    res.status(201).json({ success: true, data: po, message: 'Purchase Order created!' });
  } catch (err) {
    console.error('createPurchaseOrder error:', err);
    res.status(500).json({ success: false, message: 'Failed to create purchase order.' });
  }
};

export const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.updateStatus(req.params.id, status);
    res.json({ success: true, data: po, message: `PO status changed to ${status}!` });
  } catch (err) {
    console.error('updatePurchaseOrderStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to update PO status.' });
  }
};

// ==================== CONSUMPTION CONTROLLERS ====================
export const getConsumptions = async (req, res) => {
  try {
    const consumptions = await Consumption.getAll();
    res.json({ success: true, data: consumptions });
  } catch (err) {
    console.error('getConsumptions error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch service consumption mappings.' });
  }
};

export const createConsumption = async (req, res) => {
  try {
    const item = await Consumption.create(req.body);
    res.status(201).json({ success: true, data: item, message: 'Service product consumption mapped!' });
  } catch (err) {
    console.error('createConsumption error:', err);
    res.status(500).json({ success: false, message: 'Failed to map product consumption.' });
  }
};

export const deleteConsumption = async (req, res) => {
  try {
    await Consumption.delete(req.params.id);
    res.json({ success: true, message: 'Consumption mapping removed.' });
  } catch (err) {
    console.error('deleteConsumption error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete consumption.' });
  }
};

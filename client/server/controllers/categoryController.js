import CategoryModel from '../models/CategoryModel.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.findAllCategories();
    return res.json({
      status: 'success',
      data: categories
    });
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch categories' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Category name is required' });
    }

    const newCategory = await CategoryModel.createCategory({ name, description });
    return res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (err) {
    console.error('Error creating category:', err.message);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to create category' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCategory = await CategoryModel.updateCategory(id, req.body);
    if (!updatedCategory) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    return res.json({
      status: 'success',
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (err) {
    console.error('Error updating category:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to update category' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await CategoryModel.deleteCategory(id);
    if (!deletedCategory) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    return res.json({
      status: 'success',
      message: 'Category deleted successfully',
      data: deletedCategory
    });
  } catch (err) {
    console.error('Error deleting category:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to delete category' });
  }
};

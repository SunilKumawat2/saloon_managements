export const getServices = async (req, res) => {
  return res.json({
    status: 'success',
    data: [
      { id: 1, name: 'Classic Haircut', category: 'Hair', price: 350.00, duration_minutes: 30 },
      { id: 2, name: 'Beard Shaping & Spa', category: 'Beard', price: 200.00, duration_minutes: 20 },
      { id: 3, name: 'Royal Facial & Clean-up', category: 'Facial', price: 1200.00, duration_minutes: 45 }
    ]
  });
};

export const createService = async (req, res) => {
  const { name, category, price, duration_minutes } = req.body;
  return res.status(201).json({
    status: 'success',
    message: 'Service created successfully',
    data: { id: Date.now(), name, category, price, duration_minutes }
  });
};

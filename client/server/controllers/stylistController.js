export const getStylists = async (req, res) => {
  return res.json({
    status: 'success',
    data: [
      { id: 1, name: 'Rohan Sharma', specialization: 'Senior Stylist', rating: 4.9 },
      { id: 2, name: 'Amit Verma', specialization: 'Beard & Facial Expert', rating: 4.8 }
    ]
  });
};

export const createStylist = async (req, res) => {
  const { name, phone, specialization } = req.body;
  return res.status(201).json({
    status: 'success',
    message: 'Stylist added successfully',
    data: { id: Date.now(), name, phone, specialization }
  });
};

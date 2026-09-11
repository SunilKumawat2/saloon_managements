import { testDbConnection } from '../config/db.js';

export const getHealth = (req, res) => {
  return res.json({
    status: 'ok',
    message: 'Salon ERP & CRM Backend API is running',
    timestamp: new Date().toISOString(),
  });
};

export const checkDatabaseStatus = async (req, res) => {
  const result = await testDbConnection();
  if (result.connected) {
    return res.json({ status: 'success', message: 'Database connection operational', data: result });
  } else {
    return res.status(500).json({ status: 'error', message: 'Database connection failed', error: result.error });
  }
};

import axios from "axios";
import { API_BASE_URL } from "../config/Config";

// Helper function to get JWT token from localStorage
const getToken = () => localStorage.getItem("saloon_jwt_token");

// <----------------  Admin Login API ----------------->
export const Admin_Login = async (loginData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Get Admin Profile ----------------->
export const Get_Admin_Profile = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Get Users ----------------->
export const Admin_Get_Users = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Create User ----------------->
export const Admin_Create_User = async (userData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/users/create`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Update User ---------------->
export const Admin_Update_User = async (userId, userData) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/users/${userId}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Delete User ---------------->
export const Admin_Delete_User = async (userId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Toggle User Active/Block Status ---------------->
export const Admin_Toggle_User_Status = async (userId) => {
  try {
    const token = getToken();
    const response = await axios.patch(`${API_BASE_URL}/users/${userId}/status`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Get Roles List ----------------->
export const Admin_Get_Roles = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/users/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Update Role Permissions (RBAC Matrix) ----------------->
export const Admin_Update_Role_Permissions = async (roleId, permissions) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/roles/${roleId}/permissions`, { permissions }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Get Branches ----------------->
export const Admin_Get_Branches = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/branches`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Create Branch ----------------->
export const Admin_Create_Branch = async (branchData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/branches/create`, branchData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Update Branch ----------------->
export const Admin_Update_Branch = async (branchId, branchData) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/branches/${branchId}`, branchData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Toggle Branch Active/Inactive Status ----------------->
export const Admin_Toggle_Branch_Status = async (branchId) => {
  try {
    const token = getToken();
    const response = await axios.patch(`${API_BASE_URL}/branches/${branchId}/status`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Delete Branch ----------------->
export const Admin_Delete_Branch = async (branchId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_BASE_URL}/branches/${branchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Get Customers (Module 2 CRM) ----------------->
export const Admin_Get_Customers = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Create Customer (Module 2 CRM) ----------------->
export const Admin_Create_Customer = async (customerData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/customers/create`, customerData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Update Customer (Module 2 CRM) ----------------->
export const Admin_Update_Customer = async (customerId, customerData) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/customers/${customerId}`, customerData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Delete Customer (Module 2 CRM) ----------------->
export const Admin_Delete_Customer = async (customerId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_BASE_URL}/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Get Leads (Module 2 CRM) ----------------->
export const Admin_Get_Leads = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Create Lead (Module 2 CRM) ----------------->
export const Admin_Create_Lead = async (leadData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/leads/create`, leadData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Update Lead Status (Module 2 CRM) ----------------->
export const Admin_Update_Lead_Status = async (leadId, status) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/leads/${leadId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Get Salon Services ----------------->
export const Admin_Get_Services = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/services`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Create Salon Service ----------------->
export const Admin_Create_Service = async (serviceData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/services/create`, serviceData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Get Stylists / Staff ----------------->
export const Admin_Get_Stylists = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/stylists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Create Stylist / Staff ----------------->
export const Admin_Create_Stylist = async (stylistData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/stylists/create`, stylistData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Get Appointments (Module 3 Booking) ----------------->
export const Admin_Get_Appointments = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Create Appointment (Module 3 Booking) ----------------->
export const Admin_Create_Appointment = async (appointmentData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/appointments/create`, appointmentData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Update Appointment Status ----------------->
export const Admin_Update_Appointment_Status = async (appointmentId, status) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/appointments/${appointmentId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  System Health Check ----------------->
export const Admin_Get_Health = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Get All Bills (POS Billing) ----------------->
export const Admin_Get_Bills = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/billing`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Create Bill / POS Invoice ----------------->
export const Admin_Create_Bill = async (billData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/billing/create`, billData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Upload User Avatar (Multer) ---------------->
export const Admin_Upload_User_Avatar = async (userId, imageFile) => {
  try {
    const token = getToken();
    const formData = new FormData();
    formData.append('avatar', imageFile);
    const response = await axios.post(`${API_BASE_URL}/users/${userId}/avatar`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Remove User Avatar ---------------->
export const Admin_Remove_User_Avatar = async (userId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_BASE_URL}/users/${userId}/avatar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

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

// <----------------  Admin Upload Customer Profile Photo ----------------->
export const Admin_Upload_Customer_Avatar = async (customerId, file) => {
  try {
    const token = getToken();
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await axios.post(`${API_BASE_URL}/customers/${customerId}/avatar`, formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Remove Customer Profile Photo ----------------->
export const Admin_Remove_Customer_Avatar = async (customerId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_BASE_URL}/customers/${customerId}/avatar`, {
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

// <----------------  Admin Update Lead (Module 2 CRM) ----------------->
export const Admin_Update_Lead = async (leadId, leadData) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/leads/${leadId}`, leadData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Delete Lead (Module 2 CRM) ----------------->
export const Admin_Delete_Lead = async (leadId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_BASE_URL}/leads/${leadId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Upload Lead Profile Photo ----------------->
export const Admin_Upload_Lead_Avatar = async (leadId, file) => {
  try {
    const token = getToken();
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await axios.post(`${API_BASE_URL}/leads/${leadId}/avatar`, formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Remove Lead Profile Photo ----------------->
export const Admin_Remove_Lead_Avatar = async (leadId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_BASE_URL}/leads/${leadId}/avatar`, {
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

// <----------------  Admin Update Salon Service (Module 4) ----------------->
export const Admin_Update_Service = async (serviceId, serviceData) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/services/${serviceId}`, serviceData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Delete Salon Service (Module 4) ----------------->
export const Admin_Delete_Service = async (serviceId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_BASE_URL}/services/${serviceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Get Bundled Combo Packages (Module 4) ----------------->
export const Admin_Get_Packages = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/packages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Create Combo Package (Module 4) ----------------->
export const Admin_Create_Package = async (packageData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/packages/create`, packageData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Update Combo Package (Module 4) ----------------->
export const Admin_Update_Package = async (packageId, packageData) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/packages/${packageId}`, packageData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Delete Combo Package (Module 4) ----------------->
export const Admin_Delete_Package = async (packageId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_BASE_URL}/packages/${packageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Dynamic Categories (Module 4) ----------------->
export const Admin_Get_Categories = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

export const Admin_Create_Category = async (categoryData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/categories/create`, categoryData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

export const Admin_Update_Category = async (categoryId, categoryData) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/categories/${categoryId}`, categoryData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

export const Admin_Delete_Category = async (categoryId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_BASE_URL}/categories/${categoryId}`, {
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

// <----------------  Admin Update Appointment ----------------->
export const Admin_Update_Appointment = async (appointmentId, appointmentData) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/appointments/${appointmentId}`, appointmentData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error.response || error;
  }
};

// <----------------  Admin Delete Appointment ----------------->
export const Admin_Delete_Appointment = async (appointmentId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_BASE_URL}/appointments/${appointmentId}`, {
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

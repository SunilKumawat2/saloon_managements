import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, Calendar, Clock, Search, Filter, Award, Scissors,
  CheckCircle2, TrendingUp, DollarSign, ChevronRight, ChevronLeft, Eye, RefreshCw,
  Phone, Mail, MapPin, Sparkles, FileText, ArrowRight, ShieldCheck, X, Download,
  Printer, LayoutGrid, Table, User, ArrowLeft, BarChart3, Check
} from 'lucide-react';
import { Admin_Get_Staff_Tracking, Admin_Get_Customer_Tracking } from '../services/apiService';

function StaffCustomerTrackingView({ stylists = [], customers = [], appointments = [], bills = [], selectedBranchId = 'all' }) {
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'customer'
  const [timeframe, setTimeframe] = useState('month'); // 'day' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'

  const todayFormatted = new Date().toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState(todayFormatted);
  const [customEndDate, setCustomEndDate] = useState(todayFormatted);
  const [staffViewMode, setStaffViewMode] = useState('table'); // 'table' | 'cards'
  const [selectedStylistId, setSelectedStylistId] = useState('all'); // 'all' or stylist.id

  // Staff tracking state
  const [staffData, setStaffData] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffLog, setSelectedStaffLog] = useState(null);

  // Customer tracking state & pagination
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerHistoryPages, setCustomerHistoryPages] = useState({});
  const itemsPerPage = 5;
  const historyPerPage = 4;

  // Fetch Staff Tracking
  const fetchStaffTracking = async (tf = timeframe, start = customStartDate, end = customEndDate) => {
    setLoadingStaff(true);
    try {
      const params = {};
      if (selectedBranchId && selectedBranchId !== 'all') {
        params.branch_id = selectedBranchId;
      }
      const res = await Admin_Get_Staff_Tracking(tf, start, end, params).catch(() => null);
      if (res?.data?.data && res.data.data.staff_data?.length > 0) {
        // Enhance API response with fallback metrics if missing
        let apiStaff = res.data.data.staff_data.map(st => {
          const rev = parseFloat(st.total_revenue) || 0;
          const servs = parseInt(st.total_appointments) || 0;
          return {
            ...st,
            total_revenue: rev,
            avg_ticket: servs > 0 ? Math.round(rev / servs) : 0,
            est_commission: Math.round(rev * 0.10)
          };
        });
        if (selectedBranchId !== 'all') {
          apiStaff = apiStaff.filter(st => !st.branch_id || String(st.branch_id) === String(selectedBranchId));
        }
        setStaffData({
          ...res.data.data,
          total_revenue_generated: apiStaff.reduce((acc, s) => acc + s.total_revenue, 0),
          total_services_count: apiStaff.reduce((acc, s) => acc + (s.total_appointments || 0), 0),
          staff_data: apiStaff
        });
      } else {
        calculateStaffDataFallback(tf, start, end);
      }
    } finally {
      setLoadingStaff(false);
    }
  };

  // Fallback staff calculator using appointments & stylists props
  const calculateStaffDataFallback = (tf = timeframe, customStart = customStartDate, customEnd = customEndDate) => {
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toDateString();

    const branchFilteredApps = (appointments || []).filter(a => {
      if (!a) return false;
      if (selectedBranchId !== 'all' && a.branch_id && String(a.branch_id) !== String(selectedBranchId)) {
        return false;
      }
      return true;
    });

    const filteredApps = branchFilteredApps.filter(a => {
      const dStr = a.appointment_date || a.created_at;
      if (!dStr) return true;
      const appDate = new Date(dStr);
      const appDateOnlyStr = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate()).toDateString();

      if (tf === 'day') {
        return appDateOnlyStr === todayStr;
      } else if (tf === 'yesterday') {
        return appDateOnlyStr === yesterdayStr;
      } else if (tf === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return appDate >= oneWeekAgo;
      } else if (tf === 'month') {
        return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
      } else if (tf === 'custom') {
        if (customStart && customEnd) {
          const s = new Date(customStart);
          const e = new Date(customEnd);
          e.setHours(23, 59, 59, 999);
          return appDate >= s && appDate <= e;
        } else if (customStart) {
          const s = new Date(customStart);
          return appDateOnlyStr === new Date(s.getFullYear(), s.getMonth(), s.getDate()).toDateString();
        }
      }
      return true;
    });

    const branchFilteredStylists = (stylists || []).filter(st => {
      if (!st) return false;
      if (selectedBranchId !== 'all' && st.branch_id && String(st.branch_id) !== String(selectedBranchId)) {
        return false;
      }
      return true;
    });

    const staffList = branchFilteredStylists.map(st => {
      const stApps = filteredApps.filter(a =>
        String(a.stylist_id) === String(st.id) ||
        a.stylist_name === st.name ||
        String(a.assigned_staff_id) === String(st.id)
      );
      const custIds = new Set(stApps.map(a => a.customer_id || a.customer_phone || a.customer_name));
      const rev = stApps.reduce((acc, a) => acc + (parseFloat(a.total_amount) || parseFloat(a.service_price) || 0), 0);
      const totalServices = stApps.length;
      const avgTicket = totalServices > 0 ? (rev / totalServices) : 0;
      const estCommission = rev * 0.10; // 10% commission payout

      return {
        id: st.id,
        name: st.name,
        phone: st.phone,
        specialization: st.specialization || st.role || 'Hair & Styling Specialist',
        rating: st.rating || 5.0,
        is_available: st.is_available ?? true,
        customers_served: custIds.size,
        total_appointments: totalServices,
        completed_count: stApps.filter(a => a.status === 'Completed' || a.status === 'Paid').length,
        total_revenue: Math.round(rev),
        avg_ticket: Math.round(avgTicket),
        est_commission: Math.round(estCommission),
        service_logs: stApps
      };
    });

    const totalRev = staffList.reduce((acc, s) => acc + s.total_revenue, 0);
    const totalCusts = staffList.reduce((acc, s) => acc + s.customers_served, 0);
    const totalServicesCount = staffList.reduce((acc, s) => acc + s.total_appointments, 0);
    const avgStaffRev = staffList.length > 0 ? Math.round(totalRev / staffList.length) : 0;

    setStaffData({
      timeframe: tf,
      total_staff: stylists.length,
      total_customers_served: totalCusts,
      total_services_count: totalServicesCount,
      total_revenue_generated: totalRev,
      avg_staff_revenue: avgStaffRev,
      staff_data: staffList
    });
  };

  // Helper: Get Daily Breakdown for a Specific Stylist
  const getStylistDailyBreakdown = (st) => {
    if (!st || !st.service_logs || st.service_logs.length === 0) return [];
    const map = {};
    st.service_logs.forEach(l => {
      const dStr = l.appointment_date || l.created_at;
      const key = dStr ? new Date(dStr).toISOString().split('T')[0] : 'Today';
      if (!map[key]) {
        map[key] = {
          dateKey: key,
          dateFormatted: dStr ? new Date(dStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' }) : 'Today',
          custSet: new Set(),
          servicesCount: 0,
          revenue: 0,
          serviceNames: [],
          logs: []
        };
      }
      const dayObj = map[key];
      if (l.customer_id || l.customer_phone || l.customer_name) {
        dayObj.custSet.add(l.customer_id || l.customer_phone || l.customer_name);
      }
      dayObj.servicesCount += 1;
      dayObj.revenue += (parseFloat(l.total_amount) || parseFloat(l.service_price) || 0);
      if (l.service_name && !dayObj.serviceNames.includes(l.service_name)) {
        dayObj.serviceNames.push(l.service_name);
      }
      dayObj.logs.push(l);
    });

    // Sort by date desc
    return Object.values(map).sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey));
  };

  // Export Staff Performance Report to CSV
  const handleExportStaffCSV = () => {
    if (!staffData || !staffData.staff_data || staffData.staff_data.length === 0) {
      alert('No staff revenue data available to export for the selected period.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    if (selectedStylistId !== 'all') {
      const activeSt = (staffData.staff_data || []).find(s => String(s.id) === String(selectedStylistId));
      if (!activeSt) return;
      const dailyBreakdown = getStylistDailyBreakdown(activeSt);
      csvContent += `Stylist Name: "${activeSt.name}" - Revenue Breakdown Report\n`;
      csvContent += "Date,Day,Customers Served,Services Given,Services Names,Daily Revenue (INR),Est Commission (INR)\n";
      dailyBreakdown.forEach(d => {
        csvContent += `"${d.dateKey}","${d.dateFormatted}",${d.custSet.size},${d.servicesCount},"${d.serviceNames.join(' | ')}",${d.revenue},${Math.round(d.revenue * 0.10)}\n`;
      });
    } else {
      csvContent += "Staff ID,Staff Name,Specialization,Customers Served,Total Services,Gross Revenue (INR),Avg Ticket Value (INR),Est Commission (INR),Status\n";
      staffData.staff_data.forEach(st => {
        csvContent += `"${st.id}","${st.name}","${st.specialization}",${st.customers_served},${st.total_appointments},${st.total_revenue},${st.avg_ticket || 0},${st.est_commission || 0},"${st.is_available ? 'Available' : 'Busy'}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const timeLabel = timeframe === 'custom' ? `${customStartDate}_to_${customEndDate}` : timeframe;
    const nameLabel = selectedStylistId !== 'all' ? `Stylist_${selectedStylistId}` : 'All_Staff';
    link.setAttribute("download", `Revenue_Report_${nameLabel}_${timeLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Executive PDF Staff Report
  const handlePrintStaffReport = (specificStaff = null) => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to view and print the staff performance report.');
      return;
    }

    const reportDateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const periodText = timeframe === 'day' ? 'Today' :
      timeframe === 'yesterday' ? 'Yesterday' :
        timeframe === 'week' ? 'This Week (Last 7 Days)' :
          timeframe === 'month' ? 'This Month' :
            timeframe === 'custom' ? `Custom Period (${customStartDate} to ${customEndDate})` : 'All Time';

    const activeSt = specificStaff || (selectedStylistId !== 'all' ? (staffData?.staff_data || []).find(s => String(s.id) === String(selectedStylistId)) : null);

    let htmlContent = '';

    if (activeSt) {
      // Individual Stylist Detailed Daily Report Template
      const dailyRows = getStylistDailyBreakdown(activeSt);
      const totalRev = dailyRows.reduce((acc, d) => acc + d.revenue, 0);
      const totalServs = dailyRows.reduce((acc, d) => acc + d.servicesCount, 0);
      const totalCusts = activeSt.customers_served;

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Stylist Daily Revenue Audit - ${activeSt.name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
            .logo-title { font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .sub-title { font-size: 13px; color: #64748b; margin-top: 3px; }
            .badge { background: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; border: 1px solid #bfdbfe; }
            .profile-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
            .summary-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
            .summary-value { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px; font-weight: 700; text-transform: uppercase; font-size: 11px; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            tr:nth-child(even) { background: #f8fafc; }
            .right { text-align: right; }
            .total-row { background: #f1f5f9 !important; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
            .signature-box { text-align: center; border-top: 1px dashed #94a3b8; width: 180px; padding-top: 6px; font-weight: 700; color: #334155; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo-title">✨ SalonPulse ERP & Management Portal</div>
              <div class="sub-title">Individual Stylist Daily Revenue & Commission Audit</div>
            </div>
            <div style="text-align: right;">
              <div class="badge">Period: ${periodText}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Generated: ${reportDateStr}</div>
            </div>
          </div>

          <div class="profile-card">
            <div>
              <h2 style="margin: 0 0 4px 0; font-size: 18px; color: #0f172a;">${activeSt.name}</h2>
              <div style="font-size: 12px; color: #1d4ed8; font-weight: 700;">${activeSt.specialization || 'Senior Stylist'}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Phone: ${activeSt.phone || 'N/A'} | Status: ${activeSt.is_available ? 'Active' : 'Busy'}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Earnings</div>
              <div style="font-size: 22px; font-weight: 800; color: #15803d;">₹${totalRev.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Clients Served</div>
              <div class="summary-value">${totalCusts} Clients</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Services Provided</div>
              <div class="summary-value">${totalServs} Services</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Average Ticket Price</div>
              <div class="summary-value">₹${Math.round(totalServs > 0 ? totalRev / totalServs : 0).toLocaleString('en-IN')}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Est. Commission (10%)</div>
              <div class="summary-value" style="color: #1d4ed8;">₹${Math.round(totalRev * 0.10).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 10px;">Day-By-Day Revenue Timeline</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date & Day</th>
                <th class="right">Clients</th>
                <th class="right">Services Count</th>
                <th>Services Rendered</th>
                <th class="right">Day Revenue (₹)</th>
                <th class="right">Est Comm (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${dailyRows.map((d, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${d.dateFormatted}</strong></td>
                  <td class="right">${d.custSet.size}</td>
                  <td class="right">${d.servicesCount}</td>
                  <td>${d.serviceNames.join(', ') || 'Salon Services'}</td>
                  <td class="right" style="font-weight: 700; color: #047857;">₹${d.revenue.toLocaleString('en-IN')}</td>
                  <td class="right" style="font-weight: 700; color: #1d4ed8;">₹${Math.round(d.revenue * 0.10).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2">TOTAL STYLIST SUMMARY</td>
                <td class="right">${totalCusts}</td>
                <td class="right">${totalServs}</td>
                <td>Overall Period Activity</td>
                <td class="right" style="color: #047857;">₹${totalRev.toLocaleString('en-IN')}</td>
                <td class="right" style="color: #1d4ed8;">₹${Math.round(totalRev * 0.10).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div>
              <p style="margin: 0;">Verified Stylist Performance Slip</p>
              <p style="margin: 3px 0 0 0;">SalonPulse Enterprise ERP Audit System</p>
            </div>
            <div class="signature-box">
              Stylist Signature & Date
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;
    } else {
      // All Staff Overview Template
      const staffListToPrint = staffData?.staff_data || [];
      const totalRev = staffListToPrint.reduce((acc, s) => acc + (s.total_revenue || 0), 0);
      const totalServs = staffListToPrint.reduce((acc, s) => acc + (s.total_appointments || 0), 0);
      const totalCusts = staffListToPrint.reduce((acc, s) => acc + (s.customers_served || 0), 0);

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Staff Revenue & Performance Report - SalonPulse ERP</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
            .logo-title { font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .sub-title { font-size: 13px; color: #64748b; margin-top: 3px; }
            .badge { background: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; border: 1px solid #bfdbfe; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
            .summary-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
            .summary-value { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px; font-weight: 700; text-transform: uppercase; font-size: 11px; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            tr:nth-child(even) { background: #f8fafc; }
            .right { text-align: right; }
            .total-row { background: #f1f5f9 !important; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
            .signature-box { text-align: center; border-top: 1px dashed #94a3b8; width: 180px; padding-top: 6px; font-weight: 700; color: #334155; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo-title">✨ SalonPulse ERP & Management Portal</div>
              <div class="sub-title">Staff Revenue & Service Performance Audit Report</div>
            </div>
            <div style="text-align: right;">
              <div class="badge">Time Period: ${periodText}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Generated Date: ${reportDateStr}</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Total Staff Evaluated</div>
              <div class="summary-value">${staffListToPrint.length} Stylists</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Clients Served</div>
              <div class="summary-value">${totalCusts} Clients</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Services Rendered</div>
              <div class="summary-value">${totalServs} Services</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Revenue Earned</div>
              <div class="summary-value" style="color: #15803d;">₹${totalRev.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 10px;">Staff Earnings & Revenue Audit Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Staff Name</th>
                <th>Specialization</th>
                <th class="right">Clients Served</th>
                <th class="right">Services Given</th>
                <th class="right">Avg Ticket (₹)</th>
                <th class="right">Total Revenue (₹)</th>
                <th class="right">Est. Payout / Comm (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${staffListToPrint.map((s, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${s.name}</strong></td>
                  <td>${s.specialization || 'Stylist'}</td>
                  <td class="right">${s.customers_served}</td>
                  <td class="right">${s.total_appointments}</td>
                  <td class="right">₹${(s.avg_ticket || 0).toLocaleString('en-IN')}</td>
                  <td class="right" style="font-weight: 700; color: #047857;">₹${(s.total_revenue || 0).toLocaleString('en-IN')}</td>
                  <td class="right" style="font-weight: 700; color: #1d4ed8;">₹${(s.est_commission || 0).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">GRAND TOTAL SUMMARY</td>
                <td class="right">${totalCusts}</td>
                <td class="right">${totalServs}</td>
                <td class="right">₹${Math.round(totalServs > 0 ? totalRev / totalServs : 0).toLocaleString('en-IN')}</td>
                <td class="right" style="color: #047857;">₹${totalRev.toLocaleString('en-IN')}</td>
                <td class="right" style="color: #1d4ed8;">₹${Math.round(totalRev * 0.10).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div>
              <p style="margin: 0;">Verified Official Executive Staff Tracking Document</p>
              <p style="margin: 3px 0 0 0;">SalonPulse Enterprise ERP — Automated System Audit</p>
            </div>
            <div class="signature-box">
              Salon Manager Signature
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;
    }

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  // Fetch Customer Tracking
  const fetchCustomerTracking = async (q = customerSearch) => {
    setLoadingCustomer(true);
    try {
      const res = await Admin_Get_Customer_Tracking(q).catch(() => null);
      if (res?.data?.data) {
        setCustomerData(res.data.data);
      } else {
        calculateCustomerDataFallback(q);
      }
    } finally {
      setLoadingCustomer(false);
    }
  };

  // Fallback customer tracking calculator
  const calculateCustomerDataFallback = (q) => {
    const queryStr = String(q || '').toLowerCase().trim();
    let matchedCusts = (customers || []).filter(c => {
      if (!c) return false;
      if (selectedBranchId !== 'all' && c.branch_id && String(c.branch_id) !== String(selectedBranchId)) {
        return false;
      }
      return true;
    });

    if (queryStr) {
      matchedCusts = matchedCusts.filter(c =>
        String(c.name || '').toLowerCase().includes(queryStr) ||
        String(c.phone || '').includes(queryStr)
      );
    }

    const tracked = matchedCusts.map(cust => {
      const custApps = (appointments || []).filter(a =>
        (selectedBranchId === 'all' || !a.branch_id || String(a.branch_id) === String(selectedBranchId)) &&
        (String(a.customer_id) === String(cust.id) || String(a.customer_phone) === String(cust.phone))
      );
      const custBills = (bills || []).filter(b =>
        (selectedBranchId === 'all' || !b.branch_id || String(b.branch_id) === String(selectedBranchId)) &&
        (String(b.customer_id) === String(cust.id) || String(b.customer_phone) === String(cust.phone))
      );
      const totalVisits = custApps.length || custBills.length || 1;
      const totalSpent = custApps.reduce((acc, a) => acc + (parseFloat(a.total_amount) || 0), 0) || custBills.reduce((acc, b) => acc + (parseFloat(b.grand_total) || 0), 0);
      const lastVisitDate = custApps[0]?.appointment_date || cust.created_at || 'Recent';

      return {
        id: cust.id,
        name: cust.name,
        phone: cust.phone,
        email: cust.email || '',
        gender: cust.gender || 'Customer',
        loyalty_points: cust.loyalty_points || 0,
        notes: cust.notes || '',
        total_visits: totalVisits,
        total_spent: totalSpent,
        last_visit_date: lastVisitDate,
        avg_frequency_days: totalVisits >= 2 ? 15 : null,
        visit_history: custApps,
        billing_history: custBills
      };
    });

    setCustomerData({ query: q, results: tracked });
  };

  useEffect(() => {
    fetchStaffTracking(timeframe, customStartDate, customEndDate);
  }, [timeframe, customStartDate, customEndDate, stylists.length, appointments.length, selectedBranchId]);

  useEffect(() => {
    setCustomerPage(1);
    const timer = setTimeout(() => {
      fetchCustomerTracking(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, customers.length, appointments.length, selectedBranchId]);

  // Derived customer pagination values
  const allCustomerResults = customerData?.results || [];
  const totalCustomerCount = allCustomerResults.length;
  const totalPages = Math.ceil(totalCustomerCount / itemsPerPage) || 1;
  const paginatedCustomers = allCustomerResults.slice(
    (customerPage - 1) * itemsPerPage,
    customerPage * itemsPerPage
  );

  // Active Stylist Object when individual stylist selected
  const activeSelectedStylist = selectedStylistId !== 'all' ? (staffData?.staff_data || []).find(s => String(s.id) === String(selectedStylistId)) : null;

  return (
    <div>
      {/* ─── MODULE HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-gold)' }} />
            Staff & Customer Tracking & Revenue Reports
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-sub)' }}>
            Real-time tracking of overall staff & individual stylist service performance, daily revenue earned & exportable reports.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('staff')}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'staff' ? 'var(--accent-gold)' : 'transparent',
              color: activeTab === 'staff' ? '#000' : 'var(--text-sub)',
              transition: 'all 0.2s'
            }}
          >
            <Scissors size={14} /> Staff Performance & Revenue
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'customer' ? 'var(--accent-gold)' : 'transparent',
              color: activeTab === 'customer' ? '#000' : 'var(--text-sub)',
              transition: 'all 0.2s'
            }}
          >
            <UserCheck size={14} /> Customer Visit Frequency Tracking
          </button>
        </div>
      </div>

      {/* ─── TAB 1: STAFF PERFORMANCE & SERVICE REVENUE TRACKING ─── */}
      {activeTab === 'staff' && (
        <div>
          {/* Timeframe & Stylist Selection Bar */}
          <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>

            {/* Left: Timeperiod & Stylist Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

              {/* Stylist Selector Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} style={{ color: 'var(--accent-gold)' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-sub)' }}>Select View Mode:</span>
                <select
                  value={selectedStylistId}
                  onChange={e => setSelectedStylistId(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '7px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--accent-gold)',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">👥 All Staff Members (Salon Overview)</option>
                  {(staffData?.staff_data || stylists || []).map(st => (
                    <option key={st.id} value={st.id}>
                      ✂️ {st.name} ({st.specialization || 'Stylist'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Period Buttons */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {[
                  { id: 'day', label: 'Today' },
                  // { id: 'yesterday', label: 'Yesterday (Kal)' },
                  { id: 'week', label: 'This Week' },
                  { id: 'month', label: 'This Month' },
                  { id: 'all', label: 'All Time' },
                  { id: 'custom', label: 'Custom Date Filter' }
                ].map(tf => (
                  <button
                    key={tf.id}
                    onClick={() => setTimeframe(tf.id)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      border: '1px solid',
                      borderColor: timeframe === tf.id ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)',
                      background: timeframe === tf.id ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: timeframe === tf.id ? 'var(--accent-gold)' : 'var(--text-sub)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: View Switcher & Export Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {selectedStylistId === 'all' && (
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setStaffViewMode('table')}
                    title="Table View"
                    style={{
                      padding: '4px 8px', borderRadius: '4px', border: 'none',
                      background: staffViewMode === 'table' ? 'rgba(255,215,0,0.2)' : 'transparent',
                      color: staffViewMode === 'table' ? 'var(--accent-gold)' : 'var(--text-sub)',
                      cursor: 'pointer'
                    }}
                  >
                    <Table size={14} />
                  </button>
                  <button
                    onClick={() => setStaffViewMode('cards')}
                    title="Grid Cards View"
                    style={{
                      padding: '4px 8px', borderRadius: '4px', border: 'none',
                      background: staffViewMode === 'cards' ? 'rgba(255,215,0,0.2)' : 'transparent',
                      color: staffViewMode === 'cards' ? 'var(--accent-gold)' : 'var(--text-sub)',
                      cursor: 'pointer'
                    }}
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
              )}

              <button
                onClick={handleExportStaffCSV}
                className="btn-secondary"
                style={{
                  padding: '6px 12px', borderRadius: '7px', fontSize: '0.76rem', fontWeight: '700',
                  display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981', border: '1px solid #10b981', cursor: 'pointer'
                }}
              >
                <Download size={14} /> Export CSV
              </button>

              <button
                onClick={() => handlePrintStaffReport()}
                className="btn-secondary"
                style={{
                  padding: '6px 12px', borderRadius: '7px', fontSize: '0.76rem', fontWeight: '700',
                  display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(37, 99, 235, 0.1)',
                  color: '#38bdf8', border: '1px solid #2563eb', cursor: 'pointer'
                }}
              >
                <Printer size={14} /> Print PDF Report
              </button>
            </div>
          </div>

          {/* Custom Date Picker Range Row (When Custom Date Filter Selected) */}
          {timeframe === 'custom' && (
            <div className="glass-panel" style={{ padding: '12px 18px', marginBottom: '18px', background: 'rgba(255,215,0,0.03)', border: '1px solid rgba(255,215,0,0.3)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} /> Select Specific Date or Range:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-sub)' }}>From Date:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  style={{
                    padding: '5px 10px', borderRadius: '6px', background: 'var(--input-bg)',
                    border: '1px solid var(--border)', color: '#fff', fontSize: '0.78rem', outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-sub)' }}>To Date:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  style={{
                    padding: '5px 10px', borderRadius: '6px', background: 'var(--input-bg)',
                    border: '1px solid var(--border)', color: '#fff', fontSize: '0.78rem', outline: 'none'
                  }}
                />
              </div>
              <button
                onClick={() => fetchStaffTracking('custom', customStartDate, customEndDate)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', background: 'var(--accent-gold)',
                  color: '#000', fontWeight: '800', fontSize: '0.76rem', border: 'none', cursor: 'pointer'
                }}
              >
                Apply Range Filter
              </button>
            </div>
          )}

          {/* ─── CASE A: ALL STAFF MEMBERS OVERVIEW ─── */}
          {selectedStylistId === 'all' ? (
            <div>
              {/* Metrics Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div className="glass-card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Scissors size={15} style={{ color: '#818cf8' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-sub)' }}>Active Staff Stylists</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {staffData?.total_staff || stylists.length} Stylists
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <UserCheck size={15} style={{ color: '#38bdf8' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-sub)' }}>Total Customers Served</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#38bdf8' }}>
                    {staffData?.total_customers_served ?? 0} Clients
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Period: {timeframe.toUpperCase()}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Award size={15} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-sub)' }}>Total Services Executed</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>
                    {staffData?.total_services_count || 0} Services
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Services count given by staff
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <DollarSign size={15} style={{ color: 'var(--accent-gold)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-sub)' }}>Total Staff Revenue</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                    ₹{(staffData?.total_revenue_generated || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Total earnings generated
                  </div>
                </div>
              </div>

              {/* Staff Performance & Revenue Table / Cards */}
              <div className="glass-panel" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} style={{ color: 'var(--accent-gold)' }} />
                    Staff Revenue & Service Performance Audit ({timeframe === 'custom' ? `${customStartDate} to ${customEndDate}` : timeframe.toUpperCase()})
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                    Showing <strong>{staffData?.staff_data?.length || 0}</strong> Staff Members
                  </span>
                </div>

                {staffViewMode === 'table' ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-sub)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '10px 12px' }}>Staff Stylist</th>
                          <th style={{ padding: '10px 12px' }}>Specialization</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Customers Served</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Services Delivered</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Avg Ticket (₹)</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Revenue (₹)</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Est. Payout (10%)</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(staffData?.staff_data || []).map((st, idx) => (
                          <tr key={st.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '34px', height: '34px', borderRadius: '50%', background: '#2563eb',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: '800', fontSize: '0.85rem', color: '#fff'
                                }}>
                                  {st.name?.charAt(0) || 'S'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{st.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{st.phone || 'Staff ID: #' + st.id}</div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '10px 12px', color: 'var(--accent-gold)', fontWeight: '600' }}>
                              {st.specialization}
                            </td>

                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: '#38bdf8' }}>
                              {st.customers_served} Clients
                            </td>

                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: '#818cf8' }}>
                              {st.total_appointments} Services
                            </td>

                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-sub)' }}>
                              ₹{(st.avg_ticket || 0).toLocaleString('en-IN')}
                            </td>

                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--accent-gold)', fontSize: '0.85rem' }}>
                              ₹{(st.total_revenue || 0).toLocaleString('en-IN')}
                            </td>

                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>
                              ₹{(st.est_commission || 0).toLocaleString('en-IN')}
                            </td>

                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                <button
                                  onClick={() => setSelectedStylistId(st.id)}
                                  title="View Daily Breakdown for this Stylist"
                                  style={{
                                    padding: '4px 8px', borderRadius: '5px', border: '1px solid var(--accent-gold)',
                                    background: 'rgba(255, 215, 0, 0.15)', color: 'var(--accent-gold)',
                                    fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                  }}
                                >
                                  <BarChart3 size={12} /> Daily Report
                                </button>
                                <button
                                  onClick={() => setSelectedStaffLog(st)}
                                  style={{
                                    padding: '4px 8px', borderRadius: '5px', border: '1px solid rgba(255, 215, 0, 0.3)',
                                    background: 'rgba(255, 215, 0, 0.08)', color: 'var(--accent-gold)',
                                    fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                  }}
                                >
                                  <Eye size={12} /> Logs
                                </button>
                                <button
                                  onClick={() => handlePrintStaffReport(st)}
                                  style={{
                                    padding: '4px 8px', borderRadius: '5px', border: '1px solid rgba(37, 99, 235, 0.3)',
                                    background: 'rgba(37, 99, 235, 0.08)', color: '#38bdf8',
                                    fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                  }}
                                >
                                  <Printer size={12} /> Print
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Grid Cards Mode */
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                    {(staffData?.staff_data || []).map(st => (
                      <div key={st.id} className="glass-card" style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '50%',
                              background: '#2563eb',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: '800', fontSize: '0.9rem', color: '#fff'
                            }}>
                              {st.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>{st.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)' }}>{st.specialization}</div>
                            </div>
                          </div>
                          <span style={{
                            padding: '3px 8px', borderRadius: '14px', fontSize: '0.68rem', fontWeight: '800',
                            background: st.is_available ? 'rgba(37,99,235,0.15)' : 'rgba(239,68,68,0.15)',
                            color: st.is_available ? '#38bdf8' : '#ef4444', border: '1px solid'
                          }}>
                            {st.is_available ? 'Available' : 'Busy'}
                          </span>
                        </div>

                        {/* Staff Performance Metrics Pill */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '10px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Customers</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#38bdf8' }}>{st.customers_served}</div>
                          </div>
                          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Services</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#818cf8' }}>{st.total_appointments}</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Revenue</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent-gold)' }}>₹{st.total_revenue}</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedStylistId(st.id)}
                            style={{
                              padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--accent-gold)',
                              background: 'rgba(255, 215, 0, 0.15)', color: 'var(--accent-gold)',
                              fontWeight: '700', fontSize: '0.74rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                            }}
                          >
                            <BarChart3 size={13} /> Daily Report
                          </button>
                          <button
                            onClick={() => setSelectedStaffLog(st)}
                            style={{
                              padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255, 215, 0, 0.3)',
                              background: 'rgba(255, 215, 0, 0.08)', color: 'var(--accent-gold)',
                              fontWeight: '700', fontSize: '0.74rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                            }}
                          >
                            <Eye size={13} /> Logs ({st.service_logs?.length || 0})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ─── CASE B: INDIVIDUAL STYLIST DEEP-DIVE DAILY REPORT DASHBOARD ─── */
            <div>
              {activeSelectedStylist ? (
                <div>
                  {/* Top Navigation Back Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <button
                      onClick={() => setSelectedStylistId('all')}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--accent-gold)',
                        background: 'rgba(255, 215, 0, 0.12)', color: 'var(--accent-gold)',
                        fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <ArrowLeft size={15} /> Back to All Staff Overview
                    </button>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                      Viewing Detailed Revenue Audit for: <strong style={{ color: 'var(--accent-gold)' }}>{activeSelectedStylist.name}</strong>
                    </div>
                  </div>

                  {/* Stylist Profile & Performance Highlights Banner */}
                  <div className="glass-panel" style={{ padding: '18px', marginBottom: '18px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '50px', height: '50px', borderRadius: '50%', background: '#2563eb',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '800', fontSize: '1.3rem', color: '#fff'
                        }}>
                          {activeSelectedStylist.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {activeSelectedStylist.name}
                            <span style={{
                              padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: '800',
                              background: activeSelectedStylist.is_available ? 'rgba(37,99,235,0.15)' : 'rgba(239,68,68,0.15)',
                              color: activeSelectedStylist.is_available ? '#38bdf8' : '#ef4444', border: '1px solid'
                            }}>
                              {activeSelectedStylist.is_available ? 'Available' : 'Busy'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', marginTop: '2px' }}>
                            {activeSelectedStylist.specialization} • Rating: ⭐ {activeSelectedStylist.rating}
                          </div>
                        </div>
                      </div>

                      {/* Stylist Summary Badges */}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ padding: '8px 14px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid #2563eb', borderRadius: '9px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>Customers Served</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#38bdf8' }}>{activeSelectedStylist.customers_served} Clients</div>
                        </div>
                        <div style={{ padding: '8px 14px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid #818cf8', borderRadius: '9px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>Services Delivered</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#818cf8' }}>{activeSelectedStylist.total_appointments} Services</div>
                        </div>
                        <div style={{ padding: '8px 14px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid var(--accent-gold)', borderRadius: '9px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>Total Revenue</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-gold)' }}>₹{(activeSelectedStylist.total_revenue || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ padding: '8px 14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '9px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>Est. Commission (10%)</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#10b981' }}>₹{(activeSelectedStylist.est_commission || 0).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Day-By-Day Revenue Breakdown Timeline Table for this Stylist */}
                  <div className="glass-panel" style={{ padding: '18px', marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} style={{ color: 'var(--accent-gold)' }} />
                      Day-by-Day Revenue & Service Breakdown ({timeframe === 'custom' ? `${customStartDate} to ${customEndDate}` : timeframe.toUpperCase()})
                    </h3>

                    {getStylistDailyBreakdown(activeSelectedStylist).length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-sub)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: '10px 12px' }}>Date & Day</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Customers Served</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Services Rendered Count</th>
                              <th style={{ padding: '10px 12px' }}>Service Items Provided</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Daily Gross Revenue (₹)</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Est. Daily Payout (10%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getStylistDailyBreakdown(activeSelectedStylist).map((dayObj, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-main)' }}>
                                  {dayObj.dateFormatted}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: '#38bdf8' }}>
                                  {dayObj.custSet.size} Clients
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: '#818cf8' }}>
                                  {dayObj.servicesCount} Services
                                </td>
                                <td style={{ padding: '10px 12px', color: 'var(--text-sub)' }}>
                                  {dayObj.serviceNames.join(', ') || 'Salon Services'}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--accent-gold)', fontSize: '0.85rem' }}>
                                  ₹{dayObj.revenue.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>
                                  ₹{Math.round(dayObj.revenue * 0.10).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No daily service or revenue records found for {activeSelectedStylist.name} in this date period.
                      </div>
                    )}
                  </div>

                  {/* Complete Service Receipt Logs for this Stylist */}
                  <div className="glass-panel" style={{ padding: '18px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} style={{ color: 'var(--accent-gold)' }} />
                      Detailed Service Receipts & Appointment Logs ({activeSelectedStylist.service_logs?.length || 0} Records)
                    </h3>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-sub)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '8px 12px' }}>Date & Time</th>
                            <th style={{ padding: '8px 12px' }}>Customer Name</th>
                            <th style={{ padding: '8px 12px' }}>Service Name</th>
                            <th style={{ padding: '8px 12px' }}>Status</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount Paid (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeSelectedStylist.service_logs || []).map((l, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--text-main)', fontWeight: '700' }}>
                                {l.appointment_date ? new Date(l.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '6px' }}>{l.appointment_time || ''}</span>
                              </td>
                              <td style={{ padding: '8px 12px', color: '#38bdf8', fontWeight: '700' }}>
                                {l.customer_name} {l.customer_phone ? `(${l.customer_phone})` : ''}
                              </td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-sub)' }}>
                                {l.service_name || 'Salon Service'}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{
                                  padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '700',
                                  background: 'rgba(16,185,129,0.15)', color: '#10b981'
                                }}>
                                  {l.status || 'Completed'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--accent-gold)' }}>
                                ₹{(parseFloat(l.total_amount) || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Stylist not found.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: CUSTOMER VISIT FREQUENCY & TRACKING ─── */}
      {activeTab === 'customer' && (
        <div>
          {/* Customer Search Box */}
          <div className="glass-panel" style={{ padding: '16px 18px', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={16} style={{ color: 'var(--accent-gold)' }} />
              Search & Track Customer Visit Records
            </h3>

            <div style={{ position: 'relative', maxWidth: '480px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Enter Customer Name or Mobile Phone Number (e.g. 9876543210)..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--accent-gold)',
                  borderRadius: '9px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
              />
              {customerSearch && (
                <button onClick={() => setCustomerSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Customer Results List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {paginatedCustomers.map(cust => {
              const hPage = customerHistoryPages[cust.id] || 1;
              const totalVh = cust.visit_history?.length || 0;
              const totalVhPages = Math.ceil(totalVh / historyPerPage) || 1;
              const paginatedVh = (cust.visit_history || []).slice(
                (hPage - 1) * historyPerPage,
                hPage * historyPerPage
              );

              return (
                <div key={cust.id} className="glass-panel" style={{ padding: '18px', border: '1px solid rgba(37, 99, 235, 0.25)' }}>

                  {/* Customer Top Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: '#2563eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '800', fontSize: '1rem', color: '#fff'
                      }}>
                        {cust.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {cust.name}
                          <span style={{
                            fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px',
                            background: 'rgba(255, 215, 0, 0.15)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', fontWeight: '700'
                          }}>
                            {cust.total_visits > 3 ? 'VIP Regular Client' : 'Walk-in Client'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '2px' }}>
                          <span><Phone size={11} style={{ display: 'inline', marginRight: '3px' }} /> {cust.phone}</span>
                          {cust.email && <span><Mail size={11} style={{ display: 'inline', marginRight: '3px' }} /> {cust.email}</span>}
                        </div>
                      </div>
                    </div>

                    {/* High Level Visit Stats Badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ padding: '6px 12px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid #2563eb', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>Total Visits</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#38bdf8' }}>{cust.total_visits} Times</div>
                      </div>

                      <div style={{ padding: '6px 12px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid var(--accent-gold)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>Total Spent</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--accent-gold)' }}>₹{cust.total_spent?.toLocaleString('en-IN')}</div>
                      </div>

                      {cust.avg_frequency_days && (
                        <div style={{ padding: '6px 12px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid #818cf8', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>Visit Frequency</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#818cf8' }}>Every ~{cust.avg_frequency_days} Days</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visit History Log Table */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} style={{ color: 'var(--accent-gold)' }} />
                      Complete Visit History & Service Log ({totalVh} Records)
                    </h4>

                    {cust.visit_history && cust.visit_history.length > 0 ? (
                      <div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                            <thead>
                              <tr style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-sub)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '6px 10px' }}>Date & Time</th>
                                <th style={{ padding: '6px 10px' }}>Service Taken</th>
                                <th style={{ padding: '6px 10px' }}>Assigned Stylist / Staff</th>
                                <th style={{ padding: '6px 10px' }}>Status</th>
                                <th style={{ padding: '6px 10px', textAlign: 'right' }}>Amount Paid</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedVh.map((vh, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '6px 10px', fontWeight: '700', color: 'var(--text-main)' }}>
                                    {vh.appointment_date ? new Date(vh.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '6px' }}>{vh.appointment_time || ''}</span>
                                  </td>
                                  <td style={{ padding: '6px 10px', color: '#38bdf8', fontWeight: '700' }}>
                                    {vh.service_name || 'Salon Service'}
                                  </td>
                                  <td style={{ padding: '6px 10px', color: 'var(--text-sub)' }}>
                                    {vh.stylist_name || 'Assigned Staff'}
                                  </td>
                                  <td style={{ padding: '6px 10px' }}>
                                    <span style={{
                                      padding: '2px 6px', borderRadius: '5px', fontSize: '0.68rem', fontWeight: '700',
                                      background: vh.status === 'Completed' ? 'rgba(37,99,235,0.15)' : 'rgba(255,215,0,0.15)',
                                      color: vh.status === 'Completed' ? '#38bdf8' : 'var(--accent-gold)'
                                    }}>
                                      {vh.status || 'Completed'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '800', color: 'var(--accent-gold)' }}>
                                    ₹{vh.total_amount || 0}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Per-Customer History Table Pagination */}
                        {totalVhPages > 1 && (
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)'
                          }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                              Showing <strong>{(hPage - 1) * historyPerPage + 1}</strong> - <strong>{Math.min(hPage * historyPerPage, totalVh)}</strong> of <strong>{totalVh}</strong> Visit Logs
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                disabled={hPage <= 1}
                                onClick={() => setCustomerHistoryPages(prev => ({ ...prev, [cust.id]: Math.max((prev[cust.id] || 1) - 1, 1) }))}
                                style={{
                                  padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)',
                                  background: hPage <= 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                                  color: hPage <= 1 ? 'var(--text-muted)' : '#fff',
                                  cursor: hPage <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem',
                                  display: 'flex', alignItems: 'center', gap: '2px'
                                }}
                              >
                                <ChevronLeft size={12} /> Prev
                              </button>
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-gold)', padding: '0 6px' }}>
                                Page {hPage} of {totalVhPages}
                              </span>
                              <button
                                disabled={hPage >= totalVhPages}
                                onClick={() => setCustomerHistoryPages(prev => ({ ...prev, [cust.id]: Math.min((prev[cust.id] || 1) + 1, totalVhPages) }))}
                                style={{
                                  padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)',
                                  background: hPage >= totalVhPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                                  color: hPage >= totalVhPages ? 'var(--text-muted)' : '#fff',
                                  cursor: hPage >= totalVhPages ? 'not-allowed' : 'pointer', fontSize: '0.7rem',
                                  display: 'flex', alignItems: 'center', gap: '2px'
                                }}
                              >
                                Next <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                        No past appointment records found for this customer.
                      </div>
                    )}
                  </div>

                </div>
              );
            })}

            {(!customerData?.results || customerData.results.length === 0) && (
              <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No customer visit records match your search criteria "{customerSearch}".
              </div>
            )}

            {/* Pagination Controls for Customer Cards List */}
            {totalCustomerCount > 0 && (
              <div className="glass-panel" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px', marginTop: '8px', borderRadius: '10px', flexWrap: 'wrap', gap: '10px'
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                  Showing <strong>{Math.min((customerPage - 1) * itemsPerPage + 1, totalCustomerCount)}</strong> - <strong>{Math.min(customerPage * itemsPerPage, totalCustomerCount)}</strong> of <strong>{totalCustomerCount}</strong> Customers
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    disabled={customerPage <= 1}
                    onClick={() => setCustomerPage(prev => Math.max(prev - 1, 1))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: customerPage <= 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                      color: customerPage <= 1 ? 'var(--text-muted)' : '#fff',
                      cursor: customerPage <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--accent-gold)', padding: '0 8px' }}>
                    Page {customerPage} of {totalPages}
                  </span>

                  <button
                    disabled={customerPage >= totalPages}
                    onClick={() => setCustomerPage(prev => Math.min(prev + 1, totalPages))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: customerPage >= totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                      color: customerPage >= totalPages ? 'var(--text-muted)' : '#fff',
                      cursor: customerPage >= totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: STAFF SERVICE LOGS DRAWER ─── */}
      {selectedStaffLog && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '680px', width: '94%', padding: '20px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scissors size={18} style={{ color: 'var(--accent-gold)' }} />
                  {selectedStaffLog.name} — Service History Logs
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Time Period: {timeframe === 'custom' ? `${customStartDate} to ${customEndDate}` : timeframe.toUpperCase()} | Total Revenue: ₹{(selectedStaffLog.total_revenue || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setSelectedStaffLog(null)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: '340px', overflowY: 'auto', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-sub)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 10px' }}>Date</th>
                    <th style={{ padding: '8px 10px' }}>Customer Name</th>
                    <th style={{ padding: '8px 10px' }}>Service Provided</th>
                    <th style={{ padding: '8px 10px' }}>Status</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedStaffLog.service_logs || []).map((l, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 10px', color: 'var(--text-main)', fontWeight: '600' }}>
                        {l.appointment_date ? new Date(l.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Today'}
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{l.appointment_time || ''}</span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#38bdf8', fontWeight: '700' }}>
                        {l.customer_name} {l.customer_phone ? `(${l.customer_phone})` : ''}
                      </td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-sub)' }}>
                        {l.service_name || 'Salon Service'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '700',
                          background: 'rgba(16,185,129,0.15)', color: '#10b981'
                        }}>
                          {l.status || 'Completed'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '800', color: 'var(--accent-gold)' }}>
                        ₹{(parseFloat(l.total_amount) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {(!selectedStaffLog.service_logs || selectedStaffLog.service_logs.length === 0) && (
                    <tr>
                      <td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No individual service log records found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => handlePrintStaffReport(selectedStaffLog)}
                className="btn-secondary"
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.76rem', color: '#38bdf8', border: '1px solid #2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Printer size={13} /> Print Staff Statement PDF
              </button>

              <button className="btn-secondary" onClick={() => setSelectedStaffLog(null)} style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '0.78rem' }}>
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffCustomerTrackingView;

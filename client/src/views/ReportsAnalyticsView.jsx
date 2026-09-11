import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, DollarSign, Package, Clock, Award,
  RefreshCw, Download, Calendar, ArrowUpRight, Scissors, PieChart,
  CheckCircle, AlertCircle, Sparkles, Filter, ChevronRight, UserCheck
} from 'lucide-react';
import {
  Admin_Get_Revenue_Analytics,
  Admin_Get_Staff_Performance_Analytics,
  Admin_Get_Inventory_Margins_Analytics,
  Admin_Get_Customer_Retention_Analytics,
  Admin_Get_Popularity_Peak_Hours_Analytics
} from '../services/apiService';

const ReportsAnalyticsView = () => {
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue', 'staff', 'inventory', 'retention', 'popularity'
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [inventoryData, setInventoryData] = useState(null);
  const [retentionData, setRetentionData] = useState(null);
  const [popularityData, setPopularityData] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, staffRes, invRes, retRes, popRes] = await Promise.all([
        Admin_Get_Revenue_Analytics(),
        Admin_Get_Staff_Performance_Analytics(),
        Admin_Get_Inventory_Margins_Analytics(),
        Admin_Get_Customer_Retention_Analytics(),
        Admin_Get_Popularity_Peak_Hours_Analytics()
      ]);

      if (revRes.data?.success) setRevenueData(revRes.data.data);
      if (staffRes.data?.success) setStaffData(staffRes.data.data);
      if (invRes.data?.success) setInventoryData(invRes.data.data);
      if (retRes.data?.success) setRetentionData(retRes.data.data);
      if (popRes.data?.success) setPopularityData(popRes.data.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      showFeedback('error', 'Failed to load executive analytics reports.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
  };

  const handleExportCSV = (filename, rows) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('success', `Exported ${filename}.csv successfully!`);
  };

  const overallRev = revenueData?.overall || {};
  const todayRev = revenueData?.today || {};
  const monthRev = revenueData?.month || {};

  return (
    <div style={{ padding: '24px', color: '#fff', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <BarChart3 size={28} color="#10B981" /> Reports & Executive Analytics
          </h1>
          <p style={{ color: '#90A4AE', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Real-time revenue performance, staff commission ledger, inventory margins, customer retention & peak hours.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleExportCSV('Revenue_Report', staffData)}
            style={{
              padding: '10px 18px', background: '#1E293B', color: '#10B981',
              border: '1px solid #10B981', borderRadius: '8px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Download size={18} /> Export Ledger CSV
          </button>
          <button
            onClick={fetchData}
            style={{
              padding: '10px', background: '#1E293B', color: '#90A4AE',
              border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer'
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback.msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${feedback.type === 'error' ? '#EF4444' : '#10B981'}`,
          color: feedback.type === 'error' ? '#EF4444' : '#10B981',
          display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500'
        }}>
          {feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {feedback.msg}
        </div>
      )}

      {/* Metrics Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px', marginBottom: '28px'
      }}>
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#90A4AE', fontSize: '13px', fontWeight: '600' }}>
            <span>TOTAL GROSS REVENUE</span>
            <DollarSign size={20} color="#10B981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            ₹{parseFloat(overallRev.grand_total_revenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> {overallRev.total_bills || 0} Total POS Bills
          </div>
        </div>

        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#90A4AE', fontSize: '13px', fontWeight: '600' }}>
            <span>TODAY'S REVENUE</span>
            <Calendar size={20} color="#34D399" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            ₹{parseFloat(todayRev.today_revenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#34D399', marginTop: '4px' }}>
            {todayRev.today_bills || 0} Bills Closed Today
          </div>
        </div>

        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#90A4AE', fontSize: '13px', fontWeight: '600' }}>
            <span>THIS MONTH REVENUE</span>
            <TrendingUp size={20} color="#00B0FF" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            ₹{parseFloat(monthRev.month_revenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#00B0FF', marginTop: '4px' }}>
            Monthly Cumulative Billing
          </div>
        </div>

        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#90A4AE', fontSize: '13px', fontWeight: '600' }}>
            <span>CLIENT RETENTION RATE</span>
            <Users size={20} color="#E040FB" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            {retentionData?.retentionRatePercent || 0}%
          </div>
          <div style={{ fontSize: '12px', color: '#E040FB', marginTop: '4px' }}>
            {retentionData?.repeatCustomers || 0} Repeat Clients
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{
        display: 'flex', gap: '8px', borderBottom: '1px solid #334155',
        marginBottom: '24px', overflowX: 'auto'
      }}>
        {[
          { id: 'revenue', label: 'Revenue Performance', icon: DollarSign },
          { id: 'staff', label: 'Staff Commission Ledger', icon: Award },
          { id: 'inventory', label: 'Inventory & Profit Margins', icon: Package },
          { id: 'retention', label: 'Customer Retention & Churn', icon: Users },
          { id: 'popularity', label: 'Service Popularity & Peak Hours', icon: Scissors }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px', background: 'transparent', border: 'none',
                borderBottom: isActive ? '3px solid #10B981' : '3px solid transparent',
                color: isActive ? '#10B981' : '#90A4AE', fontWeight: isActive ? '700' : '500',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '14px', whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: REVENUE PERFORMANCE */}
      {activeTab === 'revenue' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Financial Summary */}
            <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} color="#10B981" /> Financial Revenue Summary
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0F172A', borderRadius: '8px' }}>
                  <span style={{ color: '#90A4AE' }}>Gross Subtotal:</span>
                  <span style={{ fontWeight: '700', color: '#fff' }}>₹{parseFloat(overallRev.subtotal_revenue || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0F172A', borderRadius: '8px' }}>
                  <span style={{ color: '#90A4AE' }}>Discounts & Coupons Given:</span>
                  <span style={{ fontWeight: '700', color: '#EF4444' }}>-₹{parseFloat(overallRev.total_discounts || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0F172A', borderRadius: '8px' }}>
                  <span style={{ color: '#90A4AE' }}>GST Tax Collected (CGST+SGST):</span>
                  <span style={{ fontWeight: '700', color: '#10B981' }}>+₹{parseFloat(overallRev.total_gst_tax || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0F172A', borderRadius: '8px' }}>
                  <span style={{ color: '#90A4AE' }}>Stylist Tips Collected:</span>
                  <span style={{ fontWeight: '700', color: '#FFD700' }}>+₹{parseFloat(overallRev.total_tips || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0F172A', borderRadius: '8px', border: '1px solid #10B981' }}>
                  <span style={{ color: '#10B981', fontWeight: '700' }}>Average Bill Size:</span>
                  <span style={{ fontWeight: '800', color: '#10B981' }}>₹{parseFloat(overallRev.avg_bill_size || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Modes Distribution */}
            <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} color="#00B0FF" /> Payment Gateway Distribution
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {revenueData?.paymentModes?.map(pm => (
                  <div key={pm.payment_mode} style={{ padding: '10px 14px', background: '#0F172A', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{pm.payment_mode}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{pm.count} Bills</div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#10B981' }}>
                      ₹{parseFloat(pm.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Trend Table */}
          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', fontWeight: '600', color: '#fff' }}>
              Last 7 Days Revenue Trend Log
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 16px' }}>Date</th>
                  <th style={{ padding: '14px 16px' }}>Bills Closed</th>
                  <th style={{ padding: '14px 16px' }}>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueData?.dailyTrend?.map(row => (
                  <tr key={row.date} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                    <td style={{ padding: '14px 16px', color: '#fff', fontWeight: '600' }}>{new Date(row.date).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{row.bills_count} Bills</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#10B981' }}>₹{parseFloat(row.revenue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF PERFORMANCE & COMMISSION LEDGER */}
      {activeTab === 'staff' && (
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', color: '#fff' }}>Stylist Performance Leaderboard & Earned Commission Payouts</span>
            <button
              onClick={() => handleExportCSV('Stylist_Commission_Ledger', staffData)}
              style={{ padding: '6px 12px', background: '#0F172A', border: '1px solid #10B981', color: '#10B981', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              Export CSV
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 16px' }}>Stylist Name</th>
                <th style={{ padding: '14px 16px' }}>Specialization</th>
                <th style={{ padding: '14px 16px' }}>Rating</th>
                <th style={{ padding: '14px 16px' }}>Services Handled</th>
                <th style={{ padding: '14px 16px' }}>Gross Revenue</th>
                <th style={{ padding: '14px 16px' }}>Commission Earned (10%)</th>
                <th style={{ padding: '14px 16px' }}>Tips Collected</th>
              </tr>
            </thead>
            <tbody>
              {staffData.map(st => (
                <tr key={st.stylist_id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{st.stylist_name}</td>
                  <td style={{ padding: '14px 16px', color: '#CBD5E1', fontSize: '13px' }}>{st.specialization}</td>
                  <td style={{ padding: '14px 16px', color: '#FFD700', fontWeight: '700' }}>★ {st.rating}</td>
                  <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{st.total_services_handled} Services</td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#fff' }}>₹{parseFloat(st.gross_revenue_generated).toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#10B981' }}>₹{parseFloat(st.total_commission_earned).toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#34D399' }}>₹{parseFloat(st.total_tips_received).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: INVENTORY & PROFIT MARGINS */}
      {activeTab === 'inventory' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', color: '#90A4AE', fontWeight: '600' }}>STOCK COST VALUATION</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '6px' }}>
                ₹{parseFloat(inventoryData?.stockSummary?.total_cost_value || 0).toLocaleString()}
              </div>
            </div>
            <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', color: '#90A4AE', fontWeight: '600' }}>RETAIL SELLING VALUATION</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginTop: '6px' }}>
                ₹{parseFloat(inventoryData?.stockSummary?.total_retail_value || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', fontWeight: '600', color: '#fff' }}>
              Product Gross Margin Profitability Breakdown
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 16px' }}>Product Name</th>
                  <th style={{ padding: '14px 16px' }}>Category</th>
                  <th style={{ padding: '14px 16px' }}>In Stock</th>
                  <th style={{ padding: '14px 16px' }}>Cost Price</th>
                  <th style={{ padding: '14px 16px' }}>Selling Price</th>
                  <th style={{ padding: '14px 16px' }}>Profit Margin %</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData?.productsMargin?.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{p.name}</td>
                    <td style={{ padding: '14px 16px', color: '#CBD5E1', fontSize: '13px' }}>{p.category}</td>
                    <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{p.stock} units</td>
                    <td style={{ padding: '14px 16px' }}>₹{p.cost_price}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>₹{p.selling_price}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#10B981' }}>{p.margin_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMER RETENTION & CHURN */}
      {activeTab === 'retention' && (
        <div>
          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', fontWeight: '600', color: '#fff' }}>
              Churn Risk Clients (Inactive 60+ Days)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 16px' }}>Client Name</th>
                  <th style={{ padding: '14px 16px' }}>Contact Phone</th>
                  <th style={{ padding: '14px 16px' }}>Last Visit Date</th>
                  <th style={{ padding: '14px 16px' }}>Lifetime Spend</th>
                </tr>
              </thead>
              <tbody>
                {retentionData?.churnedClients?.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{c.name}</td>
                    <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{c.phone}</td>
                    <td style={{ padding: '14px 16px', color: '#EF4444', fontSize: '13px' }}>
                      {c.last_visit_date ? new Date(c.last_visit_date).toLocaleDateString() : 'Never Visited'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#10B981' }}>₹{parseFloat(c.lifetime_spend).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SERVICE POPULARITY & PEAK HOURS */}
      {activeTab === 'popularity' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {/* Top Services */}
          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scissors size={18} color="#10B981" /> Top 10 Most Demanded Services
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {popularityData?.topServices?.map((s, idx) => (
                <div key={idx} style={{ padding: '10px 14px', background: '#0F172A', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>#{idx + 1} {s.service_name}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{s.times_booked} Times Booked</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981' }}>
                    ₹{parseFloat(s.total_revenue).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours Heat Matrix */}
          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#FFD700" /> Hourly Booking Peak Density (9 AM - 9 PM)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {popularityData?.hourlyPeak?.map(h => (
                <div key={h.hour} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '80px', fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
                    {h.hour}:00 IST
                  </span>
                  <div style={{ flex: 1, background: '#0F172A', height: '24px', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                    <div style={{
                      width: `${Math.min(100, (parseInt(h.appointment_count) / 10) * 100)}%`,
                      background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                      height: '100%', borderRadius: '4px'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff', width: '60px', textAlign: 'right' }}>
                    {h.appointment_count} slots
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportsAnalyticsView;

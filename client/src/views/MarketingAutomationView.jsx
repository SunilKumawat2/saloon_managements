import React, { useState, useEffect } from 'react';
import {
  Send, MessageSquare, Cake, Heart, Clock, Play, Plus, Edit2, CheckCircle,
  RefreshCw, Search, TrendingUp, AlertCircle, Phone, Smartphone, Tag,
  Users, Sparkles, Filter, Eye, Check, X, ShieldCheck, Mail, Zap, UserCheck
} from 'lucide-react';
import {
  Admin_Get_Marketing_Templates,
  Admin_Create_Marketing_Template,
  Admin_Update_Marketing_Template,
  Admin_Get_Marketing_Campaigns,
  Admin_Create_Marketing_Campaign,
  Admin_Send_Marketing_Campaign,
  Admin_Get_Marketing_Triggers,
  Admin_Toggle_Marketing_Trigger,
  Admin_Get_Today_Occasions,
  Admin_Get_Marketing_Logs
} from '../services/apiService';

const MarketingAutomationView = () => {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns', 'triggers', 'templates', 'logs'
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [occasions, setOccasions] = useState({ birthdays: [], anniversaries: [], inactive: [] });
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingCampaignId, setSendingCampaignId] = useState(null);

  // Modals state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: '', channel: 'WhatsApp', target_segment: 'All Clients', template_id: ''
  });

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '', channel: 'WhatsApp', subject: '', body: '', coupon_code: ''
  });

  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campRes, tempRes, trigRes, occRes, logRes] = await Promise.all([
        Admin_Get_Marketing_Campaigns(),
        Admin_Get_Marketing_Templates(),
        Admin_Get_Marketing_Triggers(),
        Admin_Get_Today_Occasions(),
        Admin_Get_Marketing_Logs()
      ]);

      if (campRes.data?.success) setCampaigns(campRes.data.campaigns);
      if (tempRes.data?.success) setTemplates(tempRes.data.templates);
      if (trigRes.data?.success) setTriggers(trigRes.data.triggers);
      if (occRes.data?.success) setOccasions(occRes.data.occasions);
      if (logRes.data?.success) setLogs(logRes.data.logs);
    } catch (err) {
      console.error('Error fetching marketing data:', err);
      showFeedback('error', 'Failed to load marketing automation data.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
  };

  // Create Campaign
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.title || !campaignForm.template_id) {
      showFeedback('error', 'Please fill campaign title and select message template');
      return;
    }
    try {
      await Admin_Create_Marketing_Campaign(campaignForm);
      showFeedback('success', 'Marketing campaign draft created successfully!');
      setIsCampaignModalOpen(false);
      setCampaignForm({ title: '', channel: 'WhatsApp', target_segment: 'All Clients', template_id: '' });
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to create campaign');
    }
  };

  // Launch / Send Campaign
  const handleSendCampaign = async (id) => {
    setSendingCampaignId(id);
    try {
      const res = await Admin_Send_Marketing_Campaign(id);
      showFeedback('success', res.data?.message || 'Campaign dispatched successfully!');
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to send campaign');
    } finally {
      setSendingCampaignId(null);
    }
  };

  // Save / Update Template
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await Admin_Update_Marketing_Template(editingTemplate.id, templateForm);
        showFeedback('success', 'Template updated successfully!');
      } else {
        await Admin_Create_Marketing_Template(templateForm);
        showFeedback('success', 'New offer template created successfully!');
      }
      setIsTemplateModalOpen(false);
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to save template');
    }
  };

  // Toggle Trigger Active state
  const handleToggleTrigger = async (id) => {
    try {
      await Admin_Toggle_Marketing_Trigger(id);
      showFeedback('success', 'Automation trigger updated');
      fetchData();
    } catch (err) {
      showFeedback('error', 'Failed to toggle trigger');
    }
  };

  // Summary Metrics
  const totalDelivered = campaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0);
  const activeTriggersCount = triggers.filter(t => t.is_active).length;

  return (
    <div style={{ padding: '24px', color: '#fff', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Send size={28} color="#10B981" /> Marketing Automation & Communication
          </h1>
          <p style={{ color: '#90A4AE', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Bulk SMS & WhatsApp campaigns, automated birthday/anniversary offer triggers, and client re-engagement.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsCampaignModalOpen(true)}
            style={{
              padding: '10px 18px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={18} /> New Campaign Blast
          </button>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setTemplateForm({ name: '', channel: 'WhatsApp', subject: '', body: '', coupon_code: '' });
              setIsTemplateModalOpen(true);
            }}
            style={{
              padding: '10px 18px', background: '#1E293B', color: '#10B981',
              border: '1px solid #10B981', borderRadius: '8px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <MessageSquare size={18} /> Create Template
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
            <span>TOTAL CAMPAIGNS</span>
            <Send size={20} color="#10B981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            {campaigns.length}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>
            SMS & WhatsApp Promotional Blasts
          </div>
        </div>

        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#90A4AE', fontSize: '13px', fontWeight: '600' }}>
            <span>MESSAGES DELIVERED</span>
            <CheckCircle size={20} color="#34D399" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            {totalDelivered.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#34D399', marginTop: '4px' }}>
            Confirmed Client Delivery
          </div>
        </div>

        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#90A4AE', fontSize: '13px', fontWeight: '600' }}>
            <span>AUTOMATION TRIGGERS</span>
            <Zap size={20} color="#FFD700" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            {activeTriggersCount} Active
          </div>
          <div style={{ fontSize: '12px', color: '#FFD700', marginTop: '4px' }}>
            Birthday, Anniversary & Re-engagement
          </div>
        </div>

        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#90A4AE', fontSize: '13px', fontWeight: '600' }}>
            <span>INACTIVE CLIENTS (30+ DAYS)</span>
            <Clock size={20} color="#E040FB" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            {occasions.inactive?.length || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#E040FB', marginTop: '4px' }}>
            Ready for Win-back Discount
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{
        display: 'flex', gap: '8px', borderBottom: '1px solid #334155',
        marginBottom: '24px', overflowX: 'auto'
      }}>
        {[
          { id: 'campaigns', label: 'Bulk Campaign Manager', icon: Send },
          { id: 'triggers', label: 'Birthday & Anniversary Triggers', icon: Cake },
          { id: 'templates', label: 'Custom Offer Templates', icon: MessageSquare },
          { id: 'logs', label: 'Delivery Audit Logs', icon: CheckCircle }
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

      {/* TAB 1: BULK CAMPAIGN MANAGER */}
      {activeTab === 'campaigns' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>
              Promotional Campaigns & Messaging Blasts
            </h3>
            <button
              onClick={() => setIsCampaignModalOpen(true)}
              style={{
                padding: '8px 16px', background: '#1E293B', color: '#10B981',
                border: '1px solid #10B981', borderRadius: '8px', fontWeight: '600',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Plus size={16} /> Create Campaign
            </button>
          </div>

          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 16px' }}>Campaign Title</th>
                  <th style={{ padding: '14px 16px' }}>Channel</th>
                  <th style={{ padding: '14px 16px' }}>Audience Segment</th>
                  <th style={{ padding: '14px 16px' }}>Template Used</th>
                  <th style={{ padding: '14px 16px' }}>Delivered</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(camp => (
                  <tr key={camp.id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{camp.title}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                        background: camp.channel === 'WhatsApp' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                        color: camp.channel === 'WhatsApp' ? '#10B981' : '#6366F1'
                      }}>
                        {camp.channel}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#CBD5E1' }}>{camp.target_segment}</td>
                    <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '13px' }}>{camp.template_name || 'Standard Offer'}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#10B981' }}>{camp.delivered_count} msgs</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                        background: camp.status === 'Completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: camp.status === 'Completed' ? '#10B981' : '#F59E0B'
                      }}>
                        {camp.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {camp.status === 'Draft' ? (
                        <button
                          onClick={() => handleSendCampaign(camp.id)}
                          disabled={sendingCampaignId === camp.id}
                          style={{
                            padding: '6px 14px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '700',
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px'
                          }}
                        >
                          <Play size={14} /> Send Blast
                        </button>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '12px' }}>✓ Sent</span>
                      )}
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#90A4AE' }}>
                      No campaigns created yet. Click "Create Campaign" to broadcast offer alerts!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BIRTHDAY & ANNIVERSARY TRIGGERS */}
      {activeTab === 'triggers' && (
        <div>
          {/* Spotlight: Today's Occasions */}
          <div style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '1px solid #10B981', borderRadius: '16px', padding: '24px', marginBottom: '28px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#10B981', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cake size={22} /> Today's Birthday & Anniversary Spotlight
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Birthdays Today */}
              <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#FFD700', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cake size={16} /> Birthdays Today ({occasions.birthdays.length})
                </h4>
                {occasions.birthdays.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {occasions.birthdays.map(b => (
                      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#1E293B', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{b.name}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{b.phone}</div>
                        </div>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,215,0,0.15)', color: '#FFD700', fontWeight: '700' }}>
                          BDAY20 Auto Coupon
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>No birthdays recorded for today.</p>
                )}
              </div>

              {/* Anniversaries Today */}
              <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#E040FB', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Heart size={16} /> Anniversaries Today ({occasions.anniversaries.length})
                </h4>
                {occasions.anniversaries.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {occasions.anniversaries.map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#1E293B', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{a.name}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{a.phone}</div>
                        </div>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(224,64,251,0.15)', color: '#E040FB', fontWeight: '700' }}>
                          ANNIV25 Spa Offer
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>No anniversaries recorded for today.</p>
                )}
              </div>
            </div>
          </div>

          {/* Trigger Rules Cards */}
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '16px' }}>
            Automated Marketing Trigger Rules
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {triggers.map(trig => (
              <div key={trig.id} style={{
                background: '#1E293B', border: `1px solid ${trig.is_active ? '#10B981' : '#334155'}`,
                borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{trig.name}</span>
                    <button
                      onClick={() => handleToggleTrigger(trig.id)}
                      style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                        border: 'none', cursor: 'pointer',
                        background: trig.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                        color: trig.is_active ? '#10B981' : '#EF4444'
                      }}
                    >
                      {trig.is_active ? 'ACTIVE' : 'PAUSED'}
                    </button>
                  </div>

                  <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '12px' }}>
                    Event: <strong style={{ color: '#fff' }}>{trig.event_type}</strong> · Channel: <strong style={{ color: '#10B981' }}>{trig.channel}</strong>
                  </p>
                  <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0 }}>
                    Offer Attached: <strong>{trig.offer_discount}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM OFFER TEMPLATES */}
      {activeTab === 'templates' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>
              Custom Offer Message Templates
            </h3>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({ name: '', channel: 'WhatsApp', subject: '', body: '', coupon_code: '' });
                setIsTemplateModalOpen(true);
              }}
              style={{
                padding: '8px 16px', background: '#1E293B', color: '#10B981',
                border: '1px solid #10B981', borderRadius: '8px', fontWeight: '600',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Plus size={16} /> New Template
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {templates.map(tpl => (
              <div key={tpl.id} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: '#fff' }}>{tpl.name}</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700',
                    background: tpl.channel === 'WhatsApp' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                    color: tpl.channel === 'WhatsApp' ? '#10B981' : '#6366F1'
                  }}>
                    {tpl.channel}
                  </span>
                </div>

                <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#E2E8F0', marginBottom: '12px', minHeight: '80px' }}>
                  {tpl.body}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '600' }}>
                    Coupon: {tpl.coupon_code || 'None'}
                  </span>
                  <button
                    onClick={() => {
                      setEditingTemplate(tpl);
                      setTemplateForm({ name: tpl.name, channel: tpl.channel, subject: tpl.subject || '', body: tpl.body, coupon_code: tpl.coupon_code || '' });
                      setIsTemplateModalOpen(true);
                    }}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERY AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', fontWeight: '600', color: '#fff' }}>
            Real-time Message Delivery Audit Log
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 16px' }}>Sent Date/Time</th>
                <th style={{ padding: '14px 16px' }}>Recipient Client</th>
                <th style={{ padding: '14px 16px' }}>Channel</th>
                <th style={{ padding: '14px 16px' }}>Message Body</th>
                <th style={{ padding: '14px 16px' }}>Delivery Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                  <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '13px' }}>
                    {new Date(log.sent_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#fff' }}>{log.customer_name}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>{log.customer_phone}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                      background: log.channel === 'WhatsApp' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                      color: log.channel === 'WhatsApp' ? '#10B981' : '#6366F1'
                    }}>
                      {log.channel}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#CBD5E1', fontSize: '13px', maxWidth: '300px' }}>
                    {log.message_body}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                      background: 'rgba(16,185,129,0.15)', color: '#10B981'
                    }}>
                      ✓ {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#90A4AE' }}>
                    No message delivery logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: CREATE CAMPAIGN */}
      {isCampaignModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: '#1E293B', border: '1px solid #334155', borderRadius: '16px',
            width: '100%', maxWidth: '480px', padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
              Create Promotional Campaign Blast
            </h3>
            <form onSubmit={handleSaveCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Campaign Title</label>
                <input
                  type="text" required placeholder="e.g. Festive Super Sale Blast"
                  value={campaignForm.title} onChange={e => setCampaignForm({ ...campaignForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Messaging Channel</label>
                <select
                  value={campaignForm.channel} onChange={e => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="WhatsApp">WhatsApp Message Blast</option>
                  <option value="SMS">SMS Gateway Blast</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Target Audience Segment</label>
                <select
                  value={campaignForm.target_segment} onChange={e => setCampaignForm({ ...campaignForm, target_segment: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="All Clients">All Clients (Entire CRM Directory)</option>
                  <option value="VIP Members">VIP Tier Members Only</option>
                  <option value="Inactive 30+ Days">Inactive Clients (30+ Days No Visit)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Select Offer Template</label>
                <select
                  required value={campaignForm.template_id}
                  onChange={e => setCampaignForm({ ...campaignForm, template_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="">-- Choose Template --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#10B981', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Save Campaign Draft
                </button>
                <button
                  type="button" onClick={() => setIsCampaignModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT TEMPLATE */}
      {isTemplateModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: '#1E293B', border: '1px solid #334155', borderRadius: '16px',
            width: '100%', maxWidth: '520px', padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
              {editingTemplate ? 'Edit Offer Template' : 'Create Offer Message Template'}
            </h3>
            <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Template Name</label>
                <input
                  type="text" required placeholder="e.g. Birthday Special Wish"
                  value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Channel</label>
                  <select
                    value={templateForm.channel} onChange={e => setTemplateForm({ ...templateForm, channel: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Coupon Code</label>
                  <input
                    type="text" placeholder="e.g. BDAY20"
                    value={templateForm.coupon_code} onChange={e => setTemplateForm({ ...templateForm, coupon_code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff', textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Message Body (Use {'{customer_name}'}, {'{discount_code}'})</label>
                <textarea
                  rows="4" required
                  placeholder="Dear {customer_name}, Happy Birthday! Enjoy 20% OFF using code {discount_code}."
                  value={templateForm.body} onChange={e => setTemplateForm({ ...templateForm, body: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#10B981', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Save Template
                </button>
                <button
                  type="button" onClick={() => setIsTemplateModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MarketingAutomationView;

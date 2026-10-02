import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Camera, X, Check, ShieldCheck, Building, KeyRound, Loader2, Sparkles } from 'lucide-react';
import { Admin_Update_Profile, Admin_Upload_User_Avatar } from '../services/apiService';
import { BACKEND_URL } from '../config/Config';

function UserProfileModal({ currentUser, onClose, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    newPassword: '',
    confirmPassword: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(
    currentUser?.avatar_url ? `${BACKEND_URL}${currentUser.avatar_url}` : null
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFeedback({ type: 'error', msg: 'Name and email are required fields.' });
      return;
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setFeedback({ type: 'error', msg: 'New password must be at least 6 characters long.' });
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setFeedback({ type: 'error', msg: 'New password and confirm password do not match.' });
        return;
      }
    }

    setIsSubmitting(true);
    setFeedback({ type: '', msg: '' });

    try {
      // 1. Upload new avatar if selected
      if (selectedFile && currentUser?.id) {
        const fileData = new FormData();
        fileData.append('avatar', selectedFile);
        await Admin_Upload_User_Avatar(currentUser.id, fileData);
      }

      // 2. Update text details & password
      const updatePayload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.newPassword.trim() || undefined
      };

      const res = await Admin_Update_Profile(updatePayload);

      setFeedback({ type: 'success', msg: 'Profile & Account details updated successfully! 🎉' });

      setTimeout(() => {
        if (onProfileUpdated) onProfileUpdated();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error updating profile:', err);
      setFeedback({ type: 'error', msg: err?.data?.message || err?.message || 'Failed to update profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px'
    }}>
      <div className="glass-panel modal-content" style={{
        maxWidth: '540px', width: '100%', padding: '28px', background: 'var(--bg-surface)',
        border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text-main)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} style={{ color: 'var(--accent-gold)' }} /> Admin & Account Profile
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Manage your personal credentials, contact info, avatar & security password.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback.msg && (
          <div style={{
            padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem',
            background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.15)',
            border: `1px solid ${feedback.type === 'error' ? '#EF4444' : '#2563eb'}`,
            color: feedback.type === 'error' ? '#EF4444' : '#3b82f6',
            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600'
          }}>
            {feedback.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Avatar Upload Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  style={{ width: '74px', height: '74px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-gold)' }}
                />
              ) : (
                <div style={{
                  width: '74px', height: '74px', borderRadius: '50%', background: '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '900', color: '#fff'
                }}>
                  {String(formData.name || 'A').charAt(0)}
                </div>
              )}
              <label style={{
                position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-gold)', color: '#000',
                padding: '6px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', display: 'flex'
              }} title="Change Profile Photo">
                <Camera size={14} />
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>{currentUser?.name}</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245,158,11,0.18)', color: 'var(--accent-gold)', fontWeight: '800', textTransform: 'uppercase' }}>
                  {currentUser?.role || 'Admin'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={12} /> {(!currentUser?.branch_id || currentUser?.role === 'Admin' || currentUser?.is_super_admin) ? '🌐 System Master Super Admin (All Branches Control)' : (currentUser?.branch_name || 'Main Salon Branch')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', marginTop: '4px', fontWeight: '600' }}>
                Click camera icon to change profile photo
              </div>
            </div>
          </div>

          {/* User Basic Info Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <User size={14} style={{ color: 'var(--accent-gold)' }} /> Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sunil Kumar"
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--input-bg)',
                  border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Mail size={14} style={{ color: 'var(--accent-gold)' }} /> Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@saloon.com"
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--input-bg)',
                  border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Phone size={14} style={{ color: 'var(--accent-gold)' }} /> Mobile Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--input-bg)',
                  border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.88rem'
                }}
              />
            </div>
          </div>

          {/* Change Security Password Section */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border)', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={16} style={{ color: 'var(--accent-gold)' }} /> Change Security Password
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
              >
                {showPassword ? 'Hide Password' : 'Show Password'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Leave blank to keep current"
                  value={formData.newPassword}
                  onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 12px', background: 'var(--input-bg)',
                    border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.82rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 12px', background: 'var(--input-bg)',
                    border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '11px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-sub)',
                fontWeight: '700', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                flex: 2, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: isSubmitting ? 0.75 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Updating Profile...
                </>
              ) : (
                <>
                  <Check size={16} /> Save Profile Changes
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default UserProfileModal;

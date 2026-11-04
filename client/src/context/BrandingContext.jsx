import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Get_Public_Branding } from '../services/apiService';

export const DEFAULT_BRANDING = {
  salon_name: 'SalonPulse',
  salon_tagline: 'ERP & CRM Portal',
  logo_url: '',
  favicon_url: '',
  theme_color: '#2563eb', // Royal Electric Cobalt Blue
  theme_palette: 'cobalt_blue',
  contact_phone: '011-23456789',
  contact_email: 'support@saloonpulse.com',
  currency_symbol: '₹',
  currency_code: 'INR',
  default_gst_rate: '18.0',
  gstin_number: '07AAAAA0000A1Z5',
  receipt_footer_note: 'Thank you for visiting! Please visit again.',
  invoice_header_text: '',
  invoice_terms: ''
};

export const THEME_PALETTES = [
  { id: 'cobalt_blue', name: 'Royal Cobalt Blue', hex: '#2563eb', light: '#3b82f6', glow: 'rgba(37, 99, 235, 0.35)' },
  { id: 'luxury_gold', name: 'Luxury Imperial Gold', hex: '#d4af37', light: '#e5c158', glow: 'rgba(212, 175, 55, 0.35)' },
  { id: 'emerald_green', name: 'Emerald Salon & Spa', hex: '#10b981', light: '#34d399', glow: 'rgba(16, 185, 129, 0.35)' },
  { id: 'velvet_purple', name: 'Velvet Amethyst Purple', hex: '#8b5cf6', light: '#a78bfa', glow: 'rgba(139, 92, 246, 0.35)' },
  { id: 'sunset_rose', name: 'Sunset Rose Gold', hex: '#f43f5e', light: '#fb7185', glow: 'rgba(244, 63, 94, 0.35)' },
  { id: 'ruby_red', name: 'Royal Crimson Ruby', hex: '#dc2626', light: '#ef4444', glow: 'rgba(220, 38, 38, 0.35)' },
  { id: 'midnight_cyan', name: 'Cyberpunk Neon Cyan', hex: '#06b6d4', light: '#22d3ee', glow: 'rgba(6, 182, 212, 0.35)' }
];

export const applyThemeToDocument = (colorHex) => {
  if (!colorHex || typeof window === 'undefined') return;
  const root = document.documentElement;

  const matched = THEME_PALETTES.find(p => p.hex.toLowerCase() === colorHex.toLowerCase());
  const lightColor = matched ? matched.light : colorHex;
  const glow = matched ? matched.glow : `${colorHex}55`;
  const bgAlpha = `${colorHex}22`;
  const borderAlpha = `${colorHex}80`;

  // Core Theme Accents across all modules & components
  root.style.setProperty('--accent-gold', colorHex);
  root.style.setProperty('--accent', colorHex);
  root.style.setProperty('--primary', colorHex);
  root.style.setProperty('--primary-indigo', colorHex);
  root.style.setProperty('--mint-gradient', colorHex);
  root.style.setProperty('--mint-gradient-btn', colorHex);
  root.style.setProperty('--success', colorHex);
  root.style.setProperty('--theme-color', colorHex);
  root.style.setProperty('--brand-color', colorHex);
  root.style.setProperty('--btn-primary-bg', colorHex);

  // Light tints, text active & Glows
  root.style.setProperty('--accent-gold-light', lightColor);
  root.style.setProperty('--primary-purple', lightColor);
  root.style.setProperty('--text-active', lightColor);
  root.style.setProperty('--accent-gold-glow', glow);
  root.style.setProperty('--shadow-glow', `0 0 25px ${glow}`);
  root.style.setProperty('--border-active', borderAlpha);
  root.style.setProperty('--border-gold', colorHex);
  root.style.setProperty('--active-bg', bgAlpha);
  root.style.setProperty('--success-glow', glow);
};

export const applyBrandIdentity = (name, tagline, faviconUrl) => {
  if (typeof document === 'undefined') return;
  const brandName = name || DEFAULT_BRANDING.salon_name;
  const brandTag = tagline || DEFAULT_BRANDING.salon_tagline;
  document.title = `${brandName} - ${brandTag}`;

  if (faviconUrl) {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrl;
  }
};

const BrandingContext = createContext({
  brandSettings: DEFAULT_BRANDING,
  refreshBranding: async () => {},
  updateLocalBranding: () => {}
});

export const BrandingProvider = ({ children }) => {
  const [brandSettings, setBrandSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('salon_cached_branding');
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...DEFAULT_BRANDING, ...parsed };
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_BRANDING;
  });

  const applyBranding = useCallback((settings) => {
    if (!settings) return;
    applyThemeToDocument(settings.theme_color || DEFAULT_BRANDING.theme_color);
    applyBrandIdentity(settings.salon_name, settings.salon_tagline, settings.favicon_url);
  }, []);

  const refreshBranding = useCallback(async () => {
    try {
      const res = await Get_Public_Branding();
      if (res?.data?.success && res.data.branding) {
        const merged = { ...DEFAULT_BRANDING, ...res.data.branding };
        setBrandSettings(merged);
        applyBranding(merged);
        localStorage.setItem('salon_cached_branding', JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('⚠️ Could not load remote branding, using cached/default:', err?.message || err);
    }
    return brandSettings;
  }, [applyBranding, brandSettings]);

  const updateLocalBranding = useCallback((newPartial) => {
    setBrandSettings(prev => {
      const updated = { ...prev, ...newPartial };
      applyBranding(updated);
      try {
        localStorage.setItem('salon_cached_branding', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  }, [applyBranding]);

  // Initial load and apply
  useEffect(() => {
    applyBranding(brandSettings);
    refreshBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ brandSettings, refreshBranding, updateLocalBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  return useContext(BrandingContext);
};


import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import DarkModeToggle from '@/components/shared/DarkModeToggle';
import NewsPanel from '@/components/customer/NewsPanel';
import AccessibilityMenu from '@/components/shared/AccessibilityMenu';
import { motion } from 'framer-motion';
import { PUTT_LOGO_URL } from '@/lib/branding';

export default function CustomerLayout() {
  const { t, dir } = useI18n();
  const location = useLocation();

  return (
    <div dir={dir} className="min-h-screen bg-background">
      {/* Skip to main content for screen readers */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-4 py-2 rounded z-[100] font-medium">
        Skip to content
      </a>
      {/* Header */}
      <header className="sticky top-0 z-[200] bg-card/80 backdrop-blur-xl border-b border-border/50" role="banner">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo - NOT a link, just branding */}
          <div className="flex items-center gap-2 cursor-default select-none">
            <div className="h-8 w-8 rounded-lg overflow-hidden bg-white border border-border/50 flex items-center justify-center">
              <img src={PUTT_LOGO_URL} alt="Putt" className="h-full w-full object-cover" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">Putt</span>
          </div>
          <div className="flex items-center gap-0.5">
            <NewsPanel />
            <DarkModeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <AccessibilityMenu />

      {/* Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 pb-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </main>


    </div>
  );
}

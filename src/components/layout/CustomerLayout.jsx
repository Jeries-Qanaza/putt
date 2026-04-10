import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import DarkModeToggle from '@/components/shared/DarkModeToggle';
import NewsPanel from '@/components/customer/NewsPanel';
import AccessibilityMenu from '@/components/shared/AccessibilityMenu';
import { UtensilsCrossed } from 'lucide-react';
import { motion } from 'framer-motion';

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
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
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
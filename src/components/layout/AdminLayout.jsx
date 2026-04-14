import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { PUTT_LOGO_URL } from '@/lib/branding';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, labelKey: 'adminDashboard' },
  { path: '/admin/restaurants', icon: LayoutDashboard, labelKey: 'restaurants' },
];

export default function AdminLayout() {
  const { t, dir } = useI18n();
  const { logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div dir={dir} className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden min-h-screen w-64 flex-col border-e border-border bg-card md:flex">
        <div className="border-b border-border p-4">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-white">
              <img src={PUTT_LOGO_URL} alt="Putt" className="h-full w-full object-contain p-1" />
            </div>
            <span className="text-lg font-bold">Putt Admin</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-border p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <img src={PUTT_LOGO_URL} alt="Putt" className="h-4 w-4 rounded object-contain" />
            {t('home')}
          </Link>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen((value) => !value)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="text-lg font-bold">Putt Admin</span>
            <LanguageSwitcher />
          </div>
          {mobileMenuOpen ? (
            <nav className="space-y-1 border-b border-border bg-card px-3 pb-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Link>
              ))}
              <button
                onClick={() => logout()}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {t('logout')}
              </button>
            </nav>
          ) : null}
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 hidden items-center justify-end md:flex">
            <LanguageSwitcher />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tag,
  CalendarDays,
  Soup,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, labelKey: 'adminDashboard' },
  { path: '/admin/restaurants', icon: UtensilsCrossed, labelKey: 'restaurants' },
  { path: '/admin/categories', icon: Tag, labelKey: 'categories' },
  { path: '/admin/meals', icon: Soup, labelKey: 'menu' },
  { path: '/admin/events', icon: CalendarDays, labelKey: 'news' },
];

export default function AdminLayout() {
  const { t, dir } = useI18n();
  const { logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div dir={dir} className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-e border-border bg-card min-h-screen sticky top-0">
        <div className="p-4 border-b border-border">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Putt Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
        <div className="p-3 border-t border-border space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <UtensilsCrossed className="h-4 w-4" />
            {t('home')}
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Mobile Header + Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="px-4 h-14 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="font-bold text-lg">Putt Admin</span>
            <LanguageSwitcher />
          </div>
          {mobileMenuOpen && (
            <nav className="px-3 pb-3 space-y-1 border-b border-border bg-card">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                {t('logout')}
              </button>
            </nav>
          )}
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="hidden md:flex items-center justify-end mb-6">
            <LanguageSwitcher />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// @ts-nocheck
import { SessionTimer } from '@/components/session/SessionTimer';
import { flushPendingDraft } from '@/lib/draftFlush';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLinkHandler } from '@/lib/linkUtils';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { RoleBadge } from '@/components/auth/RolePicker';
import { Button } from '@/components/ui/Button';
import { Languages, LogOut, User, Menu, X, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { SideMenu, useAppNavLinks } from '@/components/layout/SideMenu';
import { DevModeToggle } from '@/components/ui/DevModeToggle';
import { useDevModeStore } from '@/store/devModeStore';

import { useClusterFormText } from '@/lib/clusterDprFormText';
export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const tf = useClusterFormText();
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLinkClick = useLinkHandler();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navLinks = useAppNavLinks();
  const confirmAction = useConfirm();
  const devMode = useDevModeStore((s) => s.on);
  const setDevMode = useDevModeStore((s) => s.setOn);

  const handleLogout = async () => {
    // Save an open draft first so signing out never loses typing. If it cannot be saved, ask.
    const flushed = await flushPendingDraft();
    if (flushed.dirty && !flushed.ok) {
      const leave = await confirmAction({
        title: 'Your latest changes could not be saved',
        body: 'If you log out now, what you typed since the last save will be lost.',
        confirmLabel: 'Log out anyway',
        cancelLabel: 'Stay and retry',
      });
      if (!leave) return;
    }
    await api.logout();
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('te') ? 'en' : 'te';
    i18n.changeLanguage(newLang);
  };

  return (
    <>
    <nav aria-label={tf('Main navigation')} className="sticky top-0 z-[60] bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <a
            href={isAuthenticated ? '/dashboard' : '/'}
            onClick={(e) => handleLinkClick(e, isAuthenticated ? '/dashboard' : '/')}
            className="flex min-w-0 items-center space-x-2 sm:space-x-3"
          >
            <img 
              src="/apmsme_logo_192.png" 
              alt={tf('APMSME Logo')} 
              className="h-10 w-auto shrink-0 object-contain sm:h-12"
            />
            <span className="hidden truncate text-base font-semibold text-foreground min-[480px]:inline sm:text-xl">
              {t('nav.appName')}
            </span>
          </a>

          <div className="flex shrink-0 items-center space-x-1 sm:space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-2 sm:px-3"
              aria-label={i18n.language.startsWith('te') ? 'English' : 'తెలుగు'}
            >
              <Languages className="h-4 w-4" />
              <span className="hidden font-medium sm:inline">{i18n.language.startsWith('te') ? 'English' : 'తెలుగు'}</span>
            </Button>

            <ThemeToggle />

            {isAuthenticated && <SessionTimer />}
            {isAuthenticated && <NotificationBell />}

            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center gap-1 lg:gap-3">
                  <a href="/profile" onClick={(e) => handleLinkClick(e, '/profile')}>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2" aria-label={user?.name || tf('Profile')} title={user?.name}>
                      <User className="h-4 w-4" />
                      <span className="hidden max-w-[10rem] truncate font-medium xl:inline">{user?.name}</span>
                      <span className="hidden xl:inline"><RoleBadge role={user?.role} /></span>
                    </Button>
                  </a>
                  <a href="/account/privacy" onClick={(e) => handleLinkClick(e, '/account/privacy')}>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2" aria-label={t('nav.privacy')} title={t('nav.privacy')}>
                      <ShieldCheck className="h-4 w-4" />
                      <span className="hidden font-medium lg:inline">{t('nav.privacy')}</span>
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    aria-label={t('common.logout')}
                    title={t('common.logout')}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 lg:mr-2" aria-hidden="true" />
                    <span className="hidden lg:inline">{t('common.logout')}</span>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden"
                  aria-label={mobileMenuOpen ? t('common.closeMenu', { defaultValue: 'Close menu' }) : t('common.openMenu', { defaultValue: 'Open menu' })}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </>
            ) : (
              <>
                <a href="/login" onClick={(e) => handleLinkClick(e, '/login')}>
                  <Button variant="ghost" size="sm">
                    {t('common.login')}
                  </Button>
                </a>
                <a href="/register" onClick={(e) => handleLinkClick(e, '/register')}>
                  <Button variant="secondary" size="sm">
                    {t('common.register')}
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && isAuthenticated && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-2">
              <div className="space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
                  return (
                    <a
                      key={link.path}
                      href={link.path}
                      onClick={(e) => {
                        handleLinkClick(e, link.path);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                        active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </a>
                  );
                })}
                {['/individual-dpr/create', '/cluster-dpr/create'].includes(location.pathname) && (
                  <DevModeToggle on={devMode} onChange={setDevMode} expanded />
                )}
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent text-left"
                >
                  <Languages className="h-4 w-4" />
                  {i18n.language.startsWith('te') ? 'English' : 'తెలుగు'}
                </button>
                <a
                  href="/profile"
                  onClick={(e) => {
                    handleLinkClick(e, '/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.name}</span>
                  <RoleBadge role={user?.role} />
                </a>
                <a
                  href="/account/privacy"
                  onClick={(e) => {
                    handleLinkClick(e, '/account/privacy');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t('nav.privacy')}</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 text-left"
                >
                  <LogOut className="h-4 w-4" />
                  {t('common.logout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
    {isAuthenticated && <SideMenu />}
    </>
  );
};

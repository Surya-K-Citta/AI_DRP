// @ts-nocheck
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLinkHandler } from '@/lib/linkUtils';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Languages, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLinkClick = useLinkHandler();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'te' : 'en';
    i18n.changeLanguage(newLang);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = isAuthenticated ? [
    { path: '/dashboard', label: t('nav.dashboard'), icon: '📊' },
    { path: '/dprs', label: t('nav.allDPRs'), icon: '📄' },
    { path: '/projects', label: t('nav.projects'), icon: '📁' },
    { path: '/chat', label: t('nav.chat'), icon: '💬' },
    ...(user?.role === 'admin' ? [
      { path: '/admin', label: t('nav.admin'), icon: '⚙️' },
      { path: '/admin/documents', label: t('nav.documents'), icon: '📄' },
    ] : []),
  ] : [];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <a href="/" onClick={(e) => handleLinkClick(e, '/')} className="flex items-center space-x-3">
            <img 
              src="/apmsme_logo.png" 
              alt="APMSME Logo" 
              className="h-12 w-auto object-contain"
            />
            <span className="text-xl font-semibold text-foreground">
              {t('nav.appName')}
            </span>
          </a>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  onClick={(e) => handleLinkClick(e, link.path)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-2"
            >
              <Languages className="h-4 w-4" />
              <span className="font-medium">{i18n.language === 'en' ? 'తెలుగు' : 'English'}</span>
            </Button>

            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-3">
                  <a href="/profile" onClick={(e) => handleLinkClick(e, '/profile')}>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{user?.name}</span>
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('common.logout')}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden"
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
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
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
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  onClick={(e) => {
                    handleLinkClick(e, link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-primary text-white'
                      : 'text-foreground hover:bg-primary/10'
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-border space-y-2">
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
  );
};

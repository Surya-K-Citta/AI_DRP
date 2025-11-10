import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Building2, Languages, LogOut, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'te' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8" />
            <span className="text-xl font-bold">MSME DPR Tool</span>
          </Link>

          {isAuthenticated && (
            <div className="flex items-center space-x-6">
              <Link to="/dashboard" className="hover:text-primary-foreground/80">
                {t('nav.dashboard')}
              </Link>
              <Link to="/projects" className="hover:text-primary-foreground/80">
                {t('nav.projects')}
              </Link>
              {/* <Link to="/schemes" className="hover:text-primary-foreground/80">
                {t('nav.schemes')}
              </Link> */}
              <Link to="/chat" className="hover:text-primary-foreground/80">
                {t('nav.chat')}
              </Link>
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin" className="hover:text-primary-foreground/80">
                    {t('nav.admin')}
                  </Link>
                  <Link to="/admin/documents" className="hover:text-primary-foreground/80">
                    Documents
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-primary-foreground hover:text-primary-foreground/80"
            >
              <Languages className="h-5 w-5 mr-1" />
              {i18n.language === 'en' ? 'తెలుగు' : 'English'}
            </Button>

            {isAuthenticated ? (
              <>
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="text-primary-foreground">
                    <User className="h-5 w-5 mr-1" />
                    {user?.name}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-primary-foreground"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  {t('common.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-primary-foreground">
                    {t('common.login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary" size="sm">
                    {t('common.register')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};


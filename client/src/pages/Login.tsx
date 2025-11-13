// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLinkHandler } from '@/lib/linkUtils';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Sparkles, ArrowRight, LogIn, CheckCircle, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleLinkClick = useLinkHandler();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const demoCredentials = {
    email: 'jaa@gmail.com',
    password: '123456',
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      const response = await api.login(demoCredentials.email, demoCredentials.password);
      login(response.data, response.data.token);
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(t('auth.loginError'));
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.login(formData.email, formData.password);
      login(response.data, response.data.token);
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/apmsme_logo.png" 
              alt="APMSME Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            {t('auth.welcomeBack')}
          </h1>
          <p className="text-muted-foreground">
            {t('auth.signInContinue')}
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">{t('auth.loginTitle')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.enterCredentials')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('auth.email')}
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="h-12"
              />
              <Input
                label={t('auth.password')}
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="h-12"
              />
              <Button 
                type="submit" 
                variant="primary"
                className="w-full h-12 text-base font-semibold shadow-lg" 
                isLoading={isLoading}
              >
                {!isLoading && <ArrowRight className="h-5 w-5 mr-2" />}
                {t('common.login')}
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t">
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <a href="/register" onClick={(e) => handleLinkClick(e, '/register')} className="text-primary font-semibold hover:underline">
                  {t('common.register')}
                </a>
              </p>
            </div>

            {/* Quick Test Login Section */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-center text-sm font-medium text-foreground mb-4">
                Want to try the platform quickly?
              </p>
              <button
                onClick={handleDemoLogin}
                disabled={isDemoLoading || isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-teal-600 to-orange-500 hover:from-teal-700 hover:to-orange-600 text-white font-semibold text-base shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isDemoLoading && <Sparkles className="h-5 w-5" />}
                {isDemoLoading ? 'Logging in...' : 'Quick Test Login'}
              </button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Instantly login with demo account ({demoCredentials.email})
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-lg bg-white/50 border border-primary/10">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium">AI-Powered</p>
          </div>
          <div className="p-4 rounded-lg bg-white/50 border border-primary/10">
            <Shield className="h-6 w-6 text-secondary mx-auto mb-2" />
            <p className="text-xs font-medium">Bank-Ready</p>
          </div>
          <div className="p-4 rounded-lg bg-white/50 border border-primary/10">
            <ArrowRight className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-xs font-medium">Fast Track</p>
          </div>
        </div>
      </div>
    </div>
  );
};

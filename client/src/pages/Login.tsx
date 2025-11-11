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
import { Building2, Sparkles, ArrowRight, Copy, LogIn, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleLinkClick = useLinkHandler();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const demoCredentials = {
    email: 'demo@msme.com',
    password: 'demo123',
  };

  const useDemoAccount = () => {
    setFormData({
      email: demoCredentials.email,
      password: demoCredentials.password,
    });
    toast.success('Demo credentials filled! Click "Sign In" to continue.');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Sign in to continue to MSME DPR Tool
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">{t('auth.loginTitle')}</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
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
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg" 
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

            {/* Demo Credentials Section */}
            <div className="mt-6 pt-6 border-t">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Demo Email
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm text-foreground">
                      {demoCredentials.email}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(demoCredentials.email, 'Email')}
                      className="shrink-0 h-8"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Demo Password
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm text-foreground">
                      {demoCredentials.password}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(demoCredentials.password, 'Password')}
                      className="shrink-0 h-8"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
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
            <Building2 className="h-6 w-6 text-secondary mx-auto mb-2" />
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

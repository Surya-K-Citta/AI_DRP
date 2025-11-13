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
import { Building2, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleLinkClick = useLinkHandler();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    location: '',
    udyamNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.register(formData);
      login(response.data, response.data.token);
      toast.success(t('auth.registerSuccess'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(t('auth.registerError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5 p-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            {t('auth.getStarted')}
          </h1>
          <p className="text-muted-foreground">
            {t('auth.createAccountStart')}
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">{t('auth.registerTitle')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.fillDetails')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label={t('auth.name')}
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="h-12"
                />
                <Input
                  label={t('auth.phoneNumber')}
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="h-12"
                />
              </div>
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
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label={t('auth.location')}
                  type="text"
                  placeholder="Hyderabad, Telangana"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="h-12"
                />
                <Input
                  label={t('auth.udyamNumber')}
                  type="text"
                  placeholder="UDYAM-XX-00-0000000"
                  value={formData.udyamNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, udyamNumber: e.target.value })
                  }
                  className="h-12"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg mt-6" 
                isLoading={isLoading}
              >
                {!isLoading && <CheckCircle className="h-5 w-5 mr-2" />}
                {t('common.register')}
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t">
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.hasAccount')}{' '}
                <a href="/login" onClick={(e) => handleLinkClick(e, '/login')} className="text-primary font-semibold hover:underline">
                  {t('common.login')}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/50 border border-primary/10 text-center">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold mb-1">{t('auth.aiAssistance')}</p>
            <p className="text-xs text-muted-foreground">{t('auth.smartSuggestions')}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/50 border border-primary/10 text-center">
            <Building2 className="h-6 w-6 text-secondary mx-auto mb-2" />
            <p className="text-sm font-semibold mb-1">{t('auth.bankReady')}</p>
            <p className="text-xs text-muted-foreground">{t('auth.professionalDPRs')}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/50 border border-primary/10 text-center">
            <ArrowRight className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-sm font-semibold mb-1">{t('auth.quickSetup')}</p>
            <p className="text-xs text-muted-foreground">{t('auth.getStartedMinutes')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

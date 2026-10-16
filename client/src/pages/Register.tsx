// @ts-nocheck
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLinkHandler } from '@/lib/linkUtils';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Sparkles, ArrowRight, CheckCircle, Building2 } from 'lucide-react';
import { ConsentFields, ConsentValues } from '@/components/privacy/ConsentFields';
import { GuardianNotice } from '@/components/privacy/GuardianNotice';
import { ageFromDob } from '@/lib/privacy/under18';
import { PRIVACY_NOTICE_VERSION, UNDER_18_CODE } from '@/lib/privacy/constants';

import { useClusterFormText } from '@/lib/clusterDprFormText';
export const Register: React.FC = () => {
  const { t } = useTranslation();
  const tf = useClusterFormText();
  const navigate = useNavigate();
  const handleLinkClick = useLinkHandler();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [under18, setUnder18] = useState(false);
  const guardianRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    location: '',
    udyamNumber: '',
    dateOfBirth: '',
  });
  const [consent, setConsent] = useState<ConsentValues>({
    accountConsent: false,
    aiAssist: false,
    analytics: false,
    noticeRead: false,
  });
  const [phoneError, setPhoneError] = useState('');

  const dobAge = ageFromDob(formData.dateOfBirth);
  const isUnder18Dob = dobAge != null && dobAge < 18;
  const showGuardian = under18 || isUnder18Dob;

  const isValidPhone = (value: string) => /^\d{10}$/.test(value);

  const scrollToGuardian = () => {
    window.setTimeout(() => {
      guardianRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phoneNumber: digits });
    if (!digits) {
      setPhoneError(t('auth.phoneRequired'));
    } else if (!isValidPhone(digits)) {
      setPhoneError(t('auth.phoneInvalid'));
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPhone(formData.phoneNumber)) {
      setPhoneError(
        formData.phoneNumber
          ? t('auth.phoneInvalid')
          : t('auth.phoneRequired')
      );
      return;
    }

    const age = ageFromDob(formData.dateOfBirth);
    if (age != null && age < 18) {
      setUnder18(true);
      scrollToGuardian();
      return;
    }
    setUnder18(false);
    if (!consent.noticeRead) {
      toast.error(t('privacy.scrollToEnable'));
      return;
    }
    if (!consent.accountConsent) {
      toast.error(t('privacy.accountRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.register({
        ...formData,
        accountConsent: consent.accountConsent,
        aiAssist: consent.aiAssist,
        analytics: consent.analytics,
        noticeVersion: PRIVACY_NOTICE_VERSION,
      });
      login(response.data, response.data.token);
      toast.success(t('auth.registerSuccess'));
      navigate('/dashboard');
    } catch (error: any) {
      if (error?.response?.data?.code === UNDER_18_CODE) {
        setUnder18(true);
        scrollToGuardian();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/apmsme_logo_192.png" 
              alt={tf('APMSME Logo')} 
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            {t('auth.getStarted')}
          </h1>
          <p className="text-muted-foreground">
            {t('auth.createAccountStart')}
          </p>
        </div>

        <Card className="border shadow-sm">
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
                  placeholder={tf('John Doe')}
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
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="9876543210"
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => {
                    if (!isValidPhone(formData.phoneNumber)) {
                      setPhoneError(
                        formData.phoneNumber
                          ? t('auth.phoneInvalid')
                          : t('auth.phoneRequired')
                      );
                    }
                  }}
                  maxLength={10}
                  required
                  error={phoneError}
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
                  placeholder={tf('Hyderabad, Telangana')}
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
              <Input
                label={t('auth.dateOfBirth')}
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                required
                className="h-12"
              />
              {showGuardian && <GuardianNotice ref={guardianRef} />}
              <ConsentFields value={consent} onChange={setConsent} />
              <Button 
                type="submit" 
                variant="secondary"
                className="w-full h-12 text-base font-semibold shadow-lg mt-6" 
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

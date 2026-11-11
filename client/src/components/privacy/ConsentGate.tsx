import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConsentFields, ConsentValues } from './ConsentFields';
import { PRIVACY_NOTICE_VERSION } from '@/lib/privacy/constants';

interface ConsentGateProps {
  children: React.ReactNode;
}

export const ConsentGate: React.FC<ConsentGateProps> = ({ children }) => {
  const { t } = useTranslation();
  const { user, token, updateUser, logout } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState<ConsentValues>({
    accountConsent: false,
    aiAssist: false,
    analytics: false,
    noticeRead: false,
  });
  const acceptedRef = useRef(false);

  const needsNotice =
    !!token &&
    !acceptedRef.current &&
    (!user?.privacy || user.privacy.needsNoticeAcceptance);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        // Never use mock profile here — mock users have no privacy and would
        // reopen this modal forever / overwrite the logged-in admin.
        const response = await api.getProfileLive();
        const profile = response.data || response;
        if (cancelled || !profile) return;
        const currentId = String(user?.userId || '');
        const profileId = String(profile.userId || profile._id || '');
        if (currentId && profileId && currentId !== profileId) return;
        if (acceptedRef.current) return;
        updateUser(profile);
        setConsent((prev) => ({
          ...prev,
          aiAssist: !!profile.privacy?.aiAssist,
          analytics: !!profile.privacy?.analytics,
        }));
      } catch {
        /* keep stored user; modal still shows if notice is missing */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!needsNotice) {
    return <>{children}</>;
  }

  const handleAccept = async () => {
    if (!consent.noticeRead) {
      toast.error(t('privacy.scrollToEnable'));
      return;
    }
    if (!consent.accountConsent) {
      toast.error(t('privacy.accountRequired'));
      return;
    }
    setBusy(true);
    try {
      const response = await api.acceptConsent({
        accountConsent: consent.accountConsent,
        aiAssist: consent.aiAssist,
        analytics: consent.analytics,
        noticeVersion: PRIVACY_NOTICE_VERSION,
      });
      const next = response.data || response;
      acceptedRef.current = true;
      updateUser({
        ...next,
        privacy: {
          ...(next.privacy || {}),
          noticeVersion: next.privacy?.noticeVersion || PRIVACY_NOTICE_VERSION,
          accountConsent: true,
          needsNoticeAcceptance: false,
          aiAssist: !!consent.aiAssist,
          analytics: !!consent.analytics,
        },
      });
      toast.success(t('privacy.saved'));
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('privacy.saveFailed');
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="pointer-events-none opacity-40" aria-hidden>
        {children}
      </div>
      <div className="motion-overlay fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
        <Card className="w-full max-w-xl max-h-[92vh] overflow-y-auto pointer-events-auto">
          <CardHeader>
            <CardTitle>{t('privacy.reconsentTitle')}</CardTitle>
            <CardDescription>{t('privacy.reconsentBody')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConsentFields value={consent} onChange={setConsent} idPrefix="reconsent" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                className="flex-1"
                onClick={handleAccept}
                isLoading={busy}
                disabled={!consent.noticeRead || !consent.accountConsent}
              >
                {t('privacy.continue')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  await api.logout();
                  logout();
                  window.location.href = '/login';
                }}
              >
                {t('common.logout')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

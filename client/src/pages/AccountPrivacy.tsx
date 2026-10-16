import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
  Download,
  ShieldOff,
  UserPlus,
  Trash2,
  MessageSquare,
  Clock,
  Loader2,
  AlertTriangle,
  Bell,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { downloadBlob } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { GRIEVANCE_EMAIL } from '@/lib/privacy/constants';

const ACTION_LABELS: Record<string, string> = {
  login_success: 'Signed in',
  login_failed: 'Failed sign-in',
  logout: 'Signed out',
  consent_given: 'Consent given',
  consent_withdrawn: 'AI consent turned off',
  notice_accepted: 'Privacy notice accepted',
  dpr_create: 'DPR created',
  dpr_change: 'DPR changed',
  dpr_download: 'DPR downloaded',
  dpr_delete: 'Project deleted',
  kyc_upload: 'File uploaded',
  kyc_delete: 'File deleted',
  data_export: 'Data exported',
  profile_change: 'Profile changed',
  nominee_change: 'Nominee updated',
  complaint_submitted: 'Privacy request sent',
  retention_warning: 'Draft expiry warning',
  retention_purge: 'Idle draft deleted',
};

export const AccountPrivacy: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [aiAssist, setAiAssist] = useState(!!user?.privacy?.aiAssist);
  const [savingAi, setSavingAi] = useState(false);
  const [nominee, setNominee] = useState({ name: '', phone: '', email: '' });
  const [savingNominee, setSavingNominee] = useState(false);
  const [complaint, setComplaint] = useState({ subject: '', message: '' });
  const [sendingComplaint, setSendingComplaint] = useState(false);
  const [activity, setActivity] = useState<Array<{ at: string; action: string; targetId?: string }>>([]);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      title: string;
      body: string;
      at: string;
      readAt?: string;
      smsStatus?: string;
      emailStatus?: string;
    }>
  >([]);
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, activityRes, notifyRes] = await Promise.all([
          api.getProfile(),
          api.getPrivacyActivity(),
          api.getNotifications(50),
        ]);
        const profile = profileRes.data || profileRes;
        if (profile) {
          updateUser(profile);
          setAiAssist(!!profile.privacy?.aiAssist);
          setNominee({
            name: profile.privacy?.nominee?.name || '',
            phone: profile.privacy?.nominee?.phone || '',
            email: profile.privacy?.nominee?.email || '',
          });
        }
        setActivity(activityRes.data || []);
        setNotifications(notifyRes.data?.items || []);
      } catch (error: any) {
        toast.error(error.response?.data?.message || t('privacy.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (window.location.hash === '#notifications') {
      document.getElementById('notifications')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading]);

  const handleAiToggle = async (next: boolean) => {
    setSavingAi(true);
    try {
      const response = await api.updatePrivacyConsent({ aiAssist: next });
      const profile = response.data || response;
      updateUser(profile);
      setAiAssist(!!profile.privacy?.aiAssist);
      toast.success(t('privacy.saved'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('privacy.saveFailed'));
    } finally {
      setSavingAi(false);
    }
  };

  const handleSaveNominee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNominee(true);
    try {
      const response = await api.saveNominee(nominee);
      const profile = response.data || response;
      updateUser(profile);
      toast.success(t('privacy.nomineeSaved'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('privacy.saveFailed'));
    } finally {
      setSavingNominee(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await api.exportMyData();
      downloadBlob(blob, `msme-dpr-data-${user?.userId || 'me'}.json`);
      toast.success(t('privacy.exportReady'));
      const activityRes = await api.getPrivacyActivity();
      setActivity(activityRes.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('privacy.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingComplaint(true);
    try {
      await api.submitPrivacyComplaint(complaint);
      setComplaint({ subject: '', message: '' });
      toast.success(t('privacy.complaintSent'));
      const activityRes = await api.getPrivacyActivity();
      setActivity(activityRes.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('privacy.saveFailed'));
    } finally {
      setSendingComplaint(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error(t('privacy.deleteTypeDelete'));
      return;
    }
    setDeleting(true);
    try {
      await api.deleteMyAccount('DELETE');
      logout();
      toast.success(t('privacy.accountDeleted'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('privacy.deleteFailed'));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('privacy.settingsTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('privacy.settingsSubtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Download className="h-5 w-5" />
              {t('privacy.downloadMyData')}
            </CardTitle>
            <CardDescription>{t('privacy.downloadMyDataHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {t('privacy.downloadMyData')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldOff className="h-5 w-5" />
              {t('privacy.aiHeading')}
            </CardTitle>
            <CardDescription>{t('privacy.aiOffWarning')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={aiAssist}
                disabled={savingAi}
                onChange={(e) => handleAiToggle(e.target.checked)}
              />
              <span className="text-sm">{t('privacy.aiConsent')}</span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="h-5 w-5" />
              {t('privacy.nomineeHeading')}
            </CardTitle>
            <CardDescription>{t('privacy.nomineeHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveNominee} className="space-y-4">
              <Input
                label={t('privacy.nomineeName')}
                value={nominee.name}
                onChange={(e) => setNominee((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('privacy.nomineePhone')}
                  value={nominee.phone}
                  onChange={(e) => setNominee((prev) => ({ ...prev, phone: e.target.value }))}
                />
                <Input
                  label={t('privacy.nomineeEmail')}
                  type="email"
                  value={nominee.email}
                  onChange={(e) => setNominee((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={savingNominee}>
                {savingNominee && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('privacy.saveNominee')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card id="notifications">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-5 w-5" />
              {t('privacy.notificationsHeading')}
            </CardTitle>
            <CardDescription>{t('privacy.notificationsHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('privacy.notificationsEmpty')}</p>
            ) : (
              <ul className="divide-y">
                {notifications.map((item) => (
                  <li key={item.id} className={`py-3 text-sm ${item.readAt ? '' : 'font-medium'}`}>
                    <p>{item.title}</p>
                    <p className="text-muted-foreground font-normal mt-1">{item.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.at ? new Date(item.at).toLocaleString('en-IN') : ''}
                      {item.smsStatus ? ` · SMS ${t(`privacy.smsStatus.${item.smsStatus}`, item.smsStatus)}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-5 w-5" />
              {t('privacy.activityHeading')}
            </CardTitle>
            <CardDescription>{t('privacy.activityHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('privacy.activityEmpty')}</p>
            ) : (
              <ul className="divide-y">
                {activity.map((event, index) => (
                  <li key={`${event.at}-${index}`} className="py-3 flex justify-between gap-4 text-sm">
                    <span>{t(`privacy.actions.${event.action}`, ACTION_LABELS[event.action] || event.action)}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {event.at ? new Date(event.at).toLocaleString('en-IN') : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="h-5 w-5" />
              {t('privacy.complaintHeading')}
            </CardTitle>
            <CardDescription>
              {t('privacy.complaintHint', { email: GRIEVANCE_EMAIL })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleComplaint} className="space-y-4">
              <Input
                label={t('privacy.complaintSubject')}
                value={complaint.subject}
                onChange={(e) => setComplaint((prev) => ({ ...prev, subject: e.target.value }))}
                required
              />
              <div>
                <label className="block text-sm font-medium mb-2">{t('privacy.complaintMessage')}</label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm"
                  value={complaint.message}
                  onChange={(e) => setComplaint((prev) => ({ ...prev, message: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" disabled={sendingComplaint}>
                {sendingComplaint && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('privacy.sendComplaint')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-destructive">
              <Trash2 className="h-5 w-5" />
              {t('privacy.deleteHeading')}
            </CardTitle>
            <CardDescription>{t('privacy.deleteHint')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-300 px-3 py-2 text-sm font-medium text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {t('privacy.deleteWarning')}
            </div>
            <Input
              label={t('privacy.deleteTypeDelete')}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
            <Button
              variant="destructive"
              onClick={handleDelete}
              data-no-auto-confirm
              disabled={deleting || deleteConfirm !== 'DELETE'}
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {t('privacy.deleteAccount')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

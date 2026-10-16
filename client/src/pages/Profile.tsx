// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Building2, MapPin, Save, Loader2, Shield, ShieldCheck, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RoleBadge } from '@/components/auth/RolePicker';
import { ROLE_META, toAppRole } from '@/lib/rbac';
import { useNavigate } from 'react-router-dom';

import { useClusterFormText } from '@/lib/clusterDprFormText';
export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const tf = useClusterFormText();
  const navigate = useNavigate();
  const { user: authUser, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    udyamNumber: '',
    location: '',
    phoneNumber: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.getProfile();
        const profileData = response.data || response;
        
        setFormData({
          name: profileData.name || authUser?.name || '',
          email: profileData.email || authUser?.email || '',
          role: profileData.role || authUser?.role || '',
          udyamNumber: profileData.udyamNumber || authUser?.udyamNumber || '',
          location: profileData.location || authUser?.location || '',
          phoneNumber: profileData.phoneNumber || authUser?.phoneNumber || '',
        });
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        // Fallback to auth store data if API fails
        if (authUser) {
          setFormData({
            name: authUser.name || '',
            email: authUser.email || '',
            role: authUser.role || '',
            udyamNumber: authUser.udyamNumber || '',
            location: authUser.location || '',
            phoneNumber: authUser.phoneNumber || '',
          });
        } else {
          toast.error(tf('Failed to load profile'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.updateProfile({
        name: formData.name,
        udyamNumber: formData.udyamNumber,
        location: formData.location,
        phoneNumber: formData.phoneNumber,
      });

      const updatedUser = response.data || response;
      updateUser(updatedUser);
      toast.success(tf('Profile updated successfully'));
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || tf('Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">{tf('Profile')}</h1>
          <p className="text-muted-foreground">{tf('Manage your account information')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {tf('Personal Information')}
            </CardTitle>
            <CardDescription>
              {tf('Update your profile details below')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {tf('Full Name')}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder={tf('Enter your full name')}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {tf('Email Address')}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                    className="bg-muted cursor-not-allowed"
                    placeholder={tf('Email address')}
                  />
                  <p className="text-xs text-muted-foreground">{tf('Email cannot be changed')}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {tf('Role')}
                  </label>
                  <div className="flex flex-col gap-2 rounded-md border bg-muted/40 px-3 py-3">
                    <RoleBadge role={formData.role} />
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      {ROLE_META[toAppRole(formData.role)].permissionKeys.map((key) => (
                        <li key={key}>{t(key)}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('rbac.roleCannotChange')}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="udyamNumber" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {tf('Udyam Number')}
                  </label>
                  <Input
                    id="udyamNumber"
                    name="udyamNumber"
                    type="text"
                    format="udyam"
                    value={formData.udyamNumber}
                    onChange={handleChange}
                    placeholder={tf('Enter your Udyam registration number')}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t('auth.phoneNumber')}
                  </label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                  />
                  <p className="text-xs text-muted-foreground">{t('privacy.phoneHint')}</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="location" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {tf('Location')}
                  </label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder={tf('Enter your location')}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {tf('Saving...')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {tf('Save Changes')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              {t('privacy.settingsTitle')}
            </CardTitle>
            <CardDescription>{t('privacy.settingsSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={() => navigate('/account/privacy')}>
              {t('privacy.openSettings')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};


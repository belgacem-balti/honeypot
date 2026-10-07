import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { User, Mail, Lock, Shield, Calendar } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.users.updateProfile(profileData);
      const updatedUser = res.data?.data?.user || res.data?.data || res.data?.user || res.data;
      updateUser(updatedUser);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error('Passwords don\'t match');
    }
    setPassLoading(true);
    try {
      await api.users.updatePassword({
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      toast.success('Password updated');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main forms */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile card */}
          <Card padding="none">
            <div className="p-5 pb-0">
              <h2 className="text-[15px] font-semibold text-gray-900">Profile</h2>
              <p className="text-xs text-gray-500 mt-0.5">Update your personal information</p>
            </div>

            <form onSubmit={handleProfileUpdate} className="p-5">
              {/* Avatar row */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-600">{initials}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Full name"
                  icon={User}
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                />
                <Input
                  label="Email address"
                  icon={Mail}
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                />
              </div>

              <div className="mt-5 flex justify-end">
                <Button type="submit" variant="primary" size="md" loading={profileLoading}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Password card */}
          <Card padding="none">
            <div className="p-5 pb-0">
              <h2 className="text-[15px] font-semibold text-gray-900">Password</h2>
              <p className="text-xs text-gray-500 mt-0.5">Change your password to keep your account secure</p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="p-5 space-y-4">
              <Input
                label="Current password"
                icon={Lock}
                type="password"
                value={passData.currentPassword}
                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                required
                autoComplete="current-password"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New password"
                  icon={Lock}
                  type="password"
                  value={passData.newPassword}
                  onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                  required
                  hint="Min. 6 characters"
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm password"
                  icon={Lock}
                  type="password"
                  value={passData.confirmPassword}
                  onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="mt-1 flex justify-end">
                <Button type="submit" variant="primary" size="md" loading={passLoading}>
                  Update password
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-5">
          <Card padding="lg">
            <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Account</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Member since</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {user?.createdAt ? formatDate(user.createdAt) : '—'}
                  </p>
                </div>
              </div>

              <div className="divider" />

              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge variant="success" dot>Active</Badge>
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge variant="info" dot>Verified</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="bg-danger-50 border-danger-100">
            <h3 className="text-[13px] font-semibold text-danger-700 mb-1">Danger zone</h3>
            <p className="text-xs text-danger-600/70 mb-4">
              Once you delete your account, there's no going back.
            </p>
            <Button variant="danger" size="sm" className="w-full">
              Delete account
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

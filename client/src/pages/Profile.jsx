import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.users.updateProfile(profileData);
      const updatedUser = res.data?.data?.user || res.data?.data || res.data?.user || res.data;
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passData.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setPassLoading(true);
    try {
      await api.users.updatePassword({ 
        currentPassword: passData.currentPassword, 
        newPassword: passData.newPassword 
      });
      toast.success('Password updated successfully');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{user?.name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Input 
                label="Full Name" 
                value={profileData.name} 
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} 
                required 
              />
              <Input 
                label="Email Address" 
                type="email" 
                value={profileData.email} 
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} 
                required 
              />
              <div className="pt-2">
                <Button type="submit" variant="primary" loading={profileLoading}>Save Changes</Button>
              </div>
            </form>
          </Card>

          <Card padding="lg">
            <h2 className="text-xl font-semibold mb-6">Change Password</h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <Input 
                label="Current Password" 
                type="password" 
                value={passData.currentPassword} 
                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })} 
                required 
              />
              <Input 
                label="New Password" 
                type="password" 
                value={passData.newPassword} 
                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })} 
                required 
              />
              <Input 
                label="Confirm New Password" 
                type="password" 
                value={passData.confirmPassword} 
                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })} 
                required 
              />
              <div className="pt-2">
                <Button type="submit" variant="primary" loading={passLoading}>Update Password</Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card padding="lg">
            <h2 className="text-xl font-semibold mb-6">Account Info</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Member since</p>
                <p className="font-medium text-gray-900">{user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Status</p>
                <Badge variant="success">Active</Badge>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Email verification</p>
                <Badge variant="info">Verified</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

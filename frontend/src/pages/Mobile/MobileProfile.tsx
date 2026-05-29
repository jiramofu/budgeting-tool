/**
 * Mobile Profile Page
 * User profile information and account details
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '../../components/Mobile/MobileHeader';
import { MobileNavigation } from '../../components/Mobile/MobileNavigation';
import { apiClient } from '../../services/api';

interface MobileProfileProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const MobileProfile: React.FC<MobileProfileProps> = ({
  activeTab = 'profile',
  onTabChange,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user settings to display profile info
        const settings = await apiClient.getUserSettings();
        setUserData({
          currency: settings.data.currency,
          theme: settings.data.theme,
          language: settings.data.language,
          emailNotifications: settings.data.emailNotifications,
          profilePicture: settings.data.profilePicture,
        });
        if (settings.data.profilePicture) {
          setProfilePicture(settings.data.profilePicture);
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingPicture(true);
      setError(null);

      const response = await apiClient.uploadProfilePicture(file);

      // Update profile picture
      setProfilePicture(response.data.profilePictureUrl);
      setUserData({
        ...userData,
        profilePicture: response.data.profilePictureUrl,
      });
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      setError('Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <MobileHeader />
        <div className="px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <MobileNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <MobileHeader />
        <div className="px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
        <MobileNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <MobileHeader />

      <div className="px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile
        </h1>

        {/* User Avatar Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
          <div className="relative w-20 h-20 mb-4 group cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              )}
            </div>
            {/* Upload overlay */}
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              disabled={uploadingPicture}
              className="absolute inset-0 w-full h-full rounded-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {uploadingPicture ? 'Uploading...' : 'Click to add photo'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
            Max size: 5MB
          </p>
        </div>

        {/* Preferences Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Preferences
          </h2>

          {/* Currency */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  Currency
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Default currency for amounts
                </p>
              </div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {userData?.currency || 'USD'}
              </p>
            </div>
          </div>

          {/* Theme */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  Theme
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Light, dark, or system default
                </p>
              </div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 capitalize">
                {userData?.theme || 'System'}
              </p>
            </div>
          </div>

          {/* Language */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  Language
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your preferred language
                </p>
              </div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase">
                {userData?.language || 'EN'}
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  Email Notifications
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Budget alerts and updates
                </p>
              </div>
              <div className={`w-2 h-2 rounded-full ${userData?.emailNotifications ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
          </div>
        </div>

        {/* Account Info Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Account
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Account Type
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Personal
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Member Since
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                May 2026
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Status
              </span>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => navigate('/mobile/settings')}
          className="w-full py-3 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors"
        >
          Edit Settings
        </button>
      </div>

      <MobileNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default MobileProfile;

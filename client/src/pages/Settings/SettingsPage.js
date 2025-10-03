import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { BellIcon, LanguageIcon, SunIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm();

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/users/settings');
      setSettings(response.data);
      reset(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit = async (data) => {
    try {
      await api.put('/users/settings', data);
      setSettings({ ...settings, ...data });
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Notifications */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BellIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive email updates about your reports and appointments</p>
              </div>
              <input
                {...register('emailNotifications')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-500">Receive SMS updates for urgent matters</p>
              </div>
              <input
                {...register('smsNotifications')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <LanguageIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Language & Region</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                Preferred Language
              </label>
              <select
                {...register('language')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <select
                {...register('timezone')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <SunIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Privacy & Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Data Sharing</h3>
                <p className="text-sm text-gray-500">Allow anonymized data to be used for research</p>
              </div>
              <input
                {...register('dataSharing')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <input
                {...register('twoFactorAuth')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;

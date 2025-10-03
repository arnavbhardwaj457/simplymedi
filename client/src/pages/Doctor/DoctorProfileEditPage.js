import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { UserIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const DoctorProfileEditPage = () => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const fetchDoctor = useCallback(async () => {
    try {
      const response = await api.get('/doctors/profile');
      setDoctor(response.data);
      reset(response.data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  const onSubmit = async (data) => {
    try {
      await api.put('/doctors/profile', data);
      setDoctor({ ...doctor, ...data });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <UserIcon className="h-6 w-6 text-indigo-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">Edit Doctor Profile</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                Specialization
              </label>
              <select
                {...register('specialization', { required: 'Specialization is required' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select specialization</option>
                <option value="cardiology">Cardiology</option>
                <option value="dermatology">Dermatology</option>
                <option value="neurology">Neurology</option>
                <option value="orthopedics">Orthopedics</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="psychiatry">Psychiatry</option>
                <option value="general">General Medicine</option>
              </select>
              {errors.specialization && (
                <p className="mt-1 text-sm text-red-600">{errors.specialization.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                {...register('experience', { 
                  required: 'Experience is required',
                  min: { value: 0, message: 'Experience must be 0 or more' }
                })}
                type="number"
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.experience && (
                <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                Medical License Number
              </label>
              <input
                {...register('licenseNumber', { required: 'License number is required' })}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.licenseNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.licenseNumber.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="education" className="block text-sm font-medium text-gray-700">
                Education
              </label>
              <input
                {...register('education')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., MD, Internal Medicine"
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              {...register('bio')}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Tell patients about yourself..."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorProfileEditPage;

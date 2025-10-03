import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, UserIcon, StarIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const DoctorProfilePage = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDoctor = useCallback(async () => {
    try {
      const response = await api.get(`/doctors/${id}`);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Doctor not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The doctor you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/app/doctors"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/app/doctors"
            className="mr-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Doctors
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Profile</h1>
        </div>
        <Link
          to={`/app/appointments/book/${doctor.id}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <CalendarIcon className="h-5 w-5 mr-2" />
          Book Appointment
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Info */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 bg-indigo-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-indigo-600" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                Dr. {doctor.firstName} {doctor.lastName}
              </h2>
              <p className="text-sm text-gray-500">{doctor.specialization}</p>
              <div className="mt-2 flex items-center justify-center">
                <StarIcon className="h-4 w-4 text-yellow-400" />
                <span className="ml-1 text-sm text-gray-600">4.8 (24 reviews)</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Experience</h3>
                <p className="text-sm text-gray-600">{doctor.experience} years</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Education</h3>
                <p className="text-sm text-gray-600">MD, Internal Medicine</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Languages</h3>
                <p className="text-sm text-gray-600">English, Spanish</p>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">About</h3>
            <p className="text-sm text-gray-600">
              Dr. {doctor.lastName} is a highly experienced {doctor.specialization} specialist 
              with over {doctor.experience} years of practice. He is dedicated to providing 
              comprehensive and compassionate care to all patients.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Specializations</h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                {doctor.specialization}
              </span>
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                Preventive Care
              </span>
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                Chronic Disease Management
              </span>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Availability</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span>Monday - Friday: 9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span>Saturday: 9:00 AM - 1:00 PM</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span>Sunday: Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserIcon, StarIcon, CalendarIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';

const DoctorsPage = () => {
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specialization, setSpecialization] = useState('all');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setError(null);
      const response = await api.get('/doctors-public');
      setDoctors(response.data?.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError(error.response?.data?.message || 'Failed to load doctors');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const specializations = ['all', 'cardiology', 'dermatology', 'neurology', 'orthopedics', 'pediatrics', 'psychiatry', 'general'];

  const filteredDoctors = doctors.filter(doctor => {
    if (specialization === 'all') return true;
    return doctor.specialization === specialization;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDoctors}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('ourDoctors')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('findTheRightHealthcareProfessional')}
        </p>
      </div>

      {/* Specialization Filter */}
      <div className="flex flex-wrap gap-2">
        {specializations.map((spec) => (
          <button
            key={spec}
            onClick={() => setSpecialization(spec)}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              specialization === spec
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {spec === 'all' ? 'All Specializations' : spec.charAt(0).toUpperCase() + spec.slice(1)}
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No doctors found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No doctors available for the selected specialization.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{doctor.specialization}</p>
                  <p className="text-sm text-gray-500">{doctor.experience} years experience</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="ml-1 text-sm text-gray-600">4.8 (24 reviews)</span>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Link
                  to={`/app/doctors/${doctor.id}`}
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  View Profile
                </Link>
                <Link
                  to={`/app/appointments/book/${doctor.id}`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorsPage;

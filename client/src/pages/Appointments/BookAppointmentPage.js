import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const BookAppointmentPage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const selectedDate = watch('appointmentDate');

  const fetchDoctors = useCallback(async () => {
    try {
      // Use mock endpoint for now (change to '/doctors' when auth is working)
      const response = await api.get('/doctors/mock');
      const doctorsData = response.data.doctors || response.data;
      
      // Ensure doctorsData is an array
      if (Array.isArray(doctorsData)) {
        setDoctors(doctorsData);
        
        if (doctorId) {
          const doctor = doctorsData.find(d => d.id === doctorId);
          if (doctor) {
            setSelectedDoctor(doctor);
          }
        }
      } else {
        console.error('Doctors data is not an array:', doctorsData);
        setDoctors([]);
        toast.error('Invalid doctors data received');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
      setDoctors([]); // Ensure doctors is always an array
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      fetchAvailableSlots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDate, selectedDoctor]);

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      const response = await api.get(`/appointments/availability/${doctorId}`, {
        params: { date }
      });
      const slots = response.data.availableSlots || [];
      setAvailableSlots(slots);
      if (slots.length === 0) {
        toast.error('No available slots for this date');
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Failed to load available time slots');
      setAvailableSlots([]);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    if (!data.appointmentTime) {
      toast.error('Please select a time slot');
      return;
    }

    setSubmitting(true);
    try {
      // Combine date and time into ISO datetime string
      const appointmentDateTime = new Date(data.appointmentTime);
      
      // Use mock endpoint for now (change to '/appointments/book' when auth is ready)
      await api.post('/appointments/book/mock', {
        doctorId: selectedDoctor.id,
        appointmentDate: appointmentDateTime.toISOString(),
        reason: data.notes || '',
        type: 'online',
        duration: 30
      });
      
      toast.success(`Appointment booked with ${selectedDoctor.name}!`);
      
      // Navigate back to appointments after a short delay
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.error || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
        <p className="mt-2 text-sm text-gray-600">
          Schedule an appointment with a healthcare professional
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Doctor
          </label>
          {doctors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No doctors available at the moment</p>
            </div>
          ) : (
          <div className="space-y-3">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedDoctor?.id === doctor.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedDoctor(doctor)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Dr. {doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`}
                    </h3>
                    <p className="text-sm text-gray-500">{doctor.specialization}</p>
                    <p className="text-sm text-gray-500">
                      {doctor.experience} years of experience • ₹{doctor.consultationFee}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Date Selection */}
        <div>
          <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">
            Appointment Date
          </label>
          <input
            {...register('appointmentDate', { required: 'Date is required' })}
            type="date"
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.appointmentDate && (
            <p className="mt-1 text-sm text-red-600">{errors.appointmentDate.message}</p>
          )}
        </div>

        {/* Time Selection */}
        {selectedDate && selectedDoctor && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Time Slots
            </label>
            {availableSlots.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Loading available slots...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {availableSlots.map((slot, index) => {
                    const isSelected = watch('appointmentTime') === slot.time;
                    return (
                      <label
                        key={slot.time || index}
                        className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          {...register('appointmentTime', { required: 'Time is required' })}
                          type="radio"
                          value={slot.time}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-indigo-700' : 'text-gray-700'
                          }`}>
                            {slot.displayTime || slot.time}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.appointmentTime && (
                  <p className="mt-2 text-sm text-red-600">{errors.appointmentTime.message}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  {availableSlots.length} slots available • Select a time to continue
                </p>
              </>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Any specific concerns or questions you'd like to discuss..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/app/appointments')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedDoctor || submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookAppointmentPage;

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  UserIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslatedTexts } from '../../hooks/useTranslation';

const Sidebar = ({ isOpen, onClose, userType = 'user' }) => {
  const { user, doctor } = useAuth();

  // Translate sidebar menu items
  const menuTexts = ['Dashboard', 'Reports', 'Chat', 'Appointments', 'Doctors', 'Profile', 'Settings'];
  const { translations } = useTranslatedTexts(menuTexts, 'navigation');

  const userNavigation = [
    { name: 'Dashboard', translatedName: translations['Dashboard'] || 'Dashboard', href: '/app/dashboard', icon: HomeIcon },
    { name: 'Reports', translatedName: translations['Reports'] || 'Reports', href: '/app/reports', icon: DocumentTextIcon },
    { name: 'Chat', translatedName: translations['Chat'] || 'Chat', href: '/app/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Appointments', translatedName: translations['Appointments'] || 'Appointments', href: '/app/appointments', icon: CalendarDaysIcon },
    { name: 'Doctors', translatedName: translations['Doctors'] || 'Doctors', href: '/app/doctors', icon: UserGroupIcon },
    { name: 'Profile', translatedName: translations['Profile'] || 'Profile', href: '/app/profile', icon: UserIcon },
    { name: 'Settings', translatedName: translations['Settings'] || 'Settings', href: '/app/settings', icon: Cog6ToothIcon },
  ];

  const doctorNavigation = [
    { name: 'Dashboard', translatedName: translations['Dashboard'] || 'Dashboard', href: '/app/doctor/dashboard', icon: HomeIcon },
    { name: 'Appointments', translatedName: translations['Appointments'] || 'Appointments', href: '/app/doctor/appointments', icon: CalendarDaysIcon },
    { name: 'Profile', translatedName: translations['Profile'] || 'Profile', href: '/app/doctor/profile', icon: UserIcon },
    { name: 'Settings', translatedName: translations['Settings'] || 'Settings', href: '/app/settings', icon: Cog6ToothIcon },
  ];

  const navigation = userType === 'doctor' ? doctorNavigation : userNavigation;

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-white/95 to-brown-50/95 backdrop-blur-lg shadow-strong transform transition-all duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-brown-200">
          <h1 className="text-xl font-semibold text-brown-900 animate-slide-in-left">SimplyMedi</h1>
          <button
            type="button"
            className="p-2 rounded-md text-brown-400 hover:text-brown-600 hover:bg-brown-100 transition-all duration-200 hover:scale-110"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-brown-100 to-coffee-100 text-brown-900 shadow-coffee'
                      : 'text-secondary-700 hover:bg-brown-50 hover:text-brown-900 hover:shadow-soft'
                  }`
                }
                onClick={onClose}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                    window.location.pathname === item.href
                      ? 'text-brown-600'
                      : 'text-brown-400 group-hover:text-brown-600'
                  }`}
                />
                {item.translatedName}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-gradient-to-b lg:from-white/95 lg:to-brown-50/95 lg:backdrop-blur-lg lg:border-r lg:border-brown-200 lg:shadow-brown">
        <div className="flex items-center h-16 px-4 border-b border-brown-200">
          <h1 className="text-xl font-semibold text-brown-900 animate-fade-in">SimplyMedi</h1>
        </div>
        
        <nav className="mt-5 flex-1 px-2 pb-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 animate-slide-in-left ${
                  isActive
                    ? 'bg-gradient-to-r from-brown-100 to-coffee-100 text-brown-900 shadow-coffee'
                    : 'text-secondary-700 hover:bg-brown-50 hover:text-brown-900 hover:shadow-soft'
                }`
              }
            >
              <item.icon
                className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                  window.location.pathname === item.href
                    ? 'text-brown-600'
                    : 'text-brown-400 group-hover:text-brown-600'
                }`}
              />
              {item.translatedName}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-brown-200 bg-gradient-to-r from-brown-50 to-coffee-50">
          <div className="flex items-center animate-fade-in-up">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gradient-to-br from-brown-100 to-coffee-100 rounded-full flex items-center justify-center shadow-coffee hover:scale-110 transition-transform duration-200">
                <span className="text-sm font-medium text-brown-700">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-secondary-600">{user?.email}</p>
              {doctor && (
                <p className="text-xs text-brown-700 font-medium">
                  Doctor - {doctor.specialization}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

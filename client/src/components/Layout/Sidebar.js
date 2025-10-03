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

const Sidebar = ({ isOpen, onClose, userType = 'user' }) => {
  const { user, doctor } = useAuth();

  const userNavigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon },
    { name: 'Reports', href: '/app/reports', icon: DocumentTextIcon },
    { name: 'Chat', href: '/app/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Appointments', href: '/app/appointments', icon: CalendarDaysIcon },
    { name: 'Doctors', href: '/app/doctors', icon: UserGroupIcon },
    { name: 'Profile', href: '/app/profile', icon: UserIcon },
    { name: 'Settings', href: '/app/settings', icon: Cog6ToothIcon },
  ];

  const doctorNavigation = [
    { name: 'Dashboard', href: '/app/doctor/dashboard', icon: HomeIcon },
    { name: 'Appointments', href: '/app/doctor/appointments', icon: CalendarDaysIcon },
    { name: 'Profile', href: '/app/doctor/profile', icon: UserIcon },
    { name: 'Settings', href: '/app/settings', icon: Cog6ToothIcon },
  ];

  const navigation = userType === 'doctor' ? doctorNavigation : userNavigation;

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">SimplyMedi</h1>
          <button
            type="button"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
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
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                onClick={onClose}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    window.location.pathname === item.href
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">SimplyMedi</h1>
        </div>
        
        <nav className="mt-5 flex-1 px-2 pb-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  window.location.pathname === item.href
                    ? 'text-primary-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {doctor && (
                <p className="text-xs text-primary-600 font-medium">
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

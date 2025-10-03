import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Header = ({ onMenuClick, user, doctor }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { logout } = useAuth();
  const { unreadCount } = useNotification();
  const { currentLanguage, getLanguageName } = useLanguage();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const userMenuItems = [
    {
      name: 'Profile',
      href: '/app/profile',
      icon: UserCircleIcon,
    },
    {
      name: 'Settings',
      href: '/app/settings',
      icon: Cog6ToothIcon,
    },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-gray-900">
                SimplyMedi
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language indicator */}
            <div className="hidden sm:block">
              <span className="text-sm text-gray-500">
                {getLanguageName(currentLanguage)}
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      Notifications
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      {unreadCount === 0 ? (
                        <p>No new notifications</p>
                      ) : (
                        <p>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <UserCircleIcon className="h-6 w-6" />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      {doctor && (
                        <p className="text-xs text-primary-600 font-medium">
                          Doctor - {doctor.specialization}
                        </p>
                      )}
                    </div>
                    
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <item.icon className="h-4 w-4 mr-3" />
                        {item.name}
                      </Link>
                    ))}
                    
                    <div className="border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

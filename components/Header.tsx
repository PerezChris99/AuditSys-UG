import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Role } from '../types';

const Header: React.FC = () => {
  const location = useLocation();
  const { role, setRole } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/tickets': return 'Real-Time Ticket Sales';
      case '/agents': return 'Agent Performance Monitoring';
      case '/discrepancies': return 'Automated Discrepancy Flagging';
      case '/reports': return 'Generate Reports';
      case '/ledger': return 'Immutable Transaction Ledger';
      default: return 'Dashboard';
    }
  };
  
  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <header className="h-20 bg-white shadow-sm flex items-center justify-between px-6 z-10">
      <div className="flex items-center">
        <h1 className="text-2xl font-semibold text-gray-700">{getTitle()}</h1>
        <div className="ml-4 flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-green-600">Live</span>
        </div>
      </div>
      <div className="flex items-center">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Toggle notifications"
          >
            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex justify-center items-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-lg overflow-hidden z-20 border">
              <div className="py-2 px-4 flex justify-between items-center border-b">
                <h4 className="text-gray-700 font-bold">Notifications</h4>
                {notifications.length > 0 && unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-sm text-primary-600 hover:underline focus:outline-none">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {notifications.length > 0 ? notifications.map(notif => (
                  <Link 
                    to={notif.link} 
                    key={notif.id} 
                    onClick={() => setIsDropdownOpen(false)} 
                    className={`block p-4 hover:bg-gray-50 ${!notif.isRead ? 'bg-primary-50' : ''}`}
                  >
                    <p className={`text-sm font-semibold ${notif.type === 'Discrepancy' ? 'text-red-600' : 'text-amber-600'}`}>{notif.type}</p>
                    <p className="text-sm text-gray-600">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notif.timestamp)}</p>
                  </Link>
                )) : (
                  <p className="p-4 text-sm text-center text-gray-500">No new notifications.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="ml-4 flex items-center">
          <img className="h-10 w-10 rounded-full object-cover" src="https://i.pravatar.cc/100?u=admin" alt="User" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">System Auditor</p>
            <p className="text-xs text-gray-500 capitalize">{role}</p>
          </div>
        </div>
        <div className="ml-6">
          <label htmlFor="role-switcher" className="text-xs text-gray-500 mb-1 block">Switch Role (Demo)</label>
          <select
            id="role-switcher"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
            aria-label="Switch user role"
          >
            <option value="Administrator">Administrator</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default Header;

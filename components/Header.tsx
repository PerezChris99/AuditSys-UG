import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { UserIcon, LogoutIcon, LinkIcon } from './ui/Icons';
import { getOfficialUrl } from '../lib/gemini';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [isNotificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [groundedLink, setGroundedLink] = useState<{ title: string; uri: string } | null>(null);
  const [isGrounding, setIsGrounding] = useState(false);
  
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);


  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/profile': return 'User Profile';
      case '/tickets': return 'Real-Time Ticket Sales';
      case '/agents': return 'Agent Performance Monitoring';
      case '/discrepancies': return 'Automated Discrepancy Flagging';
      case '/tasks': return 'Task Management Board';
      case '/reports': return 'Generate Reports';
      case '/ledger': return 'Immutable Transaction Ledger';
      case '/admin/users': return 'Manage Users';
      case '/admin/roles': return 'Manage Roles & Permissions';
      case '/admin/settings': return 'System Settings';
      default: return 'Dashboard';
    }
  };
  
  useEffect(() => {
    const groundTitle = async () => {
        const title = getTitle();
        // Don't search for generic pages that don't need external grounding
        if (['Dashboard Overview', 'User Profile', 'Login'].includes(title)) {
            setGroundedLink(null);
            return;
        }

        setIsGrounding(true);
        setGroundedLink(null);
        try {
            const result = await getOfficialUrl(title);
            setGroundedLink(result);
        } catch (error) {
            console.error("Failed to ground title:", error);
            setGroundedLink(null);
        } finally {
            setIsGrounding(false);
        }
    };

    groundTitle();
  }, [location.pathname]);

  const handleMarkAllRead = () => {
    markAllAsRead();
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
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
      <div>
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
         <div className="h-4 mt-1"> {/* Fixed height to prevent layout shift */}
            {isGrounding && (
                <div className="animate-pulse h-3 bg-gray-200 rounded w-1/2"></div>
            )}
            {groundedLink && !isGrounding && (
                <a 
                    href={groundedLink.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary-700 hover:underline flex items-center"
                    title={`Visit: ${groundedLink.uri}`}
                >
                    <LinkIcon className="h-3 w-3 mr-1.5" />
                    {groundedLink.title}
                </a>
            )}
        </div>
      </div>
      <div className="flex items-center">
        <div className="relative" ref={notificationDropdownRef}>
          <button 
            onClick={() => setNotificationDropdownOpen(!isNotificationDropdownOpen)}
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
          {isNotificationDropdownOpen && (
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
                    onClick={() => setNotificationDropdownOpen(false)} 
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
        {user && (
          <div className="ml-4 flex items-center" ref={userMenuRef}>
             <div className="relative">
                <button
                    onClick={() => setUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center p-2 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <img className="h-8 w-8 rounded-full object-cover" src={user.agent?.avatarUrl || `https://i.pravatar.cc/100?u=${user.username}`} alt="User" />
                    <div className="ml-3 text-left">
                        <p className="text-sm font-medium text-gray-700">{user.agent?.name || user.username}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role.name}</p>
                    </div>
                     <svg className="ml-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
                        <div className="py-1 divide-y divide-gray-100">
                           <Link
                                to="/profile"
                                onClick={() => setUserMenuOpen(false)}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                                My Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <LogoutIcon className="h-5 w-5 mr-3 text-gray-400" />
                                Sign out
                            </button>
                        </div>
                    </div>
                )}
             </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginIcon, LogoutIcon, KeyIcon, FileTextIcon } from './ui/Icons';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
            return;
        }

        // In a real application, you would make an API call here.
        // For this demo, we'll just show a success message.
        console.log('Simulating password change for user:', user?.username);
        setMessage({ type: 'success', text: 'Password changed successfully! (This is a demo)' });

        // Clear fields after submission
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        setTimeout(() => setMessage(null), 5000);
    };

    if (!user) {
        return <div>Loading user profile...</div>;
    }

    const agent = user.agent;

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

    const mockActivityLog: {id: number, action: string, timestamp: string, type: 'login' | 'logout' | 'report' | 'password'}[] = [
        { id: 1, action: 'Logged in successfully', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'login' },
        { id: 2, action: 'Generated Agent Performance report', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), type: 'report' },
        { id: 3, action: 'Password changed successfully', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), type: 'password' },
        { id: 4, action: 'Logged out', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), type: 'logout' },
        { id: 5, action: 'Logged in from a new device', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), type: 'login' },
    ];

    const activityIcons = {
        login: <LoginIcon className="h-5 w-5 text-gray-500" />,
        logout: <LogoutIcon className="h-5 w-5 text-gray-500" />,
        report: <FileTextIcon className="h-5 w-5 text-gray-500" />,
        password: <KeyIcon className="h-5 w-5 text-gray-500" />,
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow flex items-center space-x-6">
                <img
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-primary-200"
                    src={agent?.avatarUrl || `https://i.pravatar.cc/150?u=${user.username}`}
                    alt="User Avatar"
                />
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{agent?.name || user.username}</h2>
                    <p className="text-lg text-gray-500 capitalize">{user.role}</p>
                    {agent && <p className="text-md text-gray-500">{agent.email}</p>}
                </div>
            </div>

            {agent && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">My Performance Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm font-medium text-gray-500">Tickets Sold</p>
                            <p className="text-2xl font-semibold text-gray-900">{agent.ticketsSold}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <p className="text-2xl font-semibold text-gray-900">${agent.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm font-medium text-gray-500">Accuracy</p>
                            <p className={`text-2xl font-semibold ${agent.accuracy > 98 ? "text-green-600" : "text-yellow-600"}`}>{agent.accuracy}%</p>
                        </div>
                         <div className="p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm font-medium text-gray-500">Dispute Rate</p>
                            <p className={`text-2xl font-semibold ${agent.disputeRate < 1 ? "text-green-600" : "text-red-600"}`}>{agent.disputeRate}%</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Change Password</h3>
                <p className="text-sm text-gray-500 mb-6">For security, this feature would require a backend endpoint. This is a demonstration interface.</p>
                <form className="space-y-4 max-w-lg" onSubmit={handlePasswordChange}>
                     <div>
                        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                            Current Password
                        </label>
                        <div className="mt-1">
                            <input
                                type="password"
                                id="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <div className="mt-1">
                            <input
                                type="password"
                                id="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                           Confirm New Password
                        </label>
                        <div className="mt-1">
                            <input
                                type="password"
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`rounded-md p-4 mt-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Update Password
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Recent Activity Log</h3>
                 <div className="flow-root">
                    <ul role="list" className="-mb-8">
                        {mockActivityLog.map((activity, activityIdx) => (
                            <li key={activity.id}>
                                <div className="relative pb-8">
                                    {activityIdx !== mockActivityLog.length - 1 ? (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex space-x-4 items-start">
                                        <div>
                                            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                                {activityIcons[activity.type]}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-1.5">
                                            <p className="text-sm text-gray-800">{activity.action}</p>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                {formatTimeAgo(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Profile;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { EditIcon, TrashIcon, UserIcon, LoginIcon, LogoutIcon, FileTextIcon, KeyIcon, SearchIcon } from '../ui/Icons';

type ActivityLog = {
    id: string;
    action: string;
    timestamp: string;
    type: 'login' | 'logout' | 'report' | 'password' | 'generic';
};

const ManageUsers: React.FC = () => {
    const { user: currentUser, users, roles, addUser, updateUser, deleteUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        roleId: '',
    });
    const [errors, setErrors] = useState({
        username: '',
        password: '',
        roleId: '',
        form: '',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
    const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

    const validate = (fieldData: typeof formData) => {
        const newErrors = { username: '', password: '', roleId: '', form: '' };
        if (!fieldData.username.trim()) {
            newErrors.username = 'Username is required.';
        } else if (users.some(u => u.username.toLowerCase() === fieldData.username.toLowerCase() && u.id !== editingUser?.id)) {
            newErrors.username = 'Username already exists.';
        }

        if (!editingUser && (!fieldData.password || fieldData.password.length < 6)) {
            newErrors.password = 'Password must be at least 6 characters.';
        }
        
        if (!fieldData.roleId) {
            newErrors.roleId = 'A role must be selected.';
        }

        setErrors(newErrors);
        return Object.values(newErrors).every(x => x === '');
    };
    
    const generateMockActivity = (userId: string): ActivityLog[] => {
        const log: ActivityLog[] = [];
        const actions = [
            { text: 'Logged in successfully', type: 'login' as const },
            { text: 'Viewed the Transaction Ledger', type: 'generic' as const },
            { text: 'Accessed Ticket Sales records', type: 'generic' as const },
            { text: 'Generated an Agent Performance report', type: 'report' as const },
            { text: 'Exported a monthly ledger report', type: 'report' as const },
            { text: 'Investigated discrepancy DIS-162438', type: 'generic' as const },
            { text: 'Attempted to access System Settings (unauthorized)', type: 'generic' as const },
            { text: 'Changed password', type: 'password' as const },
            { text: 'Logged out', type: 'logout' as const },
        ];
        const count = Math.floor(Math.random() * 5) + 4; // 4 to 8 log entries
        for (let i = 0; i < count; i++) {
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            log.push({
                id: `${userId}-activity-${i}`,
                action: randomAction.text,
                timestamp: new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 7).toISOString(), // Within last 7 days
                type: randomAction.type
            });
        }
        return log.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    const openModalForEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            roleId: user.roleId,
        });
        setErrors({ username: '', password: '', roleId: '', form: '' });
        setActiveTab('details');
        setActivityLog(generateMockActivity(user.id));
        setIsModalOpen(true);
    };

    const openModalForAdd = () => {
        setEditingUser(null);
        const defaultRole = roles.find(r => r.name === 'Agent');
        setFormData({ username: '', password: '', roleId: defaultRole?.id || '' });
        setErrors({ username: '', password: '', roleId: '', form: '' });
        setActiveTab('details');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newFormData = { ...formData, [e.target.name]: e.target.value };
        setFormData(newFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors(prev => ({ ...prev, form: '' }));

        if (!validate(formData)) {
            return;
        }

        try {
            if (editingUser) {
                updateUser(editingUser.id, { username: formData.username, roleId: formData.roleId });
            } else {
                addUser({
                    username: formData.username,
                    password: formData.password,
                    roleId: formData.roleId,
                });
            }
            closeModal();
        } catch (error: any) {
            setErrors(prev => ({...prev, form: error.message || 'An unexpected error occurred.'}));
        }
    };

    const handleDelete = (userId: string) => {
        if (currentUser?.id === userId) {
            alert("You cannot delete your own account.");
            return;
        }
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            deleteUser(userId);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || 'Unknown Role';

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

    const activityIcons = {
        login: <LoginIcon className="h-5 w-5 text-gray-500" />,
        logout: <LogoutIcon className="h-5 w-5 text-gray-500" />,
        report: <FileTextIcon className="h-5 w-5 text-gray-500" />,
        password: <KeyIcon className="h-5 w-5 text-gray-500" />,
        generic: <UserIcon className="h-5 w-5 text-gray-500" />,
    };

    const UserModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{editingUser ? `Manage User: ${editingUser.username}` : 'Add New User'}</h2>
                
                {editingUser && (
                    <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button onClick={() => setActiveTab('details')} className={`${activeTab === 'details' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                                User Details
                            </button>
                            <button onClick={() => setActiveTab('activity')} className={`${activeTab === 'activity' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                                Activity Log
                            </button>
                        </nav>
                    </div>
                )}

                {activeTab === 'details' ? (
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/>
                                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                            </div>
                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/>
                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <select name="roleId" value={formData.roleId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                                    <option value="" disabled>Select a role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                                {errors.roleId && <p className="mt-1 text-sm text-red-600">{errors.roleId}</p>}
                            </div>
                        </div>
                        {errors.form && <p className="mt-4 text-sm text-red-600">{errors.form}</p>}
                        <div className="mt-6 flex justify-end space-x-3">
                            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">{editingUser ? 'Save Changes' : 'Create User'}</button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <div className="flow-root max-h-96 overflow-y-auto pr-2">
                             <ul role="list" className="-mb-8">
                                {activityLog.map((activity, activityIdx) => (
                                    <li key={activity.id}>
                                        <div className="relative pb-8">
                                            {activityIdx !== activityLog.length - 1 ? (
                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                            ) : null}
                                            <div className="relative flex space-x-4 items-start">
                                                <div>
                                                    <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                                        {activityIcons[activity.type] || activityIcons.generic}
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
                        <div className="mt-6 flex justify-end">
                            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {isModalOpen && <UserModal />}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">User Management</h2>
                    <button onClick={openModalForAdd} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        Add New User
                    </button>
                </div>
                <div className="mb-4 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search by username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full max-w-sm pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full" src={user.agent?.avatarUrl || `https://i.pravatar.cc/100?u=${user.username}`} alt={user.username} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                                    <div className="text-sm text-gray-500">{user.agent?.email || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {getRoleName(user.roleId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <button onClick={() => openModalForEdit(user)} className="p-2 text-gray-400 hover:text-primary-600" title="Manage user">
                                                <EditIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-600" title="Delete user">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-gray-500">
                                        No users found matching "{searchTerm}".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default ManageUsers;
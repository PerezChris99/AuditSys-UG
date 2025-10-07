
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Role } from '../../types';
import { EditIcon, TrashIcon, UserIcon } from '../ui/Icons';

const ManageUsers: React.FC = () => {
    const { user: currentUser, users, addUser, updateUser, deleteUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'Agent' as Role,
    });
    const [errors, setErrors] = useState({
        username: '',
        password: '',
        form: '',
    });

    const validate = (fieldData: typeof formData) => {
        const newErrors = { username: '', password: '', form: '' };
        if (!fieldData.username.trim()) {
            newErrors.username = 'Username is required.';
        } else if (users.some(u => u.username.toLowerCase() === fieldData.username.toLowerCase() && u.id !== editingUser?.id)) {
            newErrors.username = 'Username already exists.';
        }

        if (!editingUser && (!fieldData.password || fieldData.password.length < 6)) {
            newErrors.password = 'Password must be at least 6 characters.';
        }
        setErrors(newErrors);
        return Object.values(newErrors).every(x => x === '');
    };

    const openModalForEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            role: user.role,
        });
        setErrors({ username: '', password: '', form: '' });
        setIsModalOpen(true);
    };

    const openModalForAdd = () => {
        setEditingUser(null);
        setFormData({ username: '', password: '', role: 'Agent' });
        setErrors({ username: '', password: '', form: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newFormData = { ...formData, [e.target.name]: e.target.value };
        setFormData(newFormData);
        validate(newFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors(prev => ({ ...prev, form: '' }));

        if (!validate(formData)) {
            return;
        }

        try {
            if (editingUser) {
                // Edit user
                updateUser(editingUser.id, { username: formData.username, role: formData.role });
            } else {
                // Add user
                addUser({
                    username: formData.username,
                    password: formData.password,
                    role: formData.role,
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
    
    const isFormValid = Object.values(errors).every(x => x === '');

    const UserModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h2>
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
                            <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                                {(['Administrator', 'Auditor', 'Finance Officer', 'Agent', 'Viewer'] as Role[]).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {errors.form && <p className="mt-4 text-sm text-red-600">{errors.form}</p>}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={!isFormValid} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">{editingUser ? 'Save Changes' : 'Create User'}</button>
                    </div>
                </form>
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
                            {users.map(user => (
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
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                        <button onClick={() => openModalForEdit(user)} className="p-2 text-gray-400 hover:text-primary-600" title="Edit user">
                                            <EditIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-600" title="Delete user">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default ManageUsers;

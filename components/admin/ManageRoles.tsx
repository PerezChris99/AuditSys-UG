import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role, Permission } from '../../types';
import { EditIcon, TrashIcon } from '../ui/Icons';
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES } from '../../lib/permissions';

const ManageRoles: React.FC = () => {
    const { roles, addRole, updateRole, deleteRole } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        description: string;
        permissions: Permission[];
    }>({ name: '', description: '', permissions: [] });
    const [formError, setFormError] = useState('');

    const openModalForAdd = () => {
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: [] });
        setFormError('');
        setIsModalOpen(true);
    };

    const openModalForEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description,
            permissions: [...role.permissions],
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
    };

    const handlePermissionChange = (permission: Permission, isChecked: boolean) => {
        setFormData(prev => {
            const newPermissions = isChecked
                ? [...prev.permissions, permission]
                : prev.permissions.filter(p => p !== permission);
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!formData.name.trim()) {
            setFormError('Role name is required.');
            return;
        }

        try {
            if (editingRole) {
                updateRole(editingRole.id, formData);
            } else {
                addRole(formData);
            }
            closeModal();
        } catch (error: any) {
            setFormError(error.message);
        }
    };

    const handleDelete = (role: Role) => {
        if (role.isDefault) {
            alert('Default roles cannot be deleted.');
            return;
        }
        if (window.confirm(`Are you sure you want to delete the "${role.name}" role? This action cannot be undone.`)) {
            try {
                deleteRole(role.id);
            } catch (error: any) {
                alert(`Error: ${error.message}`);
            }
        }
    };

    const RoleModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4">{editingRole ? 'Edit Role' : 'Add New Role'}</h2>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Role Name</label>
                            <input type="text" id="name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea id="description" rows={2} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Permissions</h3>
                            <div className="space-y-4">
                                {PERMISSION_CATEGORIES.map(category => {
                                    const categoryPermissions = ALL_PERMISSIONS.filter(p => p.category === category);
                                    const categoryPermissionIds = categoryPermissions.map(p => p.id);
                                    const areAllSelected = categoryPermissions.every(p => formData.permissions.includes(p.id));

                                    const handleSelectAllInCategory = (isChecked: boolean) => {
                                        setFormData(prev => {
                                            const currentPermissions = new Set(prev.permissions);
                                            if (isChecked) {
                                                categoryPermissionIds.forEach(id => currentPermissions.add(id));
                                            } else {
                                                categoryPermissionIds.forEach(id => currentPermissions.delete(id));
                                            }
                                            return { ...prev, permissions: Array.from(currentPermissions) };
                                        });
                                    };

                                    return (
                                        <div key={category}>
                                            <div className="flex justify-between items-center border-b pb-1 mb-2">
                                                <h4 className="font-semibold text-gray-700">{category}</h4>
                                                <label className="flex items-center space-x-2 text-xs text-gray-600 cursor-pointer p-1 hover:bg-gray-100 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={areAllSelected}
                                                        onChange={e => handleSelectAllInCategory(e.target.checked)}
                                                        className="h-3.5 w-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                    />
                                                    <span>Select All</span>
                                                </label>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {categoryPermissions.map(permission => (
                                                    <label key={permission.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.permissions.includes(permission.id)}
                                                            onChange={e => handlePermissionChange(permission.id, e.target.checked)}
                                                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                        />
                                                        <span className="text-sm text-gray-700">{permission.description}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {formError && <p className="mt-4 text-sm text-center text-red-600 bg-red-50 p-2 rounded-md">{formError}</p>}
                </form>
                 <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">{editingRole ? 'Save Changes' : 'Create Role'}</button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {isModalOpen && <RoleModal />}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">Manage Roles & Permissions</h2>
                    <button onClick={openModalForAdd} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700">
                        Add New Role
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {roles.map(role => (
                                <tr key={role.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-md truncate">{role.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{role.permissions.length}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                        <button onClick={() => openModalForEdit(role)} className="p-2 text-gray-400 hover:text-primary-600" title="Edit role">
                                            <EditIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDelete(role)} disabled={role.isDefault} className="p-2 text-gray-400 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed" title={role.isDefault ? 'Cannot delete default role' : 'Delete role'}>
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

export default ManageRoles;
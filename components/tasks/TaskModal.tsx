
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskStatus, TaskPriority, Role } from '../../types';

const TaskModal: React.FC = () => {
    const { isTaskModalOpen, closeTaskModal, taskInitialData, addTask, updateTask } = useData();
    const { users, roles } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigneeId: '',
        status: TaskStatus.ToDo,
        priority: TaskPriority.Medium,
        dueDate: '',
    });
    
    const [errors, setErrors] = useState({ title: '' });

    const managementUsers = useMemo(() => {
        // Find all roles that have the 'manage_tasks' permission.
        const taskManagementRoleIds = roles
            .filter(role => role.permissions.includes('manage_tasks'))
            .map(r => r.id);
        
        // Filter users who have one of these roles.
        return users.filter(u => taskManagementRoleIds.includes(u.roleId));
    }, [users, roles]);
    
    useEffect(() => {
        if (isTaskModalOpen) {
            setFormData({
                title: taskInitialData?.title || '',
                description: taskInitialData?.description || '',
                assigneeId: taskInitialData?.assigneeId || '',
                status: taskInitialData?.status || TaskStatus.ToDo,
                priority: taskInitialData?.priority || TaskPriority.Medium,
                dueDate: taskInitialData?.dueDate || '',
            });
            setErrors({ title: '' });
        }
    }, [isTaskModalOpen, taskInitialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const validate = () => {
        if (!formData.title.trim()) {
            setErrors({ title: 'Title is required.' });
            return false;
        }
        if (!formData.assigneeId) {
             setErrors({ title: 'An assignee is required.' });
            return false;
        }
        setErrors({ title: '' });
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        if (taskInitialData?.id) {
            // Editing existing task
            updateTask(taskInitialData.id, formData);
        } else {
            // Creating new task
            addTask({
                ...formData,
                relatedDiscrepancyId: taskInitialData?.relatedDiscrepancyId,
            });
        }
        closeTaskModal();
    };

    if (!isTaskModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{taskInitialData?.id ? 'Edit Task' : 'Create New Task'}</h2>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/>
                             {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">Assign To</label>
                                <select id="assigneeId" name="assigneeId" value={formData.assigneeId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                                    <option value="" disabled>Select a user...</option>
                                    {managementUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                                <input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/>
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                                <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                                    {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                                <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                                     {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                     <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={closeTaskModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">{taskInitialData?.id ? 'Save Changes' : 'Create Task'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;

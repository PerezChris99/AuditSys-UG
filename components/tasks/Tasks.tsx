
import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskStatus, TaskPriority, User } from '../../types';
import TaskCard from './TaskCard';

const TaskColumn: React.FC<{ title: TaskStatus; tasks: Task[]; users: User[] }> = ({ title, tasks, users }) => {
    return (
        <div className="bg-gray-100 rounded-lg p-3 flex-1">
            <h3 className="font-semibold text-gray-700 px-1 mb-3">{title} ({tasks.length})</h3>
            <div className="space-y-3 h-full overflow-y-auto">
                {tasks.length > 0 ? (
                    tasks.map(task => <TaskCard key={task.id} task={task} users={users} />)
                ) : (
                    <div className="text-center text-sm text-gray-500 py-4">No tasks in this stage.</div>
                )}
            </div>
        </div>
    );
};

const Tasks: React.FC = () => {
    const { tasks, openTaskModal } = useData();
    const { users, roles } = useAuth();
    const [filters, setFilters] = useState({
        assigneeId: 'All',
        priority: 'All',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const managementUsers = useMemo(() => {
        // Find all roles that have the 'manage_tasks' permission.
        const taskManagementRoleIds = roles
            .filter(role => role.permissions.includes('manage_tasks'))
            .map(r => r.id);
        
        // Filter users who have one of these roles.
        return users.filter(u => taskManagementRoleIds.includes(u.roleId));
    }, [users, roles]);
    
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const assigneeMatch = filters.assigneeId === 'All' || task.assigneeId === filters.assigneeId;
            const priorityMatch = filters.priority === 'All' || task.priority === filters.priority;
            return assigneeMatch && priorityMatch;
        });
    }, [tasks, filters]);

    const tasksByStatus = useMemo(() => {
        return {
            [TaskStatus.ToDo]: filteredTasks.filter(t => t.status === TaskStatus.ToDo),
            [TaskStatus.InProgress]: filteredTasks.filter(t => t.status === TaskStatus.InProgress),
            [TaskStatus.Completed]: filteredTasks.filter(t => t.status === TaskStatus.Completed),
        };
    }, [filteredTasks]);

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white p-4 rounded-lg shadow mb-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-700">Task Board</h2>
                    <button onClick={() => openTaskModal()} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700">
                        Create Task
                    </button>
                </div>
                 <div className="mt-4 flex items-center space-x-4">
                    <div>
                        <label htmlFor="assigneeId" className="text-sm font-medium text-gray-700">Assignee:</label>
                        <select
                            id="assigneeId"
                            name="assigneeId"
                            value={filters.assigneeId}
                            onChange={handleFilterChange}
                            className="ml-2 pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                            <option value="All">All Users</option>
                            {managementUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="priority" className="text-sm font-medium text-gray-700">Priority:</label>
                        <select
                            id="priority"
                            name="priority"
                            value={filters.priority}
                            onChange={handleFilterChange}
                            className="ml-2 pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                            <option value="All">All Priorities</option>
                            {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex space-x-4 overflow-x-auto pb-4">
                <TaskColumn title={TaskStatus.ToDo} tasks={tasksByStatus[TaskStatus.ToDo]} users={users} />
                <TaskColumn title={TaskStatus.InProgress} tasks={tasksByStatus[TaskStatus.InProgress]} users={users} />
                <TaskColumn title={TaskStatus.Completed} tasks={tasksByStatus[TaskStatus.Completed]} users={users} />
            </div>
        </div>
    );
};

export default Tasks;

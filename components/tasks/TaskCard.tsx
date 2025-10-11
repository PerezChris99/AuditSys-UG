import React, { useMemo } from 'react';
import { Task, User, TaskPriority, TaskStatus } from '../../types';
import { useData } from '../../context/DataContext';
import { LinkIcon, EditIcon } from '../ui/Icons';
import { Link } from 'react-router-dom';

interface TaskCardProps {
    task: Task;
    users: User[];
}

const TaskCard: React.FC<TaskCardProps> = ({ task, users }) => {
    const { openTaskModal } = useData();
    const assignee = users.find(u => u.id === task.assigneeId);

    const priorityBarStyles: Record<TaskPriority, string> = {
        [TaskPriority.Low]: 'bg-blue-400',
        [TaskPriority.Medium]: 'bg-yellow-400',
        [TaskPriority.High]: 'bg-red-400',
    };

    const getDaysUntilDue = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffTime = due.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const daysUntilDue = task.dueDate ? getDaysUntilDue(task.dueDate) : null;
    
    const dueDateText = useMemo(() => {
        if (!task.dueDate || daysUntilDue === null) return null;

        if (daysUntilDue < 0) return <span className="text-red-600 font-semibold">Overdue</span>;
        if (daysUntilDue === 0) return <span className="text-yellow-600 font-semibold">Due Today</span>;
        return <span className="text-gray-500">{`Due in ${daysUntilDue} day(s)`}</span>;
    }, [task.dueDate, daysUntilDue]);
    
    const cardHighlightClass = useMemo(() => {
        if (task.status === TaskStatus.Completed || daysUntilDue === null) {
            return 'border-gray-200 bg-white';
        }
        if (daysUntilDue < 0) {
            return 'border-red-400 ring-2 ring-red-100 bg-red-50'; // Overdue
        }
        if (daysUntilDue === 0) {
            return 'border-yellow-400 ring-2 ring-yellow-100 bg-yellow-50'; // Due today
        }
        return 'border-gray-200 bg-white';
    }, [daysUntilDue, task.status]);

    const progress = useMemo(() => {
        switch (task.status) {
            case TaskStatus.ToDo:
                return 10;
            case TaskStatus.InProgress:
                return 50;
            case TaskStatus.Completed:
                return 100;
            default:
                return 0;
        }
    }, [task.status]);

    const progressColor = useMemo(() => {
        if (task.status === TaskStatus.Completed) {
            return 'bg-green-500';
        }
        return 'bg-primary-500';
    }, [task.status]);

    return (
        <div className={`relative p-3 pl-4 rounded-md shadow-sm border flex flex-col justify-between ${cardHighlightClass}`}>
            <div className={`absolute left-0 top-0 h-full w-1 rounded-l-md ${priorityBarStyles[task.priority]}`}></div>
            <div>
                <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-gray-800 pr-2">{task.title}</p>
                    <button onClick={() => openTaskModal(task)} className="p-1 text-gray-400 hover:text-primary-600 flex-shrink-0">
                        <EditIcon className="h-4 w-4" />
                    </button>
                </div>
                 {task.description && (
                    <p className="text-xs text-gray-500 mt-1 break-words">
                        {task.description.substring(0, 75)}{task.description.length > 75 ? '...' : ''}
                    </p>
                )}
            </div>

            <div className="mt-3">
                <div className="mb-2">
                    <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">Progress</span>
                        <span className="text-xs font-medium text-gray-500">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                            className={`${progressColor} h-1.5 rounded-full transition-all duration-500 ease-out`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
    
                <div className="flex justify-between items-end mt-3">
                     <div className="flex items-center space-x-2">
                        {task.relatedDiscrepancyId && (
                            <Link to={`/discrepancies`} className="flex items-center text-xs text-blue-600 hover:underline">
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Discrepancy
                            </Link>
                        )}
                        <div className="text-xs">{dueDateText}</div>
                     </div>
                    {assignee && (
                        <img
                            className="h-7 w-7 rounded-full ring-2 ring-white"
                            src={assignee.agent?.avatarUrl || `https://i.pravatar.cc/100?u=${assignee.username}`}
                            alt={assignee.username}
                            title={`Assigned to ${assignee.username}`}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
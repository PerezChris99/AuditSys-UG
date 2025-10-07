
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Discrepancy, DiscrepancyStatus, Note, User } from '../types';
import StatusBadge from './ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { EditIcon } from './ui/Icons';

const Discrepancies: React.FC = () => {
  const { discrepancies, updateDiscrepancy, agents } = useData();
  const { user, users } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<Discrepancy | null>(null);
  const [newStatus, setNewStatus] = useState<DiscrepancyStatus | ''>('');
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [newNote, setNewNote] = useState('');
  const [isChanged, setIsChanged] = useState(false);

  const canManage = user?.role === 'Administrator' || user?.role === 'Auditor' || user?.role === 'Finance Officer';

  const managementUsers = useMemo(() => {
    return users.filter(u => ['Administrator', 'Auditor', 'Finance Officer'].includes(u.role));
  }, [users]);
  
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.username || 'Unassigned';

  useEffect(() => {
    if (selectedDiscrepancy) {
      const statusChanged = newStatus !== selectedDiscrepancy.status;
      const assigneeChanged = newAssigneeId !== (selectedDiscrepancy.assigneeId || '');
      const noteAdded = newNote.trim() !== '';
      setIsChanged(statusChanged || assigneeChanged || noteAdded);
    } else {
      setIsChanged(false);
    }
  }, [newStatus, newAssigneeId, newNote, selectedDiscrepancy]);

  const openModal = (discrepancy: Discrepancy) => {
    setSelectedDiscrepancy(discrepancy);
    setNewStatus(discrepancy.status);
    setNewAssigneeId(discrepancy.assigneeId || '');
    setNewNote('');
    setIsChanged(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDiscrepancy(null);
    setNewNote('');
    setNewStatus('');
    setNewAssigneeId('');
  };

  const handleSaveChanges = () => {
    if (!selectedDiscrepancy || !isChanged) return;
    
    let updatedNotes = selectedDiscrepancy.notes ? [...selectedDiscrepancy.notes] : [];
    if (newNote.trim()) {
        const note: Note = {
            id: `note-${Date.now()}`,
            content: newNote.trim(),
            author: user?.username || 'Unknown User',
            timestamp: new Date().toISOString(),
        };
        updatedNotes.push(note);
    }
    
    const updatedDiscrepancy: Discrepancy = {
        ...selectedDiscrepancy,
        status: newStatus as DiscrepancyStatus,
        assigneeId: newAssigneeId || undefined,
        notes: updatedNotes,
    };
    
    updateDiscrepancy(updatedDiscrepancy.id, updatedDiscrepancy);
    closeModal();
  };

  const DiscrepancyModal = () => {
    if (!isModalOpen || !selectedDiscrepancy) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Discrepancy: <span className="text-red-600">{selectedDiscrepancy.id}</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700">Details</h3>
              <p className="text-sm text-gray-500"><span className="font-medium">Type:</span> {selectedDiscrepancy.type}</p>
              <p className="text-sm text-gray-500"><span className="font-medium">Amount:</span> <span className="font-bold text-red-600">${selectedDiscrepancy.amount.toFixed(2)}</span></p>
              <p className="text-sm text-gray-500"><span className="font-medium">Reported:</span> {new Date(selectedDiscrepancy.reportedAt).toLocaleString()}</p>
              <p className="text-sm text-gray-500"><span className="font-medium">Transaction ID:</span> {selectedDiscrepancy.associatedTransactionId}</p>
            </div>
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value as DiscrepancyStatus)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                  {Object.values(DiscrepancyStatus).map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select value={newAssigneeId} onChange={e => setNewAssigneeId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                  <option value="">Unassigned</option>
                  {managementUsers.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                </select>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Notes & History</h3>
            <div className="max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-md border text-sm space-y-2">
              {selectedDiscrepancy.notes && selectedDiscrepancy.notes.length > 0 ? (
                selectedDiscrepancy.notes.map(note => (
                  <div key={note.id}>
                    <p className="text-gray-800">{note.content}</p>
                    <p className="text-xs text-gray-400">by {note.author} on {new Date(note.timestamp).toLocaleDateString()}</p>
                  </div>
                ))
              ) : <p className="text-gray-500">No notes yet.</p>}
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">Add New Note</label>
             <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3} placeholder="Add an update or observation..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"></textarea>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="button" onClick={handleSaveChanges} disabled={!isChanged} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">Save Changes</button>
          </div>
        </div>
      </div>
    )
  };

  return (
    <>
      <DiscrepancyModal />
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Flagged Discrepancies</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discrepancy ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported At</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {canManage && <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discrepancies.map((discrepancy: Discrepancy) => (
                <tr key={discrepancy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{discrepancy.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{discrepancy.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{discrepancy.details}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-semibold">${discrepancy.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(discrepancy.reportedAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getUserName(discrepancy.assigneeId || '')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    <StatusBadge status={discrepancy.status} />
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button onClick={() => openModal(discrepancy)} className="text-primary-600 hover:text-primary-900 font-semibold flex items-center justify-center mx-auto">
                        <EditIcon className="h-4 w-4 mr-1" />
                        Manage
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Discrepancies;

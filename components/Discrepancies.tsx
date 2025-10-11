

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Discrepancy, DiscrepancyStatus, Note, User, Ticket, Transaction, TaskPriority } from '../../types';
import StatusBadge from './ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { EditIcon, EmailIcon, FileTextIcon, TaskIcon } from './ui/Icons';
import MultiSelectDropdown from './ui/MultiSelectDropdown';
import { analyzeDiscrepancyEvidence } from '../lib/gemini';
import { marked } from 'marked';


const Discrepancies: React.FC = () => {
  // FIX: Removed `users: allUsers` from destructuring. `users` are correctly provided by `useAuth`.
  const { discrepancies, updateDiscrepancy, transactions, tickets, openTaskModal } = useData();
  // FIX: Added `roles` from useAuth to correctly filter users by role.
  const { user, users, roles } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<Discrepancy | null>(null);
  const [newStatus, setNewStatus] = useState<DiscrepancyStatus | ''>('');
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [newNote, setNewNote] = useState('');
  const [isChanged, setIsChanged] = useState(false);
  const [formError, setFormError] = useState('');

  const [evidenceAnalysis, setEvidenceAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // State for Email Modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailError, setEmailError] = useState('');

  const [filters, setFilters] = useState({
    searchTerm: '',
    startDate: '',
    endDate: '',
    statuses: [] as string[],
    types: [] as string[],
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // FIX: This comparison appears to be unintentional because the types 'Role' and 'string' have no overlap.
  const canManage = useMemo(() => {
    if (!user) return false;
    return ['Administrator', 'Auditor', 'Finance Officer'].includes(user.role.name);
  }, [user]);

  // FIX: Property 'role' does not exist on type 'User'. Filtered by role name using roleId.
  const managementUsers = useMemo(() => {
    const managementRoleNames = ['Administrator', 'Auditor', 'Finance Officer'];
    const managementRoleIds = roles.filter(role => managementRoleNames.includes(role.name)).map(r => r.id);
    return users.filter(u => managementRoleIds.includes(u.roleId));
  }, [users, roles]);
  
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.username || 'Unassigned';

  const handleFilterChange = (filterName: keyof typeof filters, value: any) => {
    setFilters(prev => ({...prev, [filterName]: value}));
  };
  
  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      startDate: '',
      endDate: '',
      statuses: [],
      types: [],
    });
  };

  const filteredDiscrepancies = useMemo(() => {
    return discrepancies.filter(d => {
      const searchMatch = !filters.searchTerm ||
        d.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        d.details.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const reportedDate = new Date(d.reportedAt);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      if (startDate) startDate.setHours(0, 0, 0, 0);
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      if (endDate) endDate.setHours(23, 59, 59, 999);

      const dateMatch = (!startDate || reportedDate >= startDate) && (!endDate || reportedDate <= endDate);
      const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(d.status);
      const typeMatch = filters.types.length === 0 || filters.types.includes(d.type);

      return searchMatch && dateMatch && statusMatch && typeMatch;
    });
  }, [discrepancies, filters]);

  // Pagination logic
  const totalPages = useMemo(() => Math.ceil(filteredDiscrepancies.length / ITEMS_PER_PAGE), [filteredDiscrepancies]);
  
  const paginatedDiscrepancies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDiscrepancies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDiscrepancies, currentPage]);

  useEffect(() => {
    if (selectedDiscrepancy) {
      const statusChanged = newStatus !== '' && newStatus !== selectedDiscrepancy.status;
      const assigneeChanged = newAssigneeId !== (selectedDiscrepancy.assigneeId || '');
      const noteAdded = newNote.trim() !== '';
      setIsChanged(statusChanged || assigneeChanged || noteAdded);
    } else {
      setIsChanged(false);
    }
  }, [newStatus, newAssigneeId, newNote, selectedDiscrepancy]);
  
  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);
  
  const openModal = (discrepancy: Discrepancy) => {
    setSelectedDiscrepancy(discrepancy);
    setNewStatus(discrepancy.status);
    setNewAssigneeId(discrepancy.assigneeId || '');
    setNewNote('');
    setIsChanged(false);
    setFormError('');
    setEvidenceAnalysis('');
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
    setFormError('');
    
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
    
    try {
        updateDiscrepancy(updatedDiscrepancy.id, updatedDiscrepancy);
        closeModal();
    } catch (error: any) {
        setFormError(error.message);
    }
  };
  
    const handleAnalyzeEvidence = async () => {
        if (!selectedDiscrepancy) return;
        setIsAnalyzing(true);
        setEvidenceAnalysis('');
        try {
            const result = await analyzeDiscrepancyEvidence(selectedDiscrepancy);
            const html = await marked.parse(result);
            setEvidenceAnalysis(html);
        } catch (error) {
            setEvidenceAnalysis('<p class="text-red-500">Could not analyze evidence.</p>');
        } finally {
            setIsAnalyzing(false);
        }
    };
  
  const statusOptions = Object.values(DiscrepancyStatus);
  const typeOptions = useMemo(() => [...new Set(discrepancies.map(d => d.type))], [discrepancies]);
  
    // --- Email Modal Logic ---
    const generateEmailBody = (discrepancy: Discrepancy): string => {
        const assignee = getUserName(discrepancy.assigneeId || 'Unassigned');
        const notesHistory = discrepancy.notes?.map(n => `- ${n.content} (by ${n.author} on ${new Date(n.timestamp).toLocaleDateString()})`).join('\n') || 'No notes.';

        return `
Hello,

Please review the following discrepancy details:

ID: ${discrepancy.id}
Type: ${discrepancy.type}
Amount: $${discrepancy.amount.toFixed(2)}
Status: ${discrepancy.status}
Reported At: ${new Date(discrepancy.reportedAt).toLocaleString()}
Assigned To: ${assignee}
Transaction ID: ${discrepancy.associatedTransactionId}

Details:
${discrepancy.details}

Current Notes & History:
${notesHistory}

Thank you,
AuditSys UG
        `.trim();
    };
    
    const openEmailModal = () => {
        if (!selectedDiscrepancy) return;
        
        setEmailRecipient('');
        setEmailSubject(`Discrepancy Investigation: ${selectedDiscrepancy.id}`);
        setEmailBody(generateEmailBody(selectedDiscrepancy));
        setEmailError('');
        setIsEmailModalOpen(true);
    };

    const closeEmailModal = () => {
        setIsEmailModalOpen(false);
    };

    const handleSendEmail = () => {
        // Basic email validation
        if (!emailRecipient || !/^\S+@\S+\.\S+$/.test(emailRecipient)) {
            setEmailError('Please enter a valid email address.');
            return;
        }
        setEmailError('');
        
        if (!selectedDiscrepancy) return;
        
        // Add a note to the discrepancy history for audit trail
        const note: Note = {
            id: `note-${Date.now()}`,
            content: `Details emailed to ${emailRecipient}. Subject: "${emailSubject}"`,
            author: user?.username || 'Unknown User',
            timestamp: new Date().toISOString(),
        };
        
        const updatedDiscrepancy: Discrepancy = {
            ...selectedDiscrepancy,
            notes: [...(selectedDiscrepancy.notes || []), note],
        };

        updateDiscrepancy(updatedDiscrepancy.id, updatedDiscrepancy);

        // Simulate sending email and show confirmation
        alert(`Email successfully sent to ${emailRecipient}! (This is a simulation)`);
        
        closeEmailModal();
    };


  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPageButtons = 7;
    
    if (totalPages <= maxPageButtons) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    } else {
        pageNumbers.push(1);
        if (currentPage > 3) {
            pageNumbers.push('...');
        }
        if (currentPage > 2) {
            pageNumbers.push(currentPage - 1);
        }
        if (currentPage !== 1 && currentPage !== totalPages) {
            pageNumbers.push(currentPage);
        }
        if (currentPage < totalPages - 1) {
            pageNumbers.push(currentPage + 1);
        }
        if (currentPage < totalPages - 2) {
            pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
    }
    
    const uniquePageNumbers = [...new Set(pageNumbers)];

    return (
        <div className="flex items-center justify-between py-3 px-2">
            <div className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                {' '}to{' '}
                <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredDiscrepancies.length)}</span>
                {' '}of{' '}
                <span className="font-medium">{filteredDiscrepancies.length}</span>
                {' '}results
            </div>
            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                 <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                {uniquePageNumbers.map((page, i) =>
                    page === '...' ? (
                        <span key={`ellipsis-${i}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            aria-current={currentPage === page ? 'page' : undefined}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page ? 'z-10 bg-primary-50 border-primary-500 text-primary-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                        >
                            {page}
                        </button>
                    )
                )}
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </nav>
        </div>
    );
  };


  const DiscrepancyModal = () => {
    if (!isModalOpen || !selectedDiscrepancy) return null;
    
    const associatedData = useMemo(() => {
        if (!selectedDiscrepancy) return { transaction: null, ticket: null };

        const transaction = transactions.find(
            (t) => t.id === selectedDiscrepancy.associatedTransactionId
        );
        if (!transaction) return { transaction: null, ticket: null };

        const ticket = tickets.find(
            (t) => t.id === transaction.associatedRecordId
        );

        return { transaction, ticket };
    }, [selectedDiscrepancy, transactions, tickets]);

    const handleCreateTask = () => {
        if (!selectedDiscrepancy) return;
        openTaskModal({
            title: `Investigate Discrepancy: ${selectedDiscrepancy.id}`,
            description: `Follow up on the ${selectedDiscrepancy.type} of $${selectedDiscrepancy.amount.toFixed(2)} reported on ${new Date(selectedDiscrepancy.reportedAt).toLocaleDateString()}.`,
            relatedDiscrepancyId: selectedDiscrepancy.id,
            priority: TaskPriority.Medium,
            assigneeId: selectedDiscrepancy.assigneeId || '',
        });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Discrepancy: <span className="text-red-600">{selectedDiscrepancy.id}</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700">Details</h3>
              <p className="text-sm text-gray-500"><span className="font-medium">Type:</span> {selectedDiscrepancy.type}</p>
              <p className="text-sm text-gray-500"><span className="font-medium">Amount:</span> <span className="font-bold text-red-600">${selectedDiscrepancy.amount.toFixed(2)}</span></p>
              <p className="text-sm text-gray-500"><span className="font-medium">Reported:</span> {new Date(selectedDiscrepancy.reportedAt).toLocaleString()}</p>
              <p className="text-sm text-gray-500"><span className="font-medium">Transaction ID:</span> {selectedDiscrepancy.associatedTransactionId}</p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Associated Transaction Context</h4>
                {associatedData.transaction && associatedData.ticket ? (
                  <div className="text-sm text-gray-500 space-y-1">
                    <p><span className="font-medium">Passenger:</span> {associatedData.ticket.passengerName}</p>
                    <p><span className="font-medium">Flight:</span> {associatedData.ticket.flightNumber}</p>
                    <p><span className="font-medium">Route:</span> {associatedData.ticket.origin} &rarr; {associatedData.ticket.destination}</p>
                    <p><span className="font-medium">Travel Date:</span> {associatedData.ticket.travelDate}</p>
                    <p><span className="font-medium">Ticket Price:</span> ${associatedData.ticket.price.toFixed(2)}</p>
                  </div>
                ) : associatedData.transaction ? (
                  <p className="text-sm text-gray-500 italic">Associated transaction found, but ticket details are unavailable.</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No associated transaction details found.</p>
                )}
              </div>
            </div>
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value as DiscrepancyStatus)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                  {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select value={newAssigneeId} onChange={e => setNewAssigneeId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                  <option value="">Unassigned</option>
                  {managementUsers.map(u => <option key={u.id} value={u.id}>{u.username} ({getRoleName(u.roleId)})</option>)}
                </select>
              </div>
            </div>
          </div>
          
           <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Evidence Analysis</h3>
                <button 
                    onClick={handleAnalyzeEvidence}
                    disabled={isAnalyzing}
                    className="mb-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-100 flex items-center disabled:opacity-50"
                >
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Evidence'}
                </button>
                {isAnalyzing ? (
                    <div className="space-y-2 animate-pulse mt-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                ) : evidenceAnalysis ? (
                    <div className="prose prose-sm max-w-none text-gray-600 mt-2" dangerouslySetInnerHTML={{ __html: evidenceAnalysis }} />
                ) : <p className="text-xs text-gray-500">Click to run AI analysis on attached evidence.</p>}
            </div>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Notes & History</h3>
            <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-md border text-sm space-y-3">
              {selectedDiscrepancy.notes && selectedDiscrepancy.notes.length > 0 ? (
                [...selectedDiscrepancy.notes].reverse().map(note => (
                  <div key={note.id} className="border-l-4 border-primary-200 pl-3">
                    <p className="text-gray-800">{note.content}</p>
                    <div className="text-xs text-gray-500 mt-1">
                        <span className="font-semibold">{note.author}</span> &mdash; <span>{new Date(note.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : <p className="text-gray-500 italic">No notes have been added yet.</p>}
            </div>
          </div>

          <div>
             <label htmlFor="new-note" className="block text-sm font-medium text-gray-700">Add New Note</label>
             <textarea id="new-note" value={newNote} onChange={e => setNewNote(e.target.value)} rows={3} placeholder="Add an update or observation..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"></textarea>
          </div>
          
          {formError && <p className="mt-4 text-sm text-center text-red-600 bg-red-50 p-2 rounded-md">{formError}</p>}

          <div className="mt-6 flex justify-between items-center">
            <div className="flex space-x-2">
                <button type="button" onClick={openEmailModal} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 flex items-center font-semibold text-sm">
                    <EmailIcon className="h-4 w-4 mr-2"/>
                    Email
                </button>
                 <button type="button" onClick={handleCreateTask} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 flex items-center font-semibold text-sm">
                    <TaskIcon className="h-4 w-4 mr-2"/>
                    Create Task
                </button>
            </div>
            <div className="space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="button" onClick={handleSaveChanges} disabled={!isChanged} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    )
  };

  const EmailModal = () => {
    if (!isEmailModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Email Discrepancy Details</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email-recipient" className="block text-sm font-medium text-gray-700">Recipient Email</label>
                        <input
                            id="email-recipient"
                            type="email"
                            value={emailRecipient}
                            onChange={(e) => setEmailRecipient(e.target.value)}
                            placeholder="auditor@example.com"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
                    </div>
                    <div>
                        <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700">Subject</label>
                        <input
                            id="email-subject"
                            type="text"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="email-body" className="block text-sm font-medium text-gray-700">Body</label>
                        <textarea
                            id="email-body"
                            rows={10}
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                        ></textarea>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={closeEmailModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={handleSendEmail} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Send Email</button>
                </div>
            </div>
        </div>
    );
  };

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || 'Unknown Role';

  return (
    <>
      <DiscrepancyModal />
      <EmailModal />
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Flagged Discrepancies</h2>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 mb-1">Search ID or Details</label>
                    <input
                        id="search-term"
                        type="text"
                        placeholder="Search..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                </div>
                 <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Reported From</label>
                    <input type="date" id="start-date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Reported To</label>
                    <input type="date" id="end-date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <MultiSelectDropdown label="Status" options={statusOptions} selectedOptions={filters.statuses} onChange={s => handleFilterChange('statuses', s)} />
                <MultiSelectDropdown label="Type" options={typeOptions} selectedOptions={filters.types} onChange={t => handleFilterChange('types', t)} />
                 <div className="flex items-end">
                    <button onClick={clearFilters} className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">Clear Filters</button>
                </div>
            </div>
        </div>

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
              {paginatedDiscrepancies.length > 0 ? (
                paginatedDiscrepancies.map((discrepancy: Discrepancy) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="text-center py-10 text-gray-500">
                    No discrepancies found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls />
      </div>
    </>
  );
};

export default Discrepancies;

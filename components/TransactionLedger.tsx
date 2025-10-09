
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Transaction, Agent } from '../types';
import { LinkIcon, CheckCircleIcon, ShieldExclamationIcon, TamperIcon } from './ui/Icons';
import { useAuth } from '../context/AuthContext';
import { calculateHash } from '../lib/cryptoUtils';
import MultiSelectDropdown from './ui/MultiSelectDropdown';
import NaturalLanguageQuery from './ui/NaturalLanguageQuery';


const TransactionLedger: React.FC = () => {
  const { transactions: originalTransactions, agents, setTransactions } = useData();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    transactionTypes: [] as string[],
    agentId: 'All',
    startDate: '',
    endDate: '',
  });
  
  const [searchParams] = useSearchParams();
  const [riskDetails, setRiskDetails] = useState<{reason: string, score: number} | null>(null);

  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
  const [tamperedTxId, setTamperedTxId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const canVerify = user?.role === 'Administrator' || user?.role === 'Auditor';
  const canTamper = user?.role === 'Administrator';


  useEffect(() => {
    // This deep-linking allows navigating from Agent Performance to a pre-filtered ledger
    const agentIdFromUrl = searchParams.get('agentId');
    if (agentIdFromUrl && agents.some(agent => agent.id === agentIdFromUrl)) {
      setFilters(prev => ({ ...prev, agentId: agentIdFromUrl }));
    }
  }, [searchParams, agents]);

  useEffect(() => {
    // Reset verification status when data changes
    setVerificationStatus('idle');
    setTamperedTxId(null);
  }, [originalTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const transactionTypes = useMemo(() => [...new Set(originalTransactions.map(tx => tx.type))], [originalTransactions]);

  const filteredTransactions = useMemo(() => {
    return originalTransactions.filter(tx => {
      if (filters.transactionTypes && filters.transactionTypes.length > 0 && !filters.transactionTypes.includes(tx.type)) return false;
      if (filters.agentId !== 'All' && tx.agentId !== filters.agentId) return false;
      const txDate = new Date(tx.timestamp);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      if (startDate) startDate.setHours(0, 0, 0, 0);
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      if (endDate) endDate.setHours(23, 59, 59, 999);
      if (startDate && startDate > txDate) return false;
      if (endDate && endDate < txDate) return false;
      return true;
    });
  }, [filters, originalTransactions]);

  const totalPages = useMemo(() => Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE), [filteredTransactions]);
  
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const clearFilters = () => {
    setFilters({
      transactionTypes: [],
      agentId: 'All',
      startDate: '',
      endDate: '',
    });
  };
  
  const handleAIQuery = (aiFilters: Partial<typeof filters>) => {
    setFilters(prev => ({
        ...prev,
        ...aiFilters,
    }));
  };

  const handleVerifyChain = async () => {
    setVerificationStatus('verifying');
    setTamperedTxId(null);
    
    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));
    
    let isChainValid = true;
    // Transactions are sorted newest to oldest. We iterate through them.
    for (let i = 0; i < originalTransactions.length; i++) {
        const tx = originalTransactions[i];
        const previousTx = originalTransactions[i + 1];

        // Check 1: Data Integrity. Recalculate hash and compare with stored hash.
        const recalculatedHash = await calculateHash(tx.id, tx.timestamp, tx.amount, tx.associatedRecordId, tx.previousHash);
        if (tx.hash !== recalculatedHash) {
            isChainValid = false;
            setTamperedTxId(tx.id);
            break;
        }

        // Check 2: Chain Integrity. Ensure previousHash points to the actual hash of the previous block.
        if (previousTx && tx.previousHash !== previousTx.hash) {
            isChainValid = false;
            setTamperedTxId(tx.id);
            break;
        }
    }

    setVerificationStatus(isChainValid ? 'verified' : 'failed');
  };

  const handleTamperData = () => {
    if (originalTransactions.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * originalTransactions.length);
    const tamperedTx = { ...originalTransactions[randomIndex] };
    
    // Modify the amount but keep the hash the same to simulate tampering
    tamperedTx.amount += 100;
    
    const newTransactions = [...originalTransactions];
    newTransactions[randomIndex] = tamperedTx;
    
    setTransactions(newTransactions);
    setTamperedTxId(tamperedTx.id);
    setVerificationStatus('failed');

    alert(`Data Tampered: Transaction ${tamperedTx.id} amount was changed. The chain is now broken. Try verifying again.`);
  };

  const renderDetails = (tx: Transaction) => {
    const label = tx.type === 'Sale' ? 'Ticket Sale:' : `${tx.type}:`;
    return (
      <div className="font-sans">
        <span className="font-semibold text-gray-800">
          {label}
        </span>
        <span className="text-gray-500 ml-2">{tx.associatedRecordId}</span>
      </div>
    );
  };

    const getRiskColor = (score?: number): string => {
        if (!score) return 'bg-gray-100 text-gray-800';
        if (score > 70) return 'bg-red-100 text-red-800';
        if (score > 40) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

  const VerificationStatus = () => {
    switch (verificationStatus) {
      case 'verifying':
        return <div className="p-3 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center"><svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Verifying cryptographic links...</div>;
      case 'verified':
        return <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm flex items-center"><CheckCircleIcon className="h-5 w-5 mr-2" />Ledger Integrity Verified. All transactions are cryptographically linked and untampered.</div>;
      case 'failed':
        return <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center"><ShieldExclamationIcon className="h-5 w-5 mr-2" />Verification Failed! Tampering detected or chain is broken. See highlighted row.</div>;
      default:
        return <p className="text-sm text-gray-500">Run a verification check to ensure ledger integrity.</p>;
    }
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
                <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}</span>
                {' '}of{' '}
                <span className="font-medium">{filteredTransactions.length}</span>
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
  
  const RiskDetailsModal = () => {
    if (!riskDetails) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={() => setRiskDetails(null)}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-start">
                    <div className={`p-2 rounded-full mr-4 ${getRiskColor(riskDetails.score)}`}>
                       <ShieldExclamationIcon className={`h-6 w-6 ${getRiskColor(riskDetails.score).split(' ')[1]}`}/>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">AI Fraud Risk Analysis</h3>
                        <p className={`text-2xl font-bold ${getRiskColor(riskDetails.score).split(' ')[1]}`}>{riskDetails.score} / 100</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-gray-700 mb-1">Justification:</h4>
                    <p className="text-gray-600 text-sm">{riskDetails.reason}</p>
                </div>
                 <div className="mt-6 flex justify-end">
                    <button onClick={() => setRiskDetails(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
    );
  };


  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <RiskDetailsModal />
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Immutable Transaction Ledger</h2>
      <p className="text-sm text-gray-500">This is an append-only log. Each transaction is cryptographically linked to the previous one, ensuring a verifiable audit trail.</p>
      
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4 mb-4">
          {canVerify && (
            <button onClick={handleVerifyChain} disabled={verificationStatus === 'verifying'} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <ShieldExclamationIcon className="h-5 w-5 mr-2" />
              Verify Ledger Integrity
            </button>
          )}
          {canTamper && (
            <button onClick={handleTamperData} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <TamperIcon className="h-5 w-5 mr-2" />
              Tamper with Data (Demo)
            </button>
          )}
        </div>
        <VerificationStatus />
      </div>
      
      <NaturalLanguageQuery 
        onQueryApplied={handleAIQuery} 
        queryType="ledger" 
        agents={agents} 
      />

       <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="lg:col-span-1 xl:col-span-1">
             <MultiSelectDropdown
                label="Transaction Type"
                options={transactionTypes}
                selectedOptions={filters.transactionTypes || []}
                onChange={selected => setFilters(prev => ({...prev, transactionTypes: selected}))}
             />
          </div>
          <div>
            <label htmlFor="agent-filter" className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
            <select id="agent-filter" value={filters.agentId} onChange={e => setFilters(prev => ({...prev, agentId: e.target.value}))} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              <option value="All">All Agents</option>
              {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" id="start-date-filter" value={filters.startDate} onChange={e => setFilters(prev => ({...prev, startDate: e.target.value}))} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" id="end-date-filter" value={filters.endDate} onChange={e => setFilters(prev => ({...prev, endDate: e.target.value}))} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div className="flex items-end h-full">
            <button onClick={clearFilters} className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">Clear Filters</button>
          </div>
        </div>
      </div>


      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
               <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fraud Risk</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Hash</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Hash</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 font-mono text-xs">
            {paginatedTransactions.map((tx: Transaction, index: number) => (
              <tr key={tx.id} className={`transition-colors duration-300 ${tamperedTxId === tx.id ? 'bg-red-100' : 'hover:bg-gray-50'}`}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{tx.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(tx.timestamp).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-sans">{tx.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{renderDetails(tx)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-right font-sans">${tx.amount.toFixed(2)}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-center">
                    {tx.fraudScore && (
                        <button
                            onClick={() => setRiskDetails({ reason: tx.fraudReason || 'No details provided.', score: tx.fraudScore! })}
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80 ${getRiskColor(tx.fraudScore)}`}
                        >
                            {tx.fraudScore.toFixed(0)}
                        </button>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-green-600">{tx.hash.substring(0, 16)}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 flex items-center">
                  {index < originalTransactions.length - 1 && tx.previousHash !== '0'.repeat(64) && <LinkIcon className="h-3 w-3 mr-2 text-gray-400" />}
                  {tx.previousHash.substring(0, 16)}...
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-500 font-sans">No transactions found for the selected filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
       <PaginationControls />
    </div>
  );
};

export default TransactionLedger;

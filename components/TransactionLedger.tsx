
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Transaction } from '../types';
import { LinkIcon, CheckCircleIcon, ShieldExclamationIcon, TamperIcon } from './ui/Icons';
import { calculateHash } from '../lib/cryptoUtils';

const TransactionLedger: React.FC = () => {
  const { transactions: originalTransactions, agents: mockAgents } = useData();
  const [transactions, setTransactions] = useState(originalTransactions);
  const [filterType, setFilterType] = useState<string>('All');
  const [filterAgent, setFilterAgent] = useState<string>('All');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchParams] = useSearchParams();

  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
  const [tamperedTxId, setTamperedTxId] = useState<string | null>(null);

  useEffect(() => {
    // On component mount or when URL search parameters change, check for an agentId.
    // If a valid agentId is present, pre-filter the ledger for that agent.
    // This enables deep-linking from other parts of the application, like the Agent Performance page.
    const agentIdFromUrl = searchParams.get('agentId');
    if (agentIdFromUrl && mockAgents.some(agent => agent.id === agentIdFromUrl)) {
      setFilterAgent(agentIdFromUrl);
    }
  }, [searchParams, mockAgents]);

  useEffect(() => {
    setTransactions(originalTransactions);
    setVerificationStatus('idle');
    setTamperedTxId(null);
  }, [originalTransactions]);

  const transactionTypes = useMemo(() => ['All', ...Array.from(new Set(transactions.map(tx => tx.type)))], [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'All' && tx.type !== filterType) return false;
      if (filterAgent !== 'All' && tx.agentId !== filterAgent) return false;
      const txDate = new Date(tx.timestamp);
      if (filterStartDate && new Date(filterStartDate) > txDate) return false;
      if (filterEndDate) {
        const endDate = new Date(filterEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (endDate < txDate) return false;
      }
      return true;
    });
  }, [filterType, filterAgent, filterStartDate, filterEndDate, transactions]);

  const handleVerifyChain = () => {
    setVerificationStatus('verifying');
    setTamperedTxId(null);
    const chain = filteredTransactions.slice().reverse(); // Check from oldest to newest
    let isValid = true;
    let previousTxHash = '0'.repeat(16);

    setTimeout(() => { // Simulate verification time
      for (const tx of chain) {
        if (tx.previousHash !== previousTxHash) {
          isValid = false;
          setTamperedTxId(tx.id);
          break;
        }
        const { hash, previousHash: _, ...txData } = tx;
        const calculated = calculateHash(txData);
        if (calculated !== hash) {
          isValid = false;
          setTamperedTxId(tx.id);
          break;
        }
        previousTxHash = hash;
      }
      setVerificationStatus(isValid ? 'verified' : 'failed');
    }, 1000);
  };

  const handleTamperData = () => {
    if (transactions.length > 5) {
      const tamperedIndex = Math.floor(transactions.length / 2);
      const tamperedTx = { ...transactions[tamperedIndex], amount: transactions[tamperedIndex].amount + 150.75 };
      const newTransactions = [...transactions];
      newTransactions[tamperedIndex] = tamperedTx;

      setTransactions(newTransactions);
      setTamperedTxId(tamperedTx.id);
      setVerificationStatus('failed');
      alert(`Data Tampered: Transaction ${tamperedTx.id} amount was changed, but its hash was not recalculated. The chain is now broken. Try verifying again to detect the inconsistency.`);
    } else {
      alert("Not enough data to tamper with.");
    }
  };

  const renderDetails = (tx: Transaction) => {
    // Display 'Ticket Sale:' for sales, and 'Type:' for all other transaction types for clarity.
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

  const VerificationStatus = () => {
    switch (verificationStatus) {
      case 'verifying':
        return <div className="p-3 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center"><svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Verifying cryptographic links...</div>;
      case 'verified':
        return <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm flex items-center"><CheckCircleIcon className="h-5 w-5 mr-2" />Ledger Integrity Verified. All transactions are cryptographically linked and untampered.</div>;
      case 'failed':
        return <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center"><ShieldExclamationIcon className="h-5 w-5 mr-2" />Verification Failed! Tampering detected or chain is broken. See highlighted row.</div>;
      default:
        return <p className="text-sm text-gray-500">Run a verification check to ensure ledger integrity.</p>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Immutable Transaction Ledger</h2>
      <p className="text-sm text-gray-500 mb-4">This is an append-only log. Each transaction is cryptographically linked to the previous one, ensuring a verifiable audit trail.</p>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4 mb-4">
          <button onClick={handleVerifyChain} disabled={verificationStatus === 'verifying'} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <ShieldExclamationIcon className="h-5 w-5 mr-2" />
            Verify Ledger Integrity
          </button>
          <button onClick={handleTamperData} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <TamperIcon className="h-5 w-5 mr-2" />
            Tamper with Data (Demo)
          </button>
        </div>
        <VerificationStatus />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label htmlFor="tx-type-filter" className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
          <select id="tx-type-filter" value={filterType} onChange={e => setFilterType(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
            {transactionTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="agent-filter" className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
          <select id="agent-filter" value={filterAgent} onChange={e => setFilterAgent(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
            <option value="All">All Agents</option>
            {mockAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input type="date" id="start-date-filter" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" id="end-date-filter" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Hash</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Hash</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 font-mono text-xs">
            {filteredTransactions.map((tx: Transaction, index: number) => (
              <tr key={tx.id} className={`transition-colors duration-300 ${tamperedTxId === tx.id ? 'bg-red-100' : 'hover:bg-gray-50'}`}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{tx.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(tx.timestamp).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-sans">{tx.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{renderDetails(tx)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-right font-sans">${tx.amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-green-600">{tx.hash}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 flex items-center">
                  {index < transactions.length - 1 && tx.previousHash !== '0'.repeat(16) && <LinkIcon className="h-3 w-3 mr-2 text-gray-400" />}
                  {tx.previousHash}
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-500 font-sans">No transactions found for the selected filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionLedger;

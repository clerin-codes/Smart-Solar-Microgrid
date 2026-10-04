import React, { useState, useEffect } from 'react';
import './TransactionPage.css';
import transactionService from '../services/transactionService';

/**
 * Transaction Page Component
 * Display transaction history and details
 */
const TransactionPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadTransactions();
    loadStatistics();
  }, [currentPage, pageSize, statusFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transactionService.getTransactions(
        currentPage,
        pageSize,
        statusFilter || null
      );
      if (response.success) {
        setTransactions(response.data || []);
        applyFilters(response.data || []);
      } else {
        setError(response.message || 'Failed to load transactions');
      }
    } catch (err) {
      setError(err.message || 'Error loading transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const statsData = await transactionService.getTransactionStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const applyFilters = (transactionList) => {
    let filtered = transactionList;
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.id.includes(searchTerm) ||
        t.reservationId.includes(searchTerm) ||
        t.gridOperator?.includes(searchTerm)
      );
    }
    setFilteredTransactions(filtered);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    applyFilters(transactions);
  };

  const handleSelectTransaction = async (transaction) => {
    setLoading(true);
    try {
      const response = await transactionService.getTransactionDetails(transaction.id);
      if (response.success) {
        setSelectedTransaction(response.data);
      }
    } catch (err) {
      setError(err.message || 'Error loading transaction details');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      transactionService.exportToCSV(filteredTransactions);
    } catch (err) {
      setError('Error exporting transactions');
    }
  };

  const handleCloseDetail = () => {
    setSelectedTransaction(null);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  return (
    <div className="transaction-page">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>View and manage energy transfer transactions</p>
      </div>

      {stats && (
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{stats.totalTransactions}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Amount</div>
            <div className="stat-value">Rs. {stats.totalAmount.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value success">{stats.completedCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Failed</div>
            <div className="stat-value error">{stats.failedCount}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by ID, Reservation, or Operator..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
          </select>
          <button className="btn btn-secondary" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading transactions...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found</p>
        </div>
      ) : (
        <div className="transactions-container">
          <div className="table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Reservation ID</th>
                  <th>Amount (Rs.)</th>
                  <th>Units (kWh)</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                  <th>Operator</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className={`status-${transaction.status.toLowerCase()}`}>
                    <td className="transaction-id">{transaction.id.substring(0, 12)}...</td>
                    <td>{transaction.reservationId}</td>
                    <td className="amount">Rs. {transaction.amount.toFixed(2)}</td>
                    <td>{transaction.units}</td>
                    <td>
                      <span className={`status-badge status-${transaction.status.toLowerCase()}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                    <td>{transaction.gridOperator || 'N/A'}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => handleSelectTransaction(transaction)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              className="btn btn-secondary"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="page-info">Page {currentPage} of {Math.ceil(filteredTransactions.length / pageSize)}</span>
            <button
              className="btn btn-secondary"
              onClick={handleNextPage}
              disabled={filteredTransactions.length < pageSize}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button className="close-btn" onClick={handleCloseDetail}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="label">Transaction ID:</span>
                <span className="value">{selectedTransaction.id}</span>
              </div>
              <div className="detail-row">
                <span className="label">Reservation ID:</span>
                <span className="value">{selectedTransaction.reservationId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Grid Operator ID:</span>
                <span className="value">{selectedTransaction.gridOperatorId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Prosumer ID:</span>
                <span className="value">{selectedTransaction.prosumerId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Amount:</span>
                <span className="value">Rs. {selectedTransaction.amount.toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Units:</span>
                <span className="value">{selectedTransaction.units} kWh</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`value status-badge status-${selectedTransaction.status.toLowerCase()}`}>
                  {selectedTransaction.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Timestamp:</span>
                <span className="value">{new Date(selectedTransaction.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionPage;

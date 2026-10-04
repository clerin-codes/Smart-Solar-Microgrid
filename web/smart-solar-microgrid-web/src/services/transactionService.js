import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Transaction Service for all transaction-related API calls
 */
export const transactionService = {
  /**
   * Process energy transfer after QR verification
   * @param {string} reservationId - The reservation ID
   * @param {string} qrToken - The verified QR token
   * @returns {Promise} Transaction response
   */
  processEnergyTransfer: async (reservationId, qrToken) => {
    try {
      const response = await apiClient.post('/transactions/transfer', {
        reservationId,
        qrToken
      });
      return response.data;
    } catch (error) {
      console.error('Error processing energy transfer:', error);
      throw error;
    }
  },

  /**
   * Get all transactions with pagination and filtering
   * @param {number} page - Page number
   * @param {number} pageSize - Number of items per page
   * @param {string} status - Filter by status (optional)
   * @returns {Promise} List of transactions
   */
  getTransactions: async (page = 1, pageSize = 10, status = null) => {
    try {
      const params = {
        page,
        pageSize
      };
      if (status) {
        params.status = status;
      }
      const response = await apiClient.get('/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  /**
   * Get transaction details
   * @param {string} transactionId - The transaction ID
   * @returns {Promise} Transaction detail
   */
  getTransactionDetails: async (transactionId) => {
    try {
      const response = await apiClient.get(`/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      throw error;
    }
  },

  /**
   * Get transactions by reservation ID
   * @param {string} reservationId - The reservation ID
   * @returns {Promise} List of transactions for reservation
   */
  getTransactionsByReservation: async (reservationId) => {
    try {
      const response = await apiClient.get('/transactions', {
        params: { reservationId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions by reservation:', error);
      throw error;
    }
  },

  /**
   * Get transaction statistics
   * @returns {Promise} Transaction statistics
   */
  getTransactionStats: async () => {
    try {
      const response = await apiClient.get('/transactions/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      // Return default stats if endpoint doesn't exist
      return {
        totalTransactions: 0,
        totalAmount: 0,
        completedCount: 0,
        failedCount: 0
      };
    }
  },

  /**
   * Export transactions to CSV
   * @param {Array} transactions - Transactions to export
   * @returns {void} Downloads CSV file
   */
  exportToCSV: (transactions) => {
    try {
      const headers = ['ID', 'Reservation', 'Units', 'Amount', 'Status', 'Timestamp'];
      const rows = transactions.map(t => [
        t.id,
        t.reservationId,
        t.units,
        t.amount,
        t.status,
        t.timestamp
      ]);

      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      element.setAttribute('download', `transactions-${Date.now()}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      throw error;
    }
  }
};

export default transactionService;

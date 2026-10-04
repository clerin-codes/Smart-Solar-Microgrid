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
 * QR Service for all QR-related API calls
 */
export const qrService = {
  /**
   * Generate QR code for a reservation
   * @param {string} reservationId - The reservation ID
   * @returns {Promise} QR generation response
   */
  generateQRCode: async (reservationId) => {
    try {
      const response = await apiClient.post('/qr/generate', {
        reservationId
      });
      return response.data;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  },

  /**
   * Verify QR code validity
   * @param {string} qrToken - The QR token to verify
   * @param {string} gridOperatorId - The grid operator ID
   * @returns {Promise} QR verification response
   */
  verifyQRCode: async (qrToken, gridOperatorId) => {
    try {
      const response = await apiClient.post('/qr/verify', {
        qrData: qrToken,
        gridOperatorId
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying QR code:', error);
      throw error;
    }
  },

  /**
   * Scan QR code (simulated - in real app, use a QR scanner library)
   * @param {string} qrData - The scanned QR data
   * @returns {Object} Parsed QR data
   */
  scanQRCode: (qrData) => {
    try {
      // In a real app, this would parse the QR data format
      return {
        token: qrData,
        scannedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error scanning QR code:', error);
      throw error;
    }
  },

  /**
   * Decode Base64 QR image
   * @param {string} base64String - Base64 encoded QR image
   * @returns {string} Data URL for the image
   */
  decodeQRImage: (base64String) => {
    try {
      return `data:image/png;base64,${base64String}`;
    } catch (error) {
      console.error('Error decoding QR image:', error);
      throw error;
    }
  }
};

export default qrService;

import React, { useState, useRef, useEffect } from 'react';
import './QRScannerPage.css';
import qrService from '../services/qrService';
import transactionService from '../services/transactionService';

/**
 * QR Scanner Page Component
 * For Grid Operators to scan and process QR codes
 */
const QRScannerPage = () => {
  const [reservationId, setReservationId] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [qrImage, setQrImage] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [transferResult, setTransferResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('input'); // input, scan, verify, transfer, success
  const fileInputRef = useRef(null);

  const handleReservationIdChange = (e) => {
    setReservationId(e.target.value);
    setError(null);
  };

  const handleQRTokenChange = (e) => {
    setQrToken(e.target.value);
    setError(null);
  };

  const handleGenerateQR = async () => {
    if (!reservationId.trim()) {
      setError('Please enter a reservation ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await qrService.generateQRCode(reservationId);
      if (response.success) {
        setQrImage(qrService.decodeQRImage(response.base64QrCode));
        setQrToken(response.data.token);
        setStep('scan');
      } else {
        setError(response.message || 'Failed to generate QR code');
      }
    } catch (err) {
      setError(err.message || 'Error generating QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyQR = async () => {
    if (!qrToken.trim()) {
      setError('Please enter or scan a QR token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const gridOperatorId = localStorage.getItem('userId') || 'operator_001';
      const response = await qrService.verifyQRCode(qrToken, gridOperatorId);
      
      if (response.success && response.valid) {
        setVerificationResult(response.data);
        setStep('transfer');
      } else {
        setError(response.message || 'QR code verification failed');
      }
    } catch (err) {
      setError(err.message || 'Error verifying QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessTransfer = async () => {
    if (!reservationId.trim() || !qrToken.trim()) {
      setError('Missing reservation ID or QR token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await transactionService.processEnergyTransfer(
        reservationId,
        qrToken
      );

      if (response.success) {
        setTransferResult(response.data);
        setStep('success');
      } else {
        setError(response.message || 'Failed to process energy transfer');
      }
    } catch (err) {
      setError(err.message || 'Error processing energy transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReservationId('');
    setQrToken('');
    setQrImage(null);
    setVerificationResult(null);
    setTransferResult(null);
    setError(null);
    setStep('input');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1];
        setQrImage(event.target.result);
        // In a real app, would decode the QR image
        setError('QR scanning from image requires qr-code-reader library');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="qr-scanner-page">
      <div className="qr-container">
        <h1>QR Code Scanner</h1>
        <p className="subtitle">Scan or upload QR codes to process energy transfers</p>

        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {step === 'input' && (
          <div className="step-container">
            <h2>Step 1: Enter Reservation Details</h2>
            <div className="form-group">
              <label htmlFor="reservation">Reservation ID:</label>
              <input
                id="reservation"
                type="text"
                value={reservationId}
                onChange={handleReservationIdChange}
                placeholder="Enter reservation ID"
                disabled={loading}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleGenerateQR}
              disabled={loading || !reservationId.trim()}
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        )}

        {step === 'scan' && (
          <div className="step-container">
            <h2>Step 2: Scan or View QR Code</h2>
            {qrImage && (
              <div className="qr-display">
                <img src={qrImage} alt="Generated QR Code" />
                <p className="qr-token">Token: {qrToken.substring(0, 20)}...</p>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="qr-token">Or Enter QR Token:</label>
              <textarea
                id="qr-token"
                value={qrToken}
                onChange={handleQRTokenChange}
                placeholder="Paste QR token here or it will be populated from generated QR"
                rows={4}
                disabled={loading}
              />
            </div>
            <div className="button-group">
              <button
                className="btn btn-secondary"
                onClick={() => setStep('input')}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleVerifyQR}
                disabled={loading || !qrToken.trim()}
              >
                {loading ? 'Verifying...' : 'Verify QR Code'}
              </button>
            </div>
          </div>
        )}

        {step === 'transfer' && verificationResult && (
          <div className="step-container success">
            <h2>Step 3: Verify Details & Process Transfer</h2>
            <div className="verification-details">
              <div className="detail-row">
                <span className="label">Prosumer ID:</span>
                <span className="value">{verificationResult.prosumerId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Station ID:</span>
                <span className="value">{verificationResult.stationId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Energy Units:</span>
                <span className="value">{verificationResult.energyUnits} kWh</span>
              </div>
              <div className="detail-row">
                <span className="label">Amount:</span>
                <span className="value">Rs. {verificationResult.amount}</span>
              </div>
            </div>
            <div className="button-group">
              <button
                className="btn btn-secondary"
                onClick={() => setStep('scan')}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="btn btn-success"
                onClick={handleProcessTransfer}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && transferResult && (
          <div className="step-container success">
            <div className="success-icon">✓</div>
            <h2>Transfer Successful!</h2>
            <div className="transaction-details">
              <div className="detail-row">
                <span className="label">Transaction ID:</span>
                <span className="value">{transferResult.id}</span>
              </div>
              <div className="detail-row">
                <span className="label">Amount:</span>
                <span className="value">Rs. {transferResult.amount}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className="value status-completed">{transferResult.status}</span>
              </div>
              <div className="detail-row">
                <span className="label">Timestamp:</span>
                <span className="value">{new Date(transferResult.timestamp).toLocaleString()}</span>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleReset}
            >
              Scan Another QR
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScannerPage;

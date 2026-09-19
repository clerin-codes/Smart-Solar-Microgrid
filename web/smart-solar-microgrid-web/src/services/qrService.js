import { reservationService } from './reservationService'

export const qrService = {
  // Verifies a scanned QR token; the API marks the reservation's transaction as Verified.
  verifyQR: (qrToken) => reservationService.verifyQr(qrToken),
}

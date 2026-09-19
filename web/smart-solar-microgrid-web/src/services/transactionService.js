import { TRANSACTION_STATUS, enumName } from '../utils/constants'
import { reservationService } from './reservationService'

// The API has no transactions resource: a transaction is a reservation whose QR was verified or completed.
export const isTransaction = (reservation) =>
  enumName(TRANSACTION_STATUS, reservation.transactionStatus) !== 'NotStarted'

export const transactionService = {
  transferEnergy: (reservationId) => reservationService.complete(reservationId),
  getAll: async () => (await reservationService.getAll()).filter(isTransaction),
  getById: (id) => reservationService.getById(id),
}

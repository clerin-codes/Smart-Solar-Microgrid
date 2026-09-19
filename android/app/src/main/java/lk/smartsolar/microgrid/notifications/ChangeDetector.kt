package lk.smartsolar.microgrid.notifications

import lk.smartsolar.microgrid.data.ReservationStatus
import lk.smartsolar.microgrid.data.TxStatus
import lk.smartsolar.microgrid.data.local.ReservationEntity
import lk.smartsolar.microgrid.data.statusEnum
import lk.smartsolar.microgrid.data.tx

/** Works out what changed between two syncs, so the user can be told without opening the app. */
object ChangeDetector {
    fun changes(before: Map<String, ReservationEntity>, after: List<ReservationEntity>, isProsumer: Boolean): List<Notice> {
        val notices = mutableListOf<Notice>()
        for (now in after) {
            val old = before[now.id]
            if (isProsumer) {
                if (old == null) continue
                if (old.statusEnum != now.statusEnum) {
                    when (now.statusEnum) {
                        ReservationStatus.Approved -> notices += Notice(now.id, "Reservation approved", "${now.number} is approved. Your QR code is ready.")
                        ReservationStatus.Rejected -> notices += Notice(now.id, "Reservation rejected", "${now.number} was not approved.")
                        ReservationStatus.Completed -> notices += Notice(now.id, "Energy transfer complete", "${now.number} has been completed.")
                        else -> Unit
                    }
                }
                if (old.tx != now.tx && now.tx == TxStatus.Verified) {
                    notices += Notice(now.id, "QR code verified", "The Grid Operator verified the QR code for ${now.number}.")
                }
            } else if (old == null && now.statusEnum == ReservationStatus.Pending) {
                notices += Notice(now.id, "New reservation", "${now.number} is waiting for approval.")
            }
        }
        return notices
    }
}

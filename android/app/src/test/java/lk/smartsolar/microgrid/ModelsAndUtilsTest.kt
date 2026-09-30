package lk.smartsolar.microgrid

import com.google.gson.Gson
import com.google.zxing.BinaryBitmap
import com.google.zxing.RGBLuminanceSource
import com.google.zxing.common.HybridBinarizer
import com.google.zxing.qrcode.QRCodeReader
import lk.smartsolar.microgrid.data.ReservationStatus
import lk.smartsolar.microgrid.data.ScheduleItem
import lk.smartsolar.microgrid.data.SlotStatus
import lk.smartsolar.microgrid.data.TxStatus
import lk.smartsolar.microgrid.data.dayOf
import lk.smartsolar.microgrid.data.decodeSchedule
import lk.smartsolar.microgrid.data.encodeSchedule
import lk.smartsolar.microgrid.data.isBookable
import lk.smartsolar.microgrid.data.remote.ErrorBody
import lk.smartsolar.microgrid.data.remote.ReservationDto
import lk.smartsolar.microgrid.data.remote.SlotDto
import lk.smartsolar.microgrid.data.remote.StationDto
import lk.smartsolar.microgrid.data.toEntity
import lk.smartsolar.microgrid.ui.auth.AuthValidation
import lk.smartsolar.microgrid.ui.prosumer.StationFilter
import lk.smartsolar.microgrid.ui.prosumer.filterStations
import lk.smartsolar.microgrid.util.Fmt
import lk.smartsolar.microgrid.util.QrCodes
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ModelsAndUtilsTest {
    private val gson = Gson()

    // JSON copied from the running API.
    @Test
    fun reservationDto_parsesApiJson_andTrimsDate() {
        val json = """{"id":"6aae7597f43c23cf70cf9510","reservationNumber":"RES-20260919120201-1618","prosumerNIC":"200000000003",
            "stationId":"6aae6f90c619cf082968c661","slotId":"6aae6f90c619cf082968c663","reservationDate":"2026-09-20T00:00:00Z",
            "startTime":"09:00:00","endTime":"10:00:00","status":1,"qrToken":"abc=","transactionStatus":1,
            "approvedBy":"200000000002","completedBy":null,"completedAt":null,"createdAt":"2026-09-19T12:02:01.123Z","updatedAt":"2026-09-19T12:03:00Z"}"""
        val e = gson.fromJson(json, ReservationDto::class.java).toEntity()
        assertEquals("2026-09-20", e.date)
        assertEquals("200000000003", e.prosumerNic)
        assertEquals("abc=", e.qrToken)
        assertNull(e.completedAt)
        assertEquals(ReservationStatus.Approved, ReservationStatus.from(e.status))
        assertEquals(TxStatus.Verified, TxStatus.from(e.transactionStatus))
    }

    @Test
    fun stationDto_parsesSchedule_andSurvivesMissingSchedule() {
        val json = """{"id":"s","stationCode":"SS-1","stationName":"Jaffna","latitude":9.66,"longitude":80.02,"capacityKw":100,
            "batteryStorageSlots":10,"availableSlots":8,"isActive":true,
            "schedules":[{"day":"Monday","openingTime":"08:00:00","closingTime":"18:00:00","isAvailable":true},
                         {"day":"Sunday","openingTime":"00:00:00","closingTime":"00:00:00","isAvailable":false}]}"""
        val e = gson.fromJson(json, StationDto::class.java).toEntity()
        assertTrue(e.isActive)
        assertEquals(2, decodeSchedule(e.schedule).size)
        val noSchedule = gson.fromJson(json.replace(Regex("""(?s),\s*"schedules":\[.*\]"""), ""), StationDto::class.java).toEntity()
        assertEquals("", noSchedule.schedule)
    }

    @Test
    fun slotDto_and_bookable() {
        val json = """{"id":"x","stationId":"s","slotDate":"2026-09-20T00:00:00Z","startTime":"09:00:00","endTime":"10:00:00","capacityKw":20,"availableCapacityKw":20,"status":0}"""
        val e = gson.fromJson(json, SlotDto::class.java).toEntity()
        assertEquals("2026-09-20", e.date)
        assertTrue(e.isBookable)
        assertFalse(slot(status = 1).isBookable)
        assertFalse(slot(status = 0, available = 0.0).isBookable)
    }

    @Test
    fun dayOf_isTheSriLankaDay_whateverTimezoneTheServerStoredIt() {
        assertEquals("2026-09-23", dayOf("2026-09-23T00:00:00Z"))
        // Sri Lanka midnight stored by a server running in Sri Lanka time.
        assertEquals("2026-09-23", dayOf("2026-09-22T18:30:00Z"))
        assertEquals("2026-09-23", dayOf("2026-09-22T18:30:00.000Z"))
        assertEquals("2026-09-23", dayOf("2026-09-23"))
    }

    @Test
    fun errorBody_parsesApiMessage() {
        val e = gson.fromJson("""{"statusCode":400,"message":"Invalid QR token."}""", ErrorBody::class.java)
        assertEquals("Invalid QR token.", e.message)
    }

    @Test
    fun enums_fallBackSafelyOnUnknownValues() {
        assertEquals(ReservationStatus.Pending, ReservationStatus.from(99))
        assertEquals(SlotStatus.Closed, SlotStatus.from(99))
        assertEquals(TxStatus.NotStarted, TxStatus.from(-1))
    }

    @Test
    fun schedule_roundTrips() {
        val items = listOf(ScheduleItem("Monday", "08:00:00", "18:00:00", true), ScheduleItem("Sunday", "00:00:00", "00:00:00", false))
        assertEquals(items, decodeSchedule(encodeSchedule(items)))
        assertTrue(decodeSchedule("").isEmpty())
    }

    @Test
    fun stationFilter_searchActiveAndFavorites() {
        val list = listOf(station("1", "Jaffna Solar Station", "SS-JFN-001"), station("2", "Malabe Solar Station", "SS-MAL-001", active = false))
        assertEquals(1, filterStations(list, emptySet(), StationFilter.Active, "").size)
        assertEquals(listOf("2"), filterStations(list, emptySet(), StationFilter.All, "malabe").map { it.id })
        assertEquals(listOf("1"), filterStations(list, emptySet(), StationFilter.All, "JFN").map { it.id })
        assertEquals(listOf("2"), filterStations(list, setOf("2"), StationFilter.Favorites, "").map { it.id })
    }

    @Test
    fun validation() {
        assertNotNull(AuthValidation.email("nope"))
        assertNull(AuthValidation.email("a@b.lk"))
        assertNotNull(AuthValidation.phone("123"))
        assertNull(AuthValidation.phone("0771234567"))
        assertNull(AuthValidation.phone("+94771234567"))
        assertNotNull(AuthValidation.password("short"))
        assertNull(AuthValidation.password("longenough"))
        assertNotNull(AuthValidation.confirm("a", "b"))
        assertNull(AuthValidation.confirm("a", "a"))
        assertNotNull(AuthValidation.nic("  "))
    }

    @Test
    fun formatting() {
        assertEquals("09:00", Fmt.time("09:00:00"))
        assertEquals("09:00 - 10:00", Fmt.range("09:00:00", "10:00:00"))
        assertEquals("Sun, 20 Sep 2026", Fmt.date("2026-09-20T00:00:00Z"))
        assertEquals("-", Fmt.date(null))
        assertEquals("20 kW", Fmt.kw(20.0))
        assertEquals("12.5 kW", Fmt.kw(12.5))
        assertEquals("20 Sep 2026, 2:00 PM", Fmt.dateTime("2026-09-20T08:30:00Z", java.time.ZoneOffset.ofHoursMinutes(5, 30)))
    }

    @Test
    fun qrCode_encodesTokenThatAScannerCanRead() {
        val token = "B8pMDGBUnzmFFTHFlwcSay2ITCXpCwqnpCukiJAp8uM="
        val size = 400
        val pixels = QrCodes.pixels(token, size)
        val bitmap = BinaryBitmap(HybridBinarizer(RGBLuminanceSource(size, size, pixels)))
        assertEquals(token, QRCodeReader().decode(bitmap).text)
    }
}

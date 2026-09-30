package lk.smartsolar.microgrid

import java.net.HttpURLConnection
import java.net.URL
import kotlin.random.Random
import lk.smartsolar.microgrid.util.TimeRules
import org.json.JSONArray
import org.json.JSONObject

/** Talks to the running API directly, to set up and check state around what the UI does. */
object TestApi {
    const val BASE = "http://10.0.2.2:5130/api/"

    data class Result(val code: Int, val body: String)

    private fun call(method: String, path: String, token: String? = null, body: String? = null): Result {
        val conn = URL(BASE + path).openConnection() as HttpURLConnection
        conn.requestMethod = method
        conn.connectTimeout = 10_000
        conn.readTimeout = 20_000
        conn.setRequestProperty("Content-Type", "application/json")
        token?.let { conn.setRequestProperty("Authorization", "Bearer $it") }
        if (body != null) {
            conn.doOutput = true
            conn.outputStream.use { it.write(body.toByteArray()) }
        } else if (method == "POST") {
            conn.doOutput = true
            conn.setFixedLengthStreamingMode(0)
        }
        val code = conn.responseCode
        val text = (if (code < 400) conn.inputStream else conn.errorStream)?.bufferedReader()?.readText().orEmpty()
        return Result(code, text)
    }

    fun login(nic: String, password: String): String =
        JSONObject(call("POST", "auth/login", body = """{"nic":"$nic","password":"$password"}""").body).getString("token")

    fun adminToken() = login("200000000001", "Admin@123")
    fun operatorToken() = login("200000000002", "Operator@123")

    class Prosumer(val nic: String, val password: String, val token: String)

    fun registerProsumer(): Prosumer {
        val nic = "88" + (1..10).joinToString("") { Random.nextInt(10).toString() }
        val password = "Tester@1234"
        val r = call(
            "POST", "auth/register",
            body = """{"nic":"$nic","fullName":"Test Prosumer","email":"$nic@test.lk","phoneNumber":"0771234567","password":"$password"}""",
        )
        check(r.code == 201) { "register failed: ${r.code} ${r.body}" }
        return Prosumer(nic, password, JSONObject(r.body).getString("token"))
    }

    fun stationId(name: String = "Jaffna Solar Station"): String {
        val list = JSONArray(call("GET", "stations", adminToken()).body)
        return (0 until list.length()).map { list.getJSONObject(it) }.first { it.getString("stationName") == name }.getString("id")
    }

    class Slot(val id: String, val stationId: String, val date: String, val start: String, val end: String)

    /** Creates a fresh slot [daysAhead] days from today (Sri Lanka time) so tests never fight over the same slot. */
    fun createSlot(daysAhead: Int = 3, stationId: String = stationId()): Slot {
        val date = TimeRules.today().plusDays(daysAhead.toLong()).toString()
        val hour = Random.nextInt(6, 21)
        val minute = Random.nextInt(0, 30)
        val start = "%02d:%02d:00".format(hour, minute)
        val end = "%02d:%02d:00".format(hour, minute + 20)
        val r = call(
            "POST", "slots", adminToken(),
            """{"stationId":"$stationId","slotDate":"${date}T00:00:00Z","startTime":"$start","endTime":"$end","capacityKw":20}""",
        )
        check(r.code in 200..201) { "create slot failed: ${r.code} ${r.body}" }
        return Slot(JSONObject(r.body).getString("id"), stationId, date, start, end)
    }

    class Reservation(val id: String, val number: String)

    fun createReservation(token: String, slot: Slot): Reservation {
        val r = call(
            "POST", "reservations", token,
            """{"stationId":"${slot.stationId}","slotId":"${slot.id}","reservationDate":"${slot.date}T00:00:00Z"}""",
        )
        check(r.code == 201) { "reservation failed: ${r.code} ${r.body}" }
        val json = JSONObject(r.body)
        return Reservation(json.getString("id"), json.getString("reservationNumber"))
    }

    fun approve(id: String) {
        val r = call("POST", "reservations/$id/approve", operatorToken())
        check(r.code == 200) { "approve failed: ${r.code} ${r.body}" }
    }

    /** Verifies the QR token and completes the transfer, as a Grid Operator would. */
    fun completeViaApi(qrToken: String, id: String) {
        val op = operatorToken()
        val verified = call("POST", "reservations/verify-qr", op, "\"$qrToken\"")
        check(verified.code == 200) { "verify failed: ${verified.code} ${verified.body}" }
        val done = call("POST", "reservations/$id/complete", op)
        check(done.code == 200) { "complete failed: ${done.code} ${done.body}" }
    }

    fun get(id: String, token: String): JSONObject = JSONObject(call("GET", "reservations/$id", token).body)
}

package lk.smartsolar.microgrid.util

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

object Fmt {
    private val dayFmt = DateTimeFormatter.ofPattern("EEE, d MMM yyyy", Locale.ENGLISH)
    private val dayShortFmt = DateTimeFormatter.ofPattern("EEE d MMM", Locale.ENGLISH)
    private val stampFmt = DateTimeFormatter.ofPattern("d MMM yyyy, h:mm a", Locale.ENGLISH)

    /** "2026-09-20" (or a full ISO timestamp) to "Sun, 20 Sep 2026". */
    fun date(value: String?): String =
        value?.takeIf { it.length >= 10 }?.let { runCatching { LocalDate.parse(it.take(10)).format(dayFmt) }.getOrNull() } ?: "-"

    fun dateShort(value: LocalDate): String = value.format(dayShortFmt)

    /** "09:00:00" to "09:00". */
    fun time(value: String?): String = value?.take(5) ?: "-"

    fun range(start: String?, end: String?): String = "${time(start)} - ${time(end)}"

    fun dateTime(iso: String?, zone: ZoneId = ZoneId.systemDefault()): String =
        iso?.let { runCatching { Instant.parse(it).atZone(zone).format(stampFmt) }.getOrNull() } ?: "-"

    fun stamp(millis: Long, zone: ZoneId = ZoneId.systemDefault()): String =
        Instant.ofEpochMilli(millis).atZone(zone).format(stampFmt)

    fun kw(value: Double): String =
        if (value % 1.0 == 0.0) "${value.toLong()} kW" else String.format(Locale.ENGLISH, "%.1f kW", value)
}

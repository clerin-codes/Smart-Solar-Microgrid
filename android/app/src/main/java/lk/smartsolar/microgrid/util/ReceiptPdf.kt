package lk.smartsolar.microgrid.util

import android.content.Context
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import java.io.File
import lk.smartsolar.microgrid.R
import lk.smartsolar.microgrid.data.local.ReservationEntity

object ReceiptPdf {
    private const val PAGE_WIDTH = 595
    private const val PAGE_HEIGHT = 842
    private const val MARGIN = 48f

    /** One key/value line of the receipt. */
    fun fields(r: ReservationEntity, stationName: String, capacityKw: Double?, status: String, transaction: String) = listOf(
        "Reservation" to r.number,
        "Prosumer NIC" to r.prosumerNic,
        "Station" to stationName,
        "Slot date" to Fmt.date(r.date),
        "Slot time" to Fmt.range(r.startTime, r.endTime),
        "Slot capacity" to (capacityKw?.let(Fmt::kw) ?: "-"),
        "Status" to status,
        "Transaction" to transaction,
        "Approved by" to (r.approvedBy ?: "-"),
        "Completed by" to (r.completedBy ?: "-"),
        "Completed at" to Fmt.dateTime(r.completedAt),
    )

    /** Writes a one-page receipt into the shared cache folder and returns the file. */
    fun create(context: Context, title: String, reference: String, lines: List<Pair<String, String>>): File {
        val document = PdfDocument()
        val page = document.startPage(PdfDocument.PageInfo.Builder(PAGE_WIDTH, PAGE_HEIGHT, 1).create())
        val canvas = page.canvas

        var y = MARGIN
        BitmapFactory.decodeResource(context.resources, R.drawable.sunchain_logo)?.let { logo ->
            val height = 56f
            val width = height * logo.width / logo.height
            canvas.drawBitmap(logo, null, android.graphics.RectF(MARGIN, y, MARGIN + width, y + height), null)
            y += height + 32f
        }

        val heading = Paint().apply { textSize = 22f; typeface = Typeface.DEFAULT_BOLD; color = Color.rgb(17, 24, 39) }
        val sub = Paint().apply { textSize = 12f; color = Color.rgb(107, 114, 128) }
        val label = Paint().apply { textSize = 12f; color = Color.rgb(107, 114, 128) }
        val value = Paint().apply { textSize = 14f; typeface = Typeface.DEFAULT_BOLD; color = Color.rgb(17, 24, 39) }
        val rule = Paint().apply { color = Color.rgb(229, 231, 235); strokeWidth = 1f }

        canvas.drawText(title, MARGIN, y, heading)
        y += 20f
        canvas.drawText(reference, MARGIN, y, sub)
        y += 18f
        canvas.drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, rule)
        y += 28f

        for ((k, v) in lines) {
            canvas.drawText(k, MARGIN, y, label)
            canvas.drawText(v, MARGIN + 150f, y, value)
            y += 28f
        }

        document.finishPage(page)
        val dir = File(context.cacheDir, "shared").apply { mkdirs() }
        val file = File(dir, "receipt-${reference.replace(Regex("[^A-Za-z0-9-]"), "_")}.pdf")
        file.outputStream().use { document.writeTo(it) }
        document.close()
        return file
    }
}

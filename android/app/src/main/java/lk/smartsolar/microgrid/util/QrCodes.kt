package lk.smartsolar.microgrid.util

import android.graphics.Bitmap
import android.graphics.Color
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

object QrCodes {
    /** ARGB pixels of [text] as a black-on-white QR code, [size] x [size]. Pure, so it can be tested off-device. */
    fun pixels(text: String, size: Int = 720): IntArray {
        val matrix = QRCodeWriter().encode(
            text,
            BarcodeFormat.QR_CODE,
            size,
            size,
            mapOf(EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.H, EncodeHintType.MARGIN to 2),
        )
        return IntArray(size * size) { i -> if (matrix.get(i % size, i / size)) Color.BLACK else Color.WHITE }
    }

    /** Renders [text] as a black-on-white QR code. */
    fun encode(text: String, size: Int = 720): Bitmap =
        Bitmap.createBitmap(pixels(text, size), size, size, Bitmap.Config.ARGB_8888)

    private val options = BarcodeScannerOptions.Builder().setBarcodeFormats(Barcode.FORMAT_QR_CODE).build()

    /** Reads the first QR code in [bitmap] with ML Kit, or null when there is none. */
    suspend fun decode(bitmap: Bitmap): String? = decode(InputImage.fromBitmap(bitmap, 0))

    suspend fun decode(image: InputImage): String? = suspendCancellableCoroutine { cont ->
        val scanner = BarcodeScanning.getClient(options)
        scanner.process(image)
            .addOnSuccessListener { codes -> cont.resume(codes.firstNotNullOfOrNull { it.rawValue }) }
            .addOnFailureListener { cont.resumeWithException(it) }
            .addOnCompleteListener { scanner.close() }
    }
}

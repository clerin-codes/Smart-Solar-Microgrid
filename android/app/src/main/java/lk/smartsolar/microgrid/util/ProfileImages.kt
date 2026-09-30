package lk.smartsolar.microgrid.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.util.Base64
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.min
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** Turns a picked photo into the small square JPEG (as base64) that is stored on the user's profile. */
object ProfileImages {
    /** Side length of the stored square picture. */
    const val SIZE = 512
    private const val JPEG_QUALITY = 85

    /** Decodes [uri], crops it to a centred square, scales it to [SIZE] and returns it as unwrapped base64 JPEG. */
    suspend fun toBase64(context: Context, uri: Uri): String = withContext(Dispatchers.IO) {
        val source = decode(context, uri)
        val square = centreSquare(source)
        val scaled = if (square.width > SIZE) Bitmap.createScaledBitmap(square, SIZE, SIZE, true) else square
        val out = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, out)
        Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    }

    /** Decodes a stored base64 picture, or null when it is missing or unreadable. */
    fun decodeBase64(base64: String?): Bitmap? {
        if (base64.isNullOrEmpty()) return null
        return runCatching {
            val bytes = Base64.decode(base64, Base64.DEFAULT)
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        }.getOrNull()
    }

    private fun decode(context: Context, uri: Uri): Bitmap {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // ImageDecoder applies the photo's rotation for us and can decode straight to a sensible size.
            val src = ImageDecoder.createSource(context.contentResolver, uri)
            return ImageDecoder.decodeBitmap(src) { decoder, info, _ ->
                decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                val longest = max(info.size.width, info.size.height)
                if (longest > SIZE * 2) {
                    val scale = SIZE * 2f / longest
                    decoder.setTargetSize((info.size.width * scale).toInt().coerceAtLeast(1), (info.size.height * scale).toInt().coerceAtLeast(1))
                }
            }
        }
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= SIZE * 2) sample *= 2
        val options = BitmapFactory.Options().apply { inSampleSize = sample }
        return context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }
            ?: throw IllegalArgumentException("Could not read the picture.")
    }

    private fun centreSquare(bitmap: Bitmap): Bitmap {
        val side = min(bitmap.width, bitmap.height)
        val x = (bitmap.width - side) / 2
        val y = (bitmap.height - side) / 2
        return if (side == bitmap.width && side == bitmap.height) bitmap else Bitmap.createBitmap(bitmap, x, y, side, side)
    }
}

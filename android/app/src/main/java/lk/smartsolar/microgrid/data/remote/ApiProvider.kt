package lk.smartsolar.microgrid.data.remote

import com.google.gson.Gson
import android.util.Log
import java.io.IOException
import java.util.concurrent.TimeUnit
import lk.smartsolar.microgrid.data.local.SessionStore
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import retrofit2.HttpException
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

/** Failure with a message that is safe to show to the user. */
open class AppException(
    message: String,
    val code: Int? = null,
    val fieldErrors: Map<String, String> = emptyMap(),
) : Exception(message)

class OfflineException : AppException("No connection to the server. Showing saved data.")

/** Adds the JWT to requests, and ends the session when the server rejects the token itself. */
private class AuthInterceptor(private val session: SessionStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val builder = chain.request().newBuilder()
        session.token?.let { builder.header("Authorization", "Bearer $it") }
        val response = chain.proceed(builder.build())

        // Any authenticated request rejected with 401 has an invalid or expired JWT.
        val isLogin = chain.request().url.encodedPath.endsWith("/auth/login")
        if (response.code == 401 && !isLogin && chain.request().header("Authorization") != null) {
            session.clear()
        }
        return response
    }
}

/** Builds [ApiService] for the server address in [SessionStore], rebuilding when the address changes. */
class ApiProvider(private val session: SessionStore) {
    private companion object {
        const val TAG = "ApiProvider"
    }

    private val gson = Gson()
    private var builtFor: String? = null
    private var service: ApiService? = null

    private val client: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .addInterceptor(AuthInterceptor(session))
            .build()
    }

    @Synchronized
    fun api(): ApiService {
        val url = session.baseUrl.value
        if (service == null || builtFor != url) {
            service = createService(url)
            builtFor = url
        }
        return service!!
    }

    /** Checks a candidate server without changing the address used by the rest of the app. */
    suspend fun testConnection(url: String): HealthResponse =
        try {
            createService(url).health()
        } catch (e: HttpException) {
            throw toAppException(e)
        } catch (e: IOException) {
            Log.w(TAG, "Server connection test failed for $url", e)
            throw AppException("Could not connect to the server. Check the URL and network.")
        } catch (e: IllegalArgumentException) {
            throw AppException("The server address is not valid.")
        }

    private fun createService(url: String): ApiService =
        Retrofit.Builder()
            .baseUrl(url)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(ApiService::class.java)

    /** Runs an API call, converting transport and HTTP failures into [AppException]s. */
    suspend fun <T> call(block: suspend (ApiService) -> T): T =
        try {
            block(api())
        } catch (e: HttpException) {
            throw toAppException(e)
        } catch (e: IOException) {
            Log.w(TAG, "Network failure calling ${session.baseUrl.value}", e)
            throw OfflineException()
        } catch (e: IllegalArgumentException) {
            throw AppException("The server address is not valid. Check it in Settings.")
        }

    private fun toAppException(e: HttpException): AppException {
        val body = runCatching { e.response()?.errorBody()?.string() }.getOrNull()
        val parsed = body?.let { runCatching { gson.fromJson(it, ErrorBody::class.java) }.getOrNull() }
        val message = parsed?.message?.takeIf { it.isNotBlank() }
            ?: when (e.code()) {
                400 -> "The server rejected the request. Check the details and try again."
                401 -> "Invalid credentials, or your session has expired. Please sign in again."
                403 -> "You do not have permission to do that."
                404 -> "The server could not find that endpoint (404)."
                409 -> "That record already exists (conflict)."
                in 500..599 -> "Server error (${e.code()}). Please try again later."
                else -> "Something went wrong (${e.code()})."
            }
        val fields = parsed?.errors.orEmpty().mapNotNull { (field, messages) ->
            messages.firstOrNull()?.takeIf { it.isNotBlank() }?.let { field.lowercase() to it }
        }.toMap()
        return AppException(message, e.code(), fields)
    }
}

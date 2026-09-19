package lk.smartsolar.microgrid.data.remote

import com.google.gson.Gson
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
open class AppException(message: String, val code: Int? = null) : Exception(message)

class OfflineException : AppException("No connection to the server. Showing saved data.")

/** Adds the JWT to requests, and ends the session when the server rejects the token itself. */
private class AuthInterceptor(private val session: SessionStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val builder = chain.request().newBuilder()
        session.token?.let { builder.header("Authorization", "Bearer $it") }
        val response = chain.proceed(builder.build())

        // A rejected/expired JWT gives an empty 401; business-rule errors carry a JSON message.
        val isLogin = chain.request().url.encodedPath.endsWith("/auth/login")
        if (response.code == 401 && !isLogin && session.token != null && response.header("Content-Length") == "0") {
            session.clear()
        }
        return response
    }
}

/** Builds [ApiService] for the server address in [SessionStore], rebuilding when the address changes. */
class ApiProvider(private val session: SessionStore) {
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
            service = Retrofit.Builder()
                .baseUrl(url)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()
                .create(ApiService::class.java)
            builtFor = url
        }
        return service!!
    }

    /** Runs an API call, converting transport and HTTP failures into [AppException]s. */
    suspend fun <T> call(block: suspend (ApiService) -> T): T =
        try {
            block(api())
        } catch (e: HttpException) {
            throw AppException(errorMessage(e), e.code())
        } catch (e: IOException) {
            throw OfflineException()
        } catch (e: IllegalArgumentException) {
            throw AppException("The server address is not valid. Check it in Settings.")
        }

    private fun errorMessage(e: HttpException): String {
        val body = runCatching { e.response()?.errorBody()?.string() }.getOrNull()
        val parsed = body?.let { runCatching { gson.fromJson(it, ErrorBody::class.java) }.getOrNull() }
        return parsed?.message?.takeIf { it.isNotBlank() }
            ?: when (e.code()) {
                401 -> "Your session has expired. Please sign in again."
                403 -> "You do not have permission to do that."
                404 -> "Not found."
                else -> "Something went wrong (${e.code()})."
            }
    }
}

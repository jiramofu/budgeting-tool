package com.budgetapp.data.remote.interceptor

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import timber.log.Timber

val Context.authDataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_store")

class AuthInterceptor(private val context: Context) : Interceptor {
    companion object {
        private val AUTH_TOKEN_KEY = stringPreferencesKey("auth_token")
    }

    override fun intercept(chain: Interceptor.Chain): Response {
        var request = chain.request()

        // Get token from DataStore and add it to request
        val token = runBlocking {
            getAuthToken()
        }

        if (token.isNotEmpty()) {
            request = request.newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
            Timber.d("Added auth token to request")
        }

        var response = chain.proceed(request)

        // Handle 401 response - token likely expired
        if (response.code == 401) {
            Timber.w("Received 401 Unauthorized - clearing token")
            response.close()
            runBlocking {
                clearAuthToken()
            }
            // In a real app, you would trigger a logout event here
            // that the app can observe and navigate to login screen
        }

        return response
    }

    private suspend fun getAuthToken(): String {
        return try {
            val preferences = context.authDataStore.data.collect { pref ->
                pref[AUTH_TOKEN_KEY] ?: ""
            }
            preferences
        } catch (e: Exception) {
            Timber.e(e, "Error reading auth token")
            ""
        }
    }

    private suspend fun clearAuthToken() {
        try {
            context.authDataStore.edit { preferences ->
                preferences.remove(AUTH_TOKEN_KEY)
            }
            Timber.d("Auth token cleared")
        } catch (e: Exception) {
            Timber.e(e, "Error clearing auth token")
        }
    }
}

package com.budgetapp.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.budgetapp.data.remote.api.AuthApi
import com.budgetapp.data.remote.api.LoginRequest
import com.budgetapp.data.remote.api.SignupRequest
import com.budgetapp.domain.model.AuthState
import com.budgetapp.domain.model.User
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import timber.log.Timber
import javax.inject.Inject

class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        private val AUTH_TOKEN_KEY = stringPreferencesKey("auth_token")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
    }

    val authStateFlow: Flow<AuthState> = dataStore.data.map { preferences ->
        val token = preferences[AUTH_TOKEN_KEY] ?: ""
        val email = preferences[USER_EMAIL_KEY] ?: ""

        if (token.isNotEmpty()) {
            AuthState(
                token = token,
                user = User(
                    id = 0, // Could be stored separately
                    email = email,
                    firstName = null,
                    lastName = null,
                    createdAt = ""
                ),
                isAuthenticated = true,
                isLoading = false,
                error = null
            )
        } else {
            AuthState()
        }
    }

    suspend fun login(email: String, password: String): Result<User> = try {
        Timber.d("Attempting login for: $email")
        val response = authApi.login(LoginRequest(email, password))

        // Save token
        dataStore.edit { preferences ->
            preferences[AUTH_TOKEN_KEY] = response.token
            preferences[USER_EMAIL_KEY] = response.user.email
        }

        Timber.d("Login successful for: $email")
        Result.success(response.user)
    } catch (e: Exception) {
        Timber.e(e, "Login failed")
        Result.failure(e)
    }

    suspend fun signup(
        email: String,
        password: String,
        firstName: String? = null,
        lastName: String? = null
    ): Result<User> = try {
        Timber.d("Attempting signup for: $email")
        val response = authApi.signup(
            SignupRequest(
                email = email,
                password = password,
                firstName = firstName,
                lastName = lastName
            )
        )

        // Save token
        dataStore.edit { preferences ->
            preferences[AUTH_TOKEN_KEY] = response.token
            preferences[USER_EMAIL_KEY] = response.user.email
        }

        Timber.d("Signup successful for: $email")
        Result.success(response.user)
    } catch (e: Exception) {
        Timber.e(e, "Signup failed")
        Result.failure(e)
    }

    suspend fun logout() {
        try {
            dataStore.edit { preferences ->
                preferences.remove(AUTH_TOKEN_KEY)
                preferences.remove(USER_EMAIL_KEY)
            }
            Timber.d("Logout successful")
        } catch (e: Exception) {
            Timber.e(e, "Logout failed")
        }
    }

    suspend fun getAuthToken(): String {
        return dataStore.data.map { preferences ->
            preferences[AUTH_TOKEN_KEY] ?: ""
        }.collect { token ->
            return@collect token
        }
    }

    suspend fun isAuthenticated(): Boolean {
        return dataStore.data.map { preferences ->
            !preferences[AUTH_TOKEN_KEY].isNullOrEmpty()
        }.collect { isAuth ->
            return@collect isAuth
        }
    }
}

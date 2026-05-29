package com.budgetapp.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.budgetapp.data.repository.AuthRepository
import com.budgetapp.domain.model.AuthState
import com.budgetapp.domain.model.User
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

sealed class AuthUiEvent {
    object LoginSuccess : AuthUiEvent()
    object SignupSuccess : AuthUiEvent()
    data class Error(val message: String) : AuthUiEvent()
    object NavigateToDashboard : AuthUiEvent()
    object NavigateToSignup : AuthUiEvent()
}

data class AuthUiState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val user: User? = null,
    val error: String? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private val _uiEvent = MutableSharedFlow<AuthUiEvent>()
    val uiEvent = _uiEvent.asSharedFlow()

    val authState = authRepository.authStateFlow

    init {
        observeAuthState()
    }

    private fun observeAuthState() {
        viewModelScope.launch {
            authRepository.authStateFlow.collect { authState ->
                _uiState.value = _uiState.value.copy(
                    isAuthenticated = authState.isAuthenticated,
                    user = authState.user,
                    error = authState.error?.message
                )
            }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val result = authRepository.login(email, password)
                result.onSuccess { user ->
                    Timber.d("Login successful: ${user.email}")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        user = user,
                        error = null
                    )
                    _uiEvent.emit(AuthUiEvent.LoginSuccess)
                    _uiEvent.emit(AuthUiEvent.NavigateToDashboard)
                }.onFailure { error ->
                    Timber.e(error, "Login failed")
                    val errorMessage = when {
                        error.message?.contains("401") == true -> "Invalid email or password"
                        error.message?.contains("network") == true -> "Network error. Please try again."
                        else -> error.message ?: "Login failed"
                    }
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = errorMessage
                    )
                    _uiEvent.emit(AuthUiEvent.Error(errorMessage))
                }
            } catch (e: Exception) {
                Timber.e(e, "Login exception")
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "An unexpected error occurred"
                )
                _uiEvent.emit(AuthUiEvent.Error("An unexpected error occurred"))
            }
        }
    }

    fun signup(
        email: String,
        password: String,
        firstName: String? = null,
        lastName: String? = null
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val result = authRepository.signup(email, password, firstName, lastName)
                result.onSuccess { user ->
                    Timber.d("Signup successful: ${user.email}")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        user = user,
                        error = null
                    )
                    _uiEvent.emit(AuthUiEvent.SignupSuccess)
                    _uiEvent.emit(AuthUiEvent.NavigateToDashboard)
                }.onFailure { error ->
                    Timber.e(error, "Signup failed")
                    val errorMessage = when {
                        error.message?.contains("409") == true -> "Email already exists"
                        error.message?.contains("validation") == true -> "Invalid input. Please check your entries."
                        error.message?.contains("network") == true -> "Network error. Please try again."
                        else -> error.message ?: "Signup failed"
                    }
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = errorMessage
                    )
                    _uiEvent.emit(AuthUiEvent.Error(errorMessage))
                }
            } catch (e: Exception) {
                Timber.e(e, "Signup exception")
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "An unexpected error occurred"
                )
                _uiEvent.emit(AuthUiEvent.Error("An unexpected error occurred"))
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                authRepository.logout()
                _uiState.value = AuthUiState()
                Timber.d("Logout successful")
            } catch (e: Exception) {
                Timber.e(e, "Logout failed")
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

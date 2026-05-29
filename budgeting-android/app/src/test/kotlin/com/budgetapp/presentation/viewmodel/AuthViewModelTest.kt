package com.budgetapp.presentation.viewmodel

import com.budgetapp.data.repository.AuthRepository
import com.budgetapp.domain.model.AuthState
import com.budgetapp.domain.model.User
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.kotlin.whenever

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {
    private val testDispatcher = StandardTestDispatcher()

    @Mock
    private lateinit var authRepository: AuthRepository

    private lateinit var viewModel: AuthViewModel

    @Before
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun testLoginSuccess() = runTest {
        // Arrange
        val testUser = User(
            id = 1,
            email = "test@example.com",
            firstName = "Test",
            lastName = "User",
            createdAt = "2024-01-01T00:00:00Z"
        )
        whenever(authRepository.login("test@example.com", "password"))
            .thenReturn(Result.success(testUser))

        whenever(authRepository.authStateFlow)
            .thenReturn(flowOf(
                AuthState(
                    token = "token123",
                    user = testUser,
                    isAuthenticated = true,
                    isLoading = false,
                    error = null
                )
            ))

        viewModel = AuthViewModel(authRepository)

        // Act
        viewModel.login("test@example.com", "password")

        // Assert
        assert(viewModel.uiState.value.isAuthenticated)
        assert(viewModel.uiState.value.user?.email == "test@example.com")
        assert(viewModel.uiState.value.error == null)
    }

    @Test
    fun testLoginFailure() = runTest {
        // Arrange
        val error = Exception("Invalid credentials")
        whenever(authRepository.login("test@example.com", "wrong"))
            .thenReturn(Result.failure(error))

        whenever(authRepository.authStateFlow)
            .thenReturn(flowOf(AuthState()))

        viewModel = AuthViewModel(authRepository)

        // Act
        viewModel.login("test@example.com", "wrong")

        // Assert
        assert(viewModel.uiState.value.error != null)
        assert(!viewModel.uiState.value.isAuthenticated)
    }

    @Test
    fun testLogout() = runTest {
        // Arrange
        whenever(authRepository.authStateFlow)
            .thenReturn(flowOf(AuthState()))

        viewModel = AuthViewModel(authRepository)

        // Act
        viewModel.logout()

        // Assert
        assert(!viewModel.uiState.value.isAuthenticated)
        assert(viewModel.uiState.value.user == null)
    }

    @Test
    fun testSignupSuccess() = runTest {
        // Arrange
        val testUser = User(
            id = 2,
            email = "newuser@example.com",
            firstName = "New",
            lastName = "User",
            createdAt = "2024-01-01T00:00:00Z"
        )
        whenever(authRepository.signup("newuser@example.com", "password", "New", "User"))
            .thenReturn(Result.success(testUser))

        whenever(authRepository.authStateFlow)
            .thenReturn(flowOf(
                AuthState(
                    token = "token456",
                    user = testUser,
                    isAuthenticated = true,
                    isLoading = false,
                    error = null
                )
            ))

        viewModel = AuthViewModel(authRepository)

        // Act
        viewModel.signup("newuser@example.com", "password", "New", "User")

        // Assert
        assert(viewModel.uiState.value.isAuthenticated)
        assert(viewModel.uiState.value.user?.email == "newuser@example.com")
    }
}

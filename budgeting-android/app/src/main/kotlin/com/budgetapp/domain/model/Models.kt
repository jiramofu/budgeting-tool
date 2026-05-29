package com.budgetapp.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// User model
@Serializable
data class User(
    val id: Int,
    val email: String,
    @SerialName("first_name")
    val firstName: String? = null,
    @SerialName("last_name")
    val lastName: String? = null,
    @SerialName("created_at")
    val createdAt: String
)

// Budget model
@Serializable
data class Budget(
    val id: Int,
    @SerialName("category_id")
    val categoryId: Int,
    @SerialName("category_name")
    val categoryName: String,
    @SerialName("target_amount")
    val targetAmount: Double,
    val spent: Double,
    val percentage: Double
)

// Budget detail (current month)
@Serializable
data class BudgetDetail(
    val id: Int,
    val month: Int,
    val year: Int,
    @SerialName("total_budget")
    val totalBudget: Double,
    @SerialName("total_spent")
    val totalSpent: Double,
    @SerialName("created_at")
    val createdAt: String
)

// Category model
@Serializable
data class Category(
    val id: Int,
    val name: String,
    val color: String? = null,
    val icon: String? = null
)

// Transaction model
@Serializable
data class Transaction(
    val id: Int,
    val description: String,
    val amount: Double,
    @SerialName("transaction_date")
    val transactionDate: String,
    @SerialName("category_id")
    val categoryId: Int,
    @SerialName("category_name")
    val categoryName: String? = null,
    val type: String? = null,
    @SerialName("created_at")
    val createdAt: String
)

// User Settings
@Serializable
data class UserSettings(
    val theme: String = "light",
    val currency: String = "USD",
    val language: String = "en",
    @SerialName("email_notifications")
    val emailNotifications: Boolean = true,
    @SerialName("push_notifications")
    val pushNotifications: Boolean = true,
    @SerialName("two_factor_enabled")
    val twoFactorEnabled: Boolean = false
)

// Auth state
data class AuthState(
    val token: String = "",
    val user: User? = null,
    val isAuthenticated: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null
)

// UI State for Login
data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isPasswordVisible: Boolean = false
)

// UI State for Signup
data class SignupUiState(
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isPasswordVisible: Boolean = false,
    val acceptedTerms: Boolean = false
)

// UI State for Dashboard
data class DashboardUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val budgetDetail: BudgetDetail? = null,
    val budgets: List<Budget> = emptyList(),
    val recentTransactions: List<Transaction> = emptyList(),
    val totalSpending: Double = 0.0,
    val budgetRemaining: Double = 0.0,
    val averageDailySpending: Double = 0.0
)

// Settings UI State
data class SettingsUiState(
    val theme: String = "light",
    val currency: String = "USD",
    val language: String = "en",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSaving: Boolean = false
)

package com.budgetapp.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.budgetapp.data.repository.BudgetRepository
import com.budgetapp.data.repository.TransactionRepository
import com.budgetapp.domain.model.Budget
import com.budgetapp.domain.model.Transaction
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

data class DashboardUiState(
    val budgets: List<Budget> = emptyList(),
    val transactions: List<Transaction> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val totalBudgeted: Double = 0.0,
    val totalSpent: Double = 0.0,
    val remainingBudget: Double = 0.0
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val budgetRepository: BudgetRepository,
    private val transactionRepository: TransactionRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    init {
        loadDashboardData()
    }

    fun loadDashboardData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                // Combine budgets and transactions flows
                combine(
                    budgetRepository.getBudgetsFlow(),
                    transactionRepository.getTransactionsFlow(limit = 10)
                ) { budgets, transactions ->
                    Pair(budgets, transactions)
                }.collect { (budgets, transactions) ->
                    val totalBudgeted = budgets.sumOf { it.targetAmount }
                    val totalSpent = budgets.sumOf { it.spent }
                    val remainingBudget = totalBudgeted - totalSpent

                    _uiState.value = _uiState.value.copy(
                        budgets = budgets,
                        transactions = transactions,
                        isLoading = false,
                        error = null,
                        totalBudgeted = totalBudgeted,
                        totalSpent = totalSpent,
                        remainingBudget = remainingBudget
                    )
                    Timber.d("Dashboard data loaded: ${budgets.size} budgets, ${transactions.size} transactions")
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to load dashboard data")
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Failed to load dashboard data"
                )
            }
        }
    }

    fun refreshDashboard() {
        viewModelScope.launch {
            _isRefreshing.value = true
            try {
                loadDashboardData()
            } finally {
                _isRefreshing.value = false
            }
        }
    }

    fun getBudgetProgress(budget: Budget): Float {
        return if (budget.targetAmount > 0) {
            (budget.spent / budget.targetAmount).toFloat().coerceIn(0f, 1f)
        } else {
            0f
        }
    }

    fun getRecentTransactions(limit: Int = 5): List<Transaction> {
        return _uiState.value.transactions.take(limit)
    }

    fun getNearLimitBudgets(): List<Budget> {
        return _uiState.value.budgets.filter { budget ->
            if (budget.targetAmount > 0) {
                val percentageSpent = (budget.spent / budget.targetAmount) * 100
                percentageSpent >= 80
            } else {
                false
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

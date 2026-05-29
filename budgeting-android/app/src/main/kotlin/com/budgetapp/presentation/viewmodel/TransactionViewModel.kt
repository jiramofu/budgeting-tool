package com.budgetapp.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.budgetapp.data.repository.CategoryRepository
import com.budgetapp.data.repository.TransactionRepository
import com.budgetapp.domain.model.Category
import com.budgetapp.domain.model.Transaction
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

sealed class TransactionUiEvent {
    data class TransactionCreated(val transactionId: Int) : TransactionUiEvent()
    data class TransactionUpdated(val transactionId: Int) : TransactionUiEvent()
    data class TransactionDeleted(val transactionId: Int) : TransactionUiEvent()
    data class Error(val message: String) : TransactionUiEvent()
}

data class TransactionUiState(
    val transactions: List<Transaction> = emptyList(),
    val categories: List<Category> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedDateRange: Pair<String, String>? = null
)

@HiltViewModel
class TransactionViewModel @Inject constructor(
    private val transactionRepository: TransactionRepository,
    private val categoryRepository: CategoryRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(TransactionUiState())
    val uiState: StateFlow<TransactionUiState> = _uiState.asStateFlow()

    private val _uiEvent = MutableSharedFlow<TransactionUiEvent>()
    val uiEvent = _uiEvent.asSharedFlow()

    init {
        loadTransactionsAndCategories()
    }

    fun loadTransactionsAndCategories() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                combine(
                    transactionRepository.getTransactionsFlow(limit = 100),
                    categoryRepository.getCategoriesFlow()
                ) { transactions, categories ->
                    Pair(transactions, categories)
                }.collect { (transactions, categories) ->
                    _uiState.value = _uiState.value.copy(
                        transactions = transactions,
                        categories = categories,
                        isLoading = false,
                        error = null
                    )
                    Timber.d("Transactions and categories loaded: ${transactions.size} transactions, ${categories.size} categories")
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to load transactions and categories")
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Failed to load transactions and categories"
                )
            }
        }
    }

    fun loadTransactionsByDateRange(startDate: String, endDate: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                combine(
                    transactionRepository.getTransactionsByDateRange(startDate, endDate),
                    categoryRepository.getCategoriesFlow()
                ) { transactions, categories ->
                    Pair(transactions, categories)
                }.collect { (transactions, categories) ->
                    _uiState.value = _uiState.value.copy(
                        transactions = transactions,
                        categories = categories,
                        isLoading = false,
                        error = null,
                        selectedDateRange = Pair(startDate, endDate)
                    )
                    Timber.d("Transactions filtered by date range: ${transactions.size} transactions")
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to load transactions by date range")
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Failed to load transactions"
                )
            }
        }
    }

    fun loadTransactionsByCategory(categoryId: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                transactionRepository.getTransactionsByCategory(categoryId).collect { transactions ->
                    _uiState.value = _uiState.value.copy(
                        transactions = transactions,
                        isLoading = false,
                        error = null
                    )
                    Timber.d("Transactions filtered by category: ${transactions.size} transactions")
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to load transactions by category")
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Failed to load transactions"
                )
            }
        }
    }

    fun searchTransactions(query: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                transactionRepository.searchTransactions(query).collect { transactions ->
                    _uiState.value = _uiState.value.copy(
                        transactions = transactions,
                        isLoading = false,
                        error = null
                    )
                    Timber.d("Search results: ${transactions.size} transactions")
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to search transactions")
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Failed to search transactions"
                )
            }
        }
    }

    fun createTransaction(
        description: String,
        amount: Double,
        transactionDate: String,
        categoryId: Int
    ) {
        viewModelScope.launch {
            try {
                val result = transactionRepository.createTransaction(
                    description,
                    amount,
                    transactionDate,
                    categoryId
                )
                result.onSuccess { transaction ->
                    Timber.d("Transaction created: ${transaction.id}")
                    _uiEvent.emit(TransactionUiEvent.TransactionCreated(transaction.id))
                    loadTransactionsAndCategories()
                }.onFailure { error ->
                    Timber.e(error, "Failed to create transaction")
                    _uiEvent.emit(TransactionUiEvent.Error(error.message ?: "Failed to create transaction"))
                }
            } catch (e: Exception) {
                Timber.e(e, "Transaction creation exception")
                _uiEvent.emit(TransactionUiEvent.Error("An unexpected error occurred"))
            }
        }
    }

    fun updateTransaction(
        transactionId: Int,
        description: String,
        amount: Double,
        transactionDate: String,
        categoryId: Int
    ) {
        viewModelScope.launch {
            try {
                val result = transactionRepository.updateTransaction(
                    transactionId,
                    description,
                    amount,
                    transactionDate,
                    categoryId
                )
                result.onSuccess { transaction ->
                    Timber.d("Transaction updated: ${transaction.id}")
                    _uiEvent.emit(TransactionUiEvent.TransactionUpdated(transaction.id))
                    loadTransactionsAndCategories()
                }.onFailure { error ->
                    Timber.e(error, "Failed to update transaction")
                    _uiEvent.emit(TransactionUiEvent.Error(error.message ?: "Failed to update transaction"))
                }
            } catch (e: Exception) {
                Timber.e(e, "Transaction update exception")
                _uiEvent.emit(TransactionUiEvent.Error("An unexpected error occurred"))
            }
        }
    }

    fun deleteTransaction(transactionId: Int) {
        viewModelScope.launch {
            try {
                val result = transactionRepository.deleteTransaction(transactionId)
                result.onSuccess {
                    Timber.d("Transaction deleted: $transactionId")
                    _uiEvent.emit(TransactionUiEvent.TransactionDeleted(transactionId))
                    loadTransactionsAndCategories()
                }.onFailure { error ->
                    Timber.e(error, "Failed to delete transaction")
                    _uiEvent.emit(TransactionUiEvent.Error(error.message ?: "Failed to delete transaction"))
                }
            } catch (e: Exception) {
                Timber.e(e, "Transaction deletion exception")
                _uiEvent.emit(TransactionUiEvent.Error("An unexpected error occurred"))
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun getTotalSpent(): Double {
        return _uiState.value.transactions.sumOf { it.amount }
    }

    fun getAverageTransactionAmount(): Double {
        val transactions = _uiState.value.transactions
        return if (transactions.isNotEmpty()) {
            transactions.sumOf { it.amount } / transactions.size
        } else {
            0.0
        }
    }
}

package com.budgetapp.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.budgetapp.data.repository.BudgetRepository
import com.budgetapp.data.repository.CategoryRepository
import com.budgetapp.domain.model.Budget
import com.budgetapp.domain.model.Category
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

sealed class BudgetUiEvent {
    data class BudgetCreated(val budgetId: Int) : BudgetUiEvent()
    data class BudgetUpdated(val budgetId: Int) : BudgetUiEvent()
    data class BudgetDeleted(val budgetId: Int) : BudgetUiEvent()
    data class Error(val message: String) : BudgetUiEvent()
}

data class BudgetUiState(
    val budgets: List<Budget> = emptyList(),
    val categories: List<Category> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class BudgetViewModel @Inject constructor(
    private val budgetRepository: BudgetRepository,
    private val categoryRepository: CategoryRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(BudgetUiState())
    val uiState: StateFlow<BudgetUiState> = _uiState.asStateFlow()

    private val _uiEvent = MutableSharedFlow<BudgetUiEvent>()
    val uiEvent = _uiEvent.asSharedFlow()

    init {
        loadBudgetsAndCategories()
    }

    fun loadBudgetsAndCategories() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                combine(
                    budgetRepository.getBudgetsFlow(),
                    categoryRepository.getCategoriesFlow()
                ) { budgets, categories ->
                    Pair(budgets, categories)
                }.collect { (budgets, categories) ->
                    _uiState.value = _uiState.value.copy(
                        budgets = budgets,
                        categories = categories,
                        isLoading = false,
                        error = null
                    )
                    Timber.d("Budgets and categories loaded: ${budgets.size} budgets, ${categories.size} categories")
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to load budgets and categories")
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Failed to load budgets and categories"
                )
            }
        }
    }

    fun createBudget(categoryId: Int, targetAmount: Double) {
        viewModelScope.launch {
            try {
                val result = budgetRepository.createBudget(categoryId, targetAmount)
                result.onSuccess { budget ->
                    Timber.d("Budget created: ${budget.id}")
                    _uiEvent.emit(BudgetUiEvent.BudgetCreated(budget.id))
                    loadBudgetsAndCategories()
                }.onFailure { error ->
                    Timber.e(error, "Failed to create budget")
                    _uiEvent.emit(BudgetUiEvent.Error(error.message ?: "Failed to create budget"))
                }
            } catch (e: Exception) {
                Timber.e(e, "Budget creation exception")
                _uiEvent.emit(BudgetUiEvent.Error("An unexpected error occurred"))
            }
        }
    }

    fun updateBudget(budgetId: Int, targetAmount: Double) {
        viewModelScope.launch {
            try {
                val result = budgetRepository.updateBudget(budgetId, targetAmount)
                result.onSuccess { budget ->
                    Timber.d("Budget updated: ${budget.id}")
                    _uiEvent.emit(BudgetUiEvent.BudgetUpdated(budget.id))
                    loadBudgetsAndCategories()
                }.onFailure { error ->
                    Timber.e(error, "Failed to update budget")
                    _uiEvent.emit(BudgetUiEvent.Error(error.message ?: "Failed to update budget"))
                }
            } catch (e: Exception) {
                Timber.e(e, "Budget update exception")
                _uiEvent.emit(BudgetUiEvent.Error("An unexpected error occurred"))
            }
        }
    }

    fun deleteBudget(budgetId: Int) {
        viewModelScope.launch {
            try {
                val result = budgetRepository.deleteBudget(budgetId)
                result.onSuccess {
                    Timber.d("Budget deleted: $budgetId")
                    _uiEvent.emit(BudgetUiEvent.BudgetDeleted(budgetId))
                    loadBudgetsAndCategories()
                }.onFailure { error ->
                    Timber.e(error, "Failed to delete budget")
                    _uiEvent.emit(BudgetUiEvent.Error(error.message ?: "Failed to delete budget"))
                }
            } catch (e: Exception) {
                Timber.e(e, "Budget deletion exception")
                _uiEvent.emit(BudgetUiEvent.Error("An unexpected error occurred"))
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

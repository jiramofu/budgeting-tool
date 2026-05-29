package com.budgetapp.data.repository

import com.budgetapp.data.local.dao.BudgetDao
import com.budgetapp.data.local.dao.CategoryDao
import com.budgetapp.data.local.entity.toEntity
import com.budgetapp.data.remote.api.BudgetApi
import com.budgetapp.data.remote.api.CreateBudgetRequest
import com.budgetapp.data.remote.api.UpdateBudgetRequest
import com.budgetapp.domain.model.Budget
import com.budgetapp.domain.model.Category
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow
import timber.log.Timber
import javax.inject.Inject

class BudgetRepository @Inject constructor(
    private val budgetApi: BudgetApi,
    private val budgetDao: BudgetDao,
    private val categoryDao: CategoryDao
) {
    // Fetch budgets with offline-first pattern
    fun getBudgetsFlow(): Flow<List<Budget>> = flow {
        try {
            Timber.d("Fetching budgets from API")
            val budgets = budgetApi.getBudgets()

            // Cache in local database
            budgetDao.insertBudgets(budgets.map { it.toDomainModel().toEntity() })

            // Emit from network
            emit(budgets.map { it.toDomainModel() })
        } catch (e: Exception) {
            Timber.e(e, "Failed to fetch budgets from API, serving from cache")
            // Fall back to cached data
            budgetDao.getAllBudgets()
                .catch { cacheError ->
                    Timber.e(cacheError, "Failed to fetch cached budgets")
                }
                .collect { cachedBudgets ->
                    emit(cachedBudgets.map { it.toDomainModel() })
                }
        }
    }

    // Fetch categories with offline-first pattern
    fun getCategoriesFlow(): Flow<List<Category>> = flow {
        try {
            Timber.d("Fetching categories from API")
            val categories = budgetApi.getCategories()

            // Cache in local database
            categoryDao.insertCategories(categories.map { it.toDomainModel().toEntity() })

            // Emit from network
            emit(categories.map { it.toDomainModel() })
        } catch (e: Exception) {
            Timber.e(e, "Failed to fetch categories from API, serving from cache")
            // Fall back to cached data
            categoryDao.getAllCategories()
                .catch { cacheError ->
                    Timber.e(cacheError, "Failed to fetch cached categories")
                }
                .collect { cachedCategories ->
                    emit(cachedCategories.map { it.toDomainModel() })
                }
        }
    }

    suspend fun createBudget(categoryId: Int, targetAmount: Double): Result<Budget> = try {
        Timber.d("Creating budget for category: $categoryId")
        val response = budgetApi.createBudget(
            CreateBudgetRequest(
                categoryId = categoryId,
                targetAmount = targetAmount
            )
        )

        // Cache the result
        budgetDao.insertBudget(response.toDomainModel().toEntity())

        Result.success(response.toDomainModel())
    } catch (e: Exception) {
        Timber.e(e, "Failed to create budget")
        Result.failure(e)
    }

    suspend fun updateBudget(budgetId: Int, targetAmount: Double): Result<Budget> = try {
        Timber.d("Updating budget: $budgetId")
        val response = budgetApi.updateBudget(
            budgetId,
            UpdateBudgetRequest(targetAmount = targetAmount)
        )

        // Update cache
        budgetDao.updateBudget(response.toDomainModel().toEntity())

        Result.success(response.toDomainModel())
    } catch (e: Exception) {
        Timber.e(e, "Failed to update budget")
        Result.failure(e)
    }

    suspend fun deleteBudget(budgetId: Int): Result<Unit> = try {
        Timber.d("Deleting budget: $budgetId")
        budgetApi.deleteBudget(budgetId)

        // Remove from cache
        budgetDao.deleteBudgetById(budgetId)

        Result.success(Unit)
    } catch (e: Exception) {
        Timber.e(e, "Failed to delete budget")
        Result.failure(e)
    }
}

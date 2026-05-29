package com.budgetapp.data.repository

import com.budgetapp.data.local.dao.TransactionDao
import com.budgetapp.data.local.entity.toEntity
import com.budgetapp.data.remote.api.CreateTransactionRequest
import com.budgetapp.data.remote.api.TransactionApi
import com.budgetapp.data.remote.api.UpdateTransactionRequest
import com.budgetapp.domain.model.Transaction
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import timber.log.Timber
import javax.inject.Inject

class TransactionRepository @Inject constructor(
    private val transactionApi: TransactionApi,
    private val transactionDao: TransactionDao
) {
    // Fetch transactions with offline-first pattern
    fun getTransactionsFlow(limit: Int = 50, offset: Int = 0): Flow<List<Transaction>> = flow {
        try {
            Timber.d("Fetching transactions from API (limit: $limit, offset: $offset)")
            val transactions = transactionApi.getTransactions(limit, offset)

            // Cache in local database
            transactionDao.insertTransactions(transactions.map { it.toDomainModel().toEntity() })

            // Emit from network
            emit(transactions.map { it.toDomainModel() })
        } catch (e: Exception) {
            Timber.e(e, "Failed to fetch transactions from API, serving from cache")
            // Fall back to cached data
            transactionDao.getAllTransactions(limit, offset)
                .catch { cacheError ->
                    Timber.e(cacheError, "Failed to fetch cached transactions")
                }
                .collect { cachedTransactions ->
                    emit(cachedTransactions.map { it.toDomainModel() })
                }
        }
    }

    // Get transactions by date range
    fun getTransactionsByDateRange(startDate: String, endDate: String): Flow<List<Transaction>> = flow {
        try {
            Timber.d("Fetching transactions by date range: $startDate to $endDate")
            val transactions = transactionApi.getTransactionsByDateRange(startDate, endDate)

            // Cache in local database
            transactionDao.insertTransactions(transactions.map { it.toDomainModel().toEntity() })

            // Emit from network
            emit(transactions.map { it.toDomainModel() })
        } catch (e: Exception) {
            Timber.e(e, "Failed to fetch transactions by date range, serving from cache")
            // Fall back to cached data
            transactionDao.getTransactionsByDateRange(startDate, endDate)
                .catch { cacheError ->
                    Timber.e(cacheError, "Failed to fetch cached transactions by date")
                }
                .collect { cachedTransactions ->
                    emit(cachedTransactions.map { it.toDomainModel() })
                }
        }
    }

    // Get transactions by category
    fun getTransactionsByCategory(categoryId: Int): Flow<List<Transaction>> = flow {
        try {
            Timber.d("Fetching transactions for category: $categoryId")
            val transactions = transactionApi.getTransactionsByCategory(categoryId)

            // Cache in local database
            transactionDao.insertTransactions(transactions.map { it.toDomainModel().toEntity() })

            // Emit from network
            emit(transactions.map { it.toDomainModel() })
        } catch (e: Exception) {
            Timber.e(e, "Failed to fetch transactions by category, serving from cache")
            // Fall back to cached data
            transactionDao.getTransactionsByCategory(categoryId)
                .catch { cacheError ->
                    Timber.e(cacheError, "Failed to fetch cached transactions by category")
                }
                .collect { cachedTransactions ->
                    emit(cachedTransactions.map { it.toDomainModel() })
                }
        }
    }

    suspend fun createTransaction(
        description: String,
        amount: Double,
        transactionDate: String,
        categoryId: Int
    ): Result<Transaction> = try {
        Timber.d("Creating transaction: $description")
        val response = transactionApi.createTransaction(
            CreateTransactionRequest(
                description = description,
                amount = amount,
                transactionDate = transactionDate,
                categoryId = categoryId
            )
        )

        // Cache the result
        transactionDao.insertTransaction(response.toDomainModel().toEntity())

        Result.success(response.toDomainModel())
    } catch (e: Exception) {
        Timber.e(e, "Failed to create transaction")
        Result.failure(e)
    }

    suspend fun updateTransaction(
        transactionId: Int,
        description: String,
        amount: Double,
        transactionDate: String,
        categoryId: Int
    ): Result<Transaction> = try {
        Timber.d("Updating transaction: $transactionId")
        val response = transactionApi.updateTransaction(
            transactionId,
            UpdateTransactionRequest(
                description = description,
                amount = amount,
                transactionDate = transactionDate,
                categoryId = categoryId
            )
        )

        // Update cache
        transactionDao.updateTransaction(response.toDomainModel().toEntity())

        Result.success(response.toDomainModel())
    } catch (e: Exception) {
        Timber.e(e, "Failed to update transaction")
        Result.failure(e)
    }

    suspend fun deleteTransaction(transactionId: Int): Result<Unit> = try {
        Timber.d("Deleting transaction: $transactionId")
        transactionApi.deleteTransaction(transactionId)

        // Remove from cache
        transactionDao.deleteTransactionById(transactionId)

        Result.success(Unit)
    } catch (e: Exception) {
        Timber.e(e, "Failed to delete transaction")
        Result.failure(e)
    }

    fun searchTransactions(query: String): Flow<List<Transaction>> {
        return transactionDao.searchTransactions(query)
            .map { cachedTransactions ->
                cachedTransactions.map { it.toDomainModel() }
            }
            .catch { e ->
                Timber.e(e, "Failed to search transactions")
            }
    }
}

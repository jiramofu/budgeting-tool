package com.budgetapp.data.remote.api

import com.budgetapp.domain.model.Transaction
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Request DTOs
@Serializable
data class CreateTransactionRequest(
    val description: String,
    val amount: Double,
    @SerialName("transaction_date")
    val transactionDate: String,
    @SerialName("category_id")
    val categoryId: Int
)

@Serializable
data class UpdateTransactionRequest(
    val description: String,
    val amount: Double,
    @SerialName("transaction_date")
    val transactionDate: String,
    @SerialName("category_id")
    val categoryId: Int
)

// Response DTOs
@Serializable
data class TransactionResponse(
    val id: Int,
    val description: String,
    val amount: Double,
    @SerialName("transaction_date")
    val transactionDate: String,
    @SerialName("category_id")
    val categoryId: Int,
    @SerialName("category_name")
    val categoryName: String,
    @SerialName("user_id")
    val userId: Int,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String
) {
    fun toDomainModel(): Transaction = Transaction(
        id = id,
        description = description,
        amount = amount,
        transactionDate = transactionDate,
        categoryId = categoryId,
        categoryName = categoryName,
        userId = userId,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

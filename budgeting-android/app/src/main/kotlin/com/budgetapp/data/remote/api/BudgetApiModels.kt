package com.budgetapp.data.remote.api

import com.budgetapp.domain.model.Budget
import com.budgetapp.domain.model.Category
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Request DTOs
@Serializable
data class CreateBudgetRequest(
    val categoryId: Int,
    val targetAmount: Double
)

@Serializable
data class UpdateBudgetRequest(
    val targetAmount: Double
)

// Response DTOs
@Serializable
data class BudgetResponse(
    val id: Int,
    @SerialName("category_id")
    val categoryId: Int,
    @SerialName("category_name")
    val categoryName: String,
    @SerialName("target_amount")
    val targetAmount: Double,
    val spent: Double,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String
) {
    fun toDomainModel(): Budget = Budget(
        id = id,
        categoryId = categoryId,
        categoryName = categoryName,
        targetAmount = targetAmount,
        spent = spent,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

@Serializable
data class CategoryResponse(
    val id: Int,
    val name: String,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String
) {
    fun toDomainModel(): Category = Category(
        id = id,
        name = name,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

@Serializable
data class CreateCategoryRequest(
    val name: String
)

@Serializable
data class UpdateCategoryRequest(
    val name: String
)

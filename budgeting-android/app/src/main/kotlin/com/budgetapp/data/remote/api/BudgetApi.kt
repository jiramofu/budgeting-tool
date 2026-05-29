package com.budgetapp.data.remote.api

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

// Budget Response DTOs
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
    val percentage: Double
)

@Serializable
data class BudgetDetailResponse(
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

@Serializable
data class CategoryResponse(
    val id: Int,
    val name: String,
    val color: String? = null,
    val icon: String? = null
)

@Serializable
data class CreateBudgetRequest(
    @SerialName("category_id")
    val categoryId: Int,
    @SerialName("target_amount")
    val targetAmount: Double
)

@Serializable
data class UpdateBudgetRequest(
    @SerialName("target_amount")
    val targetAmount: Double
)

interface BudgetApi {
    @GET("budgets")
    suspend fun getBudgets(): List<BudgetResponse>

    @GET("budgets/current")
    suspend fun getCurrentBudget(): BudgetDetailResponse

    @GET("categories")
    suspend fun getCategories(): List<CategoryResponse>

    @POST("budgets")
    suspend fun createBudget(@Body request: CreateBudgetRequest): BudgetResponse

    @PUT("budgets/{id}")
    suspend fun updateBudget(
        @Path("id") id: Int,
        @Body request: UpdateBudgetRequest
    ): BudgetResponse

    @DELETE("budgets/{id}")
    suspend fun deleteBudget(@Path("id") id: Int)
}

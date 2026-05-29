package com.budgetapp.data.remote.api

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

// Transaction Response DTOs
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
    val categoryName: String? = null,
    val type: String? = null,
    @SerialName("created_at")
    val createdAt: String
)

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

interface TransactionApi {
    @GET("transactions")
    suspend fun getTransactions(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0
    ): List<TransactionResponse>

    @GET("transactions")
    suspend fun getTransactionsByDateRange(
        @Query("start_date") startDate: String,
        @Query("end_date") endDate: String
    ): List<TransactionResponse>

    @GET("transactions")
    suspend fun getTransactionsByCategory(
        @Query("category_id") categoryId: Int
    ): List<TransactionResponse>

    @POST("transactions")
    suspend fun createTransaction(@Body request: CreateTransactionRequest): TransactionResponse

    @PUT("transactions/{id}")
    suspend fun updateTransaction(
        @Path("id") id: Int,
        @Body request: UpdateTransactionRequest
    ): TransactionResponse

    @DELETE("transactions/{id}")
    suspend fun deleteTransaction(@Path("id") id: Int)
}

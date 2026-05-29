package com.budgetapp.data.remote.api

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface TransactionApi {
    @GET("transactions")
    suspend fun getTransactions(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0
    ): List<TransactionResponse>

    @GET("transactions/{id}")
    suspend fun getTransactionById(@Path("id") transactionId: Int): TransactionResponse

    @POST("transactions")
    suspend fun createTransaction(@Body request: CreateTransactionRequest): TransactionResponse

    @PUT("transactions/{id}")
    suspend fun updateTransaction(
        @Path("id") transactionId: Int,
        @Body request: UpdateTransactionRequest
    ): TransactionResponse

    @DELETE("transactions/{id}")
    suspend fun deleteTransaction(@Path("id") transactionId: Int)

    @GET("transactions/by-date")
    suspend fun getTransactionsByDateRange(
        @Query("start_date") startDate: String,
        @Query("end_date") endDate: String
    ): List<TransactionResponse>

    @GET("transactions/by-category/{categoryId}")
    suspend fun getTransactionsByCategory(
        @Path("categoryId") categoryId: Int
    ): List<TransactionResponse>

    @GET("transactions/search")
    suspend fun searchTransactions(
        @Query("query") query: String
    ): List<TransactionResponse>
}

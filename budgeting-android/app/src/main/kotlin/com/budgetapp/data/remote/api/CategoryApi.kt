package com.budgetapp.data.remote.api

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface CategoryApi {
    @GET("categories")
    suspend fun getCategories(): List<CategoryResponse>

    @GET("categories/{id}")
    suspend fun getCategoryById(@Path("id") categoryId: Int): CategoryResponse

    @POST("categories")
    suspend fun createCategory(@Body request: CreateCategoryRequest): CategoryResponse

    @PUT("categories/{id}")
    suspend fun updateCategory(
        @Path("id") categoryId: Int,
        @Body request: UpdateCategoryRequest
    ): CategoryResponse

    @DELETE("categories/{id}")
    suspend fun deleteCategory(@Path("id") categoryId: Int)

    @GET("categories/search")
    suspend fun searchCategories(
        @Query("query") query: String
    ): List<CategoryResponse>
}

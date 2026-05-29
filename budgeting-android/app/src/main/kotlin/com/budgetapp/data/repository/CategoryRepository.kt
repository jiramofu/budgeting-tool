package com.budgetapp.data.repository

import com.budgetapp.data.local.dao.CategoryDao
import com.budgetapp.data.local.entity.toEntity
import com.budgetapp.data.remote.api.CategoryApi
import com.budgetapp.data.remote.api.CreateCategoryRequest
import com.budgetapp.data.remote.api.UpdateCategoryRequest
import com.budgetapp.domain.model.Category
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow
import timber.log.Timber
import javax.inject.Inject

class CategoryRepository @Inject constructor(
    private val categoryApi: CategoryApi,
    private val categoryDao: CategoryDao
) {
    // Fetch all categories with offline-first pattern
    fun getCategoriesFlow(): Flow<List<Category>> = flow {
        try {
            Timber.d("Fetching categories from API")
            val categories = categoryApi.getCategories()

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

    // Search categories
    fun searchCategories(query: String): Flow<List<Category>> {
        return categoryDao.searchCategories(query)
            .catch { e ->
                Timber.e(e, "Failed to search categories")
            }
    }

    suspend fun getCategoryById(categoryId: Int): Result<Category> = try {
        Timber.d("Fetching category: $categoryId")
        val category = categoryDao.getCategoryById(categoryId)
        if (category != null) {
            Result.success(category.toDomainModel())
        } else {
            Result.failure(Exception("Category not found"))
        }
    } catch (e: Exception) {
        Timber.e(e, "Failed to fetch category")
        Result.failure(e)
    }

    suspend fun createCategory(name: String): Result<Category> = try {
        Timber.d("Creating category: $name")
        val response = categoryApi.createCategory(
            CreateCategoryRequest(name = name)
        )

        // Cache the result
        categoryDao.insertCategory(response.toDomainModel().toEntity())

        Result.success(response.toDomainModel())
    } catch (e: Exception) {
        Timber.e(e, "Failed to create category")
        Result.failure(e)
    }

    suspend fun updateCategory(categoryId: Int, name: String): Result<Category> = try {
        Timber.d("Updating category: $categoryId")
        val response = categoryApi.updateCategory(
            categoryId,
            UpdateCategoryRequest(name = name)
        )

        // Update cache
        categoryDao.updateCategory(response.toDomainModel().toEntity())

        Result.success(response.toDomainModel())
    } catch (e: Exception) {
        Timber.e(e, "Failed to update category")
        Result.failure(e)
    }

    suspend fun deleteCategory(categoryId: Int): Result<Unit> = try {
        Timber.d("Deleting category: $categoryId")
        categoryApi.deleteCategory(categoryId)

        // Remove from cache
        categoryDao.deleteCategoryById(categoryId)

        Result.success(Unit)
    } catch (e: Exception) {
        Timber.e(e, "Failed to delete category")
        Result.failure(e)
    }
}

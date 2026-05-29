package com.budgetapp.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.budgetapp.domain.model.Transaction as DomainTransaction
import com.budgetapp.domain.model.Budget as DomainBudget
import com.budgetapp.domain.model.Category as DomainCategory

// Transaction entity for Room
@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey
    val id: Int,
    val description: String,
    val amount: Double,
    @ColumnInfo(name = "transaction_date")
    val transactionDate: String,
    @ColumnInfo(name = "category_id")
    val categoryId: Int,
    @ColumnInfo(name = "category_name")
    val categoryName: String? = null,
    val type: String? = null,
    @ColumnInfo(name = "created_at")
    val createdAt: String
) {
    fun toDomainModel(): DomainTransaction = DomainTransaction(
        id = id,
        description = description,
        amount = amount,
        transactionDate = transactionDate,
        categoryId = categoryId,
        categoryName = categoryName,
        type = type,
        createdAt = createdAt
    )
}

// Budget entity for Room
@Entity(tableName = "budgets")
data class BudgetEntity(
    @PrimaryKey
    val id: Int,
    @ColumnInfo(name = "category_id")
    val categoryId: Int,
    @ColumnInfo(name = "category_name")
    val categoryName: String,
    @ColumnInfo(name = "target_amount")
    val targetAmount: Double,
    val spent: Double,
    val percentage: Double
) {
    fun toDomainModel(): DomainBudget = DomainBudget(
        id = id,
        categoryId = categoryId,
        categoryName = categoryName,
        targetAmount = targetAmount,
        spent = spent,
        percentage = percentage
    )
}

// Category entity for Room
@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey
    val id: Int,
    val name: String,
    val color: String? = null,
    val icon: String? = null
) {
    fun toDomainModel(): DomainCategory = DomainCategory(
        id = id,
        name = name,
        color = color,
        icon = icon
    )
}

// Extension functions for conversion
fun DomainTransaction.toEntity(): TransactionEntity = TransactionEntity(
    id = id,
    description = description,
    amount = amount,
    transactionDate = transactionDate,
    categoryId = categoryId,
    categoryName = categoryName,
    type = type,
    createdAt = createdAt
)

fun DomainBudget.toEntity(): BudgetEntity = BudgetEntity(
    id = id,
    categoryId = categoryId,
    categoryName = categoryName,
    targetAmount = targetAmount,
    spent = spent,
    percentage = percentage
)

fun DomainCategory.toEntity(): CategoryEntity = CategoryEntity(
    id = id,
    name = name,
    color = color,
    icon = icon
)

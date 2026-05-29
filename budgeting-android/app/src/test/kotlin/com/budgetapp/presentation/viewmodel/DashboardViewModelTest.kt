package com.budgetapp.presentation.viewmodel

import com.budgetapp.data.repository.BudgetRepository
import com.budgetapp.data.repository.TransactionRepository
import com.budgetapp.domain.model.Budget
import com.budgetapp.domain.model.Transaction
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.kotlin.whenever
import java.time.LocalDateTime

@OptIn(ExperimentalCoroutinesApi::class)
class DashboardViewModelTest {
    private val testDispatcher = StandardTestDispatcher()

    @Mock
    private lateinit var budgetRepository: BudgetRepository

    @Mock
    private lateinit var transactionRepository: TransactionRepository

    private lateinit var viewModel: DashboardViewModel

    @Before
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun testLoadDashboardDataSuccess() = runTest {
        // Arrange
        val testBudgets = listOf(
            Budget(
                id = 1,
                categoryName = "Food",
                targetAmount = 500.0,
                spent = 300.0,
                month = "May",
                year = 2026
            ),
            Budget(
                id = 2,
                categoryName = "Transport",
                targetAmount = 200.0,
                spent = 150.0,
                month = "May",
                year = 2026
            )
        )

        val testTransactions = listOf(
            Transaction(
                id = 1,
                amount = 50.0,
                description = "Groceries",
                categoryId = 1,
                date = LocalDateTime.now(),
                userId = 1
            ),
            Transaction(
                id = 2,
                amount = 30.0,
                description = "Transport",
                categoryId = 2,
                date = LocalDateTime.now(),
                userId = 1
            )
        )

        whenever(budgetRepository.getBudgetsFlow())
            .thenReturn(flowOf(testBudgets))

        whenever(transactionRepository.getTransactionsFlow())
            .thenReturn(flowOf(testTransactions))

        viewModel = DashboardViewModel(budgetRepository, transactionRepository)

        // Act
        viewModel.loadDashboardData()

        // Assert
        assert(viewModel.uiState.value.budgets.size == 2)
        assert(viewModel.uiState.value.transactions.size == 2)
        assert(viewModel.uiState.value.totalBudgeted == 700.0)
        assert(viewModel.uiState.value.totalSpent == 450.0)
        assert(!viewModel.uiState.value.isLoading)
    }

    @Test
    fun testGetBudgetProgress() = runTest {
        // Arrange
        val budget = Budget(
            id = 1,
            categoryName = "Food",
            targetAmount = 500.0,
            spent = 350.0,
            month = "May",
            year = 2026
        )

        whenever(budgetRepository.getBudgetsFlow())
            .thenReturn(flowOf(listOf(budget)))

        whenever(transactionRepository.getTransactionsFlow())
            .thenReturn(flowOf(emptyList()))

        viewModel = DashboardViewModel(budgetRepository, transactionRepository)

        // Act
        val progress = viewModel.getBudgetProgress(budget)

        // Assert
        assert(progress == 0.7f)  // 350/500 = 0.7
    }

    @Test
    fun testGetNearLimitBudgets() = runTest {
        // Arrange
        val budgets = listOf(
            Budget(id = 1, categoryName = "Food", targetAmount = 500.0, spent = 450.0, month = "May", year = 2026),
            Budget(id = 2, categoryName = "Transport", targetAmount = 200.0, spent = 150.0, month = "May", year = 2026),
            Budget(id = 3, categoryName = "Entertainment", targetAmount = 100.0, spent = 95.0, month = "May", year = 2026)
        )

        whenever(budgetRepository.getBudgetsFlow())
            .thenReturn(flowOf(budgets))

        whenever(transactionRepository.getTransactionsFlow())
            .thenReturn(flowOf(emptyList()))

        viewModel = DashboardViewModel(budgetRepository, transactionRepository)

        // Act
        val nearLimit = viewModel.getNearLimitBudgets()

        // Assert
        // Food (90%), Entertainment (95%) should be in near-limit list
        assert(nearLimit.any { it.categoryName == "Food" })
        assert(nearLimit.any { it.categoryName == "Entertainment" })
        assert(!nearLimit.any { it.categoryName == "Transport" })  // 75% not near limit
    }

    @Test
    fun testRefreshDashboard() = runTest {
        // Arrange
        val testBudgets = listOf(
            Budget(id = 1, categoryName = "Food", targetAmount = 500.0, spent = 300.0, month = "May", year = 2026)
        )

        whenever(budgetRepository.getBudgetsFlow())
            .thenReturn(flowOf(testBudgets))

        whenever(transactionRepository.getTransactionsFlow())
            .thenReturn(flowOf(emptyList()))

        viewModel = DashboardViewModel(budgetRepository, transactionRepository)

        // Act
        viewModel.refreshDashboard()

        // Assert
        assert(!viewModel.uiState.value.isLoading)
        assert(viewModel.uiState.value.budgets.isNotEmpty())
    }
}

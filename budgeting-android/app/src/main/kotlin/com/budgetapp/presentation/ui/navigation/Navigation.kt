package com.budgetapp.presentation.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.compose.material3.MaterialTheme
import com.budgetapp.presentation.ui.screens.DashboardScreen
import com.budgetapp.presentation.ui.screens.LoginScreen
import com.budgetapp.presentation.ui.screens.SignupScreen
import com.budgetapp.presentation.ui.screens.BudgetsScreen
import com.budgetapp.presentation.ui.screens.TransactionsScreen
import com.budgetapp.presentation.ui.screens.SettingsScreen

sealed class Route(val path: String) {
    object Login : Route("login")
    object Signup : Route("signup")
    object Dashboard : Route("dashboard")
    object Budgets : Route("budgets")
    object Transactions : Route("transactions")
    object Analytics : Route("analytics")
    object Settings : Route("settings")
}

data class BottomNavItem(
    val route: Route,
    val label: String,
    val icon: androidx.compose.material.icons.vector.ImageVector
)

@Composable
fun BudgetAppNavigation() {
    val navController = rememberNavController()
    var startDestination by remember { mutableIntStateOf(0) }

    NavHost(
        navController = navController,
        startDestination = Route.Login.path
    ) {
        composable(Route.Login.path) {
            LoginScreen(
                onNavigateToDashboard = {
                    navController.navigate(Route.Dashboard.path) {
                        popUpTo(Route.Login.path) { inclusive = true }
                    }
                },
                onNavigateToSignup = {
                    navController.navigate(Route.Signup.path)
                }
            )
        }

        composable(Route.Signup.path) {
            SignupScreen(
                onNavigateToDashboard = {
                    navController.navigate(Route.Dashboard.path) {
                        popUpTo(Route.Signup.path) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                }
            )
        }

        composable(Route.Dashboard.path) {
            MainAppScreen(navController = navController)
        }
    }
}

@Composable
fun MainAppScreen(navController: NavController) {
    var selectedTabIndex by remember { mutableIntStateOf(0) }

    val bottomNavItems = listOf(
        BottomNavItem(
            route = Route.Dashboard,
            label = "Dashboard",
            icon = Icons.Default.Home
        ),
        BottomNavItem(
            route = Route.Budgets,
            label = "Budgets",
            icon = Icons.Default.AccountBalance
        ),
        BottomNavItem(
            route = Route.Transactions,
            label = "Transactions",
            icon = Icons.Default.Receipt
        ),
        BottomNavItem(
            route = Route.Analytics,
            label = "Analytics",
            icon = Icons.Default.Analytics
        ),
        BottomNavItem(
            route = Route.Settings,
            label = "Settings",
            icon = Icons.Default.Settings
        )
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                bottomNavItems.forEachIndexed { index, item ->
                    NavigationBarItem(
                        selected = selectedTabIndex == index,
                        onClick = {
                            selectedTabIndex = index
                            navController.navigate(item.route.path) {
                                popUpTo(Route.Dashboard.path) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.label
                            )
                        },
                        label = {
                            Text(text = item.label)
                        }
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            when (selectedTabIndex) {
                0 -> DashboardScreen()
                1 -> BudgetsScreenWrapper(navController)
                2 -> TransactionsScreenWrapper(navController)
                3 -> AnalyticsScreenPlaceholder()
                4 -> SettingsScreenWrapper(
                    onLogout = {
                        navController.navigate(Route.Login.path) {
                            popUpTo(Route.Dashboard.path) { inclusive = true }
                        }
                    },
                    navController = navController
                )
            }
        }
    }
}

@Composable
fun BudgetsScreenWrapper(navController: NavController = rememberNavController()) {
    BudgetsScreen()
}

@Composable
fun TransactionsScreenWrapper(navController: NavController = rememberNavController()) {
    TransactionsScreen()
}

@Composable
fun AnalyticsScreenPlaceholder() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        androidx.compose.material3.Text("Analytics Screen - Coming Soon")
    }
}

@Composable
fun SettingsScreenWrapper(
    onLogout: () -> Unit = {},
    navController: NavController = rememberNavController()
) {
    SettingsScreen(onLogout = onLogout)
}

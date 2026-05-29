package com.budgetapp.presentation.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = BudgetLightPrimary,
    secondary = BudgetLightSecondary,
    tertiary = BudgetLightTertiary,
    error = BudgetLightError,
    background = BudgetLightBackground,
    surface = BudgetLightSurface,
    onPrimary = BudgetLightOnPrimary,
    onSecondary = BudgetLightOnSecondary,
    onTertiary = BudgetLightOnTertiary,
    onBackground = BudgetLightOnBackground,
    onSurface = BudgetLightOnSurface,
    outline = BudgetLightOutline,
)

private val DarkColorScheme = darkColorScheme(
    primary = BudgetDarkPrimary,
    secondary = BudgetDarkSecondary,
    tertiary = BudgetDarkTertiary,
    error = BudgetDarkError,
    background = BudgetDarkBackground,
    surface = BudgetDarkSurface,
    onPrimary = BudgetDarkOnPrimary,
    onSecondary = BudgetDarkOnSecondary,
    onTertiary = BudgetDarkOnTertiary,
    onBackground = BudgetDarkOnBackground,
    onSurface = BudgetDarkOnSurface,
    outline = BudgetDarkOutline,
)

@Composable
fun BudgetAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view)?.isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = BudgetTypography,
        content = content
    )
}

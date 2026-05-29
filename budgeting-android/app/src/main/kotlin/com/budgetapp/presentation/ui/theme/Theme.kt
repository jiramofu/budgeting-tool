package com.budgetapp.presentation.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF60a5fa),           // Blue-400 from web (darker for dark theme)
    onPrimary = Color(0xFF0f172a),         // Dark slate for text
    primaryContainer = Color(0xFF1e40af),  // Blue-800
    onPrimaryContainer = Color(0xFF93c5fd), // Blue-300
    
    secondary = Color(0xFFfbbf24),         // Amber-400
    onSecondary = Color(0xFF451a03),       // Amber-950
    secondaryContainer = Color(0xFFb45309), // Amber-700
    onSecondaryContainer = Color(0xFFfef3c7), // Amber-100
    
    tertiary = Color(0xFF4ade80),          // Green-400
    onTertiary = Color(0xFF1b4332),        // Green-900
    tertiaryContainer = Color(0xFF15803d), // Green-700
    onTertiaryContainer = Color(0xFFa7f3d0), // Green-300
    
    error = Color(0xFFf87171),             // Red-400
    onError = Color(0xFF7f1d1d),           // Red-900
    errorContainer = Color(0xFFdc2626),    // Red-600
    onErrorContainer = Color(0xFFfecaca),  // Red-200
    
    background = Color(0xFF0f172a),        // Slate-900
    onBackground = Color(0xFFf1f5f9),      // Slate-100
    surface = Color(0xFF1e293b),           // Slate-800
    onSurface = Color(0xFFf1f5f9),         // Slate-100
    surfaceVariant = Color(0xFF334155),    // Slate-700
    onSurfaceVariant = Color(0xFFcbd5e1),  // Slate-300
    
    outline = Color(0xFF64748b),           // Slate-500
    outlineVariant = Color(0xFF475569)     // Slate-600
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF2563eb),           // Blue-600
    onPrimary = Color(0xFFffffff),         // White
    primaryContainer = Color(0xFFdbeafe),  // Blue-100
    onPrimaryContainer = Color(0xFF1e3a8a), // Blue-900
    
    secondary = Color(0xFFF59e0b),         // Amber-500
    onSecondary = Color(0xFFffffff),       // White
    secondaryContainer = Color(0xFFfef3c7), // Amber-100
    onSecondaryContainer = Color(0xFF78350f), // Amber-900
    
    tertiary = Color(0xFF16a34a),          // Green-600
    onTertiary = Color(0xFFffffff),        // White
    tertiaryContainer = Color(0xFFdcfce7), // Green-100
    onTertiaryContainer = Color(0xFF15803d), // Green-700
    
    error = Color(0xFFdc2626),             // Red-600
    onError = Color(0xFFffffff),           // White
    errorContainer = Color(0xFFfecaca),    // Red-200
    onErrorContainer = Color(0xFF7f1d1d),  // Red-900
    
    background = Color(0xFFf8fafc),        // Slate-50
    onBackground = Color(0xFF0f172a),      // Slate-900
    surface = Color(0xFFffffff),           // White
    onSurface = Color(0xFF1e293b),         // Slate-800
    surfaceVariant = Color(0xFFe2e8f0),    // Slate-200
    onSurfaceVariant = Color(0xFF64748b),  // Slate-500
    
    outline = Color(0xFF94a3b8),           // Slate-400
    outlineVariant = Color(0xFFcbd5e1)     // Slate-300
)

@Composable
fun BudgetAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = BudgetAppTypography,
        content = content
    )
}

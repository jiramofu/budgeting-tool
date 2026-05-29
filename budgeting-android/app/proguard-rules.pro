# Proguard rules for BudgetApp - Release optimization

# General
-optimizationpasses 5
-verbose

# Keep our app classes
-keep class com.budgetapp.** { *; }
-keepclassmembers class com.budgetapp.** { *; }

# Keep all Kotlin data classes
-keep class ** {
    @kotlin.jvm.internal.SerializedLambda *;
}

# Keep all serializable classes
-keep class ** implements java.io.Serializable { *; }

# Keep Jetpack Compose classes
-keep class androidx.compose.** { *; }
-keepclassmembers class androidx.compose.** { *; }

# Keep Android lifecycle classes
-keep class androidx.lifecycle.** { *; }
-keepclassmembers class androidx.lifecycle.** { *; }

# Keep Hilt-generated classes
-keep class dagger.hilt.** { *; }
-keep class **_Factory { *; }
-keep class **_HiltModules { *; }
-keep class **_Impl { *; }
-keep class **_Factory** { *; }
-keep class **_MembersInjector { *; }

# Keep Room database
-keep class androidx.room.** { *; }
-keep class * extends androidx.room.RoomDatabase { *; }
-keepclassmembers class * extends androidx.room.RoomDatabase { public *; }

# Keep DataStore
-keep class androidx.datastore.** { *; }
-keepclassmembers class androidx.datastore.** { *; }

# Keep Retrofit
-keep class retrofit2.** { *; }
-keepclassmembers class retrofit2.** { *; }
-keep interface retrofit2.** { *; }
-keepclassmembers class * implements retrofit2.Call { *; }

# Keep OkHttp
-keep class okhttp3.** { *; }
-keepclassmembers class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Keep kotlinx serialization
-keep class kotlinx.serialization.** { *; }
-keepclassmembers class kotlinx.serialization.** { *; }
-keep @kotlinx.serialization.Serializable class ** { *; }

# Keep coroutines
-keep class kotlinx.coroutines.** { *; }
-keepclassmembers class kotlinx.coroutines.** { *; }

# Keep logging
-keep class timber.log.** { *; }
-keepclassmembers class timber.log.** { *; }

# Keep Material Design
-keep class androidx.compose.material3.** { *; }
-keep class androidx.compose.material.** { *; }
-keepclassmembers class androidx.compose.material3.** { *; }
-keepclassmembers class androidx.compose.material.** { *; }

# Keep Glide/Image loading libraries
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep public class * extends com.bumptech.glide.module.AppGlideModule

# Remove logging calls
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
}

# Optimization rules
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*

# Keep native methods
-keepclassmembers class * {
    *** *(...) native;
}

# Keep resource files
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Keep enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep custom Application classes
-keep public class * extends android.app.Application {
    public static <fields>;
    public <methods>;
}

# Keep activity/fragment/service/provider classes
-keep public class * extends android.app.Activity { *; }
-keep public class * extends android.app.Fragment { *; }
-keep public class * extends androidx.fragment.app.Fragment { *; }
-keep public class * extends android.app.Service { *; }
-keep public class * extends android.content.ContentProvider { *; }
-keep public class * extends android.content.BroadcastReceiver { *; }

# Keep view constructors needed for inflation
-keepclassmembers class * extends android.view.View {
    public <init>(android.content.Context, android.util.AttributeSet);
}

# Keep Parcelable
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Preserve line numbers for stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep all annotations
-keepattributes *Annotation*
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod
-keepattributes Signature

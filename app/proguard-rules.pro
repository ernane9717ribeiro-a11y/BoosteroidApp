# Keep WebAppInterface methods (called from JavaScript)
-keepclassmembers class com.boosteroid.app.MainActivity$WebAppInterface {
    @android.webkit.JavascriptInterface <methods>;
}

package com.boosteroid.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;

import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewCompat;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

public class MainActivity extends AppCompatActivity {

    private static final String BOOSTEROID_URL = "https://cloud.boosteroid.com";
    private static final String PREFS_NAME     = "BoosteroidControllerPrefs";

    private WebView   mWebView;
    private ProgressBar mProgress;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Full screen / immersive
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        // Layout
        RelativeLayout root = new RelativeLayout(this);
        root.setBackgroundColor(Color.BLACK);

        mProgress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        mProgress.setMax(100);
        mProgress.setIndeterminate(false);
        RelativeLayout.LayoutParams pbParams = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT, 8);
        pbParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        root.addView(mProgress, pbParams);

        mWebView = new WebView(this);
        RelativeLayout.LayoutParams wvParams = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT);
        root.addView(mWebView, wvParams);

        setContentView(root);

        // WebView settings
        WebSettings ws = mWebView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setDatabaseEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);
        ws.setAllowFileAccess(true);             // needed for file:///android_asset SVGs
        ws.setAllowContentAccess(true);
        ws.setSupportZoom(false);
        ws.setDisplayZoomControls(false);
        ws.setBuiltInZoomControls(false);
        // Spoof a desktop Chrome UA so Boosteroid serves its full experience
        ws.setUserAgentString(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                "AppleWebKit/537.36 (KHTML, like Gecko) " +
                "Chrome/124.0.0.0 Safari/537.36"
        );

        // JavaScript bridge
        mWebView.addJavascriptInterface(new WebAppInterface(), "Android");

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                mProgress.setProgress(newProgress);
                mProgress.setVisibility(newProgress < 100 ? View.VISIBLE : View.GONE);
            }
        });

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Stay inside the WebView for Boosteroid URLs
                String url = request.getUrl().toString();
                if (url.contains("boosteroid.com")) {
                    view.loadUrl(url);
                    return true;
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (url != null && url.contains("boosteroid.com")) {
                    injectController(view);
                }
            }
        });

        mWebView.loadUrl(BOOSTEROID_URL);

        // Hide system UI (immersive sticky)
        hideSystemUI();
    }

    /**
     * Loads script.js and bridge.js from assets and injects them into the page.
     */
    private void injectController(WebView view) {
        String scriptJs = readAsset("script.js");
        String bridgeJs = readAsset("bridge.js");

        if (scriptJs == null || bridgeJs == null) return;

        // Escape for JS string injection (wrap in IIFE via evaluateJavascript)
        // We inject script.js first (defines main()), then bridge.js which triggers startConfig.
        String combined = "(function(){" + scriptJs + "\nmain();\n" + bridgeJs + "})();";
        view.evaluateJavascript(combined, null);
    }

    private String readAsset(String filename) {
        try {
            InputStream is = getAssets().open(filename);
            BufferedReader br = new BufferedReader(new InputStreamReader(is));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line).append('\n');
            }
            return sb.toString();
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public void onBackPressed() {
        if (mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        mWebView.onResume();
        hideSystemUI();
    }

    @Override
    protected void onPause() {
        mWebView.onPause();
        super.onPause();
    }

    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }

    // ── JavaScript Interface ──────────────────────────────────────────────────

    class WebAppInterface {

        /** Returns current config JSON to bridge.js */
        @JavascriptInterface
        public String getConfig() {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            JSONObject obj = new JSONObject();
            try {
                obj.put("stickRadius",              prefs.getInt("stickRadius", 40));
                obj.put("buttonDiameter",           prefs.getInt("buttonDiameter", 50));
                obj.put("buttonBorderLeftOffset",   prefs.getInt("buttonBorderLeftOffset", 1));
                obj.put("buttonBorderRightOffset",  prefs.getInt("buttonBorderRightOffset", 1));
                obj.put("buttonBorderTopOffset",    prefs.getInt("buttonBorderTopOffset", 1));
                obj.put("buttonBorderBottomOffset", prefs.getInt("buttonBorderBottomOffset", 1));
                obj.put("opacity",                  prefs.getInt("opacity", 180));
                obj.put("enableColors",             prefs.getBoolean("enableColors", true));
                obj.put("enableDrawSticks",         prefs.getBoolean("enableDrawSticks", true));
                obj.put("disableTouchController",   prefs.getBoolean("disableTouchController", false));
                obj.put("enableGlow",               prefs.getBoolean("enableGlow", false));
                obj.put("fixedSticks",              prefs.getBoolean("fixedSticks", false));
                obj.put("fixedSticksOpacity",       prefs.getInt("fixedSticksOpacity", 80));
                obj.put("leftStickSensitivity",     prefs.getFloat("leftStickSensitivity", 1.0f));
                obj.put("rightStickSensitivity",    prefs.getFloat("rightStickSensitivity", 1.0f));
                obj.put("rightStickDeadzone",       prefs.getFloat("rightStickDeadzone", 0.05f));
            } catch (Exception e) {
                e.printStackTrace();
            }
            return obj.toString();
        }

        /** Saves partial config JSON from bridge.js/configUpdate events */
        @JavascriptInterface
        public void saveConfig(String json) {
            try {
                JSONObject obj = new JSONObject(json);
                SharedPreferences.Editor ed = getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit();
                if (obj.has("stickRadius"))              ed.putInt("stickRadius",              obj.getInt("stickRadius"));
                if (obj.has("buttonDiameter"))           ed.putInt("buttonDiameter",           obj.getInt("buttonDiameter"));
                if (obj.has("buttonBorderLeftOffset"))   ed.putInt("buttonBorderLeftOffset",   obj.getInt("buttonBorderLeftOffset"));
                if (obj.has("buttonBorderRightOffset"))  ed.putInt("buttonBorderRightOffset",  obj.getInt("buttonBorderRightOffset"));
                if (obj.has("buttonBorderTopOffset"))    ed.putInt("buttonBorderTopOffset",    obj.getInt("buttonBorderTopOffset"));
                if (obj.has("buttonBorderBottomOffset")) ed.putInt("buttonBorderBottomOffset", obj.getInt("buttonBorderBottomOffset"));
                if (obj.has("opacity"))                  ed.putInt("opacity",                  obj.getInt("opacity"));
                if (obj.has("enableColors"))             ed.putBoolean("enableColors",         obj.getBoolean("enableColors"));
                if (obj.has("enableDrawSticks"))         ed.putBoolean("enableDrawSticks",     obj.getBoolean("enableDrawSticks"));
                if (obj.has("disableTouchController"))   ed.putBoolean("disableTouchController", obj.getBoolean("disableTouchController"));
                if (obj.has("enableGlow"))               ed.putBoolean("enableGlow",           obj.getBoolean("enableGlow"));
                if (obj.has("fixedSticks"))              ed.putBoolean("fixedSticks",          obj.getBoolean("fixedSticks"));
                if (obj.has("fixedSticksOpacity"))       ed.putInt("fixedSticksOpacity",       obj.getInt("fixedSticksOpacity"));
                if (obj.has("leftStickSensitivity"))     ed.putFloat("leftStickSensitivity",   (float) obj.getDouble("leftStickSensitivity"));
                if (obj.has("rightStickSensitivity"))    ed.putFloat("rightStickSensitivity",  (float) obj.getDouble("rightStickSensitivity"));
                if (obj.has("rightStickDeadzone"))       ed.putFloat("rightStickDeadzone",     (float) obj.getDouble("rightStickDeadzone"));
                ed.apply();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}

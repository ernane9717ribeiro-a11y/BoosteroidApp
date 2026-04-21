package com.boosteroid.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

public class MainActivity extends AppCompatActivity {
    private static final String BOOSTEROID_URL = "https://cloud.boosteroid.com";
    private static final String PREFS_NAME = "BoosteroidControllerPrefs";
    private WebView mWebView;

    @SuppressLint({"SetJavaScriptEnabled","AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        mWebView = new WebView(this);
        setContentView(mWebView);
        WebSettings ws = mWebView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setDatabaseEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);
        ws.setAllowFileAccess(true);
        ws.setAllowContentAccess(true);
        ws.setSupportZoom(false);
        ws.setJavaScriptCanOpenWindowsAutomatically(true);
        ws.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        ws.setCacheMode(WebSettings.LOAD_DEFAULT);
        // UA idêntico ao Chrome Mobile para passar no Cloudflare
        ws.setUserAgentString("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36");
        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(mWebView, true);
        mWebView.addJavascriptInterface(new WebAppInterface(), "Android");
        mWebView.setWebChromeClient(new WebChromeClient());
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.contains("boosteroid.com")) {
                    view.loadUrl(url);
                    return true;
                }
                // Links externos abre no Chrome
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                return true;
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (url != null && (url.contains("/stream") || url.contains("/game"))) {
                    injectController(view);
                }
            }
        });
        mWebView.loadUrl(BOOSTEROID_URL);
        hideSystemUI();
    }

    private void injectController(WebView view) {
        String scriptJs = readAsset("script.js");
        String bridgeJs = readAsset("bridge.js");
        if (scriptJs == null || bridgeJs == null) return;
        String combined = "(function(){" + scriptJs + "\nmain();\n" + bridgeJs + "})();";
        view.evaluateJavascript(combined, null);
    }

    private String readAsset(String filename) {
        try {
            InputStream is = getAssets().open(filename);
            BufferedReader br = new BufferedReader(new InputStreamReader(is));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line).append('\n');
            return sb.toString();
        } catch (IOException e) { return null; }
    }

    @Override public void onBackPressed() { if (mWebView.canGoBack()) mWebView.goBack(); else super.onBackPressed(); }
    @Override protected void onResume() { super.onResume(); mWebView.onResume(); hideSystemUI(); }
    @Override protected void onPause() { mWebView.onPause(); super.onPause(); }

    private void hideSystemUI() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_FULLSCREEN);
    }

    class WebAppInterface {
        @JavascriptInterface
        public String getConfig() {
            android.content.SharedPreferences p = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            JSONObject o = new JSONObject();
            try {
                o.put("stickRadius", p.getInt("stickRadius",40));
                o.put("buttonDiameter", p.getInt("buttonDiameter",50));
                o.put("buttonBorderLeftOffset", p.getInt("buttonBorderLeftOffset",1));
                o.put("buttonBorderRightOffset", p.getInt("buttonBorderRightOffset",1));
                o.put("buttonBorderTopOffset", p.getInt("buttonBorderTopOffset",1));
                o.put("buttonBorderBottomOffset", p.getInt("buttonBorderBottomOffset",1));
                o.put("opacity", p.getInt("opacity",180));
                o.put("enableColors", p.getBoolean("enableColors",true));
                o.put("enableDrawSticks", p.getBoolean("enableDrawSticks",true));
                o.put("disableTouchController", p.getBoolean("disableTouchController",false));
                o.put("enableGlow", p.getBoolean("enableGlow",false));
                o.put("fixedSticks", p.getBoolean("fixedSticks",false));
                o.put("fixedSticksOpacity", p.getInt("fixedSticksOpacity",80));
                o.put("leftStickSensitivity", p.getFloat("leftStickSensitivity",1.0f));
                o.put("rightStickSensitivity", p.getFloat("rightStickSensitivity",1.0f));
                o.put("rightStickDeadzone", p.getFloat("rightStickDeadzone",0.05f));
            } catch(Exception e){}
            return o.toString();
        }
        @JavascriptInterface
        public void saveConfig(String json) {
            try {
                JSONObject o = new JSONObject(json);
                android.content.SharedPreferences.Editor ed = getSharedPreferences(PREFS_NAME,MODE_PRIVATE).edit();
                if(o.has("stickRadius")) ed.putInt("stickRadius",o.getInt("stickRadius"));
                if(o.has("buttonDiameter")) ed.putInt("buttonDiameter",o.getInt("buttonDiameter"));
                if(o.has("opacity")) ed.putInt("opacity",o.getInt("opacity"));
                if(o.has("enableColors")) ed.putBoolean("enableColors",o.getBoolean("enableColors"));
                if(o.has("enableDrawSticks")) ed.putBoolean("enableDrawSticks",o.getBoolean("enableDrawSticks"));
                if(o.has("fixedSticks")) ed.putBoolean("fixedSticks",o.getBoolean("fixedSticks"));
                if(o.has("leftStickSensitivity")) ed.putFloat("leftStickSensitivity",(float)o.getDouble("leftStickSensitivity"));
                if(o.has("rightStickSensitivity")) ed.putFloat("rightStickSensitivity",(float)o.getDouble("rightStickSensitivity"));
                ed.apply();
            } catch(Exception e){}
        }
    }
}

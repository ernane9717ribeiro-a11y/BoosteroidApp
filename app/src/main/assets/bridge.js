/**
 * Boosteroid WebView Controller Bridge
 * Adapts the extension's script.js to run inside an Android WebView.
 * Called by MainActivity via evaluateJavascript() after page load.
 */
(function () {
    'use strict';

    // Default config — mirrors extension defaults.
    // Android.getConfig() is injected by the Java WebAppInterface.
    var cfg;
    try {
        cfg = JSON.parse(Android.getConfig());
    } catch (e) {
        cfg = {};
    }

    var config = {
        stickRadius:              cfg.stickRadius              !== undefined ? cfg.stickRadius              : 40,
        buttonDiameter:           cfg.buttonDiameter           !== undefined ? cfg.buttonDiameter           : 50,
        buttonBorderLeftOffset:   cfg.buttonBorderLeftOffset   !== undefined ? cfg.buttonBorderLeftOffset   : 1,
        buttonBorderRightOffset:  cfg.buttonBorderRightOffset  !== undefined ? cfg.buttonBorderRightOffset  : 1,
        buttonBorderTopOffset:    cfg.buttonBorderTopOffset    !== undefined ? cfg.buttonBorderTopOffset    : 1,
        buttonBorderBottomOffset: cfg.buttonBorderBottomOffset !== undefined ? cfg.buttonBorderBottomOffset : 1,
        opacity:                  cfg.opacity                  !== undefined ? cfg.opacity                  : 180,
        enableColors:             cfg.enableColors             !== undefined ? cfg.enableColors             : true,
        enableDrawSticks:         cfg.enableDrawSticks         !== undefined ? cfg.enableDrawSticks         : true,
        disableTouchController:   cfg.disableTouchController   !== undefined ? cfg.disableTouchController   : false,
        enableGlow:               cfg.enableGlow               !== undefined ? cfg.enableGlow               : false,
        fixedSticks:              cfg.fixedSticks              !== undefined ? cfg.fixedSticks              : false,
        fixedSticksOpacity:       cfg.fixedSticksOpacity       !== undefined ? cfg.fixedSticksOpacity       : 80,
        leftStickSensitivity:     cfg.leftStickSensitivity     !== undefined ? cfg.leftStickSensitivity     : 1.0,
        rightStickSensitivity:    cfg.rightStickSensitivity    !== undefined ? cfg.rightStickSensitivity    : 1.0,
        rightStickDeadzone:       cfg.rightStickDeadzone       !== undefined ? cfg.rightStickDeadzone       : 0.05,
        buttonConfig:             cfg.buttonConfig             || null,
        buttonOverrides:          cfg.buttonOverrides          || {},
        // SVGs served from Android assets via WebView's file:// bridge
        url:                      'file:///android_asset/controls'
    };

    // Persist config changes back to Android SharedPreferences
    function saveConfig(partial) {
        try {
            Android.saveConfig(JSON.stringify(partial));
        } catch (e) {}
    }

    // Anti-AFK for Boosteroid (no SessionHandler available in WebView usually,
    // so we dispatch synthetic keyboard events as fallback)
    function startAntiAFK() {
        setInterval(function () {
            var ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ScrollLock', code: 'ScrollLock' });
            (document.querySelector('video') || document.body).dispatchEvent(ev);
            setTimeout(function () {
                var ev2 = new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'ScrollLock', code: 'ScrollLock' });
                (document.querySelector('video') || document.body).dispatchEvent(ev2);
            }, 80);
        }, 60 * 1000);
    }

    // Dismiss AFK modal
    setInterval(function () {
        var dialogs = document.querySelectorAll('[role="dialog"],.modal,[class*="dialog"],[class*="Dialog"],[class*="popup"],[class*="Popup"]');
        dialogs.forEach(function (d) {
            if (!d.offsetParent) return;
            var text = (d.textContent || '').toLowerCase();
            if (text.includes('still') || text.includes('continue') || text.includes('ainda') || text.includes('continuar') || text.includes('inactive') || text.includes('inativ')) {
                var btns = d.querySelectorAll('button');
                for (var i = 0; i < btns.length; i++) {
                    var t = (btns[i].textContent || '').toLowerCase().trim();
                    if (t.includes('continue') || t.includes('yes') || t.includes('ok') || t.includes('sim') || t.includes('continuar')) {
                        btns[i].click();
                        return;
                    }
                }
            }
        });
    }, 3000);

    // Fire the startConfig event that script.js listens for
    window.dispatchEvent(new CustomEvent('startConfig', { detail: config }));

    // Listen for config updates from in-page menu
    window.addEventListener('configUpdate', function (e) {
        saveConfig(e.detail || {});
    });

    startAntiAFK();
})();

// ---------- Anti-AFK reativo (clica popup quando aparece) ----------
// xCloud: popup "Are you still there?" com classe especifica.
// Boosteroid: nao tem popup (mata a sessao direto), o anti-AFK real
// roda em script.js via SessionHandler.sendEvents.
setInterval(() => {
    // xCloud
    const idleWarningScreen = document.querySelector('.IdleWarningScreen-module__container___1daBY');
    if (idleWarningScreen) {
        const btn = idleWarningScreen.querySelector('button');
        if (btn) btn.click();
    }

    // Boosteroid - tentativa generica de fechar qualquer modal de "ainda esta ai"
    // (nomes de classe do Boosteroid sao ofuscados e mudam, entao olhamos o texto).
    if (location.hostname.includes('boosteroid.com')) {
        const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="dialog"], [class*="Dialog"], [class*="popup"], [class*="Popup"]');
        dialogs.forEach((d) => {
            if (!d.offsetParent) return; // nao visivel
            const text = (d.textContent || '').toLowerCase();
            if (
                text.includes('still') ||
                text.includes('continue') ||
                text.includes('resume') ||
                text.includes('ainda') ||
                text.includes('continuar') ||
                text.includes('inactive') ||
                text.includes('inativ')
            ) {
                const btns = d.querySelectorAll('button');
                for (const b of btns) {
                    const t = (b.textContent || '').toLowerCase().trim();
                    if (
                        t.includes('continue') || t.includes('yes') ||
                        t.includes('resume') || t.includes('still') ||
                        t.includes('ok') || t.includes('sim') ||
                        t.includes('continuar')
                    ) {
                        b.click();
                        return;
                    }
                }
            }
        });
    }
}, 3000);

// ---------- Injeta o script principal no mundo da pagina ----------
var browser = (typeof browser === "undefined") ? chrome : browser;

var s = document.createElement('script');
s.src = browser.runtime.getURL('js/script.js');
s.onload = () => {
    browser.storage.sync.get([
        "stickRadius",
        "buttonDiameter",
        "buttonBorderLeftOffset",
        "buttonBorderRightOffset",
        "buttonBorderTopOffset",
        "buttonBorderBottomOffset",
        "opacity",
        "enableColors",
        "enableDrawSticks",
        "disableTouchController",
        "buttonConfig",
        "leftStickSensitivity",
        "rightStickSensitivity",
        "rightStickDeadzone",
        "enableGlow",
        "fixedSticks",
        "fixedSticksOpacity",
        "buttonOverrides"
    ], (settings) => {
        settings.url = browser.runtime.getURL("img/controls");
        window.dispatchEvent(new CustomEvent("startConfig", { detail: settings }));
    });

    window.addEventListener("newButtonConfig", (e) => {
        const buttons = e.detail;
        chrome.storage.sync.set({ "buttonConfig": buttons });
    });

    // Novo: atualizacoes vindas do menu in-page sao persistidas em tempo real.
    window.addEventListener("configUpdate", (e) => {
        chrome.storage.sync.set(e.detail || {});
    });

    s.remove();
};
(document.head || document.documentElement).appendChild(s);

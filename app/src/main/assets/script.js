const main = () => {
    let config = null;

    const hostname = window.location.hostname;
    const PLATFORM = {
        isXCloud: hostname.includes('xbox.com'),
        isBoosteroid: hostname.includes('boosteroid.com'),
        isGamepadTester: hostname.includes('greggman.github.io'),
    };

    const Z_TOP = 2147483647;
    const Z_CANVAS = 2147483646;

    const getStreamFocusTarget = () => (
        document.getElementById("game-stream") ||
        document.querySelector("video") ||
        document.body
    );

    const hasSessionHandler = () => {
        try {
            return typeof SessionHandler !== 'undefined' && SessionHandler && typeof SessionHandler.sendEvents === 'function';
        } catch (e) { return false; }
    };

    let lastUserInputAt = Date.now();
    const markUserActive = () => { lastUserInputAt = Date.now(); };
    ['mousedown','mousemove','keydown','touchstart','touchmove','wheel']
        .forEach(ev => window.addEventListener(ev, markUserActive, { capture: true, passive: true }));

    const sendBoosteroidKey = (code, isPressed) => {
        if (!hasSessionHandler()) return false;
        try { SessionHandler.sendEvents({ type: "keyboard", action: "button", isPressed, code }); return true; }
        catch (e) { return false; }
    };

    const startBoosteroidAntiAFK = () => {
        if (!PLATFORM.isBoosteroid) return;
        setInterval(() => {
            if (!hasSessionHandler()) return;
            if (Date.now() - lastUserInputAt < 3 * 60 * 1000) return;
            sendBoosteroidKey(145, true);
            setTimeout(() => sendBoosteroidKey(145, false), 80);
        }, 60 * 1000);
    };

    const pushConfig = (partial) => {
        window.dispatchEvent(new CustomEvent("configUpdate", { detail: partial }));
    };

    window.addEventListener("startConfig", (e) => {
        config = e.detail;
        if (typeof config.leftStickSensitivity !== 'number') config.leftStickSensitivity = 1.0;
        if (typeof config.rightStickSensitivity !== 'number') config.rightStickSensitivity = 1.0;
        if (typeof config.rightStickDeadzone !== 'number') config.rightStickDeadzone = 0.05;
        if (typeof config.enableGlow !== 'boolean') config.enableGlow = false;
        if (typeof config.fixedSticks !== 'boolean') config.fixedSticks = false;
        if (typeof config.fixedSticksOpacity !== 'number') config.fixedSticksOpacity = 80;
        if (!config.buttonOverrides) config.buttonOverrides = {};
        setup();
        startBoosteroidAntiAFK();
    });

    const setup = () => {
        const root = document.createElement("div");
        root.id = "ctrl-overlay-root";
        root.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${Z_TOP};touch-action:none;user-select:none;-webkit-user-select:none;`;

        const touchLayer = document.createElement("div");
        touchLayer.style.cssText = `position:absolute;inset:0;pointer-events:none;display:none;`;

        const canvasElem = document.createElement("canvas");
        const canvasCtx = canvasElem.getContext("2d");
        canvasElem.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;touch-action:none;pointer-events:auto;z-index:${Z_CANVAS};`;
        canvasElem.width = window.innerWidth;
        canvasElem.height = window.innerHeight;

        // Canvas para analógicos fixos
        const fixedCanvas = document.createElement("canvas");
        const fixedCtx = fixedCanvas.getContext("2d");
        fixedCanvas.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:${Z_CANVAS - 1};`;
        fixedCanvas.width = window.innerWidth;
        fixedCanvas.height = window.innerHeight;

        // Botões de controle da UI — estilo discreto
        const uiBtnCss = `box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:40px;height:40px;position:fixed;border-radius:20px;cursor:pointer;background:rgba(0,0,0,0.35);color:#fff;fill:#fff;border:1px solid rgba(255,255,255,0.15);font-family:Segoe UI,Arial,sans-serif;z-index:${Z_TOP};pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;backdrop-filter:blur(4px);`;

        const disableButton = document.createElement('button');
        disableButton.id = "disableController";
        disableButton.style.cssText = uiBtnCss + "top:0.5rem;left:calc(50% - 66px);";
        disableButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" width="16" height="16" style="fill:currentColor;"><path d="M1791 1538q35 0 64.5-17.5t46.5-47t17-63.5v-768q0-53-37.5-90.5t-90.5-37.5h-1536q-53 0-90.5 37.5t-37.5 90.5v768q0 34 17 63.5t46.5 47t64.5 17.5h1536zM255 642h1536v768h-1536v-768zM702 770h-128v187h-191v128h191v197h128v-197h193v-128h-193v-187zM1279 804.5q-59 34.5-93.5 93t-34.5 128.5q0 69 34.5 128t93.5 93.5t128 34.5t128-34.5t93.5-93.5t34.5-128q0-70-34.5-128.5t-93.5-93t-128-34.5t-128 34.5zM1279 1026q0-55 38-91q37-37 90-37q52 0 91 37q37 37 37 91q0 53-37 90q-40 38-91 38q-52 0-90-38q-38-36-38-90z"/></svg>`;

        const menuButton = document.createElement('button');
        menuButton.id = "ctrlMenuButton";
        menuButton.style.cssText = uiBtnCss + "top:0.5rem;left:calc(50% - 20px);";
        menuButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84a.48.48 0 00-.48.41L8.64 5.35c-.59.24-1.13.57-1.62.94l-2.39-.96a.484.484 0 00-.59.22L2.12 8.87a.48.48 0 00.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 018.4 12a3.6 3.6 0 117.2 0 3.6 3.6 0 01-3.6 3.6z"/></svg>`;

        const layoutToggleBtn = document.createElement('button');
        layoutToggleBtn.id = "ctrlLayoutBtn";
        layoutToggleBtn.style.cssText = uiBtnCss + "top:0.5rem;left:calc(50% + 26px);";
        layoutToggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>`;

        let layoutMode = false;
        let selectedButtonIndex = -1;

        const stickLColor = "#82b4ff";
        let stickLActive = false, stickLStartX = 0, stickLStartY = 0, stickLEndX = 0, stickLEndY = 0, stickLDeltaX = 0, stickLDeltaY = 0;
        const stickRColor = "#ff8a82";
        let stickRActive = false, stickRStartX = 0, stickRStartY = 0, stickREndX = 0, stickREndY = 0, stickRDeltaX = 0, stickRDeltaY = 0;
        const startTime = Date.now();
        let stickLTouchId = null, stickRTouchId = null;

        const emulatedGamepad = {
            id: "Xbox 360 Gamepad", index: 0, connected: true, timestamp: 0, mapping: "standard",
            axes: [0, 0, 0, 0],
            buttons: [
                { label:"A",  color:"#7dc242", locRight:config.buttonDiameter+config.buttonBorderRightOffset,       locBottom:config.buttonBorderBottomOffset,                              scale:1,   img:"A" },
                { label:"B",  color:"#ed1c24", locRight:config.buttonBorderRightOffset,                              locBottom:config.buttonDiameter+config.buttonBorderBottomOffset,      scale:1,   img:"B" },
                { label:"X",  color:"#24bcee", locRight:(config.buttonDiameter*2)+config.buttonBorderRightOffset,   locBottom:config.buttonDiameter+config.buttonBorderBottomOffset,      scale:1,   img:"X" },
                { label:"Y",  color:"#f0ea1b", locRight:config.buttonDiameter+config.buttonBorderRightOffset,       locBottom:(config.buttonDiameter*2)+config.buttonBorderBottomOffset,  scale:1,   img:"Y" },
                { label:"L1", color:"#636466", locLeft:`${config.buttonBorderLeftOffset}px`,                         locTop:(config.buttonDiameter*1.4)+config.buttonBorderTopOffset+"px", scale:2,   img:"L1" },
                { label:"R1", color:"#636466", locRight:0+config.buttonBorderRightOffset,                            locTop:(config.buttonDiameter*1.4)+config.buttonBorderTopOffset+"px", scale:2,   img:"R1" },
                { label:"L2", color:"#636466", locLeft:config.buttonBorderLeftOffset+"px",                           locTop:config.buttonBorderTopOffset+"px",                            scale:2,   img:"L2" },
                { label:"R2", color:"#636466", locRight:config.buttonBorderRightOffset,                              locTop:config.buttonBorderTopOffset+"px",                            scale:2,   img:"R2" },
                { label:"Se", color:"#636466", locLeft:(config.buttonDiameter*5)+config.buttonBorderLeftOffset+"px", locTop:(config.buttonDiameter*1.1)+config.buttonBorderTopOffset+"px", scale:1.2, img:"select" },
                { label:"St", color:"#636466", locRight:(config.buttonDiameter*5)+config.buttonBorderRightOffset,    locTop:(config.buttonDiameter*1.1)+config.buttonBorderTopOffset+"px", scale:1.2, img:"start" },
                { label:"L3", color:"#7a24ee", locLeft:(config.buttonDiameter*5)+config.buttonBorderLeftOffset+"px", locBottom:0+config.buttonBorderBottomOffset,                         scale:1,   img:"L3" },
                { label:"R3", color:"#7a24ee", locRight:(config.buttonDiameter*5)+config.buttonBorderRightOffset,    locBottom:config.buttonBorderBottomOffset,                           scale:1,   img:"R3" },
                { label:"\u21E7", color:"#636466", locLeft:config.buttonDiameter+config.buttonBorderLeftOffset+"px", locBottom:(config.buttonDiameter*2)+config.buttonBorderBottomOffset, scale:1,   img:"up" },
                { label:"\u21E9", color:"#636466", locLeft:config.buttonDiameter+config.buttonBorderLeftOffset+"px", locBottom:0+config.buttonBorderBottomOffset,                         scale:1,   img:"down" },
                { label:"\u21E6", color:"#636466", locLeft:config.buttonBorderLeftOffset+"px",                       locBottom:config.buttonDiameter+config.buttonBorderBottomOffset,     scale:1,   img:"left" },
                { label:"\u21E8", color:"#636466", locLeft:(config.buttonDiameter*2)+config.buttonBorderLeftOffset+"px", locBottom:config.buttonDiameter+config.buttonBorderBottomOffset, scale:1,   img:"right" },
                { label:"H",  color:"#ed591c", locLeft:`calc(50% - ${config.buttonDiameter/2}px)`, locBottom:config.buttonBorderBottomOffset, scale:1, img:"home" }
            ]
        };

        if (typeof config.buttonConfig !== "undefined" && config.buttonConfig !== null)
            emulatedGamepad.buttons = config.buttonConfig.slice();
        if (!config.buttonOverrides) config.buttonOverrides = {};

        const getOv = (i) => config.buttonOverrides[i] || {};

        const applyButtonStyle = (button, index) => {
            const el = button.buttonElem;
            const ov = getOv(index);
            el.style.cssText = `position:fixed;z-index:${Z_TOP};pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-user-drag:none;-webkit-touch-callout:none;background:none;border:none;box-shadow:none;padding:0;margin:0;`;
            el.draggable = false;
            const scale = ov.scale !== undefined ? ov.scale : button.scale;
            const diameter = config.buttonDiameter;
            el.style.width = (diameter * scale) + "px";
            const opacity = ov.hidden ? 0 : (ov.opacity !== undefined ? ov.opacity : config.opacity);
            el.style.opacity = ((opacity / 255) * 100) + "%";
            el.style.filter = (config.enableColors && !button.pressed) ? "drop-shadow(0 0 0 " + button.color + ")" : "";
            if (layoutMode && selectedButtonIndex === index) {
                el.style.outline = "2px solid #29a30a";
                el.style.borderRadius = "50%";
            }
            el.style.left = ""; el.style.right = ""; el.style.top = ""; el.style.bottom = "";
            if (typeof button.locLeft   !== "undefined") el.style.left   = button.locLeft;
            if (typeof button.locRight  !== "undefined") el.style.right  = typeof button.locRight  === 'number' ? button.locRight  + "px" : button.locRight;
            if (typeof button.locTop    !== "undefined") el.style.top    = button.locTop;
            if (typeof button.locBottom !== "undefined") el.style.bottom = typeof button.locBottom === 'number' ? button.locBottom + "px" : button.locBottom;
        };

        emulatedGamepad.buttons.forEach((button, i) => {
            const buttonElem = document.createElement("img");
            buttonElem.src = `${config.url}/${button.img}.svg`;
            button.pressed = false; button.touched = false; button.value = 0;
            button.buttonElem = buttonElem;
            applyButtonStyle(button, i);
        });

        const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);

        // Posições padrão dos analógicos fixos (frações da tela)
        const getFixedPos = () => {
            const fp = config.fixedSticksPos || {};
            return {
                lx: (fp.lx !== undefined ? fp.lx : 0.18) * window.innerWidth,
                ly: (fp.ly !== undefined ? fp.ly : 0.75) * window.innerHeight,
                rx: (fp.rx !== undefined ? fp.rx : 0.65) * window.innerWidth,
                ry: (fp.ry !== undefined ? fp.ry : 0.75) * window.innerHeight,
            };
        };

        const drawFixedSticks = () => {
            fixedCtx.clearRect(0, 0, fixedCanvas.width, fixedCanvas.height);
            if (!config.fixedSticks) return;
            const pos = getFixedPos();
            const alpha = (config.fixedSticksOpacity || 80) / 255;
            const r = config.stickRadius || 40;
            const draw = (cx, cy, color, deltaX, deltaY, isActive) => {
                // Círculo externo (área)
                fixedCtx.globalAlpha = alpha * 0.35;
                fixedCtx.fillStyle = "#fff";
                fixedCtx.beginPath();
                fixedCtx.arc(cx, cy, r, 0, 2*Math.PI);
                fixedCtx.fill();
                fixedCtx.globalAlpha = alpha * 0.7;
                fixedCtx.strokeStyle = color;
                fixedCtx.lineWidth = 2;
                fixedCtx.beginPath();
                fixedCtx.arc(cx, cy, r, 0, 2*Math.PI);
                fixedCtx.stroke();
                // Thumbstick (bolinha) — move com o delta quando ativo
                const thumbX = isActive ? cx + deltaX : cx;
                const thumbY = isActive ? cy + deltaY : cy;
                const thumbAlpha = isActive ? alpha * 0.9 : alpha * 0.55;
                fixedCtx.globalAlpha = thumbAlpha;
                fixedCtx.fillStyle = color;
                fixedCtx.beginPath();
                fixedCtx.arc(thumbX, thumbY, r * 0.42, 0, 2*Math.PI);
                fixedCtx.fill();
                // Brilho extra quando ativo
                if (isActive) {
                    fixedCtx.globalAlpha = alpha * 0.3;
                    fixedCtx.fillStyle = color;
                    fixedCtx.beginPath();
                    fixedCtx.arc(thumbX, thumbY, r * 0.55, 0, 2*Math.PI);
                    fixedCtx.fill();
                }
            };
            draw(pos.lx, pos.ly, stickLColor, stickLDeltaX, stickLDeltaY, stickLActive);
            draw(pos.rx, pos.ry, stickRColor, stickRDeltaX, stickRDeltaY, stickRActive);
            fixedCtx.globalAlpha = 1;
        };

        const applyStickPosition = (side, startX, startY, endX, endY) => {
            const angle = Math.atan2(startY - endY, startX - endX) + Math.PI;
            let distance = Math.hypot(startX - endX, startY - endY);
            if (distance > config.stickRadius) distance = config.stickRadius;
            const dx = distance * Math.cos(angle);
            const dy = distance * Math.sin(angle);
            if (side === 'R') {
                stickRDeltaX = dx; stickRDeltaY = dy;
                const mul = config.rightStickSensitivity || 1.0;
                const dz = config.rightStickDeadzone || 0.0;
                let axX = clamp(dx / config.stickRadius * mul, -1, 1);
                let axY = clamp(dy / config.stickRadius * mul, -1, 1);
                if (Math.abs(axX) < dz) axX = 0;
                if (Math.abs(axY) < dz) axY = 0;
                setAxis(2, axX); setAxis(3, axY);
            } else {
                stickLDeltaX = dx; stickLDeltaY = dy;
                const mul = config.leftStickSensitivity || 1.0;
                setAxis(0, clamp(dx / config.stickRadius * mul, -1, 1));
                setAxis(1, clamp(dy / config.stickRadius * mul, -1, 1));
            }
        };

        const getFixedStickSide = (touch) => {
            if (!config.fixedSticks) return null;
            const pos = getFixedPos();
            const r = config.stickRadius * 1.6;
            const tx = touch.clientX, ty = touch.clientY;
            if (Math.hypot(tx - pos.lx, ty - pos.ly) <= r) return 'L';
            if (Math.hypot(tx - pos.rx, ty - pos.ry) <= r) return 'R';
            return null;
        };

        const handleStickTouch = (e, type) => {
            if (type === 0) {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    if (t.target !== canvasElem) continue;
                    let side;
                    if (config.fixedSticks) {
                        side = getFixedStickSide(t);
                        if (!side) continue;
                    } else {
                        side = t.clientX > window.innerWidth / 2 ? 'R' : 'L';
                    }
                    if (side === 'R' && stickRTouchId === null) {
                        stickRTouchId = t.identifier; stickRActive = true;
                        if (config.fixedSticks) { const p = getFixedPos(); stickRStartX = p.rx; stickRStartY = p.ry; }
                        else { stickRStartX = t.clientX; stickRStartY = t.clientY; }
                        stickREndX = t.clientX; stickREndY = t.clientY;
                        applyStickPosition('R', stickRStartX, stickRStartY, stickREndX, stickREndY);
                    } else if (side === 'L' && stickLTouchId === null) {
                        stickLTouchId = t.identifier; stickLActive = true;
                        if (config.fixedSticks) { const p = getFixedPos(); stickLStartX = p.lx; stickLStartY = p.ly; }
                        else { stickLStartX = t.clientX; stickLStartY = t.clientY; }
                        stickLEndX = t.clientX; stickLEndY = t.clientY;
                        applyStickPosition('L', stickLStartX, stickLStartY, stickLEndX, stickLEndY);
                    }
                }
            } else if (type === 1) {
                for (let i = 0; i < e.touches.length; i++) {
                    const t = e.touches[i];
                    if (t.identifier === stickRTouchId) { stickREndX = t.clientX; stickREndY = t.clientY; applyStickPosition('R', stickRStartX, stickRStartY, stickREndX, stickREndY); }
                    else if (t.identifier === stickLTouchId) { stickLEndX = t.clientX; stickLEndY = t.clientY; applyStickPosition('L', stickLStartX, stickLStartY, stickLEndX, stickLEndY); }
                }
            } else {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    if (t.identifier === stickRTouchId) { stickRTouchId = null; stickRActive = false; stickRStartX = stickRStartY = stickREndX = stickREndY = stickRDeltaX = stickRDeltaY = 0; setAxis(2,0); setAxis(3,0); }
                    else if (t.identifier === stickLTouchId) { stickLTouchId = null; stickLActive = false; stickLStartX = stickLStartY = stickLEndX = stickLEndY = stickLDeltaX = stickLDeltaY = 0; setAxis(0,0); setAxis(1,0); }
                }
            }
        };

        let drawScheduled = false;
        const scheduleDraw = () => {
            if (drawScheduled) return;
            drawScheduled = true;
            requestAnimationFrame(() => {
                drawScheduled = false;
                if (config.enableDrawSticks) drawSticks();
                if (config.fixedSticks) drawFixedSticks();
            });
        };

        const drawSticks = () => {
            canvasCtx.clearRect(0, 0, canvasElem.width, canvasElem.height);
            const opacityHex = config.opacity.toString(16).padStart(2, '0');
            if (stickLActive) {
                canvasCtx.fillStyle = "#cccccc" + opacityHex;
                canvasCtx.beginPath(); canvasCtx.arc(stickLStartX, stickLStartY, config.stickRadius, 0, 2*Math.PI); canvasCtx.fill();
                canvasCtx.fillStyle = stickLColor + opacityHex;
                canvasCtx.beginPath(); canvasCtx.arc(stickLStartX+stickLDeltaX, stickLStartY+stickLDeltaY, config.stickRadius/2, 0, 2*Math.PI); canvasCtx.fill();
            }
            if (stickRActive) {
                canvasCtx.fillStyle = "#cccccc" + opacityHex;
                canvasCtx.beginPath(); canvasCtx.arc(stickRStartX, stickRStartY, config.stickRadius, 0, 2*Math.PI); canvasCtx.fill();
                canvasCtx.fillStyle = stickRColor + opacityHex;
                canvasCtx.beginPath(); canvasCtx.arc(stickRStartX+stickRDeltaX, stickRStartY+stickRDeltaY, config.stickRadius/2, 0, 2*Math.PI); canvasCtx.fill();
            }
        };

        const pressButton = (buttonID, isPressed) => {
            const b = emulatedGamepad.buttons[buttonID];
            b.pressed = isPressed; b.touched = isPressed; b.value = isPressed ? 1 : 0;
            if (isPressed) {
                b.buttonElem.style.filter = "brightness(1.5)";
                if (config.enableGlow) b.buttonElem.style.filter += " drop-shadow(0 0 6px " + b.color + ")";
                if (config.enableColors) b.buttonElem.style.filter += " drop-shadow(0 0 0 " + b.color + ")";
            } else {
                b.buttonElem.style.filter = "";
            }
            emulatedGamepad.timestamp = Date.now() - startTime;
        };

        const setAxis = (axis, value) => { emulatedGamepad.axes[axis] = value; emulatedGamepad.timestamp = Date.now() - startTime; };

        const isInGameSession = () => {
            if (PLATFORM.isXCloud) return window.location.pathname.includes("/launch/") || window.location.pathname.includes("/html5-gamepad-test/");
            if (PLATFORM.isGamepadTester) return window.location.pathname.includes("/html5-gamepad-test/");
            if (PLATFORM.isBoosteroid) {
                if (hasSessionHandler()) return true;
                const video = document.querySelector('video');
                if (video && video.readyState >= 2 && !video.paused) return true;
                return false;
            }
            return false;
        };

        const refreshButtonSizes = () => { emulatedGamepad.buttons.forEach((b,i) => applyButtonStyle(b,i)); };
        const saveButtonOverrides = () => { pushConfig({ buttonOverrides: config.buttonOverrides }); };

        // ---------- Painel de edição individual ----------
        const btnEditPanel = document.createElement('div');
        btnEditPanel.style.cssText = `display:none;position:fixed;bottom:56px;left:50%;transform:translateX(-50%);background:#111d;border:1px solid #fff2;border-radius:10px;padding:10px 14px;font-family:Segoe UI,Arial,sans-serif;font-size:12px;color:#fff;z-index:${Z_TOP};pointer-events:auto;backdrop-filter:blur(6px);min-width:230px;max-width:85vw;touch-action:manipulation;`;

        const updateBtnEditPanel = () => {
            if (selectedButtonIndex < 0) { btnEditPanel.style.display = 'none'; return; }
            const btn = emulatedGamepad.buttons[selectedButtonIndex];
            const ov = getOv(selectedButtonIndex);
            btnEditPanel.style.display = 'block';
            btnEditPanel.innerHTML = '';

            // Título
            const hd = document.createElement('div');
            hd.style.cssText = "font-weight:700;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;";
            hd.innerHTML = `<span style="color:#29a30a;">● </span><span style="flex:1;margin-left:4px;">Botão: ${btn.label}</span>`;
            const cx = document.createElement('span'); cx.textContent='✕'; cx.style.cssText="cursor:pointer;opacity:0.5;padding:0 4px;font-size:14px;";
            cx.onclick = () => { selectedButtonIndex = -1; updateBtnEditPanel(); refreshButtonSizes(); };
            hd.appendChild(cx); btnEditPanel.appendChild(hd);

            const mkPanelSlider = (label, min, max, step, val, onInput) => {
                const row = document.createElement('div'); row.style.cssText = "margin:7px 0;";
                const lbl = document.createElement('div'); lbl.style.cssText = "display:flex;justify-content:space-between;margin-bottom:3px;";
                const valSpan = document.createElement('span'); valSpan.style.color='#29a30a'; valSpan.textContent = typeof val === 'number' && !Number.isInteger(val) ? val.toFixed(1)+'×' : String(val);
                lbl.appendChild(document.createTextNode(label)); lbl.appendChild(valSpan);
                const sl = document.createElement('input'); sl.type='range'; sl.min=String(min); sl.max=String(max); sl.step=String(step); sl.value=String(val);
                sl.style.cssText = "width:100%;accent-color:#29a30a;";
                sl.oninput = () => { onInput(sl.value, valSpan); };
                row.appendChild(lbl); row.appendChild(sl); return row;
            };

            const curOp = ov.opacity !== undefined ? ov.opacity : config.opacity;
            btnEditPanel.appendChild(mkPanelSlider('Opacidade', 0, 255, 1, curOp, (v, sp) => {
                const n = parseInt(v);
                if (!config.buttonOverrides[selectedButtonIndex]) config.buttonOverrides[selectedButtonIndex] = {};
                config.buttonOverrides[selectedButtonIndex].opacity = n;
                sp.textContent = String(n);
                applyButtonStyle(emulatedGamepad.buttons[selectedButtonIndex], selectedButtonIndex);
                saveButtonOverrides();
            }));

            const curSc = ov.scale !== undefined ? ov.scale : btn.scale;
            btnEditPanel.appendChild(mkPanelSlider('Escala', 0.3, 4, 0.1, curSc, (v, sp) => {
                const n = parseFloat(v);
                if (!config.buttonOverrides[selectedButtonIndex]) config.buttonOverrides[selectedButtonIndex] = {};
                config.buttonOverrides[selectedButtonIndex].scale = n;
                sp.textContent = n.toFixed(1)+'×';
                applyButtonStyle(emulatedGamepad.buttons[selectedButtonIndex], selectedButtonIndex);
                saveButtonOverrides();
            }));

            const hideRow = document.createElement('label');
            hideRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-top:8px;cursor:pointer;font-size:11px;opacity:0.85;";
            const hideCb = document.createElement('input'); hideCb.type='checkbox'; hideCb.checked=!!ov.hidden;
            hideCb.style.cssText="width:15px;height:15px;accent-color:#e03030;";
            hideCb.onchange = () => {
                if (!config.buttonOverrides[selectedButtonIndex]) config.buttonOverrides[selectedButtonIndex] = {};
                config.buttonOverrides[selectedButtonIndex].hidden = hideCb.checked;
                applyButtonStyle(emulatedGamepad.buttons[selectedButtonIndex], selectedButtonIndex);
                saveButtonOverrides();
            };
            hideRow.appendChild(hideCb); hideRow.appendChild(document.createTextNode('Ocultar este botão'));
            btnEditPanel.appendChild(hideRow);

            const rstBtn = document.createElement('button');
            rstBtn.textContent = '↺ Resetar';
            rstBtn.style.cssText="margin-top:9px;width:100%;padding:5px;border-radius:6px;border:1px solid #fff2;background:transparent;color:#fff8;font-size:11px;cursor:pointer;";
            rstBtn.onclick = () => { delete config.buttonOverrides[selectedButtonIndex]; saveButtonOverrides(); updateBtnEditPanel(); applyButtonStyle(emulatedGamepad.buttons[selectedButtonIndex], selectedButtonIndex); };
            btnEditPanel.appendChild(rstBtn);
        };

        const layoutButton = (event, type, buttonID) => {
            let clientX, clientY;
            if (event.changedTouches && event.changedTouches.length) {
                const t = type === 2 ? event.changedTouches[0] : event.touches[0];
                clientX = t.clientX; clientY = t.clientY;
            } else { clientX = event.clientX; clientY = event.clientY; }
            const button = emulatedGamepad.buttons[buttonID];
            const el = button.buttonElem;
            const newX = clientX - (el.offsetWidth/2);
            const newY = clientY - (el.offsetHeight/2);
            el.style.left = newX+"px"; el.style.top = newY+"px"; el.style.right=""; el.style.bottom="";
            if (type === 2) {
                delete button.locRight; delete button.locBottom;
                button.locLeft = newX+"px"; button.locTop = newY+"px";
                const sentButtons = JSON.parse(JSON.stringify(emulatedGamepad.buttons));
                sentButtons.forEach(b => { delete b.buttonElem; delete b.pressed; delete b.touched; delete b.value; });
                window.dispatchEvent(new CustomEvent("newButtonConfig", { detail: sentButtons }));
            }
        };

        canvasElem.addEventListener("touchstart",(e)=>{ e.preventDefault(); handleStickTouch(e,0); scheduleDraw(); },{passive:false});
        canvasElem.addEventListener("touchmove", (e)=>{ e.preventDefault(); handleStickTouch(e,1); scheduleDraw(); },{passive:false});
        canvasElem.addEventListener("touchend",  (e)=>{ e.preventDefault(); handleStickTouch(e,2); scheduleDraw(); },{passive:false});
        canvasElem.addEventListener("touchcancel",(e)=>{ e.preventDefault(); handleStickTouch(e,2); scheduleDraw(); },{passive:false});

        // ---------- Drag dos analógicos fixos no modo editar ----------
        let fixedDragSide = null, fixedDragTouchId = null;

        const getFixedStickSideLayout = (touch) => {
            const pos = getFixedPos();
            const r = (config.stickRadius || 40) * 2.0;
            const tx = touch.clientX, ty = touch.clientY;
            if (Math.hypot(tx - pos.lx, ty - pos.ly) <= r) return 'L';
            if (Math.hypot(tx - pos.rx, ty - pos.ry) <= r) return 'R';
            return null;
        };

        const saveFixedSticksPos = () => {
            pushConfig({ fixedSticksPos: config.fixedSticksPos });
        };

        const drawFixedSticksEditMode = () => {
            drawFixedSticks();
            if (!config.fixedSticks) return;
            const pos = getFixedPos();
            const r = config.stickRadius || 40;
            // Destacar com borda verde no modo editar
            ['L','R'].forEach(side => {
                const cx = side === 'L' ? pos.lx : pos.rx;
                const cy = side === 'L' ? pos.ly : pos.ry;
                const isDragging = fixedDragSide === side;
                fixedCtx.globalAlpha = isDragging ? 0.95 : 0.6;
                fixedCtx.strokeStyle = '#29a30a';
                fixedCtx.lineWidth = isDragging ? 3 : 2;
                fixedCtx.setLineDash([5, 4]);
                fixedCtx.beginPath();
                fixedCtx.arc(cx, cy, r + 6, 0, 2*Math.PI);
                fixedCtx.stroke();
                fixedCtx.setLineDash([]);
                // Label L / R
                fixedCtx.globalAlpha = isDragging ? 1 : 0.7;
                fixedCtx.fillStyle = '#29a30a';
                fixedCtx.font = `bold ${Math.round(r * 0.45)}px Segoe UI, Arial, sans-serif`;
                fixedCtx.textAlign = 'center';
                fixedCtx.textBaseline = 'middle';
                fixedCtx.fillText(side, cx, cy - r - 14);
            });
            fixedCtx.globalAlpha = 1;
        };

        fixedCanvas.addEventListener("touchstart", (e) => {
            if (!layoutMode || !config.fixedSticks) return;
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const side = getFixedStickSideLayout(t);
                if (side && fixedDragSide === null) {
                    fixedDragSide = side;
                    fixedDragTouchId = t.identifier;
                    drawFixedSticksEditMode();
                    break;
                }
            }
        }, {passive:false});

        fixedCanvas.addEventListener("touchmove", (e) => {
            if (!layoutMode || fixedDragSide === null) return;
            e.preventDefault();
            for (let i = 0; i < e.touches.length; i++) {
                const t = e.touches[i];
                if (t.identifier !== fixedDragTouchId) continue;
                const fp = config.fixedSticksPos || {};
                const nx = t.clientX / window.innerWidth;
                const ny = t.clientY / window.innerHeight;
                if (fixedDragSide === 'L') { fp.lx = nx; fp.ly = ny; }
                else { fp.rx = nx; fp.ry = ny; }
                config.fixedSticksPos = fp;
                drawFixedSticksEditMode();
                break;
            }
        }, {passive:false});

        fixedCanvas.addEventListener("touchend", (e) => {
            if (!layoutMode || fixedDragSide === null) return;
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === fixedDragTouchId) {
                    fixedDragSide = null;
                    fixedDragTouchId = null;
                    saveFixedSticksPos();
                    drawFixedSticksEditMode();
                    break;
                }
            }
        }, {passive:false});

        // Mouse drag (desktop/teste)
        let fixedDragMouse = null;
        fixedCanvas.addEventListener("mousedown", (e) => {
            if (!layoutMode || !config.fixedSticks) return;
            const side = getFixedStickSideLayout(e);
            if (side) { fixedDragMouse = side; drawFixedSticksEditMode(); }
        });
        fixedCanvas.addEventListener("mousemove", (e) => {
            if (!layoutMode || !fixedDragMouse) return;
            const fp = config.fixedSticksPos || {};
            const nx = e.clientX / window.innerWidth;
            const ny = e.clientY / window.innerHeight;
            if (fixedDragMouse === 'L') { fp.lx = nx; fp.ly = ny; }
            else { fp.rx = nx; fp.ry = ny; }
            config.fixedSticksPos = fp;
            drawFixedSticksEditMode();
        });
        fixedCanvas.addEventListener("mouseup", () => {
            if (fixedDragMouse) { fixedDragMouse = null; saveFixedSticksPos(); drawFixedSticksEditMode(); }
        });

        const toggleLayoutMode = () => {
            layoutMode = !layoutMode;
            selectedButtonIndex = -1;
            updateBtnEditPanel();
            getStreamFocusTarget().focus();
            layoutToggleBtn.style.background = layoutMode ? "rgba(41,163,10,0.7)" : "rgba(0,0,0,0.35)";
            const eab = document.getElementById('ctrlEditActionBtn');
            if (eab) eab.textContent = layoutMode ? 'Sair do Editar' : 'Editar Layout';
            // Habilitar arrastar analógicos fixos no modo editar
            fixedCanvas.style.pointerEvents = (layoutMode && config.fixedSticks) ? "auto" : "none";
            if (layoutMode && config.fixedSticks) drawFixedSticksEditMode();
            else drawFixedSticks();
            refreshButtonSizes();
        };

        layoutToggleBtn.addEventListener("click",   (e)=>{ e.preventDefault(); toggleLayoutMode(); });
        layoutToggleBtn.addEventListener("touchend",(e)=>{ e.preventDefault(); toggleLayoutMode(); },{passive:false});

        const onDisableToggle = (e) => {
            e.preventDefault();
            config.disableTouchController = !config.disableTouchController;
            pushConfig({ disableTouchController: config.disableTouchController });
            updateVisibility();
        };
        disableButton.addEventListener("click", onDisableToggle);
        disableButton.addEventListener("touchend", onDisableToggle, {passive:false});

        // ---------- Menu ----------
        const menu = document.createElement('div');
        menu.id = "ctrlMenuPanel";
        menu.style.cssText = `position:fixed;top:54px;left:50%;transform:translateX(-50%);min-width:280px;max-width:90vw;max-height:80vh;overflow-y:auto;background:#111d;color:#fff;border:1px solid #fff3;border-radius:10px;padding:12px 14px;font-family:Segoe UI,Arial,sans-serif;font-size:12px;z-index:${Z_TOP};pointer-events:auto;backdrop-filter:blur(6px);touch-action:manipulation;user-select:none;-webkit-user-select:none;display:none;`;

        const mkRow = (label, input, valueSpan) => {
            const row = document.createElement('div'); row.style.cssText="margin:8px 0;display:flex;flex-direction:column;gap:3px;";
            const hd = document.createElement('div'); hd.style.cssText="display:flex;justify-content:space-between;align-items:center;";
            const l = document.createElement('span'); l.textContent=label; hd.appendChild(l);
            if (valueSpan) hd.appendChild(valueSpan); row.appendChild(hd); row.appendChild(input); return row;
        };
        const mkSlider = (min,max,step,value) => { const s=document.createElement('input'); s.type='range'; s.min=String(min); s.max=String(max); s.step=String(step); s.value=String(value); s.style.cssText="width:100%;accent-color:#29a30a;touch-action:manipulation;"; return s; };
        const mkVal = (txt) => { const v=document.createElement('span'); v.textContent=txt; v.style.cssText="opacity:.75;font-variant-numeric:tabular-nums;"; return v; };

        const rsVal=mkVal(config.rightStickSensitivity.toFixed(2)+"x"); const rs=mkSlider(0.1,3,0.05,config.rightStickSensitivity);
        rs.addEventListener('input',()=>{ const v=parseFloat(rs.value); config.rightStickSensitivity=v; rsVal.textContent=v.toFixed(2)+"x"; pushConfig({rightStickSensitivity:v}); });
        const lsVal=mkVal(config.leftStickSensitivity.toFixed(2)+"x"); const ls=mkSlider(0.1,3,0.05,config.leftStickSensitivity);
        ls.addEventListener('input',()=>{ const v=parseFloat(ls.value); config.leftStickSensitivity=v; lsVal.textContent=v.toFixed(2)+"x"; pushConfig({leftStickSensitivity:v}); });
        const srVal=mkVal(String(config.stickRadius)); const sr=mkSlider(15,80,1,config.stickRadius);
        sr.addEventListener('input',()=>{ const v=parseInt(sr.value); config.stickRadius=v; srVal.textContent=String(v); pushConfig({stickRadius:v}); drawFixedSticks(); });
        const bdVal=mkVal(String(config.buttonDiameter)); const bd=mkSlider(25,80,1,config.buttonDiameter);
        bd.addEventListener('input',()=>{ const v=parseInt(bd.value); config.buttonDiameter=v; bdVal.textContent=String(v); refreshButtonSizes(); pushConfig({buttonDiameter:v}); });
        const opVal=mkVal(String(config.opacity)); const op=mkSlider(40,255,1,config.opacity);
        op.addEventListener('input',()=>{ const v=parseInt(op.value); config.opacity=v; opVal.textContent=String(v); refreshButtonSizes(); pushConfig({opacity:v}); });

        const mkToggle = (label, key, onChange) => {
            const row=document.createElement('label'); row.style.cssText="display:flex;align-items:center;gap:8px;margin:6px 0;";
            const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!config[key]; cb.style.cssText="width:18px;height:18px;accent-color:#29a30a;";
            cb.addEventListener('change',()=>{ config[key]=cb.checked; pushConfig({[key]:cb.checked}); if(onChange) onChange(cb.checked); if(key==='enableColors') refreshButtonSizes(); });
            const sp=document.createElement('span'); sp.textContent=label; row.appendChild(cb); row.appendChild(sp); return row;
        };
        const mkBtn = (label, onClick, bg) => {
            const b=document.createElement('button'); b.textContent=label;
            b.style.cssText=`flex:1;margin:2px;padding:8px 10px;border-radius:6px;border:1px solid #fff4;background:${bg||'#29a30a'};color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;`;
            b.addEventListener('click',(ev)=>{ ev.preventDefault(); onClick(); });
            b.addEventListener('touchend',(ev)=>{ ev.preventDefault(); onClick(); },{passive:false});
            return b;
        };

        const titleDiv=document.createElement('div'); titleDiv.style.cssText="font-weight:600;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;";
        const ttxt=document.createElement('span'); ttxt.textContent='Controles'; titleDiv.appendChild(ttxt);
        const cbtn=mkBtn('X',()=>{ menu.style.display='none'; },'transparent'); cbtn.style.flex='0'; cbtn.style.padding='2px 10px'; cbtn.style.borderColor='#fff2'; titleDiv.appendChild(cbtn);
        menu.appendChild(titleDiv);

        menu.appendChild(mkRow("Sensibilidade Camera (R)", rs, rsVal));
        menu.appendChild(mkRow("Sensibilidade Movimento (L)", ls, lsVal));
        menu.appendChild(mkRow("Raio do Analogico", sr, srVal));
        menu.appendChild(mkRow("Tamanho dos Botoes (global)", bd, bdVal));
        menu.appendChild(mkRow("Opacidade (global)", op, opVal));
        menu.appendChild(mkToggle("Mostrar analogicos ao tocar", "enableDrawSticks"));
        menu.appendChild(mkToggle("Destaque colorido nos botoes", "enableColors"));
        menu.appendChild(mkToggle("Brilho nos botoes pressionados", "enableGlow"));

        // Analógicos fixos
        const sepDiv = document.createElement('div'); sepDiv.style.cssText="margin:10px 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#29a30a;border-top:1px solid #fff1;padding-top:8px;"; sepDiv.textContent="Analógicos Fixos"; menu.appendChild(sepDiv);
        menu.appendChild(mkToggle("Mostrar analógicos fixos na tela", "fixedSticks", (checked) => { drawFixedSticks(); fixedCanvas.style.display = checked ? "block" : "none"; }));
        const fsOpVal=mkVal(String(config.fixedSticksOpacity||80)); const fsOp=mkSlider(10,255,1,config.fixedSticksOpacity||80);
        fsOp.addEventListener('input',()=>{ const v=parseInt(fsOp.value); config.fixedSticksOpacity=v; fsOpVal.textContent=String(v); pushConfig({fixedSticksOpacity:v}); drawFixedSticks(); });
        menu.appendChild(mkRow("Opacidade dos analógicos fixos", fsOp, fsOpVal));

        const tip2=document.createElement('div'); tip2.style.cssText="font-size:10px;opacity:0.5;margin-top:3px;line-height:1.3;"; tip2.textContent="Os analógicos fixos ficam visíveis o tempo todo. Toque nos círculos para usar."; menu.appendChild(tip2);

        const acts=document.createElement('div'); acts.style.cssText="display:flex;gap:4px;margin-top:10px;";
        const editBtn=mkBtn('Editar Layout',()=>{ toggleLayoutMode(); menu.style.display='none'; }); editBtn.id='ctrlEditActionBtn'; acts.appendChild(editBtn);
        acts.appendChild(mkBtn('Resetar Layout',()=>{ if(!confirm('Resetar posicoes dos botoes?')) return; pushConfig({buttonConfig:null,buttonOverrides:{},fixedSticksPos:null}); setTimeout(()=>location.reload(),200); },'#a32929'));
        menu.appendChild(acts);
        const tip=document.createElement('div'); tip.style.cssText="margin-top:8px;font-size:10px;opacity:0.5;line-height:1.3;"; tip.textContent="Editar Layout: arraste botões e analógicos fixos para reposicionar."; menu.appendChild(tip);

        const toggleMenu = () => { menu.style.display = menu.style.display==='none' ? 'block' : 'none'; };
        menuButton.addEventListener("click",   (e)=>{ e.preventDefault(); toggleMenu(); });
        menuButton.addEventListener("touchend",(e)=>{ e.preventDefault(); toggleMenu(); },{passive:false});

        const updateVisibility = () => {
            const inSession = isInGameSession();
            const showOverlay = !config.disableTouchController && inSession;
            touchLayer.style.display = showOverlay ? "block" : "none";
            canvasElem.style.display = showOverlay ? "block" : "none";
            fixedCanvas.style.display = (showOverlay && config.fixedSticks) ? "block" : "none";
            emulatedGamepad.buttons.forEach(b => b.buttonElem.style.display = showOverlay ? "block" : "none");
            const ui = inSession ? "flex" : "none";
            disableButton.style.display = ui; menuButton.style.display = ui; layoutToggleBtn.style.display = ui;
            if (!inSession) menu.style.display = "none";
            if (showOverlay) drawFixedSticks();
        };

        // ---------- Listeners dos botões ----------
        emulatedGamepad.buttons.forEach((button, i) => {
            const el = button.buttonElem;
            let touchT = 0, touchMoved = false;
            el.addEventListener("touchstart",(e)=>{ e.preventDefault(); touchT=Date.now(); touchMoved=false; if(layoutMode) layoutButton(e,0,i); else pressButton(i,true); },{passive:false});
            el.addEventListener("touchmove",(e)=>{ e.preventDefault(); touchMoved=true; if(layoutMode) layoutButton(e,1,i); },{passive:false});
            el.addEventListener("touchend",(e)=>{ e.preventDefault();
                if(layoutMode){
                    layoutButton(e,2,i);
                    if(!touchMoved && Date.now()-touchT < 280){ selectedButtonIndex=(selectedButtonIndex===i)?-1:i; updateBtnEditPanel(); refreshButtonSizes(); }
                } else pressButton(i,false);
            },{passive:false});
            el.addEventListener("touchcancel",(e)=>{ e.preventDefault(); if(!layoutMode) pressButton(i,false); },{passive:false});
            el.addEventListener("mousedown",()=>{ if(!layoutMode) pressButton(i,true); });
            el.addEventListener("mouseup",  ()=>{ if(!layoutMode) pressButton(i,false); });
            el.addEventListener("mouseleave",()=>{ if(!layoutMode) pressButton(i,false); });
        });

        const attachUI = () => {
            if (!document.body) return false;
            if (document.body.contains(root)) return true;
            emulatedGamepad.buttons.forEach(b => touchLayer.appendChild(b.buttonElem));
            root.appendChild(touchLayer);
            root.appendChild(fixedCanvas);
            root.appendChild(canvasElem);
            root.appendChild(disableButton);
            root.appendChild(menuButton);
            root.appendChild(layoutToggleBtn);
            root.appendChild(menu);
            root.appendChild(btnEditPanel);
            document.body.appendChild(root);
            return true;
        };

        if (!attachUI()) {
            window.addEventListener('load', attachUI, {once:true});
            document.addEventListener('DOMContentLoaded', attachUI, {once:true});
            const retry = setInterval(()=>{ if(attachUI()) clearInterval(retry); }, 500);
            setTimeout(()=>clearInterval(retry), 20000);
        }

        window.addEventListener('resize', () => {
            canvasElem.width = window.innerWidth; canvasElem.height = window.innerHeight;
            fixedCanvas.width = window.innerWidth; fixedCanvas.height = window.innerHeight;
            updateVisibility(); drawFixedSticks();
        });
        window.addEventListener("popstate", updateVisibility);
        updateVisibility(); drawFixedSticks();
        if (PLATFORM.isBoosteroid) setInterval(updateVisibility, 1500);

        const originalGetGamepads = navigator.getGamepads;
        navigator.getGamepads = () => {
            const og = originalGetGamepads.apply(navigator);
            const mg = [emulatedGamepad, null, null, null];
            let idx = 1;
            for (let i = 0; i < 4; i++) {
                if (idx >= 4) break;
                if (og[i] !== null) { mg[idx] = {}; for (let p in og[i]) mg[idx][p] = og[i][p]; mg[idx].index = idx; idx++; }
            }
            return mg;
        };
    };
};

Object.defineProperty(navigator, "maxTouchPoints", { get: () => 0, set: () => {} });
delete window.ontouchstart;

const injScript = document.createElement("script");
injScript.appendChild(document.createTextNode("(" + main + ")();"));
(document.body || document.head || document.documentElement).appendChild(injScript);

(function () {
    "use strict";

    var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addMotionChangeListener(handler) {
        if (typeof reduceMotionQuery.addEventListener === "function") {
            reduceMotionQuery.addEventListener("change", handler);
        } else if (typeof reduceMotionQuery.addListener === "function") {
            reduceMotionQuery.addListener(handler);
        }
    }

    function buildRenderer(canvas, config) {
        if (!canvas || !canvas.parentElement) {
            return null;
        }

        var ctx = canvas.getContext("2d");
        if (!ctx) {
            return null;
        }

        var width = 0;
        var height = 0;
        var rafId = 0;
        var resizeObserver = null;

        function getSize() {
            if (config.fullscreen) {
                return {
                    width: window.innerWidth,
                    height: window.innerHeight
                };
            }

            var rect = canvas.parentElement.getBoundingClientRect();
            return {
                width: rect.width,
                height: rect.height
            };
        }

        function resizeCanvas() {
            var size = getSize();
            var nextWidth = Math.max(1, Math.round(size.width));
            var nextHeight = Math.max(1, Math.round(size.height));

            if (width === nextWidth && height === nextHeight) {
                return;
            }

            width = nextWidth;
            height = nextHeight;

            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function drawWave(timeSeconds, wave, isStatic) {
            var phase = isStatic ? wave.phase : (timeSeconds * wave.speed) + wave.phase;
            var step = wave.step || 12;

            ctx.beginPath();
            ctx.moveTo(0, height);

            for (var x = 0; x <= width + step; x += step) {
                var normalizedX = x / width;
                var y = (wave.offset * height) +
                    (Math.sin((normalizedX * Math.PI * 2 * wave.frequency) + phase) * wave.amplitude * height) +
                    (Math.cos((normalizedX * Math.PI * 2 * wave.frequency * 0.55) + (phase * 1.35)) * wave.secondaryAmplitude * height);

                ctx.lineTo(x, y);
            }

            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fillStyle = wave.color;
            ctx.fill();
        }

        function drawFrame(timeSeconds, isStatic) {
            if (width <= 0 || height <= 0) {
                return;
            }

            ctx.clearRect(0, 0, width, height);

            var baseGradient = ctx.createLinearGradient(0, 0, 0, height);
            baseGradient.addColorStop(0, config.gradientTop);
            baseGradient.addColorStop(1, config.gradientBottom);
            ctx.fillStyle = baseGradient;
            ctx.fillRect(0, 0, width, height);

            if (config.glowColor) {
                var glow = ctx.createRadialGradient(
                    width * 0.18,
                    height * 0.22,
                    0,
                    width * 0.18,
                    height * 0.22,
                    Math.max(width, height) * 0.7
                );
                glow.addColorStop(0, config.glowColor);
                glow.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, width, height);
            }

            for (var i = 0; i < config.waves.length; i += 1) {
                drawWave(timeSeconds, config.waves[i], isStatic);
            }
        }

        function tick(now) {
            drawFrame(now * 0.001, false);
            if (!reduceMotionQuery.matches) {
                rafId = window.requestAnimationFrame(tick);
            }
        }

        function start() {
            resizeCanvas();
            window.cancelAnimationFrame(rafId);

            if (reduceMotionQuery.matches) {
                drawFrame(0, true);
                return;
            }

            rafId = window.requestAnimationFrame(tick);
        }

        function onResize() {
            resizeCanvas();
            if (reduceMotionQuery.matches) {
                drawFrame(0, true);
            }
        }

        window.addEventListener("resize", onResize);

        if (typeof window.ResizeObserver === "function" && !config.fullscreen) {
            resizeObserver = new ResizeObserver(onResize);
            resizeObserver.observe(canvas.parentElement);
        }

        addMotionChangeListener(start);

        start();

        return {
            destroy: function () {
                window.cancelAnimationFrame(rafId);
                window.removeEventListener("resize", onResize);
                if (resizeObserver) {
                    resizeObserver.disconnect();
                }
            }
        };
    }

    function initWavyBackgrounds() {
        var contactCanvas = document.querySelector("[data-wave-canvas='contact']");

        buildRenderer(contactCanvas, {
            fullscreen: false,
            gradientTop: "rgba(18, 16, 40, 0.96)",
            gradientBottom: "rgba(7, 7, 16, 0.98)",
            glowColor: "rgba(84, 77, 157, 0.34)",
            waves: [
                {
                    color: "rgba(249, 134, 26, 0.24)",
                    amplitude: 0.08,
                    secondaryAmplitude: 0.03,
                    frequency: 1.1,
                    speed: 0.92,
                    offset: 0.68,
                    phase: 0.0,
                    step: 10
                },
                {
                    color: "rgba(84, 77, 157, 0.26)",
                    amplitude: 0.11,
                    secondaryAmplitude: 0.04,
                    frequency: 1.7,
                    speed: 0.56,
                    offset: 0.75,
                    phase: 1.9,
                    step: 10
                },
                {
                    color: "rgba(255, 255, 255, 0.12)",
                    amplitude: 0.07,
                    secondaryAmplitude: 0.03,
                    frequency: 2.4,
                    speed: 0.4,
                    offset: 0.81,
                    phase: 3.1,
                    step: 12
                },
                {
                    color: "rgba(22, 180, 177, 0.14)",
                    amplitude: 0.06,
                    secondaryAmplitude: 0.02,
                    frequency: 2.8,
                    speed: 0.31,
                    offset: 0.86,
                    phase: 2.6,
                    step: 14
                }
            ]
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initWavyBackgrounds);
    } else {
        initWavyBackgrounds();
    }
})();

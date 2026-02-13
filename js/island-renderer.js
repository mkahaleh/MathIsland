/* ========================================
   MATH ISLAND - Island & Background Renderer
   Procedural canvas-based environments
   NEXT-LEVEL GRAPHICS
   ======================================== */

class IslandRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.time = 0;
        this.clouds = [];
        this.waves = [];
        this.stars = [];

        // Performance: frame skipping for expensive effects
        this._frameCount = 0;
        this._lastScene = null;
        this._sceneChanged = true;

        // Performance: cache gradients
        this._cachedGradients = {};

        this._initClouds();
        this._initWaves();
        this._initStars();
        this._initNoiseTexture();
        this._initCachedGradients();
    }

    // Pre-create gradients that don't change between frames
    _initCachedGradients() {
        const ctx = this.ctx;

        // Vignette gradients at different intensities
        this._vignetteCache = {};

        // Sky gradients for each zone
        this._cachedGradients.menuSky = ctx.createLinearGradient(0, 0, 0, this.height);
        this._cachedGradients.menuSky.addColorStop(0, '#6dd5ed');
        this._cachedGradients.menuSky.addColorStop(0.25, '#00b4d8');
        this._cachedGradients.menuSky.addColorStop(0.55, '#0077b6');
        this._cachedGradients.menuSky.addColorStop(0.8, '#023e8a');
        this._cachedGradients.menuSky.addColorStop(1, '#01226b');

        this._cachedGradients.beachSky = ctx.createLinearGradient(0, 0, 0, this.height);
        this._cachedGradients.beachSky.addColorStop(0, '#87ceeb');
        this._cachedGradients.beachSky.addColorStop(0.4, '#48cae4');
        this._cachedGradients.beachSky.addColorStop(0.7, '#ffd166');
        this._cachedGradients.beachSky.addColorStop(1, '#f4a261');

        this._cachedGradients.jungleSky = ctx.createLinearGradient(0, 0, 0, this.height);
        this._cachedGradients.jungleSky.addColorStop(0, '#1b4332');
        this._cachedGradients.jungleSky.addColorStop(0.3, '#2d6a4f');
        this._cachedGradients.jungleSky.addColorStop(0.7, '#40916c');
        this._cachedGradients.jungleSky.addColorStop(1, '#1b4332');

        this._cachedGradients.volcanoSky = ctx.createLinearGradient(0, 0, 0, this.height);
        this._cachedGradients.volcanoSky.addColorStop(0, '#0a0000');
        this._cachedGradients.volcanoSky.addColorStop(0.2, '#3a0000');
        this._cachedGradients.volcanoSky.addColorStop(0.5, '#8b0000');
        this._cachedGradients.volcanoSky.addColorStop(0.75, '#d00000');
        this._cachedGradients.volcanoSky.addColorStop(1, '#faa307');

        this._cachedGradients.skySky = ctx.createLinearGradient(0, 0, 0, this.height);
        this._cachedGradients.skySky.addColorStop(0, '#e0f7ff');
        this._cachedGradients.skySky.addColorStop(0.3, '#87ceeb');
        this._cachedGradients.skySky.addColorStop(0.7, '#caf0f8');
        this._cachedGradients.skySky.addColorStop(1, '#e0f7ff');

        this._cachedGradients.spaceSky = ctx.createLinearGradient(0, 0, 0, this.height);
        this._cachedGradients.spaceSky.addColorStop(0, '#050a18');
        this._cachedGradients.spaceSky.addColorStop(0.3, '#0d1b2a');
        this._cachedGradients.spaceSky.addColorStop(0.7, '#1b263b');
        this._cachedGradients.spaceSky.addColorStop(1, '#050a18');

        this._cachedGradients.oceanMap = ctx.createLinearGradient(0, 0, 0, this.height);
        this._cachedGradients.oceanMap.addColorStop(0, '#6dd5ed');
        this._cachedGradients.oceanMap.addColorStop(0.15, '#48cae4');
        this._cachedGradients.oceanMap.addColorStop(0.4, '#0096c7');
        this._cachedGradients.oceanMap.addColorStop(0.7, '#0077b6');
        this._cachedGradients.oceanMap.addColorStop(1, '#023e8a');

        // Pre-create bloom gradient (doesn't change)
        this._cachedGradients.bloom = ctx.createRadialGradient(
            this.width * 0.5, this.height * 0.35, 0,
            this.width * 0.5, this.height * 0.35, this.width * 0.6
        );
        this._cachedGradients.bloom.addColorStop(0, 'rgba(255, 255, 240, 0.06)');
        this._cachedGradients.bloom.addColorStop(0.5, 'rgba(255, 220, 180, 0.03)');
        this._cachedGradients.bloom.addColorStop(1, 'transparent');
    }

    _initNoiseTexture() {
        // Pre-render a subtle grain texture for painterly feel
        const size = 256;
        const noiseCanvas = document.createElement('canvas');
        noiseCanvas.width = size;
        noiseCanvas.height = size;
        const nCtx = noiseCanvas.getContext('2d');
        const imageData = nCtx.createImageData(size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const v = Math.random() * 30;
            imageData.data[i] = v;
            imageData.data[i + 1] = v;
            imageData.data[i + 2] = v;
            imageData.data[i + 3] = 18; // Very subtle
        }
        nCtx.putImageData(imageData, 0, 0);
        this._noisePattern = this.ctx.createPattern(noiseCanvas, 'repeat');
    }

    _initClouds() {
        // Reduced from 10 to 6 clouds for performance
        for (let i = 0; i < 6; i++) {
            this.clouds.push({
                x: Utils.randomFloat(0, this.width),
                y: Utils.randomFloat(30, 250),
                width: Utils.randomFloat(120, 350),
                height: Utils.randomFloat(40, 90),
                speed: Utils.randomFloat(0.15, 0.7),
                opacity: Utils.randomFloat(0.5, 0.95)
            });
        }
    }

    _initWaves() {
        // Reduced from 7 to 4 wave layers for performance
        for (let i = 0; i < 4; i++) {
            this.waves.push({
                y: this.height - 220 + i * 35,
                amplitude: 6 + i * 3,
                frequency: 0.004 + i * 0.0015,
                speed: 0.4 + i * 0.25,
                color: `rgba(0, ${120 + i * 22}, ${190 + i * 10}, ${0.25 + i * 0.08})`
            });
        }
    }

    _initStars() {
        // Reduced from 200 to 80 stars for performance
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Utils.randomFloat(0, this.width),
                y: Utils.randomFloat(0, this.height),
                size: Utils.randomFloat(0.5, 3),
                speed: Utils.randomFloat(1, 4),
                phase: Utils.randomFloat(0, Math.PI * 2)
            });
        }
    }

    update(dt) {
        this.time += dt;
        this._frameCount++;
        for (let i = 0; i < this.clouds.length; i++) {
            this.clouds[i].x += this.clouds[i].speed;
            if (this.clouds[i].x > this.width + this.clouds[i].width) {
                this.clouds[i].x = -this.clouds[i].width;
            }
        }
    }

    drawScene(zone) {
        const scenes = {
            beach: () => this._drawBeach(),
            jungle: () => this._drawJungle(),
            cave: () => this._drawCave(),
            volcano: () => this._drawVolcano(),
            sky: () => this._drawSky(),
            space: () => this._drawSpace()
        };
        (scenes[zone] || scenes.beach)();
    }

    // ========== MENU BACKGROUND ==========
    drawMenuBackground() {
        const ctx = this.ctx;

        // Use cached sky gradient
        ctx.fillStyle = this._cachedGradients.menuSky;
        ctx.fillRect(0, 0, this.width, this.height);

        // Atmospheric light rays
        this._drawLightRays(1600, 100, 0.06);

        // Sun
        this._drawSun(1600, 150, 110);

        // Clouds
        this._drawClouds();

        // Island in distance
        this._drawIslandSilhouette(960, 520, 900, 350);

        // Water with reflections
        this._drawWater(580);

        // Palm trees
        this._drawPalmTree(180, 530, 0.75);
        this._drawPalmTree(1720, 500, 0.85);

        // Sparkles
        this._drawSparkles();

        // Floating decorative elements (Unity-style)
        this._drawFloatingDecorations();

        // Rainbow arc
        this._drawRainbowArc();

        // Post-processing
        this._drawVignette(0.25);
        this._applyPostProcessing(0.06);
    }

    _drawFloatingDecorations() {
        // Only draw every other frame for performance
        if (this._frameCount % 2 !== 0) return;

        const ctx = this.ctx;
        const t = this.time;

        // Reduced bubbles from 8 to 4
        for (let i = 0; i < 4; i++) {
            const x = 150 + i * 440 + Math.sin(t * 0.5 + i * 1.3) * 30;
            const y = 200 + Math.sin(t * 0.3 + i * 0.9) * 80;
            const size = 12 + Math.sin(t + i) * 4;
            const alpha = 0.15 + Math.sin(t * 0.7 + i) * 0.08;

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
            ctx.restore();
        }

        // Reduced star shapes from 5 to 3
        for (let i = 0; i < 3; i++) {
            const x = 300 + i * 550 + Math.sin(t * 0.4 + i * 2) * 40;
            const y = 100 + Math.sin(t * 0.6 + i * 1.5) * 50;
            const size = 6 + Math.sin(t * 1.5 + i) * 2;
            const rotation = t * 0.5 + i;
            const alpha = 0.3 + Math.sin(t + i * 0.7) * 0.15;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            this._drawStarShape(ctx, 0, 0, size, size * 0.4, 5);
            ctx.fill();
            ctx.restore();
        }
    }

    _drawStarShape(ctx, cx, cy, outerR, innerR, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    _drawRainbowArc() {
        const ctx = this.ctx;
        const centerX = 960;
        const centerY = 600;
        const alpha = 0.08 + Math.sin(this.time * 0.3) * 0.03;

        const colors = ['#ef476f', '#ff6b35', '#ffd166', '#06d6a0', '#00b4d8', '#8338ec'];

        for (let i = 0; i < colors.length; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, 800 - i * 18, Math.PI * 1.1, Math.PI * 1.9);
            ctx.strokeStyle = colors[i] + Math.round(alpha * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 14;
            ctx.stroke();
        }
    }

    // ========== BEACH ZONE ==========
    _drawBeach() {
        const ctx = this.ctx;

        ctx.fillStyle = this._cachedGradients.beachSky;
        ctx.fillRect(0, 0, this.width, this.height);

        this._drawLightRays(1500, 120, 0.04);
        this._drawSun(1500, 180, 130);
        this._drawClouds();

        // Sand with texture
        const sandGrad = ctx.createLinearGradient(0, this.height * 0.6, 0, this.height);
        sandGrad.addColorStop(0, '#f4d03f');
        sandGrad.addColorStop(0.3, '#ffd166');
        sandGrad.addColorStop(0.7, '#f0c040');
        sandGrad.addColorStop(1, '#e6b030');
        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        ctx.moveTo(0, this.height * 0.65);
        for (let x = 0; x <= this.width; x += 15) {
            ctx.lineTo(x, this.height * 0.65 + Math.sin(x * 0.008 + this.time * 0.5) * 12 + Math.sin(x * 0.02) * 4);
        }
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.fill();

        // Sand sparkles - reduced from 30 to 12
        ctx.save();
        for (let i = 0; i < 12; i++) {
            const sx = (i * 67 + this.time * 5) % this.width;
            const sy = this.height * 0.7 + (i * 31) % (this.height * 0.25);
            const alpha = 0.2 + Math.sin(this.time * 3 + i) * 0.2;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        this._drawWater(this.height * 0.58);
        this._drawPalmTree(150, this.height * 0.55, 1);
        this._drawPalmTree(1750, this.height * 0.52, 1.1);
        this._drawShells();
        this._drawVignette(0.15);
        this._applyPostProcessing(0.07);
    }

    // ========== JUNGLE ZONE ==========
    _drawJungle() {
        const ctx = this.ctx;

        ctx.fillStyle = this._cachedGradients.jungleSky;
        ctx.fillRect(0, 0, this.width, this.height);

        // God rays through canopy
        ctx.save();
        for (let i = 0; i < 6; i++) {
            const x = 250 + i * 280;
            const sway = Math.sin(this.time * 0.3 + i) * 30;
            const alpha = 0.06 + Math.sin(this.time * 0.5 + i * 0.7) * 0.03;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(x + sway, 0);
            ctx.lineTo(x - 120 + sway, this.height);
            ctx.lineTo(x + 120 + sway, this.height);
            ctx.fill();
        }
        ctx.restore();

        // Ground
        const groundGrad = ctx.createLinearGradient(0, this.height * 0.72, 0, this.height);
        groundGrad.addColorStop(0, '#2d6a4f');
        groundGrad.addColorStop(0.5, '#1b4332');
        groundGrad.addColorStop(1, '#0f2e1f');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, this.height * 0.72, this.width, this.height * 0.28);

        this._drawVines();

        for (let i = 0; i < 6; i++) {
            this._drawJungleTree(i * 350 + 100, this.height * 0.7, 0.8 + Math.random() * 0.4);
        }

        // Fireflies - reduced from 25 to 10
        ctx.save();
        for (let i = 0; i < 10; i++) {
            const fx = (i * 83 + Math.sin(this.time + i) * 40) % this.width;
            const fy = (i * 47 + Math.cos(this.time * 0.8 + i) * 30) % (this.height * 0.7);
            const alpha = 0.3 + Math.sin(this.time * 4 + i * 1.3) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffe44d';
            ctx.beginPath();
            ctx.arc(fx, fy, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = alpha * 0.3;
            ctx.beginPath();
            ctx.arc(fx, fy, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        this._drawFlowers();
        this._drawForegroundDecor(this.height * 0.82);
        this._drawVignette(0.3);
        this._applyPostProcessing(0.05);
    }

    // ========== CRYSTAL CAVE ==========
    _drawCave() {
        const ctx = this.ctx;

        const bg = ctx.createRadialGradient(960, 540, 80, 960, 540, 900);
        bg.addColorStop(0, '#2b2d42');
        bg.addColorStop(0.4, '#1a1a2e');
        bg.addColorStop(1, '#080812');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // Ambient glow pulse
        ctx.save();
        ctx.globalAlpha = 0.04 + Math.sin(this.time * 1.5) * 0.02;
        const glow = ctx.createRadialGradient(960, 540, 0, 960, 540, 600);
        glow.addColorStop(0, '#8338ec');
        glow.addColorStop(0.5, '#ef476f');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();

        this._drawCrystals();

        // Stalactites
        ctx.fillStyle = '#12121f';
        for (let i = 0; i < 15; i++) {
            const x = i * 140 + 20;
            const h = 50 + (i * 37) % 180;
            ctx.beginPath();
            ctx.moveTo(x - 35, 0);
            ctx.lineTo(x, h);
            ctx.lineTo(x + 35, 0);
            ctx.fill();
        }

        // Stalagmites
        for (let i = 0; i < 12; i++) {
            const x = i * 170 + 50;
            const h = 40 + (i * 23) % 140;
            ctx.beginPath();
            ctx.moveTo(x - 30, this.height);
            ctx.lineTo(x, this.height - h);
            ctx.lineTo(x + 30, this.height);
            ctx.fill();
        }

        // Dust particles - reduced from 40 to 15
        ctx.save();
        for (let i = 0; i < 15; i++) {
            const dx = (i * 53 + this.time * 15) % this.width;
            const dy = (i * 37 + Math.sin(this.time * 0.5 + i) * 50) % this.height;
            ctx.globalAlpha = 0.15 + Math.sin(this.time * 2 + i) * 0.1;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(dx, dy, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        this._drawVignette(0.4);
        this._applyPostProcessing(0.04);
    }

    // ========== VOLCANO ==========
    _drawVolcano() {
        const ctx = this.ctx;

        ctx.fillStyle = this._cachedGradients.volcanoSky;
        ctx.fillRect(0, 0, this.width, this.height);

        // Heat shimmer removed - was reading/writing canvas every 4px (extremely expensive)

        // Volcano shape with detail
        const volcGrad = ctx.createLinearGradient(960, 100, 960, this.height);
        volcGrad.addColorStop(0, '#2d0000');
        volcGrad.addColorStop(0.5, '#3d0000');
        volcGrad.addColorStop(1, '#1a0000');
        ctx.fillStyle = volcGrad;
        ctx.beginPath();
        ctx.moveTo(550, this.height);
        ctx.bezierCurveTo(650, this.height * 0.5, 780, 220, 880, 160);
        ctx.lineTo(960, 140);
        ctx.lineTo(1040, 160);
        ctx.bezierCurveTo(1140, 220, 1270, this.height * 0.5, 1370, this.height);
        ctx.fill();

        // Lava glow
        ctx.save();
        const lavaGlow = ctx.createRadialGradient(960, 160, 10, 960, 160, 250);
        lavaGlow.addColorStop(0, 'rgba(255, 120, 0, 0.9)');
        lavaGlow.addColorStop(0.3, 'rgba(255, 60, 0, 0.4)');
        lavaGlow.addColorStop(0.7, 'rgba(255, 30, 0, 0.1)');
        lavaGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = lavaGlow;
        ctx.fillRect(660, 0, 600, 450);
        ctx.restore();

        // Lava rivers
        ctx.save();
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = 25;
        ctx.strokeStyle = '#ff6b00';
        ctx.lineWidth = 7;
        const lo = Math.sin(this.time * 3) * 6;
        ctx.beginPath();
        ctx.moveTo(920, 175);
        ctx.bezierCurveTo(880 + lo, 400, 740, 620, 690, this.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(1000, 175);
        ctx.bezierCurveTo(1050 - lo, 400, 1170, 620, 1220, this.height);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        this._drawEmbers();
        this._drawVignette(0.35);
        this._applyPostProcessing(0.09);
    }

    // ========== CLOUD KINGDOM ==========
    _drawSky() {
        const ctx = this.ctx;

        ctx.fillStyle = this._cachedGradients.skySky;
        ctx.fillRect(0, 0, this.width, this.height);

        this._drawRainbow(400, 300);
        this._drawSun(1600, 120, 100);
        this._drawBigClouds();

        for (let i = 0; i < 5; i++) {
            const x = 200 + i * 350;
            const y = 500 + Math.sin(this.time + i) * 30;
            this._drawCloudPlatform(x, y, 200 + i * 20);
        }

        this._drawVignette(0.1);
        this._applyPostProcessing(0.05);
    }

    // ========== SPACE ==========
    _drawSpace() {
        const ctx = this.ctx;

        ctx.fillStyle = this._cachedGradients.spaceSky;
        ctx.fillRect(0, 0, this.width, this.height);

        this._drawStarField();

        // Nebula
        ctx.save();
        ctx.globalAlpha = 0.12 + Math.sin(this.time * 0.3) * 0.03;
        const nebula = ctx.createRadialGradient(700, 400, 50, 700, 400, 450);
        nebula.addColorStop(0, '#8338ec');
        nebula.addColorStop(0.4, '#ef476f');
        nebula.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();

        // Second nebula
        ctx.save();
        ctx.globalAlpha = 0.08;
        const neb2 = ctx.createRadialGradient(1400, 700, 30, 1400, 700, 350);
        neb2.addColorStop(0, '#00b4d8');
        neb2.addColorStop(0.5, '#06d6a0');
        neb2.addColorStop(1, 'transparent');
        ctx.fillStyle = neb2;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();

        this._drawPlanet(1400, 350, 120);
        this._drawShootingStars();
        this._drawVignette(0.3);
        this._applyPostProcessing(0.03);
    }

    // ========== HELPER FUNCTIONS ==========

    _drawVignette(intensity) {
        // Skip vignette on most frames for performance
        if (this._frameCount % 3 !== 0) return;

        const ctx = this.ctx;
        // Cache vignette gradients by intensity (rounded to avoid too many)
        const key = Math.round(intensity * 20);
        if (!this._vignetteCache[key]) {
            this._vignetteCache[key] = ctx.createRadialGradient(
                this.width / 2, this.height / 2, this.width * 0.3,
                this.width / 2, this.height / 2, this.width * 0.75
            );
            this._vignetteCache[key].addColorStop(0, 'transparent');
            this._vignetteCache[key].addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
        }
        ctx.fillStyle = this._vignetteCache[key];
        ctx.fillRect(0, 0, this.width, this.height);
    }

    // Unity-style post-processing pass - runs every 3rd frame for performance
    _applyPostProcessing(warmth) {
        // Skip post-processing on most frames for huge performance gain
        if (this._frameCount % 3 !== 0) return;

        const ctx = this.ctx;
        warmth = warmth || 0.08;

        // 1. Painterly grain texture
        if (this._noisePattern) {
            ctx.save();
            ctx.fillStyle = this._noisePattern;
            ctx.globalAlpha = 1;
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        }

        // 2. Warm color grading (golden tint overlay)
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = `rgba(255, 200, 100, ${warmth})`;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();

        // 3. Soft bloom / glow pass - use cached gradient
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = this._cachedGradients.bloom;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }

    // Foreground decorative grass/bushes for depth
    _drawForegroundDecor(groundY) {
        const ctx = this.ctx;
        ctx.save();

        // Grass tufts along the bottom - reduced from 30 to 15
        for (let i = 0; i < 15; i++) {
            const x = i * 130 + Math.sin(i * 1.7) * 20;
            const y = groundY + Math.sin(i * 0.8) * 5;
            const h = 20 + (i * 7) % 25;
            const sway = Math.sin(this.time * 1.5 + i * 0.5) * 4;

            ctx.fillStyle = `hsl(${120 + (i * 5) % 30}, 55%, ${25 + (i * 3) % 15}%)`;
            ctx.beginPath();
            ctx.moveTo(x - 4, y);
            ctx.quadraticCurveTo(x - 2 + sway, y - h * 0.7, x + sway * 0.5, y - h);
            ctx.quadraticCurveTo(x + 3 + sway * 0.3, y - h * 0.5, x + 6, y);
            ctx.fill();

            // Second blade
            ctx.beginPath();
            ctx.moveTo(x + 3, y);
            ctx.quadraticCurveTo(x + 7 + sway * 0.8, y - h * 0.6, x + 5 + sway, y - h * 0.85);
            ctx.quadraticCurveTo(x + 10 + sway * 0.3, y - h * 0.4, x + 12, y);
            ctx.fill();
        }
        ctx.restore();
    }

    _drawLightRays(x, y, alpha) {
        // Only draw every other frame
        if (this._frameCount % 2 !== 0) return;

        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = alpha;
        // Reduced from 8 to 5 rays
        for (let i = 0; i < 5; i++) {
            const angle = -0.8 + i * 0.25 + Math.sin(this.time * 0.2 + i) * 0.05;
            const len = 1200 + Math.sin(this.time * 0.5 + i) * 100;
            const w = 40 + i * 15;
            ctx.fillStyle = 'rgba(255, 245, 200, 0.5)';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * len - w, y + Math.sin(angle) * len);
            ctx.lineTo(x + Math.cos(angle) * len + w, y + Math.sin(angle) * len);
            ctx.fill();
        }
        ctx.restore();
    }

    _drawSun(x, y, r) {
        const ctx = this.ctx;
        ctx.save();

        // Outer glow
        const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 3.5);
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        glow.addColorStop(0.3, 'rgba(255, 215, 0, 0.15)');
        glow.addColorStop(0.6, 'rgba(255, 180, 0, 0.05)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);

        // Sun body
        const sunGrad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
        sunGrad.addColorStop(0, '#fffde0');
        sunGrad.addColorStop(0.5, '#ffd700');
        sunGrad.addColorStop(0.8, '#ffaa00');
        sunGrad.addColorStop(1, '#ff8800');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Animated rays - reduced from 16 to 8
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.time * 0.15;
            const inner = r * 1.15;
            const outer = r * 1.8 + Math.sin(this.time * 2.5 + i * 0.8) * 12;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
            ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
            ctx.stroke();
        }

        ctx.restore();
    }

    _drawClouds() {
        const ctx = this.ctx;
        for (let ci = 0; ci < this.clouds.length; ci++) {
            const cloud = this.clouds[ci];
            ctx.save();
            ctx.globalAlpha = cloud.opacity;

            const cx = cloud.x;
            const cy = cloud.y;
            const w = cloud.width;
            const h = cloud.height;

            // Cloud body
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.beginPath();
            ctx.arc(cx, cy, h * 0.65, 0, Math.PI * 2);
            ctx.arc(cx - w * 0.25, cy + h * 0.12, h * 0.48, 0, Math.PI * 2);
            ctx.arc(cx + w * 0.25, cy + h * 0.08, h * 0.55, 0, Math.PI * 2);
            ctx.arc(cx + w * 0.1, cy - h * 0.12, h * 0.42, 0, Math.PI * 2);
            ctx.arc(cx - w * 0.1, cy - h * 0.05, h * 0.38, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    _drawWater(startY) {
        const ctx = this.ctx;

        // Simplified water fill (no per-call gradient creation)
        ctx.fillStyle = 'rgba(0, 100, 160, 0.7)';
        ctx.fillRect(0, startY, this.width, this.height - startY);

        // Animated wave layers - step increased from 8 to 16
        for (let w = 0; w < this.waves.length; w++) {
            const wave = this.waves[w];
            ctx.fillStyle = wave.color;
            ctx.beginPath();
            ctx.moveTo(0, startY + (wave.y - (this.height - 220)));
            for (let x = 0; x <= this.width; x += 16) {
                const y = startY + (wave.y - (this.height - 220)) +
                    Math.sin(x * wave.frequency + this.time * wave.speed) * wave.amplitude;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(0, this.height);
            ctx.fill();
        }

        // Foam highlights - reduced from 20 to 8
        ctx.save();
        for (let i = 0; i < 8; i++) {
            const wx = (i * 250 + this.time * 20) % this.width;
            const wy = startY + 10 + (i * 17) % 60;
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(wx, wy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    _drawPalmTree(x, y, scale) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        const sway = Math.sin(this.time * 1.2) * 6;

        // Trunk
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.quadraticCurveTo(-10 + sway * 0.5, -100, 0 + sway * 1.2, -210);
        ctx.quadraticCurveTo(10 + sway * 0.5, -100, 14, 0);
        ctx.fill();

        // Trunk texture
        ctx.strokeStyle = '#6B4F12';
        ctx.lineWidth = 2;
        for (let i = 0; i < 9; i++) {
            const ty = -i * 24;
            const tx = sway * (i / 9);
            ctx.beginPath();
            ctx.arc(tx, ty, 15 - i, 0, Math.PI);
            ctx.stroke();
        }

        // Leaves
        const leafTop = -210 + sway * 1.2;
        const leaves = [
            { angle: -0.5, len: 130 },
            { angle: -1.2, len: 110 },
            { angle: 0.3, len: 120 },
            { angle: 1.0, len: 100 },
            { angle: -2.0, len: 90 },
            { angle: 1.8, len: 95 },
            { angle: -0.1, len: 85 },
            { angle: 2.5, len: 75 }
        ];

        leaves.forEach(leaf => {
            const la = leaf.angle + Math.sin(this.time * 1.5 + leaf.angle) * 0.06;
            const gradient = ctx.createLinearGradient(
                sway * 1.2, leafTop,
                Math.cos(la) * leaf.len + sway * 1.2, leafTop + Math.sin(la) * leaf.len
            );
            gradient.addColorStop(0, '#2d8b2d');
            gradient.addColorStop(1, '#1a6b1a');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(sway * 1.2, leafTop);
            ctx.quadraticCurveTo(
                Math.cos(la) * leaf.len * 0.5 + sway * 1.2,
                leafTop + Math.sin(la) * leaf.len * 0.5 - 22,
                Math.cos(la) * leaf.len + sway * 1.2,
                leafTop + Math.sin(la) * leaf.len
            );
            ctx.quadraticCurveTo(
                Math.cos(la) * leaf.len * 0.5 + sway * 1.2,
                leafTop + Math.sin(la) * leaf.len * 0.5 + 12,
                sway * 1.2,
                leafTop
            );
            ctx.fill();
        });

        // Coconuts
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(sway * 1.2 - 9, leafTop + 16, 9, 0, Math.PI * 2);
        ctx.arc(sway * 1.2 + 9, leafTop + 19, 8, 0, Math.PI * 2);
        ctx.arc(sway * 1.2 - 2, leafTop + 22, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _drawIslandSilhouette(x, y, w, h) {
        const ctx = this.ctx;
        ctx.save();

        const islandGrad = ctx.createLinearGradient(x, y - h * 0.3, x, y + h * 0.3);
        islandGrad.addColorStop(0, '#06d6a0');
        islandGrad.addColorStop(0.5, '#2d6a4f');
        islandGrad.addColorStop(0.85, '#40916c');
        islandGrad.addColorStop(1, '#f4d03f');

        ctx.fillStyle = islandGrad;
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y);
        ctx.bezierCurveTo(x - w * 0.4, y - h * 0.7, x - w * 0.15, y - h * 0.95, x - w * 0.05, y - h * 0.85);
        ctx.bezierCurveTo(x + w * 0.05, y - h, x + w * 0.15, y - h * 1.05, x + w * 0.1, y - h * 0.9);
        ctx.bezierCurveTo(x + w * 0.25, y - h * 0.6, x + w * 0.35, y - h * 0.4, x + w / 2, y);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    _drawSparkles() {
        // Only draw every other frame, reduced from 25 to 10
        if (this._frameCount % 2 !== 0) return;

        const ctx = this.ctx;
        for (let i = 0; i < 10; i++) {
            const x = ((i * 200 + this.time * 25) % this.width);
            const y = ((i * 120 + this.time * 8) % (this.height * 0.5));
            const size = 2 + Math.sin(this.time * 3 + i) * 2;
            const alpha = 0.3 + Math.sin(this.time * 4 + i * 0.5) * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.translate(x, y);
            // Removed per-sparkle rotation (expensive context transforms)
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(size * 0.3, -size * 0.3);
            ctx.lineTo(size, 0);
            ctx.lineTo(size * 0.3, size * 0.3);
            ctx.lineTo(0, size);
            ctx.lineTo(-size * 0.3, size * 0.3);
            ctx.lineTo(-size, 0);
            ctx.lineTo(-size * 0.3, -size * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    _drawShells() {
        const ctx = this.ctx;
        const shells = ['🐚', '🦀', '⭐', '🐠'];
        ctx.font = '30px Arial';
        for (let i = 0; i < 8; i++) {
            const x = 100 + i * 220;
            const y = this.height * 0.72 + Math.sin(i) * 20;
            ctx.fillText(shells[i % shells.length], x, y);
        }
    }

    _drawVines() {
        const ctx = this.ctx;
        ctx.lineWidth = 5;
        for (let i = 0; i < 8; i++) {
            const x = i * 260 + 80;
            const hue = 120 + (i * 10) % 30;
            ctx.strokeStyle = `hsl(${hue}, 50%, 25%)`;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            for (let y = 0; y < this.height * 0.6; y += 15) {
                ctx.lineTo(x + Math.sin(y * 0.018 + this.time * 0.8 + i) * 35, y);
            }
            ctx.stroke();
        }
    }

    _drawJungleTree(x, y, scale) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#4a2a12';
        ctx.fillRect(-18, -190, 36, 190);

        const colors = ['#1a7a1a', '#228B22', '#2d8a3e', '#196619'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = colors[i % colors.length];
            const ox = (i % 2 === 0 ? -1 : 1) * 15;
            ctx.beginPath();
            ctx.arc(ox, -190 - i * 25, 65 - i * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    _drawFlowers() {
        const ctx = this.ctx;
        const flowers = ['🌺', '🌸', '🌼', '🦋'];
        ctx.font = '28px Arial';
        for (let i = 0; i < 10; i++) {
            const x = 80 + i * 190;
            const y = this.height * 0.78 + Math.sin(this.time + i) * 5;
            ctx.fillText(flowers[i % flowers.length], x, y);
        }
    }

    _drawCrystals() {
        const ctx = this.ctx;
        const crystalColors = ['#8338ec', '#06d6a0', '#ef476f', '#00b4d8', '#ffd700'];

        // Reduced from 18 to 8 crystals, removed per-crystal radial gradient glow
        for (let i = 0; i < 8; i++) {
            const x = (i * 250) % this.width;
            const y = 180 + (i * 120) % (this.height - 360);
            const h = 30 + (i * 17) % 60;
            const color = crystalColors[i % crystalColors.length];

            // Crystal body only (removed expensive per-crystal radial gradient glow)
            ctx.save();
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x, y - h);
            ctx.lineTo(x + h * 0.35, y);
            ctx.lineTo(x + h * 0.15, y + h * 0.4);
            ctx.lineTo(x - h * 0.15, y + h * 0.4);
            ctx.lineTo(x - h * 0.35, y);
            ctx.closePath();
            ctx.fill();

            // Highlight
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(x, y - h);
            ctx.lineTo(x + h * 0.1, y - h * 0.3);
            ctx.lineTo(x - h * 0.1, y - h * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    _drawEmbers() {
        // Only draw every other frame, reduced from 40 to 15
        if (this._frameCount % 2 !== 0) return;

        const ctx = this.ctx;
        const colors = ['#ff6b00', '#ffd700', '#ff4500', '#ff8c00'];
        for (let i = 0; i < 15; i++) {
            const x = (i * 133 + this.time * 45) % this.width;
            const y = this.height - ((i * 77 + this.time * 70) % this.height);
            const size = 1.5 + (i % 4) * 1.2;
            const alpha = 0.4 + Math.sin(this.time * 5 + i) * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    _drawRainbow(x, y) {
        const ctx = this.ctx;
        const colors = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#073b4c', '#8338ec'];
        ctx.save();
        ctx.globalAlpha = 0.25;
        colors.forEach((color, i) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 18;
            ctx.beginPath();
            ctx.arc(x + 500, y + 400, 520 - i * 22, Math.PI, 0);
            ctx.stroke();
        });
        ctx.restore();
    }

    _drawBigClouds() {
        const ctx = this.ctx;
        const cloudPositions = [
            { x: 200, y: 700, w: 350, h: 80 },
            { x: 600, y: 600, w: 400, h: 90 },
            { x: 1100, y: 650, w: 350, h: 70 },
            { x: 1500, y: 550, w: 380, h: 85 }
        ];

        cloudPositions.forEach((cloud, i) => {
            const y = cloud.y + Math.sin(this.time * 0.5 + i) * 15;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
            ctx.beginPath();
            ctx.ellipse(cloud.x, y, cloud.w / 2, cloud.h, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cloud.x - cloud.w * 0.2, y - cloud.h * 0.5, cloud.h * 0.7, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.w * 0.15, y - cloud.h * 0.6, cloud.h * 0.8, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    _drawCloudPlatform(x, y, w) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.beginPath();
        ctx.ellipse(x, y, w / 2, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x - w * 0.2, y - 20, 38, 0, Math.PI * 2);
        ctx.arc(x + w * 0.15, y - 28, 42, 0, Math.PI * 2);
        ctx.arc(x, y - 32, 40, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawStarField() {
        const ctx = this.ctx;
        this.stars.forEach(star => {
            const twinkle = 0.3 + Math.sin(this.time * star.speed + star.phase) * 0.35;
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            if (star.size > 2) {
                ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.2})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    _drawPlanet(x, y, r) {
        const ctx = this.ctx;
        ctx.save();

        const glow = ctx.createRadialGradient(x, y, r, x, y, r * 2.5);
        glow.addColorStop(0, 'rgba(131, 56, 236, 0.35)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);

        const planetGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        planetGrad.addColorStop(0, '#b070e0');
        planetGrad.addColorStop(0.5, '#7c3aad');
        planetGrad.addColorStop(0.8, '#5b2480');
        planetGrad.addColorStop(1, '#3d1560');
        ctx.fillStyle = planetGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Ring
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.9, r * 0.3, -0.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    _drawShootingStars() {
        const ctx = this.ctx;
        const phase = (this.time * 0.4) % 6;
        if (phase < 0.6) {
            const t = phase / 0.6;
            const x1 = 200 + t * 500;
            const y1 = 80 + t * 250;
            ctx.save();
            const grad = ctx.createLinearGradient(x1, y1, x1 - 80, y1 - 40);
            grad.addColorStop(0, `rgba(255, 255, 255, ${1 - t})`);
            grad.addColorStop(1, 'transparent');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 - 80, y1 - 40);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Island map overview - rich painted world
    drawIslandMap(progress) {
        const ctx = this.ctx;

        // Use cached ocean gradient
        ctx.fillStyle = this._cachedGradients.oceanMap;
        ctx.fillRect(0, 0, this.width, this.height);

        // Atmospheric light rays from sun
        this._drawLightRays(1750, 80, 0.04);
        this._drawSun(1750, 80, 70);
        this._drawClouds();

        // Draw actual island landmasses matching the zone positions
        this._drawMapIslands();

        // Ocean waves in foreground
        this._drawWater(this.height * 0.85);

        this._drawVignette(0.15);
        this._applyPostProcessing(0.05);
    }

    _drawMapIslands() {
        const ctx = this.ctx;
        const t = this.time;

        // Island definitions matching zone positions in ui-manager
        const islands = [
            { cx: 200, cy: 700, w: 280, h: 120, color1: '#f4d03f', color2: '#e6b030', name: 'beach' },
            { cx: 550, cy: 480, w: 300, h: 130, color1: '#2d6a4f', color2: '#1b4332', name: 'jungle' },
            { cx: 950, cy: 600, w: 260, h: 110, color1: '#4a3060', color2: '#2b2040', name: 'cave' },
            { cx: 1300, cy: 400, w: 290, h: 140, color1: '#8b0000', color2: '#5a0000', name: 'volcano' },
            { cx: 1050, cy: 200, w: 240, h: 100, color1: '#b0d4f1', color2: '#87ceeb', name: 'sky' },
            { cx: 1600, cy: 150, w: 250, h: 105, color1: '#1b263b', color2: '#0d1b2a', name: 'space' }
        ];

        islands.forEach((isl, i) => {
            ctx.save();

            // Ocean ring / water shadow under island
            const waterGlow = ctx.createRadialGradient(isl.cx, isl.cy + 15, isl.w * 0.3, isl.cx, isl.cy + 15, isl.w * 0.8);
            waterGlow.addColorStop(0, 'rgba(0, 60, 100, 0.3)');
            waterGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = waterGlow;
            ctx.fillRect(isl.cx - isl.w, isl.cy - isl.h, isl.w * 2, isl.h * 2.5);

            // Island base shape (irregular blob)
            const iGrad = ctx.createRadialGradient(isl.cx - 20, isl.cy - 20, 0, isl.cx, isl.cy, isl.w * 0.55);
            iGrad.addColorStop(0, isl.color1);
            iGrad.addColorStop(0.7, isl.color2);
            iGrad.addColorStop(1, isl.color2);
            ctx.fillStyle = iGrad;

            ctx.beginPath();
            // Organic shape using bezier curves
            const hw = isl.w * 0.5;
            const hh = isl.h * 0.5;
            ctx.moveTo(isl.cx - hw, isl.cy + hh * 0.2);
            ctx.bezierCurveTo(
                isl.cx - hw * 0.8, isl.cy - hh * 0.8,
                isl.cx - hw * 0.3, isl.cy - hh * 1.1,
                isl.cx, isl.cy - hh
            );
            ctx.bezierCurveTo(
                isl.cx + hw * 0.4, isl.cy - hh * 1.15,
                isl.cx + hw * 0.9, isl.cy - hh * 0.6,
                isl.cx + hw, isl.cy + hh * 0.15
            );
            ctx.bezierCurveTo(
                isl.cx + hw * 0.8, isl.cy + hh * 0.6,
                isl.cx + hw * 0.2, isl.cy + hh * 0.7,
                isl.cx, isl.cy + hh * 0.5
            );
            ctx.bezierCurveTo(
                isl.cx - hw * 0.3, isl.cy + hh * 0.65,
                isl.cx - hw * 0.7, isl.cy + hh * 0.55,
                isl.cx - hw, isl.cy + hh * 0.2
            );
            ctx.fill();

            // Shore line (lighter edge)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Highlight on top (3D depth)
            ctx.save();
            ctx.clip();
            const hlGrad = ctx.createLinearGradient(isl.cx, isl.cy - hh, isl.cx, isl.cy);
            hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            hlGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = hlGrad;
            ctx.fillRect(isl.cx - hw, isl.cy - hh * 1.2, isl.w, isl.h * 0.7);
            ctx.restore();

            // Per-island decorative details
            if (isl.name === 'beach') {
                // Tiny palm trees
                this._drawMiniPalmTree(ctx, isl.cx - 50, isl.cy - 40, 0.3);
                this._drawMiniPalmTree(ctx, isl.cx + 40, isl.cy - 35, 0.25);
            } else if (isl.name === 'jungle') {
                // Mini trees
                for (let j = 0; j < 4; j++) {
                    const tx = isl.cx - 60 + j * 35;
                    const ty = isl.cy - 50 + (j % 2) * 15;
                    ctx.fillStyle = `hsl(${130 + j * 10}, 50%, ${28 + j * 4}%)`;
                    ctx.beginPath();
                    ctx.arc(tx, ty, 18 - j * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (isl.name === 'volcano') {
                // Mini volcano cone
                ctx.fillStyle = '#3d0000';
                ctx.beginPath();
                ctx.moveTo(isl.cx - 35, isl.cy + 10);
                ctx.lineTo(isl.cx, isl.cy - 55);
                ctx.lineTo(isl.cx + 35, isl.cy + 10);
                ctx.fill();
                // Lava glow
                const lGlow = ctx.createRadialGradient(isl.cx, isl.cy - 50, 2, isl.cx, isl.cy - 50, 30);
                lGlow.addColorStop(0, 'rgba(255, 120, 0, 0.8)');
                lGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = lGlow;
                ctx.fillRect(isl.cx - 30, isl.cy - 80, 60, 60);
            } else if (isl.name === 'cave') {
                // Crystal glow
                const cGlow = ctx.createRadialGradient(isl.cx, isl.cy - 20, 5, isl.cx, isl.cy - 20, 50);
                cGlow.addColorStop(0, 'rgba(131, 56, 236, 0.5)');
                cGlow.addColorStop(0.5, 'rgba(131, 56, 236, 0.15)');
                cGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = cGlow;
                ctx.fillRect(isl.cx - 50, isl.cy - 70, 100, 100);
            } else if (isl.name === 'sky') {
                // Mini clouds
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath();
                ctx.arc(isl.cx - 20, isl.cy - 30, 15, 0, Math.PI * 2);
                ctx.arc(isl.cx + 10, isl.cy - 35, 12, 0, Math.PI * 2);
                ctx.arc(isl.cx + 35, isl.cy - 28, 10, 0, Math.PI * 2);
                ctx.fill();
            } else if (isl.name === 'space') {
                // Mini stars
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                for (let j = 0; j < 6; j++) {
                    const sx = isl.cx - 40 + j * 18;
                    const sy = isl.cy - 40 + (j * 11) % 30;
                    const twinkle = 0.3 + Math.sin(t * 3 + j * 1.5) * 0.3;
                    ctx.globalAlpha = twinkle;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            ctx.restore();
        });
    }

    _drawMiniPalmTree(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Trunk
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(-3, -5, 6, 40);

        // Leaves
        ctx.fillStyle = '#2d8b2d';
        ctx.beginPath();
        ctx.arc(0, -10, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a7a1a';
        ctx.beginPath();
        ctx.arc(-5, -15, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

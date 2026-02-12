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

        this._initClouds();
        this._initWaves();
        this._initStars();
    }

    _initClouds() {
        for (let i = 0; i < 10; i++) {
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
        for (let i = 0; i < 7; i++) {
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
        for (let i = 0; i < 200; i++) {
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
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.width + cloud.width) {
                cloud.x = -cloud.width;
            }
        });
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

        // Rich sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, '#6dd5ed');
        skyGrad.addColorStop(0.25, '#00b4d8');
        skyGrad.addColorStop(0.55, '#0077b6');
        skyGrad.addColorStop(0.8, '#023e8a');
        skyGrad.addColorStop(1, '#01226b');
        ctx.fillStyle = skyGrad;
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

        // Vignette
        this._drawVignette(0.25);
    }

    _drawFloatingDecorations() {
        const ctx = this.ctx;
        const t = this.time;

        // Floating bubbles
        for (let i = 0; i < 8; i++) {
            const x = 150 + i * 220 + Math.sin(t * 0.5 + i * 1.3) * 30;
            const y = 200 + Math.sin(t * 0.3 + i * 0.9) * 80;
            const size = 12 + Math.sin(t + i) * 4;
            const alpha = 0.15 + Math.sin(t * 0.7 + i) * 0.08;

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();

            // Bubble highlight
            ctx.beginPath();
            ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha + 0.1})`;
            ctx.fill();
            ctx.restore();
        }

        // Floating star shapes
        for (let i = 0; i < 5; i++) {
            const x = 200 + i * 350 + Math.sin(t * 0.4 + i * 2) * 40;
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

        const sky = ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, '#87ceeb');
        sky.addColorStop(0.4, '#48cae4');
        sky.addColorStop(0.7, '#ffd166');
        sky.addColorStop(1, '#f4a261');
        ctx.fillStyle = sky;
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

        // Sand sparkles
        ctx.save();
        for (let i = 0; i < 30; i++) {
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
    }

    // ========== JUNGLE ZONE ==========
    _drawJungle() {
        const ctx = this.ctx;

        const sky = ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, '#1b4332');
        sky.addColorStop(0.3, '#2d6a4f');
        sky.addColorStop(0.7, '#40916c');
        sky.addColorStop(1, '#1b4332');
        ctx.fillStyle = sky;
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

        // Fireflies
        ctx.save();
        for (let i = 0; i < 25; i++) {
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
        this._drawVignette(0.3);
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

        // Dust particles
        ctx.save();
        for (let i = 0; i < 40; i++) {
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
    }

    // ========== VOLCANO ==========
    _drawVolcano() {
        const ctx = this.ctx;

        const sky = ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, '#0a0000');
        sky.addColorStop(0.2, '#3a0000');
        sky.addColorStop(0.5, '#8b0000');
        sky.addColorStop(0.75, '#d00000');
        sky.addColorStop(1, '#faa307');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, this.width, this.height);

        // Heat shimmer
        ctx.save();
        ctx.globalAlpha = 0.03;
        for (let y = 0; y < this.height; y += 4) {
            const offset = Math.sin(y * 0.02 + this.time * 3) * 3;
            ctx.drawImage(this.canvas, offset, y, this.width, 2, 0, y, this.width, 2);
        }
        ctx.restore();

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
    }

    // ========== CLOUD KINGDOM ==========
    _drawSky() {
        const ctx = this.ctx;

        const sky = ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, '#e0f7ff');
        sky.addColorStop(0.3, '#87ceeb');
        sky.addColorStop(0.7, '#caf0f8');
        sky.addColorStop(1, '#e0f7ff');
        ctx.fillStyle = sky;
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
    }

    // ========== SPACE ==========
    _drawSpace() {
        const ctx = this.ctx;

        const bg = ctx.createLinearGradient(0, 0, 0, this.height);
        bg.addColorStop(0, '#050a18');
        bg.addColorStop(0.3, '#0d1b2a');
        bg.addColorStop(0.7, '#1b263b');
        bg.addColorStop(1, '#050a18');
        ctx.fillStyle = bg;
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
    }

    // ========== HELPER FUNCTIONS ==========

    _drawVignette(intensity) {
        const ctx = this.ctx;
        const vig = ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.width * 0.3,
            this.width / 2, this.height / 2, this.width * 0.75
        );
        vig.addColorStop(0, 'transparent');
        vig.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    _drawLightRays(x, y, alpha) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = alpha;
        for (let i = 0; i < 8; i++) {
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

        // Animated rays
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2 + this.time * 0.15;
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
        this.clouds.forEach(cloud => {
            ctx.save();
            ctx.globalAlpha = cloud.opacity;

            const cx = cloud.x;
            const cy = cloud.y;
            const w = cloud.width;
            const h = cloud.height;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.ellipse(cx, cy + h * 0.3, w * 0.4, h * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();

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
        });
    }

    _drawWater(startY) {
        const ctx = this.ctx;

        // Deep water gradient
        const waterGrad = ctx.createLinearGradient(0, startY, 0, this.height);
        waterGrad.addColorStop(0, 'rgba(0, 119, 182, 0.6)');
        waterGrad.addColorStop(0.3, 'rgba(0, 100, 160, 0.7)');
        waterGrad.addColorStop(1, 'rgba(2, 62, 138, 0.85)');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, startY, this.width, this.height - startY);

        // Animated wave layers
        this.waves.forEach(wave => {
            ctx.fillStyle = wave.color;
            ctx.beginPath();
            ctx.moveTo(0, startY + (wave.y - (this.height - 220)));
            for (let x = 0; x <= this.width; x += 8) {
                const y = startY + (wave.y - (this.height - 220)) +
                    Math.sin(x * wave.frequency + this.time * wave.speed) * wave.amplitude +
                    Math.sin(x * wave.frequency * 2.3 + this.time * wave.speed * 0.7) * wave.amplitude * 0.3;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(0, this.height);
            ctx.fill();
        });

        // Foam/sparkle highlights on water
        ctx.save();
        for (let i = 0; i < 20; i++) {
            const wx = (i * 103 + this.time * 20) % this.width;
            const wy = startY + 10 + (i * 17) % 60;
            const alpha = 0.15 + Math.sin(this.time * 3 + i * 0.9) * 0.15;
            ctx.globalAlpha = alpha;
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
        const ctx = this.ctx;
        for (let i = 0; i < 25; i++) {
            const x = ((i * 137 + this.time * 25) % this.width);
            const y = ((i * 97 + this.time * 8) % (this.height * 0.5));
            const size = 2 + Math.sin(this.time * 3 + i) * 2;
            const alpha = 0.3 + Math.sin(this.time * 4 + i * 0.5) * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.translate(x, y);
            ctx.rotate(this.time + i);
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

        for (let i = 0; i < 18; i++) {
            const x = (i * 117) % this.width;
            const y = 180 + (i * 73) % (this.height - 360);
            const h = 25 + (i * 17) % 70;
            const color = crystalColors[i % crystalColors.length];
            const glow = 0.3 + Math.sin(this.time * 2 + i * 1.1) * 0.2;

            // Crystal glow
            ctx.save();
            ctx.globalAlpha = glow;
            const cGlow = ctx.createRadialGradient(x, y, 0, x, y, h * 2.5);
            cGlow.addColorStop(0, color);
            cGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = cGlow;
            ctx.fillRect(x - h * 2.5, y - h * 2.5, h * 5, h * 5);
            ctx.restore();

            // Crystal body
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
        const ctx = this.ctx;
        const colors = ['#ff6b00', '#ffd700', '#ff4500', '#ff8c00'];
        for (let i = 0; i < 40; i++) {
            const x = (i * 53 + this.time * 45) % this.width;
            const y = this.height - ((i * 37 + this.time * 70) % this.height);
            const size = 1.5 + (i % 4) * 1.2;
            const alpha = 0.4 + Math.sin(this.time * 5 + i) * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            // Ember glow
            ctx.globalAlpha = alpha * 0.3;
            ctx.beginPath();
            ctx.arc(x, y, size * 3, 0, Math.PI * 2);
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

    // Island map overview
    drawIslandMap(progress) {
        const ctx = this.ctx;
        const ocean = ctx.createLinearGradient(0, 0, 0, this.height);
        ocean.addColorStop(0, '#87ceeb');
        ocean.addColorStop(0.3, '#48cae4');
        ocean.addColorStop(0.7, '#0077b6');
        ocean.addColorStop(1, '#023e8a');
        ctx.fillStyle = ocean;
        ctx.fillRect(0, 0, this.width, this.height);

        this._drawSun(1700, 100, 80);
        this._drawClouds();
        this._drawWater(this.height * 0.82);
        this._drawVignette(0.15);
    }
}

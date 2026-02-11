/* ========================================
   MATH ISLAND - Island & Background Renderer
   Procedural canvas-based environments
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
        this.decorations = [];

        this._initClouds();
        this._initWaves();
    }

    _initClouds() {
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Utils.randomFloat(0, this.width),
                y: Utils.randomFloat(30, 250),
                width: Utils.randomFloat(120, 300),
                height: Utils.randomFloat(40, 80),
                speed: Utils.randomFloat(0.2, 0.8),
                opacity: Utils.randomFloat(0.4, 0.9)
            });
        }
    }

    _initWaves() {
        for (let i = 0; i < 5; i++) {
            this.waves.push({
                y: this.height - 200 + i * 40,
                amplitude: 8 + i * 3,
                frequency: 0.005 + i * 0.002,
                speed: 0.5 + i * 0.3,
                color: `rgba(0, ${130 + i * 25}, ${200 + i * 10}, ${0.3 + i * 0.1})`
            });
        }
    }

    update(dt) {
        this.time += dt;

        // Move clouds
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.width + cloud.width) {
                cloud.x = -cloud.width;
            }
        });
    }

    // Draw scene for a specific zone
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

    // Draw menu background
    drawMenuBackground() {
        const ctx = this.ctx;

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, '#87ceeb');
        skyGrad.addColorStop(0.4, '#00b4d8');
        skyGrad.addColorStop(0.7, '#0077b6');
        skyGrad.addColorStop(1, '#023e8a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Sun
        this._drawSun(1600, 150, 100);

        // Clouds
        this._drawClouds();

        // Island in distance
        this._drawIslandSilhouette(960, 500, 800, 300);

        // Water
        this._drawWater(600);

        // Decorative elements
        this._drawPalmTree(200, 550, 0.7);
        this._drawPalmTree(1700, 520, 0.8);

        // Animated sparkles
        this._drawSparkles();
    }

    // ---- Beach Zone ----
    _drawBeach() {
        const ctx = this.ctx;

        // Sky
        const sky = ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, '#87ceeb');
        sky.addColorStop(0.5, '#48cae4');
        sky.addColorStop(1, '#ffd166');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, this.width, this.height);

        this._drawSun(1500, 180, 120);
        this._drawClouds();

        // Sand
        const sandGrad = ctx.createLinearGradient(0, this.height * 0.6, 0, this.height);
        sandGrad.addColorStop(0, '#f4d03f');
        sandGrad.addColorStop(0.3, '#ffd166');
        sandGrad.addColorStop(1, '#f0c040');
        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        ctx.moveTo(0, this.height * 0.65);
        for (let x = 0; x <= this.width; x += 20) {
            ctx.lineTo(x, this.height * 0.65 + Math.sin(x * 0.01 + this.time) * 10);
        }
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.fill();

        // Water
        this._drawWater(this.height * 0.6);

        // Palm trees
        this._drawPalmTree(150, this.height * 0.55, 1);
        this._drawPalmTree(1750, this.height * 0.52, 1.1);

        // Shells
        this._drawShells();
    }

    // ---- Jungle Zone ----
    _drawJungle() {
        const ctx = this.ctx;

        // Dense canopy sky
        const sky = ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, '#2d6a4f');
        sky.addColorStop(0.3, '#40916c');
        sky.addColorStop(1, '#1b4332');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, this.width, this.height);

        // Sun beams through canopy
        ctx.save();
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 5; i++) {
            const x = 300 + i * 300;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x - 100, this.height);
            ctx.lineTo(x + 100, this.height);
            ctx.fill();
        }
        ctx.restore();

        // Ground
        ctx.fillStyle = '#2d6a4f';
        ctx.fillRect(0, this.height * 0.75, this.width, this.height * 0.25);

        // Vines
        this._drawVines();

        // Trees
        for (let i = 0; i < 6; i++) {
            this._drawJungleTree(i * 350 + 100, this.height * 0.7, 0.8 + Math.random() * 0.4);
        }

        // Flowers
        this._drawFlowers();
    }

    // ---- Crystal Cave ----
    _drawCave() {
        const ctx = this.ctx;

        // Dark cave background
        const bg = ctx.createRadialGradient(960, 540, 100, 960, 540, 900);
        bg.addColorStop(0, '#2b2d42');
        bg.addColorStop(0.5, '#1a1a2e');
        bg.addColorStop(1, '#0d0d1a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // Glowing crystals
        this._drawCrystals();

        // Cave walls (stalactites)
        ctx.fillStyle = '#1a1a2e';
        for (let i = 0; i < 15; i++) {
            const x = i * 140 + Utils.randomFloat(-20, 20);
            const h = Utils.randomFloat(50, 200);
            ctx.beginPath();
            ctx.moveTo(x - 30, 0);
            ctx.lineTo(x, h);
            ctx.lineTo(x + 30, 0);
            ctx.fill();
        }

        // Stalagmites
        for (let i = 0; i < 12; i++) {
            const x = i * 170 + 50;
            const h = Utils.randomFloat(40, 150);
            ctx.beginPath();
            ctx.moveTo(x - 25, this.height);
            ctx.lineTo(x, this.height - h);
            ctx.lineTo(x + 25, this.height);
            ctx.fill();
        }

        // Ambient glow
        ctx.save();
        ctx.globalAlpha = 0.05 + Math.sin(this.time * 2) * 0.02;
        const glow = ctx.createRadialGradient(960, 540, 0, 960, 540, 600);
        glow.addColorStop(0, '#8338ec');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }

    // ---- Volcano ----
    _drawVolcano() {
        const ctx = this.ctx;

        // Fiery sky
        const sky = ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, '#1a0000');
        sky.addColorStop(0.3, '#4a0000');
        sky.addColorStop(0.6, '#d00000');
        sky.addColorStop(1, '#faa307');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, this.width, this.height);

        // Volcano shape
        ctx.fillStyle = '#3d0000';
        ctx.beginPath();
        ctx.moveTo(600, this.height);
        ctx.lineTo(800, 200);
        ctx.lineTo(960, 150);
        ctx.lineTo(1120, 200);
        ctx.lineTo(1320, this.height);
        ctx.fill();

        // Lava glow at top
        ctx.save();
        const lavaGlow = ctx.createRadialGradient(960, 170, 10, 960, 170, 200);
        lavaGlow.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        lavaGlow.addColorStop(0.5, 'rgba(255, 50, 0, 0.3)');
        lavaGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = lavaGlow;
        ctx.fillRect(700, 0, 520, 400);
        ctx.restore();

        // Lava rivers
        ctx.strokeStyle = '#ff6b00';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(920, 180);
        const lavaOffset = Math.sin(this.time * 3) * 5;
        ctx.bezierCurveTo(880 + lavaOffset, 400, 750, 600, 700, this.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(1000, 180);
        ctx.bezierCurveTo(1050 - lavaOffset, 400, 1150, 600, 1200, this.height);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Embers
        this._drawEmbers();
    }

    // ---- Cloud Kingdom ----
    _drawSky() {
        const ctx = this.ctx;

        // Bright sky
        const sky = ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, '#e0f7ff');
        sky.addColorStop(0.5, '#87ceeb');
        sky.addColorStop(1, '#caf0f8');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, this.width, this.height);

        // Rainbow
        this._drawRainbow(400, 300);

        // Big fluffy clouds
        this._drawBigClouds();

        // Cloud platforms
        for (let i = 0; i < 5; i++) {
            const x = 200 + i * 350;
            const y = 500 + Math.sin(this.time + i) * 30;
            this._drawCloudPlatform(x, y, 200 + i * 20);
        }

        this._drawSun(1600, 120, 100);
    }

    // ---- Space ----
    _drawSpace() {
        const ctx = this.ctx;

        // Deep space
        const bg = ctx.createLinearGradient(0, 0, 0, this.height);
        bg.addColorStop(0, '#0d1b2a');
        bg.addColorStop(0.5, '#1b263b');
        bg.addColorStop(1, '#0d1b2a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // Stars
        this._drawStarField();

        // Nebula
        ctx.save();
        ctx.globalAlpha = 0.15;
        const nebula = ctx.createRadialGradient(700, 400, 50, 700, 400, 400);
        nebula.addColorStop(0, '#8338ec');
        nebula.addColorStop(0.5, '#ef476f');
        nebula.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();

        // Planet
        this._drawPlanet(1400, 350, 120);

        // Shooting stars
        this._drawShootingStars();
    }

    // ---- Helper drawing functions ----

    _drawSun(x, y, r) {
        const ctx = this.ctx;
        ctx.save();

        // Glow
        const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3);
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        glow.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);

        // Sun body
        const sunGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
        sunGrad.addColorStop(0, '#fff7b2');
        sunGrad.addColorStop(0.7, '#ffd700');
        sunGrad.addColorStop(1, '#ffaa00');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Rays
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + this.time * 0.2;
            const inner = r * 1.2;
            const outer = r * 1.8 + Math.sin(this.time * 2 + i) * 10;
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
            ctx.fillStyle = 'white';

            // Cloud shape using circles
            const cx = cloud.x;
            const cy = cloud.y;
            const w = cloud.width;
            const h = cloud.height;

            ctx.beginPath();
            ctx.arc(cx, cy, h * 0.6, 0, Math.PI * 2);
            ctx.arc(cx - w * 0.25, cy + h * 0.15, h * 0.45, 0, Math.PI * 2);
            ctx.arc(cx + w * 0.25, cy + h * 0.1, h * 0.5, 0, Math.PI * 2);
            ctx.arc(cx + w * 0.1, cy - h * 0.1, h * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    _drawWater(startY) {
        const ctx = this.ctx;
        this.waves.forEach(wave => {
            ctx.fillStyle = wave.color;
            ctx.beginPath();
            ctx.moveTo(0, startY + (wave.y - (this.height - 200)));
            for (let x = 0; x <= this.width; x += 10) {
                const y = startY + (wave.y - (this.height - 200)) +
                    Math.sin(x * wave.frequency + this.time * wave.speed) * wave.amplitude;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(0, this.height);
            ctx.fill();
        });
    }

    _drawPalmTree(x, y, scale) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Trunk
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        const sway = Math.sin(this.time * 1.5) * 5;
        ctx.quadraticCurveTo(-8 + sway, -100, 0 + sway * 1.5, -200);
        ctx.quadraticCurveTo(8 + sway, -100, 12, 0);
        ctx.fill();

        // Trunk texture
        ctx.strokeStyle = '#6B4F12';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const ty = -i * 25;
            const tx = sway * (i / 8);
            ctx.beginPath();
            ctx.arc(tx, ty, 14 - i, 0, Math.PI);
            ctx.stroke();
        }

        // Leaves
        const leafTop = -200 + sway * 1.5;
        const leaves = [
            { angle: -0.5, len: 120 },
            { angle: -1.2, len: 100 },
            { angle: 0.3, len: 110 },
            { angle: 1.0, len: 95 },
            { angle: -2.0, len: 80 },
            { angle: 1.8, len: 85 }
        ];

        leaves.forEach(leaf => {
            const la = leaf.angle + Math.sin(this.time * 2) * 0.05;
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.moveTo(sway * 1.5, leafTop);
            ctx.quadraticCurveTo(
                Math.cos(la) * leaf.len * 0.5 + sway * 1.5,
                leafTop + Math.sin(la) * leaf.len * 0.5 - 20,
                Math.cos(la) * leaf.len + sway * 1.5,
                leafTop + Math.sin(la) * leaf.len
            );
            ctx.quadraticCurveTo(
                Math.cos(la) * leaf.len * 0.5 + sway * 1.5,
                leafTop + Math.sin(la) * leaf.len * 0.5 + 10,
                sway * 1.5,
                leafTop
            );
            ctx.fill();
        });

        // Coconuts
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(sway * 1.5 - 8, leafTop + 15, 8, 0, Math.PI * 2);
        ctx.arc(sway * 1.5 + 8, leafTop + 18, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _drawIslandSilhouette(x, y, w, h) {
        const ctx = this.ctx;
        ctx.save();

        // Island body
        const islandGrad = ctx.createLinearGradient(x, y - h * 0.3, x, y + h * 0.3);
        islandGrad.addColorStop(0, '#06d6a0');
        islandGrad.addColorStop(0.7, '#2d6a4f');
        islandGrad.addColorStop(1, '#f4d03f');

        ctx.fillStyle = islandGrad;
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y);
        ctx.bezierCurveTo(x - w * 0.4, y - h * 0.8, x - w * 0.1, y - h, x, y - h * 0.9);
        ctx.bezierCurveTo(x + w * 0.15, y - h * 1.1, x + w * 0.3, y - h * 0.5, x + w / 2, y);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    _drawSparkles() {
        const ctx = this.ctx;
        for (let i = 0; i < 20; i++) {
            const x = ((i * 137 + this.time * 30) % this.width);
            const y = ((i * 97 + this.time * 10) % (this.height * 0.5));
            const size = 2 + Math.sin(this.time * 3 + i) * 2;
            const alpha = 0.3 + Math.sin(this.time * 4 + i * 0.5) * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.translate(x, y);
            ctx.rotate(this.time + i);
            // 4-point star
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
        ctx.strokeStyle = '#2d6a4f';
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
            const x = i * 260 + 80;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            for (let y = 0; y < this.height * 0.6; y += 20) {
                ctx.lineTo(x + Math.sin(y * 0.02 + this.time + i) * 30, y);
            }
            ctx.stroke();
        }
    }

    _drawJungleTree(x, y, scale) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Trunk
        ctx.fillStyle = '#5c3d1e';
        ctx.fillRect(-15, -180, 30, 180);

        // Canopy
        const colors = ['#228B22', '#2d6a4f', '#40916c'];
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = colors[i];
            ctx.beginPath();
            ctx.arc(Utils.randomFloat(-20, 20), -180 - i * 30, 60 - i * 5, 0, Math.PI * 2);
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

        for (let i = 0; i < 15; i++) {
            const x = (i * 137) % this.width;
            const y = 200 + (i * 73) % (this.height - 400);
            const h = 30 + (i * 17) % 60;
            const color = crystalColors[i % crystalColors.length];
            const glow = 0.3 + Math.sin(this.time * 2 + i) * 0.2;

            ctx.save();
            ctx.globalAlpha = glow;
            const cGlow = ctx.createRadialGradient(x, y, 0, x, y, h * 2);
            cGlow.addColorStop(0, color);
            cGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = cGlow;
            ctx.fillRect(x - h * 2, y - h * 2, h * 4, h * 4);
            ctx.restore();

            // Crystal shape
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(x, y - h);
            ctx.lineTo(x + h * 0.3, y);
            ctx.lineTo(x, y + h * 0.3);
            ctx.lineTo(x - h * 0.3, y);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    _drawEmbers() {
        const ctx = this.ctx;
        for (let i = 0; i < 30; i++) {
            const x = ((i * 67 + this.time * 50) % this.width);
            const y = this.height - ((i * 43 + this.time * 80) % this.height);
            const size = 2 + Math.random() * 3;
            const alpha = 0.3 + Math.sin(this.time * 5 + i) * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = Utils.randomChoice(['#ff6b00', '#ffd700', '#ff4500']);
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
        ctx.globalAlpha = 0.3;
        colors.forEach((color, i) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.arc(x + 500, y + 400, 500 - i * 20, Math.PI, 0);
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
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.ellipse(cloud.x, y, cloud.w / 2, cloud.h, 0, 0, Math.PI * 2);
            ctx.fill();
            // Top bumps
            ctx.beginPath();
            ctx.arc(cloud.x - cloud.w * 0.2, y - cloud.h * 0.5, cloud.h * 0.7, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.w * 0.15, y - cloud.h * 0.6, cloud.h * 0.8, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    _drawCloudPlatform(x, y, w) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.ellipse(x, y, w / 2, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x - w * 0.2, y - 20, 35, 0, Math.PI * 2);
        ctx.arc(x + w * 0.15, y - 25, 40, 0, Math.PI * 2);
        ctx.arc(x, y - 30, 38, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawStarField() {
        const ctx = this.ctx;
        // Fixed stars based on index (deterministic)
        for (let i = 0; i < 150; i++) {
            const x = (i * 13.7) % this.width;
            const y = (i * 9.3) % this.height;
            const size = 1 + (i % 3);
            const twinkle = 0.3 + Math.sin(this.time * 2 + i * 0.7) * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawPlanet(x, y, r) {
        const ctx = this.ctx;
        ctx.save();

        // Planet glow
        const glow = ctx.createRadialGradient(x, y, r, x, y, r * 2);
        glow.addColorStop(0, 'rgba(131, 56, 236, 0.3)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);

        // Planet body
        const planetGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        planetGrad.addColorStop(0, '#9b59b6');
        planetGrad.addColorStop(0.7, '#6c3483');
        planetGrad.addColorStop(1, '#4a235a');
        ctx.fillStyle = planetGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Ring
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.8, r * 0.3, -0.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    _drawShootingStars() {
        const ctx = this.ctx;
        const phase = (this.time * 0.5) % 5;
        if (phase < 0.5) {
            const t = phase / 0.5;
            const x1 = 200 + t * 400;
            const y1 = 100 + t * 200;
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - t})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 - 60, y1 - 30);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Draw the island map overview
    drawIslandMap(progress) {
        const ctx = this.ctx;

        // Ocean background
        const ocean = ctx.createLinearGradient(0, 0, 0, this.height);
        ocean.addColorStop(0, '#87ceeb');
        ocean.addColorStop(0.3, '#48cae4');
        ocean.addColorStop(1, '#0077b6');
        ctx.fillStyle = ocean;
        ctx.fillRect(0, 0, this.width, this.height);

        this._drawSun(1700, 100, 80);
        this._drawClouds();
        this._drawWater(this.height * 0.85);
    }
}

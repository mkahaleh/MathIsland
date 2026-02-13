/* ========================================
   MATH ISLAND - Particle System
   Canvas-based particle effects
   Upgraded with ambient zones, trails,
   new shapes, combo fire, achievements,
   character powers, and more.
   ======================================== */

class Particle {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.vx = config.vx || Utils.randomFloat(-2, 2);
        this.vy = config.vy || Utils.randomFloat(-5, -2);
        this.life = config.life || 1;
        this.maxLife = this.life;
        this.size = config.size || Utils.randomFloat(3, 8);
        this.color = config.color || '#ffd700';
        this.gravity = config.gravity !== undefined ? config.gravity : 0.1;
        this.friction = config.friction || 0.99;
        this.shape = config.shape || 'circle'; // circle, star, square, text, heart, diamond
        this.text = config.text || '';
        this.rotation = config.rotation !== undefined ? config.rotation : Utils.randomFloat(0, Math.PI * 2);
        this.rotationSpeed = config.rotationSpeed !== undefined ? config.rotationSpeed : Utils.randomFloat(-0.1, 0.1);
        this.scale = 1;
        this.fadeStart = config.fadeStart || 0.5;

        // Trail support
        this.trail = config.trail || false;
        this.trailPositions = [];
        this.trailMaxLength = config.trailMaxLength || 6;
        this.trailInterval = config.trailInterval || 0.02;
        this.trailTimer = 0;

        // Twinkle support for sparkle effects
        this.twinkle = config.twinkle || false;
        this.twinkleSpeed = config.twinkleSpeed || Utils.randomFloat(6, 14);
        this.twinklePhase = Utils.randomFloat(0, Math.PI * 2);

        // Glow support
        this.glow = config.glow || false;
        this.glowSize = config.glowSize || 0;
    }

    update(dt) {
        // Store trail position before moving
        if (this.trail) {
            this.trailTimer += dt;
            if (this.trailTimer >= this.trailInterval) {
                this.trailTimer = 0;
                this.trailPositions.push({
                    x: this.x,
                    y: this.y,
                    size: this.size * this.scale,
                    life: this.life / this.maxLife
                });
                if (this.trailPositions.length > this.trailMaxLength) {
                    this.trailPositions.shift();
                }
            }
        }

        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= dt;
        this.rotation += this.rotationSpeed;

        const lifeRatio = this.life / this.maxLife;
        if (lifeRatio < this.fadeStart) {
            this.scale = lifeRatio / this.fadeStart;
        }
    }

    draw(ctx) {
        if (this.life <= 0) return;

        const alpha = Math.max(0, this.life / this.maxLife);

        // Draw trail first (behind the main particle)
        if (this.trail && this.trailPositions.length > 0) {
            for (let i = 0; i < this.trailPositions.length; i++) {
                const t = this.trailPositions[i];
                const trailAlpha = (i / this.trailPositions.length) * alpha * 0.4;
                const trailSize = t.size * (i / this.trailPositions.length) * 0.7;
                ctx.save();
                ctx.globalAlpha = trailAlpha;
                ctx.translate(t.x, t.y);
                ctx.beginPath();
                ctx.fillStyle = this.color;
                ctx.arc(0, 0, Math.max(1, trailSize), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // Twinkle modulation
        let twinkleMod = 1;
        if (this.twinkle) {
            const elapsed = (this.maxLife - this.life);
            twinkleMod = 0.4 + 0.6 * Math.abs(Math.sin(elapsed * this.twinkleSpeed + this.twinklePhase));
        }

        ctx.save();
        ctx.globalAlpha = alpha * twinkleMod;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        // Glow disabled for Smart TV performance (shadowBlur is expensive)
        // if (this.glow && this.glowSize > 0) {
        //     ctx.shadowColor = this.color;
        //     ctx.shadowBlur = this.glowSize * this.scale;
        // }

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'star') {
            this._drawStar(ctx, 5, this.size, this.size / 2);
        } else if (this.shape === 'square') {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else if (this.shape === 'text') {
            ctx.fillStyle = this.color;
            ctx.font = `bold ${this.size * 4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.text, 0, 0);
        } else if (this.shape === 'heart') {
            this._drawHeart(ctx, this.size);
        } else if (this.shape === 'diamond') {
            this._drawDiamond(ctx, this.size);
        }

        ctx.restore();
    }

    _drawStar(ctx, points, outerR, innerR) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    _drawHeart(ctx, size) {
        const s = size * 0.9;
        ctx.beginPath();
        ctx.fillStyle = this.color;
        // Heart shape using bezier curves
        ctx.moveTo(0, s * 0.4);
        ctx.bezierCurveTo(-s, -s * 0.3, -s * 0.5, -s, 0, -s * 0.4);
        ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.3, 0, s * 0.4);
        ctx.closePath();
        ctx.fill();
    }

    _drawDiamond(ctx, size) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.6, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
    }

    get isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.emitters = [];
        this.running = true;
        this.lastTime = performance.now();
        this.MAX_PARTICLES = 100; // Reduced from 300 for Smart TV performance

        // Ambient system state
        this._ambientInterval = null;
        this._ambientZone = null;

        // Canvas dimensions (Samsung Smart TV)
        this.width = 1920;
        this.height = 1080;

        this._animate = this._animate.bind(this);
        requestAnimationFrame(this._animate);
    }

    _animate(now) {
        if (!this.running) return;
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        // Performance: skip frame if no particles or emitters active
        if (this.particles.length === 0 && this.emitters.length === 0) {
            requestAnimationFrame(this._animate);
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Performance: cap particle count for TV hardware
        if (this.particles.length > this.MAX_PARTICLES) {
            this.particles.length = this.MAX_PARTICLES;
        }

        // Update emitters
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];
            emitter.update(dt, this);
            if (emitter.isDead) {
                this.emitters.splice(i, 1);
            }
        }

        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (p.isDead) {
                this.particles.splice(i, 1);
            } else {
                p.draw(this.ctx);
            }
        }

        requestAnimationFrame(this._animate);
    }

    emit(x, y, count, config) {
        for (let i = 0; i < count; i++) {
            // Support callable config values for per-particle variation
            const resolved = {};
            for (const key in config) {
                resolved[key] = typeof config[key] === 'function' ? config[key]() : config[key];
            }
            this.particles.push(new Particle(
                x + Utils.randomFloat(-10, 10),
                y + Utils.randomFloat(-10, 10),
                resolved
            ));
        }
    }

    // ========================================
    //  EXISTING EFFECTS (Enhanced)
    // ========================================

    // Correct answer celebration - enhanced with score text
    correctBurst(x, y, scoreText) {
        const colors = ['#06d6a0', '#ffd166', '#00b4d8', '#ffffff'];

        // Main burst particles - reduced from 30 to 12
        for (let i = 0; i < 12; i++) {
            this.particles.push(new Particle(
                x + Utils.randomFloat(-20, 20),
                y + Utils.randomFloat(-20, 20),
                {
                    vx: Utils.randomFloat(-8, 8),
                    vy: Utils.randomFloat(-10, -2),
                    size: Utils.randomFloat(4, 10),
                    color: Utils.randomChoice(colors),
                    life: 1.2,
                    shape: Utils.randomChoice(['star', 'circle']),
                    gravity: 0.15
                }
            ));
        }

        // Score text particle floating upward (if score provided)
        if (scoreText) {
            this.particles.push(new Particle(x, y - 20, {
                vx: 0,
                vy: -2.5,
                size: 8,
                color: '#ffffff',
                life: 1.8,
                shape: 'text',
                text: scoreText,
                gravity: -0.02,
                friction: 0.98,
                fadeStart: 0.4,
                rotationSpeed: 0,
                rotation: 0
            }));
        }
    }

    // Wrong answer effect
    wrongShake(x, y) {
        const color = '#ef476f';
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(
                x + Utils.randomFloat(-30, 30),
                y + Utils.randomFloat(-30, 30),
                {
                    vx: Utils.randomFloat(-3, 3),
                    vy: Utils.randomFloat(-3, 3),
                    size: Utils.randomFloat(3, 6),
                    color: color,
                    life: 0.6,
                    shape: 'circle',
                    gravity: 0
                }
            ));
        }
    }

    // Star collection - enhanced with expanding rings
    starExplosion(x, y) {
        const colors = ['#ffd700', '#ffed4a', '#fff7b2', '#ffffff'];

        // Main radial burst - reduced from 50 to 16
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const speed = Utils.randomFloat(3, 10);
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(5, 12),
                color: Utils.randomChoice(colors),
                life: 1.5,
                shape: 'star',
                gravity: 0.05,
                friction: 0.97,
                trail: true,
                trailMaxLength: 4
            }));
        }

        // Inner ring - reduced from 24 to 8
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 12;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(3, 6),
                color: '#ffffff',
                life: 0.5,
                shape: 'circle',
                gravity: 0,
                friction: 0.94,
                glow: true,
                glowSize: 8
            }));
        }

        // Outer ring - reduced from 16 to 6
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const speed = 6;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(6, 10),
                color: '#ffd700',
                life: 1.0,
                shape: 'star',
                gravity: 0,
                friction: 0.96,
                glow: true,
                glowSize: 12
            }));
        }
    }

    // Streak fire particles
    streakFire(x, y) {
        const colors = ['#ff6b35', '#ffd700', '#ff4500', '#ff8c00'];
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, {
                vx: Utils.randomFloat(-2, 2),
                vy: Utils.randomFloat(-4, -1),
                size: Utils.randomFloat(3, 8),
                color: Utils.randomChoice(colors),
                life: 0.5,
                shape: 'circle',
                gravity: -0.1
            }));
        }
    }

    // Level complete confetti - enhanced with hearts and diamonds
    confetti(duration = 3000) {
        const colors = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#8338ec', '#ff6b35'];
        const shapes = ['square', 'circle', 'heart', 'diamond'];
        const interval = setInterval(() => {
            // Reduced from 5 to 2 confetti per tick
            for (let i = 0; i < 2; i++) {
                this.particles.push(new Particle(
                    Utils.randomFloat(0, this.width),
                    -20,
                    {
                        vx: Utils.randomFloat(-2, 2),
                        vy: Utils.randomFloat(2, 6),
                        size: Utils.randomFloat(6, 14),
                        color: Utils.randomChoice(colors),
                        life: 4,
                        shape: Utils.randomChoice(shapes),
                        gravity: 0.05,
                        rotationSpeed: Utils.randomFloat(-0.2, 0.2),
                        friction: 0.995
                    }
                ));
            }
        }, 50);

        setTimeout(() => clearInterval(interval), duration);
    }

    // Floating bubbles for underwater theme
    bubbles(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(
                x + Utils.randomFloat(-50, 50),
                y,
                {
                    vx: Utils.randomFloat(-1, 1),
                    vy: Utils.randomFloat(-3, -1),
                    size: Utils.randomFloat(4, 15),
                    color: 'rgba(255, 255, 255, 0.4)',
                    life: 3,
                    shape: 'circle',
                    gravity: -0.02
                }
            ));
        }
    }

    // ========================================
    //  NEW EFFECTS
    // ========================================

    // --- 1. Character Power Effects ---
    // Radial burst when a character power activates (hint, shield, score multiplier, etc.)
    powerActivate(x, y, color) {
        const baseColor = color || '#a855f7';

        // Inner radial burst of colored particles
        for (let i = 0; i < 36; i++) {
            const angle = (i / 36) * Math.PI * 2;
            const speed = Utils.randomFloat(5, 12);
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(4, 9),
                color: baseColor,
                life: 1.0,
                shape: Utils.randomChoice(['circle', 'star']),
                gravity: 0,
                friction: 0.95,
                trail: true,
                trailMaxLength: 5,
                glow: true,
                glowSize: 10
            }));
        }

        // Expanding ring of particles
        for (let ring = 0; ring < 2; ring++) {
            const ringDelay = ring * 0.15;
            const ringSpeed = 8 + ring * 4;
            const particleCount = 20 + ring * 10;
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                this.particles.push(new Particle(x, y, {
                    vx: Math.cos(angle) * ringSpeed,
                    vy: Math.sin(angle) * ringSpeed,
                    size: Utils.randomFloat(2, 5),
                    color: '#ffffff',
                    life: 0.6 + ringDelay,
                    shape: 'circle',
                    gravity: 0,
                    friction: 0.93,
                    glow: true,
                    glowSize: 6
                }));
            }
        }

        // Central flash - a brief large white circle
        this.particles.push(new Particle(x, y, {
            vx: 0,
            vy: 0,
            size: 30,
            color: '#ffffff',
            life: 0.3,
            shape: 'circle',
            gravity: 0,
            friction: 1,
            fadeStart: 0.9,
            rotationSpeed: 0,
            glow: true,
            glowSize: 30
        }));
    }

    // --- 2. Hint Sparkle ---
    // Magical sparkle trail around hint button or eliminated answers
    hintSparkle(x, y) {
        const colors = ['#ffd700', '#fffacd', '#ffffff', '#ffe066'];
        for (let i = 0; i < 20; i++) {
            const angle = Utils.randomFloat(0, Math.PI * 2);
            const dist = Utils.randomFloat(0, 40);
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;
            this.particles.push(new Particle(px, py, {
                vx: Utils.randomFloat(-1.5, 1.5),
                vy: Utils.randomFloat(-2.5, -0.5),
                size: Utils.randomFloat(2, 6),
                color: Utils.randomChoice(colors),
                life: Utils.randomFloat(0.8, 1.8),
                shape: Utils.randomChoice(['star', 'circle', 'diamond']),
                gravity: -0.03,
                friction: 0.98,
                twinkle: true,
                twinkleSpeed: Utils.randomFloat(8, 16),
                glow: true,
                glowSize: 6,
                rotationSpeed: Utils.randomFloat(-0.15, 0.15)
            }));
        }
    }

    // --- 3. Combo Fire ---
    // Intense fire effect that scales with combo count
    comboFire(x, y, count) {
        const combo = Utils.clamp(count || 1, 1, 20);
        const intensity = Math.min(combo / 5, 1); // 0..1 scaling, maxes at 5
        const particleCount = 10 + Math.floor(combo * 4);
        const maxSpeed = 4 + combo * 1.5;
        const maxSize = 5 + combo * 1.2;

        // Fire colors - hotter colors at higher combos
        const fireColors = ['#ff4500', '#ff6b35', '#ff8c00', '#ffa500', '#ffd700'];
        // At high combos, add white center
        if (combo >= 5) {
            fireColors.push('#ffffff', '#ffffcc');
        }

        for (let i = 0; i < particleCount; i++) {
            const isCenter = i < particleCount * 0.2;
            this.particles.push(new Particle(
                x + Utils.randomFloat(-15 - combo * 2, 15 + combo * 2),
                y + Utils.randomFloat(-5, 5),
                {
                    vx: Utils.randomFloat(-maxSpeed * 0.4, maxSpeed * 0.4),
                    vy: Utils.randomFloat(-maxSpeed, -maxSpeed * 0.3),
                    size: isCenter
                        ? Utils.randomFloat(maxSize * 0.5, maxSize)
                        : Utils.randomFloat(2, maxSize * 0.7),
                    color: isCenter && combo >= 5
                        ? Utils.randomChoice(['#ffffff', '#ffffcc'])
                        : Utils.randomChoice(fireColors),
                    life: Utils.randomFloat(0.3, 0.7 + intensity * 0.5),
                    shape: 'circle',
                    gravity: -0.15 - intensity * 0.1,
                    friction: 0.97,
                    trail: combo >= 3,
                    trailMaxLength: Math.min(combo, 8),
                    glow: combo >= 4,
                    glowSize: combo >= 4 ? 6 + combo : 0
                }
            ));
        }

        // Ember sparks shooting out at higher combos
        if (combo >= 3) {
            const sparkCount = Math.floor(combo * 1.5);
            for (let i = 0; i < sparkCount; i++) {
                this.particles.push(new Particle(x, y, {
                    vx: Utils.randomFloat(-maxSpeed, maxSpeed),
                    vy: Utils.randomFloat(-maxSpeed * 1.5, -2),
                    size: Utils.randomFloat(1, 3),
                    color: '#ffd700',
                    life: Utils.randomFloat(0.4, 1.0),
                    shape: 'circle',
                    gravity: 0.1,
                    friction: 0.98,
                    trail: true,
                    trailMaxLength: 3
                }));
            }
        }
    }

    // --- 4. Achievement Burst ---
    // Gold trophy-like explosion with stars, sparkles, and upward streaming
    achievementBurst(x, y) {
        const goldColors = ['#ffd700', '#ffed4a', '#daa520', '#f0c040'];
        const sparkleColors = ['#ffffff', '#fffacd', '#ffd700'];

        // Gold star explosion outward
        for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2;
            const speed = Utils.randomFloat(3, 9);
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(6, 14),
                color: Utils.randomChoice(goldColors),
                life: 1.8,
                shape: 'star',
                gravity: 0.08,
                friction: 0.97,
                trail: true,
                trailMaxLength: 4,
                glow: true,
                glowSize: 8
            }));
        }

        // Sparkle ring
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 6;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(2, 5),
                color: Utils.randomChoice(sparkleColors),
                life: 0.8,
                shape: 'diamond',
                gravity: 0,
                friction: 0.92,
                twinkle: true
            }));
        }

        // Upward streaming particles (trophy fountain)
        for (let i = 0; i < 30; i++) {
            this.particles.push(new Particle(
                x + Utils.randomFloat(-20, 20),
                y,
                {
                    vx: Utils.randomFloat(-1.5, 1.5),
                    vy: Utils.randomFloat(-12, -5),
                    size: Utils.randomFloat(3, 7),
                    color: Utils.randomChoice(goldColors),
                    life: Utils.randomFloat(1.2, 2.5),
                    shape: Utils.randomChoice(['star', 'circle', 'diamond']),
                    gravity: 0.12,
                    friction: 0.98,
                    twinkle: true,
                    twinkleSpeed: Utils.randomFloat(6, 12),
                    glow: true,
                    glowSize: 5
                }
            ));
        }

        // Central flash
        this.particles.push(new Particle(x, y, {
            vx: 0,
            vy: 0,
            size: 40,
            color: '#ffd700',
            life: 0.4,
            shape: 'circle',
            gravity: 0,
            friction: 1,
            fadeStart: 0.9,
            rotationSpeed: 0,
            glow: true,
            glowSize: 40
        }));
    }

    // --- 5. Level Start ---
    // Particles sweep in from all edges toward the center of the screen
    levelStart() {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const colors = ['#06d6a0', '#ffd166', '#00b4d8', '#8338ec', '#ef476f', '#ffffff'];
        const totalPerEdge = 30;

        // Top edge
        for (let i = 0; i < totalPerEdge; i++) {
            const sx = Utils.randomFloat(0, this.width);
            const sy = -10;
            const angle = Math.atan2(cy - sy, cx - sx);
            const speed = Utils.randomFloat(8, 16);
            this.particles.push(new Particle(sx, sy, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(3, 8),
                color: Utils.randomChoice(colors),
                life: Utils.randomFloat(0.8, 1.5),
                shape: Utils.randomChoice(['star', 'circle', 'diamond']),
                gravity: 0,
                friction: 0.96,
                trail: true,
                trailMaxLength: 5,
                glow: true,
                glowSize: 6
            }));
        }

        // Bottom edge
        for (let i = 0; i < totalPerEdge; i++) {
            const sx = Utils.randomFloat(0, this.width);
            const sy = this.height + 10;
            const angle = Math.atan2(cy - sy, cx - sx);
            const speed = Utils.randomFloat(8, 16);
            this.particles.push(new Particle(sx, sy, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(3, 8),
                color: Utils.randomChoice(colors),
                life: Utils.randomFloat(0.8, 1.5),
                shape: Utils.randomChoice(['star', 'circle', 'diamond']),
                gravity: 0,
                friction: 0.96,
                trail: true,
                trailMaxLength: 5,
                glow: true,
                glowSize: 6
            }));
        }

        // Left edge
        for (let i = 0; i < totalPerEdge; i++) {
            const sx = -10;
            const sy = Utils.randomFloat(0, this.height);
            const angle = Math.atan2(cy - sy, cx - sx);
            const speed = Utils.randomFloat(8, 16);
            this.particles.push(new Particle(sx, sy, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(3, 8),
                color: Utils.randomChoice(colors),
                life: Utils.randomFloat(0.8, 1.5),
                shape: Utils.randomChoice(['star', 'circle', 'diamond']),
                gravity: 0,
                friction: 0.96,
                trail: true,
                trailMaxLength: 5,
                glow: true,
                glowSize: 6
            }));
        }

        // Right edge
        for (let i = 0; i < totalPerEdge; i++) {
            const sx = this.width + 10;
            const sy = Utils.randomFloat(0, this.height);
            const angle = Math.atan2(cy - sy, cx - sx);
            const speed = Utils.randomFloat(8, 16);
            this.particles.push(new Particle(sx, sy, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(3, 8),
                color: Utils.randomChoice(colors),
                life: Utils.randomFloat(0.8, 1.5),
                shape: Utils.randomChoice(['star', 'circle', 'diamond']),
                gravity: 0,
                friction: 0.96,
                trail: true,
                trailMaxLength: 5,
                glow: true,
                glowSize: 6
            }));
        }
    }

    // --- 6. Zone Ambient Particles ---
    // Continuous background particles based on the current zone.
    // Uses setInterval-based emitter that can be started/stopped.

    startAmbient(zone) {
        // Stop any existing ambient before starting new
        this.stopAmbient();
        this._ambientZone = zone;

        const emitters = {
            beach: () => this._ambientBeach(),
            jungle: () => this._ambientJungle(),
            cave: () => this._ambientCave(),
            volcano: () => this._ambientVolcano(),
            sky: () => this._ambientSky(),
            space: () => this._ambientSpace()
        };

        const emitFn = emitters[zone];
        if (!emitFn) return;

        // Emit immediately once, then on interval
        emitFn();
        this._ambientInterval = setInterval(emitFn, 300);
    }

    stopAmbient() {
        if (this._ambientInterval !== null) {
            clearInterval(this._ambientInterval);
            this._ambientInterval = null;
        }
        this._ambientZone = null;
    }

    // Beach: Gentle sand / sparkle drift
    _ambientBeach() {
        const colors = ['#f4e1c1', '#ffe4b5', '#ffd89b', '#fffacd', '#ffffff'];
        for (let i = 0; i < 2; i++) {
            this.particles.push(new Particle(
                Utils.randomFloat(0, this.width),
                Utils.randomFloat(0, this.height),
                {
                    vx: Utils.randomFloat(0.3, 1.5),
                    vy: Utils.randomFloat(-0.3, 0.5),
                    size: Utils.randomFloat(1, 3),
                    color: Utils.randomChoice(colors),
                    life: Utils.randomFloat(3, 6),
                    shape: 'circle',
                    gravity: 0.005,
                    friction: 0.999,
                    twinkle: true,
                    twinkleSpeed: Utils.randomFloat(3, 6)
                }
            ));
        }
    }

    // Jungle: Floating firefly dots
    _ambientJungle() {
        const colors = ['#adff2f', '#7fff00', '#c8ff00', '#ffff66'];
        for (let i = 0; i < 2; i++) {
            this.particles.push(new Particle(
                Utils.randomFloat(0, this.width),
                Utils.randomFloat(this.height * 0.3, this.height),
                {
                    vx: Utils.randomFloat(-0.5, 0.5),
                    vy: Utils.randomFloat(-0.8, 0.3),
                    size: Utils.randomFloat(2, 4),
                    color: Utils.randomChoice(colors),
                    life: Utils.randomFloat(3, 7),
                    shape: 'circle',
                    gravity: 0,
                    friction: 0.999,
                    twinkle: true,
                    twinkleSpeed: Utils.randomFloat(2, 5),
                    glow: true,
                    glowSize: 8
                }
            ));
        }
    }

    // Cave: Slow crystal dust
    _ambientCave() {
        const colors = ['#b0c4de', '#87ceeb', '#e0e0ff', '#c8a2c8', '#d8bfd8'];
        for (let i = 0; i < 2; i++) {
            this.particles.push(new Particle(
                Utils.randomFloat(0, this.width),
                Utils.randomFloat(0, this.height * 0.3),
                {
                    vx: Utils.randomFloat(-0.3, 0.3),
                    vy: Utils.randomFloat(0.2, 0.8),
                    size: Utils.randomFloat(1, 3),
                    color: Utils.randomChoice(colors),
                    life: Utils.randomFloat(4, 8),
                    shape: Utils.randomChoice(['circle', 'diamond']),
                    gravity: 0.003,
                    friction: 0.999,
                    twinkle: true,
                    twinkleSpeed: Utils.randomFloat(1, 3)
                }
            ));
        }
    }

    // Volcano: Rising embers
    _ambientVolcano() {
        const colors = ['#ff4500', '#ff6b35', '#ff8c00', '#ffa500', '#ffd700'];
        for (let i = 0; i < 3; i++) {
            this.particles.push(new Particle(
                Utils.randomFloat(this.width * 0.1, this.width * 0.9),
                this.height + 10,
                {
                    vx: Utils.randomFloat(-0.8, 0.8),
                    vy: Utils.randomFloat(-2.5, -0.8),
                    size: Utils.randomFloat(1.5, 4),
                    color: Utils.randomChoice(colors),
                    life: Utils.randomFloat(3, 6),
                    shape: 'circle',
                    gravity: -0.01,
                    friction: 0.998,
                    glow: true,
                    glowSize: 4,
                    twinkle: true,
                    twinkleSpeed: Utils.randomFloat(4, 8)
                }
            ));
        }
    }

    // Sky: Gentle cloud wisps (white dots drifting)
    _ambientSky() {
        const colors = ['#ffffff', '#e8f0ff', '#d4e6ff', '#f0f8ff'];
        for (let i = 0; i < 2; i++) {
            this.particles.push(new Particle(
                Utils.randomFloat(0, this.width),
                Utils.randomFloat(0, this.height * 0.6),
                {
                    vx: Utils.randomFloat(0.3, 1.2),
                    vy: Utils.randomFloat(-0.2, 0.2),
                    size: Utils.randomFloat(2, 6),
                    color: Utils.randomChoice(colors),
                    life: Utils.randomFloat(4, 8),
                    shape: 'circle',
                    gravity: 0,
                    friction: 0.9995,
                    fadeStart: 0.3
                }
            ));
        }
    }

    // Space: Slow-moving tiny stars
    _ambientSpace() {
        const colors = ['#ffffff', '#aaccff', '#ffddaa', '#ccccff', '#ffe8cc'];
        for (let i = 0; i < 3; i++) {
            this.particles.push(new Particle(
                Utils.randomFloat(0, this.width),
                Utils.randomFloat(0, this.height),
                {
                    vx: Utils.randomFloat(-0.2, 0.2),
                    vy: Utils.randomFloat(-0.2, 0.2),
                    size: Utils.randomFloat(1, 3),
                    color: Utils.randomChoice(colors),
                    life: Utils.randomFloat(4, 10),
                    shape: Utils.randomChoice(['circle', 'star']),
                    gravity: 0,
                    friction: 1,
                    twinkle: true,
                    twinkleSpeed: Utils.randomFloat(2, 6),
                    glow: true,
                    glowSize: 3
                }
            ));
        }
    }

    // ========================================
    //  CLEAR
    // ========================================

    clear() {
        this.particles = [];
        this.emitters = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

/* ========================================
   MATH ISLAND - Particle System
   Canvas-based particle effects
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
        this.shape = config.shape || 'circle'; // circle, star, square, text
        this.text = config.text || '';
        this.rotation = Utils.randomFloat(0, Math.PI * 2);
        this.rotationSpeed = Utils.randomFloat(-0.1, 0.1);
        this.scale = 1;
        this.fadeStart = config.fadeStart || 0.5;
    }

    update(dt) {
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
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

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
            ctx.font = `${this.size * 4}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, 0, 0);
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

        this._animate = this._animate.bind(this);
        requestAnimationFrame(this._animate);
    }

    _animate(now) {
        if (!this.running) return;
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
            p.draw(this.ctx);
            if (p.isDead) {
                this.particles.splice(i, 1);
            }
        }

        requestAnimationFrame(this._animate);
    }

    emit(x, y, count, config) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(
                x + Utils.randomFloat(-10, 10),
                y + Utils.randomFloat(-10, 10),
                config
            ));
        }
    }

    // Correct answer celebration
    correctBurst(x, y) {
        const colors = ['#06d6a0', '#ffd166', '#00b4d8', '#ffffff'];
        this.emit(x, y, 30, {
            vx: () => Utils.randomFloat(-8, 8),
            vy: () => Utils.randomFloat(-10, -2),
            size: Utils.randomFloat(4, 10),
            color: Utils.randomChoice(colors),
            life: 1.2,
            shape: 'star',
            gravity: 0.15
        });
        // Spawn individual particles with varied velocities
        for (let i = 0; i < 30; i++) {
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

    // Star collection
    starExplosion(x, y) {
        const colors = ['#ffd700', '#ffed4a', '#fff7b2', '#ffffff'];
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const speed = Utils.randomFloat(3, 10);
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(5, 12),
                color: Utils.randomChoice(colors),
                life: 1.5,
                shape: 'star',
                gravity: 0.05,
                friction: 0.97
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

    // Level complete confetti
    confetti(duration = 3000) {
        const colors = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#8338ec', '#ff6b35'];
        const interval = setInterval(() => {
            for (let i = 0; i < 5; i++) {
                this.particles.push(new Particle(
                    Utils.randomFloat(0, 1920),
                    -20,
                    {
                        vx: Utils.randomFloat(-2, 2),
                        vy: Utils.randomFloat(2, 6),
                        size: Utils.randomFloat(6, 14),
                        color: Utils.randomChoice(colors),
                        life: 4,
                        shape: Utils.randomChoice(['square', 'circle']),
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

    clear() {
        this.particles = [];
        this.emitters = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

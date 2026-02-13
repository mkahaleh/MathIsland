/* ========================================
   MATH ISLAND - Chibi Sprite Renderer
   Hand-drawn style character sprites
   using canvas primitives for RPG feel.
   Optimized for Samsung Smart TV (30fps)
   ======================================== */

const SpriteRenderer = {
    // Pre-rendered character canvases (cached at init)
    _cache: {},
    _cacheReady: false,

    // Character visual definitions
    charVisuals: {
        luna: {
            // Wizard girl
            skinColor: '#ffe0bd',
            hairColor: '#6b21a8',
            hairStyle: 'long',
            outfitColor: '#8338ec',
            outfitAccent: '#c084fc',
            hatType: 'wizard',
            hatColor: '#6b21a8',
            eyeColor: '#3b82f6',
            accessory: 'wand',
            accessoryColor: '#ffd700'
        },
        captain: {
            // Pirate captain
            skinColor: '#f0c8a0',
            hairColor: '#4a2000',
            hairStyle: 'short',
            outfitColor: '#ef476f',
            outfitAccent: '#ff6b8a',
            hatType: 'bandana',
            hatColor: '#ef476f',
            eyeColor: '#422006',
            accessory: 'sword',
            accessoryColor: '#c0c0c0',
            eyepatch: true
        },
        coral: {
            // Mermaid
            skinColor: '#ffe0d0',
            hairColor: '#0ea5e9',
            hairStyle: 'flowing',
            outfitColor: '#00b4d8',
            outfitAccent: '#48cae4',
            hatType: 'tiara',
            hatColor: '#ffd700',
            eyeColor: '#0284c7',
            accessory: 'pearl',
            accessoryColor: '#fff5f5',
            tail: true
        },
        dino: {
            // Cute dinosaur
            skinColor: '#34d399',
            hairColor: '#059669',
            hairStyle: 'spikes',
            outfitColor: '#06d6a0',
            outfitAccent: '#a7f3d0',
            hatType: 'none',
            eyeColor: '#065f46',
            accessory: 'none',
            isDino: true
        },
        astro: {
            // Space cat
            skinColor: '#fb923c',
            hairColor: '#ea580c',
            hairStyle: 'ears',
            outfitColor: '#f8fafc',
            outfitAccent: '#60a5fa',
            hatType: 'helmet',
            hatColor: '#e2e8f0',
            eyeColor: '#22c55e',
            accessory: 'jetpack',
            accessoryColor: '#3b82f6',
            isCat: true
        },
        phoenix: {
            // Phoenix bird
            skinColor: '#ff6b35',
            hairColor: '#dc2626',
            hairStyle: 'feathers',
            outfitColor: '#ff4500',
            outfitAccent: '#fbbf24',
            hatType: 'none',
            eyeColor: '#fbbf24',
            accessory: 'wings',
            accessoryColor: '#fbbf24',
            isBird: true
        },
        robot: {
            // Cute robot
            skinColor: '#94a3b8',
            hairColor: '#64748b',
            hairStyle: 'antenna',
            outfitColor: '#64748b',
            outfitAccent: '#38bdf8',
            hatType: 'none',
            eyeColor: '#38bdf8',
            accessory: 'gear',
            accessoryColor: '#fbbf24',
            isRobot: true
        },
        dragon: {
            // Baby dragon
            skinColor: '#dc2626',
            hairColor: '#7f1d1d',
            hairStyle: 'horns',
            outfitColor: '#ef4444',
            outfitAccent: '#fbbf24',
            hatType: 'none',
            eyeColor: '#fbbf24',
            accessory: 'wings',
            accessoryColor: '#dc2626',
            isDragon: true
        }
    },

    // Pre-render all character sprites at multiple sizes for performance
    init() {
        const sizes = [120, 80, 50]; // Game, HUD, Map
        const moods = ['idle', 'happy', 'sad'];

        for (const charId in this.charVisuals) {
            this._cache[charId] = {};
            for (const size of sizes) {
                this._cache[charId][size] = {};
                for (const mood of moods) {
                    const canvas = document.createElement('canvas');
                    canvas.width = size * 1.4;
                    canvas.height = size * 1.6;
                    const ctx = canvas.getContext('2d');
                    this._drawChibiCharacter(ctx, charId, canvas.width / 2, canvas.height * 0.55, size * 0.45, mood, 0);
                    this._cache[charId][size][mood] = canvas;
                }
            }
        }
        this._cacheReady = true;
    },

    // Draw character on target canvas (uses cached sprites + animation)
    drawCharacter(ctx, charId, x, y, size, time, mood) {
        mood = mood || 'idle';
        const bounceY = Math.sin(time * 2.2) * 6;
        const breathScale = 1 + Math.sin(time * 2.8) * 0.015;
        const tilt = Math.sin(time * 1.5) * 0.03;

        // Find nearest cached size
        const cachedSize = size >= 100 ? 120 : size >= 60 ? 80 : 50;

        ctx.save();
        ctx.translate(x, y + bounceY);
        ctx.rotate(tilt);
        ctx.scale(breathScale, breathScale);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(0, size * 0.5, size * 0.35, size * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this._cacheReady && this._cache[charId] && this._cache[charId][cachedSize]) {
            const cached = this._cache[charId][cachedSize][mood] || this._cache[charId][cachedSize].idle;
            const scale = size / cachedSize;
            ctx.drawImage(cached,
                -cached.width * scale / 2,
                -cached.height * scale / 2,
                cached.width * scale,
                cached.height * scale
            );
        } else {
            // Fallback: draw directly
            this._drawChibiCharacter(ctx, charId, 0, 0, size * 0.45, mood, time);
        }

        // Animated sparkle effects around character
        this._drawCharacterEffects(ctx, charId, size, time, mood);

        ctx.restore();
    },

    // Core chibi character drawing
    _drawChibiCharacter(ctx, charId, cx, cy, radius, mood, time) {
        const vis = this.charVisuals[charId];
        if (!vis) return;

        const r = radius;

        if (vis.isDino) {
            this._drawDinoChar(ctx, cx, cy, r, vis, mood);
        } else if (vis.isCat) {
            this._drawCatChar(ctx, cx, cy, r, vis, mood);
        } else if (vis.isBird) {
            this._drawBirdChar(ctx, cx, cy, r, vis, mood);
        } else if (vis.isRobot) {
            this._drawRobotChar(ctx, cx, cy, r, vis, mood);
        } else if (vis.isDragon) {
            this._drawDragonChar(ctx, cx, cy, r, vis, mood);
        } else {
            this._drawHumanChar(ctx, cx, cy, r, vis, mood);
        }
    },

    // ============ HUMAN CHARACTERS (Luna, Captain, Coral) ============
    _drawHumanChar(ctx, cx, cy, r, vis, mood) {
        ctx.save();

        // Body
        const bodyY = cy + r * 0.5;
        const bodyGrad = ctx.createLinearGradient(cx, bodyY - r * 0.6, cx, bodyY + r * 0.8);
        bodyGrad.addColorStop(0, vis.outfitAccent);
        bodyGrad.addColorStop(1, vis.outfitColor);
        ctx.fillStyle = bodyGrad;

        // Rounded body shape
        ctx.beginPath();
        ctx.ellipse(cx, bodyY, r * 0.65, r * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.15, bodyY - r * 0.2, r * 0.3, r * 0.4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Arms
        ctx.fillStyle = vis.outfitColor;
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.65, bodyY, r * 0.2, r * 0.35, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.65, bodyY, r * 0.2, r * 0.35, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Hands
        ctx.fillStyle = vis.skinColor;
        ctx.beginPath();
        ctx.arc(cx - r * 0.72, bodyY + r * 0.3, r * 0.14, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.72, bodyY + r * 0.3, r * 0.14, 0, Math.PI * 2);
        ctx.fill();

        // Feet
        ctx.fillStyle = vis.outfitColor;
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.25, bodyY + r * 0.75, r * 0.22, r * 0.12, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + r * 0.25, bodyY + r * 0.75, r * 0.22, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head (big chibi head)
        const headY = cy - r * 0.3;
        const headGrad = ctx.createRadialGradient(cx - r * 0.15, headY - r * 0.15, 0, cx, headY, r * 0.8);
        headGrad.addColorStop(0, this._lightenColor(vis.skinColor, 20));
        headGrad.addColorStop(1, vis.skinColor);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(cx, headY, r * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Head highlight
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.2, headY - r * 0.3, r * 0.35, r * 0.25, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Cheeks (blush)
        ctx.fillStyle = 'rgba(255, 130, 130, 0.3)';
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.45, headY + r * 0.15, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + r * 0.45, headY + r * 0.15, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        this._drawHair(ctx, cx, headY, r, vis);

        // Eyes
        this._drawEyes(ctx, cx, headY, r, vis, mood);

        // Mouth
        this._drawMouth(ctx, cx, headY, r, mood);

        // Hat / Headgear
        if (vis.hatType === 'wizard') {
            this._drawWizardHat(ctx, cx, headY, r, vis);
        } else if (vis.hatType === 'bandana') {
            this._drawBandana(ctx, cx, headY, r, vis);
        } else if (vis.hatType === 'tiara') {
            this._drawTiara(ctx, cx, headY, r, vis);
        }

        // Accessory
        if (vis.accessory === 'wand') {
            this._drawWand(ctx, cx + r * 0.75, bodyY, r, vis);
        } else if (vis.accessory === 'sword') {
            this._drawSword(ctx, cx + r * 0.75, bodyY, r, vis);
        }

        // Coral's tail
        if (vis.tail) {
            this._drawMermaidTail(ctx, cx, bodyY + r * 0.4, r, vis);
        }

        // Eye patch for captain
        if (vis.eyepatch) {
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(cx + r * 0.25, headY - r * 0.02, r * 0.14, r * 0.12, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = r * 0.04;
            ctx.beginPath();
            ctx.moveTo(cx + r * 0.35, headY - r * 0.1);
            ctx.quadraticCurveTo(cx + r * 0.55, headY - r * 0.35, cx + r * 0.4, headY - r * 0.55);
            ctx.stroke();
        }

        ctx.restore();
    },

    // ============ DINO CHARACTER ============
    _drawDinoChar(ctx, cx, cy, r, vis, mood) {
        ctx.save();

        // Tail
        ctx.fillStyle = vis.skinColor;
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.5, cy + r * 0.4);
        ctx.quadraticCurveTo(cx + r * 1.1, cy + r * 0.2, cx + r * 1.2, cy - r * 0.1);
        ctx.quadraticCurveTo(cx + r * 1.0, cy + r * 0.1, cx + r * 0.5, cy + r * 0.3);
        ctx.fill();

        // Tail spikes
        ctx.fillStyle = vis.hairColor;
        const tailSpikes = [[0.8, 0.15], [0.95, 0.0], [1.1, -0.08]];
        tailSpikes.forEach(([tx, ty]) => {
            ctx.beginPath();
            ctx.moveTo(cx + r * tx, cy + r * ty);
            ctx.lineTo(cx + r * (tx + 0.08), cy + r * (ty - 0.15));
            ctx.lineTo(cx + r * (tx + 0.12), cy + r * ty);
            ctx.fill();
        });

        // Body
        const bodyGrad = ctx.createRadialGradient(cx - r * 0.1, cy + r * 0.1, 0, cx, cy + r * 0.2, r * 0.9);
        bodyGrad.addColorStop(0, this._lightenColor(vis.skinColor, 20));
        bodyGrad.addColorStop(1, vis.skinColor);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.2, r * 0.65, r * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = this._lightenColor(vis.skinColor, 40);
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.35, r * 0.4, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        const headY = cy - r * 0.5;
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(cx, headY, r * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = this._lightenColor(vis.skinColor, 15);
        ctx.beginPath();
        ctx.ellipse(cx, headY + r * 0.15, r * 0.4, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head spikes
        ctx.fillStyle = vis.hairColor;
        for (let i = 0; i < 4; i++) {
            const sx = cx - r * 0.2 + i * r * 0.15;
            const sy = headY - r * 0.55 - i * r * 0.05;
            ctx.beginPath();
            ctx.moveTo(sx - r * 0.06, headY - r * 0.4);
            ctx.lineTo(sx, sy);
            ctx.lineTo(sx + r * 0.06, headY - r * 0.4);
            ctx.fill();
        }

        // Small arms
        ctx.fillStyle = vis.skinColor;
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.55, cy + r * 0.15, r * 0.12, r * 0.22, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.55, cy + r * 0.15, r * 0.12, r * 0.22, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Feet
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.25, cy + r * 0.9, r * 0.2, r * 0.1, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + r * 0.25, cy + r * 0.9, r * 0.2, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        this._drawEyes(ctx, cx, headY, r, vis, mood);

        // Nostrils
        ctx.fillStyle = vis.hairColor;
        ctx.beginPath();
        ctx.arc(cx - r * 0.12, headY + r * 0.08, r * 0.04, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.12, headY + r * 0.08, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        if (mood === 'happy') {
            ctx.strokeStyle = vis.hairColor;
            ctx.lineWidth = r * 0.04;
            ctx.beginPath();
            ctx.arc(cx, headY + r * 0.2, r * 0.25, 0, Math.PI);
            ctx.stroke();
            // Teeth
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.08, headY + r * 0.2);
            ctx.lineTo(cx - r * 0.04, headY + r * 0.32);
            ctx.lineTo(cx, headY + r * 0.2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx, headY + r * 0.2);
            ctx.lineTo(cx + r * 0.04, headY + r * 0.32);
            ctx.lineTo(cx + r * 0.08, headY + r * 0.2);
            ctx.fill();
        } else {
            this._drawMouth(ctx, cx, headY, r, mood);
        }

        ctx.restore();
    },

    // ============ CAT CHARACTER ============
    _drawCatChar(ctx, cx, cy, r, vis, mood) {
        ctx.save();

        // Tail
        ctx.strokeStyle = vis.skinColor;
        ctx.lineWidth = r * 0.15;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.4, cy + r * 0.5);
        ctx.bezierCurveTo(cx + r * 1.0, cy + r * 0.3, cx + r * 1.1, cy - r * 0.2, cx + r * 0.8, cy - r * 0.4);
        ctx.stroke();

        // Body
        const bodyGrad = ctx.createRadialGradient(cx, cy + r * 0.2, 0, cx, cy + r * 0.2, r * 0.85);
        bodyGrad.addColorStop(0, this._lightenColor(vis.skinColor, 15));
        bodyGrad.addColorStop(1, vis.skinColor);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.2, r * 0.6, r * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = '#fff8f0';
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.35, r * 0.35, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Space suit outline
        ctx.strokeStyle = vis.outfitAccent;
        ctx.lineWidth = r * 0.06;
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.2, r * 0.6, r * 0.75, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Paws
        ctx.fillStyle = vis.skinColor;
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.45, cy + r * 0.8, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + r * 0.45, cy + r * 0.8, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        const headY = cy - r * 0.45;
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(cx, headY, r * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Ears (triangular)
        ctx.fillStyle = vis.skinColor;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.55, headY - r * 0.3);
        ctx.lineTo(cx - r * 0.35, headY - r * 0.75);
        ctx.lineTo(cx - r * 0.15, headY - r * 0.3);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.15, headY - r * 0.3);
        ctx.lineTo(cx + r * 0.35, headY - r * 0.75);
        ctx.lineTo(cx + r * 0.55, headY - r * 0.3);
        ctx.fill();

        // Inner ears
        ctx.fillStyle = '#ffb3b3';
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.48, headY - r * 0.32);
        ctx.lineTo(cx - r * 0.35, headY - r * 0.6);
        ctx.lineTo(cx - r * 0.22, headY - r * 0.32);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.22, headY - r * 0.32);
        ctx.lineTo(cx + r * 0.35, headY - r * 0.6);
        ctx.lineTo(cx + r * 0.48, headY - r * 0.32);
        ctx.fill();

        // Helmet visor (if space cat)
        if (vis.hatType === 'helmet') {
            ctx.strokeStyle = 'rgba(200,220,255,0.4)';
            ctx.lineWidth = r * 0.08;
            ctx.beginPath();
            ctx.arc(cx, headY, r * 0.72, Math.PI * 1.2, Math.PI * 1.8);
            ctx.stroke();
        }

        // Face
        ctx.fillStyle = '#fff8f0';
        ctx.beginPath();
        ctx.ellipse(cx, headY + r * 0.05, r * 0.35, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (cat eyes)
        const eyeY = headY - r * 0.02;
        const eyeSpacing = r * 0.22;

        // Eye whites
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(cx - eyeSpacing, eyeY, r * 0.15, r * 0.17, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + eyeSpacing, eyeY, r * 0.15, r * 0.17, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (cat slit)
        if (mood === 'happy') {
            // Happy closed eyes (arcs)
            ctx.strokeStyle = vis.eyeColor;
            ctx.lineWidth = r * 0.06;
            ctx.beginPath();
            ctx.arc(cx - eyeSpacing, eyeY, r * 0.1, Math.PI * 0.1, Math.PI * 0.9);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + eyeSpacing, eyeY, r * 0.1, Math.PI * 0.1, Math.PI * 0.9);
            ctx.stroke();
        } else if (mood === 'sad') {
            ctx.fillStyle = vis.eyeColor;
            ctx.beginPath();
            ctx.ellipse(cx - eyeSpacing, eyeY + r * 0.03, r * 0.08, r * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + eyeSpacing, eyeY + r * 0.03, r * 0.08, r * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = vis.eyeColor;
            ctx.beginPath();
            ctx.ellipse(cx - eyeSpacing, eyeY, r * 0.07, r * 0.14, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + eyeSpacing, eyeY, r * 0.07, r * 0.14, 0, 0, Math.PI * 2);
            ctx.fill();
            // Eye shines
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx - eyeSpacing - r * 0.02, eyeY - r * 0.05, r * 0.035, 0, Math.PI * 2);
            ctx.arc(cx + eyeSpacing - r * 0.02, eyeY - r * 0.05, r * 0.035, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nose (small triangle)
        ctx.fillStyle = '#ffb3b3';
        ctx.beginPath();
        ctx.moveTo(cx, headY + r * 0.08);
        ctx.lineTo(cx - r * 0.06, headY + r * 0.16);
        ctx.lineTo(cx + r * 0.06, headY + r * 0.16);
        ctx.fill();

        // Whiskers
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = r * 0.02;
        for (let side = -1; side <= 1; side += 2) {
            for (let w = 0; w < 3; w++) {
                const wy = headY + r * 0.12 + w * r * 0.06;
                ctx.beginPath();
                ctx.moveTo(cx + side * r * 0.15, wy);
                ctx.lineTo(cx + side * r * 0.55, wy + (w - 1) * r * 0.05);
                ctx.stroke();
            }
        }

        // Mouth
        this._drawMouth(ctx, cx, headY + r * 0.05, r * 0.8, mood);

        ctx.restore();
    },

    // ============ BIRD CHARACTER (Phoenix) ============
    _drawBirdChar(ctx, cx, cy, r, vis, mood) {
        ctx.save();

        // Wings
        const wingColor1 = vis.accessoryColor;
        const wingColor2 = vis.skinColor;

        // Left wing
        ctx.fillStyle = wingColor2;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.4, cy);
        ctx.quadraticCurveTo(cx - r * 1.2, cy - r * 0.3, cx - r * 1.0, cy - r * 0.8);
        ctx.quadraticCurveTo(cx - r * 0.8, cy - r * 0.4, cx - r * 0.4, cy - r * 0.1);
        ctx.fill();
        ctx.fillStyle = wingColor1;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.4, cy + r * 0.1);
        ctx.quadraticCurveTo(cx - r * 1.0, cy - r * 0.1, cx - r * 0.85, cy - r * 0.5);
        ctx.quadraticCurveTo(cx - r * 0.7, cy - r * 0.15, cx - r * 0.35, cy);
        ctx.fill();

        // Right wing
        ctx.fillStyle = wingColor2;
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.4, cy);
        ctx.quadraticCurveTo(cx + r * 1.2, cy - r * 0.3, cx + r * 1.0, cy - r * 0.8);
        ctx.quadraticCurveTo(cx + r * 0.8, cy - r * 0.4, cx + r * 0.4, cy - r * 0.1);
        ctx.fill();
        ctx.fillStyle = wingColor1;
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.4, cy + r * 0.1);
        ctx.quadraticCurveTo(cx + r * 1.0, cy - r * 0.1, cx + r * 0.85, cy - r * 0.5);
        ctx.quadraticCurveTo(cx + r * 0.7, cy - r * 0.15, cx + r * 0.35, cy);
        ctx.fill();

        // Body
        const bodyGrad = ctx.createRadialGradient(cx, cy + r * 0.2, 0, cx, cy + r * 0.2, r * 0.8);
        bodyGrad.addColorStop(0, vis.outfitAccent);
        bodyGrad.addColorStop(1, vis.skinColor);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.2, r * 0.5, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = vis.outfitAccent;
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.35, r * 0.3, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        const headY = cy - r * 0.45;
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(cx, headY, r * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Crest / head feathers
        ctx.fillStyle = vis.hairColor;
        for (let i = 0; i < 3; i++) {
            const fx = cx - r * 0.1 + i * r * 0.1;
            ctx.beginPath();
            ctx.moveTo(fx - r * 0.06, headY - r * 0.45);
            ctx.quadraticCurveTo(fx, headY - r * 0.9 + i * r * 0.1, fx + r * 0.06, headY - r * 0.45);
            ctx.fill();
        }

        // Eyes
        this._drawEyes(ctx, cx, headY, r * 0.85, vis, mood);

        // Beak
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(cx, headY + r * 0.1);
        ctx.lineTo(cx - r * 0.15, headY + r * 0.22);
        ctx.lineTo(cx, headY + r * 0.35);
        ctx.lineTo(cx + r * 0.15, headY + r * 0.22);
        ctx.closePath();
        ctx.fill();

        // Tail feathers
        const tailColors = ['#dc2626', '#ff4500', '#fbbf24'];
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = tailColors[i];
            ctx.beginPath();
            ctx.moveTo(cx + (i - 1) * r * 0.15, cy + r * 0.7);
            ctx.quadraticCurveTo(cx + (i - 1) * r * 0.25, cy + r * 1.3, cx + (i - 1) * r * 0.35, cy + r * 1.4);
            ctx.quadraticCurveTo(cx + (i - 1) * r * 0.1, cy + r * 1.1, cx + (i - 1) * r * 0.05, cy + r * 0.75);
            ctx.fill();
        }

        ctx.restore();
    },

    // ============ ROBOT CHARACTER ============
    _drawRobotChar(ctx, cx, cy, r, vis, mood) {
        ctx.save();

        // Body (boxy but rounded)
        const bodyGrad = ctx.createLinearGradient(cx - r * 0.5, cy, cx + r * 0.5, cy + r * 0.8);
        bodyGrad.addColorStop(0, '#b0bec5');
        bodyGrad.addColorStop(0.5, vis.skinColor);
        bodyGrad.addColorStop(1, '#78909c');
        ctx.fillStyle = bodyGrad;

        this._roundRect(ctx, cx - r * 0.5, cy - r * 0.1, r, r * 1.0, r * 0.15);
        ctx.fill();

        // Body panel
        ctx.fillStyle = vis.outfitAccent;
        this._roundRect(ctx, cx - r * 0.3, cy + r * 0.05, r * 0.6, r * 0.5, r * 0.08);
        ctx.fill();

        // Panel lights
        const lightColors = ['#ef4444', '#fbbf24', '#22c55e'];
        lightColors.forEach((c, i) => {
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.arc(cx - r * 0.15 + i * r * 0.15, cy + r * 0.15, r * 0.05, 0, Math.PI * 2);
            ctx.fill();
        });

        // Arms (mechanical)
        ctx.fillStyle = '#78909c';
        this._roundRect(ctx, cx - r * 0.75, cy + r * 0.05, r * 0.2, r * 0.5, r * 0.06);
        ctx.fill();
        this._roundRect(ctx, cx + r * 0.55, cy + r * 0.05, r * 0.2, r * 0.5, r * 0.06);
        ctx.fill();

        // Claws
        ctx.fillStyle = '#546e7a';
        ctx.beginPath();
        ctx.arc(cx - r * 0.65, cy + r * 0.55, r * 0.12, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.65, cy + r * 0.55, r * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#78909c';
        this._roundRect(ctx, cx - r * 0.35, cy + r * 0.8, r * 0.2, r * 0.25, r * 0.05);
        ctx.fill();
        this._roundRect(ctx, cx + r * 0.15, cy + r * 0.8, r * 0.2, r * 0.25, r * 0.05);
        ctx.fill();

        // Feet
        ctx.fillStyle = '#546e7a';
        this._roundRect(ctx, cx - r * 0.4, cy + r * 1.0, r * 0.3, r * 0.1, r * 0.04);
        ctx.fill();
        this._roundRect(ctx, cx + r * 0.1, cy + r * 1.0, r * 0.3, r * 0.1, r * 0.04);
        ctx.fill();

        // Head (screen face)
        const headY = cy - r * 0.55;
        const headGrad = ctx.createLinearGradient(cx - r * 0.6, headY, cx + r * 0.6, headY);
        headGrad.addColorStop(0, '#b0bec5');
        headGrad.addColorStop(0.5, '#cfd8dc');
        headGrad.addColorStop(1, '#90a4ae');
        ctx.fillStyle = headGrad;
        this._roundRect(ctx, cx - r * 0.6, headY - r * 0.5, r * 1.2, r * 0.9, r * 0.2);
        ctx.fill();

        // Screen face
        ctx.fillStyle = '#0f172a';
        this._roundRect(ctx, cx - r * 0.45, headY - r * 0.35, r * 0.9, r * 0.6, r * 0.12);
        ctx.fill();

        // Screen glow
        ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
        this._roundRect(ctx, cx - r * 0.45, headY - r * 0.35, r * 0.9, r * 0.6, r * 0.12);
        ctx.fill();

        // Antenna
        ctx.strokeStyle = '#78909c';
        ctx.lineWidth = r * 0.05;
        ctx.beginPath();
        ctx.moveTo(cx, headY - r * 0.5);
        ctx.lineTo(cx, headY - r * 0.8);
        ctx.stroke();
        ctx.fillStyle = vis.outfitAccent;
        ctx.beginPath();
        ctx.arc(cx, headY - r * 0.82, r * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Screen eyes
        const eyeY = headY - r * 0.12;
        const eyeSpacing = r * 0.22;
        if (mood === 'happy') {
            ctx.strokeStyle = vis.outfitAccent;
            ctx.lineWidth = r * 0.06;
            ctx.beginPath();
            ctx.arc(cx - eyeSpacing, eyeY, r * 0.1, Math.PI * 0.1, Math.PI * 0.9);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + eyeSpacing, eyeY, r * 0.1, Math.PI * 0.1, Math.PI * 0.9);
            ctx.stroke();
        } else if (mood === 'sad') {
            ctx.strokeStyle = vis.outfitAccent;
            ctx.lineWidth = r * 0.06;
            ctx.beginPath();
            ctx.arc(cx - eyeSpacing, eyeY + r * 0.08, r * 0.1, Math.PI * 1.1, Math.PI * 1.9);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + eyeSpacing, eyeY + r * 0.08, r * 0.1, Math.PI * 1.1, Math.PI * 1.9);
            ctx.stroke();
        } else {
            ctx.fillStyle = vis.outfitAccent;
            ctx.beginPath();
            ctx.arc(cx - eyeSpacing, eyeY, r * 0.1, 0, Math.PI * 2);
            ctx.arc(cx + eyeSpacing, eyeY, r * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Screen mouth
        ctx.strokeStyle = vis.outfitAccent;
        ctx.lineWidth = r * 0.04;
        if (mood === 'happy') {
            ctx.beginPath();
            ctx.arc(cx, eyeY + r * 0.18, r * 0.12, 0, Math.PI);
            ctx.stroke();
        } else if (mood === 'sad') {
            ctx.beginPath();
            ctx.arc(cx, eyeY + r * 0.28, r * 0.1, Math.PI, 0);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.12, eyeY + r * 0.2);
            ctx.lineTo(cx + r * 0.12, eyeY + r * 0.2);
            ctx.stroke();
        }

        // Bolts on head
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx - r * 0.55, headY - r * 0.1, r * 0.06, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.55, headY - r * 0.1, r * 0.06, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // ============ DRAGON CHARACTER ============
    _drawDragonChar(ctx, cx, cy, r, vis, mood) {
        ctx.save();

        // Wings (small, cute)
        ctx.fillStyle = this._lightenColor(vis.skinColor, 20);
        // Left wing
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.4, cy - r * 0.1);
        ctx.quadraticCurveTo(cx - r * 1.0, cy - r * 0.5, cx - r * 0.8, cy - r * 0.9);
        ctx.quadraticCurveTo(cx - r * 0.6, cy - r * 0.5, cx - r * 0.35, cy - r * 0.2);
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.4, cy - r * 0.1);
        ctx.quadraticCurveTo(cx + r * 1.0, cy - r * 0.5, cx + r * 0.8, cy - r * 0.9);
        ctx.quadraticCurveTo(cx + r * 0.6, cy - r * 0.5, cx + r * 0.35, cy - r * 0.2);
        ctx.fill();

        // Wing membrane
        ctx.fillStyle = 'rgba(255,200,100,0.2)';
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.4, cy - r * 0.1);
        ctx.lineTo(cx - r * 0.8, cy - r * 0.7);
        ctx.lineTo(cx - r * 0.5, cy - r * 0.15);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.4, cy - r * 0.1);
        ctx.lineTo(cx + r * 0.8, cy - r * 0.7);
        ctx.lineTo(cx + r * 0.5, cy - r * 0.15);
        ctx.fill();

        // Tail
        ctx.strokeStyle = vis.skinColor;
        ctx.lineWidth = r * 0.18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.4, cy + r * 0.5);
        ctx.bezierCurveTo(cx + r * 0.9, cy + r * 0.6, cx + r * 1.0, cy + r * 0.2, cx + r * 0.8, cy - r * 0.1);
        ctx.stroke();

        // Tail tip (spade)
        ctx.fillStyle = vis.outfitAccent;
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.8, cy - r * 0.1);
        ctx.lineTo(cx + r * 0.7, cy - r * 0.25);
        ctx.lineTo(cx + r * 0.9, cy - r * 0.2);
        ctx.fill();

        // Body
        const bodyGrad = ctx.createRadialGradient(cx, cy + r * 0.15, 0, cx, cy + r * 0.2, r * 0.85);
        bodyGrad.addColorStop(0, this._lightenColor(vis.skinColor, 15));
        bodyGrad.addColorStop(1, vis.skinColor);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.2, r * 0.6, r * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = vis.outfitAccent;
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.35, r * 0.35, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly scales
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = r * 0.02;
        for (let i = 0; i < 4; i++) {
            const sy = cy + r * 0.15 + i * r * 0.12;
            ctx.beginPath();
            ctx.arc(cx, sy, r * 0.2 - i * r * 0.03, 0.3, Math.PI - 0.3);
            ctx.stroke();
        }

        // Arms
        ctx.fillStyle = vis.skinColor;
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.55, cy + r * 0.1, r * 0.15, r * 0.25, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.55, cy + r * 0.1, r * 0.15, r * 0.25, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Feet
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.25, cy + r * 0.9, r * 0.2, r * 0.1, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + r * 0.25, cy + r * 0.9, r * 0.2, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        const headY = cy - r * 0.5;
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(cx, headY, r * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.fillStyle = vis.outfitAccent;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.35, headY - r * 0.45);
        ctx.lineTo(cx - r * 0.25, headY - r * 0.85);
        ctx.lineTo(cx - r * 0.15, headY - r * 0.45);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.15, headY - r * 0.45);
        ctx.lineTo(cx + r * 0.25, headY - r * 0.85);
        ctx.lineTo(cx + r * 0.35, headY - r * 0.45);
        ctx.fill();

        // Snout
        ctx.fillStyle = this._lightenColor(vis.skinColor, 15);
        ctx.beginPath();
        ctx.ellipse(cx, headY + r * 0.12, r * 0.35, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nostrils (with smoke puffs)
        ctx.fillStyle = vis.hairColor;
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.1, headY + r * 0.1, r * 0.04, r * 0.03, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + r * 0.1, headY + r * 0.1, r * 0.04, r * 0.03, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        this._drawEyes(ctx, cx, headY, r, vis, mood);

        // Mouth - show teeth/fire for dragon
        if (mood === 'happy') {
            ctx.strokeStyle = vis.hairColor;
            ctx.lineWidth = r * 0.04;
            ctx.beginPath();
            ctx.arc(cx, headY + r * 0.2, r * 0.18, 0, Math.PI);
            ctx.stroke();
        } else {
            this._drawMouth(ctx, cx, headY, r, mood);
        }

        ctx.restore();
    },

    // ============ SHARED DRAWING HELPERS ============

    _drawHair(ctx, cx, headY, r, vis) {
        ctx.fillStyle = vis.hairColor;
        if (vis.hairStyle === 'long') {
            // Long flowing hair
            ctx.beginPath();
            ctx.arc(cx, headY - r * 0.1, r * 0.78, Math.PI * 0.85, Math.PI * 2.15);
            ctx.fill();
            // Side hair
            ctx.beginPath();
            ctx.ellipse(cx - r * 0.65, headY + r * 0.15, r * 0.18, r * 0.45, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + r * 0.65, headY + r * 0.15, r * 0.18, r * 0.45, -0.1, 0, Math.PI * 2);
            ctx.fill();
        } else if (vis.hairStyle === 'short') {
            // Short messy hair
            ctx.beginPath();
            ctx.arc(cx, headY - r * 0.15, r * 0.78, Math.PI * 0.9, Math.PI * 2.1);
            ctx.fill();
        } else if (vis.hairStyle === 'flowing') {
            // Mermaid flowing hair
            ctx.beginPath();
            ctx.arc(cx, headY - r * 0.1, r * 0.78, Math.PI * 0.8, Math.PI * 2.2);
            ctx.fill();
            // Long side waves
            ctx.beginPath();
            ctx.ellipse(cx - r * 0.7, headY + r * 0.3, r * 0.2, r * 0.6, 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + r * 0.7, headY + r * 0.3, r * 0.2, r * 0.6, -0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hair highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.2, headY - r * 0.45, r * 0.3, r * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawEyes(ctx, cx, headY, r, vis, mood) {
        const eyeY = headY - r * 0.08;
        const eyeSpacing = r * 0.24;
        const eyeR = r * 0.15;

        if (mood === 'happy') {
            // Happy closed eyes (^ ^)
            ctx.strokeStyle = '#333';
            ctx.lineWidth = r * 0.05;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(cx - eyeSpacing, eyeY, eyeR * 0.7, Math.PI * 0.15, Math.PI * 0.85);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + eyeSpacing, eyeY, eyeR * 0.7, Math.PI * 0.15, Math.PI * 0.85);
            ctx.stroke();
            return;
        }

        if (mood === 'sad') {
            // Sad droopy eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(cx - eyeSpacing, eyeY, eyeR, eyeR * 0.9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + eyeSpacing, eyeY, eyeR, eyeR * 0.9, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = vis.eyeColor;
            ctx.beginPath();
            ctx.arc(cx - eyeSpacing, eyeY + r * 0.03, eyeR * 0.55, 0, Math.PI * 2);
            ctx.arc(cx + eyeSpacing, eyeY + r * 0.03, eyeR * 0.55, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(cx - eyeSpacing, eyeY + r * 0.04, eyeR * 0.3, 0, Math.PI * 2);
            ctx.arc(cx + eyeSpacing, eyeY + r * 0.04, eyeR * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Sad eyebrows
            ctx.strokeStyle = '#555';
            ctx.lineWidth = r * 0.04;
            ctx.beginPath();
            ctx.moveTo(cx - eyeSpacing - eyeR, eyeY - eyeR * 0.8);
            ctx.lineTo(cx - eyeSpacing + eyeR * 0.5, eyeY - eyeR * 1.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + eyeSpacing + eyeR, eyeY - eyeR * 0.8);
            ctx.lineTo(cx + eyeSpacing - eyeR * 0.5, eyeY - eyeR * 1.2);
            ctx.stroke();
            return;
        }

        // Normal big chibi eyes
        // Eye whites
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(cx - eyeSpacing, eyeY, eyeR, eyeR * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + eyeSpacing, eyeY, eyeR, eyeR * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris
        ctx.fillStyle = vis.eyeColor;
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing, eyeY + r * 0.01, eyeR * 0.7, 0, Math.PI * 2);
        ctx.arc(cx + eyeSpacing, eyeY + r * 0.01, eyeR * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing, eyeY + r * 0.02, eyeR * 0.38, 0, Math.PI * 2);
        ctx.arc(cx + eyeSpacing, eyeY + r * 0.02, eyeR * 0.38, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine (large)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing - eyeR * 0.2, eyeY - eyeR * 0.25, eyeR * 0.25, 0, Math.PI * 2);
        ctx.arc(cx + eyeSpacing - eyeR * 0.2, eyeY - eyeR * 0.25, eyeR * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine (small)
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing + eyeR * 0.2, eyeY + eyeR * 0.15, eyeR * 0.12, 0, Math.PI * 2);
        ctx.arc(cx + eyeSpacing + eyeR * 0.2, eyeY + eyeR * 0.15, eyeR * 0.12, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawMouth(ctx, cx, headY, r, mood) {
        const mouthY = headY + r * 0.25;
        ctx.lineCap = 'round';

        if (mood === 'happy') {
            // Big smile
            ctx.strokeStyle = '#333';
            ctx.lineWidth = r * 0.04;
            ctx.beginPath();
            ctx.arc(cx, mouthY - r * 0.05, r * 0.15, 0.1, Math.PI - 0.1);
            ctx.stroke();
        } else if (mood === 'sad') {
            // Frown
            ctx.strokeStyle = '#555';
            ctx.lineWidth = r * 0.035;
            ctx.beginPath();
            ctx.arc(cx, mouthY + r * 0.08, r * 0.1, Math.PI + 0.2, -0.2);
            ctx.stroke();
        } else {
            // Neutral/cute small mouth
            ctx.strokeStyle = '#555';
            ctx.lineWidth = r * 0.03;
            ctx.beginPath();
            ctx.arc(cx, mouthY, r * 0.08, 0.15, Math.PI - 0.15);
            ctx.stroke();
        }
    },

    // ============ ACCESSORIES ============

    _drawWizardHat(ctx, cx, headY, r, vis) {
        ctx.fillStyle = vis.hatColor;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.55, headY - r * 0.45);
        ctx.lineTo(cx, headY - r * 1.3);
        ctx.lineTo(cx + r * 0.55, headY - r * 0.45);
        ctx.quadraticCurveTo(cx + r * 0.7, headY - r * 0.4, cx + r * 0.75, headY - r * 0.3);
        ctx.quadraticCurveTo(cx, headY - r * 0.55, cx - r * 0.75, headY - r * 0.3);
        ctx.closePath();
        ctx.fill();

        // Hat band
        ctx.fillStyle = vis.accessoryColor;
        ctx.beginPath();
        ctx.ellipse(cx, headY - r * 0.45, r * 0.6, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // Star on hat
        ctx.fillStyle = vis.accessoryColor;
        this._drawStarShape(ctx, cx, headY - r * 0.85, r * 0.12);
    },

    _drawBandana(ctx, cx, headY, r, vis) {
        ctx.fillStyle = vis.hatColor;
        ctx.beginPath();
        ctx.ellipse(cx, headY - r * 0.5, r * 0.78, r * 0.2, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Bandana knot tail
        ctx.fillStyle = vis.hatColor;
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.5, headY - r * 0.35);
        ctx.quadraticCurveTo(cx + r * 0.8, headY - r * 0.2, cx + r * 0.7, headY);
        ctx.quadraticCurveTo(cx + r * 0.6, headY - r * 0.15, cx + r * 0.45, headY - r * 0.25);
        ctx.fill();

        // Skull emblem
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx, headY - r * 0.52, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawTiara(ctx, cx, headY, r, vis) {
        ctx.fillStyle = vis.hatColor;
        // Crown points
        for (let i = 0; i < 5; i++) {
            const px = cx - r * 0.3 + i * r * 0.15;
            const ph = r * 0.15 + (i % 2 === 0 ? r * 0.1 : 0);
            ctx.beginPath();
            ctx.moveTo(px - r * 0.06, headY - r * 0.55);
            ctx.lineTo(px, headY - r * 0.55 - ph);
            ctx.lineTo(px + r * 0.06, headY - r * 0.55);
            ctx.fill();
        }
        // Band
        ctx.fillStyle = vis.hatColor;
        this._roundRect(ctx, cx - r * 0.35, headY - r * 0.58, r * 0.7, r * 0.08, r * 0.02);
        ctx.fill();

        // Gem
        ctx.fillStyle = '#ef476f';
        ctx.beginPath();
        ctx.arc(cx, headY - r * 0.58, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawWand(ctx, x, y, r, vis) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.5);

        // Wand stick
        ctx.fillStyle = '#8B4513';
        this._roundRect(ctx, -r * 0.04, -r * 0.05, r * 0.08, r * 0.6, r * 0.02);
        ctx.fill();

        // Star tip
        ctx.fillStyle = vis.accessoryColor;
        this._drawStarShape(ctx, 0, -r * 0.12, r * 0.1);

        ctx.restore();
    },

    _drawSword(ctx, x, y, r, vis) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.4);

        // Blade
        ctx.fillStyle = vis.accessoryColor;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5);
        ctx.lineTo(-r * 0.06, r * 0.05);
        ctx.lineTo(r * 0.06, r * 0.05);
        ctx.closePath();
        ctx.fill();

        // Guard
        ctx.fillStyle = vis.accessoryColor === '#c0c0c0' ? '#ffd700' : '#c0c0c0';
        this._roundRect(ctx, -r * 0.12, r * 0.02, r * 0.24, r * 0.06, r * 0.02);
        ctx.fill();

        // Handle
        ctx.fillStyle = '#8B4513';
        this._roundRect(ctx, -r * 0.03, r * 0.06, r * 0.06, r * 0.15, r * 0.02);
        ctx.fill();

        ctx.restore();
    },

    _drawMermaidTail(ctx, cx, tailY, r, vis) {
        // Override feet with tail
        ctx.fillStyle = vis.outfitColor;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.35, tailY);
        ctx.quadraticCurveTo(cx, tailY + r * 0.4, cx + r * 0.1, tailY + r * 0.6);
        ctx.quadraticCurveTo(cx + r * 0.3, tailY + r * 0.7, cx + r * 0.4, tailY + r * 0.55);
        ctx.quadraticCurveTo(cx + r * 0.2, tailY + r * 0.5, cx, tailY + r * 0.35);
        ctx.quadraticCurveTo(cx - r * 0.15, tailY + r * 0.15, cx + r * 0.35, tailY);
        ctx.fill();

        // Tail fin
        ctx.fillStyle = vis.outfitAccent;
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.3, tailY + r * 0.5);
        ctx.quadraticCurveTo(cx + r * 0.6, tailY + r * 0.3, cx + r * 0.55, tailY + r * 0.55);
        ctx.quadraticCurveTo(cx + r * 0.5, tailY + r * 0.8, cx + r * 0.3, tailY + r * 0.6);
        ctx.fill();
    },

    _drawCharacterEffects(ctx, charId, size, time, mood) {
        if (mood === 'happy') {
            // Sparkle particles around happy characters
            const sparkleCount = 3;
            for (let i = 0; i < sparkleCount; i++) {
                const angle = (time * 2 + i * (Math.PI * 2 / sparkleCount)) % (Math.PI * 2);
                const dist = size * 0.6 + Math.sin(time * 3 + i) * size * 0.1;
                const sx = Math.cos(angle) * dist;
                const sy = Math.sin(angle) * dist - size * 0.2;
                const sparkleSize = 3 + Math.sin(time * 5 + i * 2) * 2;
                const alpha = 0.4 + Math.sin(time * 4 + i) * 0.3;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#ffd700';
                ctx.translate(sx, sy);
                ctx.rotate(time * 2 + i);
                ctx.beginPath();
                ctx.moveTo(0, -sparkleSize);
                ctx.lineTo(sparkleSize * 0.3, -sparkleSize * 0.3);
                ctx.lineTo(sparkleSize, 0);
                ctx.lineTo(sparkleSize * 0.3, sparkleSize * 0.3);
                ctx.lineTo(0, sparkleSize);
                ctx.lineTo(-sparkleSize * 0.3, sparkleSize * 0.3);
                ctx.lineTo(-sparkleSize, 0);
                ctx.lineTo(-sparkleSize * 0.3, -sparkleSize * 0.3);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
    },

    // ============ UTILITY ============

    _drawStarShape(ctx, cx, cy, r) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const rad = i % 2 === 0 ? r : r * 0.4;
            const x = cx + Math.cos(angle) * rad;
            const y = cy + Math.sin(angle) * rad;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    },

    _roundRect(ctx, x, y, w, h, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    _lightenColor(hex, amount) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.min(255, r + amount);
        g = Math.min(255, g + amount);
        b = Math.min(255, b + amount);
        return `rgb(${r},${g},${b})`;
    }
};

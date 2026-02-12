/**
 * Property Tycoon - Board Renderer
 * Renders the Monopoly board with realistic graphics using HTML5 Canvas
 */

class BoardRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Board dimensions
        this.boardSize = Math.min(this.width * 0.55, this.height * 0.9);
        this.boardX = (this.width * 0.6 - this.boardSize) / 2 + 20;
        this.boardY = (this.height - this.boardSize) / 2;

        // Space dimensions
        this.cornerSize = this.boardSize * 0.13;
        this.spaceWidth = (this.boardSize - 2 * this.cornerSize) / 9;
        this.spaceHeight = this.cornerSize;
        this.colorBarHeight = this.spaceHeight * 0.22;

        // Cache for rendered elements
        this.boardCache = null;
        this.needsRedraw = true;

        // Animation state
        this.animations = [];
        this.diceValues = [1, 1];
        this.diceRolling = false;
        this.diceAngle = 0;

        // Highlighted space
        this.highlightedSpace = -1;
    }

    /**
     * Get pixel coordinates for a board space
     */
    getSpacePosition(spaceId) {
        const bs = this.boardSize;
        const bx = this.boardX;
        const by = this.boardY;
        const cs = this.cornerSize;
        const sw = this.spaceWidth;
        const sh = this.spaceHeight;

        let x, y, w, h;

        if (spaceId === 0) {
            // GO - bottom right corner
            x = bx + bs - cs;
            y = by + bs - cs;
            w = cs; h = cs;
        } else if (spaceId >= 1 && spaceId <= 9) {
            // Bottom row (right to left)
            x = bx + bs - cs - (spaceId) * sw;
            y = by + bs - sh;
            w = sw; h = sh;
        } else if (spaceId === 10) {
            // Jail - bottom left corner
            x = bx;
            y = by + bs - cs;
            w = cs; h = cs;
        } else if (spaceId >= 11 && spaceId <= 19) {
            // Left column (bottom to top)
            x = bx;
            y = by + bs - cs - (spaceId - 10) * sw;
            w = sh; h = sw;
        } else if (spaceId === 20) {
            // Free Parking - top left corner
            x = bx;
            y = by;
            w = cs; h = cs;
        } else if (spaceId >= 21 && spaceId <= 29) {
            // Top row (left to right)
            x = bx + cs + (spaceId - 21) * sw;
            y = by;
            w = sw; h = sh;
        } else if (spaceId === 30) {
            // Go To Jail - top right corner
            x = bx + bs - cs;
            y = by;
            w = cs; h = cs;
        } else if (spaceId >= 31 && spaceId <= 39) {
            // Right column (top to bottom)
            x = bx + bs - sh;
            y = by + cs + (spaceId - 31) * sw;
            w = sh; h = sw;
        }

        return { x, y, w, h };
    }

    /**
     * Get the center of a space for token placement
     */
    getSpaceCenter(spaceId) {
        const pos = this.getSpacePosition(spaceId);
        return {
            x: pos.x + pos.w / 2,
            y: pos.y + pos.h / 2
        };
    }

    /**
     * Render the full board
     */
    render(gameState) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Draw background
        this.drawBackground();

        // Draw board base
        this.drawBoardBase();

        // Draw all spaces
        this.drawAllSpaces(gameState);

        // Draw center area
        this.drawCenterArea(gameState);

        // Draw tokens
        if (gameState) {
            this.drawTokens(gameState);
        }

        // Draw dice
        this.drawDice();

        // Draw highlighted space
        if (this.highlightedSpace >= 0) {
            this.drawHighlight(this.highlightedSpace);
        }

        // Process animations
        this.processAnimations();
    }

    /**
     * Draw the ambient background
     */
    drawBackground() {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width * 0.7
        );
        gradient.addColorStop(0, '#1a3a2a');
        gradient.addColorStop(1, '#0d1f15');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Subtle felt texture pattern
        ctx.globalAlpha = 0.03;
        for (let i = 0; i < 800; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
            ctx.fillRect(x, y, 1, 1);
        }
        ctx.globalAlpha = 1.0;
    }

    /**
     * Draw the board base with wood texture border
     */
    drawBoardBase() {
        const ctx = this.ctx;
        const bx = this.boardX;
        const by = this.boardY;
        const bs = this.boardSize;

        // Outer shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        // Board border (wood-like)
        const borderSize = 6;
        ctx.fillStyle = '#5D4037';
        this.roundRect(bx - borderSize, by - borderSize, bs + borderSize * 2, bs + borderSize * 2, 4);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Inner border highlight
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 2;
        this.roundRect(bx - borderSize + 1, by - borderSize + 1, bs + borderSize * 2 - 2, bs + borderSize * 2 - 2, 4);
        ctx.stroke();

        // Board background (cream/off-white)
        ctx.fillStyle = '#F5F0E1';
        ctx.fillRect(bx, by, bs, bs);

        // Subtle board texture
        ctx.globalAlpha = 0.02;
        for (let i = 0; i < 200; i++) {
            const x = bx + Math.random() * bs;
            const y = by + Math.random() * bs;
            ctx.fillStyle = '#000';
            ctx.fillRect(x, y, Math.random() * 3, Math.random() * 3);
        }
        ctx.globalAlpha = 1.0;

        // Board grid lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bs, bs);
    }

    /**
     * Draw all 40 board spaces
     */
    drawAllSpaces(gameState) {
        const board = GAME_DATA.BOARD;
        for (let i = 0; i < board.length; i++) {
            this.drawSpace(board[i], gameState);
        }
    }

    /**
     * Draw a single board space
     */
    drawSpace(space, gameState) {
        const ctx = this.ctx;
        const pos = this.getSpacePosition(space.id);

        // Draw space background
        ctx.fillStyle = '#F5F0E1';
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 0.5;
        ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
        ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);

        // Draw based on type
        switch (space.type) {
            case 'go':
                this.drawGoSpace(pos, space);
                break;
            case 'property':
                this.drawPropertySpace(pos, space, gameState);
                break;
            case 'railroad':
                this.drawRailroadSpace(pos, space, gameState);
                break;
            case 'utility':
                this.drawUtilitySpace(pos, space, gameState);
                break;
            case 'chance':
                this.drawChanceSpace(pos, space);
                break;
            case 'community':
                this.drawCommunityChestSpace(pos, space);
                break;
            case 'tax':
                this.drawTaxSpace(pos, space);
                break;
            case 'jail':
                this.drawJailSpace(pos, space);
                break;
            case 'free_parking':
                this.drawFreeParkingSpace(pos, space);
                break;
            case 'go_to_jail':
                this.drawGoToJailSpace(pos, space);
                break;
        }

        // Draw ownership indicator
        if (gameState && (space.type === 'property' || space.type === 'railroad' || space.type === 'utility')) {
            const owner = gameState.getPropertyOwner(space.id);
            if (owner !== null) {
                this.drawOwnershipMarker(pos, space, gameState.players[owner]);
            }
        }
    }

    /**
     * Draw the GO space
     */
    drawGoSpace(pos, space) {
        const ctx = this.ctx;

        // Red arrow background
        const gradient = ctx.createLinearGradient(pos.x, pos.y, pos.x + pos.w, pos.y + pos.h);
        gradient.addColorStop(0, '#FFE0E0');
        gradient.addColorStop(1, '#FFF0F0');
        ctx.fillStyle = gradient;
        ctx.fillRect(pos.x, pos.y, pos.w, pos.h);

        ctx.save();
        ctx.translate(pos.x + pos.w / 2, pos.y + pos.h / 2);

        // GO text
        ctx.fillStyle = '#DC143C';
        ctx.font = `bold ${pos.w * 0.28}px "Georgia", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GO', 0, -pos.h * 0.12);

        // Arrow
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        const arrowSize = pos.w * 0.15;
        ctx.moveTo(-arrowSize, pos.h * 0.12);
        ctx.lineTo(arrowSize, pos.h * 0.12);
        ctx.lineTo(0, pos.h * 0.28);
        ctx.closePath();
        ctx.fill();

        // Collect text
        ctx.fillStyle = '#333';
        ctx.font = `${pos.w * 0.09}px "Arial", sans-serif`;
        ctx.fillText('COLLECT $200', 0, pos.h * 0.35);

        ctx.restore();
    }

    /**
     * Draw a property space with color bar
     */
    drawPropertySpace(pos, space, gameState) {
        const ctx = this.ctx;
        const colorData = GAME_DATA.COLORS[space.color];
        const isVertical = space.side === 'left' || space.side === 'right';

        // Color bar
        const gradient = ctx.createLinearGradient(
            pos.x, pos.y,
            isVertical ? pos.x + pos.w : pos.x,
            isVertical ? pos.y : pos.y + pos.h
        );
        gradient.addColorStop(0, colorData.hex);
        gradient.addColorStop(1, colorData.light);

        ctx.fillStyle = gradient;

        if (space.side === 'bottom') {
            ctx.fillRect(pos.x, pos.y, pos.w, this.colorBarHeight);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(pos.x, pos.y, pos.w, this.colorBarHeight);
        } else if (space.side === 'top') {
            ctx.fillRect(pos.x, pos.y + pos.h - this.colorBarHeight, pos.w, this.colorBarHeight);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(pos.x, pos.y + pos.h - this.colorBarHeight, pos.w, this.colorBarHeight);
        } else if (space.side === 'left') {
            ctx.fillRect(pos.x + pos.w - this.colorBarHeight, pos.y, this.colorBarHeight, pos.h);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(pos.x + pos.w - this.colorBarHeight, pos.y, this.colorBarHeight, pos.h);
        } else if (space.side === 'right') {
            ctx.fillRect(pos.x, pos.y, this.colorBarHeight, pos.h);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(pos.x, pos.y, this.colorBarHeight, pos.h);
        }

        // Property name
        ctx.save();
        const center = { x: pos.x + pos.w / 2, y: pos.y + pos.h / 2 };

        if (isVertical) {
            ctx.translate(center.x, center.y);
            ctx.rotate(space.side === 'left' ? Math.PI / 2 : -Math.PI / 2);
        } else {
            ctx.translate(center.x, center.y);
            if (space.side === 'top') ctx.rotate(Math.PI);
        }

        const fontSize = Math.min(pos.w, pos.h) * 0.11;
        ctx.fillStyle = '#222';
        ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Split name into lines
        const words = space.name.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            if (currentLine && (currentLine + ' ' + word).length > 12) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = currentLine ? currentLine + ' ' + word : word;
            }
        }
        if (currentLine) lines.push(currentLine);

        const lineHeight = fontSize * 1.2;
        const startY = -(lines.length - 1) * lineHeight / 2;

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], 0, startY + i * lineHeight - (isVertical ? 0 : pos.h * 0.05));
        }

        // Price
        ctx.font = `${fontSize * 0.85}px "Arial", sans-serif`;
        ctx.fillStyle = '#555';
        ctx.fillText(`$${space.price}`, 0, startY + lines.length * lineHeight + fontSize * 0.2 - (isVertical ? 0 : pos.h * 0.05));

        ctx.restore();

        // Draw houses/hotel if owned
        if (gameState) {
            const propState = gameState.properties[space.id];
            if (propState && propState.houses > 0) {
                this.drawHouses(pos, space, propState.houses);
            }
        }
    }

    /**
     * Draw houses/hotel on a property
     */
    drawHouses(pos, space, houseCount) {
        const ctx = this.ctx;
        const isVertical = space.side === 'left' || space.side === 'right';

        if (houseCount === 5) {
            // Hotel - red
            ctx.fillStyle = '#DC143C';
            const hotelSize = Math.min(pos.w, pos.h) * 0.2;
            let hx, hy;
            if (space.side === 'bottom') {
                hx = pos.x + pos.w / 2 - hotelSize / 2;
                hy = pos.y + 2;
            } else if (space.side === 'top') {
                hx = pos.x + pos.w / 2 - hotelSize / 2;
                hy = pos.y + pos.h - this.colorBarHeight - hotelSize - 2;
            } else if (space.side === 'left') {
                hx = pos.x + pos.w - this.colorBarHeight - hotelSize - 2;
                hy = pos.y + pos.h / 2 - hotelSize / 2;
            } else {
                hx = pos.x + this.colorBarHeight + 2;
                hy = pos.y + pos.h / 2 - hotelSize / 2;
            }
            ctx.fillRect(hx, hy, hotelSize, hotelSize * 0.7);
            // Roof
            ctx.beginPath();
            ctx.moveTo(hx - 2, hy);
            ctx.lineTo(hx + hotelSize / 2, hy - hotelSize * 0.4);
            ctx.lineTo(hx + hotelSize + 2, hy);
            ctx.closePath();
            ctx.fill();
        } else {
            // Houses - green
            ctx.fillStyle = '#228B22';
            const houseSize = Math.min(pos.w, pos.h) * 0.12;
            for (let i = 0; i < houseCount; i++) {
                let hx, hy;
                if (space.side === 'bottom') {
                    hx = pos.x + 3 + i * (houseSize + 2);
                    hy = pos.y + 3;
                } else if (space.side === 'top') {
                    hx = pos.x + 3 + i * (houseSize + 2);
                    hy = pos.y + pos.h - this.colorBarHeight - houseSize - 3;
                } else if (space.side === 'left') {
                    hx = pos.x + pos.w - this.colorBarHeight - houseSize - 3;
                    hy = pos.y + 3 + i * (houseSize + 2);
                } else {
                    hx = pos.x + this.colorBarHeight + 3;
                    hy = pos.y + 3 + i * (houseSize + 2);
                }
                ctx.fillRect(hx, hy, houseSize, houseSize * 0.7);
                // Small roof
                ctx.beginPath();
                ctx.moveTo(hx - 1, hy);
                ctx.lineTo(hx + houseSize / 2, hy - houseSize * 0.35);
                ctx.lineTo(hx + houseSize + 1, hy);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    /**
     * Draw a railroad space
     */
    drawRailroadSpace(pos, space, gameState) {
        const ctx = this.ctx;
        const isVertical = space.side === 'left' || space.side === 'right';

        ctx.save();
        const center = { x: pos.x + pos.w / 2, y: pos.y + pos.h / 2 };

        if (isVertical) {
            ctx.translate(center.x, center.y);
            ctx.rotate(space.side === 'left' ? Math.PI / 2 : -Math.PI / 2);
        } else {
            ctx.translate(center.x, center.y);
            if (space.side === 'top') ctx.rotate(Math.PI);
        }

        // Train icon
        const iconSize = Math.min(pos.w, pos.h) * 0.25;
        ctx.fillStyle = '#333';
        ctx.font = `${iconSize}px "Arial"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚂', 0, -pos.h * 0.08);

        // Name
        const fontSize = Math.min(pos.w, pos.h) * 0.1;
        ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
        ctx.fillStyle = '#222';

        const words = space.name.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            if (currentLine && (currentLine + ' ' + word).length > 10) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = currentLine ? currentLine + ' ' + word : word;
            }
        }
        if (currentLine) lines.push(currentLine);

        const lineHeight = fontSize * 1.2;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], 0, pos.h * 0.12 + i * lineHeight);
        }

        // Price
        ctx.font = `${fontSize * 0.8}px "Arial", sans-serif`;
        ctx.fillStyle = '#555';
        ctx.fillText('$200', 0, pos.h * 0.35);

        ctx.restore();
    }

    /**
     * Draw a utility space
     */
    drawUtilitySpace(pos, space, gameState) {
        const ctx = this.ctx;
        const isVertical = space.side === 'left' || space.side === 'right';

        ctx.save();
        const center = { x: pos.x + pos.w / 2, y: pos.y + pos.h / 2 };

        if (isVertical) {
            ctx.translate(center.x, center.y);
            ctx.rotate(space.side === 'left' ? Math.PI / 2 : -Math.PI / 2);
        } else {
            ctx.translate(center.x, center.y);
            if (space.side === 'top') ctx.rotate(Math.PI);
        }

        const iconSize = Math.min(pos.w, pos.h) * 0.25;
        ctx.font = `${iconSize}px "Arial"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icon = space.name.includes('Electric') ? '💡' : '💧';
        ctx.fillText(icon, 0, -pos.h * 0.1);

        const fontSize = Math.min(pos.w, pos.h) * 0.1;
        ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
        ctx.fillStyle = '#222';

        const words = space.name.split(' ');
        for (let i = 0; i < words.length; i++) {
            ctx.fillText(words[i], 0, pos.h * 0.1 + i * fontSize * 1.2);
        }

        ctx.font = `${fontSize * 0.8}px "Arial", sans-serif`;
        ctx.fillStyle = '#555';
        ctx.fillText('$150', 0, pos.h * 0.35);

        ctx.restore();
    }

    /**
     * Draw a Chance space
     */
    drawChanceSpace(pos, space) {
        const ctx = this.ctx;
        const isVertical = space.side === 'left' || space.side === 'right';

        // Orange-ish background
        ctx.fillStyle = '#FFF3E0';
        ctx.fillRect(pos.x + 1, pos.y + 1, pos.w - 2, pos.h - 2);

        ctx.save();
        const center = { x: pos.x + pos.w / 2, y: pos.y + pos.h / 2 };

        if (isVertical) {
            ctx.translate(center.x, center.y);
            ctx.rotate(space.side === 'left' ? Math.PI / 2 : -Math.PI / 2);
        } else {
            ctx.translate(center.x, center.y);
            if (space.side === 'top') ctx.rotate(Math.PI);
        }

        const iconSize = Math.min(pos.w, pos.h) * 0.3;
        ctx.font = `${iconSize}px "Arial"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❓', 0, -pos.h * 0.06);

        const fontSize = Math.min(pos.w, pos.h) * 0.12;
        ctx.font = `bold ${fontSize}px "Georgia", serif`;
        ctx.fillStyle = '#E65100';
        ctx.fillText('CHANCE', 0, pos.h * 0.22);

        ctx.restore();
    }

    /**
     * Draw a Community Chest space
     */
    drawCommunityChestSpace(pos, space) {
        const ctx = this.ctx;
        const isVertical = space.side === 'left' || space.side === 'right';

        // Light blue background
        ctx.fillStyle = '#E3F2FD';
        ctx.fillRect(pos.x + 1, pos.y + 1, pos.w - 2, pos.h - 2);

        ctx.save();
        const center = { x: pos.x + pos.w / 2, y: pos.y + pos.h / 2 };

        if (isVertical) {
            ctx.translate(center.x, center.y);
            ctx.rotate(space.side === 'left' ? Math.PI / 2 : -Math.PI / 2);
        } else {
            ctx.translate(center.x, center.y);
            if (space.side === 'top') ctx.rotate(Math.PI);
        }

        const iconSize = Math.min(pos.w, pos.h) * 0.25;
        ctx.font = `${iconSize}px "Arial"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📦', 0, -pos.h * 0.08);

        const fontSize = Math.min(pos.w, pos.h) * 0.09;
        ctx.font = `bold ${fontSize}px "Georgia", serif`;
        ctx.fillStyle = '#1565C0';
        ctx.fillText('COMMUNITY', 0, pos.h * 0.14);
        ctx.fillText('CHEST', 0, pos.h * 0.28);

        ctx.restore();
    }

    /**
     * Draw a Tax space
     */
    drawTaxSpace(pos, space) {
        const ctx = this.ctx;
        const isVertical = space.side === 'left' || space.side === 'right';

        ctx.save();
        const center = { x: pos.x + pos.w / 2, y: pos.y + pos.h / 2 };

        if (isVertical) {
            ctx.translate(center.x, center.y);
            ctx.rotate(space.side === 'left' ? Math.PI / 2 : -Math.PI / 2);
        } else {
            ctx.translate(center.x, center.y);
            if (space.side === 'top') ctx.rotate(Math.PI);
        }

        const iconSize = Math.min(pos.w, pos.h) * 0.22;
        ctx.font = `${iconSize}px "Arial"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💰', 0, -pos.h * 0.12);

        const fontSize = Math.min(pos.w, pos.h) * 0.1;
        ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
        ctx.fillStyle = '#222';
        ctx.fillText(space.name.toUpperCase(), 0, pos.h * 0.08);

        ctx.font = `${fontSize * 0.9}px "Arial", sans-serif`;
        ctx.fillStyle = '#555';
        ctx.fillText(`PAY $${space.amount}`, 0, pos.h * 0.25);

        ctx.restore();
    }

    /**
     * Draw the Jail space
     */
    drawJailSpace(pos) {
        const ctx = this.ctx;
        const padding = 4;

        // "Just Visiting" area (left bottom)
        ctx.fillStyle = '#FFF8E1';
        ctx.fillRect(pos.x, pos.y, pos.w, pos.h);

        // Jail cell area (inner)
        const cellSize = pos.w * 0.55;
        const cellX = pos.x + pos.w - cellSize - padding;
        const cellY = pos.y + padding;

        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(cellX, cellY, cellSize, cellSize);

        // Jail bars
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        const barCount = 4;
        for (let i = 0; i <= barCount; i++) {
            const bx = cellX + (cellSize / barCount) * i;
            ctx.beginPath();
            ctx.moveTo(bx, cellY);
            ctx.lineTo(bx, cellY + cellSize);
            ctx.stroke();
        }
        // Horizontal bars
        for (let i = 0; i <= barCount; i++) {
            const by = cellY + (cellSize / barCount) * i;
            ctx.beginPath();
            ctx.moveTo(cellX, by);
            ctx.lineTo(cellX + cellSize, by);
            ctx.stroke();
        }

        // "IN JAIL" text
        ctx.save();
        ctx.translate(cellX + cellSize / 2, cellY + cellSize / 2);
        ctx.fillStyle = '#222';
        const fs = cellSize * 0.18;
        ctx.font = `bold ${fs}px "Arial"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('IN', 0, -fs * 0.6);
        ctx.fillText('JAIL', 0, fs * 0.6);
        ctx.restore();

        // "JUST VISITING" text
        ctx.save();
        ctx.translate(pos.x + pos.w * 0.2, pos.y + pos.h * 0.85);
        ctx.rotate(-Math.PI / 4);
        const fv = pos.w * 0.07;
        ctx.font = `bold ${fv}px "Arial"`;
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('JUST VISITING', 0, 0);
        ctx.restore();
    }

    /**
     * Draw Free Parking space
     */
    drawFreeParkingSpace(pos) {
        const ctx = this.ctx;

        // Green tint background
        ctx.fillStyle = '#E8F5E9';
        ctx.fillRect(pos.x, pos.y, pos.w, pos.h);

        ctx.save();
        ctx.translate(pos.x + pos.w / 2, pos.y + pos.h / 2);

        const iconSize = pos.w * 0.3;
        ctx.font = `${iconSize}px "Arial"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🅿️', 0, -pos.h * 0.08);

        const fontSize = pos.w * 0.1;
        ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
        ctx.fillStyle = '#222';
        ctx.fillText('FREE', 0, pos.h * 0.2);
        ctx.fillText('PARKING', 0, pos.h * 0.33);

        ctx.restore();
    }

    /**
     * Draw Go To Jail space
     */
    drawGoToJailSpace(pos) {
        const ctx = this.ctx;

        // Red tint
        ctx.fillStyle = '#FFEBEE';
        ctx.fillRect(pos.x, pos.y, pos.w, pos.h);

        ctx.save();
        ctx.translate(pos.x + pos.w / 2, pos.y + pos.h / 2);

        const iconSize = pos.w * 0.25;
        ctx.font = `${iconSize}px "Arial"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👮', 0, -pos.h * 0.12);

        const fontSize = pos.w * 0.1;
        ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
        ctx.fillStyle = '#B71C1C';
        ctx.fillText('GO TO', 0, pos.h * 0.12);
        ctx.fillText('JAIL', 0, pos.h * 0.26);

        ctx.restore();
    }

    /**
     * Draw ownership marker on a property
     */
    drawOwnershipMarker(pos, space, owner) {
        const ctx = this.ctx;
        const markerSize = 6;
        const isVertical = space.side === 'left' || space.side === 'right';

        let mx, my;
        if (space.side === 'bottom') {
            mx = pos.x + pos.w / 2;
            my = pos.y + pos.h - markerSize - 2;
        } else if (space.side === 'top') {
            mx = pos.x + pos.w / 2;
            my = pos.y + markerSize + 2;
        } else if (space.side === 'left') {
            mx = pos.x + markerSize + 2;
            my = pos.y + pos.h / 2;
        } else {
            mx = pos.x + pos.w - markerSize - 2;
            my = pos.y + pos.h / 2;
        }

        ctx.beginPath();
        ctx.arc(mx, my, markerSize, 0, Math.PI * 2);
        ctx.fillStyle = owner.token.color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /**
     * Draw the center area of the board
     */
    drawCenterArea(gameState) {
        const ctx = this.ctx;
        const cs = this.cornerSize;
        const bx = this.boardX + cs;
        const by = this.boardY + cs;
        const bw = this.boardSize - 2 * cs;
        const bh = this.boardSize - 2 * cs;

        // Subtle inner border
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);

        // Title
        ctx.save();
        ctx.translate(bx + bw / 2, by + bh * 0.15);

        const titleSize = bw * 0.09;
        ctx.font = `bold ${titleSize}px "Georgia", serif`;
        ctx.fillStyle = '#DC143C';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PROPERTY', 0, 0);

        const subtitleSize = bw * 0.12;
        ctx.font = `bold italic ${subtitleSize}px "Georgia", serif`;
        ctx.fillStyle = '#222';
        ctx.fillText('TYCOON', 0, titleSize * 1.3);

        ctx.restore();

        // Decorative lines
        const lineY = by + bh * 0.35;
        ctx.strokeStyle = '#DC143C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.15, lineY);
        ctx.lineTo(bx + bw * 0.85, lineY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.15, lineY + 4);
        ctx.lineTo(bx + bw * 0.85, lineY + 4);
        ctx.stroke();

        // Chance & Community Chest card piles
        this.drawCardPile(bx + bw * 0.25, by + bh * 0.45, bw * 0.2, bh * 0.15, 'CHANCE', '#FF8C00');
        this.drawCardPile(bx + bw * 0.55, by + bh * 0.45, bw * 0.2, bh * 0.15, 'COMMUNITY\nCHEST', '#1565C0');

        // Dice area indicator
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + bh * 0.78, bw * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a card pile in the center
     */
    drawCardPile(x, y, w, h, label, color) {
        const ctx = this.ctx;

        // Card stack effect
        for (let i = 2; i >= 0; i--) {
            ctx.fillStyle = i === 0 ? '#fff' : '#f5f5f5';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            const offset = i * 2;
            this.roundRect(x + offset, y + offset, w, h, 3);
            ctx.fill();
            this.roundRect(x + offset, y + offset, w, h, 3);
            ctx.stroke();
        }

        // Label
        ctx.fillStyle = color;
        const fontSize = w * 0.15;
        ctx.font = `bold ${fontSize}px "Georgia", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lines = label.split('\n');
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * fontSize * 1.2);
        }
    }

    /**
     * Draw player tokens on the board
     */
    drawTokens(gameState) {
        const ctx = this.ctx;

        gameState.players.forEach((player, index) => {
            if (player.bankrupt) return;

            const center = this.getSpaceCenter(player.position);
            const tokenSize = 12;

            // Offset tokens so they don't overlap
            const offsets = [
                { x: -8, y: -8 }, { x: 8, y: -8 },
                { x: -8, y: 8 }, { x: 8, y: 8 },
                { x: 0, y: -12 }, { x: 0, y: 12 }
            ];
            const offset = offsets[index] || { x: 0, y: 0 };

            const tx = center.x + offset.x;
            const ty = center.y + offset.y;

            // Token shadow
            ctx.beginPath();
            ctx.arc(tx + 1, ty + 1, tokenSize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fill();

            // Token body
            ctx.beginPath();
            ctx.arc(tx, ty, tokenSize, 0, Math.PI * 2);
            const tokenGrad = ctx.createRadialGradient(tx - 3, ty - 3, 0, tx, ty, tokenSize);
            tokenGrad.addColorStop(0, this.lightenColor(player.token.color, 40));
            tokenGrad.addColorStop(1, player.token.color);
            ctx.fillStyle = tokenGrad;
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Token symbol
            ctx.font = `${tokenSize * 1.1}px "Arial"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(player.token.symbol, tx, ty);

            // Current player indicator
            if (gameState.currentPlayerIndex === index) {
                ctx.beginPath();
                ctx.arc(tx, ty, tokenSize + 4, 0, Math.PI * 2);
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 2]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
    }

    /**
     * Draw dice
     */
    drawDice() {
        const ctx = this.ctx;
        const cs = this.cornerSize;
        const centerX = this.boardX + cs + (this.boardSize - 2 * cs) / 2;
        const centerY = this.boardY + cs + (this.boardSize - 2 * cs) * 0.78;
        const diceSize = 28;
        const gap = 8;

        for (let d = 0; d < 2; d++) {
            const dx = centerX + (d === 0 ? -diceSize - gap / 2 : gap / 2);
            const dy = centerY - diceSize / 2;

            ctx.save();

            if (this.diceRolling) {
                ctx.translate(dx + diceSize / 2, dy + diceSize / 2);
                ctx.rotate(this.diceAngle + d * 0.5);
                ctx.translate(-diceSize / 2, -diceSize / 2);
            } else {
                ctx.translate(dx, dy);
            }

            // Die shadow
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Die body
            ctx.fillStyle = '#FFFEF5';
            this.roundRect(0, 0, diceSize, diceSize, 4);
            ctx.fill();
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            this.roundRect(0, 0, diceSize, diceSize, 4);
            ctx.stroke();

            ctx.shadowColor = 'transparent';

            // Dots
            const value = this.diceRolling ? Math.ceil(Math.random() * 6) : this.diceValues[d];
            this.drawDiceDots(diceSize, value);

            ctx.restore();
        }
    }

    /**
     * Draw dots on a die face
     */
    drawDiceDots(size, value) {
        const ctx = this.ctx;
        const dotRadius = size * 0.08;
        const positions = {
            1: [[0.5, 0.5]],
            2: [[0.25, 0.25], [0.75, 0.75]],
            3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
            4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
            5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
            6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]]
        };

        ctx.fillStyle = '#333';
        (positions[value] || positions[1]).forEach(([px, py]) => {
            ctx.beginPath();
            ctx.arc(size * px, size * py, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Draw highlight around a space
     */
    drawHighlight(spaceId) {
        const ctx = this.ctx;
        const pos = this.getSpacePosition(spaceId);

        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(pos.x - 2, pos.y - 2, pos.w + 4, pos.h + 4);
        ctx.setLineDash([]);

        // Glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x - 2, pos.y - 2, pos.w + 4, pos.h + 4);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    /**
     * Animate dice rolling
     */
    startDiceAnimation(callback) {
        this.diceRolling = true;
        const startTime = Date.now();
        const duration = 1000;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            this.diceAngle = (elapsed / 100) * Math.PI;

            if (elapsed < duration) {
                requestAnimationFrame(animate);
            } else {
                this.diceRolling = false;
                if (callback) callback();
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Set dice values
     */
    setDiceValues(d1, d2) {
        this.diceValues = [d1, d2];
    }

    /**
     * Process active animations
     */
    processAnimations() {
        // Cleanup finished animations
        this.animations = this.animations.filter(a => !a.finished);
    }

    /**
     * Helper: draw rounded rectangle
     */
    roundRect(x, y, w, h, r) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /**
     * Helper: lighten a hex color
     */
    lightenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
        const b = Math.min(255, (num & 0x0000FF) + amount);
        return `rgb(${r},${g},${b})`;
    }
}

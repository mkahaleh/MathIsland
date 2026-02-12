/**
 * Property Tycoon - Input Handler
 * Handles Samsung TV remote control, keyboard, and mouse/touch input
 * Optimized for Tizen TV lean-back experience
 */

class InputHandler {
    constructor() {
        this.focusIndex = 0;
        this.focusableElements = [];
        this.onAction = null;
        this.onNavigate = null;
        this.onBack = null;
        this.enabled = true;
        this.repeatDelay = 300; // ms before key repeat
        this.lastKeyTime = 0;

        this.init();
    }

    /**
     * Initialize input listeners
     */
    init() {
        // Register Tizen TV remote keys
        this.registerTizenKeys();

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Mouse/touch support (for development/testing)
        document.addEventListener('click', (e) => this.handleClick(e));
        document.addEventListener('touchstart', (e) => this.handleTouch(e));
    }

    /**
     * Register Samsung TV remote control keys
     */
    registerTizenKeys() {
        try {
            if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
                const keys = [
                    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                    'Enter', 'Return',
                    'ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue',
                    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                    'MediaPlay', 'MediaPause', 'MediaStop',
                    'ChannelUp', 'ChannelDown',
                    'Info', 'Guide', 'Tools'
                ];

                keys.forEach(key => {
                    try {
                        tizen.tvinputdevice.registerKey(key);
                    } catch (e) {
                        // Key may not be available on all models
                    }
                });
            }
        } catch (e) {
            // Not running on Tizen - use standard keyboard
            console.log('Not running on Tizen TV. Using standard keyboard input.');
        }
    }

    /**
     * Handle keydown events
     */
    handleKeyDown(e) {
        if (!this.enabled) return;

        // Prevent key repeat spam
        const now = Date.now();
        if (now - this.lastKeyTime < 100) return;
        this.lastKeyTime = now;

        const keyCode = e.keyCode;
        const key = e.key;

        // Map Tizen remote keys and standard keyboard
        switch (keyCode) {
            // Arrow keys / D-pad
            case 38: // Up
                e.preventDefault();
                this.navigate('up');
                break;
            case 40: // Down
                e.preventDefault();
                this.navigate('down');
                break;
            case 37: // Left
                e.preventDefault();
                this.navigate('left');
                break;
            case 39: // Right
                e.preventDefault();
                this.navigate('right');
                break;

            // Enter / OK button
            case 13:
                e.preventDefault();
                this.select();
                break;

            // Return / Back button
            case 10009: // Tizen back
            case 27: // Escape
            case 8: // Backspace
                e.preventDefault();
                if (this.onBack) this.onBack();
                break;

            // Color buttons (Tizen TV)
            case 403: // Red
                this.colorAction('red');
                break;
            case 404: // Green
                this.colorAction('green');
                break;
            case 405: // Yellow
                this.colorAction('yellow');
                break;
            case 406: // Blue
                this.colorAction('blue');
                break;

            // Number keys for quick actions
            case 48: case 49: case 50: case 51: case 52:
            case 53: case 54: case 55: case 56: case 57:
                this.numberAction(keyCode - 48);
                break;

            // Space bar - roll dice shortcut
            case 32:
                e.preventDefault();
                if (this.onAction) this.onAction('roll');
                break;

            // Tab - cycle focus
            case 9:
                e.preventDefault();
                this.navigate(e.shiftKey ? 'up' : 'down');
                break;

            // Info button
            case 457:
                if (this.onAction) this.onAction('info');
                break;
        }
    }

    /**
     * Navigate focus
     */
    navigate(direction) {
        if (this.focusableElements.length === 0) return;

        const oldIndex = this.focusIndex;

        switch (direction) {
            case 'up':
                this.focusIndex = Math.max(0, this.focusIndex - 1);
                break;
            case 'down':
                this.focusIndex = Math.min(this.focusableElements.length - 1, this.focusIndex + 1);
                break;
            case 'left':
                this.focusIndex = Math.max(0, this.focusIndex - 1);
                break;
            case 'right':
                this.focusIndex = Math.min(this.focusableElements.length - 1, this.focusIndex + 1);
                break;
        }

        // Update visual focus
        this.updateFocus(oldIndex, this.focusIndex);

        if (this.onNavigate) {
            this.onNavigate(direction, this.focusIndex);
        }

        // Play focus sound
        this.playFocusSound();
    }

    /**
     * Select current focused element
     */
    select() {
        if (this.focusableElements.length === 0) return;

        const focused = this.focusableElements[this.focusIndex];
        if (focused) {
            // Trigger the element's click
            focused.click();

            // Visual feedback
            focused.classList.add('btn-pressed');
            setTimeout(() => focused.classList.remove('btn-pressed'), 150);

            // Play select sound
            this.playSelectSound();
        }
    }

    /**
     * Handle color button actions
     */
    colorAction(color) {
        switch (color) {
            case 'red':
                if (this.onAction) this.onAction('roll');
                break;
            case 'green':
                if (this.onAction) this.onAction('buy');
                break;
            case 'yellow':
                if (this.onAction) this.onAction('manage');
                break;
            case 'blue':
                if (this.onAction) this.onAction('end_turn');
                break;
        }
    }

    /**
     * Handle number key actions
     */
    numberAction(num) {
        if (this.onAction) {
            this.onAction('number', num);
        }
    }

    /**
     * Handle click events
     */
    handleClick(e) {
        if (!this.enabled) return;

        const target = e.target.closest('.focusable, .btn-action, .menu-item');
        if (target) {
            const index = this.focusableElements.indexOf(target);
            if (index >= 0) {
                this.focusIndex = index;
                this.updateFocus(-1, index);
            }
        }
    }

    /**
     * Handle touch events
     */
    handleTouch(e) {
        // Convert to click for simplicity
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target) target.click();
        }
    }

    /**
     * Update focusable elements list
     */
    setFocusableElements(elements) {
        // Remove old focus
        this.focusableElements.forEach(el => el.classList.remove('focused'));

        this.focusableElements = Array.from(elements);
        this.focusIndex = 0;

        if (this.focusableElements.length > 0) {
            this.focusableElements[0].classList.add('focused');
        }
    }

    /**
     * Refresh focusable elements from DOM
     */
    refreshFocusables() {
        const elements = document.querySelectorAll('.focusable:not(.hidden):not(.disabled)');
        this.setFocusableElements(elements);
    }

    /**
     * Update visual focus state
     */
    updateFocus(oldIndex, newIndex) {
        if (oldIndex >= 0 && oldIndex < this.focusableElements.length) {
            this.focusableElements[oldIndex].classList.remove('focused');
        }
        if (newIndex >= 0 && newIndex < this.focusableElements.length) {
            this.focusableElements[newIndex].classList.add('focused');
            // Ensure visible
            this.focusableElements[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Reset focus
     */
    resetFocus() {
        this.focusableElements.forEach(el => el.classList.remove('focused'));
        this.focusIndex = 0;
        if (this.focusableElements.length > 0) {
            this.focusableElements[0].classList.add('focused');
        }
    }

    /**
     * Enable/disable input
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Play focus navigation sound
     */
    playFocusSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.05;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {
            // Audio not available
        }
    }

    /**
     * Play selection sound
     */
    playSelectSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 1200;
            gain.gain.value = 0.08;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            // Audio not available
        }
    }
}

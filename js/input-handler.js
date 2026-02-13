/* ========================================
   MATH ISLAND - Input Handler
   Samsung Smart TV Remote Control Support
   Full keyboard + remote + pause support
   ======================================== */

class InputHandler {
    constructor(ui) {
        this.ui = ui;
        this.game = ui.game;

        // Samsung TV remote key codes
        this.keys = {
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            ENTER: 13,
            RETURN: 10009,   // Samsung back button
            EXIT: 10182,
            RED: 403,
            GREEN: 404,
            YELLOW: 405,
            BLUE: 406,
            PLAY: 415,
            PAUSE: 19,
            STOP: 413,

            // Keyboard fallbacks
            ESCAPE: 27,
            SPACE: 32,
            W: 87,
            A: 65,
            S: 83,
            D: 68,
            H: 72,       // Hint key
            P: 80,       // Pause key
            ONE: 49,
            TWO: 50,
            THREE: 51,
            FOUR: 52
        };

        this._onKeyDown = this._onKeyDown.bind(this);
        document.addEventListener('keydown', this._onKeyDown);

        // Register Samsung TV keys
        this._registerTVKeys();
    }

    _registerTVKeys() {
        try {
            if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
                const supportedKeys = [
                    'ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue',
                    'MediaPlay', 'MediaPause', 'MediaStop'
                ];
                supportedKeys.forEach(key => {
                    try {
                        tizen.tvinputdevice.registerKey(key);
                    } catch (e) {}
                });
            }
        } catch (e) {
            // Not on Samsung TV, use keyboard controls
        }
    }

    _onKeyDown(e) {
        const code = e.keyCode;

        // Prevent default for game keys
        if ([37, 38, 39, 40, 13, 32, 27, 72, 80].includes(code)) {
            e.preventDefault();
        }

        // Resume audio context on first interaction
        audio.resume();

        // Global back/exit
        if (code === this.keys.RETURN || code === this.keys.ESCAPE) {
            this._handleBack();
            return;
        }

        // Global pause toggle (P key or TV pause button)
        if (code === this.keys.P || code === this.keys.PAUSE) {
            if (this.ui.currentScreen === 'hud') {
                this.ui._handleAction('pause-game');
                return;
            } else if (this.ui.currentScreen === 'pause') {
                this.ui._handleAction('resume-game');
                return;
            }
        }

        // Route to screen-specific handler
        switch (this.ui.currentScreen) {
            case 'menu':
                this._handleMenuInput(code);
                break;
            case 'tutorial':
                this._handleTutorialInput(code);
                break;
            case 'characterSelect':
                this._handleCharacterSelectInput(code);
                break;
            case 'levelSelect':
                this._handleLevelSelectInput(code);
                break;
            case 'hud':
                this._handleGameInput(code);
                break;
            case 'pause':
                this._handlePauseInput(code);
                break;
            case 'complete':
                this._handleCompleteInput(code);
                break;
            case 'achievements':
                this._handleAchievementsInput(code);
                break;
            case 'settings':
                this._handleSettingsInput(code);
                break;
            case 'stickers':
                this._handleStickersInput(code);
                break;
            case 'parentStats':
                this._handleParentStatsInput(code);
                break;
            case 'vsaiSelect':
                this._handleVsAiSelectInput(code);
                break;
            case 'vsaiHud':
                this._handleVsAiHudInput(code);
                break;
            case 'vsaiComplete':
                this._handleVsAiCompleteInput(code);
                break;
        }
    }

    // ---- Navigation Helpers ----

    _navigateFocusables(direction) {
        const focusables = this.ui.getCurrentFocusables();
        if (focusables.length === 0) return;

        const currentFocused = document.activeElement;
        let currentIndex = focusables.indexOf(currentFocused);

        if (currentIndex === -1) {
            focusables[0].focus();
            return;
        }

        let nextIndex;
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % focusables.length;
        } else if (direction === 'prev') {
            nextIndex = (currentIndex - 1 + focusables.length) % focusables.length;
        } else if (direction === 'up' || direction === 'down' ||
                   direction === 'left' || direction === 'right') {
            nextIndex = this._findSpatialNeighbor(focusables, currentIndex, direction);
        }

        if (nextIndex !== undefined && nextIndex !== currentIndex) {
            focusables[nextIndex].focus();
            // Play subtle navigation tick
            if (typeof audio !== 'undefined' && audio.playNavTick) {
                audio.playNavTick();
            }
        }
    }

    _findSpatialNeighbor(elements, currentIndex, direction) {
        const current = elements[currentIndex];
        const currentRect = current.getBoundingClientRect();
        const cx = currentRect.left + currentRect.width / 2;
        const cy = currentRect.top + currentRect.height / 2;

        let bestIndex = currentIndex;
        let bestDistance = Infinity;
        const isVertical = direction === 'up' || direction === 'down';

        for (let i = 0; i < elements.length; i++) {
            if (i === currentIndex) continue;

            const rect = elements[i].getBoundingClientRect();
            const ex = rect.left + rect.width / 2;
            const ey = rect.top + rect.height / 2;
            const dx = ex - cx;
            const dy = ey - cy;

            let isValid;
            switch (direction) {
                case 'up':    isValid = dy < -10; break;
                case 'down':  isValid = dy > 10; break;
                case 'left':  isValid = dx < -10; break;
                case 'right': isValid = dx > 10; break;
            }

            if (isValid) {
                const primaryDist = isVertical ? Math.abs(dy) : Math.abs(dx);
                const crossDist = isVertical ? Math.abs(dx) : Math.abs(dy);
                const weightedDist = primaryDist + crossDist * 3;

                if (weightedDist < bestDistance) {
                    bestDistance = weightedDist;
                    bestIndex = i;
                }
            }
        }

        return bestIndex;
    }

    _activateFocused() {
        const focused = document.activeElement;
        if (focused && focused.click) {
            focused.click();
        }
    }

    // ---- Screen-Specific Handlers ----

    _handleBack() {
        switch (this.ui.currentScreen) {
            case 'menu':
                try {
                    if (typeof tizen !== 'undefined') {
                        tizen.application.getCurrentApplication().exit();
                    }
                } catch (e) {}
                break;
            case 'tutorial':
                this.ui._handleAction('skip-tutorial');
                break;
            case 'characterSelect':
                this.ui._handleAction('back-to-menu');
                break;
            case 'levelSelect':
                this.ui._handleAction('back-to-characters');
                break;
            case 'hud':
                this.ui._handleAction('pause-game');
                break;
            case 'pause':
                this.ui._handleAction('resume-game');
                break;
            case 'complete':
                this.ui._handleAction('back-to-map');
                break;
            case 'achievements':
                this.ui._handleAction('back-to-menu');
                break;
            case 'settings':
                this.ui._handleAction('settings-back');
                break;
            case 'stickers':
                this.ui._handleAction('back-to-menu');
                break;
            case 'parentStats':
                this.ui._handleAction('back-to-settings');
                break;
            case 'vsaiSelect':
                this.ui._handleAction('vsai-back-to-menu');
                break;
            case 'vsaiHud':
                this.ui._handleAction('vsai-quit');
                break;
            case 'vsaiComplete':
                this.ui._handleAction('vsai-back-to-menu-end');
                break;
        }
        audio.playSelect();
    }

    _handleMenuInput(code) {
        switch (code) {
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('prev');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('next');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
        }
    }

    _handleTutorialInput(code) {
        switch (code) {
            case this.keys.RIGHT:
            case this.keys.D:
            case this.keys.ENTER:
            case this.keys.SPACE:
                this.ui._handleAction('next-tutorial');
                break;
            case this.keys.LEFT:
            case this.keys.A:
                if (this.ui.currentTutorialPage > 0) {
                    this.ui.currentTutorialPage -= 2;
                    this.ui._handleAction('next-tutorial');
                }
                break;
            case this.keys.UP:
            case this.keys.W:
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables(code === this.keys.UP || code === this.keys.W ? 'prev' : 'next');
                break;
        }
    }

    _handleCharacterSelectInput(code) {
        switch (code) {
            case this.keys.LEFT:
            case this.keys.A:
                this._navigateFocusables('left');
                break;
            case this.keys.RIGHT:
            case this.keys.D:
                this._navigateFocusables('right');
                break;
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('up');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('down');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
        }
    }

    _handleLevelSelectInput(code) {
        switch (code) {
            case this.keys.LEFT:
            case this.keys.A:
                this._navigateFocusables('left');
                break;
            case this.keys.RIGHT:
            case this.keys.D:
                this._navigateFocusables('right');
                break;
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('up');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('down');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
        }
    }

    _handleGameInput(code) {
        if (this.game.isAnswering) return;

        switch (code) {
            case this.keys.LEFT:
            case this.keys.A:
                this._navigateFocusables('left');
                break;
            case this.keys.RIGHT:
            case this.keys.D:
                this._navigateFocusables('right');
                break;
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('up');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('down');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;

            // Hint key
            case this.keys.H:
                this.ui._handleAction('use-hint');
                break;

            // Quick answer with number keys
            case this.keys.ONE:
                this._selectAnswerByIndex(0);
                break;
            case this.keys.TWO:
                this._selectAnswerByIndex(1);
                break;
            case this.keys.THREE:
                this._selectAnswerByIndex(2);
                break;
            case this.keys.FOUR:
                this._selectAnswerByIndex(3);
                break;

            // Color buttons for answers on Samsung remote
            case this.keys.RED:
                this._selectAnswerByIndex(0);
                break;
            case this.keys.GREEN:
                this._selectAnswerByIndex(1);
                break;
            case this.keys.YELLOW:
                this._selectAnswerByIndex(2);
                break;
            case this.keys.BLUE:
                this._selectAnswerByIndex(3);
                break;
        }
    }

    _handlePauseInput(code) {
        switch (code) {
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('prev');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('next');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
            case this.keys.PLAY:
                this.ui._handleAction('resume-game');
                break;
        }
    }

    _handleCompleteInput(code) {
        switch (code) {
            case this.keys.LEFT:
            case this.keys.A:
                this._navigateFocusables('left');
                break;
            case this.keys.RIGHT:
            case this.keys.D:
                this._navigateFocusables('right');
                break;
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('up');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('down');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
        }
    }

    _handleAchievementsInput(code) {
        switch (code) {
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('up');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('down');
                break;
            case this.keys.LEFT:
            case this.keys.A:
                this._navigateFocusables('left');
                break;
            case this.keys.RIGHT:
            case this.keys.D:
                this._navigateFocusables('right');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
        }
    }

    _handleSettingsInput(code) {
        switch (code) {
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('up');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('down');
                break;
            case this.keys.LEFT:
            case this.keys.A:
                this._navigateFocusables('left');
                break;
            case this.keys.RIGHT:
            case this.keys.D:
                this._navigateFocusables('right');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
        }
    }

    _handleStickersInput(code) {
        switch (code) {
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('up');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('down');
                break;
            case this.keys.LEFT:
            case this.keys.A:
                this._navigateFocusables('left');
                break;
            case this.keys.RIGHT:
            case this.keys.D:
                this._navigateFocusables('right');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
        }
    }

    _handleParentStatsInput(code) {
        switch (code) {
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('prev');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('next');
                break;
        }
    }

    _handleVsAiSelectInput(code) {
        switch (code) {
            case this.keys.LEFT:
            case this.keys.A:
                this._navigateFocusables('left');
                break;
            case this.keys.RIGHT:
            case this.keys.D:
                this._navigateFocusables('right');
                break;
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('up');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('down');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
        }
    }

    _handleVsAiHudInput(code) {
        if (this.game.isAnswering) return;

        switch (code) {
            case this.keys.LEFT:
            case this.keys.A:
                this._navigateFocusables('left');
                break;
            case this.keys.RIGHT:
            case this.keys.D:
                this._navigateFocusables('right');
                break;
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('up');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('down');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
            // Quick answer with number keys
            case this.keys.ONE:
                this._selectVsAiAnswerByIndex(0);
                break;
            case this.keys.TWO:
                this._selectVsAiAnswerByIndex(1);
                break;
            case this.keys.THREE:
                this._selectVsAiAnswerByIndex(2);
                break;
            case this.keys.FOUR:
                this._selectVsAiAnswerByIndex(3);
                break;
            // Color buttons for Samsung remote
            case this.keys.RED:
                this._selectVsAiAnswerByIndex(0);
                break;
            case this.keys.GREEN:
                this._selectVsAiAnswerByIndex(1);
                break;
            case this.keys.YELLOW:
                this._selectVsAiAnswerByIndex(2);
                break;
            case this.keys.BLUE:
                this._selectVsAiAnswerByIndex(3);
                break;
        }
    }

    _handleVsAiCompleteInput(code) {
        switch (code) {
            case this.keys.LEFT:
            case this.keys.A:
                this._navigateFocusables('left');
                break;
            case this.keys.RIGHT:
            case this.keys.D:
                this._navigateFocusables('right');
                break;
            case this.keys.UP:
            case this.keys.W:
                this._navigateFocusables('up');
                break;
            case this.keys.DOWN:
            case this.keys.S:
                this._navigateFocusables('down');
                break;
            case this.keys.ENTER:
            case this.keys.SPACE:
                this._activateFocused();
                break;
        }
    }

    _selectVsAiAnswerByIndex(index) {
        const btns = document.querySelectorAll('.vsai-answer-btn');
        if (btns[index]) {
            btns[index].focus();
            btns[index].click();
        }
    }

    _selectAnswerByIndex(index) {
        const btns = document.querySelectorAll('.answer-btn:not(.eliminated)');
        if (btns[index]) {
            btns[index].focus();
            btns[index].click();
        }
    }
}

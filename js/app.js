/* ========================================
   MATH ISLAND - Application Entry Point
   Initializes game and handles lifecycle
   ======================================== */

(function () {
    'use strict';

    let game = null;
    let ui = null;
    let input = null;

    function init() {
        // Initialize audio system
        audio.init();

        // Load saved character unlock state
        Characters.loadUnlockState();

        // Create game engine
        game = new GameEngine();

        // Create UI manager
        ui = new UIManager(game);

        // Create input handler (TV remote + keyboard)
        input = new InputHandler(ui);

        // Show main menu
        ui.showScreen('menu');
        game.setState('menu');

        // Load last selected character
        const savedChar = Utils.load('selectedCharacter');
        if (savedChar) {
            game.selectCharacter(savedChar);
        }

        // Update menu stats
        _updateMenuStats();

        // Check if continue is available
        const progress = game.progress;
        const continueBtn = document.querySelector('.btn-continue');
        if (continueBtn) {
            const hasProgress = Object.keys(progress.completed).length > 0;
            continueBtn.style.display = hasProgress ? 'flex' : 'none';
        }

        // Handle logo image on start screen
        const logoImg = document.getElementById('game-logo');
        const mainMenu = document.getElementById('main-menu');
        if (logoImg) {
            logoImg.addEventListener('load', () => {
                mainMenu.classList.add('has-logo');
            });
            logoImg.addEventListener('error', () => {
                const logoContainer = logoImg.closest('.logo-container');
                if (logoContainer) logoContainer.classList.add('hidden');
                mainMenu.classList.remove('has-logo');
            });
        }

        // Check first run - show tutorial
        const hasSeenTutorial = Utils.load('hasSeenTutorial', false);
        if (!hasSeenTutorial) {
            // Auto-show tutorial on first play action
            _setupFirstRunTutorial();
        }

        // Focus play button
        setTimeout(() => {
            const playBtn = document.querySelector('.btn-play');
            if (playBtn) playBtn.focus();
        }, 500);

        // Handle visibility change (TV app lifecycle)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (game.state === 'playing') {
                    game.pauseGame();
                }
                audio.stopMusic();
            } else {
                audio.resume();
            }
        });

        console.log('Math Island Adventure initialized!');
        console.log(`Levels: ${Levels.getTotalLevels()}`);
        console.log(`Characters: ${Characters.roster.length}`);
        console.log(`Achievements: ${Object.keys(game.achievements).length}`);
    }

    function _updateMenuStats() {
        if (!game) return;
        const progress = game.progress;
        const totalStars = progress.totalStars || 0;
        const levelsDone = Object.keys(progress.completed).length;

        const starsEl = document.getElementById('menu-total-stars');
        const levelsEl = document.getElementById('menu-levels-done');
        if (starsEl) starsEl.textContent = totalStars;
        if (levelsEl) levelsEl.textContent = levelsDone;

        // Also update map stars if visible
        const mapStars = document.getElementById('map-stars');
        if (mapStars) mapStars.textContent = totalStars;
    }

    function _setupFirstRunTutorial() {
        // Override the play button to show tutorial first
        const originalPlay = document.querySelector('.btn-play');
        if (originalPlay) {
            const origAction = originalPlay.dataset.action;
            originalPlay.dataset.action = 'first-run-tutorial';

            // Listen for this special action
            document.addEventListener('click', function firstRunHandler(e) {
                const btn = e.target.closest('[data-action="first-run-tutorial"]');
                if (!btn) return;

                e.stopPropagation();
                // Restore original action for future clicks
                btn.dataset.action = origAction;
                document.removeEventListener('click', firstRunHandler, true);

                // Show tutorial
                if (ui.showTutorial) {
                    ui.showTutorial();
                    Utils.save('hasSeenTutorial', true);
                }
            }, true);
        }
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Samsung TV lifecycle
    window.onload = function () {
        try {
            if (typeof tizen !== 'undefined') {
                document.addEventListener('tizenhwkey', function (e) {
                    if (e.keyName === 'back') {
                        // Handled by input handler
                    }
                });
            }
        } catch (e) {}
    };

    // Expose updateMenuStats for UI manager to call
    window._updateMenuStats = function() {
        _updateMenuStats();
    };
})();

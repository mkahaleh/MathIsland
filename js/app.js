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

        // Check if continue is available
        const progress = game.progress;
        const continueBtn = document.querySelector('.btn-continue');
        if (continueBtn) {
            const hasProgress = Object.keys(progress.completed).length > 0;
            continueBtn.style.display = hasProgress ? 'flex' : 'none';
        }

        // Focus play button
        setTimeout(() => {
            const playBtn = document.querySelector('.btn-play');
            if (playBtn) playBtn.focus();
        }, 500);

        // Handle visibility change (TV app lifecycle)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                game.stopTimer();
                audio.stopMusic();
            } else {
                audio.resume();
            }
        });

        console.log('Math Island Adventure initialized!');
        console.log(`Levels: ${Levels.getTotalLevels()}`);
        console.log(`Characters: ${Characters.roster.length}`);
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
                // Handle Samsung TV specific events
                document.addEventListener('tizenhwkey', function (e) {
                    if (e.keyName === 'back') {
                        // Handled by input handler
                    }
                });
            }
        } catch (e) {}
    };
})();

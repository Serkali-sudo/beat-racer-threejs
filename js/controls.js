import * as GameState from './gameState.js';
import * as GameLogic from './gameLogic.js';
import * as UI from './ui.js';
import * as Constants from './constants.js';

function moveLeft() {
    if (GameState.gameState === 'playing' && GameState.targetLane > 0 && !GameState.isJumping) {
        GameState.setTargetLane(GameState.targetLane - 1);
    }
}

function moveRight() {
    if (GameState.gameState === 'playing' && GameState.targetLane < Constants.LANE_COUNT - 1 && !GameState.isJumping) {
        GameState.setTargetLane(GameState.targetLane + 1);
    }
}

function jump() {
    if (!GameState.isJumping && GameState.gameState === 'playing' && GameState.carGroup && GameState.carGroup.position.y < 0.1) {
        GameState.setIsJumping(true);
        GameState.setJumpFrame(0);
    }
}

function activateBoostAttack() {
    if (GameState.gameState !== 'playing' || GameState.isJumping) return;
    if (GameLogic.spendBoost(Constants.BOOST_ATTACK_COST)) {
        UI.flashLane(0x88ffff, 180);
        UI.boostEffect(500, 0.1); // duration, speedIncrease
        UI.shakeCamera(100, 0.05);
    } else {
        UI.flashScreen(0xff0000, 80); // Not enough boost flash - keep full screen for error
    }
}

function handleActionButtonClick() {
    console.log("handleActionButtonClick called. Current gameState:", GameState.gameState); // DEBUG
    if (GameState.gameState === 'initial' || GameState.gameState === 'gameOver') {
        GameLogic.startGame();
    }
}

function onWindowResize() {
    UI.setInitialCanvasSize();
}

function onKeyDown(event) {
    if (GameState.gameState === 'initial' || GameState.gameState === 'gameOver') {
        if (event.key === 'Enter' || event.key === ' ') {
            GameLogic.startGame();
        }
        return;
    }
    if (GameState.gameState !== 'playing') return;

    switch (event.key) {
        case 'ArrowLeft': case 'a': case 'A': moveLeft(); break;
        case 'ArrowRight': case 'd': case 'D': moveRight(); break;
        case 'ArrowUp': case 'w': case 'W': jump(); break;
        case 'ArrowDown': case 's': case 'S': case ' ': activateBoostAttack(); break;
    }
}

function onTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
        GameState.setTouchStart(event.touches[0].clientX, event.touches[0].clientY);
        GameState.setTouchEnd(event.touches[0].clientX, event.touches[0].clientY); // Initialize end to start
    }
}

function onTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
        GameState.setTouchEnd(event.touches[0].clientX, event.touches[0].clientY);
    }
}

function onTouchEnd(event) {
    event.preventDefault();
    if (GameState.gameState === 'initial' || GameState.gameState === 'gameOver') {
        GameState.setTouchStart(0,0);
        GameState.setTouchEnd(0,0);
        return;
    }
    if (GameState.gameState !== 'playing') return;

    const deltaX = GameState.touchEndX - GameState.touchStartX;
    const deltaY = GameState.touchEndY - GameState.touchStartY;

    // Basic tap/click detection (small movement)
    if (Math.abs(deltaX) < Constants.SWIPE_THRESHOLD * 0.5 && Math.abs(deltaY) < Constants.SWIPE_THRESHOLD * 0.5) {
        // Potentially handle tap as a specific action if needed, or just ignore for swipe-based controls
        GameState.setTouchStart(0,0);
        GameState.setTouchEnd(0,0);
        return; // Not a swipe
    }

    if (Math.abs(deltaX) > Constants.SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) { // Horizontal swipe
        if (deltaX > 0) {
            moveRight();
        } else {
            moveLeft();
        }
    } else if (Math.abs(deltaY) > Constants.VERTICAL_SWIPE_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) { // Vertical swipe
        if (deltaY < 0) {
            jump();
        } else {
            activateBoostAttack();
        }
    }
    GameState.setTouchStart(0,0);
    GameState.setTouchEnd(0,0);
}

export function setupEventListeners() {
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);

    if (GameState.canvas) {
        GameState.canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        GameState.canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        GameState.canvas.addEventListener('touchend', onTouchEnd, false);
    }

    if (GameState.actionButton) {
        GameState.actionButton.addEventListener('click', handleActionButtonClick);
    }

    // Prevent touch events on messageBox from propagating to the canvas
    if (GameState.messageBox) {
        GameState.messageBox.addEventListener('touchstart', (e) => e.stopPropagation());
        GameState.messageBox.addEventListener('touchmove', (e) => e.stopPropagation());
        GameState.messageBox.addEventListener('touchend', (e) => e.stopPropagation());
    }
} 
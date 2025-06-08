import * as THREE from 'three';
import * as Constants from './constants.js';
import * as GameState from './gameState.js';
import * as GameLogic from './gameLogic.js';
import * as UI from './ui.js';
import * as Controls from './controls.js';

// Use THREE.js Clock for proper delta time
const clock = new THREE.Clock();

async function init() {
    // Initialize DOM elements and pass them to GameState
    GameState.setDomElements({
        canvas: document.getElementById('gameCanvas'),
        scoreElement: document.getElementById('score'),
        boostMeterFillElement: document.getElementById('boostMeterFill'),
        messageBox: document.getElementById('messageBox'),
        messageText: document.getElementById('messageText'),
        actionButton: document.getElementById('actionButton'),
        perfectionPhaseElement: document.getElementById('perfectionPhase'),
        magnetTimerContainer: document.getElementById('magnetTimerContainer'),
        magnetTimerFill: document.getElementById('magnetTimerFill'),
        magnetText: document.getElementById('magnetText'),
        fpsDisplayElement: document.getElementById('fpsDisplay')
    });

    GameState.initThreeJS(); // Sets up scene, camera, renderer
    UI.setInitialCanvasSize(); // Initial canvas size based on renderer and camera

    GameState.createCar();
    GameState.createRoad();

    // Set initial camera position after car is created
    if (GameState.camera && GameState.carGroup) {
        GameState.camera.position.set(
            Constants.CAMERA_STATIC_X_OFFSET,
            Constants.CAMERA_HEIGHT,
            GameState.carGroup.position.z + Constants.CAMERA_DISTANCE_BEHIND
        );
        const initialLookAtX = Constants.CAMERA_STATIC_X_OFFSET + Constants.CAMERA_LOOKAT_X_CENTER_OFFSET;
        GameState.camera.lookAt(
            initialLookAtX,
            Constants.CAMERA_LOOKAT_Y,
            GameState.carGroup.position.z + Constants.CAMERA_LOOKAT_AHEAD_Z
        );
    }

    Controls.setupEventListeners();

    UI.showMessage("Ready?", "Start Game");

    // Fetch music list dynamically
    let musicList = [];
    try {
        const response = await fetch('assets/music/music-manifest.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const manifest = await response.json();
        musicList = manifest.musicFiles || [];
    } catch (error) {
        console.error("Could not load music manifest:", error);
        // Fallback to a default or empty list if manifest fails
        musicList = ['Under Neon Skies.mp3']; // Default fallback, or handle error more gracefully
    }

    if (musicList.length > 0) {
        UI.createMusicSelectionUI(musicList);
        // Set a default music if none is selected yet
        if (!GameState.selectedMusic) {
            GameState.setSelectedMusic(musicList[0]);
        }
    } else {
        console.warn("No music files found in manifest or fallback.");
        // Optionally, hide music selection UI or show a message
    }

    UI.updateBoostUI();
    GameState.setGameStateManager('initial');

    animate();
}

// FPS tracking
let frameCounter = 0;
let lastFPSTime = 0;

function animate(currentTime = 0) {
    requestAnimationFrame(animate);
    
    // Use THREE.js Clock for proper delta time
    const deltaTime = clock.getDelta();
    
    // FPS calculation
    frameCounter++;
    if (currentTime - lastFPSTime >= 1000) { // Update FPS every second
        const fps = Math.round(frameCounter / ((currentTime - lastFPSTime) / 1000));
        UI.updateFPSDisplay(fps);
        frameCounter = 0;
        lastFPSTime = currentTime;
    }
    
    if (GameState.gameState === 'playing') {
        GameLogic.updateGame(deltaTime);
    }
    if (GameState.renderer && GameState.scene && GameState.camera) {
        GameState.renderer.render(GameState.scene, GameState.camera);
    }
}

// Start the game
init(); 
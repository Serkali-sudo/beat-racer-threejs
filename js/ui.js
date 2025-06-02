import * as THREE from 'three';
import * as GameState from './gameState.js';
import * as Constants from './constants.js';

export function updateBoostUI() {
    if (GameState.boostMeterFillElement) {
        const pct = (GameState.boostLevel / Constants.MAX_BOOST) * 100;
        GameState.boostMeterFillElement.style.width = `${pct}%`;
    }
}

export function updateMagnetUI() {
    if (GameState.magnetTimerContainer && GameState.magnetTimerFill) {
        if (GameState.magnetActive && GameState.magnetTimer > 0) {
            // Show the timer and update the fill
            const pct = (GameState.magnetTimer / Constants.MAGNET_DURATION) * 100;
            GameState.magnetTimerContainer.classList.add('active');
            GameState.magnetTimerFill.style.width = `${pct}%`;
            
            // Update text to show remaining time
            if (GameState.magnetText) {
                const timeLeft = Math.ceil(GameState.magnetTimer);
                GameState.magnetText.textContent = `${timeLeft}s`;
            }
        } else {
            // Hide the timer when magnet is not active
            GameState.magnetTimerContainer.classList.remove('active');
            GameState.magnetTimerFill.style.width = '0%';
            if (GameState.magnetText) {
                GameState.magnetText.textContent = 'MAGNET';
            }
        }
    }
}

export function showMessage(text, buttonText) {
    if (GameState.messageText && GameState.actionButton && GameState.messageBox) {
        GameState.messageText.innerHTML = text.replace('\n', '<br>');
        GameState.actionButton.textContent = buttonText;
        GameState.messageBox.style.display = 'block';
    }
}

export function hideMessage() {
    console.log("UI.hideMessage called. GameState.messageBox:", GameState.messageBox); // DEBUG
    if (GameState.messageBox) {
        GameState.messageBox.style.display = 'none';
        console.log("messageBox display style set to none"); // DEBUG
    } else {
        console.error("UI.hideMessage: GameState.messageBox is not defined!"); // DEBUG
    }
}

export function handleResize() {
    const maxWidth = 450; // TODO: Consider moving to constants if used elsewhere
    const availableHeight = window.innerHeight * 0.8;
    const aspectRatio = 9 / 20;
    let potentialWidth = availableHeight * aspectRatio;
    let w = Math.min(window.innerWidth, maxWidth, potentialWidth);
    let h = w / aspectRatio;
    h = Math.min(h, availableHeight);

    if (GameState.canvas) {
        GameState.canvas.style.width = `${w}px`;
        GameState.canvas.style.height = `${h}px`;
    }

    if (GameState.renderer && GameState.camera) {
        GameState.renderer.setSize(w, h, false);
        GameState.camera.aspect = w / h;
        GameState.camera.updateProjectionMatrix();
    }
}

export function shakeCamera(duration, intensity) {
    if(GameState.shakeTimeout) return; // Prevent multiple shakes
    const startTime = Date.now();

    function shake() {
        const elapsed = Date.now() - startTime;
        if (elapsed < duration) {
            if (GameState.camera) {
                GameState.camera.position.x = Constants.CAMERA_STATIC_X_OFFSET + (Math.random() - 0.5) * intensity;
                GameState.camera.position.y = Constants.CAMERA_HEIGHT + (Math.random() - 0.5) * intensity;
            }
            const timeoutId = requestAnimationFrame(shake);
            GameState.setShakeTimeout(timeoutId);
        } else {
            if (GameState.camera) {
                GameState.camera.position.x = Constants.CAMERA_STATIC_X_OFFSET;
                GameState.camera.position.y = Constants.CAMERA_HEIGHT;
            }
            GameState.setShakeTimeout(null);
        }
    }
    shake();
}

export function flashScreen(colorHex, duration) {
    if (GameState.flashTimeout) clearTimeout(GameState.flashTimeout);
    if (!GameState.scene || !GameState.scene.fog) return; // Ensure scene and fog exist

    const originalFog = GameState.scene.fog.color.getHex();
    const originalBg = GameState.scene.background.getHex();

    GameState.scene.fog.color.setHex(colorHex);
    GameState.scene.background.setHex(colorHex);

    const timeoutId = setTimeout(() => {
        if (GameState.scene && GameState.scene.fog) { // Check again in case game ended
            GameState.scene.fog.color.setHex(originalFog);
            GameState.scene.background.setHex(originalBg);
        }
        GameState.setFlashTimeout(null);
    }, duration);
    GameState.setFlashTimeout(timeoutId);
}

export function flashLane(colorHex, duration) {
    if (GameState.flashTimeout) clearTimeout(GameState.flashTimeout);
    if (!GameState.scene || !GameState.carGroup) return;

    // Calculate current lane position
    const currentLaneX = (GameState.targetLane - (Constants.LANE_COUNT - 1) / 2) * Constants.LANE_WIDTH;
    const laneFlashObjects = [];

    // Create flash overlay objects for the current lane
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.9, // Increased from 0.6 to make it brighter
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    // Create multiple flash segments along the visible road
    const visibleRoadLength = 60; // How far ahead and behind to flash
    const segmentLength = 8;
    const numSegments = Math.ceil(visibleRoadLength / segmentLength);

    for (let i = 0; i < numSegments; i++) {
        const flashGeometry = new THREE.PlaneGeometry(Constants.LANE_WIDTH * 0.8, segmentLength);
        const flashMesh = new THREE.Mesh(flashGeometry, flashMaterial);
        
        // Position the flash segment in the current lane
        flashMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal like the road
        flashMesh.position.set(
            currentLaneX,
            0.01, // Slightly above the road surface
            GameState.carGroup.position.z + (i * segmentLength) // Start behind car and extend forward
        );
        
        GameState.scene.add(flashMesh);
        laneFlashObjects.push(flashMesh);
    }

    // Animate the flash effect
    let opacity = 0.9; // Increased initial opacity to match the brighter flash
    let lastFlashTime = 0;
    
    function animateFlash(currentTime) {
        if (lastFlashTime === 0) lastFlashTime = currentTime;
        const deltaTime = (currentTime - lastFlashTime) / 1000.0; // deltaTime in seconds
        lastFlashTime = currentTime;

        const fadeRate = 0.9 / (duration / 1000.0); // Opacity units to fade per second
        opacity -= fadeRate * deltaTime;
        
        laneFlashObjects.forEach(flashMesh => {
            if (flashMesh.material) {
                flashMesh.material.opacity = Math.max(0, opacity);
            }
        });
        
        if (opacity > 0 && GameState.scene) {
            requestAnimationFrame(animateFlash);
        } else {
            // Clean up flash objects
            laneFlashObjects.forEach(flashMesh => {
                if (GameState.scene) {
                    GameState.scene.remove(flashMesh);
                }
                if (flashMesh.geometry) flashMesh.geometry.dispose();
                if (flashMesh.material) flashMesh.material.dispose();
            });
            GameState.setFlashTimeout(null);
        }
    }
    
    // Start the animation
    requestAnimationFrame(animateFlash);
    
    // Set a backup timeout to ensure cleanup
    const timeoutId = setTimeout(() => {
        laneFlashObjects.forEach(flashMesh => {
            if (GameState.scene) {
                GameState.scene.remove(flashMesh);
            }
            if (flashMesh.geometry) flashMesh.geometry.dispose();
            if (flashMesh.material) flashMesh.material.dispose();
        });
        GameState.setFlashTimeout(null);
    }, duration + 100); // Small buffer
    
    GameState.setFlashTimeout(timeoutId);
}

export function boostEffect(duration, speedIncrease) {
    if (GameState.boostTimeout) clearTimeout(GameState.boostTimeout);
    GameState.setOriginalGameSpeed(GameState.gameSpeed);
    GameState.setGameSpeed(Math.min(GameState.gameSpeed + speedIncrease, 0.6)); // Max speed cap

    const timeoutId = setTimeout(() => {
        GameState.setGameSpeed(Math.max(GameState.originalGameSpeed, 0.15)); // Min speed cap
        GameState.setBoostTimeout(null);
    }, duration);
    GameState.setBoostTimeout(timeoutId);
}

export function updateScoreElement() {
    if (GameState.scoreElement) {
        GameState.scoreElement.textContent = `Score: ${GameState.score}`;
    }
}

export function updatePerfectionPhaseUI() {
    if (GameState.perfectionPhaseElement) {
        const phase = GameState.currentPerfectionPhase;
        
        // Reset all phase classes
        GameState.perfectionPhaseElement.className = '';
        
        if (phase === 0) {
            GameState.perfectionPhaseElement.textContent = '';
            GameState.perfectionPhaseElement.style.opacity = '0';
        } else {
            GameState.perfectionPhaseElement.textContent = `PERFECT x${phase}`;
            GameState.perfectionPhaseElement.className = `phase${phase}`;
            GameState.perfectionPhaseElement.style.opacity = '1';
        }
    }
}

export function createMusicSelectionUI(musicList) {
    if (GameState.messageBox) {
        const musicSelectionContainer = document.createElement('div');
        musicSelectionContainer.id = 'musicSelectionContainer';
        musicSelectionContainer.style.marginTop = '10px'; // Add some spacing

        const title = document.createElement('p');
        title.textContent = 'Select Music:';
        title.style.fontWeight = 'bold';
        musicSelectionContainer.appendChild(title);

        musicList.forEach(musicFile => {
            const button = document.createElement('button');
            button.textContent = musicFile.replace('.mp3', ''); // Display name without .mp3
            button.style.display = 'block';
            button.style.margin = '5px auto';
            button.style.padding = '8px 15px';
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '4px';
            button.style.cursor = 'pointer';
            button.onclick = () => {
                GameState.setSelectedMusic(musicFile);
                // Optionally, provide feedback or hide the selection once chosen
                // For example, hide the music selection after a choice:
                // musicSelectionContainer.style.display = 'none'; 
                // Or change button text to indicate selection
                // Array.from(musicSelectionContainer.getElementsByTagName('button')).forEach(btn => btn.disabled = false);
                // button.disabled = true;

                // If the game starts immediately after music selection, you might not need to hide it.
                // Or, if the "Start Game" button is still primary, this just sets the music.
            };
            musicSelectionContainer.appendChild(button);
        });

        // Append to messageBox or a specific menu area
        // If messageBox is used for initial messages like "Ready?", 
        // ensure this doesn't conflict.
        // You might want to append it to GameState.messageBox.parentElement 
        // or another dedicated menu div.
        // For now, let's try appending it directly to messageBox, assuming 
        // the layout allows or will be adjusted.
        const existingMusicSelection = document.getElementById('musicSelectionContainer');
        if (existingMusicSelection) {
            existingMusicSelection.remove(); // Remove old one if it exists
        }
        GameState.messageBox.appendChild(musicSelectionContainer);
    } else {
        console.error("createMusicSelectionUI: GameState.messageBox is not defined!");
    }
}

export function updateFPSDisplay(fps) {
    if (GameState.fpsDisplayElement) {
        GameState.fpsDisplayElement.textContent = `FPS: ${fps}`;
    }
} 
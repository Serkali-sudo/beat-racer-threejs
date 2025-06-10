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

export function setInitialCanvasSize() {
    const maxWidth = 450; // TODO: Consider moving to constants if used elsewhere
    const availableHeight = window.innerHeight * 0.8;
    const aspectRatio = 9 / 16;
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

        const builtInTitle = document.createElement('p');
        builtInTitle.textContent = '🎶 Built-in Music:';
        builtInTitle.style.fontWeight = 'bold';
        builtInTitle.style.margin = '10px 0 10px 0';
        musicSelectionContainer.appendChild(builtInTitle);

        musicList.forEach((musicFile, index) => {
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
            button.style.transition = 'all 0.2s ease';
            button.dataset.musicFile = musicFile; // Store music file reference for highlighting
            
            // Check if this is the currently selected music and highlight it
            // If no music is explicitly selected, highlight the first item (default)
            const isSelected = GameState.selectedMusic === musicFile || 
                              (!GameState.selectedMusic && index === 0);
            
            if (isSelected) {
                button.style.backgroundColor = '#FF6B35'; // Orange highlight for selected
                button.style.boxShadow = '0 0 10px rgba(255, 107, 53, 0.5)';
                button.style.transform = 'scale(1.05)';
            }
            
            button.onclick = () => {
                GameState.setSelectedMusic(musicFile);
                
                // Remove highlighting from all music buttons
                const allMusicButtons = musicSelectionContainer.querySelectorAll('button');
                allMusicButtons.forEach(btn => {
                    btn.style.backgroundColor = '#4CAF50';
                    btn.style.boxShadow = 'none';
                    btn.style.transform = 'scale(1)';
                });
                
                // Highlight the selected button
                button.style.backgroundColor = '#FF6B35'; // Orange highlight for selected
                button.style.boxShadow = '0 0 10px rgba(255, 107, 53, 0.5)';
                button.style.transform = 'scale(1.05)';
                
                console.log(`Selected music: ${musicFile}`);
            };
            musicSelectionContainer.appendChild(button);
        });

        // Add separator before upload section
        const separator = document.createElement('hr');
        separator.style.border = 'none';
        separator.style.borderTop = '1px solid #ddd';
        separator.style.margin = '15px 0';
        musicSelectionContainer.appendChild(separator);

        // Add upload section at the bottom
        const uploadSection = document.createElement('div');
        uploadSection.style.marginBottom = '15px';
        uploadSection.style.padding = '10px';
        uploadSection.style.border = '2px dashed #4CAF50';
        uploadSection.style.borderRadius = '8px';
        uploadSection.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';

        const uploadTitle = document.createElement('p');
        uploadTitle.textContent = '🎵 Upload Your Own Music:';
        uploadTitle.style.fontWeight = 'bold';
        uploadTitle.style.margin = '0 0 8px 0';
        uploadTitle.style.color = '#4CAF50';
        uploadSection.appendChild(uploadTitle);

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'audio/*';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        fileInput.id = 'audioFileInput';

        const uploadButton = document.createElement('button');
        uploadButton.textContent = '📁 Choose Audio Files';
        uploadButton.style.display = 'block';
        uploadButton.style.margin = '0 auto 8px auto';
        uploadButton.style.padding = '8px 15px';
        uploadButton.style.backgroundColor = '#4CAF50';
        uploadButton.style.color = 'white';
        uploadButton.style.border = 'none';
        uploadButton.style.borderRadius = '4px';
        uploadButton.style.cursor = 'pointer';
        uploadButton.style.transition = 'all 0.2s ease';
        uploadButton.onclick = () => fileInput.click();

        const uploadInfo = document.createElement('p');
        uploadInfo.textContent = 'Supports: MP3, WAV, OGG, M4A files';
        uploadInfo.style.fontSize = '12px';
        uploadInfo.style.color = '#666';
        uploadInfo.style.margin = '0';
        uploadInfo.style.textAlign = 'center';

        uploadSection.appendChild(fileInput);
        uploadSection.appendChild(uploadButton);
        uploadSection.appendChild(uploadInfo);
        
        // Handle file uploads
        fileInput.addEventListener('change', (event) => {
            handleAudioFileUpload(event, musicSelectionContainer);
        });
        
        musicSelectionContainer.appendChild(uploadSection);

        // Container for uploaded music buttons (will be populated dynamically)
        const uploadedMusicContainer = document.createElement('div');
        uploadedMusicContainer.id = 'uploadedMusicContainer';
        uploadedMusicContainer.style.marginTop = '10px';
        musicSelectionContainer.appendChild(uploadedMusicContainer);

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

// Store uploaded audio files
let uploadedAudioFiles = [];

function handleAudioFileUpload(event, musicContainer) {
    const files = Array.from(event.target.files);
    const supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    let successCount = 0;
    let errorCount = 0;
    
    const uploadInfo = musicContainer.querySelector('p:last-child'); // The info text
    const originalText = uploadInfo.textContent;
    
    if (files.length === 0) return;
    
    uploadInfo.textContent = `Processing ${files.length} file(s)...`;
    uploadInfo.style.color = '#4CAF50';
    
    files.forEach((file, index) => {
        // Validate file type
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!supportedFormats.includes(fileExtension)) {
            console.warn(`Unsupported audio format: ${file.name}`);
            errorCount++;
            showUploadFeedback(file.name, 'error', 'Unsupported format');
            return;
        }
        
        // Check file size (limit to 50MB)
        if (file.size > 50 * 1024 * 1024) {
            console.warn(`File too large: ${file.name} (max 50MB)`);
            errorCount++;
            showUploadFeedback(file.name, 'error', 'File too large (max 50MB)');
            return;
        }
        
        // Check for duplicates
        const existingFile = uploadedAudioFiles.find(f => f.name === file.name);
        if (existingFile) {
            console.warn(`File already uploaded: ${file.name}`);
            errorCount++;
            showUploadFeedback(file.name, 'warning', 'Already uploaded');
            return;
        }
        
        // Create object URL for the file
        const audioUrl = URL.createObjectURL(file);
        let displayName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        
        // Limit display name length to prevent UI expansion
        const MAX_DISPLAY_LENGTH = 25;
        if (displayName.length > MAX_DISPLAY_LENGTH) {
            displayName = displayName.substring(0, MAX_DISPLAY_LENGTH) + "...";
        }
        
        // Store the uploaded file info
        const uploadedFile = {
            name: file.name,
            displayName: displayName,
            url: audioUrl,
            isUploaded: true,
            originalFile: file
        };
        
        uploadedAudioFiles.push(uploadedFile);
        
        // Create button for uploaded file
        const uploadedButton = createUploadedMusicButton(uploadedFile, musicContainer);
        
        // Auto-select the first successfully uploaded file
        if (successCount === 0) {
            // This is the first successful upload, auto-select it
            setTimeout(() => {
                uploadedButton.click(); // Trigger the selection
            }, 100); // Small delay to ensure UI is ready
        }
        
        successCount++;
        showUploadFeedback(file.name, 'success', 'Added successfully');
        console.log(`Added uploaded music: ${file.name}`);
    });
    
    // Update status message
    setTimeout(() => {
        if (successCount > 0 && errorCount === 0) {
            uploadInfo.textContent = `✅ ${successCount} file(s) added successfully!`;
            uploadInfo.style.color = '#4CAF50';
        } else if (successCount > 0 && errorCount > 0) {
            uploadInfo.textContent = `⚠️ ${successCount} added, ${errorCount} failed`;
            uploadInfo.style.color = '#FF9800';
        } else if (errorCount > 0) {
            uploadInfo.textContent = `❌ ${errorCount} file(s) failed to upload`;
            uploadInfo.style.color = '#f44336';
        }
        
        // Reset to original text after 3 seconds
        setTimeout(() => {
            uploadInfo.textContent = originalText;
            uploadInfo.style.color = '#666';
        }, 3000);
    }, 500);
    
    // Clear the input for potential re-uploads
    event.target.value = '';
}

function showUploadFeedback(fileName, type, message) {
    // Simple console feedback for now, could be enhanced with toast notifications
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${fileName}: ${message}`);
}

function createUploadedMusicButton(uploadedFile, container) {
    // Find the uploaded music container
    let uploadedMusicContainer = container.querySelector('#uploadedMusicContainer');
    if (!uploadedMusicContainer) {
        console.warn('Uploaded music container not found, creating one');
        uploadedMusicContainer = document.createElement('div');
        uploadedMusicContainer.id = 'uploadedMusicContainer';
        uploadedMusicContainer.style.marginTop = '10px';
        container.appendChild(uploadedMusicContainer);
    }
    
    const button = document.createElement('button');
    button.textContent = `🎧 ${uploadedFile.displayName}`;
    button.style.display = 'block';
    button.style.margin = '5px auto';
    button.style.padding = '8px 15px';
    button.style.backgroundColor = '#9C27B0'; // Purple color for uploaded files
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.2s ease';
    button.dataset.isUploaded = 'true';
    button.dataset.audioUrl = uploadedFile.url;
    button.dataset.musicFile = uploadedFile.name;
    
    button.onclick = () => {
        // Set the uploaded file as selected music using its object URL
        GameState.setSelectedMusic(uploadedFile.url);
        GameState.setSelectedMusicName(uploadedFile.name); // Store original name for display
        
        // Remove highlighting from all music buttons (both uploaded and built-in)
        const allMusicButtons = container.querySelectorAll('button');
        allMusicButtons.forEach(btn => {
            if (btn.dataset.isUploaded === 'true') {
                btn.style.backgroundColor = '#9C27B0'; // Purple for uploaded
            } else if (btn.dataset.musicFile) {
                btn.style.backgroundColor = '#4CAF50'; // Green for built-in
            }
            btn.style.boxShadow = 'none';
            btn.style.transform = 'scale(1)';
        });
        
        // Highlight the selected button
        button.style.backgroundColor = '#FF6B35'; // Orange highlight for selected
        button.style.boxShadow = '0 0 10px rgba(255, 107, 53, 0.5)';
        button.style.transform = 'scale(1.05)';
        
        console.log(`Selected uploaded music: ${uploadedFile.name}`);
    };
    
    // Add to uploaded music container
    uploadedMusicContainer.appendChild(button);
    
    // Return the button so it can be auto-selected if needed
    return button;
}

// Function to clean up uploaded audio URLs when needed
export function cleanupUploadedAudio() {
    uploadedAudioFiles.forEach(file => {
        if (file.url) {
            URL.revokeObjectURL(file.url);
        }
    });
    uploadedAudioFiles = [];
}

// Function to get all music options (built-in + uploaded)
export function getAllMusicOptions(builtInMusicList) {
    return [...uploadedAudioFiles, ...builtInMusicList.map(file => ({
        name: file,
        displayName: file.replace('.mp3', ''),
        url: `assets/music/${file}`,
        isUploaded: false
    }))];
} 
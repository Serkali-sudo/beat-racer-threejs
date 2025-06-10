import * as THREE from 'three';
import * as Constants from './constants.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// --- Three.js Setup & Game State ---
export let scene, camera, renderer;
export let carGroup;
export let roadSegments = [];
export let obstacles = [];
export let collectables = [];
export let buildings = [];
export let trailParticles = [];
export let streetLights = [];
export let pedestrians = [];

export let gameSpeed = 0.15;
export let score = 0;
export let gameState = 'initial'; // initial, playing, gameOver
export let frameCount = 0; // Frame counter for debugging and timing

// --- Car State ---
export let currentLane = 1;
export let isJumping = false;
export let jumpFrame = 0;
export let jumpTimer = 0; // New: time-based jump tracking
export let targetLane = 1;
export let boostLevel = 0;
export let trailSpawnTimer = 0;
export let lastBuildingSpawnZ = 0;
export let lastStreetLightSpawnZ = 0;
export let pedestrianSpawnTimer = 0;
export let streetLightSpawnTimer = 0;

// --- Enemy Drill State ---
export let enemyDrill = null; // Will hold the THREE.Group for the drill
export let enemyDrillState = 'inactive'; // inactive, approaching, chasing, retreating, deflected
export let drillSpawnCheckTimer = 0;
export let drillDeflectTimer = 0;
export let currentDrillChaseDistance = 0; // Added for dynamic chase distance

// --- Touch Controls State ---
export let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;

// --- DOM Elements (initialized in main.js or ui.js) ---
export let canvas, scoreElement, boostMeterFillElement, messageBox, messageText, actionButton, perfectionPhaseElement, magnetTimerContainer, magnetTimerFill, magnetText, fpsDisplayElement;

export function setDomElements(elements) {
    canvas = elements.canvas;
    scoreElement = elements.scoreElement;
    boostMeterFillElement = elements.boostMeterFillElement;
    messageBox = elements.messageBox;
    messageText = elements.messageText;
    actionButton = elements.actionButton;
    perfectionPhaseElement = elements.perfectionPhaseElement;
    magnetTimerContainer = elements.magnetTimerContainer;
    magnetTimerFill = elements.magnetTimerFill;
    magnetText = elements.magnetText;
    fpsDisplayElement = elements.fpsDisplayElement;
}

// --- Game Timers ---
export let obstacleSpawnTimer = 0;
export let collectableSpawnTimer = 0;
export let boostTimeout = null;
export let shakeTimeout = null;
export let flashTimeout = null;
export let originalGameSpeed = 0;

// --- Music State ---
export let selectedMusic = null; // To store the path/name of the selected music
export let selectedMusicName = null; // To store the display name of the selected music

// Particle effects for collectables
export let collectableBurstParticles = [];

// --- Perfection Mechanism State ---
export let perfectStreakCount = 0; // Count of consecutive collectables collected
export let currentPerfectionPhase = 0; // 0 = normal, 1-3 = perfection phases
export let perfectionTransitionTimer = 0; // For smooth color transitions
export let roadOriginalMaterials = []; // Store original road materials for restoration
export let windParticles = []; // Wind effect particles
export let windSpawnTimer = 0; // Timer for wind particle spawning
export let perfectionBurstParticles = []; // Perfection burst particles
export let perfectionBurstTimer = 0; // Timer for burst effect

// --- Magnet Powerup State ---
export let magnetActive = false; // Whether magnet is currently active
export let magnetTimer = 0; // Time remaining for magnet effect
export let magnetCollectables = []; // Array to store magnet collectables (visual distinction)

export function getGameState() {
    return {
        scene, camera, renderer, carGroup, roadSegments, obstacles, collectables, buildings,
        trailParticles, streetLights, pedestrians, gameSpeed, score, gameState, frameCount, currentLane, isJumping, jumpFrame, jumpTimer,
        targetLane, boostLevel, trailSpawnTimer, lastBuildingSpawnZ, lastStreetLightSpawnZ, pedestrianSpawnTimer, streetLightSpawnTimer,
        enemyDrill, enemyDrillState, drillSpawnCheckTimer, drillDeflectTimer, currentDrillChaseDistance,
        touchStartX, touchStartY, touchEndX, touchEndY, canvas, scoreElement, boostMeterFillElement,
        messageBox, messageText, actionButton, obstacleSpawnTimer, collectableSpawnTimer,
        boostTimeout, shakeTimeout, flashTimeout, originalGameSpeed,
        selectedMusic,
        collectableBurstParticles,
        perfectStreakCount,
        currentPerfectionPhase,
        perfectionTransitionTimer,
        roadOriginalMaterials,
        windParticles,
        windSpawnTimer,
        perfectionBurstParticles,
        perfectionBurstTimer,
        magnetActive,
        magnetTimer,
        magnetCollectables,
        fpsDisplayElement
    };
}

export function setGameState(newState) {
    scene = newState.scene;
    camera = newState.camera;
    renderer = newState.renderer;
    carGroup = newState.carGroup;
    roadSegments = newState.roadSegments;
    obstacles = newState.obstacles;
    collectables = newState.collectables;
    buildings = newState.buildings;
    trailParticles = newState.trailParticles;
    streetLights = newState.streetLights || [];
    pedestrians = newState.pedestrians || [];
    gameSpeed = newState.gameSpeed;
    score = newState.score;
    gameState = newState.gameState;
    frameCount = newState.frameCount || 0;
    currentLane = newState.currentLane;
    isJumping = newState.isJumping;
    jumpFrame = newState.jumpFrame;
    jumpTimer = newState.jumpTimer || 0;
    targetLane = newState.targetLane;
    boostLevel = newState.boostLevel;
    trailSpawnTimer = newState.trailSpawnTimer;
    lastBuildingSpawnZ = newState.lastBuildingSpawnZ;
    lastStreetLightSpawnZ = newState.lastStreetLightSpawnZ || 0;
    pedestrianSpawnTimer = newState.pedestrianSpawnTimer || 0;
    streetLightSpawnTimer = newState.streetLightSpawnTimer || 0;
    
    // Drill state
    enemyDrill = newState.enemyDrill || null;
    enemyDrillState = newState.enemyDrillState || 'inactive';
    drillSpawnCheckTimer = newState.drillSpawnCheckTimer || 0;
    drillDeflectTimer = newState.drillDeflectTimer || 0;
    currentDrillChaseDistance = newState.currentDrillChaseDistance || Constants.DRILL_MAX_CHASE_DISTANCE;

    touchStartX = newState.touchStartX;
    touchStartY = newState.touchStartY;
    touchEndX = newState.touchEndX;
    touchEndY = newState.touchEndY;
    // DOM elements are set via setDomElements
    obstacleSpawnTimer = newState.obstacleSpawnTimer;
    collectableSpawnTimer = newState.collectableSpawnTimer;
    boostTimeout = newState.boostTimeout;
    shakeTimeout = newState.shakeTimeout;
    flashTimeout = newState.flashTimeout;
    originalGameSpeed = newState.originalGameSpeed;
    selectedMusic = newState.selectedMusic || null;

    // Dispose and clear streetlights
    streetLights.forEach(sl => {
        if (sl.geometry) sl.geometry.dispose();
        if (sl.material) {
            if (Array.isArray(sl.material)) sl.material.forEach(m => m.dispose());
            else sl.material.dispose();
        }
        scene.remove(sl);
    });
    streetLights = [];

    // Dispose and clear pedestrians
    pedestrians.forEach(p => {
        p.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
                else object.material.dispose();
            }
        });
        scene.remove(p);
    });
    pedestrians = [];

    // Particle effects for collectables
    collectableBurstParticles = newState.collectableBurstParticles || [];

    // Perfection mechanism state
    perfectStreakCount = newState.perfectStreakCount || 0;
    currentPerfectionPhase = newState.currentPerfectionPhase || 0;
    perfectionTransitionTimer = newState.perfectionTransitionTimer || 0;
    roadOriginalMaterials = newState.roadOriginalMaterials || [];
    windParticles = newState.windParticles || [];
    windSpawnTimer = newState.windSpawnTimer || 0;
    perfectionBurstParticles = newState.perfectionBurstParticles || [];
    perfectionBurstTimer = newState.perfectionBurstTimer || 0;

    // Magnet powerup state
    magnetActive = newState.magnetActive || false;
    magnetTimer = newState.magnetTimer || 0;
    magnetCollectables = newState.magnetCollectables || [];
    fpsDisplayElement = newState.fpsDisplayElement || null;
}

export function resetGameTimers() {
    obstacleSpawnTimer = 0;
    collectableSpawnTimer = 0;
    pedestrianSpawnTimer = 0;
    streetLightSpawnTimer = 0;
    if(boostTimeout) clearTimeout(boostTimeout);
    boostTimeout = null;
    if(shakeTimeout) {
        cancelAnimationFrame(shakeTimeout);
        shakeTimeout = null;
    }
    flashTimeout = null; // Assuming flash also uses a timeout
    originalGameSpeed = 0; // Reset original game speed placeholder
}

export function incrementScore(amount) {
    score += amount;
}

export function setGameSpeed(speed) {
    gameSpeed = speed;
}

export function setOriginalGameSpeed(speed) {
    originalGameSpeed = speed;
}

export function setBoostTimeout(timeoutId) {
    boostTimeout = timeoutId;
}

export function setShakeTimeout(timeoutId) {
    shakeTimeout = timeoutId;
}

export function setFlashTimeout(timeoutId) {
    flashTimeout = timeoutId;
}

export function resetScore() {
    score = 0;
}

export function incrementFrameCount() {
    frameCount++; // Keep for debugging only, not for timing
}

export function incrementJumpTimer(deltaTime = 1/60) {
    jumpTimer += deltaTime;
}

export function resetJumpTimer() {
    jumpTimer = 0;
}

// --- Music State Setter ---
export function setSelectedMusic(musicName) {
    selectedMusic = musicName;
}

export function setSelectedMusicName(musicDisplayName) {
    selectedMusicName = musicDisplayName;
}

// --- Initialization functions that modify state directly ---

export function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101025);
    scene.fog = new THREE.Fog(0x101025, 20, 70);

    const aspect = canvas.clientWidth / canvas.clientHeight;
    camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 100);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    // setInitialCanvasSize is in ui.js, called after renderer setup
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0x8080FF, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(6, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 70;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -15;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xff00aa, 0.7, 50);
    pointLight1.position.set(-10, 8, -25);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00aaff, 0.7, 50);
    pointLight2.position.set(10, 8, -35);
    scene.add(pointLight2);
}

export function createCar() {
    carGroup = new THREE.Group();
    // const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x253580, specular: 0x00ffff, shininess: 50, flatShading: true, });
    // const taillightMaterial = new THREE.MeshPhongMaterial({ color: 0xff0080, emissive: 0xff0080, emissiveIntensity: 0.9, flatShading: true, specular: 0xffaaff, shininess: 80 });
    // const materials = [bodyMaterial, taillightMaterial];

    // const hw = 1.0; const hh = 0.35; const hl = 1.4;
    // const vertices = new Float32Array([
    //     -hw, 0.0, hl, hw, 0.0, hl, -hw, 0.0, -hl, hw, 0.0, -hl,
    //     -hw, hh * 0.5, hl * 0.6, hw, hh * 0.5, hl * 0.6, -hw, hh * 0.5, -hl * 0.8, hw, hh * 0.5, -hl * 0.8,
    //     -hw * 0.7, hh, hl * 0.1, hw * 0.7, hh, hl * 0.1, -hw * 0.8, hh, -hl * 0.7, hw * 0.8, hh, -hl * 0.7,
    //     -hw * 0.9, hh*0.7, -hl, hw * 0.9, hh*0.7, -hl,
    //     -hw * 0.85, hh*0.2, -hl*0.98, hw * 0.85, hh*0.2, -hl*0.98,
    //     -hw * 0.85, hh*0.6, -hl*0.98, hw * 0.85, hh*0.6, -hl*0.98
    // ]);

    // for (let i = 0; i < vertices.length; i++) {
    //     vertices[i] *= Constants.CAR_SCALE;
    // }

    // const indices = [
    //     0, 2, 1, 1, 2, 3, 0, 1, 4, 1, 5, 4, 4, 5, 8, 5, 9, 8, 8, 9, 10, 9, 11, 10,
    //     0, 4, 2, 4, 6, 2, 4, 8, 6, 8, 10, 6, 10, 12, 6, 2, 6, 12,
    //     1, 3, 5, 5, 3, 7, 5, 7, 9, 9, 7, 11, 11, 7, 13, 7, 3, 13,
    //     10, 11, 12, 11, 13, 12,
    //     2, 12, 14, 12, 16, 14, 3, 15, 13, 15, 17, 13,
    //     14, 15, 2, 15, 3, 2,
    //     16, 13, 17, 16, 12, 13,
    //     14, 16, 15, 15, 16, 17
    // ];

    // const geometry = new THREE.BufferGeometry();
    // geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    // geometry.setIndex(indices);
    // geometry.addGroup(0, 84, 0); // Body
    // geometry.addGroup(84, 6, 1); // Taillights
    // geometry.computeVertexNormals();

    // const carMesh = new THREE.Mesh(geometry, materials);
    // carMesh.castShadow = true;
    // carMesh.receiveShadow = false;
    // carGroup.add(carMesh);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load('assets/cars/car1.glb', (gltf) => {
        const carModel = gltf.scene;
        // Make it bigger: Apply an additional 1.5x scale factor
        const scaleMultiplier = 1.5;
        carModel.scale.set(Constants.CAR_SCALE * scaleMultiplier, Constants.CAR_SCALE * scaleMultiplier, Constants.CAR_SCALE * scaleMultiplier);
        
        // Rotate it to the left by 90 degrees (around the Y axis)
        carModel.rotation.y = -Math.PI / 2;

        // Adjust Y position to sit on the road
        const box = new THREE.Box3().setFromObject(carModel);
        carModel.position.y = -box.min.y;
        
        // It's common for GLB models to have a root node that needs to be traversed
        // or specific meshes that need shadow properties set.
        carModel.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false; // Car itself usually doesn't receive shadows from itself
            }
        });
        
        carGroup.add(carModel);
    }, undefined, (error) => {
        console.error('An error happened while loading the car model:', error);
    });

    carGroup.position.set(0, 0, Constants.CAR_START_Z);
    scene.add(carGroup);
}

export function createRoad() {
    const roadMaterial = new THREE.MeshPhongMaterial({ color: 0x282838, specular: 0x101010, shininess: 10 });
    const numSegments = Math.ceil(Constants.ROAD_LENGTH / Constants.ROAD_SEGMENT_LENGTH);
    const lineMaterial = new THREE.MeshPhongMaterial({
        color: Constants.ROAD_LINE_COLOR,
        emissive: Constants.ROAD_LINE_COLOR,
        emissiveIntensity: Constants.ROAD_LINE_EMISSIVE_INTENSITY,
        specular: 0xffffff,
        shininess: 80,
    });
    const lineGeometry = new THREE.BoxGeometry(Constants.ROAD_LINE_WIDTH, Constants.ROAD_LINE_HEIGHT, Constants.ROAD_SEGMENT_LENGTH);
    const totalRoadWidth = Constants.LANE_WIDTH * Constants.LANE_COUNT;
    const lineXOffset = totalRoadWidth / 2;

    for (let i = 0; i < numSegments; i++) {
        const roadGeometry = new THREE.PlaneGeometry(totalRoadWidth, Constants.ROAD_SEGMENT_LENGTH);
        const segment = new THREE.Mesh(roadGeometry, roadMaterial);
        segment.rotation.x = -Math.PI / 2;
        segment.position.set(0, -0.01, carGroup.position.z - (i * Constants.ROAD_SEGMENT_LENGTH));
        segment.receiveShadow = true;
        scene.add(segment);
        roadSegments.push(segment);

        const leftLineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
        const rightLineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
        leftLineMesh.rotation.x = Math.PI / 2;
        rightLineMesh.rotation.x = Math.PI / 2;
        leftLineMesh.position.set(-lineXOffset, 0, Constants.ROAD_LINE_HEIGHT / 2);
        rightLineMesh.position.set(lineXOffset, 0, Constants.ROAD_LINE_HEIGHT / 2);
        leftLineMesh.castShadow = false; leftLineMesh.receiveShadow = false;
        rightLineMesh.castShadow = false; rightLineMesh.receiveShadow = false;
        segment.add(leftLineMesh);
        segment.add(rightLineMesh);
    }
}

export function resetCarState() {
    currentLane = 1;
    targetLane = 1;
    isJumping = false;
    jumpFrame = 0;
    jumpTimer = 0;
    boostLevel = 0;
    if (carGroup) {
        carGroup.position.set(0, 0, Constants.CAR_START_Z);
        carGroup.rotation.set(0, 0, 0);
    }
}

export function resetObjectArrays() {
    obstacles.forEach(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); scene.remove(o); });
    obstacles = [];
    collectables.forEach(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); scene.remove(c); });
    collectables = [];
    buildings.forEach(b => {
        if (b.geometry) b.geometry.dispose();
        if (b.userData.windowTexture) b.userData.windowTexture.dispose(); // Dispose window texture
        
        // Dispose materials of building and its children (signs)
        b.traverse(object => {
            if (object.isMesh && object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => {
                        if (m.map) m.map.dispose();
                        if (m.emissiveMap) m.emissiveMap.dispose();
                        m.dispose();
                    });
                } else {
                    if (object.material.map) object.material.map.dispose();
                    if (object.material.emissiveMap) object.material.emissiveMap.dispose();
                    object.material.dispose();
                }
            }
        });
        scene.remove(b);
    });
    buildings = []; // Clear the array after disposing and removing
    
    // Clear pedestrians
    pedestrians.forEach(p => {
        p.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
                else object.material.dispose();
            }
        });
        scene.remove(p);
    });
    pedestrians = [];
    
    trailParticles.forEach(p => {
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
        scene.remove(p.mesh);
    });
    trailParticles = [];
}


export function resetRoadSegments() {
    if (carGroup && roadSegments.length > 0) { // Ensure carGroup and roadSegments exist
        roadSegments.forEach((s, i) => {
            s.position.z = carGroup.position.z - (i * Constants.ROAD_SEGMENT_LENGTH) - 0.01;
        });
    }
}

export function resetTrail() {
    trailSpawnTimer = 0;
}

export function setGameStateManager(newGameState) {
    gameState = newGameState;
}

export function setBoostLevel(level) {
    boostLevel = level;
}

export function setCurrentLane(lane) {
    currentLane = lane;
}

export function setTargetLane(lane) {
    targetLane = lane;
}

export function setIsJumping(jumping) {
    isJumping = jumping;
}

export function setJumpFrame(frame) {
    jumpFrame = frame;
}

export function setLastBuildingSpawnZ(z) {
    lastBuildingSpawnZ = z;
}

export function setLastStreetLightSpawnZ(z) {
    lastStreetLightSpawnZ = z;
}

export function updateLastBuildingSpawnZ(amount) {
    lastBuildingSpawnZ += amount;
}

export function addObstacle(obstacle) {
    obstacles.push(obstacle);
}

export function removeObstacle(index) {
    obstacles.splice(index, 1);
}

export function addCollectable(collectable) {
    collectables.push(collectable);
}

export function removeCollectable(index) {
    collectables.splice(index, 1);
}

export function addBuilding(building) {
    buildings.push(building);
}

export function removeBuilding(index) {
    buildings.splice(index, 1);
}

export function addTrailParticle(particle) {
    trailParticles.push(particle);
}

export function removeTrailParticle(index) {
    trailParticles.splice(index, 1);
}

export function incrementObstacleSpawnTimer(deltaTime = 1/60) {
    obstacleSpawnTimer += deltaTime;
}

export function resetObstacleSpawnTimer(value = 0) {
    obstacleSpawnTimer = value;
}

export function incrementCollectableSpawnTimer(deltaTime = 1/60) {
    collectableSpawnTimer += deltaTime;
}

export function resetCollectableSpawnTimer(value = 0) {
    collectableSpawnTimer = value;
}

export function incrementTrailSpawnTimer(deltaTime = 1/60) {
    trailSpawnTimer += deltaTime;
}

export function resetTrailSpawnTimer() {
    trailSpawnTimer = 0;
}

export function setTouchStart(x, y) {
    touchStartX = x;
    touchStartY = y;
}

export function setTouchEnd(x, y) {
    touchEndX = x;
    touchEndY = y;
}

export function addStreetLight(light) {
    streetLights.push(light);
}

export function removeStreetLight(index) {
    streetLights.splice(index, 1);
}

export function resetEnemyDrillState() { // New function to reset drill
    if (enemyDrill) {
        scene.remove(enemyDrill);
        // Dispose geometry and materials if the drill is complex
        enemyDrill.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
    enemyDrill = null;
    enemyDrillState = 'inactive';
    drillSpawnCheckTimer = 0;
    drillDeflectTimer = 0;
    currentDrillChaseDistance = Constants.DRILL_MAX_CHASE_DISTANCE;
}

// --- Enemy Drill State Setters ---
export function setEnemyDrill(drillObject) {
    enemyDrill = drillObject;
}

export function setEnemyDrillState(newState) {
    enemyDrillState = newState;
}

export function incrementDrillSpawnCheckTimer(deltaTime = 1/60) {
    drillSpawnCheckTimer += deltaTime;
}

export function resetDrillSpawnCheckTimer(value = 0) {
    drillSpawnCheckTimer = value;
}

export function setDrillDeflectTimer(value) {
    drillDeflectTimer = value;
}

export function decrementDrillDeflectTimer(deltaTime = 1/60) {
    if (drillDeflectTimer > 0) {
        drillDeflectTimer = Math.max(0, drillDeflectTimer - deltaTime);
    }
}

export function setCurrentDrillChaseDistance(distance) {
    currentDrillChaseDistance = distance;
}

// --- Pedestrian State Management ---
export function addPedestrian(pedestrian) {
    pedestrians.push(pedestrian);
}

export function removePedestrian(index) {
    pedestrians.splice(index, 1);
}

export function incrementPedestrianSpawnTimer(deltaTime = 1/60) {
    pedestrianSpawnTimer += deltaTime;
}

export function resetPedestrianSpawnTimer(value = 0) {
    pedestrianSpawnTimer = value;
}

// --- Streetlight State Management ---
export function incrementStreetLightSpawnTimer(deltaTime = 1/60) {
    streetLightSpawnTimer += deltaTime;
}

export function resetStreetLightSpawnTimer(value = 0) {
    streetLightSpawnTimer = value;
}

export function addCollectableBurstParticles(particles) {
    collectableBurstParticles.push(particles);
}

export function removeCollectableBurst(index) {
    collectableBurstParticles.splice(index, 1);
}

// --- Perfection Mechanism Functions ---
export function incrementPerfectStreak() {
    perfectStreakCount++;
}

export function resetPerfectStreak() {
    if (perfectStreakCount > 0) {
        perfectStreakCount = Math.max(0, perfectStreakCount - Constants.PERFECTION_DECAY_RATE);
    }
}

export function setPerfectionPhase(phase) {
    if (currentPerfectionPhase !== phase) {
        currentPerfectionPhase = phase;
        perfectionTransitionTimer = Constants.PERFECTION_TRANSITION_DURATION;
    }
}

export function decrementPerfectionTransitionTimer(deltaTime = 1/60) {
    if (perfectionTransitionTimer > 0) {
        perfectionTransitionTimer = Math.max(0, perfectionTransitionTimer - deltaTime);
    }
}

export function resetPerfectionState() {
    perfectStreakCount = 0;
    currentPerfectionPhase = 0;
    perfectionTransitionTimer = 0;
    windParticles.forEach(particle => {
        if (particle.mesh) {
            scene.remove(particle.mesh);
            if (particle.mesh.geometry) particle.mesh.geometry.dispose();
            if (particle.mesh.material) particle.mesh.material.dispose();
        }
    });
    windParticles = [];
    windSpawnTimer = 0;
    
    // Clean up burst particles
    perfectionBurstParticles.forEach(particle => {
        if (particle.mesh) {
            scene.remove(particle.mesh);
            if (particle.mesh.geometry) particle.mesh.geometry.dispose();
            if (particle.mesh.material) particle.mesh.material.dispose();
        }
    });
    perfectionBurstParticles = [];
    perfectionBurstTimer = 0;
    
    // Reset magnet state as well
    resetMagnetState();
}

export function addWindParticle(particle) {
    windParticles.push(particle);
}

export function removeWindParticle(index) {
    windParticles.splice(index, 1);
}

export function incrementWindSpawnTimer(deltaTime = 1/60) {
    windSpawnTimer += deltaTime;
}

export function resetWindSpawnTimer() {
    windSpawnTimer = 0;
}

export function addPerfectionBurstParticle(particle) {
    perfectionBurstParticles.push(particle);
}

export function removePerfectionBurstParticle(index) {
    perfectionBurstParticles.splice(index, 1);
}

export function incrementPerfectionBurstTimer(deltaTime = 1/60) {
    perfectionBurstTimer += deltaTime;
}

export function resetPerfectionBurstTimer() {
    perfectionBurstTimer = 0;
}

export function storeRoadOriginalMaterials(materials) {
    roadOriginalMaterials = materials;
}

// --- Magnet Powerup Functions ---
export function setMagnetActive(active) {
    magnetActive = active;
}

export function setMagnetTimer(time) {
    magnetTimer = time;
}

export function decrementMagnetTimer(deltaTime = 1/60) {
    if (magnetTimer > 0) {
        magnetTimer = Math.max(0, magnetTimer - deltaTime);
        if (magnetTimer === 0) {
            magnetActive = false;
        }
    }
}

export function addMagnetCollectable(collectable) {
    magnetCollectables.push(collectable);
}

export function removeMagnetCollectable(index) {
    magnetCollectables.splice(index, 1);
}

export function resetMagnetState() {
    magnetActive = false;
    magnetTimer = 0;
    // Clean up any magnet collectables that are still in the scene
    magnetCollectables.forEach(collectable => {
        if (collectable && collectable.parent) {
            scene.remove(collectable);
            if (collectable.geometry) collectable.geometry.dispose();
            if (collectable.material) collectable.material.dispose();
        }
    });
    magnetCollectables = [];
}
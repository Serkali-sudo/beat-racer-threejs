import * as THREE from 'three';
import * as Constants from './constants.js';
import * as GameState from './gameState.js';
import * as UI from './ui.js'; // For gameOver and UI updates triggered by game logic

// Audio
let audioListener, sound, audioLoader, analyser;
const musicFile = 'assets/music/Under Neon Skies.mp3'; // Detected music file
let clock = new THREE.Clock(); // For general timing, less for direct beat sync now

// --- Object Creation ---

// Function to create a simple window texture
function createWindowTexture(width, height, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; // Texture resolution
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base building color (darker)
    ctx.fillStyle = new THREE.Color(color).multiplyScalar(0.1).getStyle();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Window properties
    const windowColor = new THREE.Color(color).getStyle();
    const windowSpacing = 32; // px
    const windowSize = 20;    // px
    const windowMargin = 10;  // px

    ctx.fillStyle = windowColor;

    for (let y = windowMargin; y < canvas.height - windowMargin - windowSize; y += windowSpacing) {
        for (let x = windowMargin; x < canvas.width - windowMargin - windowSize; x += windowSpacing) {
            if (Math.random() > 0.3) { // Randomly skip some windows for variation
                ctx.fillRect(x, y, windowSize, windowSize);
            }
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Repeat based on building dimensions for a somewhat consistent window density
    // These are approximate, fine-tune as needed
    texture.repeat.set(Math.max(1, Math.round(width / 4)), Math.max(1, Math.round(height / 5)));
    // texture.needsUpdate = true; // needsUpdate is handled by CanvasTexture constructor now
    return texture;
}

export function createStreetLight(targetZ, onLeftSide) {
    if (GameState.streetLights.length >= Constants.MAX_ACTIVE_STREETLIGHTS) return;

    const streetLightGroup = new THREE.Group();

    const poleMaterial = new THREE.MeshPhongMaterial({
        color: 0x333340, // Darker grey for pole and arm
        shininess: 20,
        flatShading: true
    });

    // Pole
    const poleGeometry = new THREE.CylinderGeometry(
        Constants.STREETLIGHT_POLE_RADIUS,
        Constants.STREETLIGHT_POLE_RADIUS,
        Constants.STREETLIGHT_POLE_HEIGHT,
        8 // Segments
    );
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = Constants.STREETLIGHT_POLE_HEIGHT / 2;
    streetLightGroup.add(pole);

    // Arm
    const armGeometry = new THREE.BoxGeometry(
        Constants.STREETLIGHT_ARM_THICKNESS, // Width of arm (y-axis for horizontal arm)
        Constants.STREETLIGHT_ARM_THICKNESS, // Height of arm (z-axis for horizontal arm)
        Constants.STREETLIGHT_ARM_LENGTH    // Length of arm (x-axis)
    );
    const arm = new THREE.Mesh(armGeometry, poleMaterial);
    arm.position.y = Constants.STREETLIGHT_POLE_HEIGHT - Constants.STREETLIGHT_ARM_THICKNESS * 2;
    // Position arm to extend towards the road
    arm.position.z = onLeftSide ? Constants.STREETLIGHT_ARM_LENGTH / 2 : -Constants.STREETLIGHT_ARM_LENGTH / 2;
    // arm.rotation.x = onLeftSide ? Math.PI / 2 : -Math.PI / 2; // Rotate to be horizontal if using Cylinder
    streetLightGroup.add(arm);


    // Light Fixture (the part that glows)
    const fixtureGeometry = new THREE.CylinderGeometry(
        Constants.STREETLIGHT_FIXTURE_RADIUS,
        Constants.STREETLIGHT_FIXTURE_RADIUS * 0.8, // Slightly tapered
        Constants.STREETLIGHT_FIXTURE_HEIGHT,
        8 // Segments
    );
    const fixtureMaterial = new THREE.MeshPhongMaterial({
        color: Constants.STREETLIGHT_EMISSIVE_COLOR,
        emissive: Constants.STREETLIGHT_EMISSIVE_COLOR,
        emissiveIntensity: Constants.STREETLIGHT_EMISSIVE_INTENSITY,
        shininess: 80
    });
    const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
    // Position fixture at the end of the arm, pointing down
    fixture.position.y = arm.position.y - Constants.STREETLIGHT_FIXTURE_HEIGHT / 2 - Constants.STREETLIGHT_ARM_THICKNESS / 2;
    fixture.position.z = arm.position.z;
    // fixture.rotation.x = Math.PI / 2; // Pointing down if using default cylinder orientation
    streetLightGroup.add(fixture);

    // Point Light for illumination (optional)
    if (Constants.STREETLIGHT_POINTLIGHT_ENABLED) {
        const pointLight = new THREE.PointLight(
            Constants.STREETLIGHT_POINTLIGHT_COLOR,
            Constants.STREETLIGHT_POINTLIGHT_INTENSITY,
            Constants.STREETLIGHT_POINTLIGHT_DISTANCE
        );
        pointLight.position.set(fixture.position.x, fixture.position.y - Constants.STREETLIGHT_FIXTURE_HEIGHT * 0.5, fixture.position.z);
        pointLight.castShadow = Constants.STREETLIGHT_POINTLIGHT_CAST_SHADOW;
        streetLightGroup.add(pointLight);
    }

    // Position the entire streetlight group
    const roadOuterEdgeX = (Constants.LANE_WIDTH * Constants.LANE_COUNT) / 2 + Constants.STREETLIGHT_SIDE_OFFSET;
    streetLightGroup.position.x = onLeftSide ? -roadOuterEdgeX : roadOuterEdgeX;
    // Y position is effectively handled by pole.position.y, group base is at 0
    streetLightGroup.position.z = targetZ;
    
    // Rotate arm and fixture to face road correctly based on side
    if (!onLeftSide) {
        streetLightGroup.rotation.y = Math.PI;
    }

    // Shadows (pole and arm can cast, fixture (emissive) usually doesn't)
    pole.castShadow = false;
    pole.receiveShadow = false;
    arm.castShadow = false;
    arm.receiveShadow = false;
    fixture.castShadow = false;
    fixture.receiveShadow = false;

    GameState.scene.add(streetLightGroup);
    GameState.addStreetLight(streetLightGroup);
}

export function createEnemyDrill() {
    const drillGroup = new THREE.Group();

    // Body Material
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: Constants.DRILL_COLOR,
        shininess: 70,
        flatShading: true
    });

    // Body Geometry
    const bodyGeometry = new THREE.CylinderGeometry(
        Constants.DRILL_BODY_RADIUS * Constants.DRILL_BODY_RADIUS_FRONT_FACTOR, // radiusTop (narrower front)
        Constants.DRILL_BODY_RADIUS, // radiusBottom (wider back)
        Constants.DRILL_BODY_LENGTH,
        12 // Segments
    );
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2; // Rotate to be horizontal
    drillGroup.add(body);

    // Tip Material
    const tipMaterial = new THREE.MeshPhongMaterial({
        color: Constants.DRILL_TIP_COLOR,
        emissive: Constants.DRILL_EMISSIVE_COLOR,
        emissiveIntensity: Constants.DRILL_EMISSIVE_INTENSITY,
        shininess: 90,
        flatShading: true
    });

    // Tip Geometry (Cone)
    const tipGeometry = new THREE.ConeGeometry(
        Constants.DRILL_TIP_RADIUS,
        Constants.DRILL_TIP_LENGTH,
        12 // Segments
    );
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.rotation.x = Math.PI / 2; // Rotate to align with body
    // Position tip at the front of the body
    tip.position.z = Constants.DRILL_BODY_LENGTH / 2 + Constants.DRILL_TIP_LENGTH / 2;
    drillGroup.add(tip);

    drillGroup.rotation.y = Math.PI; // Rotate 180 degrees to face correctly

    // Initial position will be set by the spawning logic in updateEnemyDrillBehavior
    // drillGroup.position.set(0, Constants.DRILL_BODY_RADIUS, GameState.camera.position.z + Constants.DRILL_INITIAL_Z_OFFSET); 
    
    drillGroup.userData.currentSpeed = 0; // Custom property to track drill's speed

    GameState.scene.add(drillGroup);
    GameState.setEnemyDrill(drillGroup);
    GameState.setEnemyDrillState('maneuvering'); // New state: get behind car
    GameState.resetDrillSpawnCheckTimer();

    return drillGroup; // Return for direct manipulation if needed by caller
}

// Utility function to check if a spawn position conflicts with existing objects
function isSpawnPositionClear(x, z, checkRadius = Constants.SPAWN_CONFLICT_CHECK_RADIUS) {
    // Check against existing obstacles
    for (const obstacle of GameState.obstacles) {
        const distance = Math.sqrt(
            Math.pow(obstacle.position.x - x, 2) + 
            Math.pow(obstacle.position.z - z, 2)
        );
        if (distance < checkRadius) {
            return false;
        }
    }
    
    // Check against existing collectables
    for (const collectable of GameState.collectables) {
        const distance = Math.sqrt(
            Math.pow(collectable.position.x - x, 2) + 
            Math.pow(collectable.position.z - z, 2)
        );
        if (distance < checkRadius) {
            return false;
        }
    }
    
    return true;
}

// Enhanced spawn position check that also considers minimum spacing requirements
function findOptimalSpawnPosition(preferredZ) {
    const lanes = [0, 1, 2]; // Available lanes
    const shuffledLanes = lanes.sort(() => Math.random() - 0.5); // Randomize lane order
    
    // Try each lane to find the clearest one
    for (const lane of shuffledLanes) {
        const laneCenter = (lane - (Constants.LANE_COUNT - 1) / 2) * Constants.LANE_WIDTH;
        
        // Check if this position is clear with a larger radius for better spacing
        if (isSpawnPositionClear(laneCenter, preferredZ, Constants.MIN_SPAWN_DISTANCE)) {
            return { x: laneCenter, z: preferredZ, found: true };
        }
    }
    
    // If no clear position found, try with a slight Z offset
    for (const lane of shuffledLanes) {
        const laneCenter = (lane - (Constants.LANE_COUNT - 1) / 2) * Constants.LANE_WIDTH;
        const offsetZ = preferredZ - (Math.random() * 6 + 2); // 2-8 units behind
        
        if (isSpawnPositionClear(laneCenter, offsetZ, Constants.SPAWN_CONFLICT_CHECK_RADIUS)) {
            return { x: laneCenter, z: offsetZ, found: true };
        }
    }
    
    // Last resort: just pick a random lane with random offset
    const fallbackLane = Math.floor(Math.random() * Constants.LANE_COUNT);
    const fallbackX = (fallbackLane - (Constants.LANE_COUNT - 1) / 2) * Constants.LANE_WIDTH;
    const fallbackZ = preferredZ - (Math.random() * 8 + 4); // 4-12 units behind
    
    return { x: fallbackX, z: fallbackZ, found: false };
}

export function createObstacle() {
    const obstacleMaterial = new THREE.MeshPhongMaterial({
        color: 0xff2222,
        emissive: 0xaa0000,
        emissiveIntensity: 0.6,
        shininess: 60,
        flatShading: true
    });
    const obstacleGeometry = new THREE.ConeGeometry(Constants.OBSTACLE_SPIKE_RADIUS, Constants.OBSTACLE_SPIKE_HEIGHT, Constants.OBSTACLE_SPIKE_SEGMENTS);
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);

    const preferredSpawnZ = GameState.camera.position.z + Constants.SPAWN_Z_OFFSET - Constants.CAMERA_DISTANCE_BEHIND;
    const spawnPosition = findOptimalSpawnPosition(preferredSpawnZ);
    
    obstacle.position.set(
        spawnPosition.x,
        Constants.OBSTACLE_SPIKE_HEIGHT / 2,
        spawnPosition.z
    );

    const originalY = Constants.OBSTACLE_SPIKE_HEIGHT / 2;
    obstacle.userData.originalY = originalY; // Store original Y for beat animation
    obstacle.castShadow = false;
    obstacle.receiveShadow = false;
    GameState.scene.add(obstacle);
    GameState.addObstacle(obstacle);
}

export function createCollectable() {
    let collectableSize = 0.4;
    try {
        const carBox = new THREE.Box3().setFromObject(GameState.carGroup);
        const carActualWidth = carBox.max.x - carBox.min.x;
        collectableSize = carActualWidth * 0.25;
    } catch (e) {
        console.warn("Could not get car size for collectable");
    }

    // Decide if this should be a magnet powerup
    const isMagnet = Math.random() < Constants.MAGNET_SPAWN_CHANCE;
    
    let collectableMaterial, collectableGeometry, collectable;
    
    if (isMagnet) {
        // Create magnet powerup
        const magnetSize = Constants.MAGNET_SIZE;
        collectableMaterial = new THREE.MeshPhongMaterial({
            color: Constants.MAGNET_COLOR,
            emissive: Constants.MAGNET_EMISSIVE_COLOR,
            emissiveIntensity: Constants.MAGNET_EMISSIVE_INTENSITY,
            shininess: 100,
            flatShading: true
        });
        collectableGeometry = new THREE.BoxGeometry(magnetSize, magnetSize * 0.3, magnetSize);
        collectable = new THREE.Mesh(collectableGeometry, collectableMaterial);
        
        // Mark as magnet powerup
        collectable.userData.isMagnet = true;
        
        // Add distinctive rotating animation - rotation speed now handled by constant
    } else {
        // Create regular collectable
        collectableMaterial = new THREE.MeshPhongMaterial({
            color: 0xaaaaff,
            emissive: 0x8888ff,
            emissiveIntensity: 0.8,
            shininess: 100,
            flatShading: true
        });
        collectableGeometry = new THREE.IcosahedronGeometry(collectableSize, 0);
        collectable = new THREE.Mesh(collectableGeometry, collectableMaterial);
        collectable.userData.isMagnet = false;
    }

    const preferredSpawnZ = GameState.camera.position.z + Constants.SPAWN_Z_OFFSET - Constants.CAMERA_DISTANCE_BEHIND;
    const spawnPosition = findOptimalSpawnPosition(preferredSpawnZ);
    
    collectable.position.set(
        spawnPosition.x,
        isMagnet ? Constants.MAGNET_SIZE : collectableSize * 1.5,
        spawnPosition.z
    );

    collectable.castShadow = false;
    collectable.receiveShadow = false;
    GameState.scene.add(collectable);
    GameState.addCollectable(collectable);
}

export function createBuilding(targetZ, onLeftSide) {
    if (GameState.buildings.length >= Constants.MAX_ACTIVE_BUILDINGS) return;

    const width = THREE.MathUtils.randFloat(Constants.BUILDING_MIN_WIDTH, Constants.BUILDING_MAX_WIDTH);
    const height = THREE.MathUtils.randFloat(Constants.BUILDING_MIN_HEIGHT, Constants.BUILDING_MAX_HEIGHT);
    const depth = THREE.MathUtils.randFloat(Constants.BUILDING_MIN_DEPTH, Constants.BUILDING_MAX_DEPTH);
    
    let buildingGeometry;
    let isHexagonal = false;
    if (Math.random() < 0.5) { 
        const radius = Math.min(width, depth) / 2;
        buildingGeometry = new THREE.CylinderGeometry(radius, radius, height, 6); 
        isHexagonal = true;
    } else {
        buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    }

    const chosenColorHex = Constants.NEON_BUILDING_COLORS[Math.floor(Math.random() * Constants.NEON_BUILDING_COLORS.length)];
    const baseColor = new THREE.Color(chosenColorHex);
    
    const windowTexture = createWindowTexture(width, height, chosenColorHex);

    const buildingMaterial = new THREE.MeshPhongMaterial({
        color: baseColor.clone().multiplyScalar(0.05), // Darker base for windows to pop
        map: windowTexture, // Apply window texture
        emissive: chosenColorHex,
        emissiveMap: windowTexture, // Make windows emissive
        emissiveIntensity: Constants.BUILDING_EMISSIVE_INTENSITY_BASE + Math.random() * Constants.BUILDING_EMISSIVE_INTENSITY_VAR,
        shininess: 25,
        flatShading: true,
        specular: new THREE.Color(chosenColorHex).multiplyScalar(0.3)
    });

    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    // Store texture for later disposal
    building.userData.windowTexture = windowTexture;

    const originalBuildingY = height / 2 - 0.05; // Or whatever the base Y is set to
    building.userData.originalY = originalBuildingY;

    const roadHalfWidth = (Constants.LANE_WIDTH * Constants.LANE_COUNT) / 2;
    const sideOffset = THREE.MathUtils.randFloat(Constants.BUILDING_SIDE_OFFSET_MIN, Constants.BUILDING_SIDE_OFFSET_MAX);

    let effectiveWidthForPlacement = width;
    if (isHexagonal) {
        // For hexagonal prisms, the 'width' used for placement should be its diameter (2 * radius)
        effectiveWidthForPlacement = Math.min(width, depth); 
    }

    building.position.x = roadHalfWidth + sideOffset + effectiveWidthForPlacement / 2;
    if (onLeftSide) {
        building.position.x *= -1;
    }
    building.position.y = originalBuildingY;
    building.position.z = targetZ - Math.random() * depth * 0.5;

    building.castShadow = false; 
    building.receiveShadow = false;
    GameState.scene.add(building);
    GameState.addBuilding(building);

    // Add random neon signs
    if (Math.random() < 0.4) { // 40% chance of having a sign
        const signHeight = THREE.MathUtils.randFloat(1.0, 3.0); // Made taller
        const signWidth = THREE.MathUtils.randFloat(2, Math.min(6, effectiveWidthForPlacement * 0.9)); // Made wider
        const signDepth = 0.3; // Made much thicker for better visibility
        const signGeometry = new THREE.BoxGeometry(signWidth, signHeight, signDepth);
        
        const signColorHex = Constants.NEON_BUILDING_COLORS[Math.floor(Math.random() * Constants.NEON_BUILDING_COLORS.length)];
        const signMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(signColorHex).multiplyScalar(0.2),
            emissive: signColorHex,
            emissiveIntensity: 2.0 + Math.random() * 1.5, // Much brighter emissive for better visibility
            shininess: 50,
            flatShading: true,
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);

        // Position the sign on the side of the building facing the road
        // Always position at a reasonable height on the building
        sign.position.y = THREE.MathUtils.randFloat(height * 0.3, height * 0.8) - height / 2; // Higher up and more centered
        
        // Simplified positioning - place sign clearly on the road-facing side
        const roadFacingOffset = isHexagonal ? 
            effectiveWidthForPlacement * 0.6 : // For hex buildings, place further out
            effectiveWidthForPlacement / 2 + 0.2; // For box buildings, place on face
        
        // Always place signs on the road-facing side with clear positioning
        if (onLeftSide) {
            // Building is on left side of road, so road-facing side is the positive X direction
            sign.position.x = roadFacingOffset;
            sign.rotation.y = 0; // Face towards the road (positive X direction)
        } else {
            // Building is on right side of road, so road-facing side is the negative X direction
            sign.position.x = -roadFacingOffset;
            sign.rotation.y = Math.PI; // Face towards the road (negative X direction)
        }
        
        // Add some random Z offset along the building face for variety
        sign.position.z = THREE.MathUtils.randFloat(-depth * 0.2, depth * 0.2);

        // Ensure signs don't cast or receive shadows to avoid blocking other lighting
        sign.castShadow = false;
        sign.receiveShadow = false;

        building.add(sign); // Add sign as a child of the building
    }
}

export function createPedestrian(targetZ, onLeftSide) {
    if (GameState.pedestrians.length >= Constants.MAX_ACTIVE_PEDESTRIANS) return;

    const pedestrianGroup = new THREE.Group();

    // Choose a random color for this pedestrian
    const chosenColor = Constants.PEDESTRIAN_COLORS[Math.floor(Math.random() * Constants.PEDESTRIAN_COLORS.length)];
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: chosenColor,
        shininess: 20,
        flatShading: true
    });

    // Head
    const headGeometry = new THREE.SphereGeometry(Constants.PEDESTRIAN_HEAD_RADIUS, 8, 6);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = Constants.PEDESTRIAN_HEIGHT - Constants.PEDESTRIAN_HEAD_RADIUS;
    pedestrianGroup.add(head);

    // Body (torso)
    const torsoHeight = Constants.PEDESTRIAN_HEIGHT * 0.4;
    const torsoGeometry = new THREE.BoxGeometry(
        Constants.PEDESTRIAN_WIDTH * 0.8,
        torsoHeight,
        Constants.PEDESTRIAN_DEPTH * 0.6
    );
    const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
    torso.position.y = Constants.PEDESTRIAN_HEIGHT - Constants.PEDESTRIAN_HEAD_RADIUS * 2 - torsoHeight / 2;
    pedestrianGroup.add(torso);

    // Legs
    const legHeight = Constants.PEDESTRIAN_HEIGHT * 0.35;
    const legGeometry = new THREE.BoxGeometry(
        Constants.PEDESTRIAN_WIDTH * 0.25,
        legHeight,
        Constants.PEDESTRIAN_DEPTH * 0.4
    );
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(
        -Constants.PEDESTRIAN_WIDTH * 0.2,
        legHeight / 2,
        0
    );
    pedestrianGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(
        Constants.PEDESTRIAN_WIDTH * 0.2,
        legHeight / 2,
        0
    );
    pedestrianGroup.add(rightLeg);

    // Arms
    const armHeight = Constants.PEDESTRIAN_HEIGHT * 0.3;
    const armGeometry = new THREE.BoxGeometry(
        Constants.PEDESTRIAN_WIDTH * 0.15,
        armHeight,
        Constants.PEDESTRIAN_DEPTH * 0.3
    );
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(
        -Constants.PEDESTRIAN_WIDTH * 0.5,
        Constants.PEDESTRIAN_HEIGHT - Constants.PEDESTRIAN_HEAD_RADIUS * 2 - armHeight / 2,
        0
    );
    pedestrianGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(
        Constants.PEDESTRIAN_WIDTH * 0.5,
        Constants.PEDESTRIAN_HEIGHT - Constants.PEDESTRIAN_HEAD_RADIUS * 2 - armHeight / 2,
        0
    );
    pedestrianGroup.add(rightArm);

    // Store references for animation
    pedestrianGroup.userData.leftLeg = leftLeg;
    pedestrianGroup.userData.rightLeg = rightLeg;
    pedestrianGroup.userData.leftArm = leftArm;
    pedestrianGroup.userData.rightArm = rightArm;
    pedestrianGroup.userData.animationOffset = Math.random() * Math.PI * 2; // Random starting animation phase

    // Position on sidewalk
    const roadHalfWidth = (Constants.LANE_WIDTH * Constants.LANE_COUNT) / 2;
    const sidewalkX = roadHalfWidth + Constants.PEDESTRIAN_SIDEWALK_OFFSET_FROM_ROAD;
    
    pedestrianGroup.position.x = onLeftSide ? -sidewalkX : sidewalkX;
    pedestrianGroup.position.y = 0;
    pedestrianGroup.position.z = targetZ;

    // Random walking speed and direction
    const walkSpeed = THREE.MathUtils.randFloat(Constants.PEDESTRIAN_WALK_SPEED_MIN, Constants.PEDESTRIAN_WALK_SPEED_MAX);
    const walkDirection = Math.random() < 0.5 ? 1 : -1; // Forward or backward along the sidewalk
    pedestrianGroup.userData.walkSpeed = walkSpeed * walkDirection;
    
    // Face the walking direction
    if (walkDirection < 0) {
        pedestrianGroup.rotation.y = Math.PI;
    }

    // Add shadows
    pedestrianGroup.traverse(object => {
        if (object.isMesh) {
            object.castShadow = false;
            object.receiveShadow = false;
        }
    });

    GameState.scene.add(pedestrianGroup);
    GameState.addPedestrian(pedestrianGroup);
}

export function createTrailParticle(xOffset = 0) {
    // Adaptive performance: reduce max particles on slower devices
    let maxTrailParticles = Constants.TRAIL_PARTICLE_MAX_COUNT;
    if (GameState.lastDeltaTime && GameState.lastDeltaTime > Constants.PERFORMANCE_DELTA_THRESHOLD) {
        maxTrailParticles *= Constants.MOBILE_MAX_PARTICLES_REDUCTION_FACTOR;
    }
    
    if (GameState.trailParticles.length >= maxTrailParticles) return;

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0], 3));

    // Enhanced trail during perfection phases
    let trailColor = Constants.TRAIL_COLOR;
    let trailSize = Constants.TRAIL_PARTICLE_SIZE;
    let trailOpacity = Constants.TRAIL_PARTICLE_INITIAL_OPACITY;

    if (GameState.currentPerfectionPhase > 0) {
        // Use perfection phase color for trail
        switch (GameState.currentPerfectionPhase) {
            case 1: trailColor = Constants.PERFECTION_PHASE_1_COLOR; break;
            case 2: trailColor = Constants.PERFECTION_PHASE_2_COLOR; break;
            case 3: trailColor = Constants.PERFECTION_PHASE_3_COLOR; break;
        }
        trailSize *= Constants.PERFECTION_TRAIL_SIZE_MULTIPLIER;
        trailOpacity *= Constants.PERFECTION_TRAIL_OPACITY_MULTIPLIER;
    }

    const particleMaterial = new THREE.PointsMaterial({
        color: trailColor,
        size: trailSize,
        transparent: true,
        opacity: trailOpacity,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particleMesh = new THREE.Points(particleGeometry, particleMaterial);

    particleMesh.position.x = GameState.carGroup.position.x + xOffset;
    particleMesh.position.y = GameState.carGroup.position.y + (0.05 * Constants.CAR_SCALE);
    particleMesh.position.z = GameState.carGroup.position.z + Constants.CAR_MODEL_REAR_Z_OFFSET;

    GameState.scene.add(particleMesh);
    GameState.addTrailParticle({
        mesh: particleMesh,
        life: Constants.TRAIL_PARTICLE_LIFESPAN,
        initialOpacity: trailOpacity
    });
}

export function createWindParticle() {
    // Adaptive performance: reduce max particles on slower devices
    let maxWindParticles = Constants.WIND_PARTICLE_COUNT;
    if (GameState.lastDeltaTime && GameState.lastDeltaTime > Constants.PERFORMANCE_DELTA_THRESHOLD) {
        maxWindParticles *= Constants.MOBILE_MAX_PARTICLES_REDUCTION_FACTOR;
    }
    
    if (GameState.windParticles.length >= maxWindParticles) return;

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0], 3));

    // Wind particles use current perfection phase color
    let windColor = 0xffffff; // Default white
    switch (GameState.currentPerfectionPhase) {
        case 1: windColor = Constants.PERFECTION_PHASE_1_COLOR; break;
        case 2: windColor = Constants.PERFECTION_PHASE_2_COLOR; break;
        case 3: windColor = Constants.PERFECTION_PHASE_3_COLOR; break;
    }

    const particleMaterial = new THREE.PointsMaterial({
        color: windColor,
        size: Constants.WIND_PARTICLE_SIZE,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particleMesh = new THREE.Points(particleGeometry, particleMaterial);

    // Spawn around the car with some spread
    const spreadX = (Math.random() - 0.5) * Constants.WIND_PARTICLE_SPREAD;
    const spreadY = Math.random() * 2 + 1; // Above ground level
    
    particleMesh.position.x = GameState.carGroup.position.x + spreadX;
    particleMesh.position.y = spreadY;
    particleMesh.position.z = GameState.carGroup.position.z - Math.random() * 5; // Spawn slightly behind

    // Random velocity for wind effect
    const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1, // Small horizontal drift
        Math.random() * 0.05 + 0.02, // Upward movement
        THREE.MathUtils.randFloat(Constants.WIND_PARTICLE_SPEED_MIN, Constants.WIND_PARTICLE_SPEED_MAX) // Forward speed
    );

    GameState.scene.add(particleMesh);
    GameState.addWindParticle({
        mesh: particleMesh,
        velocity: velocity,
        life: Constants.WIND_PARTICLE_LIFE,
        initialLife: Constants.WIND_PARTICLE_LIFE
    });
}

// --- Game Logic Updates ---

export function updateTrail(effectiveGameSpeed = GameState.gameSpeed, deltaTime = 1/60) {
    if (GameState.gameState !== 'playing') return;

    GameState.incrementTrailSpawnTimer(deltaTime);
    
    // Enhanced trail spawning during perfection phases
    let trailSpawnInterval = Constants.TRAIL_SPAWN_INTERVAL;
    if (GameState.currentPerfectionPhase > 0) {
        trailSpawnInterval *= Constants.PERFECTION_TRAIL_SPAWN_RATE_MULTIPLIER;
    }
    
    // Adaptive performance: if deltaTime is large, we're on a slower device
    if (deltaTime > Constants.PERFORMANCE_DELTA_THRESHOLD) {
        trailSpawnInterval *= Constants.MOBILE_TRAIL_SPAWN_INTERVAL_MULTIPLIER;
    }
    
    if (GameState.trailSpawnTimer >= trailSpawnInterval) {
        createTrailParticle(-Constants.TRAIL_HALF_WIDTH);
        createTrailParticle(Constants.TRAIL_HALF_WIDTH);
        
        // Spawn additional trail particles during higher perfection phases (only if performance allows)
        if (GameState.currentPerfectionPhase >= 2 && deltaTime <= Constants.PERFORMANCE_DELTA_THRESHOLD) {
            createTrailParticle(-Constants.TRAIL_HALF_WIDTH * 1.5);
            createTrailParticle(Constants.TRAIL_HALF_WIDTH * 1.5);
        }
        if (GameState.currentPerfectionPhase >= 3 && deltaTime <= Constants.PERFORMANCE_DELTA_THRESHOLD) {
            createTrailParticle(0); // Center trail for phase 3
        }
        
        GameState.resetTrailSpawnTimer();
    }

    for (let i = GameState.trailParticles.length - 1; i >= 0; i--) {
        const p = GameState.trailParticles[i];
        p.life -= deltaTime;

        p.mesh.position.z += effectiveGameSpeed;
        p.mesh.material.opacity = Math.max(0, (p.life / Constants.TRAIL_PARTICLE_LIFESPAN) * p.initialOpacity);

        if (p.life <= 0) {
            GameState.scene.remove(p.mesh);
            if (p.mesh.geometry) p.mesh.geometry.dispose();
            if (p.mesh.material) p.mesh.material.dispose();
            GameState.removeTrailParticle(i);
        }
    }
}

function updateScenerySpawning(deltaTime = 1/60) {
    if (GameState.gameState !== 'playing') return;

    const currentHorizonZ = GameState.camera.position.z + Constants.SPAWN_Z_OFFSET;
    const generationDepthBeyondHorizon = Constants.ROAD_LENGTH * 0.75;
    const targetGenerationEndZ = currentHorizonZ - generationDepthBeyondHorizon;

    // Building Spawning (existing logic)
    while (GameState.lastBuildingSpawnZ > targetGenerationEndZ && GameState.buildings.length < Constants.MAX_ACTIVE_BUILDINGS) {
        const newChunkBaseZ = GameState.lastBuildingSpawnZ - (Math.random() * 3);
        createBuilding(newChunkBaseZ, true);
        createBuilding(newChunkBaseZ, false);
        if (Math.random() < 0.85) {
            createBuilding(newChunkBaseZ - Constants.BUILDING_SPAWN_CHUNK_Z * (0.2 + Math.random() * 0.3), true);
            createBuilding(newChunkBaseZ - Constants.BUILDING_SPAWN_CHUNK_Z * (0.2 + Math.random() * 0.3), false);
        }
        if (Math.random() < 0.6) {
            createBuilding(newChunkBaseZ - Constants.BUILDING_SPAWN_CHUNK_Z * (0.5 + Math.random() * 0.3), true);
            createBuilding(newChunkBaseZ - Constants.BUILDING_SPAWN_CHUNK_Z * (0.5 + Math.random() * 0.3), false);
        }
        GameState.setLastBuildingSpawnZ(newChunkBaseZ - Constants.BUILDING_SPAWN_CHUNK_Z);
    }

    // Streetlight Spawning - Timer-based like pedestrians
    GameState.incrementStreetLightSpawnTimer(deltaTime);
    if (GameState.streetLightSpawnTimer >= Constants.STREETLIGHT_SPAWN_INTERVAL) {
        const streetLightZ = currentHorizonZ - Math.random() * 10;
        createStreetLight(streetLightZ, true); // Left side
        createStreetLight(streetLightZ, false); // Right side
        GameState.resetStreetLightSpawnTimer();
    }

    // Pedestrian Spawning
    GameState.incrementPedestrianSpawnTimer(deltaTime);
    if (GameState.pedestrianSpawnTimer >= Constants.PEDESTRIAN_SPAWN_INTERVAL) {
        if (Math.random() < Constants.PEDESTRIAN_SPAWN_CHANCE) {
            const pedestrianZ = currentHorizonZ - Math.random() * 20;
            createPedestrian(pedestrianZ, true); // Left sidewalk
            if (Math.random() < 0.7) { // 70% chance for both sides
                createPedestrian(pedestrianZ - Math.random() * 10, false); // Right sidewalk
            }
        }
        GameState.resetPedestrianSpawnTimer();
    }
}

function updatePedestrians(effectiveGameSpeed = GameState.gameSpeed) {
    if (GameState.gameState !== 'playing') return;

    // Move and animate pedestrians
    for (let i = GameState.pedestrians.length - 1; i >= 0; i--) {
        const pedestrian = GameState.pedestrians[i];
        
        // Move with road and their own walking speed
        pedestrian.position.z += effectiveGameSpeed + pedestrian.userData.walkSpeed;
        
        // Walking animation synced to music if available
        let animSpeed = Constants.PEDESTRIAN_ANIMATION_SPEED;
        let animAmplitudeFactor = 1.0;
        if (analyser) {
            const data = analyser.getFrequencyData(); 
            let lowerFreqAvg = 0;
            const lowerBandCount = Math.floor(data.length * Constants.MUSIC_LOWER_BAND_RATIO);
            for (let j = 0; j < lowerBandCount; j++) {
                lowerFreqAvg += data[j];
            }
            lowerFreqAvg /= (lowerBandCount || 1); 

            const normalizedBeat = Math.min(1, Math.max(0, (lowerFreqAvg - Constants.MUSIC_BEAT_THRESHOLD) / Constants.MUSIC_BEAT_SENSITIVITY));
            
            // Speed up animation on beat and increase amplitude, but less aggressively
            animSpeed = Constants.PEDESTRIAN_ANIMATION_SPEED * (1.0 + normalizedBeat * Constants.PEDESTRIAN_BEAT_SPEED_MULTIPLIER);
            animAmplitudeFactor = 1.0 + normalizedBeat * Constants.PEDESTRIAN_BEAT_AMPLITUDE_MULTIPLIER;
        }
        
        const time = Date.now() * 0.001; // Convert to seconds
        const animPhase = time * animSpeed + pedestrian.userData.animationOffset;
        
        // Animate legs (alternating swing)
        if (pedestrian.userData.leftLeg && pedestrian.userData.rightLeg) {
            pedestrian.userData.leftLeg.rotation.x = Math.sin(animPhase) * Constants.PEDESTRIAN_LEG_SWING_AMPLITUDE * animAmplitudeFactor;
            pedestrian.userData.rightLeg.rotation.x = Math.sin(animPhase + Math.PI) * Constants.PEDESTRIAN_LEG_SWING_AMPLITUDE * animAmplitudeFactor;
        }
        
        // Animate arms (opposite to legs for natural walking motion)
        if (pedestrian.userData.leftArm && pedestrian.userData.rightArm) {
            pedestrian.userData.leftArm.rotation.x = Math.sin(animPhase + Math.PI) * Constants.PEDESTRIAN_ARM_SWING_AMPLITUDE * animAmplitudeFactor;
            pedestrian.userData.rightArm.rotation.x = Math.sin(animPhase) * Constants.PEDESTRIAN_ARM_SWING_AMPLITUDE * animAmplitudeFactor;
        }

        // Remove pedestrians that are too far behind
        if (pedestrian.position.z > GameState.camera.position.z + Constants.ROAD_RECYCLE_POINT_OFFSET + Constants.PEDESTRIAN_RECYCLE_EXTRA_OFFSET) {
            GameState.scene.remove(pedestrian);
            pedestrian.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
                    else object.material.dispose();
                }
            });
            GameState.removePedestrian(i);
        }
    }
}

export function updateGame(deltaTime = 1/60) {
    if (GameState.gameState !== 'playing') return;

    // Track deltaTime for adaptive performance
    GameState.setLastDeltaTime(deltaTime);

    // Increment frame counter for debugging and timing (keep for debugging only)
    GameState.incrementFrameCount();

    // Calculate effective speed with perfection multiplier
    const perfectionMultiplier = getPerfectionSpeedMultiplier();
    const effectiveGameSpeed = GameState.gameSpeed * perfectionMultiplier;

    // Move road segments
    GameState.roadSegments.forEach(segment => {
        segment.position.z += effectiveGameSpeed;
        if (segment.position.z > GameState.camera.position.z + Constants.ROAD_RECYCLE_POINT_OFFSET) {
            segment.position.z -= Constants.ROAD_LENGTH;
        }
    });

    // Move and recycle obstacles
    for (let i = GameState.obstacles.length - 1; i >= 0; i--) {
        const obstacle = GameState.obstacles[i];
        obstacle.position.z += effectiveGameSpeed;

        // Beat-synced vertical movement
        if (analyser) {
            const data = analyser.getFrequencyData(); 
            let lowerFreqAvg = 0;
            const lowerBandCount = Math.floor(data.length * Constants.MUSIC_LOWER_BAND_RATIO);
            for (let j = 0; j < lowerBandCount; j++) {
                lowerFreqAvg += data[j];
            }
            lowerFreqAvg /= (lowerBandCount || 1); 

            // --- TUNING AREA --- 
            // !!!! LOOK AT YOUR CONSOLE LOGS FOR `lowerFreqAvg` !!!!
            // `MUSIC_BEAT_THRESHOLD` MUST BE HIGHER than `lowerFreqAvg` during NON-BEAT parts of your song.
            // If `lowerFreqAvg` is e.g. 120 in quiet parts, set `MUSIC_BEAT_THRESHOLD` to 130 or 140.
            // --- END TUNING AREA ---

            const normalizedBeat = Math.min(1, Math.max(0, (lowerFreqAvg - Constants.MUSIC_BEAT_THRESHOLD) / Constants.MUSIC_BEAT_SENSITIVITY));
            
            if (GameState.frameCount % 60 === 0 && i === 0) { 
                console.log(`TUNING: lowerFreqAvg: ${lowerFreqAvg.toFixed(2)}, beatThreshold: ${Constants.MUSIC_BEAT_THRESHOLD}, normalizedBeat: ${normalizedBeat.toFixed(2)}`);
            }

            const targetJumpHeight = Constants.OBSTACLE_SPIKE_HEIGHT * Constants.OBSTACLE_BEAT_JUMP_FACTOR * normalizedBeat;
            const targetY = obstacle.userData.originalY + targetJumpHeight;
            
            obstacle.position.y += (targetY - obstacle.position.y) * Constants.MUSIC_SMOOTHING_FACTOR;

        } else if (sound && sound.isPlaying) { 
            const elapsedTime = clock.getElapsedTime();
            const amplitude = Constants.OBSTACLE_SPIKE_HEIGHT * Constants.OBSTACLE_FALLBACK_AMPLITUDE_FACTOR; 
            obstacle.position.y = obstacle.userData.originalY + Math.sin(elapsedTime * Math.PI * Constants.MUSIC_FALLBACK_BEAT_FREQUENCY) * amplitude;
        }

        if (obstacle.position.z > GameState.camera.position.z + Constants.ROAD_RECYCLE_POINT_OFFSET + 5) {
            GameState.scene.remove(obstacle);
            if (obstacle.geometry) obstacle.geometry.dispose();
            if (obstacle.material) obstacle.material.dispose();
            GameState.removeObstacle(i);
        }
    }

    // Move and recycle collectables
    for (let i = GameState.collectables.length - 1; i >= 0; i--) {
        const collectable = GameState.collectables[i];
        
        // Apply magnet attraction if magnet is active and this is not a magnet collectible
        if (GameState.magnetActive && !collectable.userData.isMagnet) {
            const distanceToPlayer = collectable.position.distanceTo(GameState.carGroup.position);
            
            if (distanceToPlayer <= Constants.MAGNET_RANGE) {
                // Calculate direction towards player
                const direction = new THREE.Vector3().subVectors(GameState.carGroup.position, collectable.position);
                direction.normalize();
                
                // Move towards player
                collectable.position.add(direction.multiplyScalar(Constants.MAGNET_ATTRACTION_SPEED));
            }
        }
        
        collectable.position.z += effectiveGameSpeed;
        
        // Handle different rotations for different collectible types
        if (collectable.userData.isMagnet) {
            // Magnet has distinctive rotation - now deltaTime-based
            collectable.rotation.y += Constants.MAGNET_ROTATION_SPEED_PER_SECOND * deltaTime;
            collectable.rotation.x += Constants.MAGNET_ROTATION_SPEED_PER_SECOND * 0.5 * deltaTime;
        } else {
            // Regular collectible rotation - now deltaTime-based
            collectable.rotation.x += Constants.COLLECTABLE_ROTATION_SPEED * deltaTime;
            collectable.rotation.y += Constants.COLLECTABLE_ROTATION_SPEED * 1.5 * deltaTime;
        }
        
        if (collectable.position.z > GameState.camera.position.z + Constants.ROAD_RECYCLE_POINT_OFFSET + 5) {
            GameState.scene.remove(collectable);
            if (collectable.geometry) collectable.geometry.dispose();
            if (collectable.material) collectable.material.dispose();
            GameState.removeCollectable(i);
        }
    }

    // Update magnet timer
    if (GameState.magnetActive) {
        GameState.decrementMagnetTimer(deltaTime);
    }

    // Move and recycle buildings
    for (let i = GameState.buildings.length - 1; i >= 0; i--) {
        const building = GameState.buildings[i];
        building.position.z += effectiveGameSpeed;

        // --- Building Beat Animation --- 
        if (analyser && building.userData.originalY !== undefined) {
            const data = analyser.getFrequencyData(); 
            let lowerFreqAvg = 0;
            const lowerBandCount = Math.floor(data.length * Constants.MUSIC_LOWER_BAND_RATIO);
            for (let j = 0; j < lowerBandCount; j++) {
                lowerFreqAvg += data[j];
            }
            lowerFreqAvg /= (lowerBandCount || 1); 

            // Using the same TUNING AREA parameters as obstacles
            const normalizedBeat = Math.min(1, Math.max(0, (lowerFreqAvg - Constants.MUSIC_BEAT_THRESHOLD) / Constants.MUSIC_BEAT_SENSITIVITY));
            
            // Use building's actual height for jump scale, if available
            const buildingHeight = building.geometry.parameters.height || 10; // Fallback height
            const targetJumpHeight = buildingHeight * Constants.BUILDING_BEAT_JUMP_FACTOR * normalizedBeat; 
            const targetY = building.userData.originalY + targetJumpHeight;
            
            building.position.y += (targetY - building.position.y) * Constants.MUSIC_SMOOTHING_FACTOR;
        }
        // --- End Building Beat Animation ---

        // Check if 'depth' parameter exists, otherwise use a fallback or skip disposal for this dimension
        const buildingDepth = building.geometry.parameters.depth || (building.geometry.parameters.radiusBottom * 2) || 2; // Fallback for Cylinder

        if (building.position.z - buildingDepth / 2 > GameState.camera.position.z + Constants.ROAD_RECYCLE_POINT_OFFSET + Constants.BUILDING_RECYCLE_EXTRA_OFFSET) {
            GameState.scene.remove(building);
            if (building.geometry) building.geometry.dispose();
            if (building.userData.windowTexture) building.userData.windowTexture.dispose(); // Dispose texture
            
            // Dispose materials of building and its children (signs)
            building.traverse(object => {
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
            GameState.removeBuilding(i);
        }
    }
    GameState.updateLastBuildingSpawnZ(effectiveGameSpeed);

    // Move and recycle streetlights
    for (let i = GameState.streetLights.length - 1; i >= 0; i--) {
        const light = GameState.streetLights[i];
        light.position.z += effectiveGameSpeed;
        // Use pole height for a rough recycle check, similar to buildings
        if (light.position.z - Constants.STREETLIGHT_POLE_HEIGHT / 2 > GameState.camera.position.z + Constants.ROAD_RECYCLE_POINT_OFFSET + Constants.STREETLIGHT_RECYCLE_EXTRA_OFFSET) {
            GameState.scene.remove(light);
            // Dispose geometry and materials of children (pole, light sphere, pointlight)
            light.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            GameState.removeStreetLight(i);
        }
    }

    updateScenerySpawning(deltaTime);
    updatePedestrians(effectiveGameSpeed);

    // Spawn obstacles and collectables based on timers and game speed
    const speedFactor = Math.max(0.5, effectiveGameSpeed / 0.15);
    const speedAdjustedObstacleInterval = Constants.OBSTACLE_SPAWN_INTERVAL / speedFactor;
    const speedAdjustedCollectableInterval = Constants.COLLECTABLE_SPAWN_INTERVAL / speedFactor;
    
    // Track if we spawned something this frame to prevent simultaneous spawning
    let spawnedThisFrame = false;
    
    GameState.incrementObstacleSpawnTimer(deltaTime);
    if (GameState.obstacleSpawnTimer > speedAdjustedObstacleInterval && !spawnedThisFrame) {
        createObstacle();
        GameState.resetObstacleSpawnTimer(Math.random() * -0.5); // Small negative offset
        GameState.setGameSpeed(Math.min(GameState.gameSpeed + 0.0015, 0.45)); // Increase base game speed slightly
        spawnedThisFrame = true;
    }

    GameState.incrementCollectableSpawnTimer(deltaTime);
    if (GameState.collectableSpawnTimer > speedAdjustedCollectableInterval && !spawnedThisFrame) {
        createCollectable();
        GameState.resetCollectableSpawnTimer(Math.random() * -0.33); // Small negative offset
        spawnedThisFrame = true;
    }

    // Update car position and animation
    const carTargetX = (GameState.targetLane - (Constants.LANE_COUNT - 1) / 2) * Constants.LANE_WIDTH;
    GameState.carGroup.position.x += (carTargetX - GameState.carGroup.position.x) * 0.15; // Smooth lane change

    if (GameState.isJumping) {
        GameState.incrementJumpTimer(deltaTime);
        const jumpProgress = GameState.jumpTimer / Constants.JUMP_DURATION;
        GameState.carGroup.position.y = Constants.JUMP_HEIGHT * Math.sin(jumpProgress * Math.PI);
        GameState.carGroup.rotation.x = Math.sin(jumpProgress * Math.PI) * 0.1; // Tilt while jumping
        if (GameState.jumpTimer >= Constants.JUMP_DURATION) {
            GameState.setIsJumping(false);
            GameState.setJumpFrame(0);
            GameState.resetJumpTimer();
            GameState.carGroup.position.y = 0;
            GameState.carGroup.rotation.x = 0;
        }
    } else {
        // Car tilt based on movement
        const tiltAngle = (GameState.carGroup.position.x - carTargetX) * 0.1;
        GameState.carGroup.rotation.z = THREE.MathUtils.lerp(GameState.carGroup.rotation.z, tiltAngle, 0.1);
        GameState.carGroup.rotation.y = THREE.MathUtils.lerp(GameState.carGroup.rotation.y, (GameState.carGroup.position.x - carTargetX) * -0.05, 0.1);
    }

    // Collision detection
    const carBoxHelper = new THREE.Box3().setFromObject(GameState.carGroup);

    for (let i = GameState.collectables.length - 1; i >= 0; i--) {
        const c = GameState.collectables[i];
        const cBox = new THREE.Box3().setFromObject(c);
        if (carBoxHelper.intersectsBox(cBox)) {
            if (c.userData.isMagnet) {
                createMagnetBurst(c.position);
            } else {
                createCollectableBurst(c.position);
            }
            GameState.scene.remove(c);
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
            GameState.removeCollectable(i);
            
            if (c.userData.isMagnet) {
                // Activate magnet powerup
                GameState.setMagnetActive(true);
                GameState.setMagnetTimer(Constants.MAGNET_DURATION);
                console.log("Magnet powerup activated!");
                
                // Give some boost as well
                gainBoost(Constants.COLLECTABLE_VALUE);
            } else {
                // Regular collectable
                gainBoost(Constants.COLLECTABLE_VALUE);
            }
            
            // Track perfect streak for perfection mechanism
            GameState.incrementPerfectStreak();
            
            // Trigger small burst during perfection phases
            if (GameState.currentPerfectionPhase > 0) {
                // Create a smaller burst for collection during perfection
                for (let j = 0; j < GameState.currentPerfectionPhase * 2; j++) {
                    createPerfectionBurstParticle();
                }
            }
        }
    }

    // Check for missed collectables (collectables that passed the car)
    for (let i = GameState.collectables.length - 1; i >= 0; i--) {
        const c = GameState.collectables[i];
        // If collectable is significantly behind the car, it was missed
        if (c.position.z > GameState.carGroup.position.z + 3) {
            // Missed a collectable - reduce perfect streak
            GameState.resetPerfectStreak();
            break; // Only reset once per frame to avoid multiple resets
        }
    }

    for (let i = GameState.obstacles.length - 1; i >= 0; i--) {
        const o = GameState.obstacles[i];
        const oBox = new THREE.Box3().setFromObject(o);
        if (carBoxHelper.intersectsBox(oBox)) {
            const carBottomY = GameState.carGroup.position.y;
            const oClearanceY = Constants.OBSTACLE_SPIKE_HEIGHT * 0.4;
            if (!GameState.isJumping || carBottomY < oClearanceY) {
                gameOver("Hit a spike!");
                UI.shakeCamera(150, 0.1);
                return; // Stop further game updates
            }
        }
    }

    GameState.incrementScore(Math.round(GameState.gameSpeed * 10));
    UI.updateScoreElement();

    // Update camera position and lookAt
    const targetCamZ = GameState.carGroup.position.z + Constants.CAMERA_DISTANCE_BEHIND;
    GameState.camera.position.z = THREE.MathUtils.lerp(GameState.camera.position.z, targetCamZ, 0.1);
    const targetLookAtZ = GameState.carGroup.position.z + Constants.CAMERA_LOOKAT_AHEAD_Z;
    const currentLookAt = new THREE.Vector3();
    GameState.camera.getWorldDirection(currentLookAt).multiplyScalar(10).add(GameState.camera.position);
    const targetLookAtPos = new THREE.Vector3(
        Constants.CAMERA_STATIC_X_OFFSET + Constants.CAMERA_LOOKAT_X_CENTER_OFFSET,
        Constants.CAMERA_LOOKAT_Y,
        targetLookAtZ
    );
    const smoothedLookAt = currentLookAt.lerp(targetLookAtPos, 0.08);
    GameState.camera.lookAt(smoothedLookAt);

    updateTrail(effectiveGameSpeed, deltaTime);
    updateEnemyDrillBehavior(deltaTime);
    updateCollectableBurst(deltaTime);
    updatePerfectionMechanism(effectiveGameSpeed, deltaTime);
    UI.updateBoostUI();
    UI.updateMagnetUI();
}

function updateEnemyDrillBehavior(deltaTime = 1/60) {
    if (!GameState.carGroup) return; // Ensure car exists

    GameState.incrementDrillSpawnCheckTimer(deltaTime);

    // --- Drill Spawning ---
    if (GameState.enemyDrillState === 'inactive' && GameState.drillSpawnCheckTimer >= Constants.DRILL_SPAWN_CHECK_INTERVAL) {
        if (Math.random() < Constants.DRILL_SPAWN_CHANCE_PER_SECOND) {
            createEnemyDrill(); // This internally sets state to 'maneuvering' and sets GameState.enemyDrill
            if(GameState.enemyDrill) { 
                GameState.enemyDrill.position.x = GameState.carGroup.position.x;
                GameState.enemyDrill.position.y = Constants.DRILL_BODY_RADIUS; 
                GameState.enemyDrill.position.z = GameState.carGroup.position.z + Constants.DRILL_INITIAL_Z_OFFSET; 
                GameState.setCurrentDrillChaseDistance(Constants.DRILL_MAX_CHASE_DISTANCE); // Initialize chase distance
                GameState.setEnemyDrillState('maneuvering'); // New state: get behind car
                GameState.enemyDrill.userData.currentSpeed = Constants.DRILL_APPROACH_SPEED; // Use approach speed to maneuver
                console.log(`Drill spawned. Drill Z: ${GameState.enemyDrill.position.z.toFixed(2)}, Car Z: ${GameState.carGroup.position.z.toFixed(2)}, Offset: ${Constants.DRILL_INITIAL_Z_OFFSET}`);
            }
        }
        GameState.resetDrillSpawnCheckTimer();
    }

    if (!GameState.enemyDrill || GameState.enemyDrillState === 'inactive') return;

    const drill = GameState.enemyDrill;
    const carPos = GameState.carGroup.position;

    // --- State-based Behavior & Movement ---
    let targetZ, currentSpeed;

    // Handle deflection timer
    if (GameState.drillDeflectTimer > 0) {
        GameState.decrementDrillDeflectTimer(deltaTime);
        if (GameState.enemyDrillState !== 'deflected' && GameState.enemyDrillState !== 'retreating') {
             GameState.setEnemyDrillState('deflected'); // Ensure state is deflected if timer is active
        }
        if (GameState.drillDeflectTimer === 0 && GameState.enemyDrillState === 'deflected') {
            GameState.setEnemyDrillState('maneuvering'); // Return to maneuvering after deflection
            drill.userData.currentSpeed = Constants.DRILL_APPROACH_SPEED;
        }
    }

    switch (GameState.enemyDrillState) {
        case 'maneuvering': // New state: Drill is in front, needs to get behind car
            targetZ = carPos.z + GameState.currentDrillChaseDistance; // Target is behind car
            currentSpeed = Constants.DRILL_APPROACH_SPEED; // Use a consistent speed to get behind
            // Drill needs to increase its Z value to get behind the car
            if (drill.position.z < targetZ) {
                drill.position.z += currentSpeed;
                // If it overshoots and gets way too far behind, clamp it or transition
                if (drill.position.z > targetZ + Constants.DRILL_MAX_CHASE_DISTANCE * 0.5) { // If it's significantly past the *initial* target
                     drill.position.z = targetZ;
                     GameState.setEnemyDrillState('chasing');
                }
            } else {
                // Already behind or at the target Z for chase initiation
                GameState.setEnemyDrillState('chasing');
            }
            if (Math.abs(drill.position.z - targetZ) < 2.0) { // Close enough to desired behind position
                 GameState.setEnemyDrillState('chasing');
            }
            break;

        case 'approaching': // This state might be redundant now if maneuvering handles getting behind
                          // For now, let's assume it's for when it respawns far behind after deflection
            targetZ = carPos.z + GameState.currentDrillChaseDistance;
            currentSpeed = Constants.DRILL_APPROACH_SPEED;
            drill.position.z -= currentSpeed; 
            if (drill.position.z <= targetZ) { 
                GameState.setEnemyDrillState('chasing');
            }
            break;

        case 'chasing':
            // Gradually shrink the chase distance
            if (GameState.currentDrillChaseDistance > Constants.DRILL_MIN_CHASE_DISTANCE) {
                const shrinkAmount = Constants.DRILL_CHASE_DISTANCE_SHRINK_RATE_PER_SECOND * deltaTime;
                GameState.setCurrentDrillChaseDistance(Math.max(Constants.DRILL_MIN_CHASE_DISTANCE, GameState.currentDrillChaseDistance - shrinkAmount));
            }
            targetZ = carPos.z + GameState.currentDrillChaseDistance; // Target is BEHIND car, using dynamic distance
            
            const desiredChaseSpeed = GameState.gameSpeed + Constants.DRILL_CHASE_SPEED_PLAYER_RELATIVE;
            currentSpeed = Math.min(desiredChaseSpeed, Constants.DRILL_MAX_SPEED);
            
            if (drill.position.z > targetZ) { 
                 drill.position.z -= currentSpeed; 
                 drill.position.z = Math.max(drill.position.z, targetZ - 0.5); 
            } else if (drill.position.z < targetZ - 1.0) { 
                 drill.position.z += currentSpeed * 0.5; 
            }
            break;

        case 'deflected':
            currentSpeed = Constants.DRILL_RETREAT_SPEED; 
            drill.position.z += currentSpeed; 
            // When deflected, reset its target chase distance for when it comes back
            GameState.setCurrentDrillChaseDistance(Constants.DRILL_MAX_CHASE_DISTANCE);
            if (drill.position.z > carPos.z + Math.abs(Constants.DRILL_INITIAL_Z_OFFSET) * 2) { // Retreat further if spawned in front
                GameState.resetEnemyDrillState(); 
                return;
            }
            break;
        
        case 'retreating': 
            currentSpeed = Constants.DRILL_RETREAT_SPEED;
            drill.position.z += currentSpeed; 
            GameState.setCurrentDrillChaseDistance(Constants.DRILL_MAX_CHASE_DISTANCE); // Reset target distance
            if (drill.position.z > carPos.z + Math.abs(Constants.DRILL_INITIAL_Z_OFFSET) * 2.5) { 
                GameState.resetEnemyDrillState();
                return;
            }
            break;
    }
    drill.userData.currentSpeed = currentSpeed;

    // --- X Alignment (Lane Following) ---
    const targetX = carPos.x;
    drill.position.x += (targetX - drill.position.x) * Constants.DRILL_X_ALIGN_SPEED;

    // --- Drill Bit Rotation (Visual) ---
    if (drill.children.length > 1) { // Assuming tip is the second child
        drill.children[1].rotation.z += Constants.DRILL_BIT_ROTATION_SPEED * deltaTime; // Now deltaTime-based
    }

    // --- Collision Detection ---
    // First, do a simple distance check for all active drill states
    if (GameState.enemyDrillState !== 'inactive' && GameState.enemyDrillState !== 'retreating') {
        const distanceToCar = drill.position.distanceTo(carPos);
        
        // Very close collision check - immediate game over
        if (distanceToCar < 1.8) {
            console.log(`Drill very close collision! State: ${GameState.enemyDrillState}, Distance: ${distanceToCar.toFixed(2)}`);
            gameOver("Drilled by the enemy!");
            UI.shakeCamera(200, 0.15);
            return;
        }
    }
    
    // More detailed collision detection for active threatening states
    if (GameState.enemyDrillState === 'chasing' || GameState.enemyDrillState === 'maneuvering' || GameState.enemyDrillState === 'deflected' || GameState.enemyDrillState === 'approaching') {
        // Debug log every 60 frames (about once per second at 60fps) to avoid spam
        if (GameState.frameCount % 60 === 0) {
            const distanceToCar = drill.position.distanceTo(carPos);
            console.log(`Drill state: ${GameState.enemyDrillState}, Distance to car: ${distanceToCar.toFixed(2)}, Drill pos: (${drill.position.x.toFixed(1)}, ${drill.position.y.toFixed(1)}, ${drill.position.z.toFixed(1)}), Car pos: (${carPos.x.toFixed(1)}, ${carPos.y.toFixed(1)}, ${carPos.z.toFixed(1)})`);
        }
        
        // Always check collision when drill is in active states, not just when within danger distance
        try {
            const carBox = new THREE.Box3().setFromObject(GameState.carGroup);
            const drillBox = new THREE.Box3().setFromObject(drill);
            
            if (carBox.intersectsBox(drillBox)) {
                console.log("Drill collision detected! Game Over!"); // Debug log
                gameOver("Drilled by the enemy!");
                UI.shakeCamera(200, 0.15);
                return;
            }
            
            // Additional safety check: if drill gets too close, also trigger game over
            const distanceToCar = drill.position.distanceTo(carPos);
            if (distanceToCar < Constants.DRILL_DANGER_DISTANCE * 0.8) { // Increased threshold for emergency check
                console.log("Drill emergency collision! Distance:", distanceToCar); // Debug log
                gameOver("Drilled by the enemy!");
                UI.shakeCamera(200, 0.15);
                return;
            }
        } catch (error) {
            console.error("Error in drill collision detection:", error);
            // Fallback to simple distance check if bounding box fails
            const distanceToCar = drill.position.distanceTo(carPos);
            if (distanceToCar < 2.0) { // More generous fallback distance
                console.log("Drill fallback collision! Distance:", distanceToCar); // Debug log
                gameOver("Drilled by the enemy!");
                UI.shakeCamera(200, 0.15);
                return;
            }
        }
    }
}

// --- Game State Management Functions ---
export function startGame() {
    console.log("GameLogic.startGame called"); // DEBUG
    GameState.setGameStateManager('playing');
    GameState.setGameSpeed(0.15);
    GameState.resetCarState();
    GameState.resetObjectArrays();
    GameState.resetEnemyDrillState(); // Reset drill on start
    GameState.resetRoadSegments();
    GameState.resetTrail();
    GameState.resetGameTimers(); // Reset timers like obstacleSpawnTimer, boostTimeout etc.
    GameState.resetScore(); // Reset score
    GameState.resetPerfectionState(); // Reset perfection mechanism

    // Initialize and play music
    if (!audioListener) {
        audioListener = new THREE.AudioListener();
        GameState.camera.add(audioListener); // Attach listener to camera
        sound = new THREE.Audio(audioListener);
        audioLoader = new THREE.AudioLoader();
    }

    if (sound && !sound.isPlaying) {
        let currentMusicToPlay = GameState.selectedMusic ? `assets/music/${GameState.selectedMusic}` : musicFile;
        console.log(`Attempting to load: ${currentMusicToPlay}`); // Debug line

        audioLoader.load(currentMusicToPlay, function(buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(Constants.MUSIC_VOLUME);
            sound.play();
            analyser = new THREE.AudioAnalyser(sound, Constants.MUSIC_FFT_SIZE);
            clock.start(); // Start the clock when music starts
            console.log(`Playing: ${currentMusicToPlay}`);
        }, undefined, function (err) {
            console.error(`Error loading audio: ${currentMusicToPlay}`, err);
        });
    } else if (sound && sound.isPlaying) {
        // If music is already playing, and we want to change it, we need to stop, load new, then play.
        // This logic assumes restart might want to replay the *same* selected song or the new *selected* one.
        sound.stop();
        // We should reload the new music if it changed
        let currentMusicToPlay = GameState.selectedMusic ? `assets/music/${GameState.selectedMusic}` : musicFile;
        console.log(`Restarting with: ${currentMusicToPlay}`); // Debug line

        audioLoader.load(currentMusicToPlay, function(buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(Constants.MUSIC_VOLUME);
            sound.play();
            if (sound.context.state === 'running') {
                analyser = new THREE.AudioAnalyser(sound, Constants.MUSIC_FFT_SIZE);
            }
            clock.start(); // Restart clock
        }, undefined, function (err) {
            console.error(`Error loading audio for restart: ${currentMusicToPlay}`, err);
        });
    }

    // Pre-populate buildings
    const initialCameraZ = GameState.carGroup.position.z + Constants.CAMERA_DISTANCE_BEHIND;
    const spawnHorizonForPrePop = initialCameraZ + Constants.SPAWN_Z_OFFSET;
    let currentFurthestPopulatedBuildingZ = spawnHorizonForPrePop;
    const totalPopulateDepth = Constants.ROAD_LENGTH + Math.abs(Constants.SPAWN_Z_OFFSET) + 30;

    for (let zOffset = 0; zOffset < totalPopulateDepth; zOffset += Constants.BUILDING_SPAWN_CHUNK_Z) {
        const chunkBaseZ = spawnHorizonForPrePop - zOffset;
        createBuilding(chunkBaseZ - Math.random() * (Constants.BUILDING_SPAWN_CHUNK_Z * 0.1), true);
        createBuilding(chunkBaseZ - Math.random() * (Constants.BUILDING_SPAWN_CHUNK_Z * 0.1), false);
        if (Math.random() < 0.85) {
            createBuilding(chunkBaseZ - (Constants.BUILDING_SPAWN_CHUNK_Z * 0.3) - Math.random() * (Constants.BUILDING_SPAWN_CHUNK_Z * 0.2), true);
            createBuilding(chunkBaseZ - (Constants.BUILDING_SPAWN_CHUNK_Z * 0.3) - Math.random() * (Constants.BUILDING_SPAWN_CHUNK_Z * 0.2), false);
        }
        if (Math.random() < 0.65) {
            createBuilding(chunkBaseZ - (Constants.BUILDING_SPAWN_CHUNK_Z * 0.6) - Math.random() * (Constants.BUILDING_SPAWN_CHUNK_Z * 0.2), true);
            createBuilding(chunkBaseZ - (Constants.BUILDING_SPAWN_CHUNK_Z * 0.6) - Math.random() * (Constants.BUILDING_SPAWN_CHUNK_Z * 0.2), false);
        }
        currentFurthestPopulatedBuildingZ = chunkBaseZ;
    }
    GameState.setLastBuildingSpawnZ(currentFurthestPopulatedBuildingZ);

    // Pre-populate streetlights
    for (let i = 0; i < 6; i++) { // Start with some streetlights
        const streetLightZ = spawnHorizonForPrePop - Math.random() * totalPopulateDepth * 0.7;
        createStreetLight(streetLightZ, true); // Left side
        createStreetLight(streetLightZ - Math.random() * 10, false); // Right side, slightly offset
    }

    // Pre-populate pedestrians
    for (let i = 0; i < 8; i++) { // Start with some pedestrians
        const pedestrianZ = spawnHorizonForPrePop - Math.random() * totalPopulateDepth * 0.8;
        createPedestrian(pedestrianZ, true); // Left sidewalk
        if (Math.random() < 0.6) {
            createPedestrian(pedestrianZ - Math.random() * 15, false); // Right sidewalk
        }
    }

    // Reset camera
    if (GameState.camera && GameState.carGroup) {
         GameState.camera.position.set(Constants.CAMERA_STATIC_X_OFFSET, Constants.CAMERA_HEIGHT, GameState.carGroup.position.z + Constants.CAMERA_DISTANCE_BEHIND);
         const lookAtX = Constants.CAMERA_STATIC_X_OFFSET + Constants.CAMERA_LOOKAT_X_CENTER_OFFSET;
         GameState.camera.lookAt(lookAtX, Constants.CAMERA_LOOKAT_Y, GameState.carGroup.position.z + Constants.CAMERA_LOOKAT_AHEAD_Z);
    }

    UI.updateScoreElement();
    UI.updateBoostUI();
    UI.updatePerfectionPhaseUI(); // Initialize perfection phase display
    UI.updateMagnetUI(); // Initialize magnet timer display
    console.log("Calling UI.hideMessage() from GameLogic.startGame"); // DEBUG
    UI.hideMessage();

    // Add headlights to the car
    if (GameState.carGroup) {
        const leftHeadlight = new THREE.SpotLight(
            Constants.HEADLIGHT_COLOR,
            Constants.HEADLIGHT_INTENSITY,
            Constants.HEADLIGHT_DISTANCE,
            Constants.HEADLIGHT_ANGLE,
            Constants.HEADLIGHT_PENUMBRA,
            Constants.HEADLIGHT_DECAY
        );
        leftHeadlight.position.set(-Constants.HEADLIGHT_POS_X_OFFSET * Constants.CAR_SCALE, Constants.HEADLIGHT_POS_Y, Constants.HEADLIGHT_POS_Z); 
        leftHeadlight.target.position.set(-Constants.HEADLIGHT_POS_X_OFFSET * Constants.CAR_SCALE, Constants.HEADLIGHT_TARGET_Y_OFFSET, Constants.HEADLIGHT_TARGET_Z_OFFSET); 
        // leftHeadlight.castShadow = true; // Enable shadows if needed, can be performance intensive

        const rightHeadlight = new THREE.SpotLight(
            Constants.HEADLIGHT_COLOR,
            Constants.HEADLIGHT_INTENSITY,
            Constants.HEADLIGHT_DISTANCE,
            Constants.HEADLIGHT_ANGLE,
            Constants.HEADLIGHT_PENUMBRA,
            Constants.HEADLIGHT_DECAY
        );
        rightHeadlight.position.set(Constants.HEADLIGHT_POS_X_OFFSET * Constants.CAR_SCALE, Constants.HEADLIGHT_POS_Y, Constants.HEADLIGHT_POS_Z); 
        rightHeadlight.target.position.set(Constants.HEADLIGHT_POS_X_OFFSET * Constants.CAR_SCALE, Constants.HEADLIGHT_TARGET_Y_OFFSET, Constants.HEADLIGHT_TARGET_Z_OFFSET); 
        // rightHeadlight.castShadow = true; // Enable shadows if needed

        GameState.carGroup.add(leftHeadlight);
        GameState.carGroup.add(leftHeadlight.target);
        GameState.carGroup.add(rightHeadlight);
        GameState.carGroup.add(rightHeadlight.target);

        // Store references if needed for dynamic control later
        GameState.leftHeadlight = leftHeadlight;
        GameState.rightHeadlight = rightHeadlight;
    }
}

export function gameOver(reason = "Game Over!") {
    if (GameState.gameState === 'gameOver') return;
    GameState.setGameStateManager('gameOver');
    GameState.resetEnemyDrillState(); // Reset drill on game over
    if (GameState.boostTimeout) clearTimeout(GameState.boostTimeout);
    GameState.setBoostTimeout(null); // Clear the timeout id
    
    if (sound && sound.isPlaying) {
        sound.stop();
        clock.stop();
    }

    UI.showMessage(`${reason}<br>Score: ${GameState.score}`, "Restart");
}


export function gainBoost(amount) {
    GameState.setBoostLevel(Math.min(GameState.boostLevel + amount, Constants.MAX_BOOST));
    UI.updateBoostUI();
}

export function spendBoost(amount) {
    if (GameState.boostLevel >= amount) {
        GameState.setBoostLevel(GameState.boostLevel - amount);
        UI.updateBoostUI();

        // --- Deflect Drill on Boost --- 
        if (GameState.enemyDrill && 
            (GameState.enemyDrillState === 'chasing' || GameState.enemyDrillState === 'maneuvering')) {
            GameState.setEnemyDrillState('deflected');
            GameState.setDrillDeflectTimer(Constants.DRILL_DEFLECTION_DURATION);
            if(GameState.enemyDrill.userData) GameState.enemyDrill.userData.currentSpeed = Constants.DRILL_RETREAT_SPEED;
            console.log("Drill deflected by boost!");
        }

        return true;
    }
    return false;
}

function createCollectableBurst(position) {
    const particleCount = 15;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.15, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0xaaaaff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        // Random direction and speed for burst effect
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();
        const speed = 0.1 + Math.random() * 0.2;
        particle.userData.velocity = direction.multiplyScalar(speed);
        particle.userData.life = 0.33 + Math.random() * 0.33; // 0.33-0.67 seconds of life
        particle.userData.initialLife = particle.userData.life;
        
        GameState.scene.add(particle);
        particles.push(particle);
    }
    
    GameState.addCollectableBurstParticles(particles);
}

function createMagnetBurst(position) {
    const particleCount = 20; // More particles for magnet
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.2, 4, 4); // Slightly larger particles
        const material = new THREE.MeshBasicMaterial({
            color: Constants.MAGNET_COLOR,
            emissive: Constants.MAGNET_EMISSIVE_COLOR,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        // More dramatic burst effect for magnet
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();
        const speed = 0.15 + Math.random() * 0.3; // Faster burst
        particle.userData.velocity = direction.multiplyScalar(speed);
        particle.userData.life = 0.5 + Math.random() * 0.5; // Longer life for magnet burst
        particle.userData.initialLife = particle.userData.life;
        
        GameState.scene.add(particle);
        particles.push(particle);
    }
    
    GameState.addCollectableBurstParticles(particles);
}

function updateCollectableBurst(deltaTime = 1/60) {
    if (GameState.gameState !== 'playing') return;
    
    for (let i = GameState.collectableBurstParticles.length - 1; i >= 0; i--) {
        const particles = GameState.collectableBurstParticles[i];
        let allExpired = true;
        
        for (let j = particles.length - 1; j >= 0; j--) {
            const particle = particles[j];
            particle.position.add(particle.userData.velocity);
            particle.userData.life -= deltaTime;
            
            // Fade out effect
            particle.material.opacity = (particle.userData.life / particle.userData.initialLife) * 0.8;
            
            if (particle.userData.life <= 0) {
                GameState.scene.remove(particle);
                if (particle.geometry) particle.geometry.dispose();
                if (particle.material) particle.material.dispose();
                particles.splice(j, 1);
            } else {
                allExpired = false;
            }
        }
        
        if (allExpired) {
            GameState.removeCollectableBurst(i);
        }
    }
}

export function updatePerfectionMechanism(effectiveGameSpeed = GameState.gameSpeed, deltaTime = 1/60) {
    if (GameState.gameState !== 'playing') return;

    // Determine current phase based on streak count
    let targetPhase = 0;
    if (GameState.perfectStreakCount >= Constants.PERFECTION_PHASE_3_THRESHOLD) {
        targetPhase = 3;
    } else if (GameState.perfectStreakCount >= Constants.PERFECTION_PHASE_2_THRESHOLD) {
        targetPhase = 2;
    } else if (GameState.perfectStreakCount >= Constants.PERFECTION_PHASE_1_THRESHOLD) {
        targetPhase = 1;
    }

    // Update phase if changed
    if (targetPhase !== GameState.currentPerfectionPhase) {
        GameState.setPerfectionPhase(targetPhase);
        updateRoadPerfectionEffect();
        UI.updatePerfectionPhaseUI(); // Update UI display
        
        // Trigger burst effect when entering or advancing perfection phase
        if (targetPhase > 0) {
            triggerPerfectionBurst();
        }
    }

    // Handle transition timer
    GameState.decrementPerfectionTransitionTimer(deltaTime);

    // Spawn wind particles during perfection phases
    if (GameState.currentPerfectionPhase > 0) {
        GameState.incrementWindSpawnTimer(deltaTime);
        
        // Adaptive performance: adjust wind spawn rate for slower devices
        let windSpawnRate = Constants.WIND_PARTICLE_SPAWN_RATE;
        if (deltaTime > Constants.PERFORMANCE_DELTA_THRESHOLD) {
            windSpawnRate *= Constants.MOBILE_WIND_SPAWN_INTERVAL_MULTIPLIER;
        }
        
        if (GameState.windSpawnTimer >= windSpawnRate) {
            createWindParticle();
            GameState.resetWindSpawnTimer();
        }
        
        // Spawn burst particles periodically during perfection
        GameState.incrementPerfectionBurstTimer(deltaTime);
        if (GameState.perfectionBurstTimer >= Constants.PERFECTION_BURST_TRIGGER_INTERVAL) {
            // Create multiple burst particles for a more dramatic effect
            for (let i = 0; i < Math.min(8, Constants.PERFECTION_BURST_PARTICLE_COUNT); i++) {
                createPerfectionBurstParticle();
            }
            GameState.resetPerfectionBurstTimer();
        }
    }

    // Update wind particles
    for (let i = GameState.windParticles.length - 1; i >= 0; i--) {
        const particle = GameState.windParticles[i];
        particle.life -= deltaTime;

        // Move particle
        particle.mesh.position.add(particle.velocity);
        particle.mesh.position.z += effectiveGameSpeed; // Move with world using effective speed

        // Fade out
        particle.mesh.material.opacity = (particle.life / particle.initialLife) * 0.8;

        // Remove expired particles
        if (particle.life <= 0) {
            GameState.scene.remove(particle.mesh);
            if (particle.mesh.geometry) particle.mesh.geometry.dispose();
            if (particle.mesh.material) particle.mesh.material.dispose();
            GameState.removeWindParticle(i);
        }
    }

    // Update burst particles
    for (let i = GameState.perfectionBurstParticles.length - 1; i >= 0; i--) {
        const particle = GameState.perfectionBurstParticles[i];
        particle.life -= deltaTime;

        // Move particle
        particle.mesh.position.add(particle.velocity);
        particle.mesh.position.z += effectiveGameSpeed; // Move with world

        // Fade out and shrink
        const lifeRatio = particle.life / particle.initialLife;
        particle.mesh.material.opacity = lifeRatio;
        particle.mesh.material.size = Constants.PERFECTION_BURST_SIZE * (0.5 + lifeRatio * 0.5);

        // Remove expired particles
        if (particle.life <= 0) {
            GameState.scene.remove(particle.mesh);
            if (particle.mesh.geometry) particle.mesh.geometry.dispose();
            if (particle.mesh.material) particle.mesh.material.dispose();
            GameState.removePerfectionBurstParticle(i);
        }
    }
}

export function updateRoadPerfectionEffect() {
    if (!GameState.roadSegments || GameState.roadSegments.length === 0) return;

    // Store original line materials if not already stored
    if (GameState.roadOriginalMaterials.length === 0) {
        GameState.roadSegments.forEach(segment => {
            const lineMaterials = [];
            // Find the line meshes (children of road segments)
            segment.children.forEach(child => {
                if (child.isMesh && child.material) {
                    lineMaterials.push({
                        mesh: child,
                        originalColor: child.material.color.clone(),
                        originalEmissive: child.material.emissive.clone(),
                        originalEmissiveIntensity: child.material.emissiveIntensity
                    });
                }
            });
            GameState.roadOriginalMaterials.push(lineMaterials);
        });
        GameState.storeRoadOriginalMaterials(GameState.roadOriginalMaterials);
    }

    // Apply perfection effect to road lines only
    GameState.roadSegments.forEach((segment, segmentIndex) => {
        const lineMaterials = GameState.roadOriginalMaterials[segmentIndex];
        if (!lineMaterials) return;

        lineMaterials.forEach(lineData => {
            if (GameState.currentPerfectionPhase > 0) {
                let phaseColor = 0xffffff;
                switch (GameState.currentPerfectionPhase) {
                    case 1: phaseColor = Constants.PERFECTION_PHASE_1_COLOR; break;
                    case 2: phaseColor = Constants.PERFECTION_PHASE_2_COLOR; break;
                    case 3: phaseColor = Constants.PERFECTION_PHASE_3_COLOR; break;
                }

                // Apply phase color with enhanced emissive glow to lines only
                lineData.mesh.material.emissive.setHex(phaseColor);
                lineData.mesh.material.emissiveIntensity = Constants.PERFECTION_ROAD_EMISSIVE_INTENSITY * 2; // Make lines brighter
                lineData.mesh.material.color.setHex(phaseColor);
            } else {
                // Restore original line appearance
                lineData.mesh.material.color.copy(lineData.originalColor);
                lineData.mesh.material.emissive.copy(lineData.originalEmissive);
                lineData.mesh.material.emissiveIntensity = lineData.originalEmissiveIntensity;
            }
        });
    });
}

export function getPerfectionSpeedMultiplier() {
    switch (GameState.currentPerfectionPhase) {
        case 1: return Constants.PERFECTION_PHASE_1_SPEED_MULTIPLIER;
        case 2: return Constants.PERFECTION_PHASE_2_SPEED_MULTIPLIER;
        case 3: return Constants.PERFECTION_PHASE_3_SPEED_MULTIPLIER;
        default: return 1.0;
    }
}

export function createPerfectionBurstParticle() {
    if (GameState.perfectionBurstParticles.length >= Constants.PERFECTION_BURST_PARTICLE_COUNT) return;

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0], 3));

    // Use current perfection phase color
    let burstColor = 0xffffff;
    switch (GameState.currentPerfectionPhase) {
        case 1: burstColor = Constants.PERFECTION_PHASE_1_COLOR; break;
        case 2: burstColor = Constants.PERFECTION_PHASE_2_COLOR; break;
        case 3: burstColor = Constants.PERFECTION_PHASE_3_COLOR; break;
    }

    const particleMaterial = new THREE.PointsMaterial({
        color: burstColor,
        size: Constants.PERFECTION_BURST_SIZE,
        transparent: true,
        opacity: 1.0,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particleMesh = new THREE.Points(particleGeometry, particleMaterial);

    // Spawn behind the car
    const angle = Math.random() * Math.PI * 2; // Random angle for circular burst
    const distance = Math.random() * Constants.PERFECTION_BURST_SPREAD;
    const spreadX = Math.cos(angle) * distance;
    const spreadY = Math.sin(angle) * distance * 0.5; // Less vertical spread
    
    particleMesh.position.x = GameState.carGroup.position.x + spreadX;
    particleMesh.position.y = GameState.carGroup.position.y + Math.abs(spreadY) + 0.2; // Keep above ground
    particleMesh.position.z = GameState.carGroup.position.z + Constants.CAR_MODEL_REAR_Z_OFFSET - 1; // Behind car

    // Velocity pointing away from car center and slightly upward
    const velocity = new THREE.Vector3(
        spreadX * 0.1, // Radial spread
        Math.random() * 0.08 + 0.02, // Upward movement
        THREE.MathUtils.randFloat(Constants.PERFECTION_BURST_SPEED_MIN, Constants.PERFECTION_BURST_SPEED_MAX)
    );

    GameState.scene.add(particleMesh);
    GameState.addPerfectionBurstParticle({
        mesh: particleMesh,
        velocity: velocity,
        life: Constants.PERFECTION_BURST_LIFE,
        initialLife: Constants.PERFECTION_BURST_LIFE
    });
}

export function triggerPerfectionBurst() {
    if (GameState.currentPerfectionPhase > 0) {
        // Create an immediate burst of particles
        const burstCount = Math.min(12 + GameState.currentPerfectionPhase * 4, Constants.PERFECTION_BURST_PARTICLE_COUNT);
        for (let i = 0; i < burstCount; i++) {
            createPerfectionBurstParticle();
        }
    }
} 
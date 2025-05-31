/// --- Game Constants ---
export const LANE_WIDTH = 2.4;
export const LANE_COUNT = 3;
export const ROAD_LENGTH = 100;
export const ROAD_SEGMENT_LENGTH = 5;
export const CAR_START_Z = 3;
export const SPAWN_Z_OFFSET = -50;
export const OBSTACLE_SPAWN_INTERVAL = 1.67; // 1.67 seconds between obstacles (was 100 frames)
export const COLLECTABLE_SPAWN_INTERVAL = 1.17; // 1.17 seconds between collectables (was 70 frames)
export const COLLECTABLE_VALUE = 15;
export const MAX_BOOST = 100;
export const BOOST_ATTACK_COST = 50;
export const CAR_SCALE = 0.7;
export const OBSTACLE_SPIKE_HEIGHT = 1.9;
export const OBSTACLE_SPIKE_RADIUS = 0.65;
export const OBSTACLE_SPIKE_SEGMENTS = 8;
export const JUMP_HEIGHT = 2.2;
export const JUMP_DURATION = 0.5; // 0.5 seconds (was 30 frames)
export const CAMERA_DISTANCE_BEHIND = 13;
export const CAMERA_HEIGHT = 6.8;
export const CAMERA_STATIC_X_OFFSET = -1.8;
export const CAMERA_LOOKAT_AHEAD_Z = 6;
export const CAMERA_LOOKAT_Y = 0.8;
export const CAMERA_LOOKAT_X_CENTER_OFFSET = 1.0;
export const ROAD_LINE_WIDTH = 0.1;
export const ROAD_LINE_HEIGHT = 0.03;
export const ROAD_LINE_COLOR = 0x00ffff;
export const ROAD_LINE_EMISSIVE_INTENSITY = 1.5;
export const ROAD_RECYCLE_POINT_OFFSET = 15;

// --- Trail Constants ---
export const TRAIL_COLOR = 0xff69b4; // Hot pink
export const TRAIL_PARTICLE_MAX_COUNT = 200;
export const TRAIL_PARTICLE_LIFESPAN = 1.67; // 1.67 seconds (was 100 frames)
export const TRAIL_PARTICLE_SIZE = 0.2;
export const TRAIL_PARTICLE_INITIAL_OPACITY = 0.6;
export const TRAIL_SPAWN_INTERVAL = 0.08; // Spawn every 0.08 seconds (was 0.017 - way too frequent!)
export const CAR_MODEL_REAR_Z_OFFSET = -(1.4 * CAR_SCALE * 0.95); // Approx rear of the car model relative to carGroup.position.z
export const TRAIL_HALF_WIDTH = (1.0 * CAR_SCALE) * 0.85; // Car hw is 1.0, scaled by CAR_SCALE. This is half the trail width.

// --- Touch Controls Constants ---
export const SWIPE_THRESHOLD = 30;
export const VERTICAL_SWIPE_THRESHOLD = 50;

// --- Building Constants ---
export const BUILDING_MIN_WIDTH = 2.5;
export const BUILDING_MAX_WIDTH = 8;
export const BUILDING_MIN_DEPTH = 3;
export const BUILDING_MAX_DEPTH = 10;
export const BUILDING_MIN_HEIGHT = 8;
export const BUILDING_MAX_HEIGHT = 45;
export const BUILDING_SIDE_OFFSET_MIN = 2;
export const BUILDING_SIDE_OFFSET_MAX = 6;
export const NEON_BUILDING_COLORS = [
    0x00ffff, 0xff00ff, 0xcc00ff, 0x4d4dff, 0x0077ff, 0xff33cc,
];
export const BUILDING_EMISSIVE_INTENSITY_BASE = 0.5;
export const BUILDING_EMISSIVE_INTENSITY_VAR = 0.4;
export const MAX_ACTIVE_BUILDINGS = 100;
export const BUILDING_SPAWN_CHUNK_Z = 12;
export const BUILDING_RECYCLE_EXTRA_OFFSET = 20;

// --- Streetlight Constants ---
export const STREETLIGHT_POLE_RADIUS = 0.1;
export const STREETLIGHT_POLE_HEIGHT = 3.5;
export const STREETLIGHT_ARM_LENGTH = 1.5;
export const STREETLIGHT_ARM_THICKNESS = 0.08;
export const STREETLIGHT_FIXTURE_RADIUS = 0.25;
export const STREETLIGHT_FIXTURE_HEIGHT = 0.3;
export const STREETLIGHT_EMISSIVE_COLOR = 0x00ffff;
export const STREETLIGHT_EMISSIVE_INTENSITY = 2.0;
export const STREETLIGHT_SIDE_OFFSET = 1.0;
export const STREETLIGHT_SPACING = 30;
export const STREETLIGHT_SPAWN_INTERVAL = 1.5; // 1.5 seconds between spawn attempts (was 90 frames)
export const MAX_ACTIVE_STREETLIGHTS = 15;
export const STREETLIGHT_SPAWN_Z_OFFSET = 5;
export const STREETLIGHT_RECYCLE_EXTRA_OFFSET = 10;
export const STREETLIGHT_POINTLIGHT_ENABLED = false;
export const STREETLIGHT_POINTLIGHT_INTENSITY = 1.0;
export const STREETLIGHT_POINTLIGHT_DISTANCE = 15;
export const STREETLIGHT_POINTLIGHT_COLOR = 0x00ffff;
export const STREETLIGHT_POINTLIGHT_CAST_SHADOW = false;

// --- Enemy Drill Constants ---
export const DRILL_BODY_RADIUS = 0.8; // This will now be the back radius
export const DRILL_BODY_RADIUS_FRONT_FACTOR = 0.7; // Factor to calculate front radius
export const DRILL_BODY_LENGTH = 2.5;
export const DRILL_TIP_RADIUS = 0.56; // Adjusted to match tapered body's front radius
export const DRILL_TIP_LENGTH = 1.65; // Adjusted for a more spike-like appearance
export const DRILL_COLOR = 0x888899; // Metallic grey
export const DRILL_TIP_COLOR = 0xffcc00; // Warning yellow/gold
export const DRILL_EMISSIVE_COLOR = 0xff0000; // Red glow
export const DRILL_EMISSIVE_INTENSITY = 1.0;
export const DRILL_SPAWN_CHANCE_PER_SECOND = 0.05; // Chance to spawn each second if not active (approx)
export const DRILL_SPAWN_CHECK_INTERVAL = 1.0; // Check for spawn every 1 second (was 60 frames)
export const DRILL_INITIAL_Z_OFFSET = 50; // Adjusted: was -250 (too far), originally -100 (problematic)
export const DRILL_APPROACH_SPEED = 0.25; // Slightly increased from 0.2
export const DRILL_CHASE_SPEED_PLAYER_RELATIVE = 0.01;
export const DRILL_MAX_SPEED = 0.5;
export const DRILL_MAX_CHASE_DISTANCE = 12; // Renamed from DRILL_TARGET_CHASE_DISTANCE - How close it initially tries to stay
export const DRILL_MIN_CHASE_DISTANCE = 2.5; // The closest it will try to get
export const DRILL_CHASE_DISTANCE_SHRINK_RATE_PER_SECOND = 0.3; // Units per second the chase distance decreases
export const DRILL_DANGER_DISTANCE = 2.0;
export const DRILL_DEFLECTION_DURATION = 3.0; // 3 seconds (was 180 frames)
export const DRILL_RETREAT_SPEED = 0.4;
export const DRILL_X_ALIGN_SPEED = 0.07; // How quickly it aligns with player's lane

// --- Pedestrian Constants ---
export const PEDESTRIAN_HEIGHT = 1.7;
export const PEDESTRIAN_WIDTH = 0.4;
export const PEDESTRIAN_DEPTH = 0.3;
export const PEDESTRIAN_HEAD_RADIUS = 0.12;
export const PEDESTRIAN_COLORS = [
    0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xdda0dd, 0x98d8c8
];
export const PEDESTRIAN_WALK_SPEED_MIN = 0.02;
export const PEDESTRIAN_WALK_SPEED_MAX = 0.05;
export const PEDESTRIAN_SPAWN_INTERVAL = 2.0; // 2 seconds between spawn attempts (was 120 frames)
export const PEDESTRIAN_SPAWN_CHANCE = 0.4; // Probability of spawning when interval is met
export const PEDESTRIAN_SIDEWALK_WIDTH = 2.0;
export const PEDESTRIAN_SIDEWALK_OFFSET_FROM_ROAD = 1.5; // Distance from road edge to sidewalk center
export const MAX_ACTIVE_PEDESTRIANS = 25;
export const PEDESTRIAN_RECYCLE_EXTRA_OFFSET = 15;
export const PEDESTRIAN_ARM_SWING_AMPLITUDE = 0.3;
export const PEDESTRIAN_LEG_SWING_AMPLITUDE = 0.2;
export const PEDESTRIAN_ANIMATION_SPEED = 0.1;

// --- Car Constants ---
// ... existing code ... 

// --- Music Sync Constants ---
export const MUSIC_BEAT_THRESHOLD = 125; // Must be higher than lowerFreqAvg during non-beat parts
export const MUSIC_BEAT_SENSITIVITY = 120; // Range for beat detection normalization
export const MUSIC_SMOOTHING_FACTOR = 0.2; // How quickly objects respond to beat changes
export const MUSIC_LOWER_BAND_RATIO = 0.2; // Ratio of frequency data to use for beat detection
export const MUSIC_FFT_SIZE = 64; // FFT size for audio analysis
export const MUSIC_VOLUME = 0.5; // Default music volume
export const MUSIC_FALLBACK_BEAT_FREQUENCY = 2; // Fallback beat frequency when no analyser

// Beat response multipliers
export const OBSTACLE_BEAT_JUMP_FACTOR = 0.7; // How much obstacles jump on beats
export const BUILDING_BEAT_JUMP_FACTOR = 0.05; // How much buildings move on beats
export const PEDESTRIAN_BEAT_SPEED_MULTIPLIER = 0.8; // How much faster pedestrians animate on beats
export const PEDESTRIAN_BEAT_AMPLITUDE_MULTIPLIER = 0.4; // How much more pedestrians swing on beats
export const OBSTACLE_FALLBACK_AMPLITUDE_FACTOR = 0.3; // Fallback animation amplitude when no beat sync

// --- Perfection Mechanism Constants ---
export const PERFECTION_PHASE_1_THRESHOLD = 5; // Collectables needed for phase 1
export const PERFECTION_PHASE_2_THRESHOLD = 12; // Collectables needed for phase 2
export const PERFECTION_PHASE_3_THRESHOLD = 20; // Collectables needed for phase 3
export const PERFECTION_PHASE_1_SPEED_MULTIPLIER = 1.2; // 20% faster
export const PERFECTION_PHASE_2_SPEED_MULTIPLIER = 1.4; // 40% faster
export const PERFECTION_PHASE_3_SPEED_MULTIPLIER = 1.6; // 60% faster
export const PERFECTION_PHASE_1_COLOR = 0x00ffaa; // Cyan-green
export const PERFECTION_PHASE_2_COLOR = 0xff6600; // Orange
export const PERFECTION_PHASE_3_COLOR = 0xff00ff; // Magenta
export const PERFECTION_DECAY_RATE = 2; // How many collectables to lose when missing one
export const PERFECTION_ROAD_EMISSIVE_INTENSITY = 0.8; // Road glow intensity during perfection
export const PERFECTION_TRANSITION_DURATION = 0.5; // 0.5 seconds for smooth color transitions (was 30 frames)

// Wind effect constants
export const WIND_PARTICLE_COUNT = 15; // Number of wind particles active at once
export const WIND_PARTICLE_SPEED_MIN = 0.3;
export const WIND_PARTICLE_SPEED_MAX = 0.6;
export const WIND_PARTICLE_LIFE = 1.33; // 1.33 seconds (was 80 frames)
export const WIND_PARTICLE_SIZE = 0.15;
export const WIND_PARTICLE_SPAWN_RATE = 0.15; // Spawn every 0.15 seconds (was 0.05 - too frequent!)
export const WIND_PARTICLE_SPREAD = 8; // How wide the wind effect spreads around car

// Perfection burst effect constants
export const PERFECTION_BURST_PARTICLE_COUNT = 25; // Number of burst particles
export const PERFECTION_BURST_SPEED_MIN = 0.2;
export const PERFECTION_BURST_SPEED_MAX = 0.5;
export const PERFECTION_BURST_LIFE = 1.0; // 1 second (was 60 frames)
export const PERFECTION_BURST_SIZE = 0.25;
export const PERFECTION_BURST_SPREAD = 6; // How wide the burst spreads
export const PERFECTION_BURST_TRIGGER_INTERVAL = 1.5; // 1.5 seconds between bursts (was 90 frames)

// Enhanced trail constants for perfection
export const PERFECTION_TRAIL_SIZE_MULTIPLIER = 2.5; // How much bigger trail gets
export const PERFECTION_TRAIL_OPACITY_MULTIPLIER = 1.5; // How much brighter trail gets
export const PERFECTION_TRAIL_SPAWN_RATE_MULTIPLIER = 0.5; // Spawn more frequently (lower = more frequent)

// Spawn conflict detection constants
export const MIN_SPAWN_DISTANCE = 8; // Minimum distance between obstacles and collectables
export const SPAWN_RETRY_ATTEMPTS = 5; // How many times to retry finding a clear spawn position
export const SPAWN_CONFLICT_CHECK_RADIUS = 2; // Radius to check for conflicts around spawn position

// --- Magnet Powerup Constants ---
export const MAGNET_DURATION = 8.0; // 8 seconds of magnet effect
export const MAGNET_RANGE = 12; // Distance at which magnet attracts collectibles
export const MAGNET_ATTRACTION_SPEED = 0.3; // Speed at which collectibles move toward car
export const MAGNET_SIZE = 0.6; // Size of magnet collectible (larger than regular)
export const MAGNET_COLOR = 0xff3333; // Red color for magnet
export const MAGNET_EMISSIVE_COLOR = 0xff6666; // Red emissive glow
export const MAGNET_EMISSIVE_INTENSITY = 1.2; // Bright glow
export const MAGNET_SPAWN_CHANCE = 0.05; // 5% chance to spawn magnet instead of regular collectable
export const MAGNET_ROTATION_SPEED = 0.08; // DEPRECATED - use MAGNET_ROTATION_SPEED_PER_SECOND instead

// --- Headlight Constants ---
export const HEADLIGHT_COLOR = 0xffffe0; // Slightly yellowish white
export const HEADLIGHT_INTENSITY = 50;
export const HEADLIGHT_DISTANCE = 75; // How far the light reaches (reduced from 75)
export const HEADLIGHT_ANGLE = Math.PI / 7; // Beam angle (reduced from PI/7 for narrower beam)
export const HEADLIGHT_PENUMBRA = 0.75; // Softness of the spotlight edge
export const HEADLIGHT_DECAY = 1.8;
export const HEADLIGHT_POS_X_OFFSET = 0.6; // X offset from car center (reduced from 0.6)
export const HEADLIGHT_POS_Y = 0.35 * CAR_SCALE; // Y position on the car
export const HEADLIGHT_POS_Z = -1.3 * CAR_SCALE; // Z position on the car (front)
export const HEADLIGHT_TARGET_Y_OFFSET = 0.25 * CAR_SCALE; // Target Y offset, slightly lower than headlight
export const HEADLIGHT_TARGET_Z_OFFSET = -20 * CAR_SCALE; // How far ahead the target is (reduced from -20)

// --- Animation Constants (deltaTime-based) ---
export const COLLECTABLE_ROTATION_SPEED = 1.2; // radians per second
export const MAGNET_ROTATION_SPEED_PER_SECOND = 4.8; // radians per second (was 0.08 per frame)
export const DRILL_BIT_ROTATION_SPEED = 30.0; // radians per second (was 0.5 per frame)

// --- Performance Constants for Mobile ---
export const PERFORMANCE_DELTA_THRESHOLD = 1/50; // If deltaTime > 20ms, we're likely on a slow device
export const MOBILE_TRAIL_SPAWN_INTERVAL_MULTIPLIER = 2.0; // Reduce trail frequency on mobile
export const MOBILE_WIND_SPAWN_INTERVAL_MULTIPLIER = 2.0; // Reduce wind particle frequency on mobile
export const MOBILE_MAX_PARTICLES_REDUCTION_FACTOR = 0.7; // Reduce max particles by 30% on mobile

// ... existing code ... 
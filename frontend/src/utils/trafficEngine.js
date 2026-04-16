/**
 * trafficEngine.js
 * 
 * Provides consistent traffic simulation logic for both the UI display and the map polyline.
 */

// Time-based base multiplier for a city like Hyderabad
export const getTimeMultiplier = () => {
    const hour = new Date().getHours();
    
    if (hour >= 8 && hour <= 11) return 2.4; // Morning Rush
    if (hour >= 17 && hour <= 21) return 3.1; // Evening Rush (Severe)
    if (hour >= 13 && hour <= 16) return 1.6; // Afternoon Moderate
    if (hour >= 22 || hour <= 6) return 0.75; // Night/Early Morning (Fast)
    return 1.25; // Normal day traffic
};

// Generates segments with associated traffic levels based on coordinates (deterministic)
export const getRouteSegments = (positions) => {
    if (!positions || positions.length < 2) return [];

    const segments = [];
    let currentIndex = 0;

    while (currentIndex < positions.length - 1) {
        const latRaw = positions[currentIndex][0];
        const lngRaw = positions[currentIndex][1];
        
        // Deterministic 'random' seeds based on location
        const seed1 = Math.abs(Math.floor(latRaw * 12345)) % 100;
        const seed2 = Math.abs(Math.floor(lngRaw * 54321)) % 100;
        
        const chunkSize = 10 + (seed1 % 30); 
        const endIndex = Math.min(currentIndex + chunkSize, positions.length - 1);
        
        const segmentPositions = positions.slice(currentIndex, endIndex + 1);
        
        let type; // 'clear', 'moderate', 'heavy', 'severe'
        let color;
        let multiplier;

        if (seed2 < 55) {
            type = 'Clear';
            color = '#3b82f6';
            multiplier = 1.0;
        } else if (seed2 < 80) {
            type = 'Moderate';
            color = '#eab308';
            multiplier = 1.8;
        } else if (seed2 < 92) {
            type = 'Heavy';
            color = '#ea580c';
            multiplier = 3.2;
        } else {
            type = 'Severe';
            color = '#ef4444';
            multiplier = 5.5;
        }

        segments.push({
            positions: segmentPositions,
            type,
            color,
            multiplier,
            pointCount: segmentPositions.length
        });

        currentIndex = endIndex;
    }
    return segments;
};

// Calculates traffic-adjusted duration
export const getAdjustedStats = (baseDurationMins, baseDistanceKm, segments) => {
    const timeMultiplier = getTimeMultiplier();
    
    // Average out the segment multipliers
    const totalPoints = segments.reduce((acc, s) => acc + s.pointCount, 0);
    const weightedMultiplier = segments.reduce((acc, s) => acc + (s.multiplier * s.pointCount), 0) / (totalPoints || 1);
    
    // Final duration = base * time-of-day-factor * route-congestion-factor
    const adjustedDuration = baseDurationMins * timeMultiplier * (0.7 + (weightedMultiplier * 0.3));
    
    // OSRM distance is usually accurate, but we can slightly adjust it if we want to simulate 'traffic detours'
    // but usually distance is fixed for a given path.
    const adjustedDistance = baseDistanceKm;

    // Determine overall traffic level
    let trafficLevel = "Low";
    const finalFactor = (adjustedDuration / baseDurationMins);
    if (finalFactor > 3.5) trafficLevel = "Severe";
    else if (finalFactor > 2.2) trafficLevel = "Heavy";
    else if (finalFactor > 1.3) trafficLevel = "Moderate";

    return {
        duration: adjustedDuration,
        distance: adjustedDistance,
        trafficLevel,
        factor: finalFactor
    };
};

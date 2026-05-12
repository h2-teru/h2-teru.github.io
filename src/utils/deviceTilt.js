let cachedTiltPermission = 'unknown';
let pendingTiltPermissionRequest = null;
const clampTilt = (value) => Math.max(-0.5, Math.min(0.5, value));
function hasActiveUserGesture() {
    if (typeof navigator === 'undefined' || !('userActivation' in navigator)) {
        return true;
    }
    return navigator.userActivation.isActive;
}
export function getDeviceTiltSupport() {
    const orientationSupported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    const motionSupported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
    return {
        supported: orientationSupported || motionSupported,
        orientationSupported,
        motionSupported,
    };
}
export function getCachedTiltPermission() {
    return cachedTiltPermission;
}
export async function requestDeviceTiltPermission() {
    const { supported, orientationSupported, motionSupported } = getDeviceTiltSupport();
    if (!supported) {
        cachedTiltPermission = 'denied';
        return cachedTiltPermission;
    }
    if (cachedTiltPermission === 'granted') {
        return cachedTiltPermission;
    }
    if (pendingTiltPermissionRequest)
        return pendingTiltPermissionRequest;
    const permissionRequests = [];
    if (motionSupported) {
        const motionEvent = window.DeviceMotionEvent;
        if (typeof motionEvent.requestPermission === 'function') {
            permissionRequests.push(() => motionEvent.requestPermission());
        }
    }
    if (orientationSupported) {
        const orientationEvent = window.DeviceOrientationEvent;
        if (typeof orientationEvent.requestPermission === 'function') {
            permissionRequests.push(() => orientationEvent.requestPermission());
        }
    }
    if (permissionRequests.length === 0) {
        cachedTiltPermission = 'granted';
        return cachedTiltPermission;
    }
    if (!hasActiveUserGesture()) {
        return cachedTiltPermission;
    }
    cachedTiltPermission = 'requested';
    pendingTiltPermissionRequest = (async () => {
        const permissionResults = permissionRequests.map((requestPermission) => {
            try {
                return requestPermission();
            }
            catch {
                return Promise.resolve('denied');
            }
        });
        const results = await Promise.all(permissionResults);
        cachedTiltPermission = results.some((result) => result === 'granted') ? 'granted' : 'denied';
        pendingTiltPermissionRequest = null;
        return cachedTiltPermission;
    })();
    return pendingTiltPermissionRequest;
}
export function mapOrientationToTilt(beta, gamma, baseline) {
    const deltaBeta = beta - baseline.beta;
    const deltaGamma = gamma - baseline.gamma;
    const verticalDelta = -deltaBeta;
    return {
        nextTilt: {
            x: clampTilt(deltaGamma / 18),
            y: clampTilt(verticalDelta / 16),
        },
        raw: {
            source: 'orientation',
            beta,
            gamma,
            motionX: null,
            motionY: null,
            motionZ: null,
            deltaBeta: verticalDelta,
            deltaGamma,
        },
    };
}
export function mapMotionToTilt(gx, gy, gz, baseline) {
    const deltaX = gx - baseline.x;
    const deltaY = gy - baseline.y;
    const deltaZ = gz - baseline.z;
    const verticalDelta = -deltaZ + deltaY * 0.22;
    return {
        nextTilt: {
            x: clampTilt(deltaX / 5.6),
            y: clampTilt(verticalDelta / 5.2),
        },
        raw: {
            source: 'motion',
            beta: null,
            gamma: null,
            motionX: gx,
            motionY: gy,
            motionZ: gz,
            deltaBeta: verticalDelta,
            deltaGamma: deltaX,
        },
    };
}

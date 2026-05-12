export type TiltPermissionStatus = 'unknown' | 'requested' | 'granted' | 'denied';
export type TiltSensorSource = 'none' | 'orientation' | 'motion';

export type TiltVector = {
  x: number;
  y: number;
};

export type TiltRawReading = {
  source: TiltSensorSource;
  beta: number | null;
  gamma: number | null;
  motionX: number | null;
  motionY: number | null;
  motionZ: number | null;
  deltaBeta: number;
  deltaGamma: number;
};

export type DeviceTiltSupport = {
  supported: boolean;
  orientationSupported: boolean;
  motionSupported: boolean;
};

type DeviceOrientationEventConstructorWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

type DeviceMotionEventConstructorWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

let cachedTiltPermission: TiltPermissionStatus = 'unknown';

const clampTilt = (value: number) => Math.max(-0.5, Math.min(0.5, value));

export function getDeviceTiltSupport(): DeviceTiltSupport {
  const orientationSupported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  const motionSupported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
  return {
    supported: orientationSupported || motionSupported,
    orientationSupported,
    motionSupported,
  };
}

export function getCachedTiltPermission(): TiltPermissionStatus {
  return cachedTiltPermission;
}

export async function requestDeviceTiltPermission(): Promise<TiltPermissionStatus> {
  const { supported, orientationSupported, motionSupported } = getDeviceTiltSupport();
  if (!supported) {
    cachedTiltPermission = 'denied';
    return cachedTiltPermission;
  }
  if (cachedTiltPermission === 'granted' || cachedTiltPermission === 'requested') {
    return cachedTiltPermission;
  }

  let permissionRequest: Promise<PermissionState> | null = null;
  if (motionSupported) {
    const motionEvent = window.DeviceMotionEvent as DeviceMotionEventConstructorWithPermission;
    if (typeof motionEvent.requestPermission === 'function') {
      try {
        permissionRequest = motionEvent.requestPermission();
      } catch {
        permissionRequest = Promise.resolve('denied');
      }
    }
  }
  if (!permissionRequest && orientationSupported) {
    const orientationEvent = window.DeviceOrientationEvent as DeviceOrientationEventConstructorWithPermission;
    if (typeof orientationEvent.requestPermission === 'function') {
      try {
        permissionRequest = orientationEvent.requestPermission();
      } catch {
        permissionRequest = Promise.resolve('denied');
      }
    }
  }

  if (!permissionRequest) {
    cachedTiltPermission = 'granted';
    return cachedTiltPermission;
  }

  cachedTiltPermission = 'requested';
  try {
    cachedTiltPermission = (await permissionRequest) === 'granted' ? 'granted' : 'denied';
  } catch {
    cachedTiltPermission = 'denied';
  }
  return cachedTiltPermission;
}

export function mapOrientationToTilt(
  beta: number,
  gamma: number,
  baseline: { beta: number; gamma: number },
): { nextTilt: TiltVector; raw: TiltRawReading } {
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

export function mapMotionToTilt(
  gx: number,
  gy: number,
  gz: number,
  baseline: { x: number; y: number; z: number },
): { nextTilt: TiltVector; raw: TiltRawReading } {
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

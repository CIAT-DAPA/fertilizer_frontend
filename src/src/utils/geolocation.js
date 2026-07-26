import { isWithinEthiopia } from './fertilizerLayerUtils';

export { isWithinEthiopia };

export function isGeolocationSupported() {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/**
 * @returns {'granted'|'prompt'|'denied'|'unsupported'|'unknown'}
 */
export async function queryGeolocationPermission() {
    if (!isGeolocationSupported()) return 'unsupported';
    if (!navigator.permissions?.query) return 'unknown';
    try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
    } catch {
        return 'unknown';
    }
}

export function formatFarmCoordinates(lat, lon) {
    const latNum = typeof lat === 'number' ? lat : parseFloat(lat);
    const lonNum = typeof lon === 'number' ? lon : parseFloat(lon);
    const latStr = latNum.toFixed(3);
    const lonStr = lonNum.toFixed(3);
    return { lat: latStr, lon: lonStr, coordString: `${latStr},${lonStr}` };
}

/**
 * @param {GeolocationPositionError['code']|string} code
 */
export function geolocationErrorMessage(code) {
    switch (code) {
        case 'PERMISSION_DENIED':
        case 1:
            return 'Location access was blocked. Allow GPS in your browser settings, or pick your field on the map.';
        case 'POSITION_UNAVAILABLE':
        case 2:
            return 'Could not detect your position. Move outdoors with a clear sky view, or pick your field on the map.';
        case 'TIMEOUT':
        case 3:
            return 'Finding your location took too long. Try again outdoors or use the map to select your field.';
        case 'UNSUPPORTED':
            return 'Your browser does not support GPS. Use the map or type coordinates (latitude, longitude).';
        default:
            return 'Could not use GPS right now. Use the map or type coordinates (latitude, longitude).';
    }
}

/**
 * @returns {Promise<{ latitude: number, longitude: number, accuracy: number }>}
 */
export function requestCurrentPosition(options = {}) {
    const {
        enableHighAccuracy = true,
        timeout = 20000,
        maximumAge = 60000,
    } = options;

    return new Promise((resolve, reject) => {
        if (!isGeolocationSupported()) {
            reject({ code: 'UNSUPPORTED', message: geolocationErrorMessage('UNSUPPORTED') });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (err) => {
                const code =
                    err.code === 1
                        ? 'PERMISSION_DENIED'
                        : err.code === 2
                          ? 'POSITION_UNAVAILABLE'
                          : err.code === 3
                            ? 'TIMEOUT'
                            : 'UNKNOWN';
                reject({ code, message: geolocationErrorMessage(code) });
            },
            { enableHighAccuracy, timeout, maximumAge }
        );
    });
}

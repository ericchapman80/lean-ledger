const IOS_PERMISSION_STEPS = [
  'Open iPhone Settings.',
  'Go to Safari or Chrome.',
  'Tap Camera.',
  'Choose Ask or Allow.',
  'Return to the app and tap Retry Camera.',
  'If needed: Settings > Privacy & Security > Camera, then enable browser access.',
];

export const NATIVE_BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'];

export function getPreferredCameraConstraints() {
  return {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  };
}

export function getBarcodeSupportDetails({
  hasBarcodeDetector = false,
  hasFallbackScanner = false,
} = {}) {
  if (hasBarcodeDetector) {
    return {
      mode: 'native',
      code: 'native_supported',
      title: 'Native scanner ready',
      message: 'Using the browser barcode scanner for live detection.',
    };
  }

  if (hasFallbackScanner) {
    return {
      mode: 'fallback',
      code: 'native_unsupported_fallback_available',
      title: 'Using compatibility scanner',
      message: 'This browser does not support the native barcode API. A compatibility scanner will be used instead.',
      steps: [
        'Allow camera access when prompted.',
        'Use the rear camera and keep the barcode inside the viewfinder.',
        'If scanning still fails, enter the barcode manually or search for the food.',
      ],
    };
  }

  return {
    mode: 'manual_only',
    code: 'scanner_unavailable',
    title: 'Barcode scanning unavailable',
    message: 'Live barcode scanning is not supported here. Enter the barcode manually or use Search Food instead.',
    steps: [
      'Try Safari or Chrome in a normal browsing tab.',
      'If camera access is unreliable, use Enter Barcode Manually or Search Food.',
    ],
  };
}

export function getCameraEnvironmentDetails({
  isSecureContext = true,
  hasMediaDevices = true,
  hasGetUserMedia = true,
} = {}) {
  if (!isSecureContext) {
    return {
      code: 'insecure_context',
      title: 'Secure connection required',
      message: 'Camera scanning requires HTTPS on mobile browsers. Local network URLs like http://192.168.x.x:3000 may block camera access. Use a Vercel preview URL or a secure tunnel like ngrok/Cloudflare Tunnel.',
      steps: [
        'Open the app over HTTPS, not a local network HTTP URL.',
        'Deploy to Vercel or use a secure tunnel like ngrok or Cloudflare Tunnel.',
        'Then return here and tap Retry Camera.',
      ],
      canRetry: true,
    };
  }

  if (!hasMediaDevices || !hasGetUserMedia) {
    return {
      code: 'unsupported_browser_context',
      title: 'Camera scanning is unavailable here',
      message: 'This browser context does not support live camera scanning.',
      steps: [
        'Try Safari or Chrome in a normal browsing tab.',
        'Avoid private or incognito mode if camera access keeps failing.',
        'If it still fails, use Search Food, Add Food Manually, or enter the barcode manually.',
      ],
      canRetry: true,
    };
  }

  return null;
}

export function getCameraErrorDetails(error) {
  const name = error?.name || '';

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return {
        code: 'permission_denied',
        title: 'Camera permission is off',
        message: 'Camera access is blocked for this browser.',
        steps: [
          ...IOS_PERMISSION_STEPS,
          'If you are using a local network HTTP URL, switch to HTTPS first.',
          'If you are in private or incognito mode, try a normal browser tab.',
        ],
        canRetry: true,
      };
    case 'NotFoundError':
      return {
        code: 'camera_missing',
        title: 'No camera found',
        message: 'This device does not appear to have an available camera.',
        steps: [
          'Try a different device with a camera.',
          'Use Search Food or Add Food Manually instead.',
        ],
        canRetry: true,
      };
    case 'NotReadableError':
      return {
        code: 'camera_busy',
        title: 'Camera is busy',
        message: 'The camera is being used by another app or browser tab.',
        steps: [
          'Close other apps or tabs that may be using the camera.',
          'Return here and tap Retry Camera.',
        ],
        canRetry: true,
      };
    case 'OverconstrainedError':
      return {
        code: 'camera_constraints',
        title: 'Camera could not start with this setup',
        message: 'This browser could not satisfy the requested camera settings.',
        steps: [
          'Try Retry Camera.',
          'If it still fails, use Search Food, Add Food Manually, or enter the barcode manually.',
        ],
        canRetry: true,
      };
    default:
      return {
        code: 'camera_unknown',
        title: 'Camera unavailable',
        message: 'The camera could not be started right now.',
        steps: [
          'Try Retry Camera.',
          'If it still fails, use Search Food, Add Food Manually, or enter the barcode manually.',
        ],
        canRetry: true,
      };
  }
}

export function getScannerFailureDetails(error) {
  const code = error?.code || error?.name || '';

  switch (code) {
    case 'native_unsupported_fallback_available':
      return {
        code,
        title: 'Using compatibility scanner',
        message: 'The native barcode detector is unavailable here, so the app switched to the compatibility scanner.',
        steps: [
          'Keep the barcode centered in the frame.',
          'Use Stop Scanner if the preview looks frozen, then retry.',
          'If scanning still fails, use Enter Barcode Manually or Search Food.',
        ],
        canRetry: true,
      };
    case 'scanner_unavailable':
      return {
        code,
        title: 'Scanner unavailable',
        message: 'This browser cannot run the barcode scanner.',
        steps: [
          'Try Safari or Chrome in a normal browsing tab.',
          'If that does not work, enter the barcode manually or search for the food.',
        ],
        canRetry: false,
      };
    default:
      return {
        code: 'scanner_failed',
        title: 'Scanner failed',
        message: 'Live barcode scanning could not detect a code right now. You can retry, enter the barcode manually, or search for the food.',
        steps: [
          'Improve lighting and keep the barcode flat and centered.',
          'Use the rear camera and move a little closer.',
          'If it still fails, use Enter Barcode Manually or Search Food.',
        ],
        canRetry: true,
      };
  }
}

export async function loadZxingBrowser() {
  return import('@zxing/browser');
}

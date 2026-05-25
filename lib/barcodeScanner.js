const IOS_PERMISSION_STEPS = [
  'Open iPhone Settings.',
  'Go to Safari or Chrome.',
  'Tap Camera.',
  'Choose Ask or Allow.',
  'Return to the app and tap Retry Camera.',
  'If needed: Settings > Privacy & Security > Camera, then enable browser access.',
];

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

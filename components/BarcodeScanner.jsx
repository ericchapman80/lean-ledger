import { useEffect, useRef, useState } from 'react';
import {
  getBarcodeSupportDetails,
  getCameraEnvironmentDetails,
  getCameraErrorDetails,
  getPreferredCameraConstraints,
  getScannerFailureDetails,
  loadZxingBrowser,
  NATIVE_BARCODE_FORMATS,
} from '@/lib/barcodeScanner';

const NATIVE_SCAN_INTERVAL_MS = 500;

export default function BarcodeScanner({ onScanSuccess, onClose, onSearchFood, onAddManual }) {
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [cameraHelp, setCameraHelp] = useState(null);
  const [manualEntry, setManualEntry] = useState('');
  const [scannerMode, setScannerMode] = useState('idle');
  const [scannerStatus, setScannerStatus] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const nativeDetectorRef = useRef(null);
  const nativeIntervalRef = useRef(null);
  const zxingControlsRef = useRef(null);
  const zxingReaderRef = useRef(null);
  const closingRef = useRef(false);
  const insecureContext = typeof window !== 'undefined' ? !window.isSecureContext : false;

  const clearNativeLoop = () => {
    if (nativeIntervalRef.current) {
      window.clearInterval(nativeIntervalRef.current);
      nativeIntervalRef.current = null;
    }
  };

  const clearFallbackLoop = () => {
    zxingControlsRef.current?.stop?.();
    zxingControlsRef.current = null;
    zxingReaderRef.current = null;
  };

  const stopCamera = () => {
    clearNativeLoop();
    clearFallbackLoop();
    if (videoRef.current) {
      videoRef.current.pause?.();
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setReady(false);
    setStarting(false);
    setScannerMode('idle');
  };

  const finishWithCode = (rawValue) => {
    if (!rawValue || closingRef.current) return;
    closingRef.current = true;
    stopCamera();
    onScanSuccess(rawValue);
  };

  useEffect(() => {
    closingRef.current = false;
    const handlePageHide = () => stopCamera();
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const attachStream = async () => {
      if (!scanning || !videoRef.current || !streamRef.current) return;

      try {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.muted = true;
        await videoRef.current.play();
        setCameraHelp(null);
        setReady(true);
      } catch (err) {
        console.error('Video preview error:', err);
        setError('Camera started, but the preview could not be displayed. Try again or enter the barcode manually.');
      }
    };

    attachStream();
  }, [scanning]);

  useEffect(() => {
    const startNativeScanner = async () => {
      if (!ready || scannerMode !== 'native' || !videoRef.current || nativeIntervalRef.current) return;

      try {
        if (!nativeDetectorRef.current) {
          nativeDetectorRef.current = new window.BarcodeDetector({ formats: NATIVE_BARCODE_FORMATS });
        }
      } catch (err) {
        console.error('Native detector setup failed:', err);
        const details = getScannerFailureDetails({ code: 'native_unsupported_fallback_available' });
        setCameraHelp(details);
        setError(details.message);
        setScannerMode('fallback');
        return;
      }

      nativeIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || closingRef.current) return;

        try {
          const detections = await nativeDetectorRef.current.detect(videoRef.current);
          if (detections.length > 0) {
            finishWithCode(detections[0].rawValue);
          }
        } catch (err) {
          console.error('Native barcode scan failed:', err);
        }
      }, NATIVE_SCAN_INTERVAL_MS);
    };

    startNativeScanner();

    return () => clearNativeLoop();
  }, [ready, scannerMode]);

  useEffect(() => {
    const startFallbackScanner = async () => {
      if (!ready || scannerMode !== 'fallback' || !videoRef.current || zxingControlsRef.current) return;

      try {
        const {
          BarcodeFormat,
          BrowserMultiFormatReader,
        } = await loadZxingBrowser();

        const reader = new BrowserMultiFormatReader();
        reader.possibleFormats = [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
        ];
        zxingReaderRef.current = reader;
        zxingControlsRef.current = await reader.decodeFromStream(
          streamRef.current,
          videoRef.current,
          (result, scanError) => {
            if (result?.getText?.()) {
              finishWithCode(result.getText());
              return;
            }

            if (!scanError || scanError?.name === 'NotFoundException') {
              return;
            }

            console.error('ZXing scan error:', scanError);
            const details = getScannerFailureDetails(scanError);
            setCameraHelp(details);
            setError(details.message);
          }
        );
      } catch (err) {
        console.error('Fallback scanner failed to start:', err);
        const details = getScannerFailureDetails({ code: 'scanner_unavailable' });
        setCameraHelp(details);
        setError(details.message);
        setScannerMode('manual_only');
      }
    };

    startFallbackScanner();

    return () => clearFallbackLoop();
  }, [ready, scannerMode]);

  const startCamera = async () => {
    try {
      setStarting(true);
      setError(null);
      setCameraHelp(null);
      setScannerStatus(null);
      closingRef.current = false;
      stopCamera();

      const environmentDetails = getCameraEnvironmentDetails({
        isSecureContext: window.isSecureContext,
        hasMediaDevices: Boolean(navigator.mediaDevices),
        hasGetUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
      });

      if (environmentDetails) {
        setCameraHelp(environmentDetails);
        setError(environmentDetails.message);
        return;
      }

      const support = getBarcodeSupportDetails({
        hasBarcodeDetector: typeof window !== 'undefined' && 'BarcodeDetector' in window,
        hasFallbackScanner: true,
      });
      setScannerMode(support.mode);
      setScannerStatus(support);

      if (support.mode === 'manual_only') {
        setCameraHelp(support);
        setError(support.message);
        return;
      }

      if (support.mode === 'fallback') {
        setCameraHelp(support);
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(getPreferredCameraConstraints());
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setScanning(true);
    } catch (err) {
      const details = getCameraErrorDetails(err);
      setCameraHelp(details);
      setError(details.message);
      console.error('Camera error:', err);
    } finally {
      setStarting(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualEntry.trim()) {
      stopCamera();
      onScanSuccess(manualEntry.trim());
    }
  };

  const handleSearchFood = () => {
    stopCamera();
    onSearchFood?.();
  };

  const handleAddManual = () => {
    stopCamera();
    onAddManual?.();
  };

  const handleOpenSettings = () => {
    try {
      window.location.href = 'app-settings:';
    } catch {
      // Best effort only; fallback instructions remain visible.
    }
  };

  return (
    <div className="barcode-scanner">
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '12px' }}>Scan Product Barcode</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Scan the barcode to automatically lookup nutritional information
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
          Best results: use the rear camera, keep the barcode flat, and center it inside the frame.
        </p>
        {insecureContext ? (
          <p style={{ color: 'var(--danger-color)', fontSize: '13px', marginTop: '8px' }}>
            Camera scanning requires HTTPS on mobile browsers.
          </p>
        ) : null}
      </div>

      {error ? (
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--danger-surface)',
          borderLeft: '4px solid var(--danger-color)',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      ) : null}

      {cameraHelp ? (
        <div style={{
          padding: '14px',
          backgroundColor: 'var(--warning-surface)',
          border: '1px solid var(--warning-color)',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700 }}>{cameraHelp.title}</p>
          <div style={{ display: 'grid', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {cameraHelp.steps?.map((step) => (
              <p key={step} style={{ margin: 0 }}>{step}</p>
            ))}
            {cameraHelp.code === 'permission_denied' ? (
              <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
                “Try Open Settings” is best-effort only and may not work on every iPhone browser.
              </p>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {cameraHelp.canRetry ? (
              <button onClick={startCamera} className="btn btn-primary" type="button" disabled={starting}>
                {starting ? 'Retrying...' : 'Retry Camera'}
              </button>
            ) : null}
            {cameraHelp.code === 'permission_denied' ? (
              <button onClick={handleOpenSettings} className="btn btn-outline" type="button">
                Try Open Settings
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!scanning ? (
        <div>
          <button
            onClick={startCamera}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '16px' }}
            disabled={starting}
          >
            {starting ? 'Starting Camera...' : 'Start Scanner'}
          </button>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {onSearchFood ? (
              <button type="button" onClick={handleSearchFood} className="btn btn-outline" style={{ flex: '1 1 160px' }}>
                Search Food
              </button>
            ) : null}
            {onAddManual ? (
              <button type="button" onClick={handleAddManual} className="btn btn-outline" style={{ flex: '1 1 160px' }}>
                Add Food Manually
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#000',
              marginBottom: '12px',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              onLoadedMetadata={() => setReady(true)}
              style={{
                width: '100%',
                maxHeight: '320px',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '18% 12%',
                border: '3px solid rgba(255,255,255,0.92)',
                borderRadius: '14px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.28)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '14%',
                right: '14%',
                top: '50%',
                height: '2px',
                background: 'rgba(46, 204, 113, 0.9)',
                boxShadow: '0 0 12px rgba(46, 204, 113, 0.75)',
                pointerEvents: 'none',
              }}
            />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '6px' }}>
            {ready ? 'Point the rear camera at the barcode. Scanning runs automatically.' : 'Starting camera preview...'}
          </p>
          {scannerStatus ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
              {scannerStatus.message}
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={stopCamera} className="btn btn-outline" type="button" style={{ flex: '1 1 150px' }}>
              Stop Scanner
            </button>
            <button onClick={handleClose} className="btn btn-outline" type="button" style={{ flex: '1 1 150px' }}>
              Cancel
            </button>
            {onSearchFood ? (
              <button onClick={handleSearchFood} className="btn btn-outline" type="button" style={{ flex: '1 1 150px' }}>
                Search Food
              </button>
            ) : null}
            {onAddManual ? (
              <button onClick={handleAddManual} className="btn btn-outline" type="button" style={{ flex: '1 1 150px' }}>
                Add Food Manually
              </button>
            ) : null}
          </div>
        </div>
      )}

      <div style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: '16px',
        marginTop: '16px',
      }}>
        <p style={{ marginBottom: '12px', fontWeight: '600' }}>
          Enter Barcode Manually
        </p>
        <form onSubmit={handleManualSubmit}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={manualEntry}
              onChange={(e) => setManualEntry(e.target.value)}
              className="form-input"
              placeholder="e.g., 012345678901"
              pattern="[0-9]*"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-secondary">
              Lookup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

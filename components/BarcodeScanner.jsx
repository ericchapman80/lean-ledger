import { useState, useRef, useEffect } from 'react';
import { getCameraEnvironmentDetails, getCameraErrorDetails } from '@/lib/barcodeScanner';

export default function BarcodeScanner({ onScanSuccess, onClose, onSearchFood, onAddManual }) {
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [cameraHelp, setCameraHelp] = useState(null);
  const [manualEntry, setManualEntry] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const insecureContext = typeof window !== 'undefined' ? !window.isSecureContext : false;

  const stopCamera = () => {
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
  };

  useEffect(() => {
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

  const startCamera = async () => {
    try {
      setStarting(true);
      setError(null);
      setCameraHelp(null);
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

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
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

  const handleOpenSettings = () => {
    try {
      window.location.href = 'app-settings:';
    } catch {
      // Best effort only; fallback instructions remain visible.
    }
  };

  const captureBarcode = async () => {
    if (!videoRef.current || !ready || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      setError('Camera preview is not ready yet. Wait a moment and try again.');
      return;
    }

    setError(null);
    const video = videoRef.current;

    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
        });

        const directDetections = await barcodeDetector.detect(video);
        if (directDetections.length > 0) {
          stopCamera();
          onScanSuccess(directDetections[0].rawValue);
          return;
        }
      } catch (err) {
        console.error('Direct video barcode detection failed:', err);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Convert to blob and use Barcode Detection API if available
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
        });
        const barcodes = await barcodeDetector.detect(canvas);
        
        if (barcodes.length > 0) {
          stopCamera();
          onScanSuccess(barcodes[0].rawValue);
        } else {
          setError('No barcode detected. Move closer, improve lighting, keep the barcode flat and centered, then try again.');
        }
      } catch (err) {
        setError('Barcode detection failed. Please enter manually.');
      }
    } else {
      setError('Barcode scanning not supported on this device. Please enter manually.');
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
          Best results: use bright light, hold the barcode flat, and fill the center of the frame.
        </p>
        {insecureContext ? (
          <p style={{ color: 'var(--danger-color)', fontSize: '13px', marginTop: '8px' }}>
            Camera scanning requires HTTPS on mobile browsers.
          </p>
        ) : null}
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ffebee',
          borderLeft: '4px solid var(--danger-color)',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {cameraHelp && (
        <div style={{
          padding: '14px',
          backgroundColor: '#fff8e1',
          border: '1px solid #f2d38a',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700 }}>{cameraHelp.title}</p>
          <div style={{ display: 'grid', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {cameraHelp.steps.map((step) => (
              <p key={step} style={{ margin: 0 }}>{step}</p>
            ))}
            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
              “Try Open Settings” is best-effort only and may not work on every iPhone browser.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {cameraHelp.canRetry ? (
              <button onClick={startCamera} className="btn btn-primary" type="button" disabled={starting}>
                {starting ? 'Retrying...' : 'Retry Camera'}
              </button>
            ) : null}
            <button onClick={handleOpenSettings} className="btn btn-outline" type="button">
              Try Open Settings
            </button>
          </div>
        </div>
      )}

      {!scanning ? (
        <div>
          <button
            onClick={startCamera}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '16px' }}
            disabled={starting}
          >
            {starting ? 'Starting Camera...' : '📷 Start Camera Scanner'}
          </button>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {onSearchFood ? (
              <button type="button" onClick={onSearchFood} className="btn btn-outline" style={{ flex: '1 1 160px' }}>
                Search Food
              </button>
            ) : null}
            {onAddManual ? (
              <button type="button" onClick={onAddManual} className="btn btn-outline" style={{ flex: '1 1 160px' }}>
                Add Food Manually
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            onLoadedMetadata={() => setReady(true)}
            style={{
              width: '100%',
              maxHeight: '300px',
              borderRadius: '8px',
              backgroundColor: '#000',
              marginBottom: '12px'
            }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
            {ready ? 'Camera ready. Center the barcode, then capture.' : 'Starting camera preview...'}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={captureBarcode}
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={!ready}
            >
              📸 Capture Barcode
            </button>
            <button
              onClick={stopCamera}
              className="btn btn-outline"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      <div style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: '16px',
        marginTop: '16px'
      }}>
        <p style={{ marginBottom: '12px', fontWeight: '600' }}>
          Or enter barcode manually:
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
              inputMode="numeric"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!manualEntry.trim()}
            >
              Lookup
            </button>
          </div>
        </form>
      </div>

      <button
        onClick={handleClose}
        className="btn btn-outline"
        style={{ width: '100%', marginTop: '16px' }}
      >
        Cancel
      </button>
    </div>
  );
}

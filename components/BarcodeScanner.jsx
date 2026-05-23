import { useState, useRef, useEffect } from 'react';

export default function BarcodeScanner({ onScanSuccess, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [manualEntry, setManualEntry] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions or enter barcode manually.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualEntry.trim()) {
      stopCamera();
      onScanSuccess(manualEntry.trim());
    }
  };

  const captureBarcode = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Convert to blob and use Barcode Detection API if available
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
        });
        const barcodes = await barcodeDetector.detect(canvas);
        
        if (barcodes.length > 0) {
          stopCamera();
          onScanSuccess(barcodes[0].rawValue);
        } else {
          setError('No barcode detected. Try again or enter manually.');
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

      {!scanning ? (
        <div>
          <button
            onClick={startCamera}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '16px' }}
          >
            📷 Start Camera Scanner
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              maxHeight: '300px',
              borderRadius: '8px',
              backgroundColor: '#000',
              marginBottom: '12px'
            }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={captureBarcode}
              className="btn btn-primary"
              style={{ flex: 1 }}
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
        onClick={onClose}
        className="btn btn-outline"
        style={{ width: '100%', marginTop: '16px' }}
      >
        Cancel
      </button>
    </div>
  );
}

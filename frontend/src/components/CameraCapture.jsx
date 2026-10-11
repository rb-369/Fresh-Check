import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, XCircle } from 'lucide-react';

export default function CameraCapture({ onCapture, disabled }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // back camera on mobile by default

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Could not access camera. Please allow camera permissions or upload an image.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
        const dataUrl = canvas.toDataURL('image/jpeg');
        stopCamera();
        onCapture({
          file: file,
          dataUrl: dataUrl,
          name: 'Camera Snapshot'
        });
      }
    }, 'image/jpeg', 0.95);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (errorMsg) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
        <p style={{ color: '#f87171', fontSize: '0.88rem', marginBottom: '1rem' }}>{errorMsg}</p>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={startCamera}>
          Retry Camera
        </button>
      </div>
    );
  }

  return (
    <div className="camera-container">
      <video ref={videoRef} className="camera-video" playsInline muted autoPlay />
      <div className="camera-overlay">
        <button
          className="capture-btn"
          onClick={capturePhoto}
          disabled={disabled || !cameraActive}
        >
          <Camera size={18} />
          Capture Photo
        </button>
        <button
          onClick={toggleFacingMode}
          title="Switch camera"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CameraApp: React.FC<{ className?: string }> = ({ className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processedResult, setProcessedResult] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      const error = err as Error;
      setError(
        'Camera access failed. Please check your camera permissions in both Chrome and MacOS:\n' +
          '1. Chrome: Click the camera icon in address bar\n' +
          '2. MacOS: System Settings > Privacy & Security > Camera'
      );
      console.error('Camera error:', error);
    }
  };

  const stopCamera = (): void => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  const captureImage = (): void => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (!context) return;

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      setCapturedImage(canvasRef.current.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const retakeImage = (): void => {
    setCapturedImage(null);
    setProcessedResult(null);
    startCamera();
  };

  const processImage = async (): Promise<void> => {
    if (!window.cv || !capturedImage) {
      setError('OpenCV.js not loaded or no image captured');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const img = await createImageFromDataUrl(capturedImage);
      const mat = window.cv.imread(img);

      // Example processing: Convert to grayscale
      const gray = new window.cv.Mat();
      window.cv.cvtColor(mat, gray, window.cv.COLOR_RGBA2GRAY);

      // Example: Count non-zero pixels (as a placeholder AI model logic)
      const result = window.cv.countNonZero(gray);
      setProcessedResult(result);

      // Clean up
      mat.delete();
      gray.delete();
    } catch (err) {
      const error = err as Error;
      setError('Error processing image: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const createImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = dataUrl;
    });
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className || ''}`}>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <Camera className="w-6 h-6" />
          Object Detection Camera
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
          {!capturedImage && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isStreaming ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex flex-wrap gap-2">
          {!isStreaming && !capturedImage && (
            <Button
              onClick={startCamera}
              className="flex items-center gap-2"
              size="lg"
            >
              <Camera className="w-4 h-4" />
              Start Camera
            </Button>
          )}

          {isStreaming && (
            <Button
              onClick={captureImage}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Capture Image
            </Button>
          )}

          {capturedImage && (
            <>
              <Button
                onClick={processImage}
                disabled={isProcessing}
                className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 ${
                  isProcessing ? 'animate-pulse' : ''
                }`}
                size="lg"
              >
                <Cpu className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Process Image'}
              </Button>

              <Button
                onClick={retakeImage}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700"
                size="lg"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </Button>
            </>
          )}
        </div>

        {processedResult !== null && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-lg font-medium text-green-900">
              Processing Result: <span className="font-bold">{processedResult}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CameraApp;

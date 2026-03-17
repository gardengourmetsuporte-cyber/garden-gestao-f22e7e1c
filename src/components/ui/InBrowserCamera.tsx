import { useState, useRef, useCallback, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Check } from 'lucide-react';

interface InBrowserCameraProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

/**
 * In-browser camera capture using getUserMedia.
 * Avoids the Android issue where <input type="file" capture> causes
 * the browser tab to be killed by the OS when opening the native camera app.
 */
export function InBrowserCamera({ open, onClose, onCapture }: InBrowserCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setError(null);
    setPreview(null);
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    try {
      // Request high resolution + zoom:1 to prefer the main (1x) camera
      // instead of ultra-wide (0.5x) which some Android devices default to
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 3840, min: 1920 },
          height: { ideal: 2160, min: 1080 },
          // @ts-ignore - zoom is supported on many Android browsers
          zoom: { ideal: 1 },
        },
        audio: false,
      };
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback without zoom/resolution constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: false,
        });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  }, []);

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [open, facingMode, startCamera]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(dataUrl);

    // Stop stream while previewing
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const confirmPhoto = useCallback(async () => {
    if (!preview) return;
    const res = await fetch(preview);
    const blob = await res.blob();
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file);
    setPreview(null);
    onClose();
  }, [preview, onCapture, onClose]);

  const retake = useCallback(() => {
    setPreview(null);
    startCamera(facingMode);
  }, [facingMode, startCamera]);

  const handleClose = useCallback(() => {
    setPreview(null);
    setError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    onClose();
  }, [onClose]);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent side="bottom" className="h-[100dvh] p-0 rounded-none bg-black">
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera viewfinder or preview */}
        <div className="relative w-full h-full flex flex-col">
          {error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <Camera className="w-16 h-16 text-muted-foreground" />
              <p className="text-white text-sm">{error}</p>
              <Button variant="outline" onClick={handleClose}>Fechar</Button>
            </div>
          ) : preview ? (
            <>
              <img src={preview} alt="Preview" className="flex-1 object-contain" />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 p-6 bg-gradient-to-t from-black/80 to-transparent"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
                <button
                  onClick={retake}
                  className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
                >
                  <RotateCcw className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={confirmPhoto}
                  className="w-16 h-16 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform shadow-lg"
                >
                  <Check className="w-7 h-7 text-white" />
                </button>
              </div>
            </>
          ) : (
            <>
              <video
                ref={videoRef}
                className="flex-1 object-cover"
                autoPlay
                playsInline
                muted
              />
              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 p-6 bg-gradient-to-t from-black/80 to-transparent"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
                <button
                  onClick={handleClose}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={capturePhoto}
                  className="w-18 h-18 rounded-full border-4 border-white bg-white/20 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
                  style={{ width: 72, height: 72 }}
                >
                  <div className="w-14 h-14 rounded-full bg-white" />
                </button>
                <button
                  onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
                >
                  <RotateCcw className="w-5 h-5 text-white" />
                </button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

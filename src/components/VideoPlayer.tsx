import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipForward, SkipBack, Volume2, Maximize } from 'lucide-react';

interface Detection {
  id: string;
  type: 'person' | 'hat' | 'mask' | 'gloves' | 'glasses' | 'boots' | 'hearing';
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  frame: number;
  timestamp: number;
  className?: string;
}

interface VideoPlayerProps {
  videoFile: File;
  detections: Detection[];
  currentFrame: number;
  onFrameChange: (frame: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoFile,
  detections,
  currentFrame,
  onFrameChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoFile && videoRef.current) {
      const url = URL.createObjectURL(videoFile);
      videoRef.current.src = url;

      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const frame = Math.floor(video.currentTime * 30); // Assumindo 30 FPS
      onFrameChange(frame);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onFrameChange]);

  // Desenhar detecções no canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filtrar detecções para o frame atual
    const currentDetections = detections.filter(d =>
      Math.abs(d.frame - currentFrame) <= 2 // Tolerância de 2 frames
    );

    // Desenhar bounding boxes
    currentDetections.forEach(detection => {
      const { type, confidence, x, y, w, h } = detection;

      // Cores por tipo de detecção (seguindo os EPIs do documento)
      const colors = {
        person: '#3b82f6',    // blue
        hat: '#22c55e',       // green (capacete)
        mask: '#f59e0b',      // amber (máscara)
        gloves: '#8b5cf6',    // violet (luvas)
        glasses: '#06b6d4',   // cyan (óculos)
        boots: '#ef4444',     // red (botas)
        hearing: '#f97316'    // orange (proteção auditiva)
      };

      const color = colors[type] || '#6b7280';

      // Desenhar retângulo
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Desenhar rótulo
      ctx.fillStyle = color;
      ctx.fillRect(x, y - 20, Math.max(w, 80), 20);

      ctx.fillStyle = 'white';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${type} (${(confidence * 100).toFixed(0)}%)`, x + 2, y - 6);
    });
  }, [detections, currentFrame]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
    }
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  const skipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    }
  }, [duration]);

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCurrentDetections = () => {
    return detections.filter(d =>
      Math.abs(d.frame - currentFrame) <= 2
    );
  };

  const currentDetections = getCurrentDetections();

  return (
    <Card className="overflow-hidden space-y-2">

      <CardContent className="space-y-3">
        <div className="mt-4"></div> 
        {/* Video Container */}
        <div className="flex justify-center items-center">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video w-[40%]">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              preload="metadata"
            />

            {/* Overlay Canvas for Detections */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              width={640}
              height={360}
            />
          </div>
        </div>
        {/* Controls */}
        <div className="space-y-1">
          {/* Progress Bar */}
          <div className="space-y-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipBackward}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipForward}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Volume Control */}
              <div className="flex items-center gap-2 w-24">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Current Detections Info */}
        {currentDetections.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Detecções no Frame Atual:</h4>
            <div className="flex flex-wrap gap-2">
              {currentDetections.map((detection) => (
                <Badge
                  key={detection.id}
                  variant="outline"
                  className={`text-xs ${detection.type === 'person' ? 'border-primary text-primary' :
                      detection.type === 'hat' ? 'border-success text-success' :
                        detection.type === 'mask' ? 'border-warning text-warning' :
                          detection.type === 'glasses' ? 'border-primary text-primary' :
                            'border-muted-foreground text-muted-foreground'
                    }`}
                >
                  {detection.type} ({(detection.confidence * 100).toFixed(0)}%)
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
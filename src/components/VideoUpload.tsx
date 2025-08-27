import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileVideo, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadProps {
  onVideoUpload: (file: File) => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (!videoFile) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo de vídeo válido",
        variant: "destructive"
      });
      return;
    }

    // Verificar tamanho (máximo 100MB)
    if (videoFile.size > 100 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O vídeo deve ter no máximo 100MB",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(videoFile);
    onVideoUpload(videoFile);
    
    toast({
      title: "Upload realizado",
      description: `${videoFile.name} foi carregado com sucesso`,
    });
  }, [onVideoUpload, toast]);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (file: File) => {
    // Criar elemento de vídeo para obter duração
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    
    return new Promise<string>((resolve) => {
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        URL.revokeObjectURL(video.src);
      };
    });
  };

  return (
    <div className="space-y-4">
      {!uploadedFile ? (
        <Card className={`transition-all duration-200 ${
          dragActive ? 'border-primary bg-primary/5' : 'border-dashed border-border'
        }`}>
          <CardContent className="p-6">
            <div
              className="flex flex-col items-center justify-center space-y-4 min-h-[200px] cursor-pointer"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('video-upload')?.click()}
            >
              <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                dragActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Upload className="h-8 w-8" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">
                  {dragActive ? 'Solte o vídeo aqui' : 'Carregar Vídeo'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Arraste e solte um arquivo de vídeo ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos suportados: MP4, AVI, MOV, WebM (máx. 100MB)
                </p>
              </div>

              <Button variant="outline" className="mt-4">
                <FileVideo className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadedFile.size)} • Vídeo carregado
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <input
        id="video-upload"
        type="file"
        accept="video/*"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};
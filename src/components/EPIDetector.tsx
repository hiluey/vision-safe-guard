import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VideoUpload } from './VideoUpload';
import { VideoPlayer } from './VideoPlayer';
import { AlertDashboard } from './AlertDashboard';
import { APIConfig } from './APIConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, PlayCircle, Settings, BarChart3, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  className?: string; // Nome original da classe da API
}

interface Alert {
  id: string;
  personId: string;
  missingEPIs: string[];
  severity: 'high' | 'medium' | 'low';
  frame: number;
  timestamp: number;
}

export const EPIDetector: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [apiToken, setApiToken] = useState<string>('dapi4a5d76e7aac9b8727cc7a2a771f104be'); // Token padrão do documento
  const [currentFrame, setCurrentFrame] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { toast } = useToast();

  const handleVideoUpload = useCallback((file: File) => {
    setVideoFile(file);
    setDetections([]);
    setAlerts([]);
    setCurrentFrame(0);
    setAnalysisProgress(0);
    toast({
      title: "Vídeo carregado",
      description: `${file.name} está pronto para análise`,
    });
  }, [toast]);

  const analyzeVideo = useCallback(async () => {
    if (!videoFile) {
      toast({
        title: "Configuração incompleta",
        description: "Selecione um vídeo para análise",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const totalFrames = 100; // Será calculado dinamicamente

      for (let frame = 0; frame < totalFrames; frame += 10) {

        const frameData = await extractFrameAsBase64(videoFile, frame);

        // Chamar APIs de detecção **sem passar token**
        const [personDetections, ppeDetections] = await Promise.all([
          callPersonDetectorAPI(frameData),
          callPPEDetectorAPI(frameData)
        ]);

        processDetections(personDetections, ppeDetections, frame);
        setAnalysisProgress((frame / totalFrames) * 100);
      }

      toast({
        title: "Análise concluída",
        description: `Foram encontrados ${alerts.length} alertas de segurança`,
        variant: alerts.length > 0 ? "destructive" : "default"
      });

    } catch (error) {
      console.error('Erro na análise:', error);
      toast({
        title: "Erro na análise",
        description: "Verifique a configuração da API e tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoFile, alerts.length, toast]);

  const extractFrameAsBase64 = async (video: File, frameNumber: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const videoElement = document.createElement('video');

      videoElement.onloadeddata = () => {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        videoElement.currentTime = frameNumber / 30; // Assumindo 30 FPS
      };

      videoElement.onseeked = () => {
        ctx?.drawImage(videoElement, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        resolve(base64);
      };

      videoElement.src = URL.createObjectURL(video);
    });
  };

  const callPersonDetectorAPI = async (imageBase64: string) => {
    const response = await fetch('http://localhost:3001/api/person-detector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataframe_records: [{ image_b64: imageBase64 }]
      })
    });
    return response.json();
  };

  const callPPEDetectorAPI = async (imageBase64: string) => {
    const response = await fetch('http://localhost:3001/api/ppe-detector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataframe_records: [{ image_b64: imageBase64 }]
      })
    });
    return response.json();
  };



  const processDetections = (personData: any, ppeData: any, frame: number) => {
    const newDetections: Detection[] = [];
    const frameAlerts: Alert[] = [];
    const MIN_CONFIDENCE = 0.5;

    // Pessoas
    if (personData.predictions?.[0]?.persons) {
      personData.predictions[0].persons.forEach((person: any, index: number) => {
        if ((person.score || 0) < MIN_CONFIDENCE) return;
        newDetections.push({
          id: `person_${frame}_${index}`,
          type: 'person',
          confidence: person.score || 0,
          x: person.box?.[0] ?? person.x ?? 0,
          y: person.box?.[1] ?? person.y ?? 0,
          w: person.box ? person.box[2] - person.box[0] : person.w ?? 0,
          h: person.box ? person.box[3] - person.box[1] : person.h ?? 0,
          frame,
          timestamp: Date.now()
        });
      });
    }

    // EPIs
const epiMapping: Record<string, string> = {
  'hat': 'hat',
  'boots': 'boots',
  'hearing': 'hearing',
  'goggles': 'glasses',
  'mask': 'mask',
  'gloves': 'gloves'
};

    const detectedEPIClasses = new Set<string>();

    if (ppeData.predictions?.[0]?.ppe_detections) {
      ppeData.predictions[0].ppe_detections.forEach((epi: any, index: number) => {
        const className = epi.class_name?.toLowerCase();
        const mappedType = epiMapping[className];
        if (!mappedType || (epi.score || 0) < MIN_CONFIDENCE) return;

        const box = epi.box_model_input_coords || epi.box || [0, 0, 0, 0];
        newDetections.push({
          id: `epi_${frame}_${index}`,
          type: mappedType as Detection['type'],
          confidence: epi.score || 0,
          x: box[0],
          y: box[1],
          w: box[2] - box[0],
          h: box[3] - box[1],
          frame,
          timestamp: Date.now(),
          className
        });
        detectedEPIClasses.add(mappedType);

      });
    }

    const requiredEPIs = new Set(['mask', 'glasses', 'hearing']);

    const missingEPIs = Array.from(requiredEPIs).filter(epi => !detectedEPIClasses.has(epi));
    const personsInFrame = newDetections.filter(d => d.type === 'person');

    personsInFrame.forEach((person, personIndex) => {
      if (missingEPIs.length === 0) return;
      frameAlerts.push({
        id: `alert_${frame}_${personIndex}`,
        personId: person.id,
        missingEPIs: missingEPIs.map(epi => epi === 'mask' ? 'Máscara' : 'Óculos de Proteção'),
        severity: missingEPIs.length >= 2 ? 'high' : 'medium',
        frame,
        timestamp: Date.now()
      });
    });

    // Atualiza estado
    const filterDuplicatePersons = (detections: Detection[]) => {
      const persons = detections.filter(d => d.type === 'person');
      const filtered: Detection[] = [];

      persons.forEach(p => {
        const overlap = filtered.some(f => {
          const xOverlap = Math.max(0, Math.min(f.x + f.w, p.x + p.w) - Math.max(f.x, p.x));
          const yOverlap = Math.max(0, Math.min(f.y + f.h, p.y + p.h) - Math.max(f.y, p.y));
          const iou = (xOverlap * yOverlap) / (p.w * p.h);
          return iou > 0.7;
        });
        if (!overlap) filtered.push(p);
      });

      const nonPersons = detections.filter(d => d.type !== 'person');
      return [...filtered, ...nonPersons];
    };

    setDetections(prev => filterDuplicatePersons([...prev, ...newDetections]));
    setAlerts(prev => [...prev, ...frameAlerts]);
  };


  const getStatusSummary = () => {
    const highAlerts = alerts.filter(a => a.severity === 'high').length;
    const mediumAlerts = alerts.filter(a => a.severity === 'medium').length;
    const lowAlerts = alerts.filter(a => a.severity === 'low').length;

    return { highAlerts, mediumAlerts, lowAlerts };
  };

  const { highAlerts, mediumAlerts, lowAlerts } = getStatusSummary();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Detector de EPIs</h1>
              <p className="text-muted-foreground">Sistema de Monitoramento de Equipamentos de Proteção Individual</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-success border-success">
              {detections.length} Detecções
            </Badge>
            {highAlerts > 0 && (
              <Badge variant="outline" className="text-danger border-danger">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {highAlerts} Alertas Críticos
              </Badge>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alertas Críticos</p>
                  <p className="text-2xl font-bold text-danger">{highAlerts}</p>
                </div>
                <div className="h-8 w-8 bg-danger/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alertas Médios</p>
                  <p className="text-2xl font-bold text-warning">{mediumAlerts}</p>
                </div>
                <div className="h-8 w-8 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alertas Baixos</p>
                  <p className="text-2xl font-bold text-success">{lowAlerts}</p>
                </div>
                <div className="h-8 w-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Detecções Totais</p>
                  <p className="text-2xl font-bold text-primary">{detections.length}</p>
                </div>
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Análise
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            {/* <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas
            </TabsTrigger>*/}
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Vídeo</CardTitle>
                </CardHeader>
                <CardContent>
                  <VideoUpload onVideoUpload={handleVideoUpload} />
                  {videoFile && (
                    <div className="mt-4 space-y-4">
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          Vídeo carregado: {videoFile.name}
                        </AlertDescription>
                      </Alert>
                      <Button
                        onClick={analyzeVideo}
                        disabled={isAnalyzing || !apiToken}
                        variant="hero"
                        className="w-full"
                      >
                        {isAnalyzing ? `Analisando... ${analysisProgress.toFixed(0)}%` : 'Iniciar Análise'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visualização do Vídeo</CardTitle>
                </CardHeader>
                <CardContent>
                  {videoFile ? (
                    <VideoPlayer
                      videoFile={videoFile}
                      detections={detections}
                      currentFrame={currentFrame}
                      onFrameChange={setCurrentFrame}
                    />
                  ) : (
                    <div className="h-64 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Carregue um vídeo para visualizar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <AlertDashboard alerts={alerts} detections={detections} />
          </TabsContent>

          <TabsContent value="config">
            <APIConfig apiToken={apiToken} onTokenChange={setApiToken} />
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Alertas</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum alerta encontrado. Execute uma análise primeiro.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((alert) => (
                      <Alert key={alert.id} className={`border-l-4 ${alert.severity === 'high' ? 'border-l-danger' :
                        alert.severity === 'medium' ? 'border-l-warning' : 'border-l-success'
                        }`}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Frame {alert.frame}: EPIs faltando - {alert.missingEPIs.join(', ')}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
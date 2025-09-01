import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, TrendingUp, TrendingDown, Users, HardHat } from 'lucide-react';

interface Detection {
  id: string;
  type: 'person' | 'mask' | 'gloves' | 'goggles' | 'coverall' | 'face_Shield';
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  frame: number;
  timestamp: number;
  className?: string;
}

interface Alert {
  id: string;
  personId: string;
  missingEPIs: string[];
  severity: 'high' | 'medium' | 'low';
  frame: number;
  timestamp: number;
}

interface AlertDashboardProps {
  alerts: Alert[];
  detections: Detection[];
}

export const AlertDashboard: React.FC<AlertDashboardProps> = ({ alerts, detections }) => {
  // Estatísticas das detecções (seguindo os EPIs do documento)
  const getDetectionStats = () => {
    const personDetections = detections.filter(d => d.type === 'person').length;
    const maskDetections = detections.filter(d => d.type === 'mask').length;
    const glovesDetections = detections.filter(d => d.type === 'gloves').length;
    const gogglesDetections = detections.filter(d => d.type === 'goggles').length;
    const coverallDetections = detections.filter(d => d.type === 'coverall').length;
    const faceShieldDetections = detections.filter(d => d.type === 'face_Shield').length;
    return {
      personDetections,
      maskDetections,
      glovesDetections,
      gogglesDetections,
      faceShieldDetections,
      coverallDetections
    };
  };

  // Estatísticas dos alertas
  const getAlertStats = () => {
    const highAlerts = alerts.filter(a => a.severity === 'high').length;
    const mediumAlerts = alerts.filter(a => a.severity === 'medium').length;
    const lowAlerts = alerts.filter(a => a.severity === 'low').length;
    const totalAlerts = alerts.length;

    // EPIs mais faltantes
    const missingEPIsCount = alerts.reduce((acc, alert) => {
      alert.missingEPIs.forEach(epi => {
        acc[epi] = (acc[epi] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      highAlerts,
      mediumAlerts,
      lowAlerts,
      totalAlerts,
      missingEPIsCount
    };
  };

  // Taxa de conformidade por EPI (seguindo os EPIs do documento)
  const getComplianceRates = () => {
    const stats = getDetectionStats();
    const { personDetections } = stats;

    if (personDetections === 0) return {};

    return {
      mask: Math.min(100, (stats.maskDetections / personDetections) * 100).toFixed(1),
      gloves: Math.min(100, (stats.glovesDetections / personDetections) * 100).toFixed(1),
      goggles: Math.min(100, (stats.gogglesDetections / personDetections) * 100).toFixed(1),
      coverall: Math.min(100, (stats.coverallDetections / personDetections) * 100).toFixed(1),
      face_Shield: Math.min(100, (stats.faceShieldDetections / personDetections) * 100).toFixed(1)
    };
  };


  const stats = getDetectionStats();
  const alertStats = getAlertStats();
  const complianceRates = getComplianceRates();

  const epiLabels = {
    mask: 'Máscara',
    gloves: 'Luvas',
    goggles: 'Óculos de Proteção',
    coverall: 'Macacão',
    face_Shield: 'Protetor Facial',
  };

  const epiIcons = {
    mask: Shield,
    gloves: Shield,
    goggles: Shield,
    coverall: Shield,
    face_Shield: Shield,
  };

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Alertas</p>
                <p className="text-3xl font-bold text-danger">{alertStats.totalAlerts}</p>
              </div>
              <div className="h-12 w-12 bg-danger/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-danger" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conformidade</p>
                <p className="text-3xl font-bold text-success">
                  {stats.personDetections > 0
                    ? Math.max(0, Math.min(100, ((stats.personDetections - alertStats.totalAlerts) / stats.personDetections) * 100)).toFixed(1)
                    : 0}%
                </p>

              </div>
              <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento dos Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Distribuição de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Críticos</span>
                <Badge variant="outline" className="text-danger border-danger">
                  {alertStats.highAlerts}
                </Badge>
              </div>
              <Progress
                value={alertStats.totalAlerts > 0 ? (alertStats.highAlerts / alertStats.totalAlerts) * 100 : 0}
                className="h-2 bg-danger/20"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Médios</span>
                <Badge variant="outline" className="text-warning border-warning">
                  {alertStats.mediumAlerts}
                </Badge>
              </div>
              <Progress
                value={alertStats.totalAlerts > 0 ? (alertStats.mediumAlerts / alertStats.totalAlerts) * 100 : 0}
                className="h-2 bg-warning/20"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Baixos</span>
                <Badge variant="outline" className="text-success border-success">
                  {alertStats.lowAlerts}
                </Badge>
              </div>
              <Progress
                value={alertStats.totalAlerts > 0 ? (alertStats.lowAlerts / alertStats.totalAlerts) * 100 : 0}
                className="h-2 bg-success/20"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardHat className="h-5 w-5" />
              Taxa de Conformidade por EPI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(complianceRates).map(([epi, rate], index) => {
              const Icon = epiIcons[epi as keyof typeof epiIcons];
              const numericRate = parseFloat(rate);
              const color = numericRate >= 90 ? 'success' : numericRate >= 70 ? 'warning' : 'danger';

              return (
                <div key={epi} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {epiLabels[epi as keyof typeof epiLabels]}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${color === 'success' ? 'text-success border-success' :
                        color === 'warning' ? 'text-warning border-warning' :
                          'text-danger border-danger'
                        }`}
                    >
                      {rate}%
                    </Badge>
                  </div>
                  <Progress
                    value={numericRate}
                    className={`h-2 ${color === 'success' ? 'bg-success/20' :
                      color === 'warning' ? 'bg-warning/20' :
                        'bg-danger/20'
                      }`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* EPIs Mais Faltantes */}
      {/*<Card>
        <CardHeader>
          <CardTitle>EPIs Mais Faltantes</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(alertStats.missingEPIsCount).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma violação detectada. Excelente conformidade!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(alertStats.missingEPIsCount)
                .sort(([, a], [, b]) => b - a)
                .map(([epi, count]) => (
                  <Alert key={epi} className="border-l-4 border-l-danger">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {epiLabels[epi as keyof typeof epiLabels] || epi}
                        </span>
                        <Badge variant="outline" className="text-danger border-danger">
                          {count} violações
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          )}
        </CardContent>
      </Card>*/}

      {/* Alertas Recentes */}
      {/*<Card>
        <CardHeader>
          <CardTitle>Alertas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum alerta registrado</p>
              <p className="text-sm text-muted-foreground">
                Todos os trabalhadores estão usando os EPIs corretamente
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10)
                .map((alert) => (
                  <Alert
                    key={alert.id}
                    className={`border-l-4 ${alert.severity === 'high' ? 'border-l-danger' :
                      alert.severity === 'medium' ? 'border-l-warning' : 'border-l-success'
                      }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">Frame {alert.frame}</span>
                          <span className="text-muted-foreground text-sm ml-2">
                            EPIs faltando: {alert.missingEPIs.join(', ')}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${alert.severity === 'high' ? 'text-danger border-danger' :
                            alert.severity === 'medium' ? 'text-warning border-warning' :
                              'text-success border-success'
                            }`}
                        >
                          {alert.severity === 'high' ? 'Crítico' :
                            alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          )}
        </CardContent>
      </Card>*/}
    </div>
  );
};
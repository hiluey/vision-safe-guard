import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, HardHat } from 'lucide-react';

interface Detection {
  id: string;
  type: 'person' | 'mask' | 'gloves' | 'goggles' | 'coverall' | 'face_Shield';
}

interface Alert {
  id: string;
  personId: string;
  missingEPIs: string[];
  severity: 'high' | 'medium' | 'low';
}

interface ComplianceRatesCardProps {
  detections: Detection[];
  alerts: Alert[];
  title?: string;
}

export const ComplianceRatesCard: React.FC<ComplianceRatesCardProps> = ({ detections, alerts, title }) => {
  const getDetectionStats = () => {
    const personDetections = detections.filter(d => d.type === 'person').length;
    const maskDetections = detections.filter(d => d.type === 'mask').length;
    const glovesDetections = detections.filter(d => d.type === 'gloves').length;
    const gogglesDetections = detections.filter(d => d.type === 'goggles').length;
    const coverallDetections = detections.filter(d => d.type === 'coverall').length;
    const faceShieldDetections = detections.filter(d => d.type === 'face_Shield').length;

    return { personDetections, maskDetections, glovesDetections, gogglesDetections, faceShieldDetections, coverallDetections };
  };


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
    <Card className="overflow-hidden rounded-2xl shadow-lg border border-gray-200">
      <CardHeader className="pb-4 border-b border-gray-100">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
          <HardHat className="h-6 w-6 text-yellow-500" />
          {title || "Taxa de Conformidade por EPI"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-11 pt-4">
        {Object.entries(complianceRates).map(([epi, rate]) => {
          const Icon = epiIcons[epi as keyof typeof epiIcons];
          const numericRate = parseFloat(rate);

          // Definição de cores
          let colorClass = 'text-gray-500 border-gray-300 bg-gray-100';
          if (numericRate >= 90) colorClass = 'text-green-600 border-green-600 bg-green-100';
          else if (numericRate >= 70) colorClass = 'text-yellow-600 border-yellow-600 bg-yellow-100';
          else colorClass = 'text-red-600 border-red-600 bg-red-100';

          return (
            <div key={epi} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {epiLabels[epi as keyof typeof epiLabels]}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`px-3 py-1 rounded-full font-medium text-sm ${colorClass}`}
                >
                  {rate}%
                </Badge>
              </div>

              <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                  style={{ width: `${numericRate}%` }}
                />
              </div>

              {/* Pequeno detalhe extra: texto complementar */}
              <div className="text-xs text-gray-500 italic">
                {numericRate >= 90
                  ? "Excelente conformidade"
                  : numericRate >= 70
                    ? "Conformidade aceitável"
                    : "Atenção necessária"}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>

  );
};

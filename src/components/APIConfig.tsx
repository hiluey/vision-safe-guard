import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Settings, Key, CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface APIConfigProps {
  apiToken: string;
  onTokenChange: (token: string) => void;
}

export const APIConfig: React.FC<APIConfigProps> = ({ apiToken, onTokenChange }) => {
  const [tempToken, setTempToken] = useState(apiToken);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [lastTestResult, setLastTestResult] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    setTempToken(apiToken);
  }, [apiToken]);

  const handleSaveToken = () => {
    if (!tempToken.trim()) {
      toast({
        title: "Token inválido",
        description: "Por favor, insira um token válido",
        variant: "destructive"
      });
      return;
    }

    onTokenChange(tempToken.trim());
    toast({
      title: "Token salvo",
      description: "Configuração da API atualizada com sucesso",
    });
  };

  const testConnection = async () => {
    if (!tempToken.trim()) {
      toast({
        title: "Token necessário",
        description: "Insira um token antes de testar a conexão",
        variant: "destructive"
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('testing');

    try {
      // Teste com uma imagem pequena em base64 (pixel transparente)
      const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const testPersonAPI = async () => {
        const response = await fetch(
          'https://adb-367534349465137.17.azuredatabricks.net/serving-endpoints/person-detector/invocations',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tempToken.trim()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              dataframe_records: [{ image_b64: testImage }]
            })
          }
        );
        return response;
      };

      const testPPEAPI = async () => {
        const response = await fetch(
          'https://adb-367534349465137.17.azuredatabricks.net/serving-endpoints/ppe_senac_detector/invocations',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tempToken.trim()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              dataframe_records: [{ image_b64: testImage }]
            })
          }
        );
        return response;
      };

      const [personResponse, ppeResponse] = await Promise.all([
        testPersonAPI(),
        testPPEAPI()
      ]);

      if (personResponse.ok && ppeResponse.ok) {
        setConnectionStatus('success');
        setLastTestResult('Ambas as APIs estão funcionando corretamente');
        toast({
          title: "Conexão bem-sucedida",
          description: "Todas as APIs estão acessíveis",
        });
      } else {
        const errors = [];
        if (!personResponse.ok) {
          errors.push(`Person API: ${personResponse.status} ${personResponse.statusText}`);
        }
        if (!ppeResponse.ok) {
          errors.push(`PPE API: ${ppeResponse.status} ${ppeResponse.statusText}`);
        }
        
        setConnectionStatus('error');
        setLastTestResult(errors.join(', '));
        toast({
          title: "Erro na conexão",
          description: "Verifique o token e tente novamente",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      setLastTestResult(`Erro de rede: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar com as APIs",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-danger" />;
      case 'testing':
        return <Settings className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'success':
        return <Badge variant="outline" className="text-success border-success">Conectado</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-danger border-danger">Erro</Badge>;
      case 'testing':
        return <Badge variant="outline" className="text-primary border-primary">Testando...</Badge>;
      default:
        return <Badge variant="outline">Não testado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuração da API Databricks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-token">Token de Autenticação</Label>
              <Input
                id="api-token"
                type="password"
                placeholder="Inserir token do Databricks..."
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                O token será usado para autenticar nas APIs de detecção de pessoas e EPIs
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSaveToken}
                variant="default"
                disabled={!tempToken.trim() || tempToken === apiToken}
              >
                Salvar Token
              </Button>
              <Button 
                onClick={testConnection}
                variant="outline"
                disabled={!tempToken.trim() || isTestingConnection}
              >
                {isTestingConnection ? (
                  <>
                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
            </div>
          </div>

          {/*<Separator />*/}

          {/* Connection Status */}
          {/*<div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Status da Conexão</h4>
              {getStatusBadge()}
            </div>

            {connectionStatus !== 'idle' && (
              <Alert className={`${
                connectionStatus === 'success' ? 'border-success' :
                connectionStatus === 'error' ? 'border-danger' : 'border-primary'
              }`}>
                {getStatusIcon()}
                <AlertDescription>
                  {lastTestResult}
                </AlertDescription>
              </Alert>
            )}
          </div>*/}

          <Separator />

          {/* API Endpoints Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Endpoints da API</h4>
            
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Person Detector API</span>
                  <Button variant="ghost" size="sm" asChild>
                    <a 
                      href="https://adb-367534349465137.17.azuredatabricks.net/serving-endpoints/person-detector/invocations"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  https://adb-367534349465137.17.azuredatabricks.net/serving-endpoints/person-detector/invocations
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">PPE Detector API</span>
                  <Button variant="ghost" size="sm" asChild>
                    <a 
                      href="https://adb-367534349465137.17.azuredatabricks.net/serving-endpoints/ppe_senac_detector/invocations"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  https://adb-367534349465137.17.azuredatabricks.net/serving-endpoints/ppe_senac_detector/invocations
                </p>
              </div>
            </div>
          </div>

          {/*<Separator />*/}

          {/* Usage Instructions */}
          {/*<div className="space-y-4">
            <h4 className="text-sm font-medium">Como obter o token</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Acesse o Databricks workspace</p>
              <p>2. Vá em <strong>User Settings → Developer → Access tokens</strong></p>
              <p>3. Clique em <strong>Generate new token</strong></p>
              <p>4. Copie o token gerado e cole aqui</p>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Mantenha seu token seguro e não o compartilhe. 
                Este token dá acesso aos modelos de ML hospedados no Databricks.
              </AlertDescription>
            </Alert>
          </div>*/}
        </CardContent>
      </Card>
    </div>
  );
};
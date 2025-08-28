import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface RealtimeDetectorProps {
  callPersonDetectorAPI: (img: string) => Promise<any>;
  callPPEDetectorAPI: (img: string) => Promise<any>;
  processDetections: (person: any, epi: any, frame: number) => void;
}

export const RealtimeDetector: React.FC<RealtimeDetectorProps> = ({
  callPersonDetectorAPI,
  callPPEDetectorAPI,
  processDetections,
}) => {
  const [isRealtime, setIsRealtime] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const missedFramesRef = useRef(0);
  const MAX_MISSED_FRAMES = 5;

  // 👉 Função para apenas ligar a câmera
  const startCamera = async () => {
    if (videoRef.current?.srcObject) return; // já está ligada

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraOn(true);
    } catch (err) {
      console.error("Erro ao acessar webcam:", err);
    }
  };

  // 👉 Inicia a análise em tempo real (sem ligar a câmera de novo)
  const startRealtime = () => {
    if (!videoRef.current || isRealtime) return;

    setIsRealtime(true);
    missedFramesRef.current = 0;

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx?.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

      const [personDetections, ppeDetections] = await Promise.all([
        callPersonDetectorAPI(base64),
        callPPEDetectorAPI(base64),
      ]);

      const filteredPersons =
        personDetections.predictions?.[0]?.persons?.filter(
          (p: any) => (p.score || 0) >= 0.6
        ) || [];

      if (filteredPersons.length === 0) {
        missedFramesRef.current += 1;
      } else {
        missedFramesRef.current = 0;
      }

      processDetections(personDetections, ppeDetections, Date.now());

      if (missedFramesRef.current >= MAX_MISSED_FRAMES) {
        stopRealtime();
      }
    }, 500);
  };

  const stopRealtime = () => {
    setIsRealtime(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const stopCamera = () => {
    stopRealtime();
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // 👉 Ligar a câmera automaticamente ao montar
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera(); // Desligar tudo ao desmontar
    };
  }, []);

  return (
<div className="max-w-2xl mx-auto py-15 px-6 space-y-10 bg-white shadow-xl rounded-2xl border border-gray-200">
<div className="text-center space-y-3">
  {/* Ícone delicado no topo */}
  <div className="flex justify-center mt-6">
    <svg
      className="w-8 h-8 text-indigo-400 "
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.333 0-2 .667-2 2s.667 2 2 2 2-.667 2-2-.667-2-2-2zm0-4v1m0 14v1m8-8h1M3 12H2m15.364-6.364l.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707"
      />
    </svg>
  </div>

  {/* Título elegante menor */}
  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
    Análise em Tempo Real
  </h2>

  {/* Parágrafo menor */}
  <p className="text-gray-600 text-center text-sm sm:text-base max-w-md mx-auto leading-relaxed">
    A câmera será ligada automaticamente. <span className="font-medium text-indigo-500">Clique no botão abaixo</span> para iniciar a análise e acompanhar os resultados em tempo real.
  </p>

  {/* Linha decorativa delicada menor */}
  <div className="mx-auto w-16 h-1 bg-indigo-200 rounded-full mt-1.5"></div>
</div>



  <video
    ref={videoRef}
    className="w-full aspect-video rounded-xl border border-gray-300 shadow-sm bg-black"
    autoPlay
    muted
  />

<button
  onClick={isRealtime ? stopRealtime : startRealtime}
  disabled={!isCameraOn}
  className={`
    w-full
    py-1.5
    rounded-2xl                   /* bordas suaves e delicadas */
    bg-indigo-50                  /* fundo pastel elegante */
    text-indigo-700               /* cor da fonte sofisticada */
    font-medium
    text-lg
    border border-indigo-100      /* borda leve e harmoniosa */
    shadow-sm                     /* sombra mínima */
    hover:bg-indigo-100           /* hover muito suave */
    hover:shadow                     /* leve destaque no hover */
    focus:outline-none
    focus:ring-1
    focus:ring-indigo-200         /* foco delicado */
    transition
    duration-200
    ease-in-out
    disabled:opacity-50
    disabled:cursor-not-allowed
  `}
>
  {isRealtime ? "Parar Análise" : "Iniciar Análise"}
</button>




</div>


  );
};
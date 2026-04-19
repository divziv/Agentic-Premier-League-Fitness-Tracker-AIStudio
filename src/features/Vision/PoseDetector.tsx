import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';

export default function PoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let detector: poseDetection.PoseDetector | null = null;
    let animationFrameId: number;

    const setupCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
      }

      const video = videoRef.current;
      if (!video) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      video.srcObject = stream;

      return new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
    };

    const loadModel = async () => {
      await tf.ready();
      const model = poseDetection.SupportedModels.MoveNet;
      detector = await poseDetection.createDetector(model, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      });
      setIsModelLoaded(true);
    };

    const drawPose = (pose: poseDetection.Pose) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (pose.keypoints) {
        pose.keypoints.forEach((keypoint) => {
          if (keypoint.score && keypoint.score > 0.3) {
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#00ffcc';
            ctx.fill();
          }
        });

        // Simple skeleton drawing logic
        const adjacentKeyPoints = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
        adjacentKeyPoints.forEach(([i, j]) => {
          const kp1 = pose.keypoints[i];
          const kp2 = pose.keypoints[j];
          if (kp1.score && kp1.score > 0.3 && kp2.score && kp2.score > 0.3) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'white';
            ctx.stroke();
          }
        });
      }
    };

    const detectPose = async () => {
      if (detector && videoRef.current && videoRef.current.readyState === 4) {
        try {
          const poses = await detector.estimatePoses(videoRef.current);
          if (poses.length > 0) {
            drawPose(poses[0]);
          }
        } catch (e) {
          console.error("Pose detection error:", e);
        }
      }
      animationFrameId = requestAnimationFrame(detectPose);
    };

    const init = async () => {
      try {
        await setupCamera();
        await loadModel();
        detectPose();
      } catch (err: any) {
        setError(err.message || "Failed to initialize camera or model.");
      }
    };

    init();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (detector) {
        detector.dispose();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden relative bg-black flex items-center justify-center border border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
       <div className="absolute top-4 left-4 z-10 text-[10px] uppercase tracking-widest font-black text-aura-accent opacity-70 bg-black/50 px-2 py-1 rounded">
        Computer Vision Matrix
      </div>
      
      {error ? (
        <div className="text-red-400 text-sm font-bold p-6 text-center">
          {error}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover z-10"
          />
          {!isModelLoaded && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full border-2 border-aura-accent border-t-transparent animate-spin mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-aura-text-secondary">Loading Neural Network...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

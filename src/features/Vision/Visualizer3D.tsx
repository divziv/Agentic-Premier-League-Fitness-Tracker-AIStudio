import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

// A simple procedural abstract avatar to visualize posture
function AbstractAvatar({ activeExercise }: { activeExercise: string }) {
  const group = useRef<THREE.Group>(null);
  
  // Animate the avatar based on the exercise
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    
    // Default subtle breathing animation
    group.current.position.y = Math.sin(t * 2) * 0.05;
    
    // Simulate exercise movements based on exercise name roughly
    if (activeExercise.includes('Squat')) {
      group.current.position.y = Math.abs(Math.sin(t * 3)) * -0.5;
    } else if (activeExercise.includes('Push Up')) {
      group.current.rotation.x = Math.PI / 2; // Lie down
      group.current.position.y = Math.abs(Math.sin(t * 3)) * 0.3 - 0.5;
    } else {
      // Stand upright
      group.current.rotation.x = 0;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Head */}
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.2} wireframe />
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 1.1, 0]}>
        <capsuleGeometry args={[0.2, 0.6, 4, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.4, 1.2, 0]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.08, 0.5, 4, 16]} />
        <meshStandardMaterial color="#555" />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.4, 1.2, 0]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.08, 0.5, 4, 16]} />
        <meshStandardMaterial color="#555" />
      </mesh>

      {/* Left Leg */}
      <mesh position={[-0.15, 0.4, 0]}>
        <capsuleGeometry args={[0.1, 0.6, 4, 16]} />
        <meshStandardMaterial color="#444" />
      </mesh>

      {/* Right Leg */}
      <mesh position={[0.15, 0.4, 0]}>
        <capsuleGeometry args={[0.1, 0.6, 4, 16]} />
        <meshStandardMaterial color="#444" />
      </mesh>
    </group>
  );
}

export default function Visualizer3D({ activeExercise }: { activeExercise: string }) {
  return (
    <div className="w-full h-full rounded-3xl overflow-hidden relative bg-gradient-to-b from-aura-surface to-aura-bg border border-white/5">
      <div className="absolute top-4 left-4 z-10 text-[10px] uppercase tracking-widest font-black text-aura-accent opacity-70">
        3D Biomechanical Simulator
      </div>
      <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <AbstractAvatar activeExercise={activeExercise} />
        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={5} blur={2} far={4} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}

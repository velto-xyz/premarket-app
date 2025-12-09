import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

interface Unicorn3DProps {
  color: string;
  companyName: string;
}

function UnicornModel({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const frontLeftLegRef = useRef<THREE.Mesh>(null);
  const frontRightLegRef = useRef<THREE.Mesh>(null);
  const backLeftLegRef = useRef<THREE.Mesh>(null);
  const backRightLegRef = useRef<THREE.Mesh>(null);

  // Running animation
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const runSpeed = 8; // Speed of the running animation
    
    if (frontLeftLegRef.current) {
      frontLeftLegRef.current.rotation.x = Math.sin(time * runSpeed) * 0.6;
    }
    if (frontRightLegRef.current) {
      frontRightLegRef.current.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.6;
    }
    if (backLeftLegRef.current) {
      backLeftLegRef.current.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.5;
    }
    if (backRightLegRef.current) {
      backRightLegRef.current.rotation.x = Math.sin(time * runSpeed) * 0.5;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.8}>
      <group ref={groupRef} position={[0, -0.5, 0]} rotation={[0, Math.PI / 6, 0]}>
        {/* Body - Low-poly chest */}
        <mesh position={[0, 0.2, 0]} castShadow rotation={[0, 0, 0]}>
          <octahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.3}
            flatShading={true}
          />
        </mesh>

        {/* Body extension */}
        <mesh position={[0, -0.2, -0.3]} castShadow rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.9, 0.6, 1.2]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.3}
            flatShading={true}
          />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.8, 0.4]} castShadow rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.4, 0.8, 0.4]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.3}
            flatShading={true}
          />
        </mesh>

        {/* Head - Geometric faceted */}
        <mesh position={[0, 1.5, 0.6]} castShadow rotation={[0.2, 0, 0]}>
          <icosahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.3}
            flatShading={true}
          />
        </mesh>

        {/* Snout - Angular */}
        <mesh position={[0, 1.35, 1.0]} castShadow rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.3, 0.25, 0.4]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.3}
            flatShading={true}
          />
        </mesh>

        {/* Horn - Geometric twisted */}
        <mesh position={[0, 2.1, 0.5]} rotation={[-0.2, 0, 0]} castShadow>
          <coneGeometry args={[0.12, 1.0, 6]} />
          <meshStandardMaterial 
            color="#FFD700" 
            metalness={0.95} 
            roughness={0.05}
            emissive="#FFD700"
            emissiveIntensity={0.4}
            flatShading={true}
          />
        </mesh>

        {/* Horn spiral detail */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={`horn-detail-${i}`}
            position={[
              Math.cos(i * 0.8) * 0.08,
              2.1 + i * 0.15,
              0.5 + Math.sin(i * 0.8) * 0.08
            ]}
            rotation={[-0.2, i * 0.5, 0]}
            castShadow
          >
            <boxGeometry args={[0.06, 0.12, 0.06]} />
            <meshStandardMaterial 
              color="#FFD700" 
              metalness={0.95} 
              roughness={0.05}
              emissive="#FFD700"
              emissiveIntensity={0.3}
              flatShading={true}
            />
          </mesh>
        ))}

        {/* Ears - Geometric pyramids */}
        <mesh position={[-0.25, 1.85, 0.5]} rotation={[0, 0, -0.6]} castShadow>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.3}
            flatShading={true}
          />
        </mesh>
        <mesh position={[0.25, 1.85, 0.5]} rotation={[0, 0, 0.6]} castShadow>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.3}
            flatShading={true}
          />
        </mesh>

        {/* Eyes - Glowing geometric */}
        <mesh position={[-0.18, 1.55, 0.85]} castShadow>
          <octahedronGeometry args={[0.08, 0]} />
          <meshStandardMaterial 
            color="#00FFFF" 
            emissive="#00FFFF"
            emissiveIntensity={1.2}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[0.18, 1.55, 0.85]} castShadow>
          <octahedronGeometry args={[0.08, 0]} />
          <meshStandardMaterial 
            color="#00FFFF" 
            emissive="#00FFFF"
            emissiveIntensity={1.2}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Front Left Leg */}
        <mesh ref={frontLeftLegRef} position={[-0.35, -0.6, 0.3]} castShadow>
          <boxGeometry args={[0.2, 1.0, 0.2]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.3}
            flatShading={true}
          />
        </mesh>
        
        {/* Front Right Leg */}
        <mesh ref={frontRightLegRef} position={[0.35, -0.6, 0.3]} castShadow>
          <boxGeometry args={[0.2, 1.0, 0.2]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.3}
            flatShading={true}
          />
        </mesh>

        {/* Back Left Leg */}
        <mesh ref={backLeftLegRef} position={[-0.35, -0.7, -0.5]} castShadow>
          <boxGeometry args={[0.2, 0.9, 0.2]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.3}
            flatShading={true}
          />
        </mesh>

        {/* Back Right Leg */}
        <mesh ref={backRightLegRef} position={[0.35, -0.7, -0.5]} castShadow>
          <boxGeometry args={[0.2, 0.9, 0.2]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.3}
            flatShading={true}
          />
        </mesh>

        {/* Hooves - Geometric dark */}
        {[
          [-0.35, -1.15, 0.3],
          [0.35, -1.15, 0.3],
          [-0.35, -1.2, -0.5],
          [0.35, -1.2, -0.5]
        ].map((pos, i) => (
          <mesh key={`hoof-${i}`} position={pos as [number, number, number]} castShadow>
            <boxGeometry args={[0.22, 0.15, 0.22]} />
            <meshStandardMaterial 
              color="#0a0a0a" 
              metalness={0.8} 
              roughness={0.2}
              flatShading={true}
            />
          </mesh>
        ))}

        {/* Mane - Geometric shards */}
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={`mane-${i}`}
            position={[-0.1 - i * 0.05, 1.7 - i * 0.3, 0.2 - i * 0.15]}
            rotation={[0.2 + i * 0.15, 0, -0.3 - i * 0.1]}
            castShadow
          >
            <boxGeometry args={[0.15, 0.5, 0.08]} />
            <meshStandardMaterial 
              color={color} 
              metalness={0.7} 
              roughness={0.2}
              flatShading={true}
              emissive={color}
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}

        {/* Tail - Geometric flowing shards */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={`tail-${i}`}
            position={[
              Math.sin(i * 0.3) * 0.15,
              -0.2 - i * 0.2,
              -0.9 - i * 0.2
            ]}
            rotation={[0.6 + i * 0.15, Math.sin(i * 0.5) * 0.2, 0]}
            castShadow
          >
            <boxGeometry args={[0.12, 0.4, 0.06]} />
            <meshStandardMaterial 
              color={color} 
              metalness={0.7} 
              roughness={0.2}
              flatShading={true}
              emissive={color}
              emissiveIntensity={0.15}
            />
          </mesh>
        ))}

        {/* Geometric particles orbiting */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const radius = 2.2;
          const height = Math.sin(angle * 3) * 0.8;
          return (
            <mesh
              key={`particle-${i}`}
              position={[
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius,
              ]}
              rotation={[angle, angle * 2, 0]}
            >
              <octahedronGeometry args={[0.06, 0]} />
              <meshStandardMaterial 
                color={color}
                emissive={color}
                emissiveIntensity={1.0}
                metalness={0.9}
                roughness={0.1}
                transparent
                opacity={0.8}
                flatShading={true}
              />
            </mesh>
          );
        })}

        {/* Energy rings */}
        {[0, 1, 2].map((i) => (
          <mesh
            key={`ring-${i}`}
            position={[0, 0.5 + i * 0.4, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[1.2 + i * 0.3, 0.02, 6, 16]} />
            <meshStandardMaterial 
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.3 - i * 0.08}
              flatShading={true}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

export default function Unicorn3D({ color, companyName }: Unicorn3DProps) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-background to-background/50">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <spotLight
          position={[5, 5, 5]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color={color} />
        <pointLight position={[5, -3, 5]} intensity={0.3} color="#ffffff" />
        
        {/* Unicorn */}
        <UnicornModel color={color} />
        
        {/* Ground plane for shadows */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.2} />
        </mesh>
        
        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={2}
        />
      </Canvas>
    </div>
  );
}

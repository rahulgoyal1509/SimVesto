import { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const GRID_SIZE = 35; // 35x35 cubes
const SPACING = 1.1;

export function InteractiveGrid({ baseHeight = 0.25, isDark = false }) {
  const meshRef = useRef();
  const { mouse, camera } = useThree();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Make the boxes darker slate so shadows are highly visible in light mode.
  // In dark mode, make them even darker to recede into the black background.
  const baseColor = useMemo(() => new THREE.Color(isDark ? "#1e293b" : "#94a3b8"), [isDark]); 
  const activeColor = new THREE.Color("#059669"); // Emerald 600
  const scrollColor = new THREE.Color("#10b981"); // Emerald 500
  const colorObj = useMemo(() => new THREE.Color(), []);
  
  const currentHeight = useMemo(() => new Float32Array(GRID_SIZE * GRID_SIZE).fill(baseHeight), [baseHeight]);

  useEffect(() => {
    let i = 0;
    const centerOffset = (GRID_SIZE * SPACING) / 2;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        dummy.position.set(x * SPACING - centerOffset, 0, z * SPACING - centerOffset);
        dummy.scale.set(1, baseHeight, 1);
        dummy.updateMatrix();
        if (meshRef.current) {
          meshRef.current.setMatrixAt(i, dummy.matrix);
          meshRef.current.setColorAt(i, baseColor);
        }
        i++;
      }
    }
    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [dummy, baseColor, baseHeight]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollP = Math.min(scrollY / window.innerHeight, 2);

    // Dynamic camera movement on scroll
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 8 + scrollP * 3, 0.05);

    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distanceToGround = -camera.position.y / dir.y;
    const pos = camera.position.clone().add(dir.multiplyScalar(distanceToGround));

    let i = 0;
    const centerOffset = (GRID_SIZE * SPACING) / 2;
    const time = state.clock.elapsedTime;
    const scrollWaveCenter = -15 + scrollP * 35;

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const worldX = x * SPACING - centerOffset;
        const worldZ = z * SPACING - centerOffset;
        
        const dx = worldX - pos.x;
        const dz = worldZ - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        let targetHeight = baseHeight;
        let mixHover = 0;
        let mixScroll = 0;

        // Hover Peekaboo Focus
        if (dist < 4.5) {
          const influence = Math.max(0, 1 - (dist / 4.5));
          targetHeight += Math.pow(influence, 2.0) * 3.5;
          mixHover = influence;
        }

        // Scroll Wave Focus
        const diagDist = worldX * 0.4 + worldZ; 
        const distToWave = Math.abs(diagDist - scrollWaveCenter);
        if (distToWave < 6) {
          const waveInfluence = 1 - (distToWave / 6);
          targetHeight += Math.pow(waveInfluence, 2) * 2.5;
          mixScroll = waveInfluence;
        }

        // Deep ambient breathing wave
        targetHeight += Math.sin(time * 1.5 + worldX * 0.3 + worldZ * 0.3) * 0.15;

        // FASTER SNAP: Increased lerp from 0.15 to 0.4 for snap responsiveness
        currentHeight[i] = THREE.MathUtils.lerp(currentHeight[i], targetHeight, 0.4);

        dummy.position.set(worldX, currentHeight[i] / 2, worldZ);
        dummy.scale.set(0.85, Math.max(0.1, currentHeight[i]), 0.85);
        dummy.updateMatrix();

        meshRef.current.setMatrixAt(i, dummy.matrix);

        // Color blending giving focus to hover and scroll
        colorObj.copy(baseColor);
        if (mixScroll > 0) colorObj.lerp(scrollColor, mixScroll * 0.7);
        if (mixHover > 0) colorObj.lerp(activeColor, mixHover * 0.9);
        
        meshRef.current.setColorAt(i, colorObj);

        i++;
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, GRID_SIZE * GRID_SIZE]} receiveShadow castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.6} metalness={0.1} />
    </instancedMesh>
  );
}

export default function BackgroundGrid({ isDark = false, cameraOffset = false }) {
  // Use a customized fov and zoom for different pages if needed
  return (
    <Canvas
      camera={{ position: cameraOffset ? [0, 6, 12] : [0, 8, 14], fov: 42 }}
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{ 
        background: isDark 
          ? 'linear-gradient(to bottom, #0f172a 40%, #020617 100%)' 
          : 'linear-gradient(to bottom, #ffffff 40%, #f0fdf9 100%)' 
      }}
    >
      <ambientLight intensity={isDark ? 0.4 : 0.25} color="#ffffff" />
      <directionalLight
        position={[15, 25, 10]}
        intensity={2.0}
        color={isDark ? "#e2e8f0" : "#ffffff"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0001}
      />
      <pointLight position={[0, 10, 0]} intensity={isDark ? 0.8 : 0.4} color="#059669" />
      <fog attach="fog" args={[isDark ? '#020617' : '#ffffff', 5, 30]} />

      <group position={[0, -2, -8]} rotation={[0, 0, 0]}>
        <InteractiveGrid isDark={isDark} />
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[150, 150]} />
          <meshStandardMaterial color={isDark ? "#0f172a" : "#f8fafc"} roughness={1} />
        </mesh>
      </group>
    </Canvas>
  );
}

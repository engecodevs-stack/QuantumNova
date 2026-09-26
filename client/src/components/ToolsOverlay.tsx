import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import './ToolsOverlay.css';

interface ToolsOverlayProps {
  theme: 'dark' | 'light';
  onClose: () => void;
}

interface AppItem {
  name: string;
  label: string;
  username: string;
  about: string;
  url: string;
  svg: string;
}

const apps: AppItem[] = [
  { 
    name: 'whatsapp', 
    label: 'WhatsApp', 
    username: '@whatsapp',
    about: '500+ conexiones',
    url: 'https://www.whatsapp.com/',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
  },
  { 
    name: 'drive', 
    label: 'Drive', 
    username: '@googledrive',
    about: '1TB+ storage',
    url: 'https://drive.google.com/',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M7.49 2.9l-5.21 9.11 4.16 7.2 5.21-9.11L7.49 2.9zm9.02 0l-5.21 9.11 4.16 7.2 5.21-9.11L16.51 2.9zm-9.02 18.2h10.42l-4.16-7.2-5.21 9.11h4.16z"/></svg>'
  },
  { 
    name: 'gmail', 
    label: 'Gmail', 
    username: '@gmail',
    about: '50k+ emails',
    url: 'https://mail.google.com/',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-.4 4.25l-6.8 4.75c-.5.35-1.1.35-1.6 0L4.4 8.25c-.25-.17-.4-.44-.4-.75 0-.55.45-1 1-1h14c.55 0 1 .45 1 1 0 .31-.15.58-.4.75z"/></svg>'
  },
  { 
    name: 'gemini', 
    label: 'Gemini', 
    username: '@gemini_ai',
    about: 'IA avanzada',
    url: 'https://gemini.google.com/',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
  },
  { 
    name: 'github', 
    label: 'GitHub', 
    username: '@github',
    about: '100+ repos',
    url: 'https://github.com/',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.3-.535-1.52.117-3.16 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.399s2.04.132 3 .399c2.292-1.552 3.3-1.23 3.3-1.23.653 1.64.24 2.86.118 3.16.768.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.62-5.476 5.92.43.37.824 1.102.824 2.22 0 1.602-.015 2.894-.015 3.287 0 .322.216.694.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>'
  },
  { 
    name: 'pinterest', 
    label: 'Pinterest', 
    username: '@pinterest',
    about: '1k+ pins',
    url: 'https://www.pinterest.com/',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>'
  }
];

export const ToolsOverlay: React.FC<ToolsOverlayProps> = ({ theme, onClose }) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [windowDimensions, setWindowDimensions] = useState({
    w: window.innerWidth,
    h: window.innerHeight
  });

  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [renderedApps, setRenderedApps] = useState<boolean[]>(new Array(apps.length).fill(false));

  // Trigger entering animation
  useEffect(() => {
    setIsActive(true);
    document.body.style.overflow = 'hidden';

    // Radially fade in apps sequentially
    apps.forEach((_, i) => {
      setTimeout(() => {
        setRenderedApps(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 100 + i * 80);
    });

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Window Resize Listener
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        w: window.innerWidth,
        h: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Three.js scene setup
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, windowDimensions.w / windowDimensions.h, 0.1, 1000);
    camera.position.set(0, 0.8, 4.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(windowDimensions.w, windowDimensions.h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Geometry 1 (Outer Sphere)
    const radius = 1.2;
    const geometry = new THREE.IcosahedronGeometry(radius, 3);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: theme === 'light' ? 0x05a2c2 : 0x1a8cff,
      transparent: true,
      opacity: theme === 'light' ? 0.35 : 0.2
    });
    const wireframeSphere = new THREE.LineSegments(edges, material);
    scene.add(wireframeSphere);

    // Geometry 2 (Middle Sphere)
    const geometry2 = new THREE.IcosahedronGeometry(radius * 0.98, 2);
    const edges2 = new THREE.EdgesGeometry(geometry2);
    const material2 = new THREE.LineBasicMaterial({
      color: theme === 'light' ? 0x9f44d3 : 0x4da6ff,
      transparent: true,
      opacity: theme === 'light' ? 0.25 : 0.1
    });
    const wireframeInner = new THREE.LineSegments(edges2, material2);
    scene.add(wireframeInner);

    // Geometry 3 (Inner Sphere)
    const geometry3 = new THREE.IcosahedronGeometry(radius * 0.65, 1);
    const edges3 = new THREE.EdgesGeometry(geometry3);
    const material3 = new THREE.LineBasicMaterial({
      color: theme === 'light' ? 0x05a2c2 : 0x0066cc,
      transparent: true,
      opacity: theme === 'light' ? 0.2 : 0.08
    });
    const wireframeInner2 = new THREE.LineSegments(edges3, material3);
    scene.add(wireframeInner2);

    // Dot Mesh on outer sphere
    const dotGeometry = new THREE.IcosahedronGeometry(radius * 1.01, 3);
    const positions = dotGeometry.attributes.position.array;
    const dotPositions: number[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > 0) {
        dotPositions.push((x / len) * radius * 1.01);
        dotPositions.push((y / len) * radius * 1.01);
        dotPositions.push((z / len) * radius * 1.01);
      }
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    const dotMat = new THREE.PointsMaterial({
      color: theme === 'light' ? 0x05a2c2 : 0x4da6ff,
      size: 0.03,
      transparent: true,
      opacity: theme === 'light' ? 0.4 : 0.25,
      sizeAttenuation: true
    });
    const dots = new THREE.Points(dotGeo, dotMat);
    scene.add(dots);

    // Starfield background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 200;
    const starsPositions = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      const r = 8 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starsPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starsPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starsPositions[i + 2] = r * Math.cos(phi);

      const brightness = 0.3 + Math.random() * 0.5;
      if (theme === 'light') {
        starColors[i] = 0.1 * brightness;
        starColors[i + 1] = 0.35 * brightness;
        starColors[i + 2] = 0.55 * brightness;
      } else {
        starColors[i] = 0.3 * brightness;
        starColors[i + 1] = 0.5 * brightness;
        starColors[i + 2] = brightness;
      }
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.03,
      transparent: true,
      opacity: theme === 'light' ? 0.35 : 0.2,
      sizeAttenuation: true,
      vertexColors: true
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Orbit Ring
    const ringParticles = 120;
    const ringGeo = new THREE.BufferGeometry();
    const ringPos = new Float32Array(ringParticles * 3);
    for (let i = 0; i < ringParticles; i++) {
      const angle = (i / ringParticles) * Math.PI * 2;
      const rad = radius * 1.6 + Math.sin(i * 0.5) * 0.2;
      ringPos[i * 3] = Math.cos(angle) * rad;
      ringPos[i * 3 + 1] = Math.sin(angle * 0.7) * 0.3;
      ringPos[i * 3 + 2] = Math.sin(angle) * rad;
    }
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
    const ringMat = new THREE.PointsMaterial({
      color: theme === 'light' ? 0x9f44d3 : 0x4da6ff,
      size: 0.02,
      transparent: true,
      opacity: theme === 'light' ? 0.3 : 0.15,
      sizeAttenuation: true
    });
    const ring = new THREE.Points(ringGeo, ringMat);
    scene.add(ring);

    let animationId: number;

    const animate = () => {
      const elapsedTime = performance.now() * 0.0003;

      wireframeSphere.rotation.y = elapsedTime * 0.15;
      wireframeSphere.rotation.x = Math.sin(elapsedTime * 0.08) * 0.1;
      wireframeSphere.rotation.z = Math.cos(elapsedTime * 0.06) * 0.05;

      wireframeInner.rotation.y = elapsedTime * 0.12;
      wireframeInner.rotation.x = Math.sin(elapsedTime * 0.07) * 0.08;
      wireframeInner.rotation.z = Math.cos(elapsedTime * 0.05) * 0.04;

      wireframeInner2.rotation.y = elapsedTime * 0.18;
      wireframeInner2.rotation.x = Math.sin(elapsedTime * 0.09) * 0.12;
      wireframeInner2.rotation.z = Math.cos(elapsedTime * 0.07) * 0.06;

      dots.rotation.y = elapsedTime * 0.15;
      dots.rotation.x = Math.sin(elapsedTime * 0.08) * 0.1;

      ring.rotation.y = elapsedTime * 0.08;
      ring.rotation.x = Math.sin(elapsedTime * 0.04) * 0.05;

      stars.rotation.y = elapsedTime * 0.005;
      stars.rotation.x = Math.sin(elapsedTime * 0.003) * 0.01;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      // Dispose materials & geometries
      geometry.dispose();
      edges.dispose();
      material.dispose();
      geometry2.dispose();
      edges2.dispose();
      material2.dispose();
      geometry3.dispose();
      edges3.dispose();
      material3.dispose();
      dotGeometry.dispose();
      dotGeo.dispose();
      dotMat.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    };
  }, [windowDimensions.w, windowDimensions.h, theme]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsActive(false);
    setTimeout(() => {
      onClose();
    }, 600); // Wait for transition animation
  };

  const handleIconClick = (e: React.MouseEvent, appName: string) => {
    e.stopPropagation();
    if (selectedApp === appName) {
      setSelectedApp(null);
    } else {
      setSelectedApp(appName);
    }
  };

  // Coordinates calculation for responsive radial layouts
  const { w, h } = windowDimensions;
  const baseSize = Math.min(w, h) * 0.75;
  const rad = Math.min(baseSize * 0.42, 300);
  const centerX = w / 2;
  const centerY = h / 2;

  return (
    <div className={`quantum-overlay ${isActive ? 'active' : ''}`} onClick={handleClose}>
      <button className="close-btn" onClick={handleClose}>✕</button>

      <div className="quantum-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Overlay Background */}
        <div className="overlay-background">
          <div className="line-pattern"></div>
          <div className="grid-pattern"></div>
          <div className="glow-orbs">
            <div className="orb"></div>
            <div className="orb"></div>
            <div className="orb"></div>
          </div>
        </div>

        {/* Three.js container */}
        <div ref={canvasRef} id="canvas-container"></div>

        {/* SVG connection lines layer */}
        <div id="svg-layer">
          <svg viewBox="-500 -500 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glowLines" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#30B0C7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#AF52DE" stopOpacity="0.15" />
              </linearGradient>
              <radialGradient id="centerGlow">
                <stop offset="0%" stopColor="#30B0C7" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#AF52DE" stopOpacity="0" />
              </radialGradient>
            </defs>

            <circle cx="0" cy="0" r="200" fill="url(#centerGlow)" />

            <g stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" fill="none">
              <circle cx="0" cy="0" r="150" />
              <circle cx="0" cy="0" r="280" strokeDasharray="3 6" stroke="rgba(255,255,255,0.03)" />
              <circle cx="0" cy="0" r="400" strokeDasharray="2 8" stroke="rgba(255,255,255,0.02)" />
            </g>

            {/* Glowing lines connecting apps */}
            <g filter="url(#glowLines)" stroke="url(#lineGrad)" strokeWidth="1.5" fill="none" opacity="0.4">
              <line x1="280" y1="0" x2="198" y2="198" />
              <line x1="198" y1="198" x2="0" y2="280" />
              <line x1="0" y1="280" x2="-198" y2="198" />
              <line x1="-198" y1="198" x2="-280" y2="0" />
              <line x1="-280" y1="0" x2="-198" y2="-198" />
              <line x1="-198" y1="-198" x2="0" y2="-280" />
              <line x1="0" y1="-280" x2="198" y2="-198" />
              <line x1="198" y1="-198" x2="280" y2="0" />
            </g>

            {/* Radial lines from center */}
            <g filter="url(#glowLines)" stroke="rgba(48, 176, 199, 0.15)" strokeWidth="1" fill="none">
              <line x1="0" y1="0" x2="280" y2="0" />
              <line x1="0" y1="0" x2="198" y2="198" />
              <line x1="0" y1="0" x2="0" y2="280" />
              <line x1="0" y1="0" x2="-198" y2="198" />
              <line x1="0" y1="0" x2="-280" y2="0" />
              <line x1="0" y1="0" x2="-198" y2="-198" />
              <line x1="0" y1="0" x2="0" y2="-280" />
              <line x1="0" y1="0" x2="198" y2="-198" />
            </g>

            {/* Particle pulses moving along lines */}
            <g fill="#1a8cff" opacity="0.4">
              <circle cx="70" cy="0" r="2.5">
                <animate attributeName="cx" values="280;0;280" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="50" cy="50" r="2">
                <animate attributeName="cx" values="198;0;198" dur="3.2s" repeatCount="indefinite" />
                <animate attributeName="cy" values="198;0;198" dur="3.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="70" r="2.5">
                <animate attributeName="cy" values="280;0;280" dur="3.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="-50" cy="50" r="2">
                <animate attributeName="cx" values="-198;0;-198" dur="3.8s" repeatCount="indefinite" />
                <animate attributeName="cy" values="198;0;198" dur="3.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="-70" cy="0" r="2.5">
                <animate attributeName="cx" values="-280;0;-280" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="-50" cy="-50" r="2">
                <animate attributeName="cx" values="-198;0;-198" dur="4.2s" repeatCount="indefinite" />
                <animate attributeName="cy" values="-198;0;-198" dur="4.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="4.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="-70" r="2.5">
                <animate attributeName="cy" values="-280;0;-280" dur="3.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3.3s" repeatCount="indefinite" />
              </circle>
              <circle cx="50" cy="-50" r="2">
                <animate attributeName="cx" values="198;0;198" dur="3.6s" repeatCount="indefinite" />
                <animate attributeName="cy" values="-198;0;-198" dur="3.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3.6s" repeatCount="indefinite" />
              </circle>
            </g>

            <circle cx="190" cy="-110" r="6" fill="rgba(26,140,255,0.1)" stroke="rgba(26,140,255,0.15)" stroke-width="1" />
            <circle cx="188" cy="-112" r="2" fill="rgba(0,102,204,0.2)" />
          </svg>
        </div>

        {/* Info panel */}
        <div className="info-panel">
          <h2>✦ <span>QuantumNova</span> · Synapse</h2>
          <p>Conecta tus herramientas digitales. Cada app es un nodo en tu ecosistema de conocimiento.</p>
          <div>
            <span className="tag">✦ Conexiones</span>
            <span className="tag blue">↗ Sinapsis</span>
            <span className="tag">⬡ Ecosistema</span>
          </div>
        </div>

        {/* Interactive App Nodes */}
        <div className="app-grid" id="appGrid">
          {apps.map((app, i) => {
            const angle = (i / apps.length) * Math.PI * 2 - Math.PI / 2;
            const x = centerX + rad * Math.cos(angle);
            const y = centerY + rad * Math.sin(angle);

            const isVisible = renderedApps[i];
            const isSel = selectedApp === app.name;

            return (
              <div
                key={app.name}
                className={`tooltip-container ${isVisible ? 'visible' : ''} ${isSel ? 'selected' : ''}`}
                data-app={app.name}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={(e) => handleIconClick(e, app.name)}
              >
                {/* Tooltip detail card */}
                <div className="tooltip">
                  <div className="profile">
                    <div className="user">
                      <div className="img">{app.label.charAt(0)}</div>
                      <div className="details">
                        <div className="name">{app.label}</div>
                        <div className="username">{app.username}</div>
                      </div>
                    </div>
                    <div className="about">{app.about}</div>
                  </div>
                </div>

                {/* Floating app icon layers */}
                <div className="text">
                  <a
                    className="icon"
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Let it navigate when clicking the link, otherwise it toggles select
                  >
                    <div className="layer">
                      {[0, 1, 2, 3, 4].map((s) => (
                        <span key={s} />
                      ))}
                      <span className="appSVG" dangerouslySetInnerHTML={{ __html: app.svg }} />
                    </div>
                    <div className="text">{app.label}</div>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div id="subtitle">CONNECT YOUR TOOLS · SYNAPSE AI · ECOSYSTEM</div>
      </div>
    </div>
  );
};

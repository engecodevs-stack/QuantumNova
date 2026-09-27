import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import type { Note } from '../types';
import { getApiUrl } from '../config/api';


interface MindMapViewProps {
  onNodeClick: (noteId: string) => void;
  notes: Note[];
  theme: 'dark' | 'light';
}

interface SimNode {
  id: string;
  title: string;
  tags: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isFolder: boolean;
  folderId?: string;
  noteCount?: number;
  width: number;
  height: number;
}

interface SimLink {
  id: string;
  sourceId: string;
  targetId: string;
  source: SimNode;
  target: SimNode;
  label: string;
  isManual: boolean;
  isImplicit?: boolean;
}

export const MindMapView: React.FC<MindMapViewProps> = ({
  onNodeClick,
  notes,
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [graphSearch, setGraphSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Viewport direct DOM ref for sync with popups (bypasses React renders at 60fps for fluidity)
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Interaction Tooltips
  const [activeLinkPopover, setActiveLinkPopover] = useState<{
    linkId: string;
    x: number;
    y: number;
  } | null>(null);
  const [linkLabelInput, setLinkLabelInput] = useState('');

  const [activeCreateLinkPopover, setActiveCreateLinkPopover] = useState<{
    sourceId: string;
    targetId: string;
    x: number;
    y: number;
  } | null>(null);
  const [createLinkLabelInput, setCreateLinkLabelInput] = useState('');

  // Physics Simulation Refs
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const draggedNodeIdRef = useRef<string | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);
  const hoveredLinkIdRef = useRef<string | null>(null);
  const connectionSuggestionRef = useRef<{ sourceId: string; targetId: string } | null>(null);
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const starsRef = useRef<{ x: number; y: number; size: number; speed: number; phase: number }[]>([]);

  // Viewport Control Refs
  const panXRef = useRef<number>(0);
  const panYRef = useRef<number>(0);
  const zoomRef = useRef<number>(0.95);
  const targetPanXRef = useRef<number>(0);
  const targetPanYRef = useRef<number>(0);
  const targetZoomRef = useRef<number>(0.95);

  // Mouse states for Pan/Drag
  const isMouseDownRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);
  const lastMouseYRef = useRef<number>(0);
  const isDraggingNodeRef = useRef<boolean>(false);


  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Helper to generate dynamic HSL colors based on note ID (each node gets its own unique color)
  const getNodeColor = (note: Note, isLight: boolean) => {
    let hash = 0;
    const seed = note.id;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    if (isLight) {
      return `hsl(${hue}, 75%, 45%)`; // Legible colors for light background
    } else {
      return `hsl(${hue}, 85%, 65%)`; // Vibrant neon colors for dark background
    }
  };

  // Convert client coordinates to graph coordinate space
  const getGraphCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: clientX, y: clientY };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panXRef.current) / zoomRef.current,
      y: (clientY - rect.top - panYRef.current) / zoomRef.current
    };
  };

  // Search filter check
  const matchesSearch = (node: SimNode) => {
    if (!graphSearch.trim()) return true;
    const query = graphSearch.toLowerCase();
    return (
      node.title.toLowerCase().includes(query) ||
      node.tags.some(tag => tag.toLowerCase().includes(query))
    );
  };

  // Fallback roundRect for older canvas API environments
  const drawRoundRectFallback = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  };

  // Map backend structures into simulation nodes/edges
  const fetchGraphData = async () => {
    try {
      setIsLoading(true);


      const response = await fetch(getApiUrl('/graph'));
      if (!response.ok) throw new Error('Network response error');
      const data = await response.json();

      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;
      const centerX = width / 2;
      const centerY = height / 2;

      // Keep coordinates of existing nodes
      const existingPosMap: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
      simNodesRef.current.forEach(n => {
        existingPosMap[n.id] = { x: n.x, y: n.y, vx: n.vx, vy: n.vy };
      });

      // 1. Pre-calculate degrees of explicit connections for node scaling
      const degrees: Record<string, number> = {};
      notes.forEach(n => { degrees[n.id] = 0; });
      data.edges.forEach((edge: any) => {
        if (edge.source && edge.target && edge.source !== edge.target) {
          if (degrees[edge.source] !== undefined) degrees[edge.source]++;
          if (degrees[edge.target] !== undefined) degrees[edge.target]++;
        }
      });

      const newNodes: SimNode[] = [];

      // Map Note Nodes directly (every note has its own node on the canvas)
      notes.forEach((note, idx) => {
        const simId = note.id;

        // Dynamic size and color based on degree and tags
        const degree = degrees[simId] || 0;
        const radius = 7 + Math.min(11, degree * 1.5);
        const color = getNodeColor(note, theme === 'light');
        const folderId = note.folderId || (note.folder ? note.folder.id : null);

        const existing = existingPosMap[simId];

        // Layout organically on first load
        let initX = centerX;
        let initY = centerY;
        const angle = (idx / notes.length) * 2 * Math.PI;
        const dist = 120 + Math.random() * 80;
        initX = centerX + Math.cos(angle) * dist;
        initY = centerY + Math.sin(angle) * dist;

        const title = note.title;

        newNodes.push({
          id: simId,
          title,
          tags: note.tags || [],
          x: existing ? existing.x : initX,
          y: existing ? existing.y : initY,
          vx: existing ? existing.vx : 0,
          vy: existing ? existing.vy : 0,
          radius,
          color,
          isFolder: false,
          folderId: folderId || undefined,
          width: radius * 2,
          height: radius * 2
        });
      });

      // Map Explicit Links
      const linkMap: Record<string, SimLink> = {};
      data.edges.forEach((edge: any) => {
        const sourceMapped = edge.source;
        const targetMapped = edge.target;

        if (sourceMapped && targetMapped && sourceMapped !== targetMapped) {
          const sNode = newNodes.find(n => n.id === sourceMapped);
          const tNode = newNodes.find(n => n.id === targetMapped);

          if (sNode && tNode) {
            const linkKey = sourceMapped < targetMapped 
              ? `${sourceMapped}_${targetMapped}` 
              : `${targetMapped}_${sourceMapped}`;

            if (!linkMap[linkKey]) {
              linkMap[linkKey] = {
                id: edge.id,
                sourceId: sourceMapped,
                targetId: targetMapped,
                source: sNode,
                target: tNode,
                label: edge.label || '',
                isManual: edge.isManual || false,
                isImplicit: false
              };
            }
          }
        }
      });

      // Generate implicit semantic links (shared tags and title mentions)
      newNodes.forEach((nodeA) => {
        let implicitCount = 0;

        newNodes.forEach((nodeB) => {
          if (nodeA.id === nodeB.id) return;

          const linkKey = nodeA.id < nodeB.id ? `${nodeA.id}_${nodeB.id}` : `${nodeB.id}_${nodeA.id}`;
          if (linkMap[linkKey]) return; // already connected explicitly

          const noteAData = notes.find(n => n.id === nodeA.id);
          const noteBData = notes.find(n => n.id === nodeB.id);
          if (!noteAData || !noteBData) return;

          let isRelated = false;
          let relationLabel = '';

          const titleA = noteAData.title.toLowerCase().trim();
          const titleB = noteBData.title.toLowerCase().trim();

          // Check 1: Title mention in content
          if (titleB.length > 3 && noteAData.content.toLowerCase().includes(titleB)) {
            isRelated = true;
            relationLabel = 'menciona';
          } else if (titleA.length > 3 && noteBData.content.toLowerCase().includes(titleA)) {
            isRelated = true;
            relationLabel = 'mencionado en';
          }

          // Check 2: Shared tags (only up to 2 semantic connections per node to reduce noise)
          if (!isRelated && noteAData.tags && noteBData.tags) {
            const sharedTags = noteAData.tags.filter(t => noteBData.tags.includes(t));
            if (sharedTags.length > 0 && implicitCount < 2) {
              isRelated = true;
              relationLabel = `#${sharedTags[0]}`;
              implicitCount++;
            }
          }

          if (isRelated) {
            linkMap[linkKey] = {
              id: `implicit_${linkKey}`,
              sourceId: nodeA.id,
              targetId: nodeB.id,
              source: nodeA,
              target: nodeB,
              label: relationLabel,
              isManual: false,
              isImplicit: true
            };
          }
        });
      });

      simNodesRef.current = newNodes;
      simLinksRef.current = Object.values(linkMap);

      if (newNodes.length > 0 && panXRef.current === 0 && panYRef.current === 0) {
        centerGraph(newNodes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, [notes]);

  // Generate background starry field stars
  useEffect(() => {
    const stars = [];
    const starCount = 150;
    const w = 1920;
    const h = 1080;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 0.4 + Math.random() * 1.1,
        speed: 0.001 + Math.random() * 0.002,
        phase: Math.random() * Math.PI * 2
      });
    }
    starsRef.current = stars;
  }, []);

  const centerGraph = (nodesToCenter: SimNode[]) => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const xs = nodesToCenter.map(n => n.x);
    const ys = nodesToCenter.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;

    targetPanXRef.current = width / 2 - graphCenterX * targetZoomRef.current;
    targetPanYRef.current = height / 2 - graphCenterY * targetZoomRef.current;
  };

  // Golden spiral phyllotaxis auto arrange (most connected hubs in center, others spiral out)
  const handleAutoArrange = () => {
    const nodes = simNodesRef.current;
    if (nodes.length === 0) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const links = simLinksRef.current;
    const degrees: Record<string, number> = {};
    nodes.forEach(n => { degrees[n.id] = 0; });
    links.forEach(l => {
      if (degrees[l.sourceId] !== undefined) degrees[l.sourceId]++;
      if (degrees[l.targetId] !== undefined) degrees[l.targetId]++;
    });

    // Sort by degree descending
    const sortedNodes = [...nodes].sort((a, b) => degrees[b.id] - degrees[a.id]);

    sortedNodes.forEach((node, index) => {
      if (index === 0) {
        node.x = centerX;
        node.y = centerY;
      } else {
        // Golden ratio angle spiral distribution
        const phi = index * 137.5 * (Math.PI / 180);
        const radius = phi * 2.8 + 55;
        node.x = centerX + Math.cos(phi) * radius;
        node.y = centerY + Math.sin(phi) * radius;
      }
      node.vx = 0;
      node.vy = 0;
    });

    centerGraph(nodes);
  };

  // Helper: check perpendicular distance from point to segment
  const getDistanceToSegment = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Force simulation + Canvas draw loop
  useEffect(() => {
    let animationId: number;

    const updatePhysicsAndDraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationId = requestAnimationFrame(updatePhysicsAndDraw);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Force Calculations
      const nodes = simNodesRef.current;
      const links = simLinksRef.current;

      const kRepulsion = 2800; // Stronger node repulsion to space them out
      const kAttraction = 0.032; // Softer attraction force
      const naturalLength = 150; // Larger connection target distance
      const gravity = 0.0028; // Lower center gravity to pull nodes less aggressively
      const friction = 0.82;

      // Repulsion between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

          // Normal inverse-square repulsion
          const force = kRepulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (nodeA.id !== draggedNodeIdRef.current) {
            nodeA.vx += fx;
            nodeA.vy += fy;
          }
          if (nodeB.id !== draggedNodeIdRef.current) {
            nodeB.vx -= fx;
            nodeB.vy -= fy;
          }
        }
      }

      // Link attraction forces
      links.forEach(link => {
        const s = link.source;
        const t = link.target;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        const force = kAttraction * (dist - naturalLength);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (s.id !== draggedNodeIdRef.current) {
          s.vx += fx;
          s.vy += fy;
        }
        if (t.id !== draggedNodeIdRef.current) {
          t.vx -= fx;
          t.vy -= fy;
        }
      });

      // Gravity and velocity updates
      nodes.forEach(node => {
        if (node.id === draggedNodeIdRef.current) return;

        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx += dx * gravity;
        node.vy += dy * gravity;

        // Velocity Clamping to prevent graph explosions
        const maxSpeed = 10;
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > maxSpeed) {
          node.vx = (node.vx / speed) * maxSpeed;
          node.vy = (node.vy / speed) * maxSpeed;
        }

        node.x += node.vx;
        node.y += node.vy;

        node.vx *= friction;
        node.vy *= friction;
      });

      // Circle Collision / Overlap Resolver (Run 3 iterations for stability)
      for (let k = 0; k < 3; k++) {
        for (let i = 0; i < nodes.length; i++) {
          const nodeA = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeB = nodes[j];
            const dx = nodeA.x - nodeB.x;
            const dy = nodeA.y - nodeB.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

            const minDist = nodeA.radius + nodeB.radius + 38; // Increased padding to prevent overlap clumping
            if (dist < minDist) {
              const overlap = minDist - dist;
              const pushX = (dx / dist) * overlap * 0.5;
              const pushY = (dy / dist) * overlap * 0.5;

              if (nodeA.id !== draggedNodeIdRef.current) {
                nodeA.x += pushX;
                nodeA.y += pushY;
              }
              if (nodeB.id !== draggedNodeIdRef.current) {
                nodeB.x -= pushX;
                nodeB.y -= pushY;
              }
            }
          }
        }
      }

      // 2. Viewport Panning / Zooming Interpolation (Inertia)
      panXRef.current += (targetPanXRef.current - panXRef.current) * 0.12;
      panYRef.current += (targetPanYRef.current - panYRef.current) * 0.12;
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.12;

      // Sync viewport directly to DOM overlay to bypass React render and avoid 60fps lag
      if (overlayRef.current) {
        overlayRef.current.style.transform = `translate3d(${panXRef.current}px, ${panYRef.current}px, 0) scale(${zoomRef.current})`;
      }

      // 3. Drawing
      ctx.clearRect(0, 0, width * dpr, height * dpr);

      ctx.save();
      ctx.scale(dpr, dpr); // scale by DPR for subpixel vector rendering (Retina/4K)

      const isLight = theme === 'light';
      
      // Cosmic radial gradient background for map
      if (!isLight) {
        const radGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, Math.max(width, height) * 0.85);
        radGrad.addColorStop(0, '#0a091a');  // Deep cosmic indigo core
        radGrad.addColorStop(0.5, '#05050b'); // Dark space blue
        radGrad.addColorStop(1, '#020204');   // Infinite dark space
        ctx.fillStyle = radGrad;
      } else {
        ctx.fillStyle = '#F5F5F7';
      }
      ctx.fillRect(0, 0, width, height);

      // Starfield drawing with parallax panning (only in dark mode)
      if (!isLight) {
        ctx.fillStyle = '#FFFFFF';
        starsRef.current.forEach(star => {
          let sx = (star.x + panXRef.current * 0.22) % width;
          let sy = (star.y + panYRef.current * 0.22) % height;
          if (sx < 0) sx += width;
          if (sy < 0) sy += height;

          const opacity = 0.12 + Math.sin(Date.now() * star.speed + star.phase) * 0.12;
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.arc(sx, sy, star.size, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        });
      }

      // Premium dot grid instead of grid lines
      ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.04)';
      const gridSize = 40;
      const startX = panXRef.current % (gridSize * zoomRef.current);
      const startY = panYRef.current % (gridSize * zoomRef.current);

      for (let x = startX; x < width; x += gridSize * zoomRef.current) {
        for (let y = startY; y < height; y += gridSize * zoomRef.current) {
          ctx.beginPath();
          ctx.arc(x, y, 0.65 * zoomRef.current, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Transform context to Graph space
      ctx.save();
      ctx.translate(panXRef.current, panYRef.current);
      ctx.scale(zoomRef.current, zoomRef.current);

      // Focus State Helper
      const activeFocusId = selectedNodeId || hoveredNodeIdRef.current;
      const isFocusActive = activeFocusId !== null;

      const isNodeFocused = (nodeId: string) => {
        if (!isFocusActive) return true;
        if (nodeId === activeFocusId) return true;
        return links.some(l => 
          (l.sourceId === activeFocusId && l.targetId === nodeId) ||
          (l.targetId === activeFocusId && l.sourceId === nodeId)
        );
      };

      const isLinkFocused = (link: SimLink) => {
        if (hoveredLinkIdRef.current !== null) {
          return link.id === hoveredLinkIdRef.current;
        }
        if (!isFocusActive) return true;
        return link.sourceId === activeFocusId || link.targetId === activeFocusId;
      };

      // A. DRAW CONNECTIONS (GRADIENT CURVED EDGES)
      links.forEach(link => {
        const s = link.source;
        const t = link.target;
        
        // Curve control point calculation
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        const offset = Math.min(30, dist * 0.12);
        const nx = -dy / dist;
        const ny = dx / dist;
        const cx = mx + nx * offset;
        const cy = my + ny * offset;

        const isFocused = isLinkFocused(link);
        const isSearched = graphSearch.trim().length > 0;
        
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.quadraticCurveTo(cx, cy, t.x, t.y);

        if (isFocused) {
          // Glow on focused link
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#007AFF';
          const grad = ctx.createLinearGradient(s.x, s.y, t.x, t.y);
          grad.addColorStop(0, '#007AFF');
          grad.addColorStop(1, '#AF52DE'); // Blue to purple gradient
          ctx.strokeStyle = grad;
          
          ctx.lineWidth = link.isImplicit ? 1.2 : 2.2;
          if (link.isImplicit) {
            ctx.setLineDash([3, 3]);
          }
        } else if (isFocusActive || isSearched) {
          ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.012)' : 'rgba(255, 255, 255, 0.012)';
          ctx.lineWidth = 0.5;
        } else {
          // Default soft gradient curve
          const grad = ctx.createLinearGradient(s.x, s.y, t.x, t.y);
          const opacity = link.isImplicit ? 0.08 : 0.22;
          grad.addColorStop(0, hexToRgba('#007AFF', opacity));
          grad.addColorStop(1, hexToRgba('#30B0C7', opacity)); // Blue to Teal gradient
          ctx.strokeStyle = grad;

          ctx.lineWidth = link.isImplicit ? 0.6 : 1.0;
          if (link.isImplicit) {
            ctx.setLineDash([3, 3]);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
        ctx.shadowBlur = 0; // Reset shadow

        // Flowing particles along connections (Neural synapse effect)
        const time = Date.now();
        if (isFocused) {
          // Focused: Draw multiple bright flowing particles
          const particleCount = 2;
          for (let pIdx = 0; pIdx < particleCount; pIdx++) {
            const speed = 0.002 + pIdx * 0.0006;
            const offsetFraction = pIdx * 0.5;
            const u = (time * speed + (link.id.charCodeAt(0) % 10) * 0.08 + offsetFraction) % 1.0;
            const invU = 1 - u;
            const px = invU * invU * s.x + 2 * invU * u * cx + u * u * t.x;
            const py = invU * invU * s.y + 2 * invU * u * cy + u * u * t.y;

            ctx.shadowBlur = 6;
            ctx.shadowColor = '#007AFF';
            ctx.fillStyle = '#FFFFFF'; // Bright core
            ctx.beginPath();
            ctx.arc(px, py, 2.8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else if (!isFocusActive && !isSearched) {
          // Non-focused base link: draw single subtle floating particle
          const u = (time * 0.0012 + (link.id.charCodeAt(0) % 10) * 0.1) % 1.0;
          const invU = 1 - u;
          const px = invU * invU * s.x + 2 * invU * u * cx + u * u * t.x;
          const py = invU * invU * s.y + 2 * invU * u * cy + u * u * t.y;

          ctx.fillStyle = isLight ? 'rgba(0, 122, 255, 0.22)' : 'rgba(48, 176, 199, 0.35)';
          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Draw relation label in middle of curve (Sleek Rounded Capsule)
        if (isFocused && link.label) {
          ctx.font = '500 8.5px Inter, sans-serif';
          const xMid = 0.25 * s.x + 0.5 * cx + 0.25 * t.x;
          const yMid = 0.25 * s.y + 0.5 * cy + 0.25 * t.y;

          const txtW = ctx.measureText(link.label).width;
          const padX = 6;
          const cw = txtW + padX * 2;
          const ch = 13;
          const rx_mid = xMid - cw / 2;
          const ry_mid = yMid - ch / 2;

          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(22, 22, 30, 0.95)';
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(rx_mid, ry_mid, cw, ch, 65);
          } else {
            drawRoundRectFallback(ctx, rx_mid, ry_mid, cw, ch, 6);
          }
          ctx.fill();

          ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 0.8;
          ctx.stroke();

          ctx.fillStyle = isLight ? '#007AFF' : '#30B0C7';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(link.label, xMid, yMid);
        }
      });

      // B. DRAW TEMPORARY SUGGESTION LINE
      if (connectionSuggestionRef.current) {
        const { sourceId, targetId } = connectionSuggestionRef.current;
        const sNode = nodes.find(n => n.id === sourceId);
        const tNode = nodes.find(n => n.id === targetId);

        if (sNode && tNode) {
          ctx.beginPath();
          ctx.moveTo(sNode.x, sNode.y);
          ctx.quadraticCurveTo((sNode.x + tNode.x)/2 + 15, (sNode.y + tNode.y)/2 - 15, tNode.x, tNode.y);
          ctx.strokeStyle = '#007AFF';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.lineDashOffset = -Math.floor(Date.now() / 40) % 20;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // C. DRAW NODES (Innovative Concentric Star Nodes & Radar Sweep Scan)
      nodes.forEach(node => {
        const matchesQuery = matchesSearch(node);
        const isSearched = graphSearch.trim().length > 0;
        
        const isSelected = node.id === selectedNodeId;
        const isHoveredNode = node.id === hoveredNodeIdRef.current;
        const isFocused = isNodeFocused(node.id);

        // Opacity mapping
        let opacity = 1.0;
        if (isSearched) {
          opacity = matchesQuery ? 1.0 : 0.15;
        } else if (isFocusActive) {
          opacity = isFocused ? 1.0 : 0.15;
        }

        ctx.save();
        ctx.globalAlpha = opacity;

        // 1. Draw 4-point constellation star-cross sparkle behind active nodes
        if (isSelected || isHoveredNode) {
          ctx.strokeStyle = hexToRgba(node.color, 0.35);
          ctx.lineWidth = 0.8;
          
          // Horizontal line
          ctx.beginPath();
          ctx.moveTo(node.x - node.radius * 2.2, node.y);
          ctx.lineTo(node.x + node.radius * 2.2, node.y);
          ctx.stroke();

          // Vertical line
          ctx.beginPath();
          ctx.moveTo(node.x, node.y - node.radius * 2.2);
          ctx.lineTo(node.x, node.y + node.radius * 2.2);
          ctx.stroke();
        }

        // 2. Draw animated pulse ripple ring around selected/hovered nodes
        if (isSelected || isHoveredNode) {
          const tCycle = (Date.now() % 1600) / 1600;
          const pulseRadius = node.radius + 3 + tCycle * 10;
          const pulseOpacity = 1 - tCycle;

          ctx.strokeStyle = hexToRgba(node.color, pulseOpacity * 0.45);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
          ctx.stroke();
        }

        // 3. Draw shadow/glow on hover/selection
        if (isSelected || isHoveredNode) {
          ctx.shadowBlur = isSelected ? 18 : 10;
          ctx.shadowColor = node.color;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        } else {
          ctx.shadowBlur = 4;
          ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.08)' : hexToRgba(node.color, 0.25);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1.0;
        }

        // 4. Draw Outer Corona (Translucent Halo)
        ctx.fillStyle = hexToRgba(node.color, 0.14);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        ctx.fill();

        // 5. Draw Concentric Border Ring
        ctx.strokeStyle = hexToRgba(node.color, isSelected || isHoveredNode ? 0.75 : 0.35);
        ctx.lineWidth = isSelected ? 1.8 : (isHoveredNode ? 1.2 : 0.7);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        ctx.stroke();

        // 6. Draw Rotating Radar Sweep Arc (Cybernetic scanning ring)
        const sweepSpeed = 0.0012 + (node.id.charCodeAt(0) % 4) * 0.0004;
        const sweepAngle = (Date.now() * sweepSpeed) % (Math.PI * 2);
        ctx.strokeStyle = isSelected || isHoveredNode ? '#FFFFFF' : node.color;
        ctx.lineWidth = isSelected ? 2.0 : (isHoveredNode ? 1.5 : 1.0);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, sweepAngle, sweepAngle + (Math.PI * 0.45)); // 80 degree arc
        ctx.stroke();

        // 7. Draw Solid Core Nucleus
        const coreRadius = Math.max(3.0, node.radius * 0.42);
        ctx.fillStyle = isSelected || isHoveredNode ? '#FFFFFF' : node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, coreRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;

        // 5. Draw Text Label centered below the circle
        ctx.save();
        ctx.font = isSelected || isHoveredNode ? '600 10.5px Inter, sans-serif' : '500 8.5px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const labelY = node.y + node.radius + 6;

        // Draw a tiny semi-transparent capsule background behind text on hover/selection to make it stand out
        if (isSelected || isHoveredNode) {
          const textW = ctx.measureText(node.title).width;
          const padX = 6;
          const padY = 3;
          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(10, 10, 15, 0.85)';
          ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(
              node.x - textW / 2 - padX,
              labelY - padY,
              textW + padX * 2,
              12 + padY * 2,
              6
            );
          } else {
            drawRoundRectFallback(
              ctx,
              node.x - textW / 2 - padX,
              labelY - padY,
              textW + padX * 2,
              12 + padY * 2,
              6
            );
          }
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = isLight ? '#007AFF' : '#FFFFFF';
          ctx.fillText(node.title, node.x, labelY);
        } else {
          // Hide normal text labels when zoomed out to reduce clumping and clutter
          const showNormalLabels = zoomRef.current > 0.7;
          if (showNormalLabels) {
            // Truncate long titles to prevent overlap issues
            const displayName = node.title.length > 13 ? node.title.slice(0, 11) + '...' : node.title;

            // Plain text with subtle outline/glow for legibility against connections
            ctx.strokeStyle = isLight ? '#F5F5F7' : '#050507';
            ctx.lineWidth = 2.5;
            ctx.strokeText(displayName, node.x, labelY);
            ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.75)' : 'rgba(245, 245, 247, 0.75)';
            ctx.fillText(displayName, node.x, labelY);
          }
        }
        ctx.restore();

        ctx.restore();
      });

      ctx.restore(); // Restores graph zoom/pan scale

      ctx.restore(); // Restores DPR scale

      animationId = requestAnimationFrame(updatePhysicsAndDraw);
    };

    animationId = requestAnimationFrame(updatePhysicsAndDraw);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [theme, selectedNodeId]);

  // Handle Resize with High-DPI resolution (Retina/4K) scaling support to prevent pixelation
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const dpr = window.devicePixelRatio || 1;
        const w = container.clientWidth;
        const h = container.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mouse coordinate mappings
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    lastMouseXRef.current = e.clientX;
    lastMouseYRef.current = e.clientY;
    isDraggingNodeRef.current = false;

    const graphCoords = getGraphCoords(e.clientX, e.clientY);

    // Check if clicked close to a circular node boundary
    const clickedNode = simNodesRef.current.find(n => {
      const dx = graphCoords.x - n.x;
      const dy = graphCoords.y - n.y;
      const hitRadius = Math.max(14, n.radius + 6);
      return dx * dx + dy * dy <= hitRadius * hitRadius;
    });

    if (clickedNode) {
      draggedNodeIdRef.current = clickedNode.id;
      dragStartOffsetRef.current = {
        x: graphCoords.x - clickedNode.x,
        y: graphCoords.y - clickedNode.y
      };
    } else {
      draggedNodeIdRef.current = null;
      // Close popovers and deselect on background click
      setActiveLinkPopover(null);
      setActiveCreateLinkPopover(null);
      setSelectedNodeId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const graphCoords = getGraphCoords(e.clientX, e.clientY);

    if (isMouseDownRef.current) {
      if (draggedNodeIdRef.current) {
        isDraggingNodeRef.current = true;
        const node = simNodesRef.current.find(n => n.id === draggedNodeIdRef.current);
        if (node) {
          node.x = graphCoords.x - dragStartOffsetRef.current.x;
          node.y = graphCoords.y - dragStartOffsetRef.current.y;
          node.vx = 0;
          node.vy = 0;

          // Drag-to-connect proximity check
          let closestNode: SimNode | null = null;
          let minDist = 80;

          simNodesRef.current.forEach(other => {
            if (other.id === node.id) return;
            const distDx = other.x - node.x;
            const distDy = other.y - node.y;
            const distance = Math.sqrt(distDx * distDx + distDy * distDy);

            if (distance < minDist) {
              minDist = distance;
              closestNode = other;
            }
          });

          if (closestNode) {
            connectionSuggestionRef.current = {
              sourceId: node.id,
              targetId: (closestNode as SimNode).id
            };
          } else {
            connectionSuggestionRef.current = null;
          }
        }
      } else {
        // Panning workspace background
        const dx = e.clientX - lastMouseXRef.current;
        const dy = e.clientY - lastMouseYRef.current;
        targetPanXRef.current += dx;
        targetPanYRef.current += dy;
      }
    } else {
      // Node hover checks (circular target)
      const nodeHover = simNodesRef.current.find(n => {
        const dx = graphCoords.x - n.x;
        const dy = graphCoords.y - n.y;
        const hitRadius = Math.max(14, n.radius + 6);
        return dx * dx + dy * dy <= hitRadius * hitRadius;
      });

      if (nodeHover) {
        hoveredNodeIdRef.current = nodeHover.id;
        hoveredLinkIdRef.current = null;
      } else {
        hoveredNodeIdRef.current = null;
        
        // Check link hover
        const linkHover = simLinksRef.current.find(link => {
          // Approximate hover using curves
          const mx = (link.source.x + link.target.x) / 2;
          const my = (link.source.y + link.target.y) / 2;
          const dx = link.target.x - link.source.x;
          const dy = link.target.y - link.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          const offset = Math.min(30, dist * 0.12);
          const nx = -dy / dist;
          const ny = dx / dist;
          const cx = mx + nx * offset;
          const cy = my + ny * offset;

          // Perpendicular distance to curve center
          const distToCenter = getDistanceToSegment(graphCoords.x, graphCoords.y, cx, cy, cx, cy);
          if (distToCenter < 12) return true;

          return getDistanceToSegment(
            graphCoords.x, graphCoords.y,
            link.source.x, link.source.y,
            link.target.x, link.target.y
          ) < 6;
        });
        hoveredLinkIdRef.current = linkHover ? linkHover.id : null;
      }
    }

    lastMouseXRef.current = e.clientX;
    lastMouseYRef.current = e.clientY;
  };

  const handleMouseUp = () => {
    if (draggedNodeIdRef.current) {
      const node = simNodesRef.current.find(n => n.id === draggedNodeIdRef.current);

      if (connectionSuggestionRef.current && node) {
        const sug = connectionSuggestionRef.current;
        const sNode = simNodesRef.current.find(n => n.id === sug.sourceId);
        const tNode = simNodesRef.current.find(n => n.id === sug.targetId);

        if (sNode && tNode) {
          setActiveCreateLinkPopover({
            sourceId: sNode.id,
            targetId: tNode.id,
            x: (sNode.x + tNode.x) / 2,
            y: (sNode.y + tNode.y) / 2
          });
          setCreateLinkLabelInput('');
        }
      } else if (!isDraggingNodeRef.current) {
        // Simple click node
        if (node) {
          // Interactive focus mode toggle
          if (selectedNodeId === node.id) {
            onNodeClick(node.id);
          } else {
            setSelectedNodeId(node.id);
          }
        }
      }
    } else {
      if (hoveredLinkIdRef.current) {
        const link = simLinksRef.current.find(l => l.id === hoveredLinkIdRef.current);
        if (link) {
          setActiveLinkPopover({
            linkId: link.id,
            x: (link.source.x + link.target.x) / 2,
            y: (link.source.y + link.target.y) / 2
          });
          setLinkLabelInput(link.label);
        }
      }
    }

    draggedNodeIdRef.current = null;
    connectionSuggestionRef.current = null;
    isMouseDownRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const factor = e.deltaY < 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);

    const oldZoom = targetZoomRef.current;
    const newZoom = Math.max(0.2, Math.min(3.0, oldZoom * factor));

    const mouseCoords = getGraphCoords(e.clientX, e.clientY);

    targetPanXRef.current = e.clientX - canvasRef.current!.getBoundingClientRect().left - mouseCoords.x * newZoom;
    targetPanYRef.current = e.clientY - canvasRef.current!.getBoundingClientRect().top - mouseCoords.y * newZoom;
    targetZoomRef.current = newZoom;
  };

  // Double click background to create note
  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target !== canvasRef.current) return;

    const graphCoords = getGraphCoords(e.clientX, e.clientY);

    const noteName = prompt('Nombre de la nueva nota mental:');
    if (noteName && noteName.trim()) {
      setIsLoading(true);
      fetch(getApiUrl('/notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteName.trim(),
          content: `# ${noteName.trim()}\n\nEscribe aquí tus ideas...`,
          tags: []
        })
      })
        .then(res => res.json())
        .then((newNote) => {
          simNodesRef.current.push({
            id: newNote.id,
            title: newNote.title,
            tags: [],
            x: graphCoords.x,
            y: graphCoords.y,
            vx: 0,
            vy: 0,
            radius: 8,
            color: getNodeColor(newNote, theme === 'light'),
            isFolder: false,
            width: 16,
            height: 16
          });
          onNodeClick(newNote.id);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  };

  // Link modification actions
  const handleSaveLinkLabel = async (linkId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(getApiUrl(`/links/${linkId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: linkLabelInput.trim() })
      });
      if (res.ok) {
        fetchGraphData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveLinkPopover(null);
      setIsLoading(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(getApiUrl(`/links/${linkId}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchGraphData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveLinkPopover(null);
      setIsLoading(false);
    }
  };

  const handleConfirmCreateLink = async () => {
    if (!activeCreateLinkPopover) return;
    const { sourceId, targetId } = activeCreateLinkPopover;

    try {
      setIsLoading(true);
      const res = await fetch(getApiUrl('/links'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: sourceId,
          target: targetId,
          label: createLinkLabelInput.trim()
        })
      });
      if (res.ok) {
        fetchGraphData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveCreateLinkPopover(null);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex-1 h-full flex flex-col overflow-hidden select-none relative bg-bg-primary"
      ref={containerRef}
    >
      {/* Search Header toolbar */}
      <div className="h-14 border-b border-border-custom px-4 flex items-center justify-between shrink-0 bg-white dark:bg-panel z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-tech-purple" />
          <span className="font-bold text-xs uppercase tracking-wider text-text-primary">
            Mapa de Conocimiento
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Spatial Auto arrange */}
          <button
            data-tour="mindmap-reorganize"
            onClick={handleAutoArrange}
            className="p-1 rounded-lg bg-white dark:bg-panel-secondary hover:bg-bg-secondary border border-border-custom text-text-secondary hover:text-text-primary cursor-pointer transition-colors flex items-center gap-1.5 px-2.5 text-[11px] font-medium shadow-xs"
            title="Reorganizar notas en espiral"
          >
            <Sparkles className="w-3.5 h-3.5 text-tech-purple" />
            Reorganizar
          </button>

          {/* Graph Search Input */}
          <div data-tour="mindmap-search" className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar nota..."
              value={graphSearch}
              onChange={e => setGraphSearch(e.target.value)}
              className="bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom rounded-lg py-1 pl-8 pr-2.5 text-xs text-text-primary outline-none focus:border-tech-purple w-40 transition-all placeholder:text-text-secondary/60 shadow-xs"
            />
          </div>

          <button
            onClick={fetchGraphData}
            className="p-1.5 rounded-lg bg-white dark:bg-panel-secondary hover:bg-bg-secondary border border-border-custom text-text-secondary hover:text-text-primary cursor-pointer transition-colors shadow-xs"
            title="Recargar mapa"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Workspace Canvas Area */}
      <div data-tour="mindmap-canvas" className="flex-1 w-full h-full relative overflow-hidden bg-transparent">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/50 z-30 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-panel border border-border-custom text-xs text-text-secondary shadow-xs">
              <div className="w-3.5 h-3.5 border-2 border-tech-purple border-t-transparent rounded-full animate-spin" />
              <span>Cargando constelación...</span>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing animate-fade-in"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
        />

        {/* DOM Tooltips and Popovers on midpoints */}
        <div
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none overflow-hidden select-none"
          style={{
            transform: `translate3d(${panXRef.current}px, ${panYRef.current}px, 0) scale(${zoomRef.current})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Edit relation popup */}
          {activeLinkPopover && (
            <div
              className="absolute bg-white dark:bg-panel border border-border-custom rounded-xl p-3 shadow-xl space-y-2 pointer-events-auto z-40 text-xs w-48"
              style={{
                left: `${activeLinkPopover.x}px`,
                top: `${activeLinkPopover.y + 12}px`,
                transform: 'translateX(-50%)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-semibold text-text-primary text-[11px] uppercase tracking-wider">Editar Conexión</div>
              <input
                type="text"
                className="w-full bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom rounded-lg p-1.5 px-2 text-xs text-text-primary outline-none focus:border-tech-purple"
                value={linkLabelInput}
                onChange={(e) => setLinkLabelInput(e.target.value)}
                placeholder="Nombre (ej. usa)"
              />
              <div className="flex gap-1.5 justify-end pt-1">
                <button
                  onClick={() => handleSaveLinkLabel(activeLinkPopover.linkId)}
                  className="px-2.5 py-1 bg-tech-purple text-white text-[10px] font-semibold rounded-md hover:bg-tech-purple/90 cursor-pointer shadow-xs"
                >
                  Guardar
                </button>
                <button
                  onClick={() => handleDeleteLink(activeLinkPopover.linkId)}
                  className="px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-semibold rounded-md cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )}

          {/* Create relation popup */}
          {activeCreateLinkPopover && (
            <div
              className="absolute bg-white dark:bg-panel border border-border-custom rounded-xl p-3 shadow-xl space-y-2 pointer-events-auto z-40 text-xs w-48"
              style={{
                left: `${activeCreateLinkPopover.x}px`,
                top: `${activeCreateLinkPopover.y + 12}px`,
                transform: 'translateX(-50%)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-bold text-text-primary text-[11px] uppercase tracking-wider">Nueva Conexión</div>
              <input
                type="text"
                className="w-full bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom rounded-lg p-1.5 px-2 text-xs text-text-primary outline-none focus:border-tech-purple"
                value={createLinkLabelInput}
                onChange={(e) => setCreateLinkLabelInput(e.target.value)}
                placeholder="ej. relacionado"
              />
              <div className="flex gap-1.5 justify-end pt-1">
                <button
                  onClick={handleConfirmCreateLink}
                  className="px-2.5 py-1 bg-tech-purple text-white text-[10px] font-semibold rounded-md hover:bg-tech-purple/90 cursor-pointer shadow-xs"
                >
                  Conectar
                </button>
                <button
                  onClick={() => setActiveCreateLinkPopover(null)}
                  className="px-2.5 py-1 bg-bg-secondary border border-border-custom text-text-secondary text-[10px] font-semibold rounded-md hover:text-text-primary cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating controls legend (bottom left) */}
        <div className="absolute bottom-3 left-3 p-3.5 rounded-xl bg-white/95 dark:bg-panel/95 border border-border-custom pointer-events-none max-w-xs space-y-1.5 backdrop-blur-md z-10 shadow-lg text-[10px] text-text-secondary font-medium leading-relaxed">
          <div className="flex items-center gap-1.5 text-tech-purple font-bold uppercase tracking-wider text-[10px] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Controles del Mapa</span>
          </div>
          <p>• Doble clic en el lienzo vacío para crear una nota.</p>
          <p>• Clic en una nota para seleccionarla y activar el Modo Enfoque.</p>
          <p>• Clic de nuevo en la nota seleccionada para abrir su editor.</p>
          <p>• Arrastra un nodo y suéltalo sobre otro para conectarlos.</p>
          <p>• Haz clic en una línea de conexión para editarla o borrarla.</p>
        </div>
      </div>
    </div>
  );
};

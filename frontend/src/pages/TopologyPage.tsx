import { useEffect, useRef, useState } from "react";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Tag,
  Zap,
  Activity,
  Wifi,
  TrendingUp,
  Server,
  Router as RouterIcon,
  Monitor
} from "lucide-react";

interface Node {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'device';
  ip: string;
  status: 'healthy' | 'warning' | 'critical';
  x: number;
  y: number;
  connections: string[];
  latency: number;
  packetLoss: number;
  bandwidth: number;
  uptime: string;
}

interface Link {
  source: string;
  target: string;
}

// Hierarchical network structure
const nodes: Node[] = [
  // Layer 1: Routers (Top)
  { 
    id: '1', 
    name: 'Core Router A', 
    type: 'router', 
    ip: '192.168.1.1', 
    status: 'healthy', 
    x: 250, 
    y: 80, 
    connections: ['4', '5', '6'], 
    latency: 12, 
    packetLoss: 0.1, 
    bandwidth: 950,
    uptime: '99.9%'
  },
  { 
    id: '2', 
    name: 'Core Router B', 
    type: 'router', 
    ip: '192.168.1.2', 
    status: 'healthy', 
    x: 550, 
    y: 80, 
    connections: ['4', '5', '7'], 
    latency: 13, 
    packetLoss: 0.1, 
    bandwidth: 920,
    uptime: '99.8%'
  },
  { 
    id: '3', 
    name: 'Edge Router', 
    type: 'router', 
    ip: '192.168.1.3', 
    status: 'healthy', 
    x: 50, 
    y: 80, 
    connections: ['6'], 
    latency: 15, 
    packetLoss: 0.2, 
    bandwidth: 800,
    uptime: '99.5%'
  },

  // Layer 2: Switches (Middle)
  { 
    id: '4', 
    name: 'Main Switch A', 
    type: 'switch', 
    ip: '192.168.1.10', 
    status: 'healthy', 
    x: 180, 
    y: 250, 
    connections: ['1', '2', '8', '9', '10'], 
    latency: 8, 
    packetLoss: 0.1, 
    bandwidth: 850,
    uptime: '99.9%'
  },
  { 
    id: '5', 
    name: 'Main Switch B', 
    type: 'switch', 
    ip: '192.168.1.11', 
    status: 'healthy', 
    x: 420, 
    y: 250, 
    connections: ['1', '2', '11', '12'], 
    latency: 7, 
    packetLoss: 0.1, 
    bandwidth: 880,
    uptime: '99.9%'
  },
  { 
    id: '6', 
    name: 'Distribution Switch', 
    type: 'switch', 
    ip: '192.168.1.12', 
    status: 'warning', 
    x: 80, 
    y: 250, 
    connections: ['1', '3', '13'], 
    latency: 18, 
    packetLoss: 0.3, 
    bandwidth: 650,
    uptime: '98.5%'
  },
  { 
    id: '7', 
    name: 'Edge Switch', 
    type: 'switch', 
    ip: '192.168.1.13', 
    status: 'healthy', 
    x: 650, 
    y: 250, 
    connections: ['2', '14', '15'], 
    latency: 9, 
    packetLoss: 0.1, 
    bandwidth: 820,
    uptime: '99.7%'
  },

  // Layer 3: Devices (Bottom)
  { 
    id: '8', 
    name: 'Web Server', 
    type: 'device', 
    ip: '192.168.1.100', 
    status: 'healthy', 
    x: 80, 
    y: 420, 
    connections: ['4'], 
    latency: 15, 
    packetLoss: 0.2, 
    bandwidth: 500,
    uptime: '99.9%'
  },
  { 
    id: '9', 
    name: 'Database Server', 
    type: 'device', 
    ip: '192.168.1.101', 
    status: 'healthy', 
    x: 200, 
    y: 420, 
    connections: ['4'], 
    latency: 14, 
    packetLoss: 0.1, 
    bandwidth: 600,
    uptime: '99.9%'
  },
  { 
    id: '10', 
    name: 'File Server', 
    type: 'device', 
    ip: '192.168.1.102', 
    status: 'critical', 
    x: 320, 
    y: 420, 
    connections: ['4'], 
    latency: 45, 
    packetLoss: 1.2, 
    bandwidth: 200,
    uptime: '85.3%'
  },
  { 
    id: '11', 
    name: 'Workstation 1', 
    type: 'device', 
    ip: '192.168.1.50', 
    status: 'healthy', 
    x: 400, 
    y: 420, 
    connections: ['5'], 
    latency: 12, 
    packetLoss: 0.1, 
    bandwidth: 300,
    uptime: '98.5%'
  },
  { 
    id: '12', 
    name: 'Workstation 2', 
    type: 'device', 
    ip: '192.168.1.51', 
    status: 'healthy', 
    x: 520, 
    y: 420, 
    connections: ['5'], 
    latency: 13, 
    packetLoss: 0.1, 
    bandwidth: 320,
    uptime: '99.1%'
  },
  { 
    id: '13', 
    name: 'IoT Gateway', 
    type: 'device', 
    ip: '192.168.1.200', 
    status: 'healthy', 
    x: 30, 
    y: 420, 
    connections: ['6'], 
    latency: 20, 
    packetLoss: 0.2, 
    bandwidth: 150,
    uptime: '97.8%'
  },
  { 
    id: '14', 
    name: 'Printer', 
    type: 'device', 
    ip: '192.168.1.201', 
    status: 'healthy', 
    x: 620, 
    y: 420, 
    connections: ['7'], 
    latency: 18, 
    packetLoss: 0.2, 
    bandwidth: 100,
    uptime: '96.5%'
  },
  { 
    id: '15', 
    name: 'VoIP Phone', 
    type: 'device', 
    ip: '192.168.1.202', 
    status: 'healthy', 
    x: 720, 
    y: 420, 
    connections: ['7'], 
    latency: 10, 
    packetLoss: 0.1, 
    bandwidth: 80,
    uptime: '99.2%'
  },
];

// Generate links from connections
const links: Link[] = [];
nodes.forEach(node => {
  node.connections.forEach(targetId => {
    const linkExists = links.find(l => 
      (l.source === node.id && l.target === targetId) || 
      (l.source === targetId && l.target === node.id)
    );
    if (!linkExists) {
      links.push({ source: node.id, target: targetId });
    }
  });
});

export function TopologyPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [hoveredLink, setHoveredLink] = useState<Link | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 50, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [time, setTime] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Smooth animation timer
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      setTime(t => t + deltaTime);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    // Enable better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle grid
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw links
    links.forEach((link, index) => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      
      if (!sourceNode || !targetNode) return;

      const isCritical = sourceNode.status === 'critical' || targetNode.status === 'critical';
      
      // Check if this link is connected to the hovered node
      const isConnectedToHoveredNode = hoveredNode && (
        link.source === hoveredNode.id || 
        link.target === hoveredNode.id
      );
      
      // Check if this link is being hovered directly
      const isLinkHovered = hoveredLink && (
        (hoveredLink.source === link.source && hoveredLink.target === link.target) ||
        (hoveredLink.source === link.target && hoveredLink.target === link.source)
      );

      const isHovered = isConnectedToHoveredNode || isLinkHovered;

      // Draw connection line
      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);

      if (isHovered) {
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#d4af37';
        ctx.shadowBlur = 10;
      } else if (isCritical) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
      } else {
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
        ctx.lineWidth = 1.5;
      }

      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Packet animation
      if (showTraffic && !isCritical) {
        const speed = isHovered ? 1.2 : 0.8;
        const numPackets = isHovered ? 3 : 2;
        
        for (let p = 0; p < numPackets; p++) {
          const offset = p / numPackets;
          const progress = (time * speed + offset + index * 0.1) % 1;
          const x = sourceNode.x + (targetNode.x - sourceNode.x) * progress;
          const y = sourceNode.y + (targetNode.y - sourceNode.y) * progress;

          // Glow
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, isHovered ? 8 : 5);
          gradient.addColorStop(0, isHovered ? 'rgba(212, 175, 55, 1)' : 'rgba(96, 165, 250, 0.8)');
          gradient.addColorStop(0.5, isHovered ? 'rgba(212, 175, 55, 0.4)' : 'rgba(96, 165, 250, 0.3)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, isHovered ? 8 : 5, 0, Math.PI * 2);
          ctx.fill();

          // Core
          ctx.fillStyle = isHovered ? '#d4af37' : '#60a5fa';
          ctx.beginPath();
          ctx.arc(x, y, isHovered ? 3 : 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Critical path indicator
      if (isCritical) {
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        const pulse = Math.sin(time * 3) * 0.2 + 0.8;

        ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.beginPath();
        ctx.arc(midX, midY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(midX - 4, midY - 4);
        ctx.lineTo(midX + 4, midY + 4);
        ctx.moveTo(midX + 4, midY - 4);
        ctx.lineTo(midX - 4, midY + 4);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode?.id === node.id;
      const size = node.type === 'router' ? 20 : node.type === 'switch' ? 18 : 16;

      // Glow for hovered
      if (isHovered) {
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 3);
        glow.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
        glow.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node icon
      drawNode(ctx, node, size, isHovered);

      // Status indicator
      const statusColor = node.status === 'healthy' ? '#22c55e' : 
                         node.status === 'warning' ? '#f59e0b' : '#ef4444';
      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.arc(node.x + size - 4, node.y - size + 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      if (showLabels || isHovered) {
        ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(200, 200, 200, 0.8)';
        ctx.font = isHovered ? 'bold 13px Inter' : '12px Inter';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(node.name, node.x, node.y + size + 20);
        ctx.shadowBlur = 0;
      }
    });

    ctx.restore();
  }, [offset, zoom, hoveredNode, showLabels, showTraffic, time]);

  const drawNode = (ctx: CanvasRenderingContext2D, node: Node, size: number, highlighted: boolean) => {
    const color = highlighted ? '#d4af37' : 
                  node.type === 'router' ? '#60a5fa' :
                  node.type === 'switch' ? '#a855f7' : '#6b7280';

    ctx.save();
    ctx.translate(node.x, node.y);

    if (node.type === 'router') {
      // Router
      ctx.fillStyle = color;
      ctx.fillRect(-size * 0.7, -size * 0.5, size * 1.4, size);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      
      // Antennas
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, -size * 0.5);
      ctx.lineTo(-size * 0.5, -size * 1.2);
      ctx.moveTo(size * 0.5, -size * 0.5);
      ctx.lineTo(size * 0.5, -size * 1.2);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(-size * 0.5, -size * 1.2, 3, 0, Math.PI * 2);
      ctx.arc(size * 0.5, -size * 1.2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.type === 'switch') {
      // Switch
      ctx.fillStyle = color;
      for (let i = 0; i < 3; i++) {
        const yPos = -size * 0.7 + i * (size * 0.45);
        ctx.fillRect(-size * 0.8, yPos, size * 1.6, size * 0.4);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let j = 0; j < 6; j++) {
          ctx.fillRect(-size * 0.6 + j * (size * 0.2), yPos + size * 0.12, size * 0.12, size * 0.16);
        }
        ctx.fillStyle = color;
      }
    } else {
      // Device
      ctx.fillStyle = color;
      ctx.fillRect(-size * 0.7, -size * 0.6, size * 1.4, size * 1);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(-size * 0.6, -size * 0.5, size * 1.2, size * 0.7);
      
      ctx.fillStyle = color;
      ctx.fillRect(-size * 0.35, size * 0.4, size * 0.7, size * 0.2);
      ctx.fillRect(-size * 0.2, size * 0.2, size * 0.4, size * 0.3);
    }

    ctx.restore();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setMousePos({ x: mouseX, y: mouseY });

    const x = (mouseX - offset.x) / zoom;
    const y = (mouseY - offset.y) / zoom;

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Check node hover first
    const hoveredNodeFound = nodes.find(node => {
      const size = node.type === 'router' ? 20 : node.type === 'switch' ? 18 : 16;
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= size;
    });

    // If no node hovered, check for link hover
    let hoveredLinkFound: Link | null = null;
    if (!hoveredNodeFound) {
      hoveredLinkFound = links.find(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        
        if (!sourceNode || !targetNode) return false;

        // Calculate distance from point to line segment
        const lineLength = Math.sqrt(
          Math.pow(targetNode.x - sourceNode.x, 2) + 
          Math.pow(targetNode.y - sourceNode.y, 2)
        );
        
        if (lineLength === 0) return false;

        // Calculate the projection of the point onto the line
        const t = Math.max(0, Math.min(1, (
          (x - sourceNode.x) * (targetNode.x - sourceNode.x) + 
          (y - sourceNode.y) * (targetNode.y - sourceNode.y)
        ) / (lineLength * lineLength)));

        const projX = sourceNode.x + t * (targetNode.x - sourceNode.x);
        const projY = sourceNode.y + t * (targetNode.y - sourceNode.y);

        const distance = Math.sqrt(
          Math.pow(x - projX, 2) + 
          Math.pow(y - projY, 2)
        );

        // Hover tolerance (10 pixels in canvas coordinates)
        return distance <= 10 / zoom;
      }) || null;
    }

    setHoveredNode(hoveredNodeFound || null);
    setHoveredLink(hoveredLinkFound);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    const clicked = nodes.find(node => {
      const size = node.type === 'router' ? 20 : node.type === 'switch' ? 18 : 16;
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= size;
    });

    if (!clicked) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(2.5, prev * delta)));
  };

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 50, y: 30 });
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-move"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl">
        <button
          onClick={() => setZoom(prev => Math.min(2.5, prev * 1.2))}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-gray-400 hover:text-[#d4af37]"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-gray-400 hover:text-[#d4af37]"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        
        <button
          onClick={resetView}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-gray-400 hover:text-[#d4af37]"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-[#2a2a2a]" />

        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`p-2 rounded-lg transition-colors ${showLabels ? 'bg-[#d4af37] text-black' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-[#d4af37]'}`}
        >
          <Tag className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`p-2 rounded-lg transition-colors ${showTraffic ? 'bg-[#d4af37] text-black' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-[#d4af37]'}`}
        >
          <Zap className="w-4 h-4" />
        </button>
      </div>

      {/* Hover Card */}
      {hoveredNode && (
        <div 
          className="absolute bg-[#1a1a1a]/95 backdrop-blur-md border border-[#d4af37]/40 rounded-xl p-4 shadow-2xl pointer-events-none z-50"
          style={{
            left: `${mousePos.x + 20}px`,
            top: `${mousePos.y - 80}px`,
            transform: mousePos.x > 600 ? 'translateX(-100%) translateX(-40px)' : 'none'
          }}
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-3 pb-3 border-b border-[#2a2a2a]">
            <div className={`p-2 rounded-lg ${
              hoveredNode.type === 'router' ? 'bg-blue-500/20' :
              hoveredNode.type === 'switch' ? 'bg-purple-500/20' : 'bg-gray-500/20'
            }`}>
              {hoveredNode.type === 'router' ? <RouterIcon className="w-5 h-5 text-blue-400" /> :
               hoveredNode.type === 'switch' ? <Server className="w-5 h-5 text-purple-400" /> :
               <Monitor className="w-5 h-5 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm mb-0.5">{hoveredNode.name}</h3>
              <p className="text-xs text-gray-400 font-mono">{hoveredNode.ip}</p>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              hoveredNode.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
              hoveredNode.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {hoveredNode.status}
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Activity className="w-3.5 h-3.5" />
                <span>Latency</span>
              </div>
              <span className={`font-medium ${
                hoveredNode.latency > 30 ? 'text-red-400' :
                hoveredNode.latency > 20 ? 'text-amber-400' : 'text-green-400'
              }`}>{hoveredNode.latency}ms</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Packet Loss</span>
              </div>
              <span className={`font-medium ${
                hoveredNode.packetLoss > 1 ? 'text-red-400' :
                hoveredNode.packetLoss > 0.5 ? 'text-amber-400' : 'text-green-400'
              }`}>{hoveredNode.packetLoss}%</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Wifi className="w-3.5 h-3.5" />
                <span>Bandwidth</span>
              </div>
              <span className="font-medium text-blue-400">{hoveredNode.bandwidth} Mbps</span>
            </div>
          </div>

          {/* Uptime */}
          <div className="pt-2 border-t border-[#2a2a2a]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Uptime</span>
              <span className="font-medium text-[#d4af37]">{hoveredNode.uptime}</span>
            </div>
          </div>

          {/* Connections */}
          <div className="pt-2 border-t border-[#2a2a2a] mt-2">
            <div className="text-xs text-gray-400 mb-1.5">Connected to {hoveredNode.connections.length} device(s)</div>
            <div className="flex flex-wrap gap-1">
              {hoveredNode.connections.slice(0, 4).map(connId => {
                const conn = nodes.find(n => n.id === connId);
                return conn ? (
                  <span key={connId} className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded">
                    {conn.name}
                  </span>
                ) : null;
              })}
              {hoveredNode.connections.length > 4 && (
                <span className="text-xs text-gray-500 px-2 py-0.5">
                  +{hoveredNode.connections.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link Hover Card */}
      {hoveredLink && !hoveredNode && (() => {
        const sourceNode = nodes.find(n => n.id === hoveredLink.source);
        const targetNode = nodes.find(n => n.id === hoveredLink.target);
        
        if (!sourceNode || !targetNode) return null;

        return (
          <div 
            className="absolute bg-[#1a1a1a]/95 backdrop-blur-md border border-[#d4af37]/40 rounded-xl p-4 shadow-2xl pointer-events-none z-50"
            style={{
              left: `${mousePos.x + 20}px`,
              top: `${mousePos.y - 60}px`,
              transform: mousePos.x > 600 ? 'translateX(-100%) translateX(-40px)' : 'none'
            }}
          >
            <div className="text-xs font-medium text-[#d4af37] mb-3">Connection Path</div>
            
            {/* Source Node */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${
                sourceNode.type === 'router' ? 'bg-blue-500/20' :
                sourceNode.type === 'switch' ? 'bg-purple-500/20' : 'bg-gray-500/20'
              }`}>
                {sourceNode.type === 'router' ? <RouterIcon className="w-4 h-4 text-blue-400" /> :
                 sourceNode.type === 'switch' ? <Server className="w-4 h-4 text-purple-400" /> :
                 <Monitor className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="flex-1">
                <div className="text-white text-xs font-medium">{sourceNode.name}</div>
                <div className="text-gray-500 text-xs font-mono">{sourceNode.ip}</div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center my-2">
              <div className="flex items-center gap-1 text-[#d4af37]">
                <div className="w-8 h-px bg-[#d4af37]"></div>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3L15 10L10 17L9 16L13 10L9 4L10 3Z" />
                </svg>
                <div className="w-8 h-px bg-[#d4af37]"></div>
              </div>
            </div>

            {/* Target Node */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg ${
                targetNode.type === 'router' ? 'bg-blue-500/20' :
                targetNode.type === 'switch' ? 'bg-purple-500/20' : 'bg-gray-500/20'
              }`}>
                {targetNode.type === 'router' ? <RouterIcon className="w-4 h-4 text-blue-400" /> :
                 targetNode.type === 'switch' ? <Server className="w-4 h-4 text-purple-400" /> :
                 <Monitor className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="flex-1">
                <div className="text-white text-xs font-medium">{targetNode.name}</div>
                <div className="text-gray-500 text-xs font-mono">{targetNode.ip}</div>
              </div>
            </div>

            {/* Path Stats */}
            <div className="pt-3 border-t border-[#2a2a2a] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Combined Latency</span>
                <span className="font-medium text-green-400">
                  {sourceNode.latency + targetNode.latency}ms
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Path Status</span>
                <span className={`font-medium ${
                  sourceNode.status === 'critical' || targetNode.status === 'critical' ? 'text-red-400' :
                  sourceNode.status === 'warning' || targetNode.status === 'warning' ? 'text-amber-400' :
                  'text-green-400'
                }`}>
                  {sourceNode.status === 'critical' || targetNode.status === 'critical' ? 'Critical' :
                   sourceNode.status === 'warning' || targetNode.status === 'warning' ? 'Warning' : 'Healthy'}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Legends */}
      <div className="absolute bottom-6 left-6 bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-xl p-4 shadow-2xl">
        <div className="text-xs font-medium text-gray-400 mb-3">Device Types</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#60a5fa]" />
            <span className="text-xs text-gray-300">Router</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#a855f7]" />
            <span className="text-xs text-gray-300">Switch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#6b7280]" />
            <span className="text-xs text-gray-300">Device</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-xl p-4 shadow-2xl">
        <div className="text-xs font-medium text-gray-400 mb-3">Network Health</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-300">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-300">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-300">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
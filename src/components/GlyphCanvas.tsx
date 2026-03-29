import { useRef, useEffect, useState, MouseEvent, WheelEvent } from "react";
import { Glyph, BezierNode, Point, Tool } from "@/types/font";
import { FontEngine } from "@/lib/fontEngine";

interface GlyphCanvasProps {
  glyph: Glyph | null;
  selectedTool: Tool;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onGlyphChange: (glyph: Glyph) => void;
}

export function GlyphCanvas({
  glyph,
  selectedTool,
  zoom,
  onZoomChange,
  onGlyphChange,
}: GlyphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const GRID_SIZE = 50;
  const NODE_RADIUS = 6;
  const HANDLE_RADIUS = 4;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, -zoom);
    
    drawGrid(ctx, canvas.width, canvas.height);
    drawBaselines(ctx);
    
    if (glyph) {
      drawGlyph(ctx, glyph);
    }
  }, [glyph, zoom, pan, selectedNodeId]);
  
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = "hsl(var(--grid))";
    ctx.lineWidth = 1 / zoom;
    
    const gridSpacing = GRID_SIZE;
    const startX = -width / (2 * zoom) - pan.x / zoom;
    const endX = width / (2 * zoom) - pan.x / zoom;
    const startY = -height / (2 * zoom) + pan.y / zoom;
    const endY = height / (2 * zoom) + pan.y / zoom;
    
    for (let x = Math.floor(startX / gridSpacing) * gridSpacing; x <= endX; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    for (let y = Math.floor(startY / gridSpacing) * gridSpacing; y <= endY; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    
    ctx.restore();
  };
  
  const drawBaselines = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = "hsl(186 100% 50% / 0.3)";
    ctx.lineWidth = 2 / zoom;
    
    ctx.beginPath();
    ctx.moveTo(-2000, 0);
    ctx.lineTo(2000, 0);
    ctx.stroke();
    
    ctx.strokeStyle = "hsl(330 100% 50% / 0.3)";
    ctx.setLineDash([10 / zoom, 10 / zoom]);
    
    [700, 500, -200].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(-2000, y);
      ctx.lineTo(2000, y);
      ctx.stroke();
    });
    
    ctx.restore();
  };
  
  const drawGlyph = (ctx: CanvasRenderingContext2D, glyph: Glyph) => {
    ctx.save();
    
    glyph.paths.forEach(path => {
      ctx.strokeStyle = "hsl(var(--foreground))";
      ctx.fillStyle = "hsl(var(--foreground) / 0.1)";
      ctx.lineWidth = 3 / zoom;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      
      const svgPath = FontEngine.pathToSVG(path);
      const path2d = new Path2D(svgPath);
      
      ctx.fill(path2d);
      ctx.stroke(path2d);
      
      path.nodes.forEach(node => {
        if (node.handleIn) {
          ctx.strokeStyle = "hsl(var(--handle) / 0.5)";
          ctx.lineWidth = 1 / zoom;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node.handleIn.x, node.handleIn.y);
          ctx.stroke();
          
          ctx.fillStyle = "hsl(var(--handle))";
          ctx.beginPath();
          ctx.arc(node.handleIn.x, node.handleIn.y, HANDLE_RADIUS / zoom, 0, Math.PI * 2);
          ctx.fill();
        }
        
        if (node.handleOut) {
          ctx.strokeStyle = "hsl(var(--handle) / 0.5)";
          ctx.lineWidth = 1 / zoom;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node.handleOut.x, node.handleOut.y);
          ctx.stroke();
          
          ctx.fillStyle = "hsl(var(--handle))";
          ctx.beginPath();
          ctx.arc(node.handleOut.x, node.handleOut.y, HANDLE_RADIUS / zoom, 0, Math.PI * 2);
          ctx.fill();
        }
        
        const isSelected = node.id === selectedNodeId;
        ctx.fillStyle = isSelected ? "hsl(var(--node-selected))" : "hsl(var(--node))";
        ctx.strokeStyle = "hsl(var(--background))";
        ctx.lineWidth = 2 / zoom;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS / zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    });
    
    ctx.restore();
  };
  
  const canvasToWorld = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const worldX = (x - canvas.width / 2 - pan.x) / zoom;
    const worldY = -(y - canvas.height / 2 - pan.y) / zoom;
    
    return { x: worldX, y: worldY };
  };
  
  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));
    
    onZoomChange(newZoom);
  };
  
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const worldPos = canvasToWorld(e.clientX, e.clientY);
    
    if (selectedTool === "hand" || e.button === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    
    if (selectedTool === "select" && glyph) {
      let foundNode = false;
      
      for (const path of glyph.paths) {
        for (const node of path.nodes) {
          const dx = worldPos.x - node.x;
          const dy = worldPos.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < NODE_RADIUS * 2 / zoom) {
            setSelectedNodeId(node.id);
            foundNode = true;
            break;
          }
        }
        if (foundNode) break;
      }
      
      if (!foundNode) {
        setSelectedNodeId(null);
      }
    }
    
    if (selectedTool === "pen" && glyph) {
      const newNode: BezierNode = {
        id: FontEngine.generateUID(),
        x: Math.round(worldPos.x / 10) * 10,
        y: Math.round(worldPos.y / 10) * 10,
        type: "on-curve",
      };
      
      const updatedGlyph = { ...glyph };
      
      if (updatedGlyph.paths.length === 0) {
        updatedGlyph.paths = [{
          id: FontEngine.generateUID(),
          nodes: [newNode],
          closed: false,
        }];
      } else {
        const lastPath = updatedGlyph.paths[updatedGlyph.paths.length - 1];
        if (!lastPath.closed) {
          lastPath.nodes.push(newNode);
        } else {
          updatedGlyph.paths.push({
            id: FontEngine.generateUID(),
            nodes: [newNode],
            closed: false,
          });
        }
      }
      
      onGlyphChange(updatedGlyph);
    }
  };
  
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  return (
    <div ref={containerRef} className="flex-1 relative canvas-grid">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="absolute inset-0 cursor-crosshair"
      />
      
      <div className="absolute bottom-4 right-4 glass-panel px-3 py-2 rounded-lg text-sm">
        Zoom: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
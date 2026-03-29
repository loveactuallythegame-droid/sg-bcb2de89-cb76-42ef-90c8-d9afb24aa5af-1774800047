import { useRef, useEffect, useState, MouseEvent, WheelEvent, TouchEvent } from "react";
import { Glyph, BezierNode, Point, Tool, Path } from "@/types/font";
import { FontEngine } from "@/lib/fontEngine";

interface GlyphCanvasProps {
  glyph: Glyph | null;
  selectedTool: Tool;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onGlyphChange: (glyph: Glyph) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function GlyphCanvas({
  glyph,
  selectedTool,
  zoom,
  onZoomChange,
  onGlyphChange,
  onUndo,
  onRedo,
}: GlyphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedHandleId, setSelectedHandleId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [shapePreview, setShapePreview] = useState<{ start: Point; end: Point } | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; dist: number } | null>(null);
  
  const GRID_SIZE = 50;
  const NODE_RADIUS = 8;
  const HANDLE_RADIUS = 6;
  const SELECTION_TOLERANCE = 20;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    ctx.scale(dpr, dpr);
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    ctx.save();
    ctx.translate(rect.width / 2 + pan.x, rect.height / 2 + pan.y);
    
    const scale = zoom;
    ctx.scale(scale, scale);
    
    drawGrid(ctx, rect.width, rect.height, scale);
    drawBaselines(ctx, scale);
    
    if (glyph) {
      drawGlyph(ctx, glyph, scale);
    }
    
    if (shapePreview && (selectedTool === "rectangle" || selectedTool === "ellipse")) {
      drawShapePreview(ctx, shapePreview, scale);
    }
    
    ctx.restore();
  }, [glyph, zoom, pan, selectedNodeIds, hoveredNodeId, selectedHandleId, shapePreview, selectedTool]);
  
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        onRedo?.();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelectedNodes();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        selectAllNodes();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedNodeIds(new Set());
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [glyph, selectedNodeIds, onUndo, onRedo]);
  
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, scale: number) => {
    ctx.save();
    ctx.strokeStyle = "hsl(var(--grid))";
    ctx.lineWidth = 1 / scale;
    
    const gridSpacing = GRID_SIZE;
    const startX = (-width / 2 - pan.x) / scale;
    const endX = (width / 2 - pan.x) / scale;
    const startY = (-height / 2 - pan.y) / scale;
    const endY = (height / 2 - pan.y) / scale;
    
    for (let x = Math.floor(startX / gridSpacing) * gridSpacing; x <= endX; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    for (let y = Math.floor(startY / gridSpacing) * gridSpacing; y <= endY; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(startX, -y);
      ctx.lineTo(endX, -y);
      ctx.stroke();
    }
    
    ctx.restore();
  };
  
  const drawBaselines = (ctx: CanvasRenderingContext2D, scale: number) => {
    ctx.save();
    ctx.strokeStyle = "hsl(186 100% 50% / 0.3)";
    ctx.lineWidth = 2 / scale;
    
    ctx.beginPath();
    ctx.moveTo(-2000, 0);
    ctx.lineTo(2000, 0);
    ctx.stroke();
    
    ctx.strokeStyle = "hsl(330 100% 50% / 0.3)";
    ctx.setLineDash([10 / scale, 10 / scale]);
    
    [700, 500, -200].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(-2000, -y);
      ctx.lineTo(2000, -y);
      ctx.stroke();
    });
    
    ctx.restore();
  };
  
  const drawGlyph = (ctx: CanvasRenderingContext2D, glyph: Glyph, scale: number) => {
    ctx.save();
    
    glyph.paths.forEach(path => {
      ctx.save();
      ctx.scale(1, -1);
      
      ctx.strokeStyle = "hsl(var(--foreground))";
      ctx.fillStyle = "hsl(var(--foreground) / 0.1)";
      ctx.lineWidth = 3 / scale;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      
      const svgPath = FontEngine.pathToSVG(path);
      const path2d = new Path2D(svgPath);
      
      ctx.fill(path2d);
      ctx.stroke(path2d);
      
      ctx.restore();
      
      path.nodes.forEach(node => {
        if (node.handleIn) {
          ctx.strokeStyle = "hsl(var(--handle) / 0.5)";
          ctx.lineWidth = 1 / scale;
          ctx.beginPath();
          ctx.moveTo(node.x, -node.y);
          ctx.lineTo(node.handleIn.x, -node.handleIn.y);
          ctx.stroke();
          
          const isSelectedHandle = selectedHandleId === `${node.id}-in`;
          ctx.fillStyle = isSelectedHandle ? "hsl(var(--accent))" : "hsl(var(--handle))";
          ctx.beginPath();
          ctx.arc(node.handleIn.x, -node.handleIn.y, HANDLE_RADIUS / scale, 0, Math.PI * 2);
          ctx.fill();
        }
        
        if (node.handleOut) {
          ctx.strokeStyle = "hsl(var(--handle) / 0.5)";
          ctx.lineWidth = 1 / scale;
          ctx.beginPath();
          ctx.moveTo(node.x, -node.y);
          ctx.lineTo(node.handleOut.x, -node.handleOut.y);
          ctx.stroke();
          
          const isSelectedHandle = selectedHandleId === `${node.id}-out`;
          ctx.fillStyle = isSelectedHandle ? "hsl(var(--accent))" : "hsl(var(--handle))";
          ctx.beginPath();
          ctx.arc(node.handleOut.x, -node.handleOut.y, HANDLE_RADIUS / scale, 0, Math.PI * 2);
          ctx.fill();
        }
        
        const isSelected = selectedNodeIds.has(node.id);
        const isHovered = hoveredNodeId === node.id;
        
        if (isHovered || isSelected) {
          ctx.strokeStyle = "hsl(var(--accent) / 0.3)";
          ctx.lineWidth = 8 / scale;
          ctx.beginPath();
          ctx.arc(node.x, -node.y, (NODE_RADIUS + 4) / scale, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        ctx.fillStyle = isSelected ? "hsl(var(--node-selected))" : "hsl(var(--node))";
        ctx.strokeStyle = "hsl(var(--background))";
        ctx.lineWidth = 2 / scale;
        
        ctx.beginPath();
        ctx.arc(node.x, -node.y, NODE_RADIUS / scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    });
    
    ctx.restore();
  };
  
  const drawShapePreview = (ctx: CanvasRenderingContext2D, preview: { start: Point; end: Point }, scale: number) => {
    ctx.save();
    ctx.scale(1, -1);
    ctx.strokeStyle = "hsl(var(--accent) / 0.6)";
    ctx.fillStyle = "hsl(var(--accent) / 0.1)";
    ctx.lineWidth = 2 / scale;
    ctx.setLineDash([10 / scale, 10 / scale]);
    
    const x = Math.min(preview.start.x, preview.end.x);
    const y = Math.min(preview.start.y, preview.end.y);
    const width = Math.abs(preview.end.x - preview.start.x);
    const height = Math.abs(preview.end.y - preview.start.y);
    
    if (selectedTool === "rectangle") {
      ctx.strokeRect(x, -y - height, width, height);
      ctx.fillRect(x, -y - height, width, height);
    } else if (selectedTool === "ellipse") {
      const cx = x + width / 2;
      const cy = y + height / 2;
      const rx = width / 2;
      const ry = height / 2;
      
      ctx.beginPath();
      ctx.ellipse(cx, -cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.restore();
  };
  
  const canvasToWorld = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const worldX = (x - rect.width / 2 - pan.x) / zoom;
    const worldY = (rect.height / 2 + pan.y - y) / zoom;
    
    return { x: worldX, y: worldY };
  };
  
  const findNodeAtPoint = (worldPos: Point, tolerance: number = SELECTION_TOLERANCE): { pathIndex: number; nodeIndex: number; node: BezierNode } | null => {
    if (!glyph) return null;
    
    for (let pathIndex = 0; pathIndex < glyph.paths.length; pathIndex++) {
      const path = glyph.paths[pathIndex];
      for (let nodeIndex = 0; nodeIndex < path.nodes.length; nodeIndex++) {
        const node = path.nodes[nodeIndex];
        const dx = worldPos.x - node.x;
        const dy = worldPos.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < tolerance / zoom) {
          return { pathIndex, nodeIndex, node };
        }
      }
    }
    
    return null;
  };
  
  const findHandleAtPoint = (worldPos: Point, tolerance: number = SELECTION_TOLERANCE): { nodeId: string; handleType: "in" | "out"; handle: Point } | null => {
    if (!glyph) return null;
    
    for (const path of glyph.paths) {
      for (const node of path.nodes) {
        if (node.handleIn) {
          const dx = worldPos.x - node.handleIn.x;
          const dy = worldPos.y - node.handleIn.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < tolerance / zoom) {
            return { nodeId: node.id, handleType: "in", handle: node.handleIn };
          }
        }
        
        if (node.handleOut) {
          const dx = worldPos.x - node.handleOut.x;
          const dy = worldPos.y - node.handleOut.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < tolerance / zoom) {
            return { nodeId: node.id, handleType: "out", handle: node.handleOut };
          }
        }
      }
    }
    
    return null;
  };
  
  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));
    
    onZoomChange(newZoom);
  };
  
  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      setTouchStart({
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        dist,
      });
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        shiftKey: false,
        preventDefault: () => {},
      } as MouseEvent<HTMLCanvasElement>);
    }
  };
  
  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && touchStart) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      
      const zoomFactor = dist / touchStart.dist;
      const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));
      onZoomChange(newZoom);
      
      setTouchStart({
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        dist,
      });
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
      } as MouseEvent<HTMLCanvasElement>);
    }
  };
  
  const handleTouchEnd = () => {
    setTouchStart(null);
    handleMouseUp();
  };
  
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const worldPos = canvasToWorld(e.clientX, e.clientY);
    
    if (selectedTool === "hand" || e.button === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    
    if (selectedTool === "select" && glyph) {
      const handle = findHandleAtPoint(worldPos);
      if (handle) {
        setSelectedHandleId(`${handle.nodeId}-${handle.handleType}`);
        setDraggedNodeId(handle.nodeId);
        return;
      }
      
      const found = findNodeAtPoint(worldPos);
      if (found) {
        if (e.shiftKey) {
          const newSelection = new Set(selectedNodeIds);
          if (newSelection.has(found.node.id)) {
            newSelection.delete(found.node.id);
          } else {
            newSelection.add(found.node.id);
          }
          setSelectedNodeIds(newSelection);
        } else if (!selectedNodeIds.has(found.node.id)) {
          setSelectedNodeIds(new Set([found.node.id]));
        }
        setDraggedNodeId(found.node.id);
        setDragStart(worldPos);
        return;
      }
      
      if (!e.shiftKey) {
        setSelectedNodeIds(new Set());
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
          const firstNode = lastPath.nodes[0];
          const dx = worldPos.x - firstNode.x;
          const dy = worldPos.y - firstNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < SELECTION_TOLERANCE / zoom && lastPath.nodes.length > 2) {
            lastPath.closed = true;
          } else {
            lastPath.nodes.push(newNode);
          }
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
    
    if ((selectedTool === "rectangle" || selectedTool === "ellipse") && glyph) {
      setDragStart(worldPos);
      setShapePreview({ start: worldPos, end: worldPos });
      setIsDragging(true);
    }
  };
  
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const worldPos = canvasToWorld(e.clientX, e.clientY);
    
    if (selectedTool === "select" && !isDragging) {
      const found = findNodeAtPoint(worldPos);
      setHoveredNodeId(found ? found.node.id : null);
    }
    
    if (isDragging && (selectedTool === "hand" || e.button === 1)) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }
    
    if (isDragging && (selectedTool === "rectangle" || selectedTool === "ellipse")) {
      setShapePreview({ start: dragStart, end: worldPos });
      return;
    }
    
    if (draggedNodeId && selectedTool === "select" && glyph) {
      if (selectedHandleId) {
        const [nodeId, handleType] = selectedHandleId.split("-");
        const updatedGlyph = { ...glyph };
        
        for (const path of updatedGlyph.paths) {
          const node = path.nodes.find(n => n.id === nodeId);
          if (node) {
            if (handleType === "in" && node.handleIn) {
              node.handleIn = {
                x: Math.round(worldPos.x / 10) * 10,
                y: Math.round(worldPos.y / 10) * 10,
              };
            } else if (handleType === "out" && node.handleOut) {
              node.handleOut = {
                x: Math.round(worldPos.x / 10) * 10,
                y: Math.round(worldPos.y / 10) * 10,
              };
            }
            break;
          }
        }
        
        onGlyphChange(updatedGlyph);
      } else {
        const dx = worldPos.x - dragStart.x;
        const dy = worldPos.y - dragStart.y;
        
        const updatedGlyph = { ...glyph };
        
        for (const path of updatedGlyph.paths) {
          for (const node of path.nodes) {
            if (selectedNodeIds.has(node.id)) {
              node.x = Math.round((node.x + dx) / 10) * 10;
              node.y = Math.round((node.y + dy) / 10) * 10;
              
              if (node.handleIn) {
                node.handleIn.x += dx;
                node.handleIn.y += dy;
              }
              if (node.handleOut) {
                node.handleOut.x += dx;
                node.handleOut.y += dy;
              }
            }
          }
        }
        
        setDragStart(worldPos);
        onGlyphChange(updatedGlyph);
      }
    }
  };
  
  const handleMouseUp = () => {
    if (isDragging && shapePreview && (selectedTool === "rectangle" || selectedTool === "ellipse") && glyph) {
      const x = Math.min(shapePreview.start.x, shapePreview.end.x);
      const y = Math.min(shapePreview.start.y, shapePreview.end.y);
      const width = Math.abs(shapePreview.end.x - shapePreview.start.x);
      const height = Math.abs(shapePreview.end.y - shapePreview.start.y);
      
      if (width > 10 && height > 10) {
        const updatedGlyph = { ...glyph };
        let newPath: Path;
        
        if (selectedTool === "rectangle") {
          newPath = FontEngine.createRectangle(
            Math.round(x / 10) * 10,
            Math.round(y / 10) * 10,
            Math.round(width / 10) * 10,
            Math.round(height / 10) * 10
          );
        } else {
          const cx = x + width / 2;
          const cy = y + height / 2;
          const rx = width / 2;
          const ry = height / 2;
          newPath = FontEngine.createEllipse(
            Math.round(cx / 10) * 10,
            Math.round(cy / 10) * 10,
            Math.round(rx / 10) * 10,
            Math.round(ry / 10) * 10
          );
        }
        
        updatedGlyph.paths.push(newPath);
        onGlyphChange(updatedGlyph);
      }
      
      setShapePreview(null);
    }
    
    setIsDragging(false);
    setDraggedNodeId(null);
    setSelectedHandleId(null);
  };
  
  const deleteSelectedNodes = () => {
    if (!glyph || selectedNodeIds.size === 0) return;
    
    const updatedGlyph = { ...glyph };
    updatedGlyph.paths = updatedGlyph.paths
      .map(path => ({
        ...path,
        nodes: path.nodes.filter(node => !selectedNodeIds.has(node.id)),
      }))
      .filter(path => path.nodes.length > 0);
    
    onGlyphChange(updatedGlyph);
    setSelectedNodeIds(new Set());
  };
  
  const selectAllNodes = () => {
    if (!glyph) return;
    
    const allNodeIds = new Set<string>();
    glyph.paths.forEach(path => {
      path.nodes.forEach(node => {
        allNodeIds.add(node.id);
      });
    });
    
    setSelectedNodeIds(allNodeIds);
  };
  
  return (
    <div ref={containerRef} className="flex-1 relative canvas-grid touch-none">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute inset-0 cursor-crosshair touch-none"
      />
      
      <div className="absolute bottom-4 right-4 glass-panel px-3 py-2 rounded-lg text-sm space-y-1 pointer-events-none">
        <div>Zoom: {Math.round(zoom * 100)}%</div>
        {selectedNodeIds.size > 0 && (
          <div className="text-accent">Selected: {selectedNodeIds.size}</div>
        )}
      </div>
      
      {selectedTool === "select" && (
        <div className="absolute top-4 left-4 glass-panel px-3 py-2 rounded-lg text-xs text-muted-foreground hidden md:block pointer-events-none">
          Click: select • Shift: multi-select • Drag: move
        </div>
      )}
      
      {selectedTool === "pen" && (
        <div className="absolute top-4 left-4 glass-panel px-3 py-2 rounded-lg text-xs text-muted-foreground hidden md:block pointer-events-none">
          Click to add points • Click first point to close
        </div>
      )}
      
      {(selectedTool === "rectangle" || selectedTool === "ellipse") && (
        <div className="absolute top-4 left-4 glass-panel px-3 py-2 rounded-lg text-xs text-muted-foreground hidden md:block pointer-events-none">
          Drag to create {selectedTool}
        </div>
      )}
      
      {selectedTool === "hand" && (
        <div className="absolute top-4 left-4 glass-panel px-3 py-2 rounded-lg text-xs text-muted-foreground hidden md:block pointer-events-none">
          Drag to pan • Scroll/pinch to zoom
        </div>
      )}
    </div>
  );
}
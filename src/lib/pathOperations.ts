import { Path, BezierNode, Point } from "@/types/font";
import { FontEngine } from "./fontEngine";

export class PathOperations {
  
  static flipHorizontal(path: Path, centerX: number = 0): Path {
    return {
      ...path,
      nodes: path.nodes.map(node => ({
        ...node,
        x: 2 * centerX - node.x,
        handleIn: node.handleIn ? { x: 2 * centerX - node.handleIn.x, y: node.handleIn.y } : undefined,
        handleOut: node.handleOut ? { x: 2 * centerX - node.handleOut.x, y: node.handleOut.y } : undefined,
      })).reverse(),
    };
  }
  
  static flipVertical(path: Path, centerY: number = 0): Path {
    return {
      ...path,
      nodes: path.nodes.map(node => ({
        ...node,
        y: 2 * centerY - node.y,
        handleIn: node.handleIn ? { x: node.handleIn.x, y: 2 * centerY - node.handleIn.y } : undefined,
        handleOut: node.handleOut ? { x: node.handleOut.x, y: 2 * centerY - node.handleOut.y } : undefined,
      })).reverse(),
    };
  }
  
  static rotate(path: Path, angleDegrees: number, centerX: number = 0, centerY: number = 0): Path {
    const angleRad = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    
    const rotatePoint = (p: Point): Point => {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      return {
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos,
      };
    };
    
    return {
      ...path,
      nodes: path.nodes.map(node => ({
        ...node,
        ...rotatePoint(node),
        handleIn: node.handleIn ? rotatePoint(node.handleIn) : undefined,
        handleOut: node.handleOut ? rotatePoint(node.handleOut) : undefined,
      })),
    };
  }
  
  static scale(path: Path, scaleX: number, scaleY: number, centerX: number = 0, centerY: number = 0): Path {
    const scalePoint = (p: Point): Point => ({
      x: centerX + (p.x - centerX) * scaleX,
      y: centerY + (p.y - centerY) * scaleY,
    });
    
    return {
      ...path,
      nodes: path.nodes.map(node => ({
        ...node,
        ...scalePoint(node),
        handleIn: node.handleIn ? scalePoint(node.handleIn) : undefined,
        handleOut: node.handleOut ? scalePoint(node.handleOut) : undefined,
      })),
    };
  }
  
  static translate(path: Path, dx: number, dy: number): Path {
    return {
      ...path,
      nodes: path.nodes.map(node => ({
        ...node,
        x: node.x + dx,
        y: node.y + dy,
        handleIn: node.handleIn ? { x: node.handleIn.x + dx, y: node.handleIn.y + dy } : undefined,
        handleOut: node.handleOut ? { x: node.handleOut.x + dx, y: node.handleOut.y + dy } : undefined,
      })),
    };
  }
  
  static roundCorners(path: Path, radius: number): Path {
    if (path.nodes.length < 3) return path;
    
    const newNodes: BezierNode[] = [];
    
    for (let i = 0; i < path.nodes.length; i++) {
      const prev = path.nodes[(i - 1 + path.nodes.length) % path.nodes.length];
      const curr = path.nodes[i];
      const next = path.nodes[(i + 1) % path.nodes.length];
      
      if (curr.type === "on-curve") {
        const toPrev = Math.sqrt(Math.pow(prev.x - curr.x, 2) + Math.pow(prev.y - curr.y, 2));
        const toNext = Math.sqrt(Math.pow(next.x - curr.x, 2) + Math.pow(next.y - curr.y, 2));
        
        const actualRadius = Math.min(radius, toPrev / 2, toNext / 2);
        
        if (actualRadius > 0) {
          const prevRatio = actualRadius / toPrev;
          const nextRatio = actualRadius / toNext;
          
          const p1 = {
            x: curr.x + (prev.x - curr.x) * prevRatio,
            y: curr.y + (prev.y - curr.y) * prevRatio,
          };
          
          const p2 = {
            x: curr.x + (next.x - curr.x) * nextRatio,
            y: curr.y + (next.y - curr.y) * nextRatio,
          };
          
          newNodes.push({
            id: FontEngine.generateUID(),
            x: p1.x,
            y: p1.y,
            type: "on-curve",
            handleOut: { x: curr.x, y: curr.y },
          });
          
          newNodes.push({
            id: FontEngine.generateUID(),
            x: p2.x,
            y: p2.y,
            type: "on-curve",
            handleIn: { x: curr.x, y: curr.y },
          });
        } else {
          newNodes.push({ ...curr, id: FontEngine.generateUID() });
        }
      } else {
        newNodes.push({ ...curr, id: FontEngine.generateUID() });
      }
    }
    
    return { ...path, nodes: newNodes };
  }
  
  static removeOverlap(paths: Path[]): Path[] {
    return paths;
  }
  
  static getBounds(path: Path): { xMin: number; yMin: number; xMax: number; yMax: number } | null {
    if (path.nodes.length === 0) return null;
    
    let xMin = Infinity;
    let yMin = Infinity;
    let xMax = -Infinity;
    let yMax = -Infinity;
    
    path.nodes.forEach(node => {
      xMin = Math.min(xMin, node.x);
      yMin = Math.min(yMin, node.y);
      xMax = Math.max(xMax, node.x);
      yMax = Math.max(yMax, node.y);
      
      if (node.handleIn) {
        xMin = Math.min(xMin, node.handleIn.x);
        yMin = Math.min(yMin, node.handleIn.y);
        xMax = Math.max(xMax, node.handleIn.x);
        yMax = Math.max(yMax, node.handleIn.y);
      }
      
      if (node.handleOut) {
        xMin = Math.min(xMin, node.handleOut.x);
        yMin = Math.min(yMin, node.handleOut.y);
        xMax = Math.max(xMax, node.handleOut.x);
        yMax = Math.max(yMax, node.handleOut.y);
      }
    });
    
    return { xMin, yMin, xMax, yMax };
  }
  
  static correctDirection(path: Path): Path {
    if (path.nodes.length < 3) return path;
    
    let area = 0;
    for (let i = 0; i < path.nodes.length; i++) {
      const curr = path.nodes[i];
      const next = path.nodes[(i + 1) % path.nodes.length];
      area += (next.x - curr.x) * (next.y + curr.y);
    }
    
    if (area > 0) {
      return {
        ...path,
        nodes: [...path.nodes].reverse(),
      };
    }
    
    return path;
  }
  
  static addExtrema(path: Path): Path {
    const newNodes: BezierNode[] = [];
    
    for (let i = 0; i < path.nodes.length; i++) {
      const curr = path.nodes[i];
      const next = path.nodes[(i + 1) % path.nodes.length];
      
      newNodes.push(curr);
      
      if (curr.handleOut && next.handleIn) {
        const extremaPoints = this.findCubicExtrema(
          curr,
          curr.handleOut,
          next.handleIn,
          next
        );
        
        extremaPoints.forEach(t => {
          const point = this.cubicBezier(t, curr, curr.handleOut!, next.handleIn!, next);
          newNodes.push({
            id: FontEngine.generateUID(),
            x: point.x,
            y: point.y,
            type: "on-curve",
          });
        });
      }
    }
    
    return { ...path, nodes: newNodes };
  }
  
  static findCubicExtrema(p0: Point, p1: Point, p2: Point, p3: Point): number[] {
    const extrema: number[] = [];
    
    const a = 3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x);
    const b = 6 * (p0.x - 2 * p1.x + p2.x);
    const c = 3 * (p1.x - p0.x);
    
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0 && a !== 0) {
      const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      
      if (t1 > 0 && t1 < 1) extrema.push(t1);
      if (t2 > 0 && t2 < 1) extrema.push(t2);
    }
    
    const ay = 3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y);
    const by = 6 * (p0.y - 2 * p1.y + p2.y);
    const cy = 3 * (p1.y - p0.y);
    
    const discriminantY = by * by - 4 * ay * cy;
    if (discriminantY >= 0 && ay !== 0) {
      const t1 = (-by + Math.sqrt(discriminantY)) / (2 * ay);
      const t2 = (-by - Math.sqrt(discriminantY)) / (2 * ay);
      
      if (t1 > 0 && t1 < 1 && !extrema.includes(t1)) extrema.push(t1);
      if (t2 > 0 && t2 < 1 && !extrema.includes(t2)) extrema.push(t2);
    }
    
    return extrema.sort();
  }
  
  static cubicBezier(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    
    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    };
  }
}
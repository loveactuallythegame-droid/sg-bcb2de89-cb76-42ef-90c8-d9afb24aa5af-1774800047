import { Glyph, Path, BezierNode, Point } from "@/types/font";

export class FontEngine {
  static calculateBoundingBox(glyph: Glyph): Glyph["boundingBox"] {
    if (glyph.paths.length === 0) return undefined;
    
    let xMin = Infinity;
    let yMin = Infinity;
    let xMax = -Infinity;
    let yMax = -Infinity;
    
    glyph.paths.forEach(path => {
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
    });
    
    return { xMin, yMin, xMax, yMax };
  }
  
  static getVisualWidth(glyph: Glyph): number {
    const bbox = this.calculateBoundingBox(glyph);
    if (!bbox) return 0;
    return bbox.xMax - bbox.xMin;
  }
  
  static pathToSVG(path: Path): string {
    if (path.nodes.length === 0) return "";
    
    let d = `M ${path.nodes[0].x} ${path.nodes[0].y}`;
    
    for (let i = 1; i < path.nodes.length; i++) {
      const curr = path.nodes[i];
      const prev = path.nodes[i - 1];
      
      if (curr.type === "on-curve" && prev.type === "on-curve") {
        if (prev.handleOut && curr.handleIn) {
          d += ` C ${prev.handleOut.x} ${prev.handleOut.y}, ${curr.handleIn.x} ${curr.handleIn.y}, ${curr.x} ${curr.y}`;
        } else {
          d += ` L ${curr.x} ${curr.y}`;
        }
      }
    }
    
    if (path.closed) {
      const first = path.nodes[0];
      const last = path.nodes[path.nodes.length - 1];
      
      if (last.handleOut && first.handleIn) {
        d += ` C ${last.handleOut.x} ${last.handleOut.y}, ${first.handleIn.x} ${first.handleIn.y}, ${first.x} ${first.y}`;
      }
      
      d += " Z";
    }
    
    return d;
  }
  
  static simplifyPath(path: Path, tolerance: number = 2): Path {
    if (path.nodes.length <= 2) return path;
    
    const simplified: BezierNode[] = [path.nodes[0]];
    
    for (let i = 1; i < path.nodes.length - 1; i++) {
      const prev = path.nodes[i - 1];
      const curr = path.nodes[i];
      const next = path.nodes[i + 1];
      
      const distance = this.pointToLineDistance(curr, prev, next);
      
      if (distance > tolerance) {
        simplified.push(curr);
      }
    }
    
    simplified.push(path.nodes[path.nodes.length - 1]);
    
    return {
      ...path,
      nodes: simplified,
    };
  }
  
  static pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;
    
    let xx: number;
    let yy: number;
    
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  static generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
import { Font, Glyph, Path, BezierNode } from "@/types/font";
import { FontEngine } from "./fontEngine";
import opentype from "opentype.js";

export class FontFormats {
  
  static async importFromBinaryFont(file: File): Promise<Font> {
    const arrayBuffer = await file.arrayBuffer();
    const otFont = opentype.parse(arrayBuffer);
    
    const glyphs: Record<string, Glyph> = {};
    
    for (let i = 0; i < otFont.glyphs.length; i++) {
      const otGlyph = otFont.glyphs.get(i);
      if (!otGlyph.path) continue;
      
      const paths: Path[] = this.convertOpenTypePath(otGlyph.path);
      
      const glyphName = otGlyph.name || `glyph${i}`;
      const unicode = otGlyph.unicode;
      
      const glyph: Glyph = {
        id: FontEngine.generateUID(),
        name: glyphName,
        unicode: unicode,
        advanceWidth: otGlyph.advanceWidth || 600,
        leftSidebearing: otGlyph.leftSideBearing || 0,
        paths,
      };
      
      glyphs[glyph.id] = glyph;
    }
    
    const unitsPerEm = otFont.unitsPerEm || 1000;
    const ascender = otFont.ascender || 800;
    const descender = otFont.descender || -200;
    
    return {
      id: FontEngine.generateUID(),
      name: otFont.names.fullName?.en || otFont.names.fontFamily?.en || "Imported Font",
      familyName: otFont.names.fontFamily?.en || "Imported Font",
      version: otFont.names.version?.en || "1.0",
      metrics: {
        unitsPerEm,
        ascender,
        descender,
        capHeight: (otFont.tables.os2 as any)?.sCapHeight || Math.round(ascender * 0.7),
        xHeight: (otFont.tables.os2 as any)?.sxHeight || Math.round(ascender * 0.5),
      },
      glyphs,
      kerningPairs: this.extractKerningPairs(otFont),
      created: new Date(),
      modified: new Date(),
    };
  }
  
  static convertOpenTypePath(otPath: any): Path[] {
    const commands = otPath.commands;
    if (!commands || commands.length === 0) return [];
    
    const paths: Path[] = [];
    let currentPath: Path | null = null;
    let currentNodes: BezierNode[] = [];
    
    for (const cmd of commands) {
      switch (cmd.type) {
        case "M":
          if (currentNodes.length > 0 && currentPath) {
            currentPath.nodes = currentNodes;
            paths.push(currentPath);
          }
          currentPath = {
            id: FontEngine.generateUID(),
            nodes: [],
            closed: false,
          };
          currentNodes = [{
            id: FontEngine.generateUID(),
            x: Math.round(cmd.x),
            y: Math.round(cmd.y),
            type: "on-curve",
          }];
          break;
          
        case "L":
          currentNodes.push({
            id: FontEngine.generateUID(),
            x: Math.round(cmd.x),
            y: Math.round(cmd.y),
            type: "on-curve",
          });
          break;
          
        case "C":
          const lastNode = currentNodes[currentNodes.length - 1];
          if (lastNode) {
            lastNode.handleOut = {
              x: Math.round(cmd.x1),
              y: Math.round(cmd.y1),
            };
          }
          currentNodes.push({
            id: FontEngine.generateUID(),
            x: Math.round(cmd.x),
            y: Math.round(cmd.y),
            type: "on-curve",
            handleIn: {
              x: Math.round(cmd.x2),
              y: Math.round(cmd.y2),
            },
          });
          break;
          
        case "Q":
          const prevNode = currentNodes[currentNodes.length - 1];
          if (prevNode) {
            const cp1x = prevNode.x + (2/3) * (cmd.x1 - prevNode.x);
            const cp1y = prevNode.y + (2/3) * (cmd.y1 - prevNode.y);
            const cp2x = cmd.x + (2/3) * (cmd.x1 - cmd.x);
            const cp2y = cmd.y + (2/3) * (cmd.y1 - cmd.y);
            
            prevNode.handleOut = {
              x: Math.round(cp1x),
              y: Math.round(cp1y),
            };
            currentNodes.push({
              id: FontEngine.generateUID(),
              x: Math.round(cmd.x),
              y: Math.round(cmd.y),
              type: "on-curve",
              handleIn: {
                x: Math.round(cp2x),
                y: Math.round(cp2y),
              },
            });
          }
          break;
          
        case "Z":
          if (currentPath) {
            currentPath.closed = true;
          }
          break;
      }
    }
    
    if (currentNodes.length > 0 && currentPath) {
      currentPath.nodes = currentNodes;
      paths.push(currentPath);
    }
    
    return paths;
  }
  
  static extractKerningPairs(otFont: any): Record<string, number> {
    const kerningPairs: Record<string, number> = {};
    
    if (otFont.tables.gpos && otFont.tables.gpos.lookups) {
      for (const lookup of otFont.tables.gpos.lookups) {
        if (lookup.lookupType === 2) {
          for (const subtable of lookup.subtables) {
            if (subtable.coverage && subtable.coverage.glyphs) {
              for (let i = 0; i < subtable.coverage.glyphs.length; i++) {
                const leftGlyph = otFont.glyphs.get(subtable.coverage.glyphs[i]);
                if (subtable.pairSets && subtable.pairSets[i]) {
                  for (const pair of subtable.pairSets[i]) {
                    const rightGlyph = otFont.glyphs.get(pair.secondGlyph);
                    if (leftGlyph && rightGlyph && pair.value1 && pair.value1.xAdvance) {
                      const key = `${leftGlyph.name}_${rightGlyph.name}`;
                      kerningPairs[key] = pair.value1.xAdvance;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return kerningPairs;
  }
  
  static exportToOTF(font: Font): Blob {
    const notdefGlyph = new opentype.Glyph({
      name: ".notdef",
      unicode: undefined,
      advanceWidth: 600,
      path: new opentype.Path()
    });
    
    const glyphArray = [notdefGlyph];
    
    Object.values(font.glyphs).forEach(glyph => {
      const otPath = new opentype.Path();
      
      glyph.paths.forEach(path => {
        if (path.nodes.length === 0) return;
        
        const firstNode = path.nodes[0];
        otPath.moveTo(firstNode.x, firstNode.y);
        
        for (let i = 1; i < path.nodes.length; i++) {
          const curr = path.nodes[i];
          const prev = path.nodes[i - 1];
          
          if (prev.handleOut && curr.handleIn) {
            otPath.curveTo(
              prev.handleOut.x,
              prev.handleOut.y,
              curr.handleIn.x,
              curr.handleIn.y,
              curr.x,
              curr.y
            );
          } else {
            otPath.lineTo(curr.x, curr.y);
          }
        }
        
        if (path.closed && path.nodes.length > 0) {
          const last = path.nodes[path.nodes.length - 1];
          const first = path.nodes[0];
          
          if (last.handleOut && first.handleIn) {
            otPath.curveTo(
              last.handleOut.x,
              last.handleOut.y,
              first.handleIn.x,
              first.handleIn.y,
              first.x,
              first.y
            );
          }
          otPath.close();
        }
      });
      
      const otGlyph = new opentype.Glyph({
        name: glyph.name,
        unicode: glyph.unicode,
        advanceWidth: glyph.advanceWidth,
        path: otPath
      });
      
      glyphArray.push(otGlyph);
    });
    
    const otFont = new opentype.Font({
      familyName: font.familyName,
      styleName: "Regular",
      unitsPerEm: font.metrics.unitsPerEm,
      ascender: font.metrics.ascender,
      descender: font.metrics.descender,
      glyphs: glyphArray
    });
    
    const arrayBuffer = otFont.toArrayBuffer();
    return new Blob([arrayBuffer], { type: "font/otf" });
  }
  
  static exportToTTF(font: Font): Blob {
    return this.exportToOTF(font);
  }
  
  static exportToWOFF2(font: Font): Blob {
    return this.exportToOTF(font);
  }
  
  static exportToUFO(font: Font): Blob {
    const ufoData = {
      fontinfo: {
        familyName: font.familyName,
        styleName: "Regular",
        versionMajor: parseInt(font.version.split(".")[0]),
        versionMinor: parseInt(font.version.split(".")[1] || "0"),
        unitsPerEm: font.metrics.unitsPerEm,
        ascender: font.metrics.ascender,
        descender: font.metrics.descender,
        capHeight: font.metrics.capHeight,
        xHeight: font.metrics.xHeight,
      },
      glyphs: Object.values(font.glyphs).map(glyph => ({
        name: glyph.name,
        unicode: glyph.unicode,
        width: glyph.advanceWidth,
        outline: this.glyphToUFOContours(glyph),
      })),
      kerning: font.kerningPairs,
    };
    
    return new Blob([JSON.stringify(ufoData, null, 2)], { type: "application/json" });
  }
  
  static glyphToUFOContours(glyph: Glyph): any[] {
    return glyph.paths.map(path => ({
      points: path.nodes.map(node => ({
        x: Math.round(node.x),
        y: Math.round(node.y),
        type: node.type === "on-curve" ? "curve" : "offcurve",
        smooth: !!node.handleIn || !!node.handleOut,
      })),
      closed: path.closed,
    }));
  }
  
  static exportToSVG(font: Font): Blob {
    const glyphs = Object.values(font.glyphs);
    const cellSize = 200;
    const cols = 16;
    const rows = Math.ceil(glyphs.length / cols);
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * cellSize} ${rows * cellSize}">
  <defs>
    <style>
      .glyph-cell { fill: #1a1a1a; }
      .glyph-path { fill: currentColor; }
      .glyph-name { fill: #888; font-family: monospace; font-size: 12px; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#0a0a0a"/>
`;
    
    glyphs.forEach((glyph, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellSize;
      const y = row * cellSize;
      
      svg += `  <g transform="translate(${x + cellSize / 2}, ${y + cellSize / 2})">
    <rect class="glyph-cell" x="${-cellSize / 2}" y="${-cellSize / 2}" width="${cellSize}" height="${cellSize}" rx="8"/>
`;
      
      if (glyph.paths.length > 0) {
        const bbox = FontEngine.calculateBoundingBox(glyph);
        if (bbox) {
          const glyphWidth = bbox.xMax - bbox.xMin;
          const glyphHeight = bbox.yMax - bbox.yMin;
          const scale = Math.min(cellSize / glyphWidth, cellSize / glyphHeight) * 0.6;
          const centerX = -(bbox.xMin + bbox.xMax) / 2;
          const centerY = (bbox.yMin + bbox.yMax) / 2;
          
          svg += `    <g transform="scale(${scale}, ${-scale}) translate(${centerX}, ${-centerY})">
`;
          
          glyph.paths.forEach(path => {
            const d = FontEngine.pathToSVG(path);
            svg += `      <path class="glyph-path" d="${d}" fill="#00f5ff"/>
`;
          });
          
          svg += `    </g>
`;
        }
      }
      
      svg += `    <text class="glyph-name" x="0" y="${cellSize / 2 - 10}" text-anchor="middle">${glyph.name}</text>
  </g>
`;
    });
    
    svg += `</svg>`;
    
    return new Blob([svg], { type: "image/svg+xml" });
  }
  
  static exportToJSON(font: Font): Blob {
    const exportData = {
      ...font,
      created: font.created.toISOString(),
      modified: font.modified.toISOString(),
    };
    
    return new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  }
  
  static async importFromJSON(file: File): Promise<Font> {
    const text = await file.text();
    const data = JSON.parse(text);
    
    return {
      ...data,
      created: new Date(data.created),
      modified: new Date(data.modified),
    };
  }
  
  static async importFromUFO(file: File): Promise<Font> {
    const text = await file.text();
    const ufoData = JSON.parse(text);
    
    const glyphs: Record<string, Glyph> = {};
    
    ufoData.glyphs.forEach((glyphData: any) => {
      const paths: Path[] = glyphData.outline.map((contour: any) => ({
        id: FontEngine.generateUID(),
        closed: contour.closed,
        nodes: contour.points.map((point: any) => ({
          id: FontEngine.generateUID(),
          x: point.x,
          y: point.y,
          type: point.type === "curve" ? "on-curve" : "off-curve",
        })),
      }));
      
      const glyph: Glyph = {
        id: FontEngine.generateUID(),
        name: glyphData.name,
        unicode: glyphData.unicode,
        advanceWidth: glyphData.width,
        leftSidebearing: 0,
        paths,
      };
      
      glyphs[glyph.id] = glyph;
    });
    
    return {
      id: FontEngine.generateUID(),
      name: ufoData.fontinfo.familyName,
      familyName: ufoData.fontinfo.familyName,
      version: `${ufoData.fontinfo.versionMajor}.${ufoData.fontinfo.versionMinor}`,
      metrics: {
        unitsPerEm: ufoData.fontinfo.unitsPerEm,
        ascender: ufoData.fontinfo.ascender,
        descender: ufoData.fontinfo.descender,
        capHeight: ufoData.fontinfo.capHeight,
        xHeight: ufoData.fontinfo.xHeight,
      },
      glyphs,
      kerningPairs: ufoData.kerning || {},
      created: new Date(),
      modified: new Date(),
    };
  }
  
  static downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
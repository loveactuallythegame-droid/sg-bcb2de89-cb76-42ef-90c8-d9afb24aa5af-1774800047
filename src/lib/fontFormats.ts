import { Font, Glyph, Path, BezierNode } from "@/types/font";
import { FontEngine } from "./fontEngine";

export class FontFormats {
  
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
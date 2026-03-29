import { useRef, useEffect, useState } from "react";
import { Font, Glyph } from "@/types/font";
import { FontEngine } from "@/lib/fontEngine";
import { Type, AlignLeft, AlignCenter, AlignRight, Minus, Plus } from "lucide-react";

interface PreviewPanelProps {
  font: Font;
}

export function PreviewPanel({ font }: PreviewPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog");
  const [fontSize, setFontSize] = useState(72);
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("left");
  const [lineHeight, setLineHeight] = useState(1.2);
  const [letterSpacing, setLetterSpacing] = useState(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    const lines = text.split("\n");
    const scale = fontSize / font.metrics.unitsPerEm;
    const lineHeightPx = fontSize * lineHeight;
    
    lines.forEach((line, lineIndex) => {
      const y = lineHeightPx * (lineIndex + 1);
      renderLine(ctx, line, y, scale, rect.width);
    });
  }, [text, fontSize, alignment, lineHeight, letterSpacing, font]);
  
  const renderLine = (
    ctx: CanvasRenderingContext2D,
    line: string,
    y: number,
    scale: number,
    canvasWidth: number
  ) => {
    const glyphs: Array<{ glyph: Glyph | null; char: string }> = [];
    let totalWidth = 0;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const glyph = findGlyphForChar(char);
      glyphs.push({ glyph, char });
      
      if (glyph) {
        totalWidth += glyph.advanceWidth * scale;
        
        if (i < line.length - 1) {
          const nextChar = line[i + 1];
          const nextGlyph = findGlyphForChar(nextChar);
          if (nextGlyph) {
            const kerningKey = `${glyph.name}_${nextGlyph.name}`;
            const kerning = font.kerningPairs[kerningKey] || 0;
            totalWidth += kerning * scale;
          }
        }
        
        totalWidth += letterSpacing;
      }
    }
    
    let x = 0;
    if (alignment === "center") {
      x = (canvasWidth - totalWidth) / 2;
    } else if (alignment === "right") {
      x = canvasWidth - totalWidth;
    }
    
    ctx.save();
    ctx.fillStyle = "hsl(var(--foreground))";
    
    glyphs.forEach(({ glyph, char }, index) => {
      if (!glyph) {
        if (char === " ") {
          x += font.metrics.unitsPerEm * 0.25 * scale;
        }
        return;
      }
      
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, -scale);
      
      glyph.paths.forEach(path => {
        const svgPath = FontEngine.pathToSVG(path);
        const path2d = new Path2D(svgPath);
        ctx.fill(path2d);
      });
      
      ctx.restore();
      
      x += glyph.advanceWidth * scale;
      
      if (index < glyphs.length - 1) {
        const nextGlyph = glyphs[index + 1].glyph;
        if (nextGlyph) {
          const kerningKey = `${glyph.name}_${nextGlyph.name}`;
          const kerning = font.kerningPairs[kerningKey] || 0;
          x += kerning * scale;
        }
      }
      
      x += letterSpacing;
    });
    
    ctx.restore();
  };
  
  const findGlyphForChar = (char: string): Glyph | null => {
    const unicode = char.charCodeAt(0);
    
    for (const glyph of Object.values(font.glyphs)) {
      if (glyph.unicode === unicode) {
        return glyph;
      }
    }
    
    const charLower = char.toLowerCase();
    for (const glyph of Object.values(font.glyphs)) {
      if (glyph.name === char || glyph.name === charLower) {
        return glyph;
      }
    }
    
    return null;
  };
  
  const hasGlyphs = Object.keys(font.glyphs).length > 0;
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="glass-panel border-b border-border p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground mb-2 block">
              <Type className="w-4 h-4 inline mr-1" />
              Type your text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something to preview your font..."
              className="w-full px-4 py-3 glass-panel rounded-lg text-base resize-none"
              rows={3}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Font Size</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 6))}
                className="tool-btn"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 72)}
                className="flex-1 px-3 py-2 glass-panel rounded-lg text-sm text-center"
                min="12"
                max="300"
              />
              <button
                onClick={() => setFontSize(Math.min(300, fontSize + 6))}
                className="tool-btn"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Line Height</label>
            <input
              type="range"
              value={lineHeight}
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
              min="0.8"
              max="2.0"
              step="0.1"
              className="w-full"
            />
            <div className="text-xs text-center mt-1">{lineHeight.toFixed(1)}</div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Letter Spacing</label>
            <input
              type="range"
              value={letterSpacing}
              onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
              min="-20"
              max="50"
              step="1"
              className="w-full"
            />
            <div className="text-xs text-center mt-1">{letterSpacing}px</div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Alignment</label>
            <div className="flex gap-1">
              <button
                onClick={() => setAlignment("left")}
                className={`tool-btn flex-1 ${alignment === "left" ? "active" : ""}`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAlignment("center")}
                className={`tool-btn flex-1 ${alignment === "center" ? "active" : ""}`}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAlignment("right")}
                className={`tool-btn flex-1 ${alignment === "right" ? "active" : ""}`}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 md:p-8">
        {hasGlyphs ? (
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ minHeight: "400px" }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Type className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Glyphs Yet</h3>
              <p className="text-muted-foreground">
                Create some glyphs first to see your font in action
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
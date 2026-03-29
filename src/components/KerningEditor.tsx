import { useState, useRef, useEffect } from "react";
import { Font, Glyph } from "@/types/font";
import { ArrowLeftRight, Plus, Minus } from "lucide-react";

interface KerningEditorProps {
  font: Font;
  onKerningChange: (leftGlyph: string, rightGlyph: string, value: number) => void;
}

export function KerningEditor({ font, onKerningChange }: KerningEditorProps) {
  const [leftGlyph, setLeftGlyph] = useState<string>("");
  const [rightGlyph, setRightGlyph] = useState<string>("");
  const [kernValue, setKernValue] = useState<number>(0);
  const [previewText, setPreviewText] = useState<string>("AVATAR");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const glyphNames = Object.values(font.glyphs).map(g => g.name).sort();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = 200 * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "hsl(var(--muted))";
    ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
    
    const baseline = 140;
    ctx.strokeStyle = "hsl(var(--accent) / 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baseline);
    ctx.lineTo(canvas.width / window.devicePixelRatio, baseline);
    ctx.stroke();
    
    let x = 40;
    const scale = 0.15;
    
    for (const char of previewText) {
      const glyph = Object.values(font.glyphs).find(g => g.name === char || g.name === char.toLowerCase());
      if (!glyph) continue;
      
      ctx.save();
      ctx.translate(x, baseline);
      ctx.scale(scale, -scale);
      
      glyph.paths.forEach(path => {
        ctx.fillStyle = "hsl(var(--foreground))";
        ctx.strokeStyle = "hsl(var(--foreground))";
        ctx.lineWidth = 2 / scale;
        
        ctx.beginPath();
        path.nodes.forEach((node, i) => {
          if (i === 0) {
            ctx.moveTo(node.x, node.y);
          } else {
            const prev = path.nodes[i - 1];
            if (prev.handleOut && node.handleIn) {
              ctx.bezierCurveTo(
                prev.handleOut.x, prev.handleOut.y,
                node.handleIn.x, node.handleIn.y,
                node.x, node.y
              );
            } else {
              ctx.lineTo(node.x, node.y);
            }
          }
        });
        
        if (path.closed && path.nodes.length > 0) {
          const first = path.nodes[0];
          const last = path.nodes[path.nodes.length - 1];
          if (last.handleOut && first.handleIn) {
            ctx.bezierCurveTo(
              last.handleOut.x, last.handleOut.y,
              first.handleIn.x, first.handleIn.y,
              first.x, first.y
            );
          }
          ctx.closePath();
        }
        
        ctx.fill();
      });
      
      ctx.restore();
      
      const prevChar = previewText[previewText.indexOf(char) - 1];
      const kerningKey = `${prevChar || ""}_${char}`;
      const kerning = font.kerningPairs[kerningKey] || 0;
      
      x += (glyph.advanceWidth * scale) + (kerning * scale);
    }
  }, [font, previewText, leftGlyph, rightGlyph, kernValue]);
  
  const handleKernAdjust = (delta: number) => {
    const newValue = kernValue + delta;
    setKernValue(newValue);
    if (leftGlyph && rightGlyph) {
      onKerningChange(leftGlyph, rightGlyph, newValue);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ArrowLeftRight className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold gradient-text">Spacing & Kerning Tester</h3>
      </div>
      
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Preview Text</label>
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value.toUpperCase())}
          className="w-full px-3 py-2 glass-panel rounded-lg text-sm focus:ring-2 focus:ring-accent transition-all"
          placeholder="Type to preview..."
        />
      </div>
      
      <div className="glass-panel rounded-xl overflow-hidden">
        <canvas 
          ref={canvasRef}
          className="w-full"
          style={{ height: "200px" }}
        />
      </div>
      
      <div className="glass-panel rounded-xl p-4 space-y-4">
        <h4 className="text-sm font-semibold">Adjust Kerning Pair</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Left Glyph</label>
            <select
              value={leftGlyph}
              onChange={(e) => setLeftGlyph(e.target.value)}
              className="w-full px-3 py-2 glass-panel rounded-lg text-sm"
            >
              <option value="">Select...</option>
              {glyphNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Right Glyph</label>
            <select
              value={rightGlyph}
              onChange={(e) => setRightGlyph(e.target.value)}
              className="w-full px-3 py-2 glass-panel rounded-lg text-sm"
            >
              <option value="">Select...</option>
              {glyphNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleKernAdjust(-10)}
            className="tool-btn"
            disabled={!leftGlyph || !rightGlyph}
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <div className="flex-1">
            <input
              type="range"
              min="-200"
              max="200"
              value={kernValue}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setKernValue(value);
                if (leftGlyph && rightGlyph) {
                  onKerningChange(leftGlyph, rightGlyph, value);
                }
              }}
              disabled={!leftGlyph || !rightGlyph}
              className="w-full"
            />
            <div className="text-center text-sm text-muted-foreground mt-1">
              {kernValue} units
            </div>
          </div>
          
          <button
            onClick={() => handleKernAdjust(10)}
            className="tool-btn"
            disabled={!leftGlyph || !rightGlyph}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {leftGlyph && rightGlyph && (
          <div className="text-xs text-muted-foreground">
            Kerning pair: {leftGlyph} + {rightGlyph}
          </div>
        )}
      </div>
    </div>
  );
}
import { Glyph, Font } from "@/types/font";
import { FontEngine } from "@/lib/fontEngine";
import { useRef, useEffect } from "react";

interface GlyphGridProps {
  font: Font;
  selectedGlyph: Glyph | null;
  onGlyphSelect: (glyph: Glyph) => void;
  onGlyphCreate: (name: string) => void;
}

export function GlyphGrid({
  font,
  selectedGlyph,
  onGlyphSelect,
  onGlyphCreate,
}: GlyphGridProps) {
  const glyphs = Object.values(font.glyphs);
  
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold gradient-text">All Glyphs Grid</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {glyphs.length} glyph{glyphs.length !== 1 ? "s" : ""} in {font.familyName}
            </p>
          </div>
          
          <button
            onClick={() => {
              const name = prompt("Enter glyph name (e.g., 'a', 'B', 'comma'):");
              if (name) onGlyphCreate(name);
            }}
            className="btn-primary"
          >
            + Create New Glyph
          </button>
        </div>
        
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
          {glyphs.map((glyph) => (
            <GlyphCard
              key={glyph.id}
              glyph={glyph}
              isSelected={selectedGlyph?.id === glyph.id}
              onClick={() => onGlyphSelect(glyph)}
            />
          ))}
          
          {glyphs.length === 0 && (
            <div className="col-span-full glass-panel rounded-xl p-12 text-center">
              <p className="text-muted-foreground mb-4">No glyphs yet. Create your first glyph to get started!</p>
              <button
                onClick={() => onGlyphCreate("a")}
                className="btn-primary"
              >
                Create "a" Glyph
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface GlyphCardProps {
  glyph: Glyph;
  isSelected: boolean;
  onClick: () => void;
}

function GlyphCard({ glyph, isSelected, onClick }: GlyphCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const size = 80;
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    if (glyph.paths.length === 0) return;
    
    const bbox = FontEngine.calculateBoundingBox(glyph);
    if (!bbox) return;
    
    const glyphWidth = bbox.xMax - bbox.xMin;
    const glyphHeight = bbox.yMax - bbox.yMin;
    const scale = Math.min(size / glyphWidth, size / glyphHeight) * 0.7;
    
    ctx.translate(size / 2, size / 2);
    ctx.scale(scale, -scale);
    ctx.translate(-(bbox.xMin + bbox.xMax) / 2, -(bbox.yMin + bbox.yMax) / 2);
    
    glyph.paths.forEach(path => {
      const svgPath = FontEngine.pathToSVG(path);
      const path2d = new Path2D(svgPath);
      
      ctx.fillStyle = isSelected ? "hsl(var(--accent))" : "hsl(var(--foreground))";
      ctx.fill(path2d);
    });
  }, [glyph, isSelected]);
  
  return (
    <button
      onClick={onClick}
      className={`glass-panel rounded-lg p-3 hover:scale-105 transition-all ${
        isSelected ? "ring-2 ring-accent" : ""
      }`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-20 mb-2"
      />
      <div className="text-xs text-center truncate text-muted-foreground">
        {glyph.name}
      </div>
    </button>
  );
}
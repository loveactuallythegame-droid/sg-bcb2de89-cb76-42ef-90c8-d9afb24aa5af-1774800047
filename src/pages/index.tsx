import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { GlyphCanvas } from "@/components/GlyphCanvas";
import { Glyph, Tool, Font, FontMetrics } from "@/types/font";
import { FontEngine } from "@/lib/fontEngine";
import { Button } from "@/components/ui/button";
import { 
  MousePointer2, 
  Pen, 
  Scissors, 
  Ruler, 
  Square, 
  Circle, 
  Hand,
  Download,
  Upload,
  Grid3x3,
  Undo2,
  Redo2,
} from "lucide-react";

export default function Home() {
  const [currentGlyph, setCurrentGlyph] = useState<Glyph | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("pen");
  const [zoom, setZoom] = useState(1);
  
  useEffect(() => {
    const sampleGlyph: Glyph = {
      id: FontEngine.generateUID(),
      name: "A",
      unicode: 65,
      advanceWidth: 600,
      leftSidebearing: 50,
      paths: [],
    };
    
    setCurrentGlyph(sampleGlyph);
  }, []);
  
  const tools: { tool: Tool; icon: typeof MousePointer2; label: string }[] = [
    { tool: "select", icon: MousePointer2, label: "Select Tool" },
    { tool: "pen", icon: Pen, label: "Draw Paths" },
    { tool: "knife", icon: Scissors, label: "Cut Paths" },
    { tool: "ruler", icon: Ruler, label: "Measure Distance" },
    { tool: "rectangle", icon: Square, label: "Draw Rectangle" },
    { tool: "ellipse", icon: Circle, label: "Draw Circle" },
    { tool: "hand", icon: Hand, label: "Pan Canvas" },
  ];
  
  const handleGlyphChange = (updatedGlyph: Glyph) => {
    setCurrentGlyph(updatedGlyph);
  };
  
  return (
    <>
      <SEO 
        title="I ❤️ Fonts - Professional Font Editor"
        description="Create beautiful, production-ready fonts with our mobile-first font editor. Draw glyphs, adjust spacing, and export professional-quality font files."
      />
      
      <Layout>
        <div className="flex-1 flex flex-col lg:flex-row gap-0">
          <aside className="glass-panel border-r w-full lg:w-20 flex lg:flex-col items-center gap-2 p-2 lg:p-4">
            {tools.map(({ tool, icon: Icon, label }) => (
              <Button
                key={tool}
                variant={selectedTool === tool ? "default" : "ghost"}
                size="icon"
                onClick={() => setSelectedTool(tool)}
                className={`
                  spring-scale w-12 h-12 lg:w-14 lg:h-14
                  ${selectedTool === tool ? "glow-cyan" : ""}
                `}
                title={label}
              >
                <Icon className="w-5 h-5" />
              </Button>
            ))}
            
            <div className="hidden lg:block h-px w-full bg-border my-2" />
            
            <Button
              variant="ghost"
              size="icon"
              className="spring-scale w-12 h-12 lg:w-14 lg:h-14"
              title="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="spring-scale w-12 h-12 lg:w-14 lg:h-14"
              title="Redo"
            >
              <Redo2 className="w-5 h-5" />
            </Button>
          </aside>
          
          <div className="flex-1 flex flex-col">
            <div className="glass-panel border-b p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">
                  Glyph Drawing Canvas: {currentGlyph?.name || "Untitled"}
                </h2>
                <span className="text-sm text-muted-foreground">
                  Unicode: U+{currentGlyph?.unicode?.toString(16).toUpperCase().padStart(4, "0") || "0000"}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="spring-scale">
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  All Glyphs Grid
                </Button>
                <Button variant="outline" size="sm" className="spring-scale">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Font
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="spring-scale bg-gradient-to-r from-primary to-secondary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Final Font File
                </Button>
              </div>
            </div>
            
            <GlyphCanvas
              glyph={currentGlyph}
              selectedTool={selectedTool}
              zoom={zoom}
              onZoomChange={setZoom}
              onGlyphChange={handleGlyphChange}
            />
          </div>
          
          <aside className="glass-panel border-l w-full lg:w-80 p-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Glyph Properties</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Advance Width:</span>
                  <span className="font-mono">{currentGlyph?.advanceWidth || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Left Sidebearing:</span>
                  <span className="font-mono">{currentGlyph?.leftSidebearing || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visual Width:</span>
                  <span className="font-mono">
                    {currentGlyph ? Math.round(FontEngine.getVisualWidth(currentGlyph)) : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Path Count:</span>
                  <span className="font-mono">{currentGlyph?.paths.length || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start spring-scale">
                  Copy Box Containing Glyph
                </Button>
                <Button variant="outline" className="w-full justify-start spring-scale">
                  Copy Just Glyph&apos;s Visual Width
                </Button>
                <Button variant="outline" className="w-full justify-start spring-scale">
                  Convert Stroke to Filled Outline
                </Button>
                <Button variant="outline" className="w-full justify-start spring-scale">
                  Clean Up Unnecessary Points
                </Button>
                <Button variant="outline" className="w-full justify-start spring-scale">
                  Add Points at Curve Peaks
                </Button>
                <Button variant="outline" className="w-full justify-start spring-scale">
                  Fix Path Direction (Clockwise)
                </Button>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Current Tool</h3>
              <div className="glass-panel p-4 rounded-lg text-center">
                <div className="text-4xl mb-2">
                  {tools.find(t => t.tool === selectedTool)?.icon && (
                    (() => {
                      const Icon = tools.find(t => t.tool === selectedTool)!.icon;
                      return <Icon className="w-12 h-12 mx-auto text-primary" />;
                    })()
                  )}
                </div>
                <p className="text-sm font-medium">
                  {tools.find(t => t.tool === selectedTool)?.label}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </Layout>
    </>
  );
}
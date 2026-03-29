import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { GlyphCanvas } from "@/components/GlyphCanvas";
import { GlyphGrid } from "@/components/GlyphGrid";
import { ExportModal } from "@/components/ExportModal";
import { ImportModal } from "@/components/ImportModal";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Font, Glyph, Tool } from "@/types/font";
import { FontEngine } from "@/lib/fontEngine";
import { 
  MousePointer2, Pen, Scissors, Ruler, Square, 
  Circle, Hand, Grid3x3, Eye, Undo2, Redo2,
  Download, Upload, Settings, Save, Heart
} from "lucide-react";

const INITIAL_FONT: Font = {
  id: FontEngine.generateUID(),
  name: "My Custom Font",
  familyName: "My Custom Font",
  version: "1.0",
  metrics: {
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    capHeight: 700,
    xHeight: 500,
  },
  glyphs: {},
  kerningPairs: {},
  created: new Date(),
  modified: new Date(),
};

export default function Home() {
  const [viewMode, setViewMode] = useState<"canvas" | "grid">("canvas");
  const [font, setFont] = useState<Font>(INITIAL_FONT);
  const [selectedGlyph, setSelectedGlyph] = useState<Glyph | null>(null);
  const { state: glyph, setState: setGlyph, undo, redo, canUndo, canRedo } = useUndoRedo<Glyph | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  useEffect(() => {
    if (glyph && selectedGlyph && glyph.id === selectedGlyph.id) {
      setSelectedGlyph(glyph);
      setFont(prev => ({
        ...prev,
        glyphs: {
          ...prev.glyphs,
          [glyph.id]: glyph,
        },
      }));
    }
  }, [glyph, selectedGlyph]);
  
  const handleGlyphChange = (updatedGlyph: Glyph) => {
    setGlyph(updatedGlyph);
  };
  
  const handleGlyphSelect = (selectedGlyph: Glyph) => {
    setSelectedGlyph(selectedGlyph);
    setGlyph(selectedGlyph);
    setViewMode("canvas");
  };
  
  const handleGlyphCreate = (name: string) => {
    const newGlyph: Glyph = {
      id: FontEngine.generateUID(),
      name,
      advanceWidth: 600,
      leftSidebearing: 50,
      paths: [],
    };
    
    setFont(prev => ({
      ...prev,
      glyphs: {
        ...prev.glyphs,
        [newGlyph.id]: newGlyph,
      },
    }));
    
    handleGlyphSelect(newGlyph);
  };
  
  const tools: Array<{ tool: Tool; icon: typeof MousePointer2; label: string; shortcut?: string }> = [
    { tool: "select", icon: MousePointer2, label: "Select Tool", shortcut: "V" },
    { tool: "pen", icon: Pen, label: "Pen Tool", shortcut: "P" },
    { tool: "knife", icon: Scissors, label: "Knife Tool", shortcut: "K" },
    { tool: "ruler", icon: Ruler, label: "Ruler Tool", shortcut: "R" },
    { tool: "rectangle", icon: Square, label: "Rectangle Tool", shortcut: "M" },
    { tool: "ellipse", icon: Circle, label: "Ellipse Tool", shortcut: "O" },
    { tool: "hand", icon: Hand, label: "Hand Tool (Pan)", shortcut: "H" },
  ];
  
  const handleExport = () => {
    setIsExportModalOpen(true);
  };
  
  const handleImport = () => {
    setIsImportModalOpen(true);
  };
  
  const handleFontImport = (importedFont: Font) => {
    setFont(importedFont);
    setSelectedGlyph(null);
    setGlyph(null);
  };
  
  return (
    <>
      <SEO 
        title="I ❤️ Fonts - Professional Font Editor"
        description="Create beautiful custom fonts with an intuitive, mobile-first editor. Full Bézier curve editing, real-time preview, and professional export options."
      />
      
      <Layout>
        <div className="flex h-screen">
          <aside className="w-16 glass-panel border-r border-border flex flex-col items-center py-4 gap-3">
            <div className="text-2xl mb-4">
              <Heart className="w-6 h-6 text-accent fill-accent" />
            </div>
            
            <div className="flex-1 flex flex-col gap-2">
              {tools.map(({ tool, icon: Icon, label }) => (
                <button
                  key={tool}
                  onClick={() => setSelectedTool(tool)}
                  className={`tool-btn ${selectedTool === tool ? "active" : ""}`}
                  title={label}
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
            
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <button
                onClick={() => setViewMode(viewMode === "canvas" ? "grid" : "canvas")}
                className="tool-btn"
                title={viewMode === "canvas" ? "All Glyphs Grid" : "Glyph Drawing Canvas"}
              >
                {viewMode === "canvas" ? <Grid3x3 className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </aside>
          
          <main className="flex-1 flex flex-col">
            <header className="glass-panel border-b border-border px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold gradient-text">
                  {viewMode === "canvas" ? "Glyph Drawing Canvas" : "All Glyphs Grid"}
                </h1>
                {selectedGlyph && viewMode === "canvas" && (
                  <span className="text-sm text-muted-foreground">
                    Editing: {selectedGlyph.name}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {viewMode === "canvas" && (
                  <>
                    <button
                      onClick={undo}
                      disabled={!canUndo}
                      className="tool-btn disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Undo (Cmd/Ctrl+Z)"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={redo}
                      disabled={!canRedo}
                      className="tool-btn disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Redo (Cmd/Ctrl+Shift+Z)"
                    >
                      <Redo2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-border mx-1" />
                  </>
                )}
                
                <button onClick={handleImport} className="tool-btn" title="Import Font File">
                  <Upload className="w-4 h-4" />
                </button>
                <button onClick={handleExport} className="tool-btn" title="Export Final Font File">
                  <Download className="w-4 h-4" />
                </button>
                <button className="tool-btn" title="Font Settings">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </header>
            
            {viewMode === "canvas" ? (
              <div className="flex-1 flex">
                {glyph ? (
                  <GlyphCanvas
                    glyph={glyph}
                    selectedTool={selectedTool}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    onGlyphChange={handleGlyphChange}
                    onUndo={undo}
                    onRedo={redo}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No Glyph Selected</h2>
                      <p className="text-muted-foreground mb-4">
                        Create or select a glyph to start editing
                      </p>
                      <button
                        onClick={() => setViewMode("grid")}
                        className="btn-primary"
                      >
                        Go to All Glyphs Grid
                      </button>
                    </div>
                  </div>
                )}
                
                {glyph && (
                  <aside className="w-80 glass-panel border-l border-border p-6 overflow-auto">
                    <h3 className="text-lg font-semibold mb-4">Glyph Properties</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Name</label>
                        <input
                          type="text"
                          value={glyph.name}
                          onChange={(e) => {
                            const updated = { ...glyph, name: e.target.value };
                            setGlyph(updated);
                          }}
                          className="w-full px-3 py-2 mt-1 glass-panel rounded-lg text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm text-muted-foreground">Advance Width</label>
                        <input
                          type="number"
                          value={glyph.advanceWidth}
                          onChange={(e) => {
                            const updated = { ...glyph, advanceWidth: parseInt(e.target.value) || 0 };
                            setGlyph(updated);
                          }}
                          className="w-full px-3 py-2 mt-1 glass-panel rounded-lg text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm text-muted-foreground">Left Sidebearing</label>
                        <input
                          type="number"
                          value={glyph.leftSidebearing}
                          onChange={(e) => {
                            const updated = { ...glyph, leftSidebearing: parseInt(e.target.value) || 0 };
                            setGlyph(updated);
                          }}
                          className="w-full px-3 py-2 mt-1 glass-panel rounded-lg text-sm"
                        />
                      </div>
                      
                      <div className="pt-4 border-t border-border">
                        <div className="text-sm text-muted-foreground mb-2">Statistics</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Paths:</span>
                            <span>{glyph.paths.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Nodes:</span>
                            <span>{glyph.paths.reduce((sum, p) => sum + p.nodes.length, 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Visual Width:</span>
                            <span>{Math.round(FontEngine.getVisualWidth(glyph))}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 space-y-2">
                        <button
                          onClick={() => {
                            const simplified = {
                              ...glyph,
                              paths: glyph.paths.map(p => FontEngine.simplifyPath(p, 5)),
                            };
                            setGlyph(simplified);
                          }}
                          className="btn-secondary w-full"
                        >
                          Clean Up Unnecessary Points
                        </button>
                        
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify({ advanceWidth: glyph.advanceWidth, leftSidebearing: glyph.leftSidebearing })
                            );
                          }}
                          className="btn-secondary w-full"
                        >
                          Copy Box Containing Glyph
                        </button>
                        
                        <button
                          onClick={() => {
                            const visualWidth = FontEngine.getVisualWidth(glyph);
                            navigator.clipboard.writeText(visualWidth.toString());
                          }}
                          className="btn-secondary w-full"
                        >
                          Copy Just Glyph's Visual Width
                        </button>
                      </div>
                    </div>
                  </aside>
                )}
              </div>
            ) : (
              <GlyphGrid
                font={font}
                selectedGlyph={selectedGlyph}
                onGlyphSelect={handleGlyphSelect}
                onGlyphCreate={handleGlyphCreate}
              />
            )}
          </main>
        </div>
      </Layout>
      
      <ExportModal
        font={font}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleFontImport}
      />
    </>
  );
}
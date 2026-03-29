import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { GlyphCanvas } from "@/components/GlyphCanvas";
import { GlyphGrid } from "@/components/GlyphGrid";
import { ExportModal } from "@/components/ExportModal";
import { ImportModal } from "@/components/ImportModal";
import { SettingsModal } from "@/components/SettingsModal";
import { KerningEditor } from "@/components/KerningEditor";
import { PreviewPanel } from "@/components/PreviewPanel";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Font, Glyph, Tool, ViewMode } from "@/types/font";
import { FontEngine } from "@/lib/fontEngine";
import { PathOperations } from "@/lib/pathOperations";
import { 
  MousePointer2, Pen, Square, Circle, Hand, Grid3x3, 
  Eye, Undo2, Redo2, Download, Upload, Settings, 
  Heart, ArrowLeftRight, Menu, X, Type, FlipHorizontal,
  FlipVertical, RotateCw, Maximize2, Minimize2
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
  const [viewMode, setViewMode] = useState<ViewMode>("canvas");
  const [font, setFont] = useState<Font>(INITIAL_FONT);
  const [selectedGlyph, setSelectedGlyph] = useState<Glyph | null>(null);
  const { state: glyph, setState: setGlyph, undo, redo, canUndo, canRedo } = useUndoRedo<Glyph | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  
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
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toLowerCase();
      
      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        switch (key) {
          case "v":
            setSelectedTool("select");
            break;
          case "p":
            setSelectedTool("pen");
            break;
          case "m":
            setSelectedTool("rectangle");
            break;
          case "o":
            setSelectedTool("ellipse");
            break;
          case "h":
            setSelectedTool("hand");
            break;
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  const handleGlyphChange = (updatedGlyph: Glyph) => {
    setGlyph(updatedGlyph);
  };
  
  const handleGlyphSelect = (selectedGlyph: Glyph) => {
    setSelectedGlyph(selectedGlyph);
    setGlyph(selectedGlyph);
    setViewMode("canvas");
    setShowPropertiesPanel(false);
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
  
  const handleKerningChange = (leftGlyph: string, rightGlyph: string, value: number) => {
    const key = `${leftGlyph}_${rightGlyph}`;
    setFont(prev => ({
      ...prev,
      kerningPairs: {
        ...prev.kerningPairs,
        [key]: value,
      },
      modified: new Date(),
    }));
  };
  
  const handleFlipHorizontal = () => {
    if (!glyph) return;
    const bbox = FontEngine.calculateBoundingBox(glyph);
    if (!bbox) return;
    
    const centerX = (bbox.xMin + bbox.xMax) / 2;
    const flippedGlyph = {
      ...glyph,
      paths: glyph.paths.map(path => PathOperations.flipHorizontal(path, centerX)),
    };
    setGlyph(flippedGlyph);
  };
  
  const handleFlipVertical = () => {
    if (!glyph) return;
    const bbox = FontEngine.calculateBoundingBox(glyph);
    if (!bbox) return;
    
    const centerY = (bbox.yMin + bbox.yMax) / 2;
    const flippedGlyph = {
      ...glyph,
      paths: glyph.paths.map(path => PathOperations.flipVertical(path, centerY)),
    };
    setGlyph(flippedGlyph);
  };
  
  const handleRotate = (degrees: number) => {
    if (!glyph) return;
    const bbox = FontEngine.calculateBoundingBox(glyph);
    if (!bbox) return;
    
    const centerX = (bbox.xMin + bbox.xMax) / 2;
    const centerY = (bbox.yMin + bbox.yMax) / 2;
    const rotatedGlyph = {
      ...glyph,
      paths: glyph.paths.map(path => PathOperations.rotate(path, degrees, centerX, centerY)),
    };
    setGlyph(rotatedGlyph);
  };
  
  const handleScale = (scaleX: number, scaleY: number) => {
    if (!glyph) return;
    const bbox = FontEngine.calculateBoundingBox(glyph);
    if (!bbox) return;
    
    const centerX = (bbox.xMin + bbox.xMax) / 2;
    const centerY = (bbox.yMin + bbox.yMax) / 2;
    const scaledGlyph = {
      ...glyph,
      paths: glyph.paths.map(path => PathOperations.scale(path, scaleX, scaleY, centerX, centerY)),
    };
    setGlyph(scaledGlyph);
  };
  
  const tools: Array<{ tool: Tool; icon: typeof MousePointer2; label: string; shortcut?: string }> = [
    { tool: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
    { tool: "pen", icon: Pen, label: "Pen", shortcut: "P" },
    { tool: "rectangle", icon: Square, label: "Rectangle", shortcut: "M" },
    { tool: "ellipse", icon: Circle, label: "Ellipse", shortcut: "O" },
    { tool: "hand", icon: Hand, label: "Pan", shortcut: "H" },
  ];
  
  const handleExport = () => {
    setIsExportModalOpen(true);
    setIsMobileMenuOpen(false);
  };
  
  const handleImport = () => {
    setIsImportModalOpen(true);
    setIsMobileMenuOpen(false);
  };
  
  const handleFontImport = (importedFont: Font) => {
    setFont(importedFont);
    setSelectedGlyph(null);
    setGlyph(null);
  };
  
  const getViewModeTitle = () => {
    switch (viewMode) {
      case "canvas": return "Draw";
      case "grid": return "Grid";
      case "kerning": return "Kern";
      case "preview": return "Preview";
      default: return "Editor";
    }
  };
  
  return (
    <>
      <SEO 
        title="I ❤️ Fonts - Professional Font Editor"
        description="Create beautiful custom fonts with an intuitive, mobile-first editor. Full Bézier curve editing, real-time preview, and professional export options."
      />
      
      <Layout>
        <div className="flex flex-col h-screen md:flex-row">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex w-16 glass-panel border-r border-border flex-col items-center py-4 gap-3">
            <div className="text-2xl mb-4">
              <Heart className="w-6 h-6 text-accent fill-accent" />
            </div>
            
            <div className="flex-1 flex flex-col gap-2">
              {tools.map(({ tool, icon: Icon, label, shortcut }) => (
                <button
                  key={tool}
                  onClick={() => setSelectedTool(tool)}
                  className={`tool-btn ${selectedTool === tool ? "active" : ""}`}
                  title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
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
              
              <button
                onClick={() => setViewMode("kerning")}
                className={`tool-btn ${viewMode === "kerning" ? "active" : ""}`}
                title="Spacing & Kerning Tester"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setViewMode("preview")}
                className={`tool-btn ${viewMode === "preview" ? "active" : ""}`}
                title="Type Preview Mode"
              >
                <Type className="w-5 h-5" />
              </button>
            </div>
          </aside>
          
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile/Desktop Header */}
            <header className="glass-panel border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden tool-btn"
                  aria-label="Menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                
                <Heart className="w-5 h-5 text-accent fill-accent md:hidden" />
                
                <h1 className="text-base md:text-lg font-semibold gradient-text">
                  {getViewModeTitle()}
                </h1>
                
                {selectedGlyph && viewMode === "canvas" && (
                  <span className="hidden sm:inline text-sm text-muted-foreground">
                    {selectedGlyph.name}
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
                      title="Undo"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={redo}
                      disabled={!canRedo}
                      className="tool-btn disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Redo"
                    >
                      <Redo2 className="w-4 h-4" />
                    </button>
                    <div className="hidden md:block w-px h-6 bg-border mx-1" />
                  </>
                )}
                
                <button onClick={handleImport} className="tool-btn" title="Import">
                  <Upload className="w-4 h-4" />
                </button>
                <button onClick={handleExport} className="tool-btn" title="Export">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => setIsSettingsModalOpen(true)} className="tool-btn" title="Settings">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </header>
            
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
              <div className="md:hidden glass-panel border-b border-border p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {tools.map(({ tool, icon: Icon, label }) => (
                    <button
                      key={tool}
                      onClick={() => {
                        setSelectedTool(tool);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`tool-btn flex-1 min-w-[80px] h-12 flex flex-col items-center justify-center gap-1 ${
                        selectedTool === tool ? "active" : ""
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setViewMode(viewMode === "canvas" ? "grid" : "canvas");
                      setIsMobileMenuOpen(false);
                    }}
                    className="tool-btn h-12"
                  >
                    {viewMode === "canvas" ? "Grid" : "Canvas"}
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("kerning");
                      setIsMobileMenuOpen(false);
                    }}
                    className="tool-btn h-12"
                  >
                    Kerning
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("preview");
                      setIsMobileMenuOpen(false);
                    }}
                    className="tool-btn h-12 col-span-2"
                  >
                    Preview Text
                  </button>
                </div>
              </div>
            )}
            
            {/* Main Content Area */}
            {viewMode === "canvas" ? (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {glyph ? (
                  <>
                    <GlyphCanvas
                      glyph={glyph}
                      selectedTool={selectedTool}
                      zoom={zoom}
                      onZoomChange={setZoom}
                      onGlyphChange={handleGlyphChange}
                      onUndo={undo}
                      onRedo={redo}
                    />
                    
                    {/* Properties Panel - Desktop */}
                    <aside className="hidden lg:block w-80 glass-panel border-l border-border p-6 overflow-auto">
                      <h3 className="text-lg font-semibold mb-4">Properties</h3>
                      
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
                          <label className="text-sm text-muted-foreground">Unicode</label>
                          <input
                            type="text"
                            value={glyph.unicode ? String.fromCharCode(glyph.unicode) : ""}
                            onChange={(e) => {
                              const char = e.target.value[0];
                              const updated = { ...glyph, unicode: char ? char.charCodeAt(0) : undefined };
                              setGlyph(updated);
                            }}
                            placeholder="Type character"
                            maxLength={1}
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
                          <div className="text-sm font-semibold mb-3">Transform</div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={handleFlipHorizontal}
                              className="btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                            >
                              <FlipHorizontal className="w-4 h-4" />
                              Flip H
                            </button>
                            <button
                              onClick={handleFlipVertical}
                              className="btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                            >
                              <FlipVertical className="w-4 h-4" />
                              Flip V
                            </button>
                            <button
                              onClick={() => handleRotate(90)}
                              className="btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                            >
                              <RotateCw className="w-4 h-4" />
                              90°
                            </button>
                            <button
                              onClick={() => handleRotate(-90)}
                              className="btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                            >
                              <RotateCw className="w-4 h-4 scale-x-[-1]" />
                              -90°
                            </button>
                            <button
                              onClick={() => handleScale(1.5, 1.5)}
                              className="btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                            >
                              <Maximize2 className="w-4 h-4" />
                              150%
                            </button>
                            <button
                              onClick={() => handleScale(0.75, 0.75)}
                              className="btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                            >
                              <Minimize2 className="w-4 h-4" />
                              75%
                            </button>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-border">
                          <div className="text-sm text-muted-foreground mb-2">Statistics</div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Paths:</span>
                              <span>{glyph.paths.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Nodes:</span>
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
                            className="btn-secondary w-full text-sm"
                          >
                            Clean Up Points
                          </button>
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                JSON.stringify({ advanceWidth: glyph.advanceWidth, leftSidebearing: glyph.leftSidebearing })
                              );
                            }}
                            className="btn-secondary w-full text-sm"
                          >
                            Copy Box
                          </button>
                          
                          <button
                            onClick={() => {
                              const visualWidth = FontEngine.getVisualWidth(glyph);
                              navigator.clipboard.writeText(visualWidth.toString());
                            }}
                            className="btn-secondary w-full text-sm"
                          >
                            Copy Width
                          </button>
                        </div>
                      </div>
                    </aside>
                    
                    {/* Mobile Properties Toggle */}
                    <button
                      onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
                      className="lg:hidden fixed bottom-20 right-4 z-10 tool-btn w-12 h-12 rounded-full shadow-lg"
                      aria-label="Properties"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                    
                    {/* Mobile Properties Sheet */}
                    {showPropertiesPanel && (
                      <div className="lg:hidden fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
                        <div 
                          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                          onClick={() => setShowPropertiesPanel(false)}
                        />
                        
                        <div className="relative glass-panel rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-md max-h-[80vh] overflow-auto animate-slide-up">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Properties</h3>
                            <button
                              onClick={() => setShowPropertiesPanel(false)}
                              className="tool-btn"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          
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
                                className="w-full px-3 py-3 mt-1 glass-panel rounded-lg text-base"
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm text-muted-foreground">Character</label>
                              <input
                                type="text"
                                value={glyph.unicode ? String.fromCharCode(glyph.unicode) : ""}
                                onChange={(e) => {
                                  const char = e.target.value[0];
                                  const updated = { ...glyph, unicode: char ? char.charCodeAt(0) : undefined };
                                  setGlyph(updated);
                                }}
                                placeholder="Type letter"
                                maxLength={1}
                                className="w-full px-3 py-3 mt-1 glass-panel rounded-lg text-base"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm text-muted-foreground">Width</label>
                                <input
                                  type="number"
                                  value={glyph.advanceWidth}
                                  onChange={(e) => {
                                    const updated = { ...glyph, advanceWidth: parseInt(e.target.value) || 0 };
                                    setGlyph(updated);
                                  }}
                                  className="w-full px-3 py-3 mt-1 glass-panel rounded-lg text-base"
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm text-muted-foreground">Sidebearing</label>
                                <input
                                  type="number"
                                  value={glyph.leftSidebearing}
                                  onChange={(e) => {
                                    const updated = { ...glyph, leftSidebearing: parseInt(e.target.value) || 0 };
                                    setGlyph(updated);
                                  }}
                                  className="w-full px-3 py-3 mt-1 glass-panel rounded-lg text-base"
                                />
                              </div>
                            </div>
                            
                            <div className="pt-4 border-t border-border">
                              <div className="text-sm font-semibold mb-3">Transform</div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => {
                                    handleFlipHorizontal();
                                    setShowPropertiesPanel(false);
                                  }}
                                  className="btn-secondary py-3 flex items-center justify-center gap-2"
                                >
                                  <FlipHorizontal className="w-4 h-4" />
                                  Flip H
                                </button>
                                <button
                                  onClick={() => {
                                    handleFlipVertical();
                                    setShowPropertiesPanel(false);
                                  }}
                                  className="btn-secondary py-3 flex items-center justify-center gap-2"
                                >
                                  <FlipVertical className="w-4 h-4" />
                                  Flip V
                                </button>
                                <button
                                  onClick={() => {
                                    handleRotate(90);
                                    setShowPropertiesPanel(false);
                                  }}
                                  className="btn-secondary py-3 flex items-center justify-center gap-2"
                                >
                                  <RotateCw className="w-4 h-4" />
                                  90°
                                </button>
                                <button
                                  onClick={() => {
                                    handleRotate(-90);
                                    setShowPropertiesPanel(false);
                                  }}
                                  className="btn-secondary py-3 flex items-center justify-center gap-2"
                                >
                                  <RotateCw className="w-4 h-4 scale-x-[-1]" />
                                  -90°
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <button
                                onClick={() => {
                                  const simplified = {
                                    ...glyph,
                                    paths: glyph.paths.map(p => FontEngine.simplifyPath(p, 5)),
                                  };
                                  setGlyph(simplified);
                                  setShowPropertiesPanel(false);
                                }}
                                className="btn-secondary w-full"
                              >
                                Clean Up Points
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6">
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
                        Go to Grid
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <GlyphGrid
                font={font}
                selectedGlyph={selectedGlyph}
                onGlyphSelect={handleGlyphSelect}
                onGlyphCreate={handleGlyphCreate}
              />
            ) : viewMode === "preview" ? (
              <PreviewPanel font={font} />
            ) : (
              <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="max-w-5xl mx-auto">
                  <KerningEditor
                    font={font}
                    onKerningChange={handleKerningChange}
                  />
                </div>
              </div>
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
      
      <SettingsModal
        font={font}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onFontUpdate={setFont}
      />
    </>
  );
}
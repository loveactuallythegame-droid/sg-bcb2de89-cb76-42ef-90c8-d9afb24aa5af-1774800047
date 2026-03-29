import { useState } from "react";
import { Font } from "@/types/font";
import { FontFormats } from "@/lib/fontFormats";
import { X, Download, FileJson, FileImage, Package, FileType } from "lucide-react";

interface ExportModalProps {
  font: Font;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ font, isOpen, onClose }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<"otf" | "ttf" | "woff2" | "json" | "ufo" | "svg">("otf");
  const [isExporting, setIsExporting] = useState(false);
  
  if (!isOpen) return null;
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let blob: Blob;
      let filename: string;
      
      switch (selectedFormat) {
        case "otf":
          blob = FontFormats.exportToOTF(font);
          filename = `${font.familyName.replace(/\s/g, "_")}.otf`;
          break;
        case "ttf":
          blob = FontFormats.exportToTTF(font);
          filename = `${font.familyName.replace(/\s/g, "_")}.ttf`;
          break;
        case "woff2":
          blob = FontFormats.exportToWOFF2(font);
          filename = `${font.familyName.replace(/\s/g, "_")}.woff2`;
          break;
        case "json":
          blob = FontFormats.exportToJSON(font);
          filename = `${font.familyName.replace(/\s/g, "_")}.json`;
          break;
        case "ufo":
          blob = FontFormats.exportToUFO(font);
          filename = `${font.familyName.replace(/\s/g, "_")}.ufo.json`;
          break;
        case "svg":
          blob = FontFormats.exportToSVG(font);
          filename = `${font.familyName.replace(/\s/g, "_")}_glyphs.svg`;
          break;
      }
      
      FontFormats.downloadFile(blob, filename);
      
      setTimeout(() => {
        onClose();
        setIsExporting(false);
      }, 500);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
      setIsExporting(false);
    }
  };
  
  const formats = [
    {
      id: "otf",
      name: "OpenType Font (.otf)",
      description: "Installable desktop font with PostScript curves",
      icon: FileType,
      extension: ".otf",
      recommended: true,
    },
    {
      id: "ttf",
      name: "TrueType Font (.ttf)",
      description: "Universal font format, works everywhere",
      icon: FileType,
      extension: ".ttf",
      recommended: true,
    },
    {
      id: "woff2",
      name: "Web Font (.woff2)",
      description: "Compressed web font format",
      icon: FileType,
      extension: ".woff2",
      recommended: false,
    },
    {
      id: "json",
      name: "I ❤️ Fonts Project",
      description: "Full project file with all glyphs, paths, and settings",
      icon: FileJson,
      extension: ".json",
      recommended: false,
    },
    {
      id: "ufo",
      name: "UFO (Unified Font Object)",
      description: "Industry-standard font source format",
      icon: Package,
      extension: ".ufo.json",
      recommended: false,
    },
    {
      id: "svg",
      name: "SVG Glyph Sheet",
      description: "Visual preview grid of all glyphs",
      icon: FileImage,
      extension: ".svg",
      recommended: false,
    },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative glass-panel rounded-2xl p-6 w-full max-w-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 tool-btn"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-6">
          <h2 className="text-2xl font-semibold gradient-text mb-2">
            Export Final Font File
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose a format to export {font.familyName}
          </p>
        </div>
        
        <div className="space-y-3 mb-6">
          {formats.map((format) => {
            const Icon = format.icon;
            const isSelected = selectedFormat === format.id;
            
            return (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id as any)}
                className={`w-full glass-panel rounded-xl p-4 text-left transition-all hover:scale-[1.02] ${
                  isSelected ? "ring-2 ring-accent" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${isSelected ? "bg-accent/20" : "bg-muted/20"}`}>
                    <Icon className={`w-6 h-6 ${isSelected ? "text-accent" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{format.name}</h3>
                      {format.recommended && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-accent/20 text-accent">
                          Recommended
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">
                        {format.extension}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="glass-panel rounded-xl p-4 mb-6">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Font Family:</span>
              <span className="font-semibold">{font.familyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Glyphs:</span>
              <span className="font-semibold">{Object.keys(font.glyphs).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-semibold">{font.version}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="btn-primary flex-1"
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export Font"}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef } from "react";
import { Font } from "@/types/font";
import { FontFormats } from "@/lib/fontFormats";
import { X, Upload, FileJson, Package, FileType } from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (font: Font) => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;
  
  const handleFile = async (file: File) => {
    setIsImporting(true);
    
    try {
      let font: Font;
      
      if (file.name.endsWith(".json")) {
        if (file.name.includes(".ufo.")) {
          font = await FontFormats.importFromUFO(file);
        } else {
          font = await FontFormats.importFromJSON(file);
        }
      } else if (file.name.endsWith(".ttf") || file.name.endsWith(".otf") || file.name.endsWith(".woff") || file.name.endsWith(".woff2")) {
        font = await FontFormats.importFromBinaryFont(file);
      } else {
        throw new Error("Unsupported file format. Please use TTF, OTF, WOFF, WOFF2, or JSON formats.");
      }
      
      onImport(font);
      onClose();
    } catch (error) {
      console.error("Import failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Import failed: ${errorMessage}\n\nPlease check the file format and try again.`);
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFile(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };
  
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
            Import Font File
          </h2>
          <p className="text-sm text-muted-foreground">
            Import an existing font file to edit in I ❤️ Fonts
          </p>
        </div>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`glass-panel rounded-xl p-12 text-center transition-all ${
            isDragging ? "ring-2 ring-accent scale-[1.02]" : ""
          }`}
        >
          <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {isDragging ? "Drop file here" : "Drag & drop your font file"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,.json,.ufo"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
            disabled={isImporting}
          >
            {isImporting ? "Importing..." : "Choose File"}
          </button>
        </div>
        
        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <FileType className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Font Files (.ttf, .otf, .woff, .woff2)</h4>
              <p className="text-xs text-muted-foreground">
                Import any standard font file format - we'll convert it to editable paths
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <FileJson className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">I ❤️ Fonts Project (.json)</h4>
              <p className="text-xs text-muted-foreground">
                Full project file with all glyphs, paths, and settings
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">UFO Format (.ufo.json)</h4>
              <p className="text-xs text-muted-foreground">
                Industry-standard font source format (simplified JSON version)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
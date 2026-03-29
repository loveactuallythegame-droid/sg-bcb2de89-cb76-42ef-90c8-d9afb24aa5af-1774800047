import { Font } from "@/types/font";
import { X, Settings as SettingsIcon, Info } from "lucide-react";
import { FontMetricsEditor } from "./FontMetricsEditor";

interface SettingsModalProps {
  font: Font;
  isOpen: boolean;
  onClose: () => void;
  onFontUpdate: (font: Font) => void;
}

export function SettingsModal({ font, isOpen, onClose, onFontUpdate }: SettingsModalProps) {
  if (!isOpen) return null;
  
  const handleMetricsChange = (metrics: typeof font.metrics) => {
    onFontUpdate({
      ...font,
      metrics,
      modified: new Date(),
    });
  };
  
  const handleFontInfoChange = (field: keyof Font, value: string) => {
    onFontUpdate({
      ...font,
      [field]: value,
      modified: new Date(),
    });
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold gradient-text">Font Settings</h2>
              <p className="text-sm text-muted-foreground">Configure font properties and metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="tool-btn"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold gradient-text">Font Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Font Name</label>
                <input
                  type="text"
                  value={font.name}
                  onChange={(e) => handleFontInfoChange("name", e.target.value)}
                  className="w-full px-3 py-2 glass-panel rounded-lg text-sm focus:ring-2 focus:ring-accent transition-all"
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Family Name</label>
                <input
                  type="text"
                  value={font.familyName}
                  onChange={(e) => handleFontInfoChange("familyName", e.target.value)}
                  className="w-full px-3 py-2 glass-panel rounded-lg text-sm focus:ring-2 focus:ring-accent transition-all"
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Version</label>
                <input
                  type="text"
                  value={font.version}
                  onChange={(e) => handleFontInfoChange("version", e.target.value)}
                  className="w-full px-3 py-2 glass-panel rounded-lg text-sm focus:ring-2 focus:ring-accent transition-all"
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Total Glyphs</label>
                <input
                  type="text"
                  value={Object.keys(font.glyphs).length}
                  disabled
                  className="w-full px-3 py-2 glass-panel rounded-lg text-sm bg-muted/20"
                />
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8">
            <FontMetricsEditor
              metrics={font.metrics}
              onMetricsChange={handleMetricsChange}
            />
          </div>
          
          <div className="border-t border-border pt-8">
            <div className="glass-panel rounded-xl p-4">
              <h4 className="text-sm font-semibold mb-3">Font Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div>{new Date(font.created).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Modified</div>
                  <div>{new Date(font.modified).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Kerning Pairs</div>
                  <div>{Object.keys(font.kerningPairs).length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Font ID</div>
                  <div className="text-xs truncate">{font.id.slice(0, 8)}...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
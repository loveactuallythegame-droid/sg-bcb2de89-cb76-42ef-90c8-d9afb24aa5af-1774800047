import { FontMetrics } from "@/types/font";
import { useState } from "react";
import { Ruler, TrendingUp, TrendingDown } from "lucide-react";

interface FontMetricsEditorProps {
  metrics: FontMetrics;
  onMetricsChange: (metrics: FontMetrics) => void;
}

export function FontMetricsEditor({ metrics, onMetricsChange }: FontMetricsEditorProps) {
  const [localMetrics, setLocalMetrics] = useState(metrics);
  
  const handleChange = (field: keyof FontMetrics, value: number) => {
    const updated = { ...localMetrics, [field]: value };
    setLocalMetrics(updated);
    onMetricsChange(updated);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Ruler className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold gradient-text">Font Metrics</h3>
      </div>
      
      <div className="space-y-3">
        <MetricInput
          label="Units Per Em"
          value={localMetrics.unitsPerEm}
          onChange={(v) => handleChange("unitsPerEm", v)}
          description="Base unit size (usually 1000 or 2048)"
        />
        
        <MetricInput
          label="Ascender"
          value={localMetrics.ascender}
          onChange={(v) => handleChange("ascender", v)}
          description="Height above baseline"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        
        <MetricInput
          label="Descender"
          value={localMetrics.descender}
          onChange={(v) => handleChange("descender", v)}
          description="Depth below baseline (negative)"
          icon={<TrendingDown className="w-4 h-4" />}
        />
        
        <MetricInput
          label="Cap Height"
          value={localMetrics.capHeight}
          onChange={(v) => handleChange("capHeight", v)}
          description="Height of capital letters"
        />
        
        <MetricInput
          label="X-Height"
          value={localMetrics.xHeight}
          onChange={(v) => handleChange("xHeight", v)}
          description="Height of lowercase 'x'"
        />
      </div>
      
      <div className="pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2">Visual Preview</div>
        <div className="glass-panel rounded-lg p-4 relative h-32">
          <svg width="100%" height="100%" viewBox="0 0 200 120" className="absolute inset-0">
            <line x1="20" y1="80" x2="180" y2="80" stroke="hsl(var(--accent))" strokeWidth="2" />
            <text x="185" y="83" fill="hsl(var(--muted-foreground))" fontSize="8">Baseline</text>
            
            <line 
              x1="20" 
              y1={80 - (localMetrics.ascender / localMetrics.unitsPerEm) * 60} 
              x2="180" 
              y2={80 - (localMetrics.ascender / localMetrics.unitsPerEm) * 60} 
              stroke="hsl(var(--success))" 
              strokeWidth="1" 
              strokeDasharray="4 2"
            />
            
            <line 
              x1="20" 
              y1={80 - (localMetrics.descender / localMetrics.unitsPerEm) * 60} 
              x2="180" 
              y2={80 - (localMetrics.descender / localMetrics.unitsPerEm) * 60} 
              stroke="hsl(var(--destructive))" 
              strokeWidth="1" 
              strokeDasharray="4 2"
            />
            
            <line 
              x1="20" 
              y1={80 - (localMetrics.capHeight / localMetrics.unitsPerEm) * 60} 
              x2="180" 
              y2={80 - (localMetrics.capHeight / localMetrics.unitsPerEm) * 60} 
              stroke="hsl(var(--warning))" 
              strokeWidth="1" 
              strokeDasharray="4 2"
            />
            
            <line 
              x1="20" 
              y1={80 - (localMetrics.xHeight / localMetrics.unitsPerEm) * 60} 
              x2="180" 
              y2={80 - (localMetrics.xHeight / localMetrics.unitsPerEm) * 60} 
              stroke="hsl(var(--info))" 
              strokeWidth="1" 
              strokeDasharray="4 2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface MetricInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
  icon?: React.ReactNode;
}

function MetricInput({ label, value, onChange, description, icon }: MetricInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <label className="text-sm font-medium">{label}</label>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-3 py-2 glass-panel rounded-lg text-sm focus:ring-2 focus:ring-accent transition-all"
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
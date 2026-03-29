export interface Point {
  x: number;
  y: number;
}

export interface BezierNode extends Point {
  id: string;
  type: "on-curve" | "off-curve";
  handleIn?: Point;
  handleOut?: Point;
}

export interface Path {
  id: string;
  nodes: BezierNode[];
  closed: boolean;
}

export interface Glyph {
  id: string;
  name: string;
  unicode?: number;
  advanceWidth: number;
  leftSidebearing: number;
  paths: Path[];
  boundingBox?: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
}

export interface FontMetrics {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  capHeight: number;
  xHeight: number;
}

export interface Font {
  id: string;
  name: string;
  familyName: string;
  version: string;
  metrics: FontMetrics;
  glyphs: Record<string, Glyph>;
  kerningPairs: Record<string, number>;
  created: Date;
  modified: Date;
}

export type Tool = "select" | "pen" | "rectangle" | "ellipse" | "hand";

export type ViewMode = "canvas" | "grid" | "kerning" | "preview";

export interface EditorState {
  selectedGlyph: Glyph | null;
  selectedTool: Tool;
  zoom: number;
  pan: Point;
  selectedNodes: string[];
  clipboard: Path[];
  history: {
    past: Glyph[];
    future: Glyph[];
  };
}
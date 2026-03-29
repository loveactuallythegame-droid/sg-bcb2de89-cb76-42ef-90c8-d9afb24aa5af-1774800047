import { ReactNode } from "react";
import { Heart } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass-panel border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary fill-primary animate-pulse-glow" />
            <h1 className="text-2xl font-bold gradient-text">
              I ❤️ Fonts
            </h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Font Editor · Production Ready
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      
      <footer className="glass-panel border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with ❤️ • © 2026 I ❤️ Fonts
        </div>
      </footer>
    </div>
  );
}
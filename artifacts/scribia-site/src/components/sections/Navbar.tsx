import { Button } from "@/components/ui/button";
import { SITE } from "@/utils/constants";
import { useEffect, useState } from "react";
import { keyBlackToTransparent } from "@/utils/image";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const Navbar = () => {
  const [logoSrc, setLogoSrc] = useState("/lovable-uploads/scribia-logo-new.png");
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    keyBlackToTransparent("/lovable-uploads/scribia-logo-new.png", 24)
      .then(setLogoSrc)
      .catch(() => {});
  }, []);
  
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <a href="#hero" className="flex items-center gap-2 font-semibold">
          <img src={logoSrc} alt={`${SITE.name} logo`} className="h-8 md:h-10 w-auto" loading="eager" />
        </a>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm text-muted-foreground">
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#beneficios" className="hover:text-foreground transition-colors">Benefícios</a>
          <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          {/* TODO: hook up later */}
          <Button variant="outline" size="sm">Login</Button>
          {/* TODO: hook up later */}
          <Button variant="cta" size="sm" className="hover-scale">Contratar</Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <nav className="flex flex-col gap-6 mt-8">
              <a href="#como-funciona" onClick={() => setIsOpen(false)} className="text-lg hover:text-primary transition-colors">
                Como funciona
              </a>
              <a href="#beneficios" onClick={() => setIsOpen(false)} className="text-lg hover:text-primary transition-colors">
                Benefícios
              </a>
              <a href="#planos" onClick={() => setIsOpen(false)} className="text-lg hover:text-primary transition-colors">
                Planos
              </a>
              
              <div className="flex flex-col gap-3 pt-4 border-t">
                {/* TODO: hook up later */}
                <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>Login</Button>
                {/* TODO: hook up later */}
                <Button variant="cta" className="w-full" onClick={() => setIsOpen(false)}>Contratar</Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
};

export default Navbar;

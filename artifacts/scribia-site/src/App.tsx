import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/sections/Navbar";
import SimpleNavbar from "./components/sections/SimpleNavbar";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./components/ThemeProvider";
import { TranslationProvider } from "./i18n/TranslationContext";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ParticipantesLanding = lazy(() => import("./pages/ParticipantesLanding"));
const OrganizadoresLanding = lazy(() => import("./pages/OrganizadoresLanding"));
const PalestrantesLanding = lazy(() => import("./pages/PalestrantesLanding"));
const PatrocinadoresLanding = lazy(() => import("./pages/PatrocinadoresLanding"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="text-center space-y-4">
      <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TranslationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={
                    <>
                      <SimpleNavbar />
                      <Index />
                    </>
                  } />
                  <Route path="/participantes" element={
                    <>
                      <Navbar />
                      <ParticipantesLanding />
                    </>
                  } />
                  <Route path="/organizadores" element={
                    <>
                      <Navbar />
                      <OrganizadoresLanding />
                    </>
                  } />
                  <Route path="/palestrantes" element={
                    <>
                      <Navbar />
                      <PalestrantesLanding />
                    </>
                  } />
                  <Route path="/influenciadores" element={
                    <>
                      <Navbar />
                      <PalestrantesLanding />
                    </>
                  } />
                  <Route path="/patrocinadores" element={
                    <>
                      <Navbar />
                      <PatrocinadoresLanding />
                    </>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

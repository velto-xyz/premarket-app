import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Industries from "./pages/Industries";
import Markets from "./pages/Markets";
import StartupDetail from "./pages/StartupDetail";
import WorldMap from "./pages/WorldMap";
import Portfolio from "./pages/Portfolio";
import AIWatcher from "./pages/AIWatcher";
import AlphaLeague from "./pages/AlphaLeague";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Industries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/markets"
              element={
                <ProtectedRoute>
                  <Markets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/markets/:industrySlug"
              element={
                <ProtectedRoute>
                  <Markets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/startup/:startupSlug"
              element={
                <ProtectedRoute>
                  <StartupDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <WorldMap />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-watcher"
              element={
                <ProtectedRoute>
                  <AIWatcher />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alpha-league"
              element={
                <ProtectedRoute>
                  <AlphaLeague />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

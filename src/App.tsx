import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { ThemeProvider } from "next-themes";
import { wagmiConfig } from "@/lib/wagmi-config";
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

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        theme={lightTheme({
          accentColor: 'hsl(152, 75%, 53%)', // Matching --primary #2DE18E
          accentColorForeground: 'hsl(227, 92%, 5%)', // #010618
          borderRadius: 'large', // Match app's rounded-2xl / --radius approach
          fontStack: 'system',
        })}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
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
                        <Markets />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/industries"
                    element={
                      <ProtectedRoute>
                        <Industries />
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
        </ThemeProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import Map, { MapRef } from "@/components/Map";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { startupLogos } from "@/assets/logos";
import { useState, useRef } from "react";
import { getTicker } from "@/lib/tickers";

export default function WorldMap() {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);
  const [selectedStartupId, setSelectedStartupId] = useState<string | null>(null);
  
  const { data: startups, isLoading } = useQuery({
    queryKey: ["startups-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("id, name, slug, hq_location, hq_latitude, hq_longitude, unicorn_color, current_price, price_change_24h, industries(name)")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full">
        <div className="container mx-auto px-8 py-8">
          <div className="mb-8">
            <h1 className="text-5xl font-heading font-bold mb-2 text-foreground">
              <span className="text-foreground">Global</span> <span className="text-gradient">Startup Map</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Explore startup headquarters around the world
            </p>
          </div>
        </div>

        {/* Full Width Interactive Map */}
        <div className="w-full px-8 mb-8">
          <Card className="glass border-border w-full">
            <CardContent className="p-4">
              <Map ref={mapRef} startups={startups || []} selectedStartupId={selectedStartupId} />
            </CardContent>
          </Card>
        </div>

        {/* Horizontal Carousel for Startups */}
        <div className="container mx-auto px-8 pb-8">
          <div className="mb-6">
            <h2 className="text-3xl font-heading font-bold text-foreground">
              <span className="text-foreground">All</span> <span className="text-gradient">Startups</span>
            </h2>
          </div>
          
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {startups?.map((startup) => (
                <CarouselItem key={startup.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <Card 
                    className={`glass border-border hover:border-primary transition-all duration-300 cursor-pointer hover:glow h-full ${selectedStartupId === startup.id ? 'border-primary ring-2 ring-primary/50' : ''}`}
                    onClick={() => {
                      setSelectedStartupId(startup.id);
                      mapRef.current?.flyToStartup(startup.id);
                    }}
                    onDoubleClick={() => navigate(`/startup/${startup.slug}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center p-2 flex-shrink-0">
                            <img 
                              src={startupLogos[startup.slug]} 
                              alt={`${startup.name} logo`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-primary font-semibold">{getTicker(startup.slug)}</span>
                              <h3 className="font-heading font-bold text-lg truncate text-foreground group-hover:text-primary transition-colors">
                                {startup.name}
                              </h3>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {startup.industries?.name}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground border-t border-border pt-3">
                          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="truncate">{startup.hq_location}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="text-center">
                            <div className="text-xl font-bold text-foreground">
                              ${startup.current_price}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Current Price
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={`text-xl font-bold ${(startup.price_change_24h ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {(startup.price_change_24h ?? 0) >= 0 ? '+' : ''}{(startup.price_change_24h ?? 0).toFixed(2)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Performance
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </AppLayout>
  );
}

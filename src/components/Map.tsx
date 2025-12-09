import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Startup {
  id: string;
  name: string;
  slug: string;
  hq_location: string;
  hq_latitude: number | null;
  hq_longitude: number | null;
  unicorn_color: string | null;
  current_price?: number;
  price_change_24h?: number | null;
  industries?: {
    name: string;
  };
}

// Helper function to get heat color and size based on price change
const getHeatStyle = (priceChange: number | null | undefined) => {
  const change = priceChange ?? 0;
  const absChange = Math.abs(change);
  
  // Size: base 14px, scales up to 28px for large changes (capped at 50%)
  const sizeMultiplier = Math.min(absChange / 50, 1);
  const size = 14 + (sizeMultiplier * 14);
  
  // Color: green for positive, red for negative, with intensity based on magnitude
  let color: string;
  let glowColor: string;
  
  if (change > 0) {
    // Green gradient: from light green to bright green
    const intensity = Math.min(change / 30, 1);
    const greenValue = Math.round(180 + (intensity * 75));
    const redValue = Math.round(80 - (intensity * 60));
    color = `rgb(${redValue}, ${greenValue}, 80)`;
    glowColor = `rgba(34, 197, 94, ${0.4 + intensity * 0.4})`;
  } else if (change < 0) {
    // Red gradient: from light red to bright red
    const intensity = Math.min(absChange / 30, 1);
    const redValue = Math.round(180 + (intensity * 75));
    const greenValue = Math.round(80 - (intensity * 60));
    color = `rgb(${redValue}, ${greenValue}, 80)`;
    glowColor = `rgba(239, 68, 68, ${0.4 + intensity * 0.4})`;
  } else {
    // Neutral: gray/purple
    color = '#8B5CF6';
    glowColor = 'rgba(139, 92, 246, 0.5)';
  }
  
  return { size, color, glowColor, change };
};

interface MapProps {
  startups: Startup[];
  selectedStartupId?: string | null;
}

export interface MapRef {
  flyToStartup: (startupId: string) => void;
}

const Map = forwardRef<MapRef, MapProps>(({ startups, selectedStartupId }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, { marker: mapboxgl.Marker; element: HTMLDivElement; originalColor: string; originalGlow: string; originalSize: number }>>({});
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isTokenSet, setIsTokenSet] = useState(false);
  const navigate = useNavigate();

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    flyToStartup: (startupId: string) => {
      const startup = startups.find(s => s.id === startupId);
      if (startup?.hq_latitude && startup?.hq_longitude && map.current) {
        map.current.flyTo({
          center: [startup.hq_longitude, startup.hq_latitude],
          zoom: 4,
          duration: 2000,
          essential: true
        });
      }
    }
  }));

  // Handle selected startup styling (orange color + pulsing)
  const applySelectedStyling = () => {
    // Reset all markers to their original heat colors
    Object.entries(markersRef.current).forEach(([id, markerData]) => {
      const { element, originalColor, originalGlow, originalSize } = markerData;
      if (id !== selectedStartupId) {
        element.classList.remove('marker-selected');
        if (originalColor && originalGlow && originalSize) {
          element.style.backgroundColor = originalColor;
          element.style.boxShadow = `0 0 ${originalSize}px ${originalGlow}, 0 0 ${originalSize * 2}px ${originalGlow}`;
          element.style.width = `${originalSize}px`;
          element.style.height = `${originalSize}px`;
        }
      }
    });

    // Style selected marker with orange theme color
    if (selectedStartupId) {
      const markerData = markersRef.current[selectedStartupId];
      if (markerData) {
        const orangeColor = '#F97316'; // Primary orange
        const orangeGlow = 'rgba(249, 115, 22, 0.8)';
        markerData.element.style.backgroundColor = orangeColor;
        markerData.element.style.boxShadow = `0 0 25px ${orangeGlow}, 0 0 50px ${orangeGlow}`;
        markerData.element.style.width = '24px';
        markerData.element.style.height = '24px';
        markerData.element.classList.add('marker-selected');
        // Ensure marker is visible and on top
        markerData.element.style.zIndex = '1000';
        markerData.element.style.display = 'block';
      }
    }
  };

  useEffect(() => {
    applySelectedStyling();
  }, [selectedStartupId]);

  useEffect(() => {
    if (!mapContainer.current || !isTokenSet || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe' as any,
      zoom: 1.5,
      center: [30, 15],
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.scrollZoom.disable();

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(15, 15, 30)',
        'high-color': 'rgb(40, 20, 60)',
        'horizon-blend': 0.2,
      });

      // Clear old markers ref
      markersRef.current = {};

      // Add markers for startups
      startups.forEach((startup) => {
        if (startup.hq_latitude && startup.hq_longitude && map.current) {
          const { size, color, glowColor, change } = getHeatStyle(startup.price_change_24h);
          const changeSign = change > 0 ? '+' : '';
          const changeDisplay = `${changeSign}${change.toFixed(2)}%`;
          
          const el = document.createElement('div');
          el.className = 'startup-marker';
          el.dataset.startupId = startup.id;
          el.style.backgroundColor = color;
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.borderRadius = '50%';
          el.style.border = '2px solid rgba(255, 255, 255, 0.9)';
          el.style.cursor = 'pointer';
          el.style.boxShadow = `0 0 ${size}px ${glowColor}, 0 0 ${size * 2}px ${glowColor}`;
          el.style.transition = 'all 0.3s ease';
          el.style.transformOrigin = 'center center';

          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.3)';
            el.style.zIndex = '1000';
          });

          el.addEventListener('mouseleave', () => {
            if (!el.classList.contains('marker-blinking')) {
              el.style.transform = 'scale(1)';
            }
            el.style.zIndex = '1';
          });

          const popup = new mapboxgl.Popup({ 
            offset: 25,
            closeButton: true,
            closeOnClick: false
          }).setHTML(
            `<div style="padding: 12px; background: rgba(15, 15, 30, 0.98); border-radius: 8px; min-width: 220px;">
              <h3 style="font-weight: bold; color: ${color}; margin-bottom: 6px; font-size: 16px;">${startup.name}</h3>
              <p style="font-size: 13px; color: rgba(255, 255, 255, 0.7); margin-bottom: 4px;">${startup.industries?.name || 'N/A'}</p>
              <p style="font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-bottom: 8px;">${startup.hq_location}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 12px;">
                <span style="font-size: 14px; color: rgba(255,255,255,0.8);">$${startup.current_price?.toFixed(2) || '0.00'}</span>
                <span style="font-size: 13px; font-weight: 600; color: ${color};">${changeDisplay}</span>
              </div>
              <button 
                data-startup-slug="${startup.slug}"
                style="
                  width: 100%;
                  padding: 8px 16px;
                  background: ${color};
                  color: white;
                  border: none;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 13px;
                  cursor: pointer;
                  transition: opacity 0.2s;
                "
                onmouseover="this.style.opacity='0.8'"
                onmouseout="this.style.opacity='1'"
              >
                VIEW MORE
              </button>
            </div>`
          );

          const marker = new mapboxgl.Marker(el)
            .setLngLat([startup.hq_longitude, startup.hq_latitude])
            .setPopup(popup)
            .addTo(map.current);

          // Store marker reference with original colors for reset
          markersRef.current[startup.id] = { marker, element: el, originalColor: color, originalGlow: glowColor, originalSize: size };

          // Open popup on marker click
          el.addEventListener('click', () => {
            popup.addTo(map.current!);
          });

          // Handle button click in popup
          popup.on('open', () => {
            const button = document.querySelector(`[data-startup-slug="${startup.slug}"]`);
            if (button) {
              button.addEventListener('click', () => {
                navigate(`/startup/${startup.slug}`);
              });
            }
          });
        }
      });
      
      // Apply selected styling after markers are created
      setTimeout(() => applySelectedStyling(), 100);
    });

    const secondsPerRevolution = 240;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;
    let userInteracting = false;
    let spinEnabled = true;

    function spinGlobe() {
      if (!map.current) return;
      
      const zoom = map.current.getZoom();
      if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.current.on('mousedown', () => {
      userInteracting = true;
    });
    
    map.current.on('dragstart', () => {
      userInteracting = true;
    });
    
    map.current.on('mouseup', () => {
      userInteracting = false;
      spinGlobe();
    });
    
    map.current.on('touchend', () => {
      userInteracting = false;
      spinGlobe();
    });

    map.current.on('moveend', () => {
      spinGlobe();
    });

    spinGlobe();

    return () => {
      map.current?.remove();
    };
  }, [startups, isTokenSet, mapboxToken]);

  if (!isTokenSet) {
    return (
      <div className="flex items-center justify-center h-[600px] rounded-lg bg-gradient-to-br from-primary/5 to-background border border-border">
        <div className="glass p-8 rounded-lg max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🗺️</div>
            <h3 className="text-xl font-heading font-bold mb-2">Enter Mapbox Token</h3>
            <p className="text-sm text-muted-foreground">
              Get your free token from{' '}
              <a
                href="https://mapbox.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="pk.eyJ1Ijoi..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="glass"
            />
            <Button
              onClick={() => setIsTokenSet(true)}
              disabled={!mapboxToken}
              className="w-full"
            >
              Load Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px]">
      <style>{`
        @keyframes marker-pulse {
          0%, 100% { 
            transform: scale(1); 
          }
          50% { 
            transform: scale(1.3); 
          }
        }
        .marker-selected {
          animation: marker-pulse 1.5s ease-in-out infinite !important;
          border: 3px solid white !important;
        }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10 rounded-lg" />
    </div>
  );
});

Map.displayName = 'Map';

export default Map;

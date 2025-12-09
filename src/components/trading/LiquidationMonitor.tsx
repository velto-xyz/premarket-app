import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePositions, checkLiquidationRisk } from "@/hooks/usePositions";

interface PriceUpdate {
  id: string;
  current_price: number;
  name: string;
}

export default function LiquidationMonitor() {
  const { positions } = usePositions();
  const [priceUpdates, setPriceUpdates] = useState<Map<string, number>>(new Map());
  const [liquidationAlerts, setLiquidationAlerts] = useState<Array<{
    startupName: string;
    risk: string;
    distance: number;
  }>>([]);

  // Subscribe to real-time price updates
  useEffect(() => {
    const channel = supabase
      .channel("price-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "startups",
        },
        (payload) => {
          const update = payload.new as PriceUpdate;
          setPriceUpdates((prev) => new Map(prev).set(update.id, update.current_price));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Subscribe to position changes (liquidations)
  useEffect(() => {
    const channel = supabase
      .channel("position-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_positions",
        },
        (payload) => {
          const position = payload.new;
          if (position.status === "liquidated") {
            console.log("🔔 Position liquidated:", position);
            // Could trigger a toast notification here
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate liquidation alerts
  useEffect(() => {
    if (!positions || positions.length === 0) {
      setLiquidationAlerts([]);
      return;
    }

    const fetchStartupPrices = async () => {
      const startupIds = positions.map((p) => p.startup_id);
      const { data: startups } = await supabase
        .from("startups")
        .select("id, name, current_price")
        .in("id", startupIds);

      if (!startups) return;

      const alerts: Array<{ startupName: string; risk: string; distance: number }> = [];

      positions.forEach((position) => {
        const startup = startups.find((s) => s.id === position.startup_id);
        if (!startup) return;

        const currentPrice = priceUpdates.get(startup.id) || startup.current_price;
        const { risk, distance } = checkLiquidationRisk(position, currentPrice);

        if (risk === "high" || risk === "medium") {
          alerts.push({
            startupName: startup.name,
            risk,
            distance,
          });
        }
      });

      setLiquidationAlerts(alerts);
    };

    fetchStartupPrices();
  }, [positions, priceUpdates]);

  if (!positions || positions.length === 0) {
    return null;
  }

  const highRiskCount = liquidationAlerts.filter((a) => a.risk === "high").length;
  const mediumRiskCount = liquidationAlerts.filter((a) => a.risk === "medium").length;

  return (
    <Card className="glass border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Liquidation Monitor
          </span>
          <Badge variant={highRiskCount > 0 ? "destructive" : "outline"}>
            {positions.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
            <div className="text-2xl font-bold text-destructive">{highRiskCount}</div>
            <div className="text-xs text-muted-foreground mt-1">High Risk</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
            <div className="text-2xl font-bold text-yellow-500">{mediumRiskCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Medium Risk</div>
          </div>
          <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
            <div className="text-2xl font-bold text-success">
              {positions.length - highRiskCount - mediumRiskCount}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Safe</div>
          </div>
        </div>

        {/* Alerts */}
        {liquidationAlerts.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Active Alerts</div>
            {liquidationAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-start gap-2 ${
                  alert.risk === "high"
                    ? "bg-destructive/10 border-destructive/20"
                    : "bg-yellow-500/10 border-yellow-500/20"
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 mt-0.5 ${
                    alert.risk === "high" ? "text-destructive" : "text-yellow-500"
                  }`}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{alert.startupName}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {alert.distance.toFixed(1)}% from liquidation
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 p-4 text-success">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">All positions are safe</span>
          </div>
        )}

        {/* Live Price Updates Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>Real-time monitoring active</span>
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePositions, checkLiquidationRisk } from "@/hooks/usePositions";

export default function LiquidationMonitor() {
  const { positions } = usePositions();
  const [liquidationAlerts, setLiquidationAlerts] = useState<Array<{
    startupName: string;
    risk: string;
    distance: number;
  }>>([]);

  // Check liquidation risk for positions
  // Note: In new architecture, prices come from contracts, not Supabase
  // This component uses entry price as baseline - real-time price updates
  // would need to come from contract polling in the parent component
  useEffect(() => {
    if (!positions || positions.length === 0) {
      setLiquidationAlerts([]);
      return;
    }

    const fetchStartupNames = async () => {
      const startupIds = positions.map((p) => p.startup_id);
      const { data: startups } = await supabase
        .from("startups")
        .select("id, name")
        .in("id", startupIds);

      if (!startups) return;

      const alerts: Array<{ startupName: string; risk: string; distance: number }> = [];

      positions.forEach((position) => {
        const startup = startups.find((s) => s.id === position.startup_id);
        if (!startup) return;

        // Use entry price as current price for now
        // Real-time price would need to be passed from parent via contract polling
        const currentPrice = position.entry_price;
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

    fetchStartupNames();
  }, [positions]);

  if (liquidationAlerts.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-success">
            <Shield className="h-4 w-4" />
            Positions Safe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No positions at risk of liquidation
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Liquidation Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {liquidationAlerts.map((alert, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-muted-foreground" />
              <span>{alert.startupName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={alert.risk === "high" ? "destructive" : "secondary"}
                className="text-[10px] px-1.5"
              >
                {alert.risk === "high" ? "HIGH RISK" : "MEDIUM"}
              </Badge>
              <span className="text-muted-foreground">
                {alert.distance.toFixed(1)}% to liq
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

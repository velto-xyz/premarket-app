import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, TrendingUp, DollarSign, Building, Wallet, ArrowDownToLine, Activity, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { startupLogos } from "@/assets/logos";
import { getTicker } from "@/lib/tickers";
import PortfolioNewsTicker from "@/components/PortfolioNewsTicker";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { StorageLayer } from "@/lib/storage";
import { useQuery } from "@tanstack/react-query";
import { formatUSD } from "@/lib/format";
import Sparkline from "@/components/Sparkline";
import { useSync } from "@/hooks/useSync";

export default function Portfolio() {
  const navigate = useNavigate();
  const { address } = useAccount();

  // Sync data from indexer on page load
  useSync();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Fetch user's open positions from all markets
  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ["portfolio-positions", address],
    queryFn: async () => {
      if (!address) return [];
      const storage = new StorageLayer();
      return storage.getUserOpenPositions(address);
    },
    enabled: !!address,
    refetchInterval: 10000,
  });

  // Fetch 7-day price trends for each unique market
  const uniqueEngines = [...new Set(positions.map(p => p.engineAddress).filter(Boolean))];
  console.log("[Portfolio] Unique engines for 7d trends:", uniqueEngines);
  const { data: priceTrends = {} } = useQuery({
    queryKey: ["portfolio-7d-trends", uniqueEngines],
    queryFn: async () => {
      if (uniqueEngines.length === 0) return {};
      console.log("[Portfolio] Fetching 7d trends for engines:", uniqueEngines);
      const storage = new StorageLayer();
      const trends: Record<string, { price: number }[]> = {};
      await Promise.all(
        uniqueEngines.map(async (engine) => {
          const data = await storage['supabase'].get7dTrend(engine);
          console.log("[Portfolio] 7d trend for", engine, ":", data.length, "points");
          trends[engine.toLowerCase()] = data.map(p => ({ price: p.price }));
        })
      );
      return trends;
    },
    enabled: uniqueEngines.length > 0,
    staleTime: 60000,
  });

  // Fetch recent activity (trades)
  const { data: activity = [] } = useQuery({
    queryKey: ["portfolio-activity", address],
    queryFn: async () => {
      if (!address) return [];
      console.log("[Portfolio] Fetching activity for:", address);
      const storage = new StorageLayer();
      const result = await storage['supabase'].getWalletActivity(address, 20);
      console.log("[Portfolio] Activity result:", result);
      return result;
    },
    enabled: !!address,
    staleTime: 30000,
  });

  // Fetch wallet portfolio stats (realized PnL, total trades, etc.)
  const { data: walletPortfolio } = useQuery({
    queryKey: ["wallet-portfolio", address],
    queryFn: async () => {
      if (!address) return null;
      const storage = new StorageLayer();
      return storage['supabase'].getWalletPortfolio(address);
    },
    enabled: !!address,
    staleTime: 30000,
  });

  // Get unique market slugs from positions
  const uniqueMarketSlugs = [...new Set(positions.map(p => p.marketSlug))];

  // Fetch internal balance across ALL markets with contracts (not just ones with positions)
  const { data: internalBalance = 0 } = useQuery({
    queryKey: ["portfolio-internal-balance", address],
    queryFn: async () => {
      if (!address) return 0;

      const storage = new StorageLayer();
      let totalBalance = 0;

      // Get all markets with deployed contracts
      const allMarkets = await storage['supabase'].getAllMarketsWithContracts();

      // Fetch balance for each market that has a perp engine
      for (const market of allMarkets) {
        if (market.perp_engine_address) {
          const balance = await storage.contracts.getUserBalance(address, market.perp_engine_address);
          totalBalance += balance;
        }
      }

      return totalBalance;
    },
    enabled: !!address,
    refetchInterval: 10000,
  });

  // Calculate portfolio metrics from real positions
  const totalMargin = positions.reduce((sum, p) => sum + p.margin, 0);
  const totalNotional = positions.reduce((sum, p) => sum + p.entryNotional, 0);
  const totalPnL = walletPortfolio?.realizedPnl || 0;
  const numPositions = positions.length;
  const uniqueMarkets = uniqueMarketSlugs.length;

  // Group positions by market for holdings display
  const holdingsByMarket = positions.reduce((acc, pos) => {
    const key = pos.marketSlug;
    if (!acc[key]) {
      acc[key] = {
        marketSlug: pos.marketSlug,
        positions: [],
        totalMargin: 0,
        totalNotional: 0,
      };
    }
    acc[key].positions.push(pos);
    acc[key].totalMargin += pos.margin;
    acc[key].totalNotional += pos.entryNotional;
    return acc;
  }, {} as Record<string, { marketSlug: string; positions: typeof positions; totalMargin: number; totalNotional: number }>);

  const holdings = Object.values(holdingsByMarket);

  const handleWithdraw = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > internalBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsWithdrawing(true);
    try {
      // TODO: Implement actual withdraw using ContractSource
      // const storageLayer = new StorageLayer(walletClient);
      // const result = await storageLayer.contractSource.withdraw(
      //   address,
      //   perpEngineAddress,
      //   amount
      // );
      // if (result.status === 'success') {
      //   toast.success("Withdrawal successful!");
      //   setWithdrawModalOpen(false);
      //   setWithdrawAmount("");
      // } else {
      //   toast.error(result.error || "Withdrawal failed");
      // }

      toast.info("Withdraw function will be implemented soon");
      setWithdrawModalOpen(false);
      setWithdrawAmount("");
    } catch (error: any) {
      toast.error(error.message || "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
      {/* Bloomberg-style News Ticker for held startups */}
      <PortfolioNewsTicker holdingSlugs={holdings.map(h => h.marketSlug)} />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold text-foreground mb-2">Portfolio</h1>
          <p className="text-muted-foreground text-base">Overview of all your Velto startup positions.</p>
        </div>
      </div>

      {/* Section 1: Portfolio KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">
              {formatUSD(totalMargin)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Collateral in open positions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Notional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">
              {formatUSD(totalNotional)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total position size (leveraged)</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Realized PnL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-mono ${totalPnL >= 0 ? "text-success" : "text-destructive"}`}>
              {totalPnL >= 0 ? "+" : ""}{formatUSD(totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From closed positions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building className="h-4 w-4" />
              Open Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">
              {numPositions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across {uniqueMarkets} market{uniqueMarkets !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Internal Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">
              {formatUSD(internalBalance)}
            </div>
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => setWithdrawModalOpen(true)}
                disabled={internalBalance === 0}
              >
                <ArrowDownToLine className="h-3 w-3 mr-1" />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Open Positions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Wallet className="h-5 w-5 text-foreground" />
              Open Positions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {positionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading positions...</div>
          ) : holdings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No open positions yet</p>
              <Button onClick={() => navigate("/")}>Explore Markets</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {holdings.map((holding) => {
                const engineAddress = holding.positions[0]?.engineAddress?.toLowerCase() || "";
                return (
                  <div key={holding.marketSlug} className="border border-muted rounded-lg overflow-hidden">
                    {/* Market Header - Clickable */}
                    <div
                      className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(expandedRow === holding.marketSlug ? null : holding.marketSlug)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center p-1.5">
                          {startupLogos[holding.marketSlug] ? (
                            <img
                              src={startupLogos[holding.marketSlug]}
                              alt={`${holding.marketSlug} logo`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">
                              {holding.marketSlug.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="font-mono text-sm text-primary font-semibold">{getTicker(holding.marketSlug)}</span>
                          <p className="text-xs text-muted-foreground">{holding.positions.length} position{holding.positions.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 text-sm">
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Total Margin</p>
                          <p className="font-mono font-semibold">{formatUSD(holding.totalMargin)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Total Notional</p>
                          <p className="font-mono font-semibold">{formatUSD(holding.totalNotional)}</p>
                        </div>
                        {expandedRow === holding.marketSlug ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>
                    {/* Expanded: Trend + Positions */}
                    {expandedRow === holding.marketSlug && (
                      <div className="border-t border-border/40 bg-muted/20">
                        {/* 7-day trend */}
                        <div className="p-4 border-b border-border/40">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground">7-day price trend</p>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/startup/${holding.marketSlug}`)}>
                              View Market
                            </Button>
                          </div>
                          <Sparkline
                            data={priceTrends[engineAddress] || []}
                            height={60}
                          />
                        </div>
                        {/* Individual positions */}
                        <div className="divide-y divide-border/40">
                          {holding.positions.map((position) => (
                            <div key={position.id} className="flex items-center justify-between p-4">
                              <div className="flex items-center gap-3">
                                <Badge variant={position.positionType === "long" ? "default" : "destructive"} className={position.positionType === "long" ? "bg-success text-success-foreground text-xs" : "text-xs"}>
                                  {position.positionType.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{position.leverage.toFixed(1)}x</span>
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-right">
                                  <p className="text-muted-foreground text-xs">Margin</p>
                                  <p className="font-mono font-semibold">{formatUSD(position.margin)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-muted-foreground text-xs">Size</p>
                                  <p className="font-mono font-semibold">{formatUSD(position.entryNotional)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-muted-foreground text-xs">Entry</p>
                                  <p className="font-mono font-semibold">{formatUSD(position.entryPrice)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-muted-foreground text-xs">Liq.</p>
                                  <p className="font-mono font-semibold text-destructive">{formatUSD(position.liquidationPrice)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="h-5 w-5 text-foreground" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No trading activity yet
            </div>
          ) : (
            <div className="space-y-2">
              {activity.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      trade.type === "open"
                        ? trade.side === "long" ? "bg-success/20" : "bg-destructive/20"
                        : trade.type === "liquidation" ? "bg-destructive/20" : "bg-muted"
                    }`}>
                      {trade.type === "open" ? (
                        trade.side === "long" ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />
                      ) : trade.type === "liquidation" ? (
                        <Zap className="h-4 w-4 text-destructive" />
                      ) : (
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{trade.type}</span>
                        {trade.type === "open" && (
                          <Badge variant={trade.side === "long" ? "default" : "destructive"} className={`text-[10px] ${trade.side === "long" ? "bg-success text-success-foreground" : ""}`}>
                            {trade.side?.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {trade.timestamp.toLocaleDateString()} {trade.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-medium">{formatUSD(trade.notional)}</p>
                    <p className="text-xs text-muted-foreground">@ {formatUSD(trade.price)}</p>
                    {trade.pnl !== undefined && (
                      <p className={`text-xs font-mono ${trade.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                        {trade.pnl >= 0 ? "+" : ""}{formatUSD(trade.pnl)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw USDC</DialogTitle>
            <DialogDescription>
              Withdraw USDC from your internal balance to your wallet. Available balance: ${internalBalance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDC)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="pr-16"
                  step="0.01"
                  min="0"
                  max={internalBalance}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                  onClick={() => setWithdrawAmount(internalBalance.toString())}
                >
                  MAX
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Transaction will convert internal balance (18 decimals) to USDC (6 decimals)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={isWithdrawing || !withdrawAmount}>
              {isWithdrawing ? "Withdrawing..." : "Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AppLayout>
  );
}

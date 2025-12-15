import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity, DollarSign, Percent, Building, Trophy, Wallet, ArrowDownToLine } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { startupLogos } from "@/assets/logos";
import unicornPodiumVideo from "@/assets/unicorn-podium.mp4";
import { getTicker } from "@/lib/tickers";
import PortfolioNewsTicker from "@/components/PortfolioNewsTicker";
import { useAccount } from "wagmi";
import { toast } from "sonner";
// Mock data for demonstration
const portfolioData = {
  totalValue: 128430,
  totalPnL: 12340,
  performanceDelta: 9.8,
  numStartups: 12,
  sparklineData: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: 100 + Math.random() * 15 - 5
  }))
};

const topStartups = [
  {
    id: 1,
    name: "NebulaDrive Spaceworks",
    value: 32100,
    performance: 23.4,
    color: "#8B5CF6",
    industry: "Space"
  },
  {
    id: 2,
    name: "QuantumLoop Finance",
    value: 28500,
    performance: 18.7,
    color: "#F4C85E",
    industry: "FinTech"
  },
  {
    id: 3,
    name: "HelixDrive Therapeutics",
    value: 24200,
    performance: 15.2,
    color: "#5CD88F",
    industry: "Biotech"
  }
];

const holdings = [
  { id: 1, name: "NebulaDrive Spaceworks", slug: "nebuladrive-spaceworks", industry: "Space", shares: 1250, value: 32100, avgEntry: 24.50, currentPrice: 25.68, pnl: 23.4, color: "#8B5CF6" },
  { id: 2, name: "QuantumLoop Finance", slug: "quantumloop-finance", industry: "FinTech", shares: 980, value: 28500, avgEntry: 27.80, currentPrice: 29.08, pnl: 18.7, color: "#F4C85E" },
  { id: 3, name: "HelixDrive Therapeutics", slug: "helixdrive-therapeutics", industry: "Biotech", shares: 1500, value: 24200, avgEntry: 15.20, currentPrice: 16.13, pnl: 15.2, color: "#5CD88F" },
  { id: 4, name: "SynapseHive Robotics", slug: "synapsehive-robotics", industry: "Robotics", shares: 800, value: 18600, avgEntry: 22.10, currentPrice: 23.25, pnl: 8.3, color: "#FF6B9D" },
  { id: 5, name: "FinoraChain", slug: "finorachain", industry: "FinTech", shares: 2100, value: 15400, avgEntry: 7.50, currentPrice: 7.33, pnl: -2.3, color: "#FFB84D" },
  { id: 6, name: "AeroPulse Mobility", slug: "aeropulse-mobility", industry: "Automotive", shares: 600, value: 9630, avgEntry: 15.80, currentPrice: 16.05, pnl: 1.6, color: "#4ECDC4" },
];

const activities = [
  { id: 1, date: "2025-01-28 14:32", startup: "NebulaDrive Spaceworks", slug: "nebuladrive-spaceworks", action: "Buy", quantity: 250, price: 25.68, total: 6420, color: "#8B5CF6" },
  { id: 2, date: "2025-01-27 11:15", startup: "QuantumLoop Finance", slug: "quantumloop-finance", action: "Sell", quantity: 120, price: 29.08, total: 3490, color: "#F4C85E" },
  { id: 3, date: "2025-01-26 09:45", startup: "HelixDrive Therapeutics", slug: "helixdrive-therapeutics", action: "Buy", quantity: 300, price: 16.13, total: 4839, color: "#5CD88F" },
  { id: 4, date: "2025-01-25 16:20", startup: "SynapseHive Robotics", slug: "synapsehive-robotics", action: "Buy", quantity: 150, price: 23.25, total: 3488, color: "#FF6B9D" },
  { id: 5, date: "2025-01-24 13:10", startup: "FinoraChain", slug: "finorachain", action: "Dividend", quantity: 0, price: 0, total: 125, color: "#FFB84D" },
];

export default function Portfolio() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const [dateRange, setDateRange] = useState("30d");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [activityFilter, setActivityFilter] = useState("all");
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // TODO: Replace with actual balance from ContractSource
  const internalBalance = 0; // Mock internal balance

  const filteredActivities = activities.filter(activity => {
    if (activityFilter === "all") return true;
    return activity.action.toLowerCase() === activityFilter;
  });

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
      <PortfolioNewsTicker holdingSlugs={holdings.map(h => h.slug)} />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold text-foreground mb-2">Portfolio</h1>
          <p className="text-muted-foreground text-base">Overview of all your Velto startup holdings.</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Section 1: Portfolio KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">
              ${portfolioData.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current value of all tokenized shares</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total PnL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-success">
              +${portfolioData.totalPnL.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Realized + Unrealized PnL</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-success">
              +{portfolioData.performanceDelta}%
            </div>
            <div className="mt-3 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioData.sparklineData}>
                  <defs>
                    <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--success))"
                    fill="url(#sparkGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building className="h-4 w-4" />
              Startups Held
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">
              {portfolioData.numStartups}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all industries</p>
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
              ${internalBalance.toLocaleString()}
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

      {/* Section 2: Top 3 Startups Podium */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top Performing Startups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 2nd Place */}
            <div className="flex flex-col items-center order-2 md:order-1">
              <div className="relative w-full max-w-[300px]">
                <Card className="hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 h-[280px] flex flex-col">
                  <CardContent className="pt-6 flex-1 flex flex-col items-center justify-between">
                    <div className="w-20 h-20 mb-3 rounded-lg overflow-hidden">
                      <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                        <source src={unicornPodiumVideo} type="video/mp4" />
                      </video>
                    </div>
                    <div className="text-center space-y-2 flex-1 flex flex-col justify-center">
                      <Badge variant="outline" className="mb-1 text-xs bg-muted/50 text-muted-foreground border-muted">{topStartups[1].industry}</Badge>
                      <h3 className="font-semibold text-sm leading-tight">{topStartups[1].name}</h3>
                      <p className="text-2xl font-bold font-mono text-foreground">${topStartups[1].value.toLocaleString()}</p>
                      <div className="flex justify-center">
                        <Badge variant="default" className="bg-success text-success-foreground px-2 text-xs">
                          +{topStartups[1].performance}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="mt-2 h-12 bg-muted rounded-lg flex items-center justify-center font-bold text-lg border-2 border-border">
                  2nd
                </div>
              </div>
            </div>

            {/* 1st Place - Taller */}
            <div className="flex flex-col items-center order-1 md:order-2">
              <div className="relative w-full max-w-[300px]">
                <Card className="hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 border-primary h-[320px] flex flex-col">
                  <CardContent className="pt-6 flex-1 flex flex-col items-center justify-between">
                    <div className="w-24 h-24 mb-3 rounded-lg overflow-hidden">
                      <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                        <source src={unicornPodiumVideo} type="video/mp4" />
                      </video>
                    </div>
                    <div className="text-center space-y-2 flex-1 flex flex-col justify-center">
                      <Badge variant="outline" className="mb-1 bg-muted/50 text-muted-foreground border-muted">{topStartups[0].industry}</Badge>
                      <h3 className="font-semibold leading-tight">{topStartups[0].name}</h3>
                      <p className="text-3xl font-bold font-mono text-foreground">${topStartups[0].value.toLocaleString()}</p>
                      <div className="flex justify-center">
                        <Badge variant="default" className="bg-success text-success-foreground px-2 text-xs">
                          +{topStartups[0].performance}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="mt-2 h-16 bg-primary rounded-lg flex items-center justify-center font-bold text-2xl border-2 border-primary text-primary-foreground">
                  1st
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center order-3">
              <div className="relative w-full max-w-[300px]">
                <Card className="hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 h-[240px] flex flex-col">
                  <CardContent className="pt-6 flex-1 flex flex-col items-center justify-between">
                    <div className="w-16 h-16 mb-3 rounded-lg overflow-hidden">
                      <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                        <source src={unicornPodiumVideo} type="video/mp4" />
                      </video>
                    </div>
                    <div className="text-center space-y-2 flex-1 flex flex-col justify-center">
                      <Badge variant="outline" className="mb-1 text-xs bg-muted/50 text-muted-foreground border-muted">{topStartups[2].industry}</Badge>
                      <h3 className="font-semibold text-xs leading-tight">{topStartups[2].name}</h3>
                      <p className="text-xl font-bold font-mono text-foreground">${topStartups[2].value.toLocaleString()}</p>
                      <div className="flex justify-center">
                        <Badge variant="default" className="bg-success text-success-foreground px-2 text-xs">
                          +{topStartups[2].performance}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="mt-2 h-10 bg-muted rounded-lg flex items-center justify-center font-bold border-2 border-border">
                  3rd
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Holdings List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Wallet className="h-5 w-5 text-foreground" />
              Your Holdings
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">All Industries</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">Gainers</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">Largest</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {holdings.map((holding) => (
              <div key={holding.id} className="border border-muted rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setExpandedRow(expandedRow === holding.id ? null : holding.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center p-2">
                      <img 
                        src={startupLogos[holding.slug]} 
                        alt={`${holding.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-primary font-semibold">{getTicker(holding.slug)}</span>
                                        <h4 className="font-semibold text-foreground">{holding.name}</h4>
                                      </div>
                                      <Badge variant="outline" className="text-xs mt-1 bg-muted/50 text-muted-foreground border-border">{holding.industry}</Badge>
                                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Shares</p>
                      <p className="font-mono font-semibold">{holding.shares.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Value</p>
                      <p className="font-mono font-semibold">${holding.value.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Avg Entry</p>
                      <p className="font-mono font-semibold">${holding.avgEntry}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Current</p>
                      <p className="font-mono font-semibold">${holding.currentPrice}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <Badge variant={holding.pnl >= 0 ? "default" : "destructive"} className={holding.pnl >= 0 ? "bg-success text-success-foreground" : ""}>
                        {holding.pnl >= 0 ? "+" : ""}{holding.pnl}%
                      </Badge>
                    </div>
                    {expandedRow === holding.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </div>
                {expandedRow === holding.id && (
                  <div className="border-t border-border/40 p-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-3">7-day price trend</p>
                        <div className="h-20">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={portfolioData.sparklineData.slice(0, 7)}>
                              <defs>
                                <linearGradient id={`grad${holding.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={holding.color} stopOpacity={0.3} />
                                  <stop offset="100%" stopColor={holding.color} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke={holding.color}
                                fill={`url(#grad${holding.id})`}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="flex gap-3 ml-6">
                        <Button variant="default" size="sm" onClick={() => navigate(`/startup/${holding.slug}`)}>Buy More</Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/startup/${holding.slug}`)}>Sell</Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/startup/${holding.slug}`)}>View Market</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Activity / Transactions History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity
            </CardTitle>
            <div className="flex gap-2">
              <Badge
                variant={activityFilter === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActivityFilter("all")}
              >
                All
              </Badge>
              <Badge
                variant={activityFilter === "buy" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActivityFilter("buy")}
              >
                Buys
              </Badge>
              <Badge
                variant={activityFilter === "sell" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActivityFilter("sell")}
              >
                Sells
              </Badge>
              <Badge
                variant={activityFilter === "dividend" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActivityFilter("dividend")}
              >
                Dividends
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border border-muted rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center p-1.5">
                    <img 
                      src={startupLogos[activity.slug]} 
                      alt={`${activity.startup} logo`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{activity.startup}</h4>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <Badge
                    variant={activity.action === "Buy" ? "default" : activity.action === "Sell" ? "destructive" : "outline"}
                    className={
                      activity.action === "Buy" 
                        ? "bg-success text-success-foreground" 
                        : activity.action === "Dividend" 
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30" 
                          : ""
                    }
                  >
                    {activity.action}
                  </Badge>
                  {activity.quantity > 0 && (
                    <>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="font-mono font-semibold text-sm">{activity.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-mono font-semibold text-sm">${activity.price}</p>
                      </div>
                    </>
                  )}
                  <div className="text-right min-w-[100px]">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-mono font-bold text-foreground">${activity.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

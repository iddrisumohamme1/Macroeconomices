export interface CentralBankRate {
  country: string;
  currency: string;
  centralBank: string;
  nominalRate: number; // e.g. 5.25%
  previousMonthRate?: number; // Previous month's benchmark rate e.g. 5.50%
  cpiInflation: number; // e.g. 2.9%
  previousCpi?: number;
  lastUpdated: string;
  trend: 'hiking' | 'cutting' | 'neutral';
  flag: string;
}

export interface RateDeviationAlert {
  id: string;
  currency: string;
  centralBank: string;
  country: string;
  flag: string;
  previousRate: number;
  newRate: number;
  deviationBps: number;
  thresholdBps: number;
  direction: 'CUT' | 'HIKE';
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  marketImplication: string;
}

export interface RealRateDifferential {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseNominal: number;
  baseCPI: number;
  baseRealRate: number;
  quoteNominal: number;
  quoteCPI: number;
  quoteRealRate: number;
  differential: number; // baseRealRate - quoteRealRate
  bias: 'Strongly Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strongly Bearish';
  convictionScore: number; // 0 - 100
}

export interface CommodityCorrelation {
  commodity: string;
  benchmark: string;
  currentPrice: number;
  change24h: number;
  correlations: {
    currency: string;
    pair: string;
    correlationCoefficient: number; // -1 to +1
    economicRationale: string;
    historicalAverage: number;
  }[];
}

export type RiskRegime = 'Aggressive Risk-On' | 'Moderate Risk-On' | 'Neutral / Transition' | 'Moderate Risk-Off' | 'Severe Risk-Off';

export interface SentimentGaugeData {
  regime: RiskRegime;
  score: number; // -100 (extreme risk-off) to +100 (extreme risk-on)
  germ40: {
    price: number;
    change24h: number;
    trend20d: 'Bullish Expansion' | 'Neutral Consolidation' | 'Bearish Breakdown';
    structuralStatus: string;
  };
  usdchf: {
    price: number;
    change24h: number;
    trend20d: 'CHF Safe-Haven Inflow' | 'Balanced Flow' | 'USD Yield Dominance';
    structuralStatus: string;
  };
  secondaryMetrics: {
    us10yYield: number;
    vixProxy: number;
    dxyIndex: number;
  };
  narrative: string;
}

export interface FundingAccount {
  id: string; // e.g. FTMO-100K-01
  propFirm: string;
  accountType: '100K Evaluation' | '100K Funded' | '200K Funded' | '50K Express' | '300K Institutional' | string;
  accountSize: number;
  dailyStartingEquity: number; // captured at broker rollover (5:00 PM EST / 22:00 UTC)
  currentEquity: number;
  balance: number;
  unrealizedPnL: number;
  realizedDailyPnL: number;
  dailyDrawdownLimitPct: number; // 5% hard rule
  dailyDrawdownCeiling: number; // dailyStartingEquity * (1 - 0.05)
  maxLossAllowed: number; // dailyStartingEquity * 0.05
  distanceToViolation: number; // currentEquity - dailyDrawdownCeiling
  distancePct: number; // (distanceToViolation / dailyStartingEquity) * 100
  status: 'Safe' | 'Caution' | 'Warning' | 'Critical Threat' | 'Breached';
  totalTradesToday: number;
  serverTimezone: string;
  lastRolloverTimestamp: string;
  historicalEquity: {
    time: string;
    equity: number;
    drawdownCeiling: number;
  }[];
  connectionType?: 'INVESTOR_PASSWORD_READONLY' | 'MANUAL_ENTRY' | 'CSV_STATEMENT';
  platform?: 'MT4' | 'MT5' | 'cTrader' | 'MatchTrader';
  serverName?: string;
  loginNumber?: string;
  isReadOnly?: boolean;
}

export interface TradeRecord {
  id: string;
  accountId: string;
  ticketId: string;
  asset: string;
  direction: 'BUY' | 'SELL';
  lotSize: number;
  openPrice: number;
  closePrice: number;
  pnl: number;
  pnlPercentage: number;
  rMultiple: number; // PnL divided by initial dollar risk
  commission: number;
  openTime: string;
  closeTime: string;
  status: 'WIN' | 'LOSS' | 'BREAKEVEN';
  executionType: 'READ_ONLY_SYNC' | 'CSV_STATEMENT_AUDIT';
}

export interface PortfolioAggregateMetrics {
  totalEquity: number;
  totalDailyStartingEquity: number;
  combinedDailyPnL: number;
  combinedDailyPnLPct: number;
  worstAccountDistance: number;
  worstAccountDistancePct: number;
  worstAccountId: string;
  totalActiveAccounts: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // percentage
  lossRate: number; // percentage
  averageWin: number;
  averageLoss: number;
  riskToRewardRatio: number; // Average Win / Average Loss
  mathematicalExpectancy: number; // (WinRate * AvgWin) - (LossRate * AvgLoss)
  profitFactor: number;
  sharpeRatioEst: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  category: 'SECURITY' | 'DATA_INGEST' | 'CALCULATION' | 'RULE_ALERT' | 'USER_ACTION';
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  message: string;
  details: string;
  source: string;
  immutableHash: string;
}

export interface MonthlyRoiRecord {
  month: string;
  monthFullName: string;
  year: number;
  portfolioRoiPct: number;
  cumulativeRoiPct: number;
  netDollarPnL: number;
  capitalBase: number;
  winRatePct: number;
  benchmarkTargetPct: number;
  accountBreakdown?: {
    accountId: string;
    propFirm: string;
    roiPct: number;
    dollarPnL: number;
  }[];
}

export interface ArchitectureComparison {
  dimension: string;
  springBootSupabase: string;
  traditionalRelational: string;
  googleSheetsLooker: string;
  verdict: string;
  tradeOffAnalysis: string;
}

export interface CurrencyBiasItem {
  currency: string;
  country: string;
  flag: string;
  biasScore: number; // -100 to +100
  biasLabel: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  rank: number; // 1 to 8
  ratesWeight: number; // e.g. +25
  inflationWeight: number; // e.g. +15
  growthJobsWeight: number; // e.g. +20
  cotWeight: number; // e.g. +12
  primaryDriver: string;
  centralBankStance: 'Aggressive Hike' | 'Hawkish Hold' | 'Neutral' | 'Dovish Cut' | 'Accommodative';
  nextKeyRelease: string;
}

export interface DivergencePairItem {
  id: string;
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  bias: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
  divergenceScore: number; // difference in score between base and quote
  baseScore: number;
  quoteScore: number;
  carryYieldPct: number; // base real rate - quote real rate
  cotAlignment: 'Bullish Institutional Flow' | 'Bearish Institutional Flow' | 'Mixed';
  sentimentCorrelation: 'High Risk-On' | 'Safe-Haven Surge' | 'Neutral';
  strategicCatalyst: string;
  suggestedStopLossPips: number;
  suggestedTakeProfitPips: number;
}

export interface COTPositionItem {
  currency: string;
  symbol: string;
  flag: string;
  nonCommercialLong: number;
  nonCommercialShort: number;
  nonCommercialNet: number;
  netChange1W: number;
  commercialNet: number;
  openInterest: number;
  zScore10Yr: number; // -3.0 to +3.0
  percentile10Yr: number; // 0 to 100%
  institutionalBias: 'Crowded Long' | 'Bullish Accumulation' | 'Neutral' | 'Bearish Distribution' | 'Crowded Short';
  lastReportDate: string;
}

export interface EconomicNewsEvent {
  id: string;
  isoDate?: string; // Raw ISO 8601 timestamp for client geographic timezone calculation
  time: string; // Display time string
  timeEdt?: string; // Forex Factory EDT / New York time (e.g. "8:30am")
  timeUtc?: string; // Standard UTC time (e.g. "12:30 UTC")
  date: string; // e.g. "Today", "Tomorrow", "Friday"
  dayOfWeek: string;
  currency: string; // USD, EUR, GBP, JPY, AUD, CAD, NZD, CHF, CNY, ALL
  flag: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW' | 'HOLIDAY'; // Red, Orange, Yellow, Grey folder
  title: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  outcomeSentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'PENDING';
  surpriseDelta?: string;
  surpriseStatus?: 'BEAT' | 'MISS' | 'IN_LINE' | 'PENDING';
  source: string;
  frequency: string;
  economicRationale: string;
  propFirmNewsRestricted: boolean; // FTMO / Funding Pips 2-minute rule
  minutesUntilRelease?: number;
}

export interface ToastAlert {
  id: string;
  type: 'CRITICAL_THREAT' | 'BREACHED' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  accountId?: string;
  timestamp: string;
  distance?: number;
  distancePct?: number;
  durationMs?: number;
}

export interface MarketNewsArticle {
  id: string;
  title: string;
  category: 'CENTRAL_BANKS' | 'FOREX' | 'COMMODITIES' | 'MACRO_POLICY';
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  timeAgo: string;
  summary: string;
  marketImpact: string;
  affectedPairs: string[];
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  keyTakeaway?: string;
}

export interface SovereignYieldItem {
  currency: string;
  country: string;
  flag: string;
  bondName2Y: string;
  yield2Y: number; // e.g. 4.25 (%)
  bondName10Y: string;
  yield10Y: number; // e.g. 4.42 (%)
  curveSlopeBps: number; // (yield10Y - yield2Y) * 100 in basis points
  dailyChangeBps: number; // e.g. -3.4 bps
  curveStatus: 'Normal Upward' | 'Flat' | 'Inverted';
  updatedTimestamp: string;
}

export interface YieldSpreadPair {
  id: string;
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  spread2YBps: number; // (baseYield2Y - quoteYield2Y) * 100
  spread2YPct: number; // baseYield2Y - quoteYield2Y
  trendDirection: 'WIDENING' | 'STABLE' | 'NARROWING';
  fxImplication: 'BULLISH_BASE' | 'NEUTRAL' | 'BEARISH_BASE';
  dailySpreadChangeBps: number;
}

export interface OISMeetingProbability {
  currency: string;
  country: string;
  bankName: string;
  flag: string;
  currentPolicyRate: number; // e.g. 5.25%
  meetings: {
    meetingDate: string;
    daysUntil: number;
    expectedBpsChange: number; // e.g. -25 bps
    cutProbabilityPct: number; // e.g. 84%
    pauseProbabilityPct: number; // e.g. 16%
    hikeProbabilityPct: number; // e.g. 0%
    terminalRatePriced: number;
  }[];
  totalEasedByYearEndBps: number; // e.g. -75 bps
  marketStance: 'Aggressive Cuts Priced' | 'Gradual Easing Priced' | 'Prolonged Pause' | 'Tightening Priced';
}

export interface CurrentAccountItem {
  currency: string;
  country: string;
  flag: string;
  currentAccountPctGdp: number; // e.g. +7.8% (Switzerland) or -3.4% (USA)
  tradeBalanceUsdBillions: number; // e.g. +18.5
  gdpAnnualGrowthPct: number; // e.g. +2.4%
  flowRating: 'Structural Surplus Support' | 'Moderate Surplus' | 'Moderate Deficit' | 'Twin Deficit Drag';
  foreignDirectInvestmentFlow: 'Inflow' | 'Balanced' | 'Outflow';
  macroRationale: string;
}

export interface REERValuationItem {
  currency: string;
  country: string;
  flag: string;
  reerIndex: number; // 100 is baseline
  tenYearMedian: number;
  valuationPct: number; // e.g. +14.2% or -28.5%
  status: 'Significantly Overvalued' | 'Overvalued' | 'Fair Value' | 'Undervalued' | 'Significantly Undervalued';
  meanReversionSignal: 'Strong Short Bias' | 'Lean Short' | 'Neutral' | 'Lean Long' | 'Strong Long Bias';
  primaryDriver: string;
}


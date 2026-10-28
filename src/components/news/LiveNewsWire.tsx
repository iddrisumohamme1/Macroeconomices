import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MarketNewsArticle } from '../../types';
import {
  Newspaper,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  Globe,
  Tag,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  X,
  Filter,
} from 'lucide-react';

interface LiveNewsWireProps {
  initialArticles: MarketNewsArticle[];
  refreshSignal?: number;
}

export const LiveNewsWire: React.FC<LiveNewsWireProps> = ({ initialArticles, refreshSignal }) => {
  const [articles, setArticles] = useState<MarketNewsArticle[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [autoSyncCountdown, setAutoSyncCountdown] = useState<number>(45);
  const [activeModalArticle, setActiveModalArticle] = useState<MarketNewsArticle | null>(null);

  // Handle Sync Live Wire from backend
  const handleSyncNewsWire = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsRefreshing(true);
    try {
      // First try live financial wire feed (with fresh bypass)
      const res = await fetch('/api/news/feed?force=true');
      if (res.ok) {
        const data = await res.json();
        if (data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles((prev) => {
            const newTitles = new Set(data.articles.map((a: MarketNewsArticle) => a.title.toLowerCase()));
            const filteredPrev = prev.filter((p) => !newTitles.has(p.title.toLowerCase()));
            return [...data.articles, ...filteredPrev];
          });
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setAutoSyncCountdown(45);
          return;
        }
      }

      // Fallback to /api/news/wire
      const wireRes = await fetch('/api/news/wire');
      if (wireRes.ok) {
        const wireData = await wireRes.json();
        if (wireData.articles && Array.isArray(wireData.articles) && wireData.articles.length > 0) {
          setArticles((prev) => {
            const newTitles = new Set(wireData.articles.map((a: MarketNewsArticle) => a.title.toLowerCase()));
            const filteredPrev = prev.filter((p) => !newTitles.has(p.title.toLowerCase()));
            return [...wireData.articles, ...filteredPrev];
          });
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (err) {
      console.warn('News wire sync note:', err);
    } finally {
      setIsRefreshing(false);
      setAutoSyncCountdown(45);
    }
  }, []);

  // Sync on initial mount
  useEffect(() => {
    handleSyncNewsWire(false);
  }, [handleSyncNewsWire]);

  // Automated 45-second background auto-refresh cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoSyncCountdown((prev) => {
        if (prev <= 1) {
          handleSyncNewsWire(true);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSyncNewsWire]);

  // Re-sync when global terminal signal changes
  useEffect(() => {
    if (refreshSignal && refreshSignal > 0) {
      handleSyncNewsWire(true);
    }
  }, [refreshSignal, handleSyncNewsWire]);

  // Filter articles based on category and search query
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchCategory =
        selectedCategory === 'ALL' || art.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.source.toLowerCase().includes(q) ||
        art.marketImpact.toLowerCase().includes(q) ||
        art.affectedPairs.some((p) => p.toLowerCase().includes(q));

      return matchCategory && matchQuery;
    });
  }, [articles, selectedCategory, searchQuery]);

  const getImpactColor = (impact: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (impact) {
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'CENTRAL_BANKS':
        return 'Central Bank Policy';
      case 'FOREX':
        return 'Forex Majors';
      case 'COMMODITIES':
        return 'Commodities & Metals';
      case 'MACRO_POLICY':
        return 'Prop Desk & Policy';
      default:
        return category;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Controls: Search, Filters & Sync */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Live Global Macro &amp; FX News Wire
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Feed</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Accurate real-time reporting from Reuters, Bloomberg, Central Bank Dispatches &amp; Financial Wires
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span>Auto: <strong className="text-slate-900">{autoSyncCountdown}s</strong></span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 hidden sm:inline">{lastSyncTime}</span>
            </div>
            <button
              onClick={() => handleSyncNewsWire(false)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
              title="Poll live wire dispatches now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isRefreshing ? 'Polling...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
            {[
              { id: 'ALL', label: 'All News' },
              { id: 'CENTRAL_BANKS', label: 'Central Banks' },
              { id: 'FOREX', label: 'FX Majors' },
              { id: 'COMMODITIES', label: 'Gold & Oil' },
              { id: 'MACRO_POLICY', label: 'Prop Firm Rules' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search news, pairs, central banks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* News Feed Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            onClick={() => setActiveModalArticle(article)}
            className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-150 flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              {/* Top Meta Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded border font-bold ${getImpactColor(article.impactLevel)}`}>
                    {article.impactLevel} IMPACT
                  </span>
                  <span className="text-slate-500 font-semibold">
                    {getCategoryLabel(article.category)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{article.timeAgo || 'Recent'}</span>
                </div>
              </div>

              {/* Title Headline */}
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                {article.title}
              </h4>

              {/* Summary */}
              <p className="text-xs text-slate-600 leading-relaxed font-sans line-clamp-3">
                {article.summary}
              </p>

              {/* Actionable Key Takeaway Box */}
              {article.keyTakeaway && (
                <div className="bg-slate-50 border-l-2 border-blue-600 p-2.5 rounded-r-lg text-xs font-sans text-slate-700">
                  <span className="font-bold text-slate-900 font-mono text-[11px] block mb-0.5">
                    Quantitative Takeaway:
                  </span>
                  {article.keyTakeaway}
                </div>
              )}
            </div>

            {/* Bottom Meta & Pairs */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Pairs:</span>
                {article.affectedPairs.map((pair) => (
                  <span
                    key={pair}
                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-bold"
                  >
                    {pair}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="font-mono text-[10px] text-slate-500">
                  Source: <strong className="text-slate-700 font-semibold">{article.source.split('/')[0].trim()}</strong>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        ))}

        {filteredArticles.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <Newspaper className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Dispatches Match Your Filter</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or category filter to view other live news wire reports.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* FULL ARTICLE DETAIL MODAL */}
      {activeModalArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Newspaper className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">
                    Institutional News Wire Dispatch
                  </h3>
                  <span className="text-[11px] text-slate-500 font-sans">
                    {activeModalArticle.source}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveModalArticle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 font-sans text-sm">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className={`px-2 py-0.5 rounded border font-bold ${getImpactColor(activeModalArticle.impactLevel)}`}>
                  {activeModalArticle.impactLevel} IMPACT
                </span>
                <span className="text-slate-500">{activeModalArticle.publishedAt}</span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                {activeModalArticle.title}
              </h2>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-blue-800 block">
                  Market Direction &amp; Flow Impact
                </span>
                <p className="text-xs font-bold text-blue-900 font-mono">
                  {activeModalArticle.marketImpact}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold font-mono text-slate-900 uppercase">
                  Full Dispatch Summary
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {activeModalArticle.summary}
                </p>
              </div>

              {activeModalArticle.keyTakeaway && (
                <div className="bg-slate-50 border-l-3 border-blue-600 p-3.5 rounded-r-xl space-y-1">
                  <span className="text-xs font-bold font-mono text-slate-900 block">
                    Execution Takeaway for Traders
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {activeModalArticle.keyTakeaway}
                  </p>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-mono font-bold text-slate-900 uppercase block">
                  Affected Currency Pairs
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeModalArticle.affectedPairs.map((p) => (
                    <span
                      key={p}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-mono text-xs font-bold"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">
                Verified Macro Source
              </span>

              {activeModalArticle.sourceUrl && (
                <a
                  href={activeModalArticle.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-mono transition-colors shadow-xs"
                >
                  <span>Open Primary Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

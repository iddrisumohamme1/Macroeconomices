import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Newspaper,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  TrendingUp,
  AlertCircle,
  Folder,
  Globe,
  Radio,
  Share2,
  ChevronRight,
  Info,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { MarketNewsArticle } from '../../types';
import { INITIAL_MARKET_NEWS_ARTICLES } from '../../data/marketNewsData';

export const MarketNews: React.FC = () => {
  const [articles, setArticles] = useState<MarketNewsArticle[]>(INITIAL_MARKET_NEWS_ARTICLES);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live Streaming Active');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isLiveFeedConnected, setIsLiveFeedConnected] = useState(true);
  const [activeArticleModal, setActiveArticleModal] = useState<MarketNewsArticle | null>(null);

  // Fetch live market headlines from external API route
  const fetchLiveNews = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      // First attempt dedicated live external news feed
      const response = await fetch('/api/news/feed');
      if (response.ok) {
        const data = await response.json();
        if (data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles(data.articles);
          setIsLiveFeedConnected(Boolean(data.isLiveExternalApi));
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC';
          setLastSyncTime(timeStr);
          return;
        }
      }

      // Secondary attempt news wire
      const wireRes = await fetch('/api/news/wire');
      if (wireRes.ok) {
        const wireData = await wireRes.json();
        if (wireData.articles && Array.isArray(wireData.articles) && wireData.articles.length > 0) {
          setArticles(wireData.articles);
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC';
          setLastSyncTime(timeStr);
        }
      }
    } catch (err) {
      console.warn('Live news fetch note:', err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, []);

  // Fetch immediately on mount to replace placeholder news with live headlines
  useEffect(() => {
    fetchLiveNews();
  }, [fetchLiveNews]);

  // Periodic live news polling (every 45s if auto-refresh is active)
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(() => {
      fetchLiveNews(true);
    }, 45000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchLiveNews]);

  // Categories list
  const categories = [
    { id: 'ALL', label: 'All News' },
    { id: 'FOREX', label: 'Forex & Currencies' },
    { id: 'CENTRAL_BANKS', label: 'Central Banks & Rates' },
    { id: 'COMMODITIES', label: 'Commodities (Gold & Oil)' },
    { id: 'MACRO_POLICY', label: 'Macro Policy & Trade' },
  ];

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchCat = selectedCategory === 'ALL' || a.category === selectedCategory;
      const matchImpact =
        selectedImpact === 'ALL' ||
        (selectedImpact === 'HIGH' && a.impactLevel === 'HIGH') ||
        (selectedImpact === 'MEDIUM' && a.impactLevel === 'MEDIUM') ||
        (selectedImpact === 'LOW' && a.impactLevel === 'LOW');

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        a.affectedPairs.some((p) => p.toLowerCase().includes(q)) ||
        (a.keyTakeaway && a.keyTakeaway.toLowerCase().includes(q));

      return matchCat && matchImpact && matchQuery;
    });
  }, [articles, selectedCategory, selectedImpact, searchQuery]);

  const highImpactCount = useMemo(() => articles.filter((a) => a.impactLevel === 'HIGH').length, [articles]);

  return (
    <div className="space-y-5 font-sans">
      {/* Top Banner: Real-Time Market News Hub */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs font-mono font-semibold">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Real-Time Financial Market News Feed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              Live Financial Market News
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time financial market news streamed directly from external financial wires (Reuters, Bloomberg, Financial Times, CNBC).
              Features automated quantitative currency pair correlation tagging and institutional takeaway summaries.
            </p>
          </div>

          {/* Quick Stream Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0 font-mono text-xs">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 flex items-center justify-between sm:justify-start gap-4">
              <div className="text-left">
                <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span>Last Live Wire Sync</span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5">{lastSyncTime}</div>
              </div>

              <button
                onClick={() => fetchLiveNews(false)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Fetching...' : 'Sync Live News'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Breaking Headline Live Ticker */}
      {articles.length > 0 && (
        <div className="bg-blue-600 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono flex items-center gap-3 shadow-sm overflow-hidden">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider bg-blue-800 px-2.5 py-0.5 rounded text-[10px] shrink-0">
            <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
            <span>Breaking Wire</span>
          </div>
          <div className="truncate flex-1 font-sans font-medium text-blue-50">
            <span className="font-bold text-white mr-2">[{articles[0].source}]:</span>
            {articles[0].title}
          </div>
          <button
            onClick={() => setActiveArticleModal(articles[0])}
            className="text-[11px] font-bold text-blue-100 hover:text-white underline shrink-0 cursor-pointer"
          >
            Read Analysis &rarr;
          </button>
        </div>
      )}

      {/* Filters & Search Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs font-mono">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-semibold cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search live headlines, currencies, pairs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-colors font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Secondary Impact Filter & Stream Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 text-[11px] font-semibold mr-1">Impact Level:</span>
            <button
              onClick={() => setSelectedImpact('ALL')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                selectedImpact === 'ALL' ? 'bg-slate-800 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Impacts ({articles.length})
            </button>
            <button
              onClick={() => setSelectedImpact('HIGH')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                selectedImpact === 'HIGH' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <Folder className="w-2.5 h-2.5 fill-current" />
              <span>High Impact ({highImpactCount})</span>
            </button>
            <button
              onClick={() => setSelectedImpact('MEDIUM')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                selectedImpact === 'MEDIUM' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Medium Impact
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 font-semibold select-none">
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Live Auto-Stream (45s)</span>
            </label>

            <span className="text-slate-300">|</span>

            <span className="text-[11px] text-slate-500 font-mono">
              Showing <strong className="text-slate-900">{filteredArticles.length}</strong> live stories
            </span>
          </div>
        </div>
      </div>

      {/* Live Articles Feed Grid */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No market headlines matched your criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms, clearing category filters, or syncing the live news wire.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedImpact('ALL');
              setSearchQuery('');
            }}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-mono font-bold hover:bg-blue-500 transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => {
            const isHigh = article.impactLevel === 'HIGH';
            const isMedium = article.impactLevel === 'MEDIUM';

            return (
              <div
                key={article.id}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 flex flex-col justify-between transition-all duration-150 hover:shadow-md group relative"
              >
                <div className="space-y-3">
                  {/* Article Metadata Header */}
                  <div className="flex items-center justify-between gap-2 text-xs font-mono">
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[140px]">
                      {article.source}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isMedium
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Folder className="w-2.5 h-2.5 fill-current" />
                        <span>{article.impactLevel}</span>
                      </span>

                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{article.timeAgo || 'Live'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Headline Title */}
                  <h3
                    onClick={() => setActiveArticleModal(article)}
                    className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug cursor-pointer line-clamp-2"
                  >
                    {article.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans">
                    {article.summary}
                  </p>

                  {/* Quantitative Market Impact Tag */}
                  {article.marketImpact && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-[11px] font-mono text-slate-700 space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-blue-600" />
                        <span>Market Impact</span>
                      </div>
                      <div className="font-semibold text-slate-900 truncate">{article.marketImpact}</div>
                    </div>
                  )}

                  {/* Affected Pairs Badges */}
                  {article.affectedPairs && article.affectedPairs.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">Pairs:</span>
                      {article.affectedPairs.map((pair) => (
                        <span
                          key={pair}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          {pair}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <button
                    onClick={() => setActiveArticleModal(article)}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Quant Breakdown</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  {article.sourceUrl && (
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[11px] transition-colors"
                      title="Read original article on publisher site"
                    >
                      <span>Publisher Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Article Detail Quant Breakdown Modal */}
      {activeArticleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-blue-300">
                  <span className="bg-blue-600/40 text-blue-200 px-2 py-0.5 rounded border border-blue-400/30 font-bold">
                    {activeArticleModal.source}
                  </span>
                  <span>&bull;</span>
                  <span>{activeArticleModal.timeAgo || 'Live Wire'}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {activeArticleModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveArticleModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase font-bold text-slate-500">Live Headline Summary</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{activeArticleModal.summary}</p>
              </div>

              {activeArticleModal.keyTakeaway && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1">
                  <div className="text-xs font-mono uppercase font-bold text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Institutional Trader Key Takeaway</span>
                  </div>
                  <p className="text-xs text-blue-950 font-medium leading-relaxed font-sans">
                    {activeArticleModal.keyTakeaway}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Market Impact</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {activeArticleModal.marketImpact || 'Neutral Flow'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Impact Level</span>
                  <span
                    className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded ${
                      activeArticleModal.impactLevel === 'HIGH'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {activeArticleModal.impactLevel} Impact
                  </span>
                </div>
              </div>

              {activeArticleModal.affectedPairs && activeArticleModal.affectedPairs.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-mono uppercase font-bold text-slate-500">Affected Currency Crosses</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeArticleModal.affectedPairs.map((pair) => (
                      <span
                        key={pair}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200"
                      >
                        {pair}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => setActiveArticleModal(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              {activeArticleModal.sourceUrl && (
                <a
                  href={activeArticleModal.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Open Full Article on {activeArticleModal.source}</span>
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

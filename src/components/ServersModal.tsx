import React, { useState, useEffect } from 'react';
import { GameServer, Language, Platform } from '../types';
import defaultServers from '../data/servers.json';
import { translations } from '../i18n/translations';
import {
  Server,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  ShieldAlert,
  Gamepad2,
  Globe,
  Radio,
  PlusCircle,
  X,
  Clock,
  Users,
} from 'lucide-react';

interface ServersModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

interface ServerStatusFeed {
  lastUpdated: string;
  servers: Record<string, { players: number; maxPlayers: number; online: boolean }>;
}

export const ServersModal: React.FC<ServersModalProps> = ({ isOpen, onClose, language }) => {
  const t = translations[language];

  const [servers, setServers] = useState<GameServer[]>(defaultServers as GameServer[]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | Platform>('ALL');
  const [modFilter, setModFilter] = useState<'ALL' | 'VANILLA' | 'MODDED'>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  // Live status from public/servers-status.json if present
  const [statusFeed, setStatusFeed] = useState<ServerStatusFeed | null>(null);
  const [isStatusOutdated, setIsStatusOutdated] = useState<boolean>(false);

  // JSON generator state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [genName, setGenName] = useState('');
  const [genAddress, setGenAddress] = useState('');
  const [genPlatforms, setGenPlatforms] = useState<Platform[]>(['PC', 'XBOX']);
  const [genModded, setGenModded] = useState(false);
  const [genCrossplay, setGenCrossplay] = useState(true);
  const [genScenario, setGenScenario] = useState('Conflict');
  const [genRegion, setGenRegion] = useState('Europe');
  const [genDiscord, setGenDiscord] = useState('');
  const [genNotes, setGenNotes] = useState('');
  const [generatedJson, setGeneratedJson] = useState('');

  // Fetch servers-status.json on mount/open
  useEffect(() => {
    if (!isOpen) return;

    fetch('./servers-status.json')
      .then((res) => {
        if (!res.ok) throw new Error('Status not found');
        return res.json();
      })
      .then((data: ServerStatusFeed) => {
        setStatusFeed(data);
        if (data.lastUpdated) {
          const updatedDate = new Date(data.lastUpdated).getTime();
          const thirtyMins = 30 * 60 * 1000;
          setIsStatusOutdated(Date.now() - updatedDate > thirtyMins);
        }
      })
      .catch(() => {
        // Status file absent or local
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyAddress = (server: GameServer) => {
    navigator.clipboard.writeText(server.address).then(() => {
      setCopiedId(server.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleGenerateJson = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: GameServer = {
      id: `server-${Date.now()}`,
      name: genName.trim() || 'Custom Server',
      address: genAddress.trim() || '127.0.0.1:2302',
      platforms: genPlatforms,
      crossplay: genCrossplay,
      modded: genModded,
      scenario: genScenario.trim(),
      region: genRegion.trim(),
      discord: genDiscord.trim() || undefined,
      notes: genNotes.trim() || undefined,
      isPlaceholder: false,
    };
    setGeneratedJson(JSON.stringify(entry, null, 2));
  };

  // Filter servers
  const filteredServers = servers.filter((srv) => {
    const matchesSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.address.includes(searchQuery);

    const matchesPlatform =
      platformFilter === 'ALL' || srv.platforms.includes(platformFilter);

    const matchesMod =
      modFilter === 'ALL' ||
      (modFilter === 'VANILLA' && !srv.modded) ||
      (modFilter === 'MODDED' && srv.modded);

    const matchesRegion =
      regionFilter === 'ALL' || srv.region.toLowerCase() === regionFilter.toLowerCase();

    return matchesSearch && matchesPlatform && matchesMod && matchesRegion;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">{t.servers}</h3>
              <p className="text-xs text-slate-400">Arma Reforger Community & Live Servers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Top Card: Linking to ArmaHQ */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/50 to-slate-900 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-cyan-300">{t.serversLiveTitle}</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-400 text-[10px] font-mono">
                  ArmaHQ.com
                </span>
              </div>
              <p className="text-xs text-slate-300">{t.serversLiveDesc}</p>
            </div>

            <a
              href="https://www.armahq.com/servers"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950 transition shrink-0"
            >
              <span>{t.openArmaHq}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Console & Mod Warning */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t.serverConsoleWarning}</p>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
            {/* Search */}
            <div className="relative sm:col-span-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={t.searchServers}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Platform filter */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">{t.allPlatforms}</option>
              <option value="PC">PC (Steam)</option>
              <option value="XBOX">Xbox Series X/S</option>
              <option value="PLAYSTATION">PlayStation 5</option>
            </select>

            {/* Modded filter */}
            <select
              value={modFilter}
              onChange={(e) => setModFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">{t.allModTypes}</option>
              <option value="VANILLA">{t.vanillaOnly}</option>
              <option value="MODDED">{t.moddedOnly}</option>
            </select>

            {/* Region filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">{t.allRegions}</option>
              <option value="Europe">Europe</option>
              <option value="North America">North America</option>
              <option value="Middle East">Middle East</option>
            </select>
          </div>

          {/* Servers List */}
          <div className="space-y-3">
            {filteredServers.map((srv) => {
              const live = statusFeed?.servers[srv.id];
              const playersText = live
                ? `${live.players}/${live.maxPlayers}`
                : srv.players
                ? `${srv.players}/${srv.maxPlayers}`
                : null;

              return (
                <div
                  key={srv.id}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-100">{srv.name}</h4>
                        {srv.isPlaceholder && (
                          <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800/80 text-[10px] text-rose-300 font-bold uppercase">
                            PLACEHOLDER
                          </span>
                        )}
                        {srv.modded ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-[10px] text-amber-300 font-semibold">
                            MODDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-[10px] text-emerald-300 font-semibold">
                            VANILLA
                          </span>
                        )}
                        {srv.crossplay && (
                          <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-[10px] text-cyan-300 font-semibold">
                            CROSSPLAY
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="text-slate-300">{srv.scenario}</span>
                        <span>•</span>
                        <span>{srv.region}</span>
                        {playersText && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {playersText} {t.playersCount}
                            </span>
                          </>
                        )}
                        {statusFeed && isStatusOutdated && (
                          <span className="text-amber-400 text-[10px]">({t.outdatedStatus})</span>
                        )}
                      </div>
                    </div>

                    {/* Copy Address Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyAddress(srv)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition active:scale-95"
                      >
                        {copiedId === srv.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">{t.addressCopied}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span dir="ltr">{srv.address}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Platforms & Notes */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">المنصات:</span>
                      {srv.platforms.map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                        >
                          {p}
                        </span>
                      ))}
                    </div>

                    {srv.notes && (
                      <p className="text-[11px] text-slate-400 italic">{srv.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Community Server JSON Generator Form */}
          <div className="border-t border-slate-800 pt-3">
            <button
              onClick={() => setIsGeneratorOpen(!isGeneratorOpen)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.generateServerJson}</span>
            </button>

            {isGeneratorOpen && (
              <form onSubmit={handleGenerateJson} className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">اسم السيرفر</label>
                    <input
                      type="text"
                      required
                      value={genName}
                      onChange={(e) => setGenName(e.target.value)}
                      placeholder="My Community Reforger Server"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">العنوان والمَنفذ (IP:Port)</label>
                    <input
                      type="text"
                      required
                      value={genAddress}
                      onChange={(e) => setGenAddress(e.target.value)}
                      placeholder="123.45.67.89:2302"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-cyan-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">السيناريو / الطور</label>
                    <input
                      type="text"
                      value={genScenario}
                      onChange={(e) => setGenScenario(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">المنطقة</label>
                    <input
                      type="text"
                      value={genRegion}
                      onChange={(e) => setGenRegion(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={genModded}
                        onChange={(e) => setGenModded(e.target.checked)}
                        className="rounded"
                      />
                      <span>مودد</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={genCrossplay}
                        onChange={(e) => setGenCrossplay(e.target.checked)}
                        className="rounded"
                      />
                      <span>كروس بلاي</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  توليد كود JSON
                </button>

                {generatedJson && (
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] text-slate-400">انسخ هذا الكود لإضافته في src/data/servers.json:</span>
                    <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto select-all" dir="ltr">
                      {generatedJson}
                    </pre>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

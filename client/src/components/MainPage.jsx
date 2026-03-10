import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { List, Map, Plus } from 'lucide-react';
import { CATEGORIES, BITOLA_CENTER, DEFAULT_ZOOM } from '@/constants.js';
import { getReports, upvoteReport } from '@/api.js';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';
import ReportForm  from './ReportForm.jsx';
import ReportsList from './ReportsList.jsx';
import StatusBadge from './StatusBadge.jsx';

function createEmojiIcon(emoji) {
  return L.divIcon({
    html: `<div class="emoji-pin"><span>${emoji}</span></div>`,
    className: '',
    iconSize:    [40, 40],
    iconAnchor:  [20, 40],
    popupAnchor: [0, -42],
  });
}

function MapClickHandler({ onMapClick, enabled }) {
  useMapEvents({
    click(e) {
      if (enabled) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function ReportPopup({ report, onUpvote, upvoted }) {
  const cat        = CATEGORIES.find(c => c.id === report.category) ?? CATEGORIES.at(-1);
  const hasUpvoted = upvoted.includes(report.id);

  return (
    <div className="text-sm">
      {report.photo && (
        <img src={report.photo} alt="" className="w-full h-36 object-cover" loading="lazy" />
      )}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{cat.emoji}</span>
          <span className="font-bold text-foreground text-sm leading-tight">{cat.label}</span>
        </div>

        {report.description && (
          <p className="text-muted-foreground text-xs leading-snug">{report.description}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <StatusBadge status={report.status} />
          <button
            onClick={e => { e.stopPropagation(); onUpvote(report.id); }}
            disabled={hasUpvoted}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all active:scale-95',
              hasUpvoted
                ? 'bg-orange-50 text-orange-400 cursor-default border border-orange-200'
                : 'bg-orange-50 text-orange-500 hover:bg-orange-100 border border-orange-200'
            )}
          >
            👍 {report.upvotes}
          </button>
        </div>

        <p className="text-xs text-muted-foreground border-t border-border pt-1.5">
          {new Date(report.created_at + 'Z').toLocaleDateString('mk-MK', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}

export default function MainPage() {
  const [reports,  setReports]  = useState([]);
  const [sort,     setSort]     = useState('newest');
  const [showForm, setShowForm] = useState(false);
  const [formLoc,  setFormLoc]  = useState(null);
  const [showList, setShowList] = useState(false);
  const [upvoted,  setUpvoted]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('upvoted') || '[]'); } catch { return []; }
  });
  const mapRef = useRef(null);

  const loadReports = useCallback(async () => {
    try { setReports(await getReports(sort)); } catch { /* ignore */ }
  }, [sort]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleMapClick = (coords) => {
    if (showForm) return;
    setFormLoc(coords);
    setShowForm(true);
  };

  const handleFAB = () => {
    setFormLoc(null);
    setShowForm(true);
  };

  const handleSubmitted = async (report) => {
    setShowForm(false);
    setReports(prev => [report, ...prev.filter(r => r.id !== report.id)]);
    mapRef.current?.flyTo([report.lat, report.lng], 16, { duration: 1 });
  };

  const handleUpvote = async (id) => {
    if (upvoted.includes(id)) return;
    try {
      const updated = await upvoteReport(id);
      setReports(prev => prev.map(r => r.id === id ? updated : r));
      const next = [...upvoted, id];
      setUpvoted(next);
      localStorage.setItem('upvoted', JSON.stringify(next));
    } catch { /* ignore */ }
  };

  return (
    <div className="relative h-svh w-full overflow-hidden">

      {/* ── Map ──────────────────────────────────────── */}
      <MapContainer
        center={BITOLA_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full z-0"
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        <MapClickHandler onMapClick={handleMapClick} enabled={!showForm && !showList} />

        {reports.map(report => {
          const cat = CATEGORIES.find(c => c.id === report.category) ?? CATEGORIES.at(-1);
          return (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={createEmojiIcon(cat.emoji)}
            >
              <Popup minWidth={260} maxWidth={280} closeButton>
                <ReportPopup report={report} onUpvote={handleUpvote} upvoted={upvoted} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── Top bar ──────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="pointer-events-auto mx-3 mt-3 bg-background/95 backdrop-blur-md rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-base font-extrabold text-primary leading-none">🏙️ Пријави Битола</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Пријавете комунален проблем</p>
          </div>

          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground px-2">
            <a href="/admin">Админ</a>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowList(v => !v)}
            className="gap-1.5"
          >
            {showList ? <><Map className="h-3.5 w-3.5" /> Карта</> : <><List className="h-3.5 w-3.5" /> Листа</>}
            {!showList && reports.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ml-0.5">
                {reports.length > 99 ? '99+' : reports.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ── FAB ──────────────────────────────────────── */}
      {!showForm && (
        <Button
          onClick={handleFAB}
          size="icon"
          className="absolute bottom-8 right-4 z-20 w-14 h-14 rounded-full shadow-xl shadow-primary/30 text-xl"
          aria-label="Пријави проблем"
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </Button>
      )}

      {/* ── Hint when empty ──────────────────────────── */}
      {!showList && !showForm && reports.length === 0 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow text-xs text-muted-foreground whitespace-nowrap">
            Допри на картата или притисни + за да пријавиш
          </div>
        </div>
      )}

      {/* ── List drawer ──────────────────────────────── */}
      {showList && (
        <div className="absolute inset-0 z-10 bg-background overflow-y-auto" style={{ paddingTop: '72px' }}>
          <ReportsList
            reports={reports}
            sort={sort}
            onSortChange={setSort}
            onUpvote={handleUpvote}
            upvoted={upvoted}
          />
        </div>
      )}

      {/* ── Report form (Sheet) ───────────────────────── */}
      {showForm && (
        <ReportForm
          location={formLoc}
          onSubmit={handleSubmitted}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

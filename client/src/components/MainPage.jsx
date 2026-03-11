import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { CATEGORIES, BITOLA_CENTER, DEFAULT_ZOOM } from '@/constants.js';
import { getReports, upvoteReport } from '@/api.js';
import ReportForm        from './ReportForm.jsx';
import ReportsList       from './ReportsList.jsx';
import ReportDetailSheet from './ReportDetailSheet.jsx';

function createEmojiIcon(emoji) {
  return L.divIcon({
    html: `<div class="emoji-pin"><span>${emoji}</span></div>`,
    className: '',
    iconSize:    [40, 40],
    iconAnchor:  [20, 40],
    popupAnchor: [0, -42],
  });
}

// Allows tapping map background to deselect
function MapTapHandler({ onTap }) {
  useMapEvents({ click: onTap });
  return null;
}

export default function MainPage() {
  const [reports,        setReports]        = useState([]);
  const [sort,           setSort]           = useState('newest');
  const [showForm,       setShowForm]       = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [upvoted,        setUpvoted]        = useState(() => {
    try { return JSON.parse(localStorage.getItem('upvoted') || '[]'); } catch { return []; }
  });
  const mapRef = useRef(null);

  const loadReports = useCallback(async () => {
    try { setReports(await getReports(sort)); } catch { /* ignore */ }
  }, [sort]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleSubmitted = async (report) => {
    setShowForm(false);
    setReports(prev => [report, ...prev.filter(r => r.id !== report.id)]);
    // Fly map to new pin
    mapRef.current?.flyTo([report.lat, report.lng], 17, { duration: 1.2 });
  };

  const handleUpvote = async (id) => {
    if (upvoted.includes(id)) return;
    try {
      const updated = await upvoteReport(id);
      setReports(prev => prev.map(r => r.id === id ? updated : r));
      // Update the open detail sheet too
      if (selectedReport?.id === id) setSelectedReport(updated);
      const next = [...upvoted, id];
      setUpvoted(next);
      localStorage.setItem('upvoted', JSON.stringify(next));
    } catch { /* ignore */ }
  };

  return (
    <div className="h-svh flex flex-col overflow-hidden">

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex-shrink-0 bg-background border-b border-border px-4 h-14 flex items-center gap-3 z-20">
        <div className="flex-1">
          <h1 className="text-base font-extrabold text-primary leading-none">🏙️ Пријави Битола</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
            {reports.length} пријав{reports.length === 1 ? 'а' : 'и'} · Битола
          </p>
        </div>
        <a
          href="/admin"
          className="text-xs text-muted-foreground hover:text-foreground px-3 h-9 flex items-center rounded-xl hover:bg-muted transition-colors"
        >
          Админ
        </a>
      </div>

      {/* ── Map — top ~58% ───────────────────────────── */}
      <div className="flex-shrink-0 relative" style={{ height: '58svh' }}>
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
          <MapTapHandler onTap={() => setSelectedReport(null)} />

          {reports.map(report => {
            const cat = CATEGORIES.find(c => c.id === report.category) ?? CATEGORIES.at(-1);
            return (
              <Marker
                key={report.id}
                position={[report.lat, report.lng]}
                icon={createEmojiIcon(cat.emoji)}
                eventHandlers={{ click: (e) => { e.originalEvent.stopPropagation(); setSelectedReport(report); } }}
              />
            );
          })}
        </MapContainer>

      </div>

      {/* ── Bottom list panel — remaining ~42% ───────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] relative z-10 pt-2">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2 flex-shrink-0" />

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto">
          <ReportsList
            reports={reports}
            sort={sort}
            onSortChange={setSort}
            onSelect={setSelectedReport}
          />
        </div>

        {/* Sticky submit button */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-background">
          <button
            onClick={() => setShowForm(true)}
            className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-bold text-base rounded-2xl transition-all"
          >
            🚨 Пријави проблем
          </button>
        </div>
      </div>

      {/* ── Report detail bottom sheet ────────────────── */}
      <ReportDetailSheet
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpvote={handleUpvote}
        upvoted={upvoted}
      />

      {/* ── Submit form (3-step sheet) ────────────────── */}
      {showForm && (
        <ReportForm
          onSubmit={handleSubmitted}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

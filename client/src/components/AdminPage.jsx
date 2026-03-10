import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { CATEGORIES, STATUSES } from '@/constants.js';
import { getReports, updateStatus, deleteReport } from '@/api.js';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select.jsx';
import { Dialog, DialogContent } from '@/components/ui/dialog.jsx';
import StatusBadge from './StatusBadge.jsx';

const getCat = (id) => CATEGORIES.find(c => c.id === id) ?? CATEGORIES.at(-1);

function formatDate(str) {
  return new Date(str + 'Z').toLocaleString('mk-MK', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminPage() {
  const [reports,    setReports]    = useState([]);
  const [filter,     setFilter]     = useState('all');
  const [catFilter,  setCatFilter]  = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [lightbox,   setLightbox]   = useState(null);

  const load = async () => {
    setLoading(true);
    try { setReports(await getReports('newest')); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await updateStatus(id, status);
      setReports(prev => prev.map(r => r.id === id ? updated : r));
    } catch { alert('Грешка при ажурирање'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Да се избрише оваа пријава?')) return;
    setDeletingId(id);
    try {
      await deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch { alert('Грешка при бришење'); }
    finally { setDeletingId(null); }
  };

  const filtered = reports
    .filter(r => filter    === 'all' || r.status   === filter)
    .filter(r => catFilter === 'all' || r.category === catFilter);

  const counts = Object.fromEntries(
    Object.keys(STATUSES).map(k => [k, reports.filter(r => r.status === k).length])
  );

  return (
    <div className="min-h-screen bg-muted/30">

      {/* ── Header ─────────────────────────────────── */}
      <div className="bg-primary text-primary-foreground shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold leading-none">⚙️ Администрација</h1>
            <p className="text-primary-foreground/70 text-sm mt-0.5">Пријави Битола</p>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <a href="/"><ArrowLeft className="h-4 w-4" /> Картата</a>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-4">

        {/* ── Stats ──────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(STATUSES).map(([key, s]) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? 'all' : key)}
              className={`p-3 rounded-2xl border-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filter === key
                  ? `${s.bg} ${s.border} shadow-md scale-[1.02]`
                  : 'bg-card border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="text-2xl font-extrabold text-foreground">{counts[key] ?? 0}</div>
              <div className={`text-xs font-semibold mt-0.5 ${filter === key ? s.text : 'text-muted-foreground'}`}>
                {s.label}
              </div>
            </button>
          ))}
        </div>

        {/* ── Filters ────────────────────────────────── */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            {/* Status */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Статус</p>
              <div className="flex flex-wrap gap-2">
                {[['all', `Сите (${reports.length})`], ...Object.entries(STATUSES).map(([k, s]) => [k, `${s.label} (${counts[k] ?? 0})`])].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      filter === key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Категорија</p>
              <div className="flex flex-wrap gap-2">
                {[{ id: 'all', emoji: '', label: 'Сите' }, ...CATEGORIES].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCatFilter(catFilter === cat.id ? 'all' : cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      catFilter === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {cat.emoji && `${cat.emoji} `}{cat.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Report list ─────────────────────────────── */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Вчитување...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-2">📭</div>
            <p>Нема пријави за избраните филтри</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(report => {
              const cat = getCat(report.category);
              return (
                <Card key={report.id} className="overflow-hidden">
                  <div className="flex">
                    {/* Photo */}
                    {report.photo && (
                      <button
                        onClick={() => setLightbox(report.photo)}
                        className="w-24 flex-shrink-0 hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={report.photo}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}

                    {/* Content */}
                    <CardContent className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-foreground text-sm">
                              {cat.emoji} {cat.label}
                            </span>
                            <StatusBadge status={report.status} />
                            <Badge variant="secondary" className="font-mono text-xs">
                              #{report.id}
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {formatDate(report.created_at)} · 👍 {report.upvotes}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {parseFloat(report.lat).toFixed(5)}, {parseFloat(report.lng).toFixed(5)}
                          </p>
                        </div>

                        {/* Status selector */}
                        <Select value={report.status} onValueChange={val => handleStatusChange(report.id, val)}>
                          <SelectTrigger className="w-40 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Поднесено</SelectItem>
                            <SelectItem value="in_review">Во преглед</SelectItem>
                            <SelectItem value="resolved">Решено</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {report.description && (
                        <p className="text-sm text-muted-foreground mt-2 leading-snug">
                          {report.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50" asChild>
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${report.lat}&mlon=${report.lng}#map=17/${report.lat}/${report.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" /> Карта
                          </a>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                          disabled={deletingId === report.id}
                          className="text-xs h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                        >
                          {deletingId === report.id
                            ? <><RefreshCw className="h-3 w-3 animate-spin" /> Бришење...</>
                            : <><Trash2 className="h-3 w-3" /> Избриши</>
                          }
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox ───────────────────────────────── */}
      <Dialog open={!!lightbox} onOpenChange={open => !open && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-0">
          {lightbox && (
            <img src={lightbox} alt="" className="w-full max-h-[85vh] object-contain rounded-2xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

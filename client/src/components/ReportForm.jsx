import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { Camera, RefreshCw, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { CATEGORIES, BITOLA_CENTER } from '@/constants.js';
import { submitReport } from '@/api.js';
import { Sheet, SheetContent } from '@/components/ui/sheet.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { cn } from '@/lib/utils.js';

const STEP = { CATEGORY: 0, LOCATION: 1, DETAILS: 2, SUCCESS: 3 };
const STEP_LABELS = ['Категорија', 'Локација', 'Детали'];

// ── Reverse geocode ────────────────────────────────────────────
async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'mk,en' } }
    );
    const data = await res.json();
    const a    = data.address || {};
    return [a.road, a.house_number, a.suburb || a.neighbourhood, a.city || a.town || a.village]
      .filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || null;
  } catch { return null; }
}

// ── Emits map center on every drag end ─────────────────────────
function MapCenterTracker({ onChange }) {
  const map = useMapEvents({
    moveend() { const c = map.getCenter(); onChange({ lat: c.lat, lng: c.lng }); },
  });
  return null;
}

// ── Progress bar ───────────────────────────────────────────────
function Progress({ step }) {
  if (step === STEP.SUCCESS) return null;
  return (
    <div className="flex-shrink-0 flex flex-col items-center gap-2 py-3 px-5">
      <div className="flex items-center gap-1.5">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i < step     ? 'w-6 bg-primary'
            : i === step   ? 'w-10 bg-primary'
            :                'w-6 bg-muted'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground font-medium">
        Чекор {step + 1} од {STEP_LABELS.length} · <span className="text-foreground">{STEP_LABELS[step]}</span>
      </p>
    </div>
  );
}

export default function ReportForm({ onSubmit, onClose }) {
  const [step,        setStep]        = useState(STEP.CATEGORY);
  const [category,    setCategory]    = useState('');
  const [coords,      setCoords]      = useState(null);
  const [address,     setAddress]     = useState(null);
  const [geocoding,   setGeocoding]   = useState(false);
  const [description, setDescription] = useState('');
  const [photo,       setPhoto]       = useState(null);
  const [photoPreview,setPhotoPreview]= useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const fileRef    = useRef(null);
  const locationMapRef = useRef(null);

  const selectedCat = CATEGORIES.find(c => c.id === category);

  // Auto-detect GPS when entering location step
  useEffect(() => {
    if (step !== STEP.LOCATION) return;
    if (coords) return;
    navigator.geolocation?.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => setCoords({ lat: BITOLA_CENTER[0], lng: BITOLA_CENTER[1] }),
      { timeout: 6000, enableHighAccuracy: true }
    );
  }, [step]);

  // Reverse geocode whenever coords change on location step
  useEffect(() => {
    if (!coords || step !== STEP.LOCATION) return;
    setGeocoding(true);
    reverseGeocode(coords.lat, coords.lng).then(label => {
      setAddress(label);
      setGeocoding(false);
    });
  }, [coords]);

  // Invalidate Leaflet map size after sheet animation settles
  useEffect(() => {
    if (step !== STEP.LOCATION) return;
    const t = setTimeout(() => locationMapRef.current?.invalidateSize(), 350);
    return () => clearTimeout(t);
  }, [step]);

  const handleMapCenter = (c) => setCoords(c);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!coords || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('category',    category);
      fd.append('description', description);
      fd.append('lat',         coords.lat);
      fd.append('lng',         coords.lng);
      if (photo) fd.append('photo', photo);
      const report = await submitReport(fd);
      setStep(STEP.SUCCESS);
      setTimeout(() => onSubmit(report), 1500);
    } catch {
      setError('Грешка при поднесување. Обидете се повторно.');
      setSubmitting(false);
    }
  };

  // Sheet height varies by step
  const sheetClass = step === STEP.LOCATION
    ? 'h-[96dvh]'
    : 'max-h-[92dvh]';

  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={step !== STEP.SUCCESS}
        className={cn(sheetClass, 'flex flex-col')}
      >
        <div className="sheet-handle flex-shrink-0" />

        {/* Step header */}
        {step !== STEP.SUCCESS && (
          <div className="flex-shrink-0 flex items-center gap-3 px-5 pb-2">
            {step > STEP.CATEGORY && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="font-bold text-base text-foreground flex-1">
              {step === STEP.CATEGORY && '📍 Избери категорија'}
              {step === STEP.LOCATION && `${selectedCat?.emoji} Потврди локација`}
              {step === STEP.DETAILS  && '📝 Додај детали'}
            </h2>
          </div>
        )}

        {/* ── Step 0: Category grid ───────────────────── */}
        {step === STEP.CATEGORY && (
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setStep(STEP.LOCATION); }}
                  className="flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 active:scale-95 transition-all min-h-[100px]"
                >
                  <span className="text-4xl">{cat.emoji}</span>
                  <span className="text-xs font-semibold text-foreground text-center leading-tight">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Location map ────────────────────── */}
        {step === STEP.LOCATION && (
          <>
            {/* Map fills available space */}
            <div className="flex-1 relative overflow-hidden">
              {coords ? (
                <MapContainer
                  center={[coords.lat, coords.lng]}
                  zoom={16}
                  className="h-full w-full"
                  zoomControl={false}
                  ref={locationMapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    maxZoom={19}
                  />
                  <MapCenterTracker onChange={handleMapCenter} />
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-muted">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Fixed center pin */}
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-10"
                   style={{ paddingBottom: '50%' }}>
                <div className="flex flex-col items-center">
                  <div className="text-4xl drop-shadow-lg filter"
                       style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}>
                    {selectedCat?.emoji}
                  </div>
                  <div className="w-0.5 h-5 bg-gray-800" />
                  <div className="w-2.5 h-2.5 bg-gray-800 rounded-full" />
                  <div className="w-4 h-1 bg-black/20 rounded-full mt-0.5 blur-sm" />
                </div>
              </div>

              {/* Drag hint */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="bg-black/60 text-white text-xs rounded-full px-3 py-1.5 font-medium">
                  Повлечи ја картата за да ја постaвиш локацијата
                </div>
              </div>
            </div>

            {/* Address bar + continue */}
            <div className="flex-shrink-0 px-5 py-4 space-y-3 border-t border-border bg-background">
              <div className="flex items-center gap-2.5 px-3.5 py-3 bg-muted rounded-xl min-h-[48px]">
                {geocoding ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
                <p className="text-sm text-foreground flex-1">
                  {geocoding ? 'Барање адреса...' : address ?? 'Локацијата е зачувана'}
                </p>
              </div>
              <Button
                size="lg"
                className="w-full h-14 text-base gap-2"
                onClick={() => setStep(STEP.DETAILS)}
                disabled={!coords}
              >
                Продолжи <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}

        {/* ── Step 2: Details ─────────────────────────── */}
        {step === STEP.DETAILS && (
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
            {/* Selected category + address recap */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <span className="text-2xl">{selectedCat?.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{selectedCat?.label}</p>
                {address && <p className="text-xs text-muted-foreground truncate">{address}</p>}
              </div>
            </div>

            {/* Photo */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" />
                Фотографија
                <span className="font-normal text-muted-foreground">(необавезно)</span>
              </Label>
              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={photoPreview} alt="" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-black/80 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 py-8 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <span className="text-4xl">📷</span>
                  <span className="text-sm font-medium text-muted-foreground">Допри за додавање фото</span>
                  <span className="text-xs text-muted-foreground/70">Камера или галерија</span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="desc">
                Опис
                <span className="font-normal text-muted-foreground ml-1">(необавезно)</span>
              </Label>
              <Textarea
                id="desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Кратко опишете го проблемот..."
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3.5 py-2.5 rounded-xl">{error}</p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
              className="w-full h-14 text-base shadow-lg shadow-primary/20"
            >
              {submitting
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Поднесување...</>
                : '🚀 Пријави проблем'
              }
            </Button>
          </div>
        )}

        {/* ── Success ─────────────────────────────────── */}
        {step === STEP.SUCCESS && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-5 pb-8">
            <CheckCircle2 className="h-20 w-20 text-green-500 mb-5" />
            <h3 className="text-2xl font-extrabold text-green-700">Успешно пријавено!</h3>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              Вашата пријава е поднесена.<br />Ви благодариме за придонесот кон Битола!
            </p>
          </div>
        )}

        {/* Progress indicator */}
        <Progress step={step} />
      </SheetContent>
    </Sheet>
  );
}

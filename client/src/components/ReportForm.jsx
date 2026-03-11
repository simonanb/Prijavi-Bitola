import { useState, useEffect, useRef } from 'react';
import { MapPin, Camera, MessageSquare, RefreshCw, CheckCircle2 } from 'lucide-react';
import { CATEGORIES } from '@/constants.js';
import { submitReport } from '@/api.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { cn } from '@/lib/utils.js';

const STEP = { CATEGORY: 0, DETAILS: 1, SUCCESS: 2 };

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'mk,en' } }
    );
    const data = await res.json();
    const a = data.address || {};
    // Build a short human-readable label
    const parts = [
      a.road,
      a.house_number,
      a.suburb || a.neighbourhood || a.quarter,
      a.city || a.town || a.village,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : data.display_name?.split(',').slice(0, 2).join(',') || null;
  } catch {
    return null;
  }
}

function useGPS() {
  const [coords,   setCoords]   = useState(null);
  const [address,  setAddress]  = useState(null);
  const [locating, setLocating] = useState(false);

  const detect = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setAddress(null);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        const label = await reverseGeocode(c.lat, c.lng);
        setAddress(label);
        setLocating(false);
      },
      () => { setLocating(false); },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const setCoordsWithGeocode = async (c) => {
    setCoords(c);
    setAddress(null);
    const label = await reverseGeocode(c.lat, c.lng);
    setAddress(label);
  };

  return { coords, setCoords: setCoordsWithGeocode, address, locating, detect };
}

export default function ReportForm({ location, onSubmit, onClose }) {
  const [step,        setStep]        = useState(STEP.CATEGORY);
  const [category,    setCategory]    = useState('');
  const [description, setDescription] = useState('');
  const [photo,       setPhoto]       = useState(null);
  const [photoPreview,setPhotoPreview]= useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const fileRef = useRef(null);
  const { coords, setCoords, address, locating, detect } = useGPS();

  useEffect(() => {
    if (location) setCoords(location);
    else detect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const selectedCat = CATEGORIES.find(c => c.id === category);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" showCloseButton={step !== STEP.SUCCESS}>
        {/* Drag handle */}
        <div className="sheet-handle" />

        <SheetHeader>
          <SheetTitle>
            {step === STEP.CATEGORY && '📍 Избери категорија'}
            {step === STEP.DETAILS  && '📝 Детали за пријавата'}
            {step === STEP.SUCCESS  && ''}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-8 space-y-0">

          {/* ── Step 0: Category grid ─────────────────── */}
          {step === STEP.CATEGORY && (
            <div className="grid grid-cols-2 gap-3 pb-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setStep(STEP.DETAILS); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <span className="text-xs font-semibold text-foreground text-center leading-tight">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── Step 1: Details ───────────────────────── */}
          {step === STEP.DETAILS && (
            <div className="space-y-4">
              {/* Selected category pill */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-primary/5 rounded-xl border border-primary/20">
                <span className="text-xl">{selectedCat?.emoji}</span>
                <span className="text-sm font-semibold text-primary flex-1">{selectedCat?.label}</span>
                <button
                  onClick={() => setStep(STEP.CATEGORY)}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Промени
                </button>
              </div>

              {/* Photo */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  Фотографија
                  <span className="font-normal text-muted-foreground">(необавезно)</span>
                </Label>
                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={photoPreview} alt="Preview" className="w-full h-44 object-cover" />
                    <button
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg leading-none hover:bg-black/80 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
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
                <Label htmlFor="desc" className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Опис
                  <span className="font-normal text-muted-foreground">(необавезно)</span>
                </Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Кратко опишете го проблемот..."
                  rows={3}
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Локација
                </Label>

                {locating ? (
                  <div className="flex items-center gap-2.5 px-3.5 py-3 bg-muted rounded-xl text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Откривање на вашата локација...
                  </div>
                ) : coords ? (
                  <div className="flex items-center gap-2.5 px-3.5 py-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-green-800">Локацијата е зачувана</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {address
                          ? address
                          : <span className="font-mono">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
                        }
                      </p>
                    </div>
                    <button onClick={detect} className="text-xs text-muted-foreground hover:text-foreground underline flex-shrink-0">
                      Освежи
                    </button>
                  </div>
                ) : (
                  <div className="px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <p className="text-xs font-semibold text-amber-800">Не може да се открие локацијата</p>
                    <p className="text-xs text-amber-600">
                      Кликнете на картата пред да ја отворите формата, или дозволете GPS.
                    </p>
                    <button onClick={detect} className="text-xs font-semibold text-amber-700 underline">
                      Обиди се повторно
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3.5 py-2.5 rounded-xl">
                  {error}
                </p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting || !coords}
                size="lg"
                className="w-full shadow-lg shadow-primary/20"
              >
                {submitting ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Поднесување...</>
                ) : (
                  '🚀 Пријави проблем'
                )}
              </Button>
            </div>
          )}

          {/* ── Step 2: Success ───────────────────────── */}
          {step === STEP.SUCCESS && (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-700">Успешно пријавено!</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Вашата пријава е поднесена.<br />Ви благодариме за придонесот!
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

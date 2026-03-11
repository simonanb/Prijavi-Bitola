import { ThumbsUp, Calendar, MapPin } from 'lucide-react';
import { CATEGORIES } from '@/constants.js';
import { Sheet, SheetContent } from '@/components/ui/sheet.jsx';
import { Button } from '@/components/ui/button.jsx';
import StatusBadge from './StatusBadge.jsx';

function formatDate(str) {
  return new Date(str + 'Z').toLocaleDateString('mk-MK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function ReportDetailSheet({ report, onClose, onUpvote, upvoted }) {
  if (!report) return null;

  const cat        = CATEGORIES.find(c => c.id === report.category) ?? CATEGORIES.at(-1);
  const hasUpvoted = upvoted.includes(report.id);

  return (
    <Sheet open={!!report} onOpenChange={open => !open && onClose()}>
      <SheetContent side="bottom" showCloseButton>
        <div className="sheet-handle" />

        <div className="px-5 pb-8 space-y-4">
          {/* Photo */}
          {report.photo && (
            <img
              src={report.photo}
              alt=""
              className="w-full h-52 object-cover rounded-2xl"
              loading="lazy"
            />
          )}

          {/* Category + status */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
              {cat.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-foreground text-base leading-tight">{cat.label}</h2>
              <div className="mt-1">
                <StatusBadge status={report.status} />
              </div>
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <p className="text-muted-foreground leading-relaxed">{report.description}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(report.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {parseFloat(report.lat).toFixed(4)}, {parseFloat(report.lng).toFixed(4)}
            </span>
          </div>

          {/* Upvote */}
          <Button
            size="lg"
            variant={hasUpvoted ? 'secondary' : 'outline'}
            onClick={() => onUpvote(report.id)}
            disabled={hasUpvoted}
            className={`w-full gap-2 h-14 text-base font-bold ${
              hasUpvoted
                ? 'bg-orange-50 text-orange-400 border-orange-200'
                : 'bg-orange-50 text-orange-500 border-orange-200 hover:bg-orange-100'
            }`}
          >
            <ThumbsUp className="h-5 w-5" />
            {hasUpvoted ? 'Гласавте' : 'Поддржи'} · {report.upvotes}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

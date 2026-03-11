import { CATEGORIES } from '@/constants.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import StatusBadge from './StatusBadge.jsx';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr + 'Z')) / 1000);
  if (diff < 60)    return 'Пред малку';
  if (diff < 3600)  return `пред ${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `пред ${Math.floor(diff / 3600)} ч`;
  return `пред ${Math.floor(diff / 86400)} ден${Math.floor(diff / 86400) === 1 ? '' : 'а'}`;
}

const getCat = (id) => CATEGORIES.find(c => c.id === id) ?? CATEGORIES.at(-1);

export default function ReportsList({ reports, sort, onSortChange, onSelect }) {
  return (
    <div>
      {/* Sort tabs — sticky inside the scrollable panel */}
      <div className="px-4 pt-2 pb-2">
        <Tabs value={sort} onValueChange={onSortChange}>
          <TabsList className="w-full">
            <TabsTrigger value="newest"  className="flex-1 text-xs">🕐 Најнови</TabsTrigger>
            <TabsTrigger value="upvotes" className="flex-1 text-xs">👍 Најгласани</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Items */}
      <div className="divide-y divide-border">
        {reports.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground px-6">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="font-semibold text-sm">Нема пријави засега</p>
            <p className="text-xs mt-1">Биди прв и пријави проблем!</p>
          </div>
        ) : (
          reports.map(report => {
            const cat = getCat(report.category);
            return (
              <button
                key={report.id}
                onClick={() => onSelect(report)}
                className="w-full flex gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
              >
                {/* Thumbnail / emoji */}
                {report.photo ? (
                  <img
                    src={report.photo}
                    alt=""
                    loading="lazy"
                    className="w-14 h-14 object-cover rounded-xl flex-shrink-0 bg-muted"
                  />
                ) : (
                  <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {cat.emoji}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground leading-tight">
                      {cat.emoji} {cat.label}
                    </span>
                    <StatusBadge status={report.status} />
                  </div>
                  {report.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {report.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{timeAgo(report.created_at)}</span>
                    <span className="text-xs text-orange-500 font-semibold">👍 {report.upvotes}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

    </div>
  );
}

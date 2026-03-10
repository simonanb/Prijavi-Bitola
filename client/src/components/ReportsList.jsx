import { CATEGORIES } from '@/constants.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Button } from '@/components/ui/button.jsx';
import StatusBadge from './StatusBadge.jsx';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr + 'Z')) / 1000);
  if (diff < 60)    return 'Пред малку';
  if (diff < 3600)  return `пред ${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `пред ${Math.floor(diff / 3600)} ч`;
  return `пред ${Math.floor(diff / 86400)} ден${Math.floor(diff / 86400) === 1 ? '' : 'а'}`;
}

const getCat = (id) => CATEGORIES.find(c => c.id === id) ?? CATEGORIES.at(-1);

export default function ReportsList({ reports, sort, onSortChange, onUpvote, upvoted }) {
  return (
    <div className="pb-24">
      {/* Sort tabs */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-2.5">
        <Tabs value={sort} onValueChange={onSortChange}>
          <TabsList className="w-full">
            <TabsTrigger value="newest"  className="flex-1">🕐 Најнови</TabsTrigger>
            <TabsTrigger value="upvotes" className="flex-1">👍 Најгласани</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Count */}
      {reports.length > 0 && (
        <p className="px-4 py-2 text-xs text-muted-foreground">
          {reports.length} пријав{reports.length === 1 ? 'а' : 'и'}
        </p>
      )}

      {/* Items */}
      <div className="divide-y divide-border">
        {reports.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground px-6">
            <div className="text-5xl mb-3">🗺️</div>
            <p className="font-semibold">Нема пријави засега</p>
            <p className="text-sm mt-1">Биди прв и пријави проблем!</p>
          </div>
        ) : (
          reports.map(report => {
            const cat       = getCat(report.category);
            const hasUpvoted = upvoted.includes(report.id);

            return (
              <div key={report.id} className="flex gap-3 p-4 hover:bg-muted/40 transition-colors">
                {/* Thumbnail */}
                {report.photo ? (
                  <img
                    src={report.photo}
                    alt=""
                    loading="lazy"
                    className="w-16 h-16 object-cover rounded-xl flex-shrink-0 bg-muted"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                    {cat.emoji}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">
                      {cat.emoji} {cat.label}
                    </span>
                    <StatusBadge status={report.status} />
                  </div>

                  {report.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                      {report.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground">{timeAgo(report.created_at)}</span>

                    <Button
                      variant={hasUpvoted ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => onUpvote(report.id)}
                      disabled={hasUpvoted}
                      className={hasUpvoted
                        ? 'text-orange-400 bg-orange-50 border-orange-200 cursor-default h-7 px-2.5 text-xs'
                        : 'text-orange-500 bg-orange-50 border-orange-200 hover:bg-orange-100 h-7 px-2.5 text-xs'
                      }
                    >
                      👍 {report.upvotes}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

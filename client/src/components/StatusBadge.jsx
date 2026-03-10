import { STATUSES } from '@/constants.js';
import { Badge } from '@/components/ui/badge.jsx';

export default function StatusBadge({ status }) {
  const variant = status in STATUSES ? status : 'submitted';
  return (
    <Badge variant={variant} dot>
      {STATUSES[variant]?.label ?? 'Поднесено'}
    </Badge>
  );
}

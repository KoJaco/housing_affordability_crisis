import { Skeleton } from '~/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '~/components/ui/card';

interface SkeletonCardProps {
  showHeader?: boolean;
  lines?: number;
}

export function SkeletonCard({ showHeader = true, lines = 3 }: SkeletonCardProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}


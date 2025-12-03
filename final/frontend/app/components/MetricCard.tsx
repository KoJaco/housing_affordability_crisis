import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '~/lib/utils';

export interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  tooltip,
  className,
}: MetricCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `$${(val / 1000000).toFixed(2)}M`;
      }
      if (val >= 1000) {
        return `$${(val / 1000).toFixed(0)}K`;
      }
      return `$${val.toFixed(0)}`;
    }
    return val;
  };

  const changeColor = change !== undefined
    ? change >= 0
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    : '';

  const changeSign = change !== undefined && change >= 0 ? '+' : '';

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          {change !== undefined && (
            <Badge variant="outline" className={cn('text-xs', changeColor)}>
              {changeSign}{change.toFixed(1)}%
              {changeLabel && ` ${changeLabel}`}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


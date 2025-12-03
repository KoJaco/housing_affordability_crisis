import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { X } from 'lucide-react';

interface HeaderProps {
  selectedSuburbs: string[];
  onRemoveSuburb: (suburb: string) => void;
  onClearAll: () => void;
}

export function Header({ selectedSuburbs, onRemoveSuburb, onClearAll }: HeaderProps) {
  return (
    <header className="border-b bg-white px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-bold text-gray-900">Sydney Property Analysis</h1>
        
        <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end">
          {selectedSuburbs.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                {selectedSuburbs.map((suburb) => (
                  <Badge
                    key={suburb}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <span>{suburb}</span>
                    <button
                      onClick={() => onRemoveSuburb(suburb)}
                      className="ml-1 rounded-full hover:bg-gray-300"
                      aria-label={`Remove ${suburb}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  ({selectedSuburbs.length}/5 selected)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAll}
                  className="h-8"
                >
                  Clear all
                </Button>
              </div>
            </>
          )}
          {selectedSuburbs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Click on suburbs on the map to view analytics
            </p>
          )}
        </div>
      </div>
    </header>
  );
}


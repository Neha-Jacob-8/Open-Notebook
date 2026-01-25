'use client';

/**
 * Add Monitor Dialog Component
 * 
 * Dialog for selecting sources to monitor for updates.
 */

import { useState, useEffect } from 'react';
import { Search, Globe, FileText, Check, Clock, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateMonitor, useMonitors } from '@/lib/hooks/use-monitoring';
import { Checkbox } from '@/components/ui/checkbox';

interface AddMonitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SourceAsset {
  file_path?: string;
  url?: string;
}

interface SourceItem {
  id: string;
  title: string;
  source_type?: string;
  asset_type?: string;
  asset?: SourceAsset;
  url?: string;
}

export function AddMonitorDialog({ open, onOpenChange }: AddMonitorDialogProps) {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [frequency, setFrequency] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  
  const createMonitor = useCreateMonitor();
  const { data: existingMonitors } = useMonitors();

  // Fetch available sources
  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('/api/sources?limit=100')
        .then(res => res.json())
        .then(data => {
          setSources(data || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch sources:', err);
          setLoading(false);
        });
    }
  }, [open]);

  // Filter sources that can be monitored (web sources) and not already monitored
  const monitoredSourceIds = new Set(existingMonitors?.map(m => m.source_id) || []);
  
  const availableSources = sources.filter(source => {
    // Only web-based sources can be monitored (has a URL)
    const sourceUrl = source.asset?.url || source.url;
    const isWebSource = source.source_type === 'url' || 
                        source.asset_type === 'web' ||
                        (sourceUrl && sourceUrl.length > 0);
    
    // Check if already being monitored
    const isAlreadyMonitored = monitoredSourceIds.has(source.id) || 
                               monitoredSourceIds.has(`source:${source.id.split(':')[1]}`);
    
    // Apply search filter
    const matchesSearch = !searchQuery || 
                          source.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sourceUrl?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return isWebSource && !isAlreadyMonitored && matchesSearch;
  });

  const handleToggleSource = (sourceId: string) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(sourceId)) {
      newSelected.delete(sourceId);
    } else {
      newSelected.add(sourceId);
    }
    setSelectedSources(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSources.size === availableSources.length) {
      setSelectedSources(new Set());
    } else {
      setSelectedSources(new Set(availableSources.map(s => s.id)));
    }
  };

  const handleAddMonitors = async () => {
    const sourceIds = Array.from(selectedSources);
    
    for (const sourceId of sourceIds) {
      await createMonitor.mutateAsync({
        source_id: sourceId,
        check_frequency: frequency,
        enabled: true,
      });
    }
    
    setSelectedSources(new Set());
    onOpenChange(false);
  };

  const getSourceIcon = (source: SourceItem) => {
    const hasUrl = source.source_type === 'url' || source.asset?.url || source.url;
    if (hasUrl) {
      return <Globe className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  const getSourceUrl = (source: SourceItem) => {
    return source.asset?.url || source.url || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Add Source Monitors
          </DialogTitle>
          <DialogDescription>
            Select web sources to monitor for changes. You'll be notified when content updates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Frequency */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
              <SelectTrigger className="w-40">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Every hour</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source List */}
          <ScrollArea className="h-[300px] border rounded-md">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="animate-pulse">Loading sources...</div>
              </div>
            ) : availableSources.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No web sources available</p>
                <p className="text-sm mt-1">
                  {sources.length === 0 
                    ? 'Add some web sources to your notebooks first'
                    : 'All web sources are already being monitored'}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {/* Select All Header */}
                <div className="flex items-center gap-3 p-2 border-b mb-2">
                  <Checkbox
                    checked={selectedSources.size === availableSources.length && availableSources.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    Select All ({availableSources.length} sources)
                  </span>
                </div>

                {/* Source Items */}
                {availableSources.map((source) => {
                  const sourceUrl = getSourceUrl(source);
                  return (
                    <div
                      key={source.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedSources.has(source.id)
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleToggleSource(source.id)}
                    >
                      <Checkbox
                        checked={selectedSources.has(source.id)}
                        onCheckedChange={() => handleToggleSource(source.id)}
                      />
                      <div className="flex-shrink-0">
                        {getSourceIcon(source)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{source.title || 'Untitled Source'}</p>
                        {sourceUrl && (
                          <p className="text-xs text-muted-foreground truncate">{sourceUrl}</p>
                        )}
                      </div>
                      {selectedSources.has(source.id) && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedSources.size > 0 ? (
                <span>{selectedSources.size} source{selectedSources.size > 1 ? 's' : ''} selected</span>
              ) : (
                <span>Select sources to monitor</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddMonitors}
                disabled={selectedSources.size === 0 || createMonitor.isPending}
              >
                {createMonitor.isPending ? (
                  <>Adding...</>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Add {selectedSources.size > 0 ? selectedSources.size : ''} Monitor{selectedSources.size > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

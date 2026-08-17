import { ExternalLinkIcon, FileCode2Icon, GitForkIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SourceCreditProps = {
  className?: string;
};

export function SourceCredit({ className }: SourceCreditProps) {
  return (
    <section className={cn('flex flex-col gap-3', className)} aria-labelledby="source-heading">
      <p id="source-heading" className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Source &amp; credit
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline" size="panel" className="min-w-0 justify-start text-left">
          <a href="https://github.com/modery/PowerDocu" target="_blank" rel="noreferrer">
            <GitForkIcon data-icon="inline-start" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">PowerDocu Repo</span>
              <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">
                Original project by Rene Modery.
              </span>
            </span>
            <ExternalLinkIcon data-icon="inline-end" />
          </a>
        </Button>
        <Button asChild variant="outline" size="panel" className="min-w-0 justify-start text-left">
          <a href="https://github.com/Rmorr2001/PowerDocu/tree/codex/browser-adapter-restart" target="_blank" rel="noreferrer">
            <FileCode2Icon data-icon="inline-start" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Browser App Source</span>
              <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">
                React UI in web/ + WebAssembly runtime.
              </span>
              <span className="mt-1 block truncate font-mono text-[10px] font-normal text-muted-foreground">
                codex/browser-adapter-restart
              </span>
            </span>
            <ExternalLinkIcon data-icon="inline-end" />
          </a>
        </Button>
      </div>
    </section>
  );
}

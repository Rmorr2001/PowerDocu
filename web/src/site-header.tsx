import type { ReactNode } from 'react';
import { FileCode2Icon } from 'lucide-react';
import { Link } from 'react-router-dom';

type SiteHeaderProps = {
  actions: ReactNode;
};

export function SiteHeader({ actions }: SiteHeaderProps) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link className="flex items-center gap-3" to="/" aria-label="PowerDocu home">
          <span className="grid size-8 place-items-center rounded-md border border-primary/40 bg-primary/10 text-primary">
            <FileCode2Icon aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">PowerDocu</span>
        </Link>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}

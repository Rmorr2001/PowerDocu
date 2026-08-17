import type { ReactNode } from 'react';
import { FileCode2Icon } from 'lucide-react';
import { Link } from 'react-router-dom';

type SiteHeaderProps = {
  actions: ReactNode;
};

export function SiteHeader({ actions }: SiteHeaderProps) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-5 px-5 py-5">
        <Link className="flex items-center gap-3" to="/" aria-label="PowerDocu home">
          <span className="grid size-10 place-items-center rounded-md border border-primary/40 bg-primary/10 text-primary">
            <FileCode2Icon aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">PowerDocu</span>
        </Link>
        <div className="flex w-40 shrink-0 items-center">{actions}</div>
      </div>
    </header>
  );
}

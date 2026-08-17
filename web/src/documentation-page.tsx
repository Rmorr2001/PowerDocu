import type { LucideIcon } from 'lucide-react';
import {
  AppWindowIcon,
  BookOpenIcon,
  BoxesIcon,
  ChevronRightIcon,
  FileArchiveIcon,
  WorkflowIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SiteHeader } from '@/site-header';

type DocumentationPageKey = 'instructions' | 'msapp' | 'powerdocu' | 'webassembly';

type DocumentationEntry = {
  key: DocumentationPageKey;
  path: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const documentationEntries: DocumentationEntry[] = [
  {
    key: 'instructions',
    path: '/instructions',
    label: 'Instructions',
    eyebrow: 'Start here',
    title: 'Instructions',
    description: 'Hello world. This page will become the short path from an app file to a finished report.',
    icon: BookOpenIcon,
  },
  {
    key: 'msapp',
    path: '/instructions/msapp',
    label: '.msapp files',
    eyebrow: 'File format',
    title: 'How .msapp files work',
    description: 'Hello world. This page will explain the package structure Power Apps exports as an .msapp file.',
    icon: FileArchiveIcon,
  },
  {
    key: 'powerdocu',
    path: '/instructions/powerdocu',
    label: 'PowerDocu',
    eyebrow: 'Document engine',
    title: 'How PowerDocu works',
    description: 'Hello world. This page will trace how PowerDocu reads an app and assembles its technical report.',
    icon: WorkflowIcon,
  },
  {
    key: 'webassembly',
    path: '/instructions/webassembly',
    label: 'WebAssembly app',
    eyebrow: 'Browser runtime',
    title: 'How this WebAssembly app works',
    description: 'Hello world. This page will describe the local .NET, Graphviz, and browser worker pipeline.',
    icon: BoxesIcon,
  },
];

export function DocumentationPage({ page }: { page: DocumentationPageKey }) {
  const location = useLocation();
  const entry = documentationEntries.find((candidate) => candidate.key === page) ?? documentationEntries[0];
  const PageIcon = entry.icon;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader
        actions={(
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <AppWindowIcon data-icon="inline-start" />
              Open app
            </Link>
          </Button>
        )}
      />

      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-10 md:grid-cols-[13rem_minmax(0,1fr)] md:py-14">
        <aside>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Documentation</p>
          <nav className="flex flex-col gap-1" aria-label="Documentation pages">
            {documentationEntries.map((item) => {
              const ItemIcon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button key={item.path} asChild variant={isActive ? 'secondary' : 'ghost'} size="sm" className="justify-start">
                  <Link to={item.path} aria-current={isActive ? 'page' : undefined}>
                    <ItemIcon data-icon="inline-start" />
                    {item.label}
                    <ChevronRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              );
            })}
          </nav>
        </aside>

        <article className="route-enter min-w-0" key={entry.path}>
          <div className="flex items-center gap-3 text-primary">
            <PageIcon aria-hidden="true" />
            <Badge variant="outline">{entry.eyebrow}</Badge>
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{entry.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{entry.description}</p>
          <Separator className="my-10" />
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Page scaffold ready</p>
        </article>
      </div>
    </main>
  );
}

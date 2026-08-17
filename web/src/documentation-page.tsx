import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AppWindowIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BoxesIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CloudOffIcon,
  ExternalLinkIcon,
  FileArchiveIcon,
  ShieldCheckIcon,
  WorkflowIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  facts: Array<{ label: string; value: string }>;
};

const documentationEntries: DocumentationEntry[] = [
  {
    key: 'instructions',
    path: '/instructions',
    label: 'Instructions',
    eyebrow: 'Start here',
    title: 'Generate a complete app report',
    description: 'Export one Canvas App, run PowerDocu locally, and download the full Word or HTML report.',
    icon: BookOpenIcon,
    facts: [
      { label: 'Input', value: 'Standalone .msapp' },
      { label: 'Output', value: 'Word or HTML ZIP' },
      { label: 'Processing', value: 'This browser only' },
    ],
  },
  {
    key: 'msapp',
    path: '/instructions/msapp',
    label: '.msapp files',
    eyebrow: 'File format',
    title: 'How .msapp files work',
    description: 'A Canvas App download is a structured package containing metadata, controls, formulas, references, and assets.',
    icon: FileArchiveIcon,
    facts: [
      { label: 'Container', value: 'Compressed package' },
      { label: 'Source', value: 'Canvas App' },
      { label: 'Browser limit', value: '100 MB input' },
    ],
  },
  {
    key: 'powerdocu',
    path: '/instructions/powerdocu',
    label: 'PowerDocu',
    eyebrow: 'Document engine',
    title: 'How PowerDocu works',
    description: 'The original C# parser turns a Canvas App package into an app model, report content, and navigation diagrams.',
    icon: WorkflowIcon,
    facts: [
      { label: 'Parser', value: 'Original PowerDocu C#' },
      { label: 'Formula analysis', value: 'Microsoft Power Fx' },
      { label: 'Browser scope', value: 'Canvas Apps' },
    ],
  },
  {
    key: 'webassembly',
    path: '/instructions/webassembly',
    label: 'WebAssembly app',
    eyebrow: 'Browser runtime',
    title: 'How this WebAssembly app works',
    description: 'React coordinates a dedicated worker running .NET, Graphviz, PNG rendering, and a temporary virtual filesystem.',
    icon: BoxesIcon,
    facts: [
      { label: 'Runtime', value: '.NET 10 WebAssembly' },
      { label: 'Execution', value: 'Dedicated Web Worker' },
      { label: 'Backend', value: 'None' },
    ],
  },
];

export function DocumentationPage({ page }: { page: DocumentationPageKey }) {
  const location = useLocation();
  const currentIndex = Math.max(0, documentationEntries.findIndex((candidate) => candidate.key === page));
  const entry = documentationEntries[currentIndex];
  const previousEntry = documentationEntries[currentIndex - 1];
  const nextEntry = documentationEntries[currentIndex + 1];
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
        <aside className="md:sticky md:top-8 md:self-start">
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
          <header>
            <div className="flex items-center gap-3 text-primary">
              <PageIcon aria-hidden="true" />
              <Badge variant="outline">{entry.eyebrow}</Badge>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{entry.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{entry.description}</p>
          </header>

          <dl className="mt-10 grid gap-6 sm:grid-cols-3" aria-label="At a glance">
            {entry.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{fact.label}</dt>
                <dd className="mt-2 text-sm font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <Separator className="my-10" />
          <DocumentationContent page={entry.key} />
          <Separator className="my-10" />

          <nav className="flex flex-col justify-between gap-3 sm:flex-row" aria-label="Previous and next documentation pages">
            {previousEntry ? (
              <Button asChild variant="ghost" className="justify-start">
                <Link to={previousEntry.path}>
                  <ArrowLeftIcon data-icon="inline-start" />
                  {previousEntry.label}
                </Link>
              </Button>
            ) : <span />}
            {nextEntry ? (
              <Button asChild variant="outline" className="justify-start">
                <Link to={nextEntry.path}>
                  Next: {nextEntry.label}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/">
                  Open app
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            )}
          </nav>
        </article>
      </div>
    </main>
  );
}

function DocumentationContent({ page }: { page: DocumentationPageKey }) {
  if (page === 'msapp') return <MsappDocumentation />;
  if (page === 'powerdocu') return <PowerDocuDocumentation />;
  if (page === 'webassembly') return <WebAssemblyDocumentation />;
  return <InstructionsDocumentation />;
}

function InstructionsDocumentation() {
  return (
    <div className="flex flex-col gap-12">
      <Alert>
        <ShieldCheckIcon aria-hidden="true" />
        <AlertTitle>Use a standalone Canvas App package</AlertTitle>
        <AlertDescription>
          This browser edition accepts one <code>.msapp</code> up to 100 MB. Power Platform solution ZIPs, Flow ZIPs, and model-driven apps are not supported here yet.
        </AlertDescription>
      </Alert>

      <DocSection index="01" title="Download the Canvas App">
        <p>Open the app in Power Apps Studio, save the version you want to document, and choose <strong>Download a copy</strong>. The downloaded file should end in <code>.msapp</code>.</p>
        <p>Keep the file intact. PowerDocu reads the package directly; you do not need to unzip it or connect this site to your Power Platform environment.</p>
        <ExternalDocLink href="https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/save-publish-app">
          Microsoft: save, publish, and download a Canvas App
        </ExternalDocLink>
      </DocSection>

      <DocSection index="02" title="Generate the report">
        <StepList
          steps={[
            { title: 'Upload', description: 'Choose or drop the .msapp on the first section. A valid file advances the progress rail to Output.' },
            { title: 'Choose Word or HTML', description: 'Word creates a portable .docx report. HTML creates a linked set of pages suitable for local browsing or static hosting.' },
            { title: 'Generate', description: 'Select Generate full report. The rail moves to Logs while the local parser, document builders, and diagram engines run.' },
            { title: 'Confirm completion', description: 'When the log reaches Complete and the archive is ready, the rail advances to Download.' },
          ]}
        />
        <p>The browser always generates the full Canvas App report. There are no depth or section controls on the landing page.</p>
      </DocSection>

      <DocSection index="03" title="Download the result">
        <DefinitionList
          items={[
            { term: 'Complete ZIP', detail: 'The most compatible choice. It preserves the report folder, diagrams, styles, and supporting assets as one download.' },
            { term: 'Complete folder', detail: 'Writes the same output tree into a folder you select. This requires a browser that supports the File System Access API.' },
            { term: 'Word output', detail: 'Includes the .docx report plus SVG and PNG navigation diagrams and any supporting files produced by PowerDocu.' },
            { term: 'HTML output', detail: 'Includes linked HTML pages, local styles, control icons, app assets, and navigation diagrams.' },
          ]}
        />
      </DocSection>

      <DocSection index="04" title="If something stops">
        <DefinitionList
          items={[
            { term: 'Runtime still loading', detail: 'Wait for Runtime ready in the header before generating. The .NET and graph engines load whenever the app route opens and restart after cancellation.' },
            { term: 'File rejected', detail: 'Confirm the file is a non-empty standalone .msapp under 100 MB, not a renamed solution ZIP.' },
            { term: 'Generation failed', detail: 'Read the local log for the failing package entry or parser stage. Replace the file after correcting or re-exporting the app.' },
            { term: 'Cancel generation', detail: 'Cancel terminates the worker, discards that run, and starts a clean local runtime for the next attempt.' },
          ]}
        />
      </DocSection>

      <Alert>
        <CloudOffIcon aria-hidden="true" />
        <AlertTitle>Your app data is not uploaded</AlertTitle>
        <AlertDescription>
          The file moves from the page into a dedicated browser worker and a temporary WebAssembly filesystem. The workspace is deleted after the output ZIP is collected; the report leaves the page only when you download it.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function MsappDocumentation() {
  return (
    <div className="flex flex-col gap-12">
      <DocSection index="01" title="A package, not one source file">
        <p>An <code>.msapp</code> is the downloaded form of a Power Apps Canvas App. It is a compressed package containing the information Power Apps Studio needs to reconstruct the app.</p>
        <p>Modern packages also include readable <code>*.pa.yaml</code> source files under <code>Src/</code>. Microsoft treats those YAML files as source-review material; the internal JSON representation can change between save cycles and should not be treated as a stable source-control format.</p>
        <ExternalDocLink href="https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/power-apps-yaml">
          Microsoft: Canvas App source files and .msapp structure
        </ExternalDocLink>
      </DocSection>

      <DocSection index="02" title="The parts PowerDocu reads">
        <FileTree
          lines={[
            ['Header.json', 'Package and app header metadata'],
            ['Properties.json', 'App identity, dimensions, flags, and properties'],
            ['Resources/PublishInfo.json', 'Published name, colors, icon, and logo reference'],
            ['Controls/*.json', 'Screens, nested controls, rules, and Power Fx formulas'],
            ['References/DataSources.json', 'Connectors and data sources referenced by the app'],
            ['References/Resources.json', 'Images, media, and other app resources'],
            ['Src/*.pa.yaml', 'Readable modern source representation included by Power Apps'],
          ]}
        />
        <p>The current PowerDocu parser uses the package metadata, control JSON, references, and resource bytes. It does not modify the package or write anything back into the app.</p>
      </DocSection>

      <DocSection index="03" title="What is derived from the package">
        <DefinitionList
          items={[
            { term: 'App model', detail: 'App name, ID, layout, visual properties, preview flags, and basic statistics.' },
            { term: 'Control hierarchy', detail: 'Screens, components, containers, controls, child/parent relationships, and control rules.' },
            { term: 'Power Fx behavior', detail: 'Formula parsing identifies global variables, context variables, collections, and Navigate targets.' },
            { term: 'Dependencies', detail: 'Data sources, resources, embedded image bytes, and where variables or collections are used.' },
          ]}
        />
      </DocSection>

      <DocSection index="04" title="Package safety checks">
        <p>The browser validates the archive before the original parser sees it. These limits protect the local worker and virtual filesystem from malformed or unexpectedly large packages.</p>
        <MetricList
          items={[
            { value: '100 MB', label: 'maximum uploaded package' },
            { value: '512 MB', label: 'maximum expanded content' },
            { value: '128 MB', label: 'maximum single entry' },
            { value: '10,000', label: 'maximum package entries' },
            { value: '200:1', label: 'maximum entry compression ratio' },
          ]}
        />
        <p>Absolute paths, drive paths, <code>..</code> traversal, empty path segments, unreadable archives, and duplicate or case-ambiguous paths are rejected.</p>
      </DocSection>

      <Alert>
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>A documentation snapshot, not an ALM package</AlertTitle>
        <AlertDescription>
          Use this app to understand and document a downloaded Canvas App. For source control and application lifecycle management, use Power Platform solutions, native Git integration, and Microsoft’s supported YAML workflows.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function PowerDocuDocumentation() {
  return (
    <div className="flex flex-col gap-12">
      <DocSection index="01" title="Original engine, narrower browser surface">
        <p>PowerDocu is an open-source .NET project by Rene Modery. Its desktop application documents many Power Platform components, including Canvas Apps, Flows, model-driven apps, agents, AI models, and solutions.</p>
        <p>This browser adapter deliberately exposes one proven slice: a standalone Canvas App, a full report, and Word or HTML output. The parser and Canvas document builders are retained from PowerDocu rather than rewritten in JavaScript.</p>
        <ExternalDocLink href="https://github.com/modery/PowerDocu">
          Original PowerDocu repository
        </ExternalDocLink>
      </DocSection>

      <DocSection index="02" title="The document pipeline">
        <ProcessList
          items={[
            { label: 'Validate', detail: 'Inspect the .msapp archive, paths, entry counts, and expanded size.' },
            { label: 'Parse', detail: 'Read app properties, controls, rules, data sources, resources, and embedded assets.' },
            { label: 'Model', detail: 'Build PowerDocu app entities and use the Power Fx syntax tree to identify behavior and navigation.' },
            { label: 'Render', detail: 'Assemble report content, navigation graphs, control icons, and Word or HTML pages.' },
            { label: 'Package', detail: 'Collect the complete AppDoc folder into a safe, relative-path ZIP for download.' },
          ]}
        />
      </DocSection>

      <DocSection index="03" title="What the full report contains">
        <DefinitionList
          items={[
            { term: 'Overview', detail: 'App identity, properties, layout, preview flags, generated timestamp, and screen/control counts.' },
            { term: 'Variables and collections', detail: 'Global and context variables, collections, and the controls and properties where they are referenced.' },
            { term: 'Data and resources', detail: 'Non-auxiliary data sources, connectors, local files, images, and other resources packaged with the app.' },
            { term: 'Screens and controls', detail: 'Screen summaries, nested control hierarchy, detailed control properties, rules, and formulas.' },
            { term: 'Navigation', detail: 'A graph derived from Navigate calls, supplied as SVG and PNG.' },
          ]}
        />
      </DocSection>

      <DocSection index="04" title="Diagrams and assets">
        <p>PowerDocu derives screen-to-screen relationships from the Power Fx formulas attached to controls. The browser renderer turns those relationships into Graphviz DOT, then creates both an SVG diagram and a PNG rendition.</p>
        <p>Control icons are generated as SVG. Supported app-logo bytes are preserved in the output. Word embeds browser-generated diagram media; HTML links the generated assets from the local report tree.</p>
      </DocSection>

      <DocSection index="05" title="Output layout">
        <FileTree
          lines={[
            ['AppDoc <App name>/', 'One generated folder for the selected app'],
            ['*.docx or *.html', 'The selected full report format'],
            ['ScreenNavigation.svg', 'Scalable navigation diagram'],
            ['ScreenNavigation.png', 'Raster navigation diagram'],
            ['resources/', 'Control icons, app media, and document assets'],
            ['supporting pages/styles', 'Additional files produced by the selected builder'],
          ]}
        />
        <p>The download ZIP is only a transport wrapper. Extracting it restores the relative folder tree produced by PowerDocu.</p>
      </DocSection>
    </div>
  );
}

function WebAssemblyDocumentation() {
  return (
    <div className="flex flex-col gap-12">
      <Alert>
        <CloudOffIcon aria-hidden="true" />
        <AlertTitle>A static app with no generation backend</AlertTitle>
        <AlertDescription>
          The host serves the React bundle, .NET runtime, assemblies, and local graph engines. Your <code>.msapp</code> is not posted to an API, serverless function, storage bucket, or Power Platform connection.
        </AlertDescription>
      </Alert>

      <DocSection index="01" title="Runtime startup">
        <ProcessList
          items={[
            { label: 'Page', detail: 'React renders the workflow and starts a module Web Worker.' },
            { label: 'Worker', detail: 'The worker loads the .NET WebAssembly runtime, Viz.js Graphviz, resvg WebAssembly, and the local document font in parallel.' },
            { label: 'Interop', detail: '.NET exports the BrowserFacade; JavaScript supplies event, Graphviz SVG, and SVG-to-PNG functions.' },
            { label: 'Ready', detail: 'The worker reports its .NET and Graphviz versions, enabling generation on the page.' },
          ]}
        />
      </DocSection>

      <DocSection index="02" title="One generation request">
        <ProcessList
          items={[
            { label: 'Transfer', detail: 'The page reads the file as an ArrayBuffer and transfers ownership to the worker.' },
            { label: 'Workspace', detail: '.NET writes the bytes to a unique temporary directory inside WebAssembly’s virtual System.IO filesystem.' },
            { label: 'Generate', detail: 'The archive guard, original AppParser, document content, builders, and asset renderers run inside the worker.' },
            { label: 'Return', detail: 'The generated folder is zipped, transferred back to React, and kept in page memory until download.' },
            { label: 'Dispose', detail: 'The temporary workspace is deleted after its files have been collected.' },
          ]}
        />
      </DocSection>

      <DocSection index="03" title="Why a Web Worker">
        <p>The retained C# parser and document builders are synchronous. Running them on the main browser thread would block scrolling, input, progress updates, and repainting.</p>
        <DefinitionList
          items={[
            { term: 'Responsive UI', detail: 'React stays on the main thread while parsing and document generation use the worker.' },
            { term: 'Progress messages', detail: '.NET notifications cross the JavaScript boundary as phase, status, and log events.' },
            { term: 'Hard cancellation', detail: 'Cancel terminates the entire worker, rejects the pending request, and boots a new clean runtime.' },
            { term: 'Fault isolation', detail: 'A failed package does not leave the next run inside a partially used virtual workspace.' },
          ]}
        />
      </DocSection>

      <DocSection index="04" title="Local Graphviz and PNG rendering">
        <p>The desktop project uses native Graphviz bindings, which cannot run directly in browser WebAssembly. The adapter keeps PowerDocu’s graph boundary and supplies browser-native implementations.</p>
        <DefinitionList
          items={[
            { term: 'Viz.js', detail: 'Runs Graphviz locally and renders DOT into SVG with the dot layout engine.' },
            { term: 'resvg-wasm', detail: 'Rasterizes the SVG into a white-background PNG and scales the largest dimension down to 2,400 px when needed.' },
            { term: 'Size guards', detail: 'DOT input is limited to 5 MB and rendered SVG to 20 MB before rasterization.' },
            { term: 'No graph service', detail: 'Diagram descriptions and rendered images never need to leave the worker.' },
          ]}
        />
      </DocSection>

      <DocSection index="05" title="Where the implementation lives">
        <FileTree
          lines={[
            ['web/src/App.tsx', 'React workflow, progress state, downloads, and folder export'],
            ['web/src/worker-client.ts', 'Typed worker lifecycle, requests, cancellation, and recovery'],
            ['web/src/powerdocu.worker.ts', '.NET startup, Graphviz, resvg, and JavaScript interop'],
            ['PowerDocu.Web.Runtime/', '.NET BrowserFacade exported to JavaScript'],
            ['PowerDocu.Web.Adapters/', 'Archive guard, workspace, options, renderers, and ZIP collection'],
            ['PowerDocu.AppDocumenter/', 'Retained Canvas report content and Word/HTML builders'],
            ['modules/PowerDocu.Common/', 'Retained parser, entities, Power Fx analysis, and shared helpers'],
          ]}
        />
        <ExternalDocLink href="https://github.com/Rmorr2001/PowerDocu/tree/codex/browser-adapter-restart">
          Browse the browser-adapter source branch
        </ExternalDocLink>
      </DocSection>

      <DocSection index="06" title="Current boundaries">
        <MetricList
          items={[
            { value: '.msapp', label: 'standalone Canvas input only' },
            { value: 'Word + HTML', label: 'browser output formats' },
            { value: '100 MB', label: 'maximum input size' },
            { value: 'Session', label: 'state is discarded on reload or close' },
          ]}
        />
        <p>Generation speed and available memory depend on the user’s device. Direct folder export is browser-dependent; ZIP download is the portable fallback.</p>
      </DocSection>
    </div>
  );
}

function DocSection({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`doc-section-${index}`}>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-primary">{index}</span>
        <h2 id={`doc-section-${index}`} className="text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="mt-5 flex max-w-3xl flex-col gap-5 text-[15px] leading-7 text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.88em] [&_code]:text-foreground [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function StepList({ steps }: { steps: Array<{ title: string; description: string }> }) {
  return (
    <ol className="flex flex-col gap-5">
      {steps.map((step, index) => (
        <li key={step.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
          <span className="grid size-8 place-items-center rounded-full bg-primary/10 font-mono text-xs text-primary">{String(index + 1).padStart(2, '0')}</span>
          <div>
            <h3 className="font-medium text-foreground">{step.title}</h3>
            <p className="mt-1">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DefinitionList({ items }: { items: Array<{ term: string; detail: string }> }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.term}>
          <dt className="text-sm font-medium text-foreground">{item.term}</dt>
          <dd className="mt-1">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function MetricList({ items }: { items: Array<{ value: string; label: string }> }) {
  return (
    <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={`${item.value}-${item.label}`}>
          <dt className="font-mono text-lg font-medium text-primary">{item.value}</dt>
          <dd className="mt-1 text-sm">{item.label}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProcessList({ items }: { items: Array<{ label: string; detail: string }> }) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((item, index) => (
        <li key={item.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4">
          <div className="flex items-center gap-2 font-mono text-xs text-primary">
            <span>{String(index + 1).padStart(2, '0')}</span>
            <ChevronRightIcon aria-hidden="true" />
          </div>
          <p><strong>{item.label}.</strong> {item.detail}</p>
        </li>
      ))}
    </ol>
  );
}

function FileTree({ lines }: { lines: Array<[string, string]> }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-black/30 font-mono text-xs">
      {lines.map(([path, detail]) => (
        <div key={path} className="grid gap-1 px-4 py-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-5">
          <span className="break-all text-primary">{path}</span>
          <span className="font-sans leading-5 text-muted-foreground">{detail}</span>
        </div>
      ))}
    </div>
  );
}

function ExternalDocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button asChild variant="outline" className="self-start">
      <a href={href} target="_blank" rel="noreferrer">
        {children}
        <ExternalLinkIcon data-icon="inline-end" />
      </a>
    </Button>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { unzipSync } from 'fflate';
import {
  BookOpenIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileArchiveIcon,
  FileCode2Icon,
  FileTextIcon,
  FolderDownIcon,
  Globe2Icon,
  RotateCcwIcon,
  SquareIcon,
  UploadCloudIcon,
  XCircleIcon,
} from 'lucide-react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DocumentationPage } from '@/documentation-page';
import { formatBytes, formatDuration } from '@/format';
import { SiteHeader } from '@/site-header';
import { SourceCredit } from '@/source-credit';
import {
  PowerDocuWorkerClient,
  type GenerationOptions,
  type RuntimeState,
  type WorkerEvent,
} from '@/worker-client';

const MAX_INPUT_BYTES = 100 * 1024 * 1024;

type LogEntry = WorkerEvent & { id: number; time: string };
type OutputFormat = GenerationOptions['outputFormat'];

type BrowserDirectoryHandle = {
  getDirectoryHandle(name: string, options: { create: true }): Promise<BrowserDirectoryHandle>;
  getFileHandle(name: string, options: { create: true }): Promise<BrowserFileHandle>;
};

type BrowserFileHandle = {
  createWritable(): Promise<BrowserWritableFileStream>;
};

type BrowserWritableFileStream = {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
};

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<BrowserDirectoryHandle>;
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkflowPage />} />
        <Route path="/instructions" element={<DocumentationPage page="instructions" />} />
        <Route path="/instructions/msapp" element={<DocumentationPage page="msapp" />} />
        <Route path="/instructions/powerdocu" element={<DocumentationPage page="powerdocu" />} />
        <Route path="/instructions/webassembly" element={<DocumentationPage page="webassembly" />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function WorkflowPage() {
  const [runtime, setRuntime] = useState<RuntimeState>({ status: 'starting' });
  const [runtimeStartedAt, setRuntimeStartedAt] = useState<number | null>(null);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('word');
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingFolder, setIsSavingFolder] = useState(false);
  const [phase, setPhase] = useState('Idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [archive, setArchive] = useState<Uint8Array | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const clientRef = useRef<PowerDocuWorkerClient | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const logSequence = useRef(0);

  const updateRuntime = useCallback((next: RuntimeState) => {
    setRuntime(next);
    if (next.status === 'ready') {
      setRuntimeStartedAt(Date.now());
      setUptimeSeconds(0);
    } else {
      setRuntimeStartedAt(null);
      setUptimeSeconds(0);
    }
  }, []);

  const addLog = useCallback((event: WorkerEvent) => {
    setLogs((current) => [
      ...current.slice(-99),
      {
        ...event,
        id: ++logSequence.current,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      },
    ]);
    if (event.kind === 'phase' || event.kind === 'status') setPhase(event.message);
  }, []);

  useEffect(() => {
    const client = new PowerDocuWorkerClient(updateRuntime, addLog);
    clientRef.current = client;
    return () => {
      client.dispose();
      clientRef.current = null;
    };
  }, [addLog, updateRuntime]);

  useEffect(() => {
    if (runtimeStartedAt === null) return;
    const updateUptime = () => setUptimeSeconds(Math.floor((Date.now() - runtimeStartedAt) / 1000));
    updateUptime();
    const interval = window.setInterval(updateUptime, 1000);
    return () => window.clearInterval(interval);
  }, [runtimeStartedAt]);

  const selectFile = useCallback((candidate: File | null) => {
    setArchive(null);
    setElapsed(null);
    setGenerationError(null);
    if (!candidate) {
      setFile(null);
      setFileError(null);
      setPhase('Idle');
      return;
    }
    if (!candidate.name.toLowerCase().endsWith('.msapp')) {
      setFile(null);
      setFileError('Choose a .msapp file.');
      return;
    }
    if (candidate.size === 0 || candidate.size > MAX_INPUT_BYTES) {
      setFile(null);
      setFileError('File must be 1 B–100 MB.');
      return;
    }
    setFile(candidate);
    setFileError(null);
    setPhase('Ready');
    setLogs([]);
  }, []);

  async function generate() {
    if (!file || !clientRef.current || runtime.status !== 'ready') return;
    setIsGenerating(true);
    setArchive(null);
    setElapsed(null);
    setGenerationError(null);
    setLogs([]);
    setPhase('Reading package');
    const startedAt = performance.now();

    const options: GenerationOptions = {
      outputFormat,
      fullDocumentation: true,
      changesOnly: true,
      includeDefaultValues: true,
      includeSampleData: false,
    };

    try {
      const result = await clientRef.current.generate(file, options);
      setArchive(result);
      setElapsed(performance.now() - startedAt);
      setPhase('Archive ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message !== 'Generation cancelled.') {
        setGenerationError(message);
        setPhase('Generation failed');
      }
    } finally {
      setIsGenerating(false);
    }
  }

  function cancel() {
    clientRef.current?.cancel();
    setIsGenerating(false);
    setPhase('Cancelled — runtime restarted');
    addLog({ kind: 'log', message: 'Generation cancelled.' });
  }

  function download() {
    if (!archive || !file) return;
    const blob = new Blob([archive.slice().buffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${file.name.replace(/\.msapp$/i, '')}-powerdocu-${outputFormat}.zip`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function saveFolder() {
    if (!archive) return;
    const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
    if (!picker) {
      setGenerationError('Folder export is unavailable in this browser.');
      return;
    }

    setIsSavingFolder(true);
    setGenerationError(null);
    try {
      const root = await picker.call(window);
      const entries = unzipSync(archive);
      for (const [path, contents] of Object.entries(entries)) {
        await writeFolderEntry(root, path, contents);
      }
      setPhase('Folder saved');
      addLog({ kind: 'log', message: 'Complete output saved to folder.' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setGenerationError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingFolder(false);
    }
  }

  const runtimeReady = runtime.status === 'ready';
  const canGenerate = Boolean(file) && runtimeReady && !isGenerating;
  const folderExportAvailable = 'showDirectoryPicker' in window;

  function openFilePicker() {
    if (!inputRef.current) return;
    inputRef.current.value = '';
    inputRef.current.click();
  }

  function selectOutputFormat(value: OutputFormat) {
    setOutputFormat(value);
    setArchive(null);
    setElapsed(null);
    setGenerationError(null);
    setPhase(file ? 'Ready' : 'Idle');
  }

  const outputLabel = outputFormat === 'word' ? 'Word' : 'HTML';

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader
        actions={(
          <Button asChild variant="ghost" size="nav" className="w-full justify-start">
            <Link to="/instructions">
              <BookOpenIcon data-icon="inline-start" />
              Instructions
            </Link>
          </Button>
        )}
      />
      <h1 className="sr-only">PowerDocu browser report generator</h1>

      <div className="mx-auto flex max-w-5xl flex-col px-5">
        <section
          className="workflow-section py-9"
          data-workflow="upload"
          aria-labelledby="upload-heading"
        >
          <SectionHeading id="upload-heading" index="01" title="Upload & preview" />
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept=".msapp,application/zip"
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="group mt-5 flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 text-center outline-none transition-colors hover:border-primary/60 hover:bg-primary/5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/10"
            data-dragging={isDragging}
            onClick={openFilePicker}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              if (event.currentTarget === event.target) setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              selectFile(event.dataTransfer.files[0] ?? null);
            }}
          >
            {file ? (
              <>
                <FileArchiveIcon className="text-primary" aria-hidden="true" />
                <span className="max-w-full truncate text-sm font-medium" title={file.name}>{file.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{formatBytes(file.size)}</span>
              </>
            ) : (
              <>
                <UploadCloudIcon className="text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Choose or drop .msapp</span>
              </>
            )}
          </button>
          {fileError && <p className="mt-3 text-sm text-destructive">{fileError}</p>}
          {file && !isGenerating && (
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="ghost" onClick={openFilePicker}>
                <RotateCcwIcon data-icon="inline-start" />
                Replace file
              </Button>
            </div>
          )}
        </section>

        <Separator />

        <section
          className="workflow-section py-9"
          data-workflow="output"
          aria-labelledby="output-heading"
        >
          <SectionHeading id="output-heading" index="02" title="Output" />
          <Field className="mt-5">
            <ToggleGroup
              type="single"
              variant="outline"
              size="lg"
              spacing={0}
              value={outputFormat}
              disabled={isGenerating}
              onValueChange={(value) => {
                if (value === 'word' || value === 'html') selectOutputFormat(value);
              }}
              className="w-full"
              aria-label="Report output format"
            >
              <ToggleGroupItem value="word" className="flex-1" aria-label="Word document">
                <FileTextIcon data-icon="inline-start" />
                Word document
              </ToggleGroupItem>
              <ToggleGroupItem value="html" className="flex-1" aria-label="HTML report">
                <Globe2Icon data-icon="inline-start" />
                HTML report
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <div className="mt-4 flex flex-col gap-2">
            {isGenerating ? (
              <Button variant="destructive" size="lg" onClick={cancel}>
                <SquareIcon data-icon="inline-start" />
                Cancel generation
              </Button>
            ) : (
              <Button size="lg" disabled={!canGenerate} onClick={generate}>
                <FileCode2Icon data-icon="inline-start" />
                Generate full report
              </Button>
            )}
          </div>
        </section>

        <Separator />

        <section
          className="workflow-section py-9"
          data-workflow="logs"
          aria-labelledby="logs-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading id="logs-heading" index="03" title="Logs & uptime" />
            <Badge variant="outline" className="font-mono">
              UP {formatDuration(uptimeSeconds)}
            </Badge>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">{phase}</h2>
            {isGenerating && <Spinner className="text-primary" />}
            {archive && <CheckCircle2Icon className="text-primary" aria-label="Complete" />}
            {generationError && <XCircleIcon className="text-destructive" aria-label="Failed" />}
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-black/40">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Local log</span>
              <span className="font-mono text-[11px] text-muted-foreground">{logs.length}</span>
            </div>
            <ScrollArea className="h-64">
              <div className="flex min-h-64 flex-col gap-2 p-4 font-mono text-xs leading-relaxed">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">Waiting.</p>
                ) : (
                  logs.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-2">
                      <span className="text-muted-foreground">{entry.time}</span>
                      <span className={entry.kind === 'phase' ? 'text-primary' : 'break-words text-foreground/80'}>{entry.message}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          {generationError && (
            <p role="alert" className="mt-3 text-sm text-destructive">{generationError}</p>
          )}
        </section>

        <Separator />

        <section
          className="workflow-section py-9"
          data-workflow="download"
          aria-labelledby="download-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading id="download-heading" index="04" title="Download" />
            {archive && <Badge variant="outline">{formatBytes(archive.byteLength)} · {elapsed === null ? 'Ready' : `${(elapsed / 1000).toFixed(2)} s`}</Badge>}
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <Button size="lg" disabled={!archive} onClick={download}>
              <DownloadIcon data-icon="inline-start" />
              Download complete {outputLabel} ZIP
            </Button>
            <Button
              variant="outline"
              size="lg"
              disabled={!archive || !folderExportAvailable || isSavingFolder}
              onClick={saveFolder}
              title={folderExportAvailable ? undefined : 'Folder export is unavailable in this browser.'}
            >
              {isSavingFolder ? <Spinner data-icon="inline-start" /> : <FolderDownIcon data-icon="inline-start" />}
              Save complete {outputLabel} folder
            </Button>
          </div>
        </section>

        <Separator />
        <SourceCredit className="py-8" />
      </div>
    </main>
  );
}

function SectionHeading({ id, index, title }: { id: string; index: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-3xl font-medium leading-none tracking-tighter text-primary sm:text-4xl">{index}</span>
      <h2 id={id} className="text-xl font-medium tracking-tight">{title}</h2>
    </div>
  );
}

async function writeFolderEntry(root: BrowserDirectoryHandle, path: string, contents: Uint8Array) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return;

  let directory = root;
  const directoryParts = path.endsWith('/') ? parts : parts.slice(0, -1);
  for (const part of directoryParts) {
    directory = await directory.getDirectoryHandle(part, { create: true });
  }
  if (path.endsWith('/')) return;

  const fileHandle = await directory.getFileHandle(parts.at(-1)!, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(new Blob([contents.slice().buffer]));
  await writable.close();
}

import { initWasm, Resvg } from '@resvg/resvg-wasm';
import resvgWasmUrl from '@resvg/resvg-wasm/index_bg.wasm?url';
import geistFontUrl from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import { instance, type Viz } from '@viz-js/viz';

type BrowserFacade = {
  GetRuntimeInfo(): string;
  GenerateArchive(packageBytes: Uint8Array, fileName: string, optionsJson: string): Uint8Array;
};

type DotnetRuntime = {
  setModuleImports(moduleName: string, imports: Record<string, (...args: never[]) => unknown>): void;
  getConfig(): { mainAssemblyName: string };
  getAssemblyExports(assemblyName: string): Promise<{
    PowerDocu: { Web: { Runtime: { BrowserFacade: BrowserFacade } } };
  }>;
};

type DotnetApi = {
  dotnet: {
    withDiagnosticTracing(enabled: boolean): DotnetApi['dotnet'];
    withConfig(config: { loadAllSatelliteResources: boolean }): DotnetApi['dotnet'];
    create(): Promise<DotnetRuntime>;
  };
};

type GenerateMessage = {
  type: 'generate';
  requestId: string;
  packageBytes: ArrayBuffer;
  fileName: string;
  options: unknown;
};

let facade: BrowserFacade;
let graphviz: Viz;
let documentFont: Uint8Array;

function postEvent(kind: string, message: string) {
  self.postMessage({ type: 'event', kind, message });
}

function renderGraphvizSvg(dot: string): string {
  if (dot.length > 5 * 1024 * 1024) {
    throw new Error('The diagram description exceeds the 5 MB browser limit.');
  }
  return graphviz.renderString(dot, { format: 'svg', engine: 'dot' });
}

function rasterizeSvgToPngBase64(svg: string): string {
  if (svg.length > 20 * 1024 * 1024) {
    throw new Error('The rendered diagram exceeds the 20 MB browser limit.');
  }

  const font = {
    fontBuffers: [documentFont],
    defaultFontFamily: 'Geist',
    sansSerifFamily: 'Geist',
  };
  let renderer = new Resvg(svg, { background: '#ffffff', font });
  const largestDimension = Math.max(renderer.width, renderer.height);
  if (largestDimension > 2400) {
    renderer.free();
    renderer = new Resvg(svg, {
      background: '#ffffff',
      fitTo: { mode: 'zoom', value: 2400 / largestDimension },
      font,
    });
  }

  const image = renderer.render();
  try {
    return bytesToBase64(image.asPng());
  } finally {
    image.free();
    renderer.free();
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function start() {
  try {
    const dotnetModuleUrl = runtimeAssetUrl('engine', '_framework', 'dotnet.js');
    const dotnetModulePromise = import(
      /* @vite-ignore */ dotnetModuleUrl
    ) as Promise<DotnetApi>;
    const [dotnetModule, viz, resvgResponse, fontResponse] = await Promise.all([
      dotnetModulePromise,
      instance(),
      fetch(resvgWasmUrl),
      fetch(geistFontUrl),
    ]);
    if (!resvgResponse.ok) throw new Error('The local PNG engine could not be loaded.');
    if (!fontResponse.ok) throw new Error('The local document font could not be loaded.');

    await initWasm(resvgResponse);
    graphviz = viz;
    documentFont = new Uint8Array(await fontResponse.arrayBuffer());

    const runtime = await dotnetModule.dotnet
      .withDiagnosticTracing(false)
      .withConfig({ loadAllSatelliteResources: true })
      .create();
    runtime.setModuleImports('powerdocu-worker', {
      postEvent,
      renderGraphvizSvg,
      rasterizeSvgToPngBase64,
    });
    const config = runtime.getConfig();
    const exports = await runtime.getAssemblyExports(config.mainAssemblyName);
    facade = exports.PowerDocu.Web.Runtime.BrowserFacade;
    self.postMessage({
      type: 'ready',
      runtimeInfo: `${facade.GetRuntimeInfo()} | Graphviz ${graphviz.graphvizVersion}`,
    });
  } catch (error) {
    self.postMessage({ type: 'startup-error', error: formatError(error) });
  }
}

function runtimeAssetUrl(...segments: string[]): string {
  return new URL(segments.join('/'), `${self.location.origin}/`).href;
}

self.addEventListener('message', (event: MessageEvent<GenerateMessage>) => {
  if (event.data?.type !== 'generate') return;
  const { requestId, packageBytes, fileName, options } = event.data;
  try {
    const archive = facade.GenerateArchive(
      new Uint8Array(packageBytes),
      fileName,
      JSON.stringify(options),
    );
    const transferable = Uint8Array.from(archive).buffer;
    self.postMessage({ type: 'result', requestId, archive: transferable }, [transferable]);
  } catch (error) {
    self.postMessage({ type: 'failure', requestId, error: formatError(error) });
  }
});

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message || String(error);
  return String(error);
}

await start();

import { dotnet } from './_framework/dotnet.js';

let facade;

function postEvent(kind, message) {
  self.postMessage({ type: 'event', kind, message });
}

async function start() {
  try {
    const runtime = await dotnet
      .withDiagnosticTracing(false)
      .withConfig({ loadAllSatelliteResources: true })
      .create();
    runtime.setModuleImports('powerdocu-worker', { postEvent });
    const config = runtime.getConfig();
    const exports = await runtime.getAssemblyExports(config.mainAssemblyName);
    facade = exports.PowerDocu.Web.Runtime.BrowserFacade;
    self.postMessage({ type: 'ready', runtimeInfo: facade.GetRuntimeInfo() });
  } catch (error) {
    self.postMessage({ type: 'startup-error', error: formatError(error) });
  }
}

self.addEventListener('message', async (event) => {
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

function formatError(error) {
  if (error instanceof Error) return error.message || String(error);
  return String(error);
}

await start();

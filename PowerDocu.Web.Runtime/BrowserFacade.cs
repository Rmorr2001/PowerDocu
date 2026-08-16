using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;
using PowerDocu.Common;
using PowerDocu.Web.Adapters;

namespace PowerDocu.Web.Runtime;

[SupportedOSPlatform("browser")]
public static partial class BrowserFacade
{
    private static readonly BrowserGenerationService Service = new();

    static BrowserFacade()
    {
        NotificationHelper.AddNotificationReceiver(new WorkerNotificationReceiver());
    }

    [JSExport]
    public static string GetRuntimeInfo() =>
        $"PowerDocu Web | .NET {Environment.Version} | browser={OperatingSystem.IsBrowser()}";

    [JSExport]
    public static byte[] GenerateArchive(byte[] packageBytes, string fileName, string optionsJson)
    {
        try
        {
            BrowserInterop.PostEvent("phase", "Validating package");
            byte[] result = Service.GenerateArchive(packageBytes, fileName, optionsJson);
            BrowserInterop.PostEvent("phase", "Complete");
            return result;
        }
        catch (Exception exception)
        {
            BrowserInterop.PostEvent("log", exception.ToString());
            throw;
        }
    }

    private sealed class WorkerNotificationReceiver : NotificationReceiverBase
    {
        public override void Notify(string notification) => BrowserInterop.PostEvent("log", notification);
        public override void NotifyStatus(string notification) => BrowserInterop.PostEvent("status", notification);
        public override void NotifyPhase(string notification) => BrowserInterop.PostEvent("phase", notification);
    }
}

[SupportedOSPlatform("browser")]
internal static partial class BrowserInterop
{
    [JSImport("postEvent", "powerdocu-worker")]
    internal static partial void PostEvent(string kind, string message);
}

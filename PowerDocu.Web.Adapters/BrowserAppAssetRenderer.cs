using PowerDocu.AppDocumenter;
using PowerDocu.Common;

namespace PowerDocu.Web.Adapters;

public sealed class BrowserAppAssetRenderer : IAppAssetRenderer
{
    private static readonly HashSet<string> BrowserImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"
    };

    public string GetControlIconFileName(string controlType) =>
        CharsetHelper.GetSafeName(controlType) + ".svg";

    public void SaveControlIcon(string controlType, string resourcesFolder)
    {
        Directory.CreateDirectory(resourcesFolder);
        File.WriteAllText(
            Path.Combine(resourcesFolder, GetControlIconFileName(controlType)),
            AppControlIcons.GetControlIcon(controlType));
    }

    public string SaveAppLogo(
        string sourceFileName,
        Stream source,
        string resourcesFolder,
        string backgroundColour,
        int maximumWidth)
    {
        Directory.CreateDirectory(resourcesFolder);
        string extension = Path.GetExtension(sourceFileName);
        if (!BrowserImageExtensions.Contains(extension)) extension = ".bin";
        string outputFileName = "applogo" + extension.ToLowerInvariant();
        source.Position = 0;
        using Stream destination = File.Create(Path.Combine(resourcesFolder, outputFileName));
        source.CopyTo(destination);
        source.Position = 0;
        return outputFileName;
    }
}

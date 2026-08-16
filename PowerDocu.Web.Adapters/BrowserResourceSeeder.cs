using System.Reflection;

namespace PowerDocu.Web.Adapters;

public static class BrowserResourceSeeder
{
    private const string ResourcePrefix = "PowerDocu.Web.Resources.DefaultSettings.";
    private static readonly string[] DefaultFiles =
    {
        "AppDefaultSetting.json",
        "ControlDefaultSetting.json",
        "ScreenDefaultSetting.json"
    };
    private static bool seeded;

    public static void EnsureAvailable()
    {
        if (seeded) return;
        string outputFolder = Path.Combine(AppContext.BaseDirectory, "Resources", "DefaultSettings");
        Directory.CreateDirectory(outputFolder);
        Assembly assembly = typeof(BrowserResourceSeeder).Assembly;
        foreach (string fileName in DefaultFiles)
        {
            using Stream source = assembly.GetManifestResourceStream(ResourcePrefix + fileName)
                ?? throw new InvalidOperationException($"Embedded PowerDocu resource '{fileName}' was not found.");
            using Stream destination = File.Create(Path.Combine(outputFolder, fileName));
            source.CopyTo(destination);
        }
        seeded = true;
    }
}

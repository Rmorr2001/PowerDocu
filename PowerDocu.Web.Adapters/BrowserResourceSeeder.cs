using System.Reflection;

namespace PowerDocu.Web.Adapters;

public static class BrowserResourceSeeder
{
    private static readonly (string ResourceName, string RelativePath)[] ResourceFiles =
    {
        ("PowerDocu.Web.Resources.DefaultSettings.AppDefaultSetting.json", "DefaultSettings/AppDefaultSetting.json"),
        ("PowerDocu.Web.Resources.DefaultSettings.ControlDefaultSetting.json", "DefaultSettings/ControlDefaultSetting.json"),
        ("PowerDocu.Web.Resources.DefaultSettings.ScreenDefaultSetting.json", "DefaultSettings/ScreenDefaultSetting.json"),
        ("PowerDocu.Web.Resources.styles.xml", "styles.xml")
    };
    private static bool seeded;

    public static void EnsureAvailable()
    {
        if (seeded) return;
        string outputFolder = Path.Combine(AppContext.BaseDirectory, "Resources");
        Assembly assembly = typeof(BrowserResourceSeeder).Assembly;
        foreach ((string resourceName, string relativePath) in ResourceFiles)
        {
            using Stream source = assembly.GetManifestResourceStream(resourceName)
                ?? throw new InvalidOperationException($"Embedded PowerDocu resource '{resourceName}' was not found.");
            string destinationPath = Path.Combine(outputFolder, relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(destinationPath)!);
            using Stream destination = File.Create(destinationPath);
            source.CopyTo(destination);
        }
        seeded = true;
    }
}

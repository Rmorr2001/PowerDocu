using PowerDocu.AppDocumenter;
using PowerDocu.Common;

namespace PowerDocu.Web.Adapters;

public sealed class BrowserGenerationService
{
    private readonly BrowserArchiveGuard archiveGuard = new();

    public byte[] GenerateArchive(byte[] packageBytes, string fileName, string? optionsJson)
    {
        archiveGuard.Validate(packageBytes, fileName);
        BrowserGenerationOptions options = BrowserGenerationOptions.Parse(optionsJson);
        ConfigHelper config = options.ToPowerDocuConfig();
        if (!config.outputFormat.Equals(OutputFormatHelper.Html))
            throw new NotSupportedException("The first Canvas browser slice currently supports HTML output only.");

        using var workspace = new BrowserWorkspace(fileName, packageBytes);
        BrowserResourceSeeder.EnsureAvailable();
        (List<AppEntity> apps, string path) = AppDocumentationGenerator.ParseApps(
            workspace.InputPath,
            workspace.OutputPath);
        if (apps == null || apps.Count == 0)
            throw new InvalidDataException("PowerDocu did not find a Canvas App in the selected package.");

        var context = new DocumentationContext
        {
            Apps = apps,
            Config = config,
            FullDocumentation = options.FullDocumentation,
            OutputPath = workspace.OutputPath,
            SourceZipPath = workspace.InputPath
        };

        AppDocumentationGenerator.GenerateHtmlOutput(
            context,
            path,
            new BrowserSvgAppGraphRenderer(),
            new BrowserAppAssetRenderer());
        return workspace.CollectGeneratedFiles();
    }
}

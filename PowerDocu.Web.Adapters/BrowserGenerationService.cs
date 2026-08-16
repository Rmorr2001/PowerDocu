using PowerDocu.AppDocumenter;
using PowerDocu.Common;

namespace PowerDocu.Web.Adapters;

public sealed class BrowserGenerationService
{
    private readonly BrowserArchiveGuard archiveGuard = new();
    private readonly IAppGraphRenderer graphRenderer;

    public BrowserGenerationService(IAppGraphRenderer? graphRenderer = null)
    {
        this.graphRenderer = graphRenderer ?? new BrowserSvgAppGraphRenderer();
    }

    public byte[] GenerateArchive(byte[] packageBytes, string fileName, string? optionsJson)
    {
        archiveGuard.Validate(packageBytes, fileName);
        BrowserGenerationOptions options = BrowserGenerationOptions.Parse(optionsJson);
        ConfigHelper config = options.ToPowerDocuConfig();
        if (!config.outputFormat.Equals(OutputFormatHelper.Html) &&
            !config.outputFormat.Equals(OutputFormatHelper.Word))
            throw new NotSupportedException("The Canvas browser supports Word or HTML output.");

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

        if (config.outputFormat.Equals(OutputFormatHelper.Word))
        {
            AppDocumentationGenerator.GenerateWordOutput(
                context,
                path,
                graphRenderer,
                new BrowserAppAssetRenderer());
        }
        else
        {
            AppDocumentationGenerator.GenerateHtmlOutput(
                context,
                path,
                graphRenderer,
                new BrowserAppAssetRenderer());
        }
        return workspace.CollectGeneratedFiles();
    }
}

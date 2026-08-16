using System.Text.Json;
using System.Text.Json.Serialization;
using PowerDocu.Common;

namespace PowerDocu.Web.Adapters;

public sealed class BrowserGenerationOptions
{
    public string OutputFormat { get; set; } = "html";
    public bool FullDocumentation { get; set; } = true;
    public bool ChangesOnly { get; set; } = true;
    public bool IncludeDefaultValues { get; set; } = true;
    public bool IncludeSampleData { get; set; }
    public bool IncludeProperties { get; set; } = true;
    public bool IncludeVariables { get; set; } = true;
    public bool IncludeDataSources { get; set; } = true;
    public bool IncludeResources { get; set; } = true;
    public bool IncludeControls { get; set; } = true;

    public static BrowserGenerationOptions Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new BrowserGenerationOptions();
        return JsonSerializer.Deserialize(
            json,
            BrowserGenerationJsonContext.Default.BrowserGenerationOptions) ?? new BrowserGenerationOptions();
    }

    public ConfigHelper ToPowerDocuConfig()
    {
        string format = OutputFormat.ToLowerInvariant() switch
        {
            "html" => OutputFormatHelper.Html,
            "markdown" => OutputFormatHelper.Markdown,
            "word" => OutputFormatHelper.Word,
            "all" => OutputFormatHelper.All,
            _ => throw new ArgumentException($"Unknown output format '{OutputFormat}'.")
        };

        return new ConfigHelper
        {
            outputFormat = format,
            documentApps = true,
            documentChangesOnlyCanvasApps = ChangesOnly,
            documentDefaultValuesCanvasApps = IncludeDefaultValues,
            documentSampleData = IncludeSampleData,
            documentAppProperties = IncludeProperties,
            documentAppVariables = IncludeVariables,
            documentAppDataSources = IncludeDataSources,
            documentAppResources = IncludeResources,
            documentAppControls = IncludeControls,
            checkForUpdatesOnLaunch = false
        };
    }
}

[JsonSourceGenerationOptions(
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
[JsonSerializable(typeof(BrowserGenerationOptions))]
internal partial class BrowserGenerationJsonContext : JsonSerializerContext;

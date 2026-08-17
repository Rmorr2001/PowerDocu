using System.Diagnostics;
using System.Text.Json;
using PowerDocu.AppDocumenter;
using PowerDocu.Common;

if (args.Length is < 2 or > 4)
{
    Console.Error.WriteLine(
        "Usage: PowerDocu.Baseline <input.msapp> <report.json> [output-directory] [Word|HTML|Markdown|All]");
    return 2;
}

string inputPath = Path.GetFullPath(args[0]);
string reportPath = Path.GetFullPath(args[1]);
string? outputPath = args.Length >= 3 ? Path.GetFullPath(args[2]) : null;
string outputFormat = args.Length >= 4 ? args[3] : OutputFormatHelper.All;

NotificationHelper.AddNotificationReceiver(new ConsoleNotificationReceiver());

var report = new BaselineReport
{
    InputFileName = Path.GetFileName(inputPath),
    InputBytes = new FileInfo(inputPath).Length,
    ExpandedArchiveBytes = ExpandedArchiveSize(inputPath),
    OutputFormat = outputPath is null ? null : outputFormat,
    StartedAtUtc = DateTimeOffset.UtcNow
};

var stopwatch = Stopwatch.StartNew();
try
{
    (List<AppEntity>? apps, string? resolvedOutputPath) =
        AppDocumentationGenerator.ParseApps(inputPath, outputPath);

    report.ParseMilliseconds = stopwatch.ElapsedMilliseconds;
    report.ResolvedOutputPath = resolvedOutputPath;
    report.Apps = apps?.Select(ToAppReport).ToList() ?? [];

    if (outputPath is not null && apps is not null && resolvedOutputPath is not null)
    {
        var config = new ConfigHelper
        {
            outputFormat = outputFormat,
            documentApps = true
        };
        var context = new DocumentationContext
        {
            Apps = apps,
            Config = config,
            FullDocumentation = true,
            OutputPath = outputPath,
            SourceZipPath = inputPath
        };

        stopwatch.Restart();
        AppDocumentationGenerator.GenerateOutput(context, resolvedOutputPath);
        report.GenerationMilliseconds = stopwatch.ElapsedMilliseconds;
        report.OutputManifest = Directory.Exists(outputPath)
            ? Directory.EnumerateFiles(outputPath, "*", SearchOption.AllDirectories)
                .Select(file => Path.GetRelativePath(outputPath, file).Replace('\\', '/'))
                .Order(StringComparer.Ordinal)
                .ToList()
            : [];
    }
}
catch (Exception exception)
{
    report.Error = exception.ToString();
    Console.Error.WriteLine(exception);
}
finally
{
    report.CompletedAtUtc = DateTimeOffset.UtcNow;
    report.PeakWorkingSetBytes = Process.GetCurrentProcess().PeakWorkingSet64;
    Directory.CreateDirectory(Path.GetDirectoryName(reportPath)!);
    File.WriteAllText(
        reportPath,
        JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }));
}

return report.Error is null ? 0 : 1;

static AppReport ToAppReport(AppEntity app)
{
    int screens = app.Controls.Count(control => control.Type == "screen");
    int totalControls = app.Controls.Sum(CountControlTree);
    return new AppReport
    {
        Name = app.Name,
        Id = app.ID,
        ScreenCount = screens,
        TotalControlCount = totalControls,
        GlobalVariables = app.GlobalVariables.Order(StringComparer.Ordinal).ToList(),
        ContextVariables = app.ContextVariables.Order(StringComparer.Ordinal).ToList(),
        Collections = app.Collections.Order(StringComparer.Ordinal).ToList(),
        DataSourceCount = app.DataSources.Count,
        ResourceCount = app.Resources.Count,
        NavigationEdgeCount = app.ScreenNavigations.Values.Sum(destinations => destinations?.Count ?? 0)
    };
}

static int CountControlTree(ControlEntity control) =>
    1 + control.Children.Sum(CountControlTree);

static long ExpandedArchiveSize(string filePath)
{
    using var archive = System.IO.Compression.ZipFile.OpenRead(filePath);
    return archive.Entries.Sum(entry => entry.Length);
}

internal sealed class BaselineReport
{
    public string InputFileName { get; init; } = "";
    public long InputBytes { get; init; }
    public long ExpandedArchiveBytes { get; init; }
    public string? OutputFormat { get; init; }
    public DateTimeOffset StartedAtUtc { get; init; }
    public DateTimeOffset CompletedAtUtc { get; set; }
    public long ParseMilliseconds { get; set; }
    public long? GenerationMilliseconds { get; set; }
    public long PeakWorkingSetBytes { get; set; }
    public string? ResolvedOutputPath { get; set; }
    public List<AppReport> Apps { get; set; } = [];
    public List<string> OutputManifest { get; set; } = [];
    public string? Error { get; set; }
}

internal sealed class AppReport
{
    public string Name { get; init; } = "";
    public string Id { get; init; } = "";
    public int ScreenCount { get; init; }
    public int TotalControlCount { get; init; }
    public List<string> GlobalVariables { get; init; } = [];
    public List<string> ContextVariables { get; init; } = [];
    public List<string> Collections { get; init; } = [];
    public int DataSourceCount { get; init; }
    public int ResourceCount { get; init; }
    public int NavigationEdgeCount { get; init; }
}

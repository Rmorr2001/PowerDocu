using System.IO.Compression;
using PowerDocu.Web.Adapters;

namespace PowerDocu.Browser.Tests;

public sealed class BrowserGenerationServiceTests
{
    [Fact]
    public void Generates_retained_html_output_and_managed_assets()
    {
        byte[] output = new BrowserGenerationService().GenerateArchive(
            SyntheticMsappFactory.Create(),
            "synthetic.msapp",
            "{\"outputFormat\":\"html\"}");

        using var archive = new ZipArchive(new MemoryStream(output), ZipArchiveMode.Read);
        string[] names = archive.Entries.Select(entry => entry.FullName).ToArray();
        Assert.Contains(names, name => name.EndsWith("/index-Synthetic-Canvas.html", StringComparison.Ordinal));
        Assert.Contains(names, name => name.EndsWith("/ScreenNavigation.svg", StringComparison.Ordinal));
        Assert.Contains(names, name => name.EndsWith("/resources/appinfo.svg", StringComparison.Ordinal));
        Assert.Contains(names, name => name.EndsWith("/resources/screen.svg", StringComparison.Ordinal));
        Assert.DoesNotContain(names, name => name.Contains('\\') || name.StartsWith('/') || name.Contains("../"));
    }

    [Fact]
    public void Reports_non_html_formats_as_incomplete()
    {
        NotSupportedException exception = Assert.Throws<NotSupportedException>(() =>
            new BrowserGenerationService().GenerateArchive(
                SyntheticMsappFactory.Create(),
                "synthetic.msapp",
                "{\"outputFormat\":\"word\"}"));
        Assert.Contains("HTML output only", exception.Message);
    }

    [Fact]
    public void Diagram_only_mode_omits_html_but_preserves_the_graph()
    {
        byte[] output = new BrowserGenerationService().GenerateArchive(
            SyntheticMsappFactory.Create(),
            "synthetic.msapp",
            "{\"outputFormat\":\"html\",\"fullDocumentation\":false}");

        using var archive = new ZipArchive(new MemoryStream(output), ZipArchiveMode.Read);
        string[] names = archive.Entries.Select(entry => entry.FullName).ToArray();
        Assert.Contains(names, name => name.EndsWith("/ScreenNavigation.svg", StringComparison.Ordinal));
        Assert.DoesNotContain(names, name => name.EndsWith(".html", StringComparison.Ordinal));
    }
}

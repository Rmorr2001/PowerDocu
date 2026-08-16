using System.Text;
using PowerDocu.Web.Adapters;

namespace PowerDocu.Browser.Tests;

public sealed class BrowserAppAssetRendererTests
{
    [Fact]
    public void Writes_svg_control_icon_with_upstream_safe_name()
    {
        string output = CreateOutput();
        try
        {
            var renderer = new BrowserAppAssetRenderer();
            renderer.SaveControlIcon("screen", output);

            string fileName = renderer.GetControlIconFileName("screen");
            Assert.Equal("screen.svg", fileName);
            Assert.Contains("<svg", File.ReadAllText(Path.Combine(output, fileName)));
        }
        finally
        {
            Directory.Delete(output, recursive: true);
        }
    }

    [Theory]
    [InlineData("logo.PNG", "applogo.png")]
    [InlineData("logo.exe", "applogo.bin")]
    public void Preserves_logo_bytes_with_a_browser_safe_extension(string sourceName, string expectedName)
    {
        string output = CreateOutput();
        byte[] bytes = Encoding.UTF8.GetBytes("synthetic-image-bytes");
        try
        {
            using var source = new MemoryStream(bytes);
            string fileName = new BrowserAppAssetRenderer().SaveAppLogo(
                sourceName,
                source,
                output,
                "#ffffff",
                400);

            Assert.Equal(expectedName, fileName);
            Assert.Equal(bytes, File.ReadAllBytes(Path.Combine(output, fileName)));
            Assert.Equal(0, source.Position);
        }
        finally
        {
            Directory.Delete(output, recursive: true);
        }
    }

    private static string CreateOutput()
    {
        string output = Path.Combine(Path.GetTempPath(), "powerdocu-asset-test", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(output);
        return output;
    }
}

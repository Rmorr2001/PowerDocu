using PowerDocu.Common;
using PowerDocu.Web.Adapters;

namespace PowerDocu.Browser.Tests;

public sealed class BrowserGraphvizAppGraphRendererTests
{
    [Fact]
    public void Sends_navigation_dot_to_the_local_engines_and_writes_both_formats()
    {
        string output = Path.Combine(Path.GetTempPath(), "powerdocu-graphviz-test", Guid.NewGuid().ToString("N"));
        string? capturedDot = null;
        try
        {
            var source = new ControlEntity { Name = "Source", Type = "screen" };
            var target = new ControlEntity { Name = "Target", Type = "screen" };
            var button = new ControlEntity { Name = "Go", Type = "button", Parent = source };
            source.Children.Add(button);
            var app = new AppEntity { Name = "Synthetic" };
            app.Controls.AddRange([source, target]);
            app.ScreenNavigations[button] = ["Target"];

            var renderer = new BrowserGraphvizAppGraphRenderer(
                dot =>
                {
                    capturedDot = dot;
                    return "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>";
                },
                _ => [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

            renderer.Render(app, output);

            Assert.Contains("\"Source\" -> \"Target\"", capturedDot);
            Assert.Contains("label=<<TABLE", capturedDot);
            Assert.True(File.Exists(Path.Combine(output, "ScreenNavigation.svg")));
            Assert.True(File.Exists(Path.Combine(output, "ScreenNavigation.png")));
        }
        finally
        {
            if (Directory.Exists(output)) Directory.Delete(output, recursive: true);
        }
    }
}

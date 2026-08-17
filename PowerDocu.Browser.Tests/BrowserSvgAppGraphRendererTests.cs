using PowerDocu.Common;
using PowerDocu.Web.Adapters;

namespace PowerDocu.Browser.Tests;

public sealed class BrowserSvgAppGraphRendererTests
{
    [Fact]
    public void Writes_screen_nodes_and_navigation_edges()
    {
        string output = Path.Combine(Path.GetTempPath(), "powerdocu-graph-test", Guid.NewGuid().ToString("N"));
        try
        {
            var source = new ControlEntity { Name = "Source", Type = "screen" };
            var target = new ControlEntity { Name = "Target", Type = "screen" };
            var button = new ControlEntity { Name = "Go", Type = "button", Parent = source };
            source.Children.Add(button);
            var app = new AppEntity { Name = "Synthetic" };
            app.Controls.AddRange([source, target]);
            app.ScreenNavigations[button] = ["Target"];

            new BrowserSvgAppGraphRenderer().Render(app, output);
            string svg = File.ReadAllText(Path.Combine(output, "ScreenNavigation.svg"));
            Assert.Contains("Source", svg);
            Assert.Contains("Target", svg);
            Assert.Contains("marker-end", svg);
        }
        finally
        {
            if (Directory.Exists(output)) Directory.Delete(output, recursive: true);
        }
    }
}

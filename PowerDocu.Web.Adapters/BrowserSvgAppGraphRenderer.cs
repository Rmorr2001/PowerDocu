using System.Security;
using System.Text;
using PowerDocu.AppDocumenter;
using PowerDocu.Common;

namespace PowerDocu.Web.Adapters;

public sealed class BrowserSvgAppGraphRenderer : IAppGraphRenderer
{
    public void Render(AppEntity app, string outputFolder)
    {
        Directory.CreateDirectory(outputFolder);
        List<(string Source, string Target)> edges = CollectEdges(app);
        List<string> nodes = edges
            .SelectMany(edge => new[] { edge.Source, edge.Target })
            .Distinct(StringComparer.Ordinal)
            .Order(StringComparer.Ordinal)
            .ToList();

        const int nodeWidth = 180;
        const int nodeHeight = 44;
        const int horizontalGap = 72;
        const int margin = 40;
        int width = Math.Max(320, margin * 2 + nodes.Count * nodeWidth + Math.Max(0, nodes.Count - 1) * horizontalGap);
        const int height = 180;
        var xPositions = nodes
            .Select((node, index) => (node, x: margin + index * (nodeWidth + horizontalGap)))
            .ToDictionary(item => item.node, item => item.x, StringComparer.Ordinal);

        var svg = new StringBuilder();
        svg.Append($"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{width}\" height=\"{height}\" viewBox=\"0 0 {width} {height}\">");
        svg.Append("<defs><marker id=\"arrow\" viewBox=\"0 0 10 10\" refX=\"9\" refY=\"5\" markerWidth=\"7\" markerHeight=\"7\" orient=\"auto-start-reverse\"><path d=\"M 0 0 L 10 5 L 0 10 z\" fill=\"#555\"/></marker></defs>");
        svg.Append("<rect width=\"100%\" height=\"100%\" fill=\"white\"/>");

        foreach ((string source, string target) in edges)
        {
            int x1 = xPositions[source] + nodeWidth;
            int x2 = xPositions[target];
            int y = margin + nodeHeight / 2;
            svg.Append($"<path d=\"M {x1} {y} C {x1 + 24} {y}, {x2 - 24} {y}, {x2} {y}\" fill=\"none\" stroke=\"#555\" stroke-width=\"1.5\" marker-end=\"url(#arrow)\"/>");
        }

        foreach (string node in nodes)
        {
            int x = xPositions[node];
            string label = SecurityElement.Escape(CharsetHelper.GetSafeName(node)) ?? "";
            svg.Append($"<rect x=\"{x}\" y=\"{margin}\" width=\"{nodeWidth}\" height=\"{nodeHeight}\" rx=\"3\" fill=\"white\" stroke=\"#333\"/>");
            svg.Append($"<text x=\"{x + nodeWidth / 2}\" y=\"{margin + 27}\" text-anchor=\"middle\" font-family=\"Arial, sans-serif\" font-size=\"13\" fill=\"#111\">{label}</text>");
        }

        if (nodes.Count == 0)
        {
            svg.Append("<text x=\"160\" y=\"92\" text-anchor=\"middle\" font-family=\"Arial, sans-serif\" font-size=\"13\" fill=\"#555\">No screen navigation detected</text>");
        }

        svg.Append("</svg>");
        File.WriteAllText(Path.Combine(outputFolder, "ScreenNavigation.svg"), svg.ToString());
    }

    private static List<(string Source, string Target)> CollectEdges(AppEntity app)
    {
        List<ControlEntity> screens = app.Controls.Where(control => control.Type == "screen").ToList();
        var edges = new HashSet<(string Source, string Target)>();
        foreach ((ControlEntity control, List<string> destinations) in app.ScreenNavigations)
        {
            if (destinations == null) continue;
            foreach (string destination in destinations)
            {
                ControlEntity sourceScreen = control.Screen();
                string source = sourceScreen?.Name ?? (control.Type == "appinfo" ? "App" : "");
                if (string.IsNullOrEmpty(source)) continue;

                if (!destination.Contains("(") && !destination.Contains(","))
                {
                    edges.Add((source, destination));
                    continue;
                }

                foreach (ControlEntity screen in screens.Where(screen => destination.Contains(screen.Name)))
                {
                    edges.Add((source, screen.Name));
                }
            }
        }
        return edges.OrderBy(edge => edge.Source, StringComparer.Ordinal)
            .ThenBy(edge => edge.Target, StringComparer.Ordinal)
            .ToList();
    }
}

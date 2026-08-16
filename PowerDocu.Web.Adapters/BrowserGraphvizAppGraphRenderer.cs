using System.Net;
using System.Text;
using PowerDocu.AppDocumenter;
using PowerDocu.Common;

namespace PowerDocu.Web.Adapters;

public sealed class BrowserGraphvizAppGraphRenderer : IAppGraphRenderer
{
    private readonly Func<string, string> renderSvg;
    private readonly Func<string, byte[]> rasterizePng;

    public BrowserGraphvizAppGraphRenderer(
        Func<string, string> renderSvg,
        Func<string, byte[]> rasterizePng)
    {
        this.renderSvg = renderSvg;
        this.rasterizePng = rasterizePng;
    }

    public void Render(AppEntity app, string outputFolder)
    {
        Directory.CreateDirectory(outputFolder);
        string svg = renderSvg(BuildDot(app));
        if (string.IsNullOrWhiteSpace(svg) || !svg.Contains("<svg", StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException("The local Graphviz engine did not return a valid SVG diagram.");

        byte[] png = rasterizePng(svg);
        if (!HasPngSignature(png))
            throw new InvalidDataException("The local PNG engine did not return a valid diagram image.");

        File.WriteAllText(Path.Combine(outputFolder, "ScreenNavigation.svg"), svg);
        File.WriteAllBytes(Path.Combine(outputFolder, "ScreenNavigation.png"), png);
    }

    public static string BuildDot(AppEntity app)
    {
        List<(string Source, string Target)> edges = CollectEdges(app);
        List<string> nodes = edges
            .SelectMany(edge => new[] { edge.Source, edge.Target })
            .Distinct(StringComparer.Ordinal)
            .Order(StringComparer.Ordinal)
            .ToList();

        var dot = new StringBuilder();
        dot.Append("digraph \"")
            .Append(EscapeDot(CharsetHelper.GetSafeName(app.Name)))
            .AppendLine("\" {");
        dot.AppendLine("  graph [bgcolor=\"transparent\", compound=true, pad=\"0.2\", rankdir=LR, nodesep=\"0.45\", ranksep=\"0.75\"];");
        dot.AppendLine("  node [fontname=\"Arial\", shape=plain];");
        dot.AppendLine("  edge [arrowsize=\"0.7\", color=\"#667085\", penwidth=\"1.25\"];");

        foreach (string node in nodes)
        {
            string id = EscapeDot(CharsetHelper.GetSafeName(node));
            string label = WebUtility.HtmlEncode(CharsetHelper.GetSafeName(node));
            dot.Append("  \"").Append(id).Append("\" [label=<<TABLE BORDER=\"0\" CELLBORDER=\"1\" CELLSPACING=\"0\" CELLPADDING=\"9\" COLOR=\"#667085\"><TR><TD BGCOLOR=\"#FFFFFF\"><FONT COLOR=\"#101828\">")
                .Append(label)
                .AppendLine("</FONT></TD></TR></TABLE>>];");
        }

        foreach ((string source, string target) in edges)
        {
            dot.Append("  \"")
                .Append(EscapeDot(CharsetHelper.GetSafeName(source)))
                .Append("\" -> \"")
                .Append(EscapeDot(CharsetHelper.GetSafeName(target)))
                .AppendLine("\";");
        }

        dot.AppendLine("}");
        return dot.ToString();
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

                if (!destination.Contains('(') && !destination.Contains(','))
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

    private static string EscapeDot(string value) => value
        .Replace("\\", "\\\\", StringComparison.Ordinal)
        .Replace("\"", "\\\"", StringComparison.Ordinal)
        .Replace("\r", " ", StringComparison.Ordinal)
        .Replace("\n", "\\n", StringComparison.Ordinal);

    private static bool HasPngSignature(byte[] value) =>
        value.Length >= 8 &&
        value[0] == 0x89 && value[1] == 0x50 && value[2] == 0x4E && value[3] == 0x47 &&
        value[4] == 0x0D && value[5] == 0x0A && value[6] == 0x1A && value[7] == 0x0A;
}

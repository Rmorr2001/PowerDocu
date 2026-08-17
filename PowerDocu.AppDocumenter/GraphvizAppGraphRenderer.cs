using System.Collections.Generic;
using System.IO;
using System.Linq;
using PowerDocu.Common;
using Rubjerg.Graphviz;

namespace PowerDocu.AppDocumenter
{
    public sealed class GraphvizAppGraphRenderer : IAppGraphRenderer
    {
        public void Render(AppEntity app, string outputFolder)
        {
            RootGraph rootGraph = RootGraph.CreateNew(GraphType.Directed, CharsetHelper.GetSafeName(app.Name));
            Graph.IntroduceAttribute(rootGraph, "compound", "true");
            Graph.IntroduceAttribute(rootGraph, "fontname", "helvetica");
            Node.IntroduceAttribute(rootGraph, "shape", "rectangle");
            Node.IntroduceAttribute(rootGraph, "color", "");
            Node.IntroduceAttribute(rootGraph, "style", "");
            Node.IntroduceAttribute(rootGraph, "fillcolor", "");
            Node.IntroduceAttribute(rootGraph, "label", "");
            Node.IntroduceAttribute(rootGraph, "fontname", "helvetica");

            List<ControlEntity> screenControls = app.Controls
                .Where(control => control.Type == "screen")
                .ToList();
            foreach (ControlEntity control in app.ScreenNavigations.Keys)
            {
                List<string> destinations = app.ScreenNavigations[control];
                if (destinations == null) continue;

                foreach (string destination in destinations)
                {
                    if (!destination.Contains("(") && !destination.Contains(","))
                    {
                        ControlEntity screen = control.Screen();
                        if (screen != null)
                        {
                            AddEdge(rootGraph, screen.Name, destination, screen.Name + "-" + destination);
                        }
                        else if (control.Type == "appinfo")
                        {
                            Node source = rootGraph.GetOrAddNode("App");
                            source.SetAttributeHtml("label", "<table border=\"0\"><tr><td>App</td></tr></table>");
                            source.SetAttribute("shape", "oval");
                            Node target = AddNode(rootGraph, destination);
                            rootGraph.GetOrAddEdge(source, target, "App -" + destination);
                        }
                    }
                    else
                    {
                        foreach (ControlEntity screen in screenControls.Where(screen => destination.Contains(screen.Name)))
                        {
                            ControlEntity sourceScreen = control.Screen();
                            if (sourceScreen != null)
                            {
                                AddEdge(rootGraph, sourceScreen.Name, screen.Name, sourceScreen.Name + "-" + screen.Name);
                            }
                        }
                    }
                }
            }

            rootGraph.CreateLayout();
            rootGraph.ToPngFile(Path.Combine(outputFolder, "ScreenNavigation.png"));
            rootGraph.ToSvgFile(Path.Combine(outputFolder, "ScreenNavigation.svg"));
        }

        private static void AddEdge(RootGraph graph, string sourceName, string targetName, string edgeName)
        {
            Node source = AddNode(graph, sourceName);
            Node target = AddNode(graph, targetName);
            graph.GetOrAddEdge(source, target, edgeName);
        }

        private static Node AddNode(RootGraph graph, string name)
        {
            string safeName = CharsetHelper.GetSafeName(name);
            Node node = graph.GetOrAddNode(safeName);
            node.SetAttributeHtml("label", "<table border=\"0\"><tr><td>" + safeName + "</td></tr></table>");
            return node;
        }
    }
}

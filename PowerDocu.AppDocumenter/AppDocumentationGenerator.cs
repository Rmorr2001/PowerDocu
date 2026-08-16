using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using PowerDocu.Common;

namespace PowerDocu.AppDocumenter
{
    public static class AppDocumentationGenerator
    {
        private static readonly ConcurrentDictionary<string, object> _appOutputLocks = new();

        /// <summary>
        /// Parses apps from the given file without generating documentation output.
        /// Returns the parsed apps and the resolved output path.
        /// </summary>
        public static (List<AppEntity> Apps, string Path) ParseApps(string filePath, string outputPath = null)
        {
            if (!File.Exists(filePath))
            {
                NotificationHelper.SendNotification("File not found: " + filePath);
                return (null, null);
            }

            string path = outputPath == null
                ? Path.GetDirectoryName(filePath)
                : Path.Combine(outputPath, Path.GetFileNameWithoutExtension(filePath));
            AppParser appParserFromZip = new AppParser(filePath);
            if (outputPath == null && appParserFromZip.packageType == AppParser.PackageType.SolutionPackage)
            {
                path = Path.Combine(
                    path,
                    "Solution " + CharsetHelper.GetSafeName(Path.GetFileNameWithoutExtension(filePath)));
            }
            List<AppEntity> apps = appParserFromZip.getApps();
            NotificationHelper.SendNotification($"AppParser: Parsed {apps.Count} app(s) from {filePath}.");
            return (apps, path);
        }

        /// <summary>
        /// Generates documentation output for pre-parsed apps using the DocumentationContext.
        /// </summary>
        public static void GenerateOutput(DocumentationContext context, string path)
        {
            GenerateOutput(
                context,
                path,
                new GraphvizAppGraphRenderer(),
                new SystemDrawingAppAssetRenderer());
        }

        public static void GenerateOutput(
            DocumentationContext context,
            string path,
            IAppGraphRenderer graphRenderer,
            IAppAssetRenderer assetRenderer)
        {
            GenerateOutputCore(
                context,
                path,
                graphRenderer,
                assetRenderer,
                (content, config) =>
                {
                    if (config.outputFormat.Equals(OutputFormatHelper.Word) || config.outputFormat.Equals(OutputFormatHelper.All))
                    {
                        BuildWord(content, config);
                    }
                    if (config.outputFormat.Equals(OutputFormatHelper.Markdown) || config.outputFormat.Equals(OutputFormatHelper.All))
                    {
                        NotificationHelper.SendNotification("Creating Markdown documentation");
                        AppMarkdownBuilder markdownFile = new AppMarkdownBuilder(content);
                    }
                    if (config.outputFormat.Equals(OutputFormatHelper.Html) || config.outputFormat.Equals(OutputFormatHelper.All))
                    {
                        BuildHtml(content, config);
                    }
                });
        }

        /// <summary>
        /// Browser-safe HTML entry point. Keeping this output-specific seam lets
        /// WebAssembly trimming remove desktop-only Word and Markdown dependencies.
        /// </summary>
        public static void GenerateHtmlOutput(
            DocumentationContext context,
            string path,
            IAppGraphRenderer graphRenderer,
            IAppAssetRenderer assetRenderer)
        {
            GenerateOutputCore(context, path, graphRenderer, assetRenderer, BuildHtml);
        }

        /// <summary>
        /// Browser-safe Word entry point. The caller supplies managed/browser
        /// graph and asset renderers so native desktop dependencies can be trimmed.
        /// </summary>
        public static void GenerateWordOutput(
            DocumentationContext context,
            string path,
            IAppGraphRenderer graphRenderer,
            IAppAssetRenderer assetRenderer)
        {
            GenerateOutputCore(context, path, graphRenderer, assetRenderer, BuildWord);
        }

        private static void BuildHtml(AppDocumentationContent content, ConfigHelper config)
        {
            NotificationHelper.SendNotification("Creating HTML documentation");
            AppHtmlBuilder htmlFile = new AppHtmlBuilder(content, config.documentChangesOnlyCanvasApps, config.documentDefaultValuesCanvasApps, config.documentSampleData);
        }

        private static void BuildWord(AppDocumentationContent content, ConfigHelper config)
        {
            NotificationHelper.SendNotification("Creating Word documentation");
            string wordTemplate = (!String.IsNullOrEmpty(config.wordTemplate) && File.Exists(config.wordTemplate))
                ? config.wordTemplate : null;
            _ = new AppWordDocBuilder(
                content,
                wordTemplate,
                config.documentChangesOnlyCanvasApps,
                config.documentDefaultValuesCanvasApps,
                config.documentSampleData,
                config.addTableOfContents);
        }

        private static void GenerateOutputCore(
            DocumentationContext context,
            string path,
            IAppGraphRenderer graphRenderer,
            IAppAssetRenderer assetRenderer,
            Action<AppDocumentationContent, ConfigHelper> buildDocumentation)
        {
            if (context.Apps == null || !context.Config.documentApps) return;

            DateTime startDocGeneration = DateTime.Now;
            Parallel.ForEach(context.Apps,
                new ParallelOptions { MaxDegreeOfParallelism = Environment.ProcessorCount },
                app =>
                {
                    string folderPath = AppOutputPath.For(app, path);
                    string appLockKey = Path.GetFullPath(folderPath).ToLowerInvariant();
                    object appOutputLock = _appOutputLocks.GetOrAdd(appLockKey, _ => new object());

                    lock (appOutputLock)
                    {
                        Directory.CreateDirectory(folderPath);
                        graphRenderer.Render(app, folderPath);
                        if (context.FullDocumentation)
                        {
                            AppDocumentationContent content = new AppDocumentationContent(app, path, context, assetRenderer);
                            buildDocumentation(content, context.Config);
                        }
                        context.Progress?.Increment("Apps");
                    }
                });
            DateTime endDocGeneration = DateTime.Now;
            NotificationHelper.SendNotification($"AppDocumenter: Generated documentation for {context.Apps.Count} app(s) in {(endDocGeneration - startDocGeneration).TotalSeconds} seconds.");
        }

        /// <summary>
        /// Legacy method: parses and generates documentation in one step (used for standalone .msapp files).
        /// </summary>
        public static List<AppEntity> GenerateDocumentation(string filePath, bool fullDocumentation, ConfigHelper config, string outputPath = null)
        {
            var (apps, path) = ParseApps(filePath, outputPath);
            if (apps == null) return null;

            var context = new DocumentationContext
            {
                Apps = apps,
                Config = config,
                FullDocumentation = fullDocumentation
            };
            GenerateOutput(context, path);
            return apps;
        }
    }
}

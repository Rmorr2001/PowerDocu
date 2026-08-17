using System.IO;
using PowerDocu.Common;

namespace PowerDocu.AppDocumenter
{
    internal static class AppOutputPath
    {
        public static string For(AppEntity app, string rootPath) =>
            Path.Combine(rootPath, CharsetHelper.GetSafeName("AppDoc " + app.Name));
    }
}

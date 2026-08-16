using System.IO;

namespace PowerDocu.AppDocumenter
{
    public interface IAppAssetRenderer
    {
        string GetControlIconFileName(string controlType);
        void SaveControlIcon(string controlType, string resourcesFolder);
        string SaveAppLogo(
            string sourceFileName,
            Stream source,
            string resourcesFolder,
            string backgroundColour,
            int maximumWidth);
    }
}

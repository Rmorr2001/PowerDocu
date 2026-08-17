using PowerDocu.Common;

namespace PowerDocu.AppDocumenter
{
    public interface IAppGraphRenderer
    {
        void Render(AppEntity app, string outputFolder);
    }
}

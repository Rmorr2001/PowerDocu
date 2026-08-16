using PowerDocu.Web.Adapters;

namespace PowerDocu.Browser.Tests;

public sealed class BrowserWorkspaceTests
{
    [Fact]
    public void Dispose_removes_the_unique_workspace()
    {
        string root;
        using (var workspace = new BrowserWorkspace("sample.msapp", SyntheticMsappFactory.Create()))
        {
            root = Path.GetDirectoryName(Path.GetDirectoryName(workspace.InputPath)!)!;
            Assert.True(Directory.Exists(root));
        }
        Assert.False(Directory.Exists(root));
    }
}

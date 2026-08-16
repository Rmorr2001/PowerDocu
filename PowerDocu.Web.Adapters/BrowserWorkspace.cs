using System.IO.Compression;

namespace PowerDocu.Web.Adapters;

public sealed class BrowserWorkspace : IDisposable
{
    private readonly string rootPath;
    private bool disposed;

    public string InputPath { get; }
    public string OutputPath { get; }

    public BrowserWorkspace(string fileName, byte[] packageBytes)
    {
        rootPath = Path.Combine(Path.GetTempPath(), "powerdocu-browser", Guid.NewGuid().ToString("N"));
        InputPath = Path.Combine(rootPath, "input", Path.GetFileName(fileName));
        OutputPath = Path.Combine(rootPath, "output");
        Directory.CreateDirectory(Path.GetDirectoryName(InputPath)!);
        Directory.CreateDirectory(OutputPath);
        File.WriteAllBytes(InputPath, packageBytes);
    }

    public byte[] CollectGeneratedFiles()
    {
        string[] files = Directory.EnumerateFiles(OutputPath, "*", SearchOption.AllDirectories).ToArray();
        if (files.Length == 0)
            throw new InvalidOperationException("PowerDocu did not generate any output files.");

        using var result = new MemoryStream();
        using (var archive = new ZipArchive(result, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (string file in files.Order(StringComparer.Ordinal))
            {
                string relativePath = Path.GetRelativePath(OutputPath, file).Replace('\\', '/');
                ZipArchiveEntry entry = archive.CreateEntry(relativePath, CompressionLevel.Optimal);
                using Stream input = File.OpenRead(file);
                using Stream output = entry.Open();
                input.CopyTo(output);
            }
        }
        return result.ToArray();
    }

    public void Dispose()
    {
        if (disposed) return;
        disposed = true;
        if (Directory.Exists(rootPath)) Directory.Delete(rootPath, recursive: true);
    }
}

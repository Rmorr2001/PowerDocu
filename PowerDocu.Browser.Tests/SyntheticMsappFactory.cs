using System.IO.Compression;
using System.Text;

namespace PowerDocu.Browser.Tests;

internal static class SyntheticMsappFactory
{
    public static byte[] Create()
    {
        using var result = new MemoryStream();
        using (var archive = new ZipArchive(result, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddJson(archive, "Header.json", "{}" );
            AddJson(archive, "Properties.json", """
                {
                  "AppName": "Synthetic Canvas",
                  "ID": "00000000-0000-0000-0000-000000000001",
                  "ControlCount": 2,
                  "AppPreviewFlagsMap": {}
                }
                """);
            AddJson(archive, "Resources\\PublishInfo.json", """
                {
                  "AppName": "Synthetic Canvas",
                  "BackgroundColor": "RGBA(255,255,255,1)",
                  "IconColor": "RGBA(0,0,0,1)",
                  "IconName": "Document",
                  "LogoFileName": ""
                }
                """);
            AddJson(archive, "Controls\\1.json", Control("App", "appinfo", "http://microsoft.com/appmagic/appinfo"));
            AddJson(archive, "Controls\\2.json", Control("Screen One", "screen", "http://microsoft.com/appmagic/screen"));
            AddJson(archive, "References\\DataSources.json", "{\"DataSources\":[]}");
            AddJson(archive, "References\\Resources.json", "{\"Resources\":[]}");
        }
        return result.ToArray();
    }

    public static byte[] CreateWithEntries(params (string Name, string Content)[] entries)
    {
        using var result = new MemoryStream();
        using (var archive = new ZipArchive(result, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach ((string name, string content) in entries) AddJson(archive, name, content);
        }
        return result.ToArray();
    }

    private static string Control(string name, string type, string id) => $$"""
        {
          "TopParent": {
            "Name": "{{name}}",
            "Template": {
              "Id": "{{id}}",
              "Version": "1.0",
              "Name": "{{type}}"
            },
            "Rules": [],
            "Children": []
          }
        }
        """;

    private static void AddJson(ZipArchive archive, string name, string content)
    {
        ZipArchiveEntry entry = archive.CreateEntry(name, CompressionLevel.Fastest);
        using Stream stream = entry.Open();
        byte[] bytes = Encoding.UTF8.GetBytes(content);
        stream.Write(bytes);
    }
}

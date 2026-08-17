using PowerDocu.Web.Adapters;

namespace PowerDocu.Browser.Tests;

public sealed class BrowserArchiveGuardTests
{
    private readonly BrowserArchiveGuard guard = new();

    [Fact]
    public void Accepts_synthetic_canvas_package() =>
        guard.Validate(SyntheticMsappFactory.Create(), "sample.msapp");

    [Theory]
    [InlineData("../escape.json")]
    [InlineData("/absolute.json")]
    [InlineData("C:\\drive.json")]
    [InlineData("safe/../escape.json")]
    public void Rejects_unsafe_archive_paths(string entryName)
    {
        byte[] package = SyntheticMsappFactory.CreateWithEntries((entryName, "{}"));
        Assert.Throws<InvalidDataException>(() => guard.Validate(package, "sample.msapp"));
    }

    [Fact]
    public void Rejects_mixed_slash_duplicate_paths()
    {
        byte[] package = SyntheticMsappFactory.CreateWithEntries(
            ("References/Data.json", "{}"),
            ("References\\Data.json", "{}"));
        Assert.Throws<InvalidDataException>(() => guard.Validate(package, "sample.msapp"));
    }

    [Fact]
    public void Rejects_non_canvas_extension() =>
        Assert.Throws<InvalidDataException>(() =>
            guard.Validate(SyntheticMsappFactory.Create(), "sample.zip"));
}

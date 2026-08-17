using PowerDocu.Common;
using PowerDocu.Web.Adapters;

namespace PowerDocu.Browser.Tests;

public sealed class BrowserGenerationOptionsTests
{
    [Fact]
    public void Maps_browser_options_to_upstream_configuration()
    {
        BrowserGenerationOptions options = BrowserGenerationOptions.Parse("""
            {
              "outputFormat": "html",
              "changesOnly": false,
              "includeDefaultValues": false,
              "includeVariables": false
            }
            """);

        ConfigHelper config = options.ToPowerDocuConfig();
        Assert.Equal(OutputFormatHelper.Html, config.outputFormat);
        Assert.False(config.documentChangesOnlyCanvasApps);
        Assert.False(config.documentDefaultValuesCanvasApps);
        Assert.False(config.documentAppVariables);
        Assert.False(config.checkForUpdatesOnLaunch);
    }

    [Fact]
    public void Maps_word_output_to_upstream_configuration()
    {
        BrowserGenerationOptions options = BrowserGenerationOptions.Parse("""
            { "outputFormat": "word" }
            """);

        Assert.Equal(OutputFormatHelper.Word, options.ToPowerDocuConfig().outputFormat);
    }
}

using System.Drawing;
using System.IO;
using PowerDocu.Common;
using Svg;

namespace PowerDocu.AppDocumenter
{
    public sealed class SystemDrawingAppAssetRenderer : IAppAssetRenderer
    {
        public string GetControlIconFileName(string controlType) => controlType + ".png";

        public void SaveControlIcon(string controlType, string resourcesFolder)
        {
            var svgDocument = SvgDocument.FromSvg<SvgDocument>(AppControlIcons.GetControlIcon(controlType));
            using var bitmap = svgDocument.Draw(16, 0);
            bitmap?.Save(Path.Combine(resourcesFolder, GetControlIconFileName(controlType)));
        }

        public string SaveAppLogo(
            string sourceFileName,
            Stream source,
            string resourcesFolder,
            string backgroundColour,
            int maximumWidth)
        {
            source.Position = 0;
            Bitmap appLogo;
            string logoPath = Path.Combine(resourcesFolder, "applogo.png");
            if (!string.IsNullOrEmpty(backgroundColour))
            {
                Color colour = ColorTranslator.FromHtml(ColourHelper.ParseColor(backgroundColour));
                using var original = new Bitmap(source);
                appLogo = new Bitmap(original.Width, original.Height);
                var rectangle = new Rectangle(Point.Empty, original.Size);
                using (Graphics graphics = Graphics.FromImage(appLogo))
                {
                    graphics.Clear(colour);
                    graphics.DrawImageUnscaledAndClipped(original, rectangle);
                }
                appLogo.Save(logoPath);
            }
            else
            {
                using (Stream destination = File.Open(logoPath, FileMode.Create))
                {
                    source.CopyTo(destination);
                }
                source.Position = 0;
                appLogo = new Bitmap(source);
            }

            source.Position = 0;
            using (appLogo)
            {
                if (appLogo.Width <= maximumWidth)
                {
                    return "applogo.png";
                }

                using var resized = new Bitmap(
                    appLogo,
                    new Size(maximumWidth, maximumWidth * appLogo.Height / appLogo.Width));
                resized.Save(Path.Combine(resourcesFolder, "applogoSmall.png"));
                return "applogoSmall.png";
            }
        }
    }
}

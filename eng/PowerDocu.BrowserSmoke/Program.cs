using PowerDocu.Common;
using PowerDocu.Web.Adapters;

if (args.Length is < 2 or > 3)
{
    Console.Error.WriteLine("Usage: PowerDocu.BrowserSmoke <input.msapp> <output.zip> [options-json]");
    return 2;
}

NotificationHelper.AddNotificationReceiver(new ConsoleNotificationReceiver());
byte[] input = File.ReadAllBytes(args[0]);
byte[] output = new BrowserGenerationService().GenerateArchive(
    input,
    Path.GetFileName(args[0]),
    args.Length == 3 ? args[2] : null);
File.WriteAllBytes(args[1], output);
Console.WriteLine($"Wrote {output.Length:N0} bytes to {args[1]}.");
return 0;

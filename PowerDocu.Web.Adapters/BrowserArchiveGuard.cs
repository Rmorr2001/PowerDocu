using System.IO.Compression;

namespace PowerDocu.Web.Adapters;

public sealed class BrowserArchiveGuard
{
    public const long MaximumInputBytes = 100L * 1024 * 1024;
    public const long MaximumExpandedBytes = 512L * 1024 * 1024;
    public const long MaximumEntryBytes = 128L * 1024 * 1024;
    public const int MaximumEntries = 10_000;
    public const double MaximumCompressionRatio = 200;

    public void Validate(byte[] packageBytes, string fileName)
    {
        if (packageBytes.Length == 0)
            throw new InvalidDataException("The selected package is empty.");
        if (packageBytes.LongLength > MaximumInputBytes)
            throw new InvalidDataException("The selected package exceeds the 100 MB input limit.");
        if (!Path.GetExtension(fileName).Equals(".msapp", StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException("Select a standalone Canvas App package with the .msapp extension.");
        if (!Path.GetFileName(fileName).Equals(fileName, StringComparison.Ordinal))
            throw new InvalidDataException("The selected package name must not contain a path.");

        using var stream = new MemoryStream(packageBytes, writable: false);
        using var archive = OpenArchive(stream);
        if (archive.Entries.Count == 0)
            throw new InvalidDataException("The selected package contains no files.");
        if (archive.Entries.Count > MaximumEntries)
            throw new InvalidDataException($"The selected package contains more than {MaximumEntries:N0} entries.");

        long expandedBytes = 0;
        var normalizedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (ZipArchiveEntry entry in archive.Entries)
        {
            string normalizedName = NormalizeAndValidateEntryName(entry.FullName);
            if (!normalizedNames.Add(normalizedName))
                throw new InvalidDataException("The selected package contains duplicate or ambiguous paths.");
            if (entry.Length > MaximumEntryBytes)
                throw new InvalidDataException("The selected package contains an entry larger than 128 MB.");

            expandedBytes = checked(expandedBytes + entry.Length);
            if (expandedBytes > MaximumExpandedBytes)
                throw new InvalidDataException("The selected package expands beyond the 512 MB workspace limit.");

            if (entry.Length > 0 && entry.CompressedLength == 0)
                throw new InvalidDataException("The selected package contains an invalid compressed entry.");
            if (entry.CompressedLength > 0 && entry.Length / (double)entry.CompressedLength > MaximumCompressionRatio)
                throw new InvalidDataException("The selected package contains an entry with an unsafe compression ratio.");
        }
    }

    private static ZipArchive OpenArchive(Stream stream)
    {
        try
        {
            return new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: false);
        }
        catch (InvalidDataException exception)
        {
            throw new InvalidDataException("The selected file is not a readable Canvas App package.", exception);
        }
    }

    private static string NormalizeAndValidateEntryName(string entryName)
    {
        string normalized = entryName.Replace('\\', '/');
        if (string.IsNullOrWhiteSpace(normalized) || normalized.StartsWith('/'))
            throw new InvalidDataException("The selected package contains an absolute or empty path.");
        if (normalized.Length >= 2 && char.IsLetter(normalized[0]) && normalized[1] == ':')
            throw new InvalidDataException("The selected package contains a Windows drive path.");

        string[] segments = normalized.Split('/');
        if (segments.Any(segment => segment is "" or "." or ".."))
            throw new InvalidDataException("The selected package contains an unsafe relative path.");
        return string.Join('/', segments);
    }
}

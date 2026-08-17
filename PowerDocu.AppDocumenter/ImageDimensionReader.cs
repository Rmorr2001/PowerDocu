using System;
using System.Buffers.Binary;
using System.IO;

namespace PowerDocu.AppDocumenter;

internal static class ImageDimensionReader
{
    public static (int Width, int Height) Read(Stream stream)
    {
        long originalPosition = stream.CanSeek ? stream.Position : 0;
        try
        {
            using var buffer = new MemoryStream();
            stream.CopyTo(buffer);
            ReadOnlySpan<byte> bytes = buffer.GetBuffer().AsSpan(0, checked((int)buffer.Length));

            if (IsPng(bytes))
                return Positive(
                    BinaryPrimitives.ReadInt32BigEndian(bytes.Slice(16, 4)),
                    BinaryPrimitives.ReadInt32BigEndian(bytes.Slice(20, 4)));

            if (IsGif(bytes))
                return Positive(
                    BinaryPrimitives.ReadUInt16LittleEndian(bytes.Slice(6, 2)),
                    BinaryPrimitives.ReadUInt16LittleEndian(bytes.Slice(8, 2)));

            if (IsBmp(bytes))
                return Positive(
                    Math.Abs(BinaryPrimitives.ReadInt32LittleEndian(bytes.Slice(18, 4))),
                    Math.Abs(BinaryPrimitives.ReadInt32LittleEndian(bytes.Slice(22, 4))));

            if (IsJpeg(bytes)) return ReadJpeg(bytes);
            if (IsWebP(bytes)) return ReadWebP(bytes);

            throw new InvalidDataException("The image format does not expose supported pixel dimensions.");
        }
        finally
        {
            if (stream.CanSeek) stream.Position = originalPosition;
        }
    }

    private static bool IsPng(ReadOnlySpan<byte> bytes) =>
        bytes.Length >= 24 && bytes[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A });

    private static bool IsGif(ReadOnlySpan<byte> bytes) =>
        bytes.Length >= 10 &&
        (bytes[..6].SequenceEqual("GIF87a"u8) || bytes[..6].SequenceEqual("GIF89a"u8));

    private static bool IsBmp(ReadOnlySpan<byte> bytes) =>
        bytes.Length >= 26 && bytes[0] == (byte)'B' && bytes[1] == (byte)'M';

    private static bool IsJpeg(ReadOnlySpan<byte> bytes) =>
        bytes.Length >= 4 && bytes[0] == 0xFF && bytes[1] == 0xD8;

    private static bool IsWebP(ReadOnlySpan<byte> bytes) =>
        bytes.Length >= 30 && bytes[..4].SequenceEqual("RIFF"u8) && bytes.Slice(8, 4).SequenceEqual("WEBP"u8);

    private static (int Width, int Height) ReadJpeg(ReadOnlySpan<byte> bytes)
    {
        int offset = 2;
        while (offset + 4 <= bytes.Length)
        {
            while (offset < bytes.Length && bytes[offset] != 0xFF) offset++;
            while (offset < bytes.Length && bytes[offset] == 0xFF) offset++;
            if (offset >= bytes.Length) break;

            byte marker = bytes[offset++];
            if (marker is 0xD8 or 0xD9 || marker is >= 0xD0 and <= 0xD7 || marker == 0x01)
                continue;
            if (offset + 2 > bytes.Length) break;

            int segmentLength = BinaryPrimitives.ReadUInt16BigEndian(bytes.Slice(offset, 2));
            if (segmentLength < 2 || offset + segmentLength > bytes.Length) break;
            if (IsStartOfFrame(marker) && segmentLength >= 7)
            {
                int height = BinaryPrimitives.ReadUInt16BigEndian(bytes.Slice(offset + 3, 2));
                int width = BinaryPrimitives.ReadUInt16BigEndian(bytes.Slice(offset + 5, 2));
                return Positive(width, height);
            }
            offset += segmentLength;
        }

        throw new InvalidDataException("The JPEG dimensions could not be read.");
    }

    private static bool IsStartOfFrame(byte marker) =>
        marker is 0xC0 or 0xC1 or 0xC2 or 0xC3 or 0xC5 or 0xC6 or 0xC7 or
            0xC9 or 0xCA or 0xCB or 0xCD or 0xCE or 0xCF;

    private static (int Width, int Height) ReadWebP(ReadOnlySpan<byte> bytes)
    {
        ReadOnlySpan<byte> chunk = bytes.Slice(12, 4);
        if (chunk.SequenceEqual("VP8X"u8) && bytes.Length >= 30)
        {
            int width = 1 + ReadUInt24LittleEndian(bytes.Slice(24, 3));
            int height = 1 + ReadUInt24LittleEndian(bytes.Slice(27, 3));
            return Positive(width, height);
        }
        if (chunk.SequenceEqual("VP8L"u8) && bytes.Length >= 25 && bytes[20] == 0x2F)
        {
            int width = 1 + bytes[21] + ((bytes[22] & 0x3F) << 8);
            int height = 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0F) << 10);
            return Positive(width, height);
        }
        if (chunk.SequenceEqual("VP8 "u8) && bytes.Length >= 30 &&
            bytes[23] == 0x9D && bytes[24] == 0x01 && bytes[25] == 0x2A)
        {
            int width = BinaryPrimitives.ReadUInt16LittleEndian(bytes.Slice(26, 2)) & 0x3FFF;
            int height = BinaryPrimitives.ReadUInt16LittleEndian(bytes.Slice(28, 2)) & 0x3FFF;
            return Positive(width, height);
        }

        throw new InvalidDataException("The WebP dimensions could not be read.");
    }

    private static int ReadUInt24LittleEndian(ReadOnlySpan<byte> bytes) =>
        bytes[0] | (bytes[1] << 8) | (bytes[2] << 16);

    private static (int Width, int Height) Positive(int width, int height)
    {
        if (width <= 0 || height <= 0)
            throw new InvalidDataException("The image dimensions must be positive.");
        return (width, height);
    }
}

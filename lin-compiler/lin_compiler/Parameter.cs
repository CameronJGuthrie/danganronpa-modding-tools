using System;
using System.Collections.Generic;

namespace LIN
{
    public enum Type
    {
        Byte,       // 8-bit unsigned
        UInt16LE,   // 16-bit unsigned, little-endian (LSB first, MSB second)
        UInt16BE    // 16-bit unsigned, big-endian (MSB first, LSB second)
    }

    public class Parameter
    {

        public static int CountBytes(Type parameterType)
        {
            return parameterType switch
            {
                Type.Byte => 1,
                Type.UInt16LE => 2,
                Type.UInt16BE => 2,
                _ => throw new NotImplementedException(),
            };
        }

        // Format a parameter value from bytes to string for decompilation
        public static string FormatValue(Type parameterType, byte[] bytes, ref int byteIndex)
        {
            return parameterType switch
            {
                Type.Byte => bytes[byteIndex++].ToString(),
                Type.UInt16LE => FormatUInt16LE(bytes, ref byteIndex),
                Type.UInt16BE => FormatUInt16BE(bytes, ref byteIndex),
                _ => throw new NotImplementedException(),
            };
        }

        // Parse a parameter value from string to bytes for compilation
        public static void ParseValue(Type parameterType, string stringValue, List<byte> outputBytes, int lineNum)
        {
            try
            {
                switch (parameterType)
                {
                    case Type.Byte:
                        outputBytes.Add(byte.Parse(stringValue));
                        break;
                    case Type.UInt16LE:
                        ParseUInt16LE(stringValue, outputBytes);
                        break;
                    case Type.UInt16BE:
                        ParseUInt16BE(stringValue, outputBytes);
                        break;
                    default:
                        throw new NotImplementedException();
                }
            }
            catch (FormatException)
            {
                throw new Exception($"[read] error: invalid argument '{stringValue}' at line {lineNum + 1}");
            }
        }

        private static string FormatUInt16LE(byte[] bytes, ref int byteIndex)
        {
            // Little-endian: LSB first, MSB second
            ushort value = (ushort)(bytes[byteIndex] | (bytes[byteIndex + 1] << 8));
            byteIndex += 2;
            return value.ToString();
        }

        private static string FormatUInt16BE(byte[] bytes, ref int byteIndex)
        {
            // Big-endian: MSB first, LSB second
            ushort value = (ushort)((bytes[byteIndex] << 8) | bytes[byteIndex + 1]);
            byteIndex += 2;
            return value.ToString();
        }

        private static void ParseUInt16LE(string stringValue, List<byte> outputBytes)
        {
            ushort value = ushort.Parse(stringValue);
            // Little-endian: LSB first, MSB second
            outputBytes.Add((byte)(value & 0xFF));
            outputBytes.Add((byte)(value >> 8));
        }

        private static void ParseUInt16BE(string stringValue, List<byte> outputBytes)
        {
            ushort value = ushort.Parse(stringValue);
            // Big-endian: MSB first, LSB second
            outputBytes.Add((byte)(value >> 8));
            outputBytes.Add((byte)(value & 0xFF));
        }
    }
}
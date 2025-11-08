using System;
using System.Collections.Generic;
using System.IO;

namespace LIN
{
    public class Program
    {
        private static bool silentMode = false;
        public static void PrintLine<T>(T line)
        {
            if (!silentMode)
                Console.WriteLine(line);
        }

        static string TrimExtension(string path)
        {
            int len = path.LastIndexOf('.');
            return len == -1 ? path : path.Substring(0, len);
        }

        static void DisplayUsage()
        {
            Console.WriteLine("\nlin_compiler: danganronpa script (de)compiler");
            Console.WriteLine("usage: lin_compiler [options] input [output]\n");
            Console.WriteLine("options:");
            Console.WriteLine("-h, --help\t\tdisplay this message");
            Console.WriteLine("-d, --decompile\t\tdecompile the input file or directory (default is compile)");
            Console.WriteLine("-s, --silent\t\tsuppress all non-error messages");
            Console.WriteLine("--indent-spaces N\tset indentation spaces per level (default: 2)");
            Console.WriteLine("\nBatch processing:");
            Console.WriteLine("  When input is a directory, all matching files will be processed:");
            Console.WriteLine("  - Decompile mode: processes all .lin files to .linscript");
            Console.WriteLine("  - Compile mode: processes all .linscript files to .lin");
            Console.WriteLine();
            Environment.Exit(0);
        }

        static void ProcessSingleFile(string input, string output, bool decompile, int indentSpaces = 2)
        {
            Script s = new(input, decompile);
            if (decompile)
            {
                ScriptWrite.WriteSource(s, output, indentSpaces);
            }
            else
            {
                ScriptWrite.WriteCompiled(s, output);
            }
        }

        static void ProcessDirectory(string directory, bool decompile, int indentSpaces = 2)
        {
            string searchPattern = decompile ? "*.lin" : "*.linscript";
            string[] files = Directory.GetFiles(directory, searchPattern);

            if (files.Length == 0)
            {
                Console.WriteLine($"No {searchPattern} files found in {directory}");
                return;
            }

            int successCount = 0;
            int errorCount = 0;

            foreach (string inputFile in files)
            {
                string fileName = Path.GetFileName(inputFile);
                string outputExtension = decompile ? ".linscript" : ".lin";
                string outputFile = Path.Combine(directory, Path.GetFileNameWithoutExtension(inputFile) + outputExtension);

                try
                {
                    if (!silentMode)
                    {
                        Console.WriteLine($"Processing {fileName}...");
                    }

                    ProcessSingleFile(inputFile, outputFile, decompile, indentSpaces);
                    successCount++;
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Error processing {fileName}: {ex.Message}");
                    errorCount++;
                }
            }

            Console.WriteLine($"\nBatch complete: {successCount} succeeded, {errorCount} failed");
        }

        static void Main(string[] args)
        {
            bool decompile = false;
            int indentSpaces = 2;
            string input, output = null;

            // Parse arguments
            List<string> plainArgs = [];
            if (args.Length == 0) DisplayUsage();

            for (int i = 0; i < args.Length; i++)
            {
                string a = args[i];
                if (a.StartsWith("-"))
                {
                    if (a == "-h" || a == "--help") { DisplayUsage(); }
                    if (a == "-d" || a == "--decompile") { decompile = true; }
                    if (a == "-s" || a == "--silent") { silentMode = true; }
                    if (a == "--indent-spaces")
                    {
                        if (i + 1 >= args.Length)
                        {
                            throw new Exception("error: --indent-spaces requires a numeric argument.");
                        }
                        if (!int.TryParse(args[i + 1], out indentSpaces) || indentSpaces < 0)
                        {
                            throw new Exception("error: --indent-spaces must be a non-negative integer.");
                        }
                        i++; // Skip the next argument since we consumed it
                    }
                }
                else
                {
                    plainArgs.Add(a);
                }
            }

            if (plainArgs.Count == 0 || plainArgs.Count > 2)
            {
                throw new Exception("error: incorrect arguments.");
            }

            input = plainArgs[0];
            if (plainArgs.Count == 2)
            {
                output = plainArgs[1];
            }

            // Check if input is a directory
            if (Directory.Exists(input))
            {
                if (output != null)
                {
                    throw new Exception("error: output path not supported for directory batch processing.");
                }
                ProcessDirectory(input, decompile, indentSpaces);
            }
            else if (File.Exists(input))
            {
                // Single file mode
                if (output == null)
                {
                    output = TrimExtension(input) + (decompile ? ".linscript" : ".lin");
                }
                ProcessSingleFile(input, output, decompile, indentSpaces);
            }
            else
            {
                throw new Exception($"error: input path not found: {input}");
            }
        }
    }
}

import { useEffect, useState } from "react";

export function useFile(filePath: string | null, encoding?: BufferEncoding): string | null {
  const [file, setFile] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (filePath) {
      window.electron.loadFile(filePath, encoding).then((result) => {
        if (mounted) {
          setFile(result);
        }
      });
    } else {
      // Use async operation to avoid synchronous setState warning
      Promise.resolve().then(() => {
        if (mounted) {
          setFile(null);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [filePath, encoding]);

  return file;
}

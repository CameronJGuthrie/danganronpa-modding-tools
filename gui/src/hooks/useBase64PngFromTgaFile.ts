import { useEffect, useState } from "react";

const cache: { [key: string]: string } = {};

export function useBase64PngFromTgaFile(filePath: string | null) {
  const [dataUrl, setDataUrl] = useState<string | null>(() => {
    // Check cache on initial render
    return filePath && filePath in cache ? cache[filePath] : null;
  });

  useEffect(() => {
    let isMounted = true;

    if (filePath === null) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setDataUrl(null);
        }
      });
      return;
    }

    // If cached, state was already initialized correctly
    if (filePath in cache) {
      // Only update if state is different (shouldn't happen with lazy init)
      if (cache[filePath] !== dataUrl) {
        Promise.resolve().then(() => {
          if (isMounted) {
            setDataUrl(cache[filePath]);
          }
        });
      }
      return;
    }

    // Fetch new data
    window.electron.tgaFileToPng(filePath).then((result) => {
      cache[filePath] = result;
      if (isMounted) {
        setDataUrl(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [filePath, dataUrl]);

  return dataUrl;
}

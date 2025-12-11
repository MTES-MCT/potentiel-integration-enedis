import { mkdir, readFile, writeFile } from "node:fs/promises";
import path, { dirname } from "node:path";
import type { FileReader, FileWriter } from "./type.js";

export const getLocalFileReader = (filename: string): FileReader => ({
  archive: async () => {},
  download: (filename) => readFile(filename, "utf-8"),
  list: async () => [filename],
});

export const getLocalFileWriter = (outputFolder: string): FileWriter => ({
  upload: async (filename, data) => {
    const filepath = path.join(outputFolder, filename);
    const dir = dirname(filepath);
    await mkdir(dir, { recursive: true });
    await writeFile(filepath, data);
  },
});

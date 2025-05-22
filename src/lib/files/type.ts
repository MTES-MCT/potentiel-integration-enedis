export interface FileReader {
  list(): Promise<string[]>;
  download(filename: string): Promise<string>;
  archive(filename: string): Promise<void>;
}
export interface FileWriter {
  upload(filename: string, data: string): Promise<void>;
}

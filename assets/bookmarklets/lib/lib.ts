export const copyToClipboard = async (str: string): Promise<void> => {
  await window.navigator.clipboard.writeText(str);
};

export class Logger {
  constructor(private prefix: string, private path: string[] = []) {
    this.path = path;
    this.path.push(prefix);
  }
  err(...args: any[]) {
    console.error(this.path.join("::"), ...args);
  }
  child(prefix: string) {
    return new Logger(prefix, this.path);
  }
  debug(...args: any[]) {
    console.debug(this.path.join("::"), ...args);
  }
  log(...args: any[]) {
    console.log(this.path.join("::"), ...args);
  }
}

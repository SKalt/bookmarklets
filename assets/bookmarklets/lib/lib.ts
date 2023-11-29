export const copyToClipboard = async (str: string): Promise<void> => {
  try {
    await window.navigator.clipboard.writeText(str);
  } catch (e) {
    console.error("Clipboard API not available", e);
    return new Promise((resolve) => {
      let i = document.createElement("textarea");
      i.value = str;
      i.select();
      document.execCommand("copy"); // deprecated but still portable
      resolve();
    });
  }
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
  info(...args: any[]) {
    console.log(this.path.join("::"), ...args);
  }
}

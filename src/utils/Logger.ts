import chalk from 'chalk';

export class Logger {
  static info(msg: string) {
    console.log(chalk.blue(msg));
  }
  static success(msg: string) {
    console.log(chalk.green(msg));
  }
  static error(msg: string) {
    console.log(chalk.red(msg));
  }

  static warn(message: string): void {
    console.log(chalk.yellow('⚠️  ' + message));
  }
  static title(msg: string) {
    console.log(chalk.bold.yellow(msg));
  }
  static divider() {
    console.log(chalk.gray('──────────────────────────────────────────────'));
  }
}

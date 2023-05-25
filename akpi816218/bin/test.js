import ansiColors from 'ansi-colors';
const { bold, cyanBright } = ansiColors;
process.stdout.write(bold(cyanBright('tsfm')) + '\n');

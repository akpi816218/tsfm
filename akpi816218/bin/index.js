#!/usr/bin/env node
// builtin
import { argv, cwd, stdout } from 'process';
// npmjs.com/package/ansi-colors
import ansiColors from 'ansi-colors';
const { blueBright, bold, cyanBright, greenBright, magentaBright, redBright, underline, yellowBright } = ansiColors;
// nothing to do here...
if (argv.length == 3 && argv[2].toLowerCase() == 'cdc') {
    stdout.write(`CDC: Central Defecation Center\n`);
    process.exit(0);
}
const helpText = `${redBright(`Usage: ${underline('tsfm')}`)}\n${yellowBright('Use arrow keys or WASD to navigate.')}\n${greenBright('C-c, C-d, C-q, C-w, q, or escape to quit.')}\n${blueBright('Navigating into linked directories is not supported at this time.')}\n`;
// Check if help flag is present
if (argv.length > 2) {
    stdout.write(helpText);
    process.exit(0);
}
// npmjs.com/package/blessed
import blessed from 'blessed';
const { box, list, screen } = blessed;
// builtin
import { accessSync } from 'fs';
// builtin
import { constants as fsConst, readdir, readFile } from 'fs/promises';
//
import { highlight } from 'cli-highlight';
// global variables
const State = {
    currentFiles: new Array(),
    currentFileNames: new Array(),
    selectedFile: 0,
    dir: cwd(),
    firstDir: cwd(),
    inHelp: false,
    inFile: false
};
// check if file is executable
function isExec(p) {
    let r;
    try {
        accessSync(p, fsConst.X_OK);
        r = true;
    }
    catch (e) {
        r = false;
    }
    return r;
}
// create blessed screen
const win = screen({ smartCSR: true });
win.title = 'tsfm';
// create main container (blessed list)
const listContainer = list({
    top: 'center',
    left: 'center',
    width: '100%',
    height: '100%',
    content: 'Whoopsy! Something went wrong. Try quitting and restarting the program.',
    border: 'line'
});
win.append(listContainer);
// render screen with current directory
renderDir();
const boxContainer = box({
    top: 'center',
    left: 'center',
    width: '100%',
    height: '100%',
    content: helpText,
    border: 'line',
    hidden: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
        track: {
            bg: 'cyan'
        },
        ch: ' '
    }
});
win.append(boxContainer);
// key event handlers
win.key('w', upHandler);
win.key('a', leftHandler);
win.key('s', downHandler);
win.key('d', rightHandler);
win.key('up', upHandler);
win.key('down', downHandler);
win.key('left', leftHandler);
win.key('right', rightHandler);
// help key handler
win.key('h', helpHandler);
// resize event handler
win.on('resize', () => {
    listContainer.width = '100%';
    listContainer.height = '100%';
    boxContainer.width = '100%';
    boxContainer.height = '100%';
});
// quit handlers
win.key(['escape', 'q', 'C-c', 'C-d', 'C-q', 'C-w'], () => win.destroy());
// render screen with current directory
async function renderDir() {
    State.selectedFile = 0;
    // get current directory contents with type
    State.currentFiles = await readdir(State.dir, { withFileTypes: true });
    if (State.currentFiles.length == 0) {
        listContainer.setItems([
            State.dir,
            '  ^ You are definitely not here, why would you be?',
            'Press h for help.',
            '',
            redBright('You find yourself in a very strange place...'),
            yellowBright('There are no files to be seen, nor directories.'),
            greenBright('You are utterly alone.'),
            cyanBright('You marvel at the lack of color.'),
            blueBright('You wonder if you are dreaming.'),
            magentaBright('You are not dreaming.')
        ]);
        win.render();
        return;
    }
    State.currentFileNames = State.currentFiles.map((file) => {
        if (file.isDirectory())
            return blueBright(`${file.name}/`);
        if (file.isSymbolicLink())
            return cyanBright(`${file.name}@`);
        if (isExec(file.name))
            return yellowBright(`${file.name}*`);
        return file.name;
    });
    // render screen
    await reRender();
}
async function reRender() {
    // set container content
    listContainer.setItems(State.currentFileNames.map((file, i) => i == State.selectedFile ? bold(`> ${file}`) : `  ${file}`));
    // select file for "scrolling"
    listContainer.select(State.selectedFile);
    // render screen
    win.render();
}
// key event handlers
async function upHandler() {
    if (State.inHelp)
        return;
    if (State.inFile) {
        boxContainer.scroll(-1);
        win.render();
        return;
    }
    // change selected file index
    if (State.selectedFile > 0)
        State.selectedFile--;
    else
        State.selectedFile = State.currentFileNames.length - 1;
    // re-render screen
    await reRender();
}
async function downHandler() {
    if (State.inHelp)
        return;
    if (State.inFile) {
        boxContainer.scroll(1);
        win.render();
        return;
    }
    if (State.selectedFile < State.currentFileNames.length - 1)
        State.selectedFile++;
    else
        State.selectedFile = 0;
    // re-render screen
    await reRender();
}
async function leftHandler() {
    if (State.inHelp)
        return;
    if (State.inFile) {
        boxContainer.hide();
        listContainer.show();
        win.render();
        State.inFile = false;
        return;
    }
    // system bell character
    if (State.dir == '/')
        stdout.write('\u0007');
    else {
        State.dir = State.dir.split('/').slice(0, -1).join('/');
        if (State.dir == '')
            State.dir = '/';
        // re-render screen
        await renderDir();
    }
}
async function rightHandler() {
    if (State.inHelp || State.inFile)
        return;
    const selected = State.currentFiles[State.selectedFile];
    if (selected.isDirectory()) {
        // change directory
        State.dir += `/${State.currentFiles[State.selectedFile].name}`;
        if (State.dir.slice(0, 2) == '//')
            State.dir = State.dir.slice(1);
        // re-render screen
        await renderDir();
    }
    else if (selected.isFile()) {
        State.inFile = true;
        boxContainer.setContent(highlight((await readFile(`${State.dir}/${State.currentFiles[State.selectedFile].name}`)).toString()));
        listContainer.hide();
        boxContainer.show();
        win.render();
    }
}
async function helpHandler() {
    State.inHelp = !State.inHelp;
    if (State.inHelp) {
        State.firstDir = State.dir;
        listContainer.hide();
        boxContainer.show();
    }
    else {
        boxContainer.hide();
        listContainer.show();
        State.dir = State.firstDir;
        State.selectedFile = 0;
        renderDir();
    }
    // re-render screen
    await reRender();
}
async function homeHandler() {
    if (State.inHelp)
        return;
    State.dir = State.firstDir;
    // re-render screen
    await renderDir();
}

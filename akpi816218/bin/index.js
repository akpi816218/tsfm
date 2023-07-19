#!/usr/bin/env node
// ! Make sure to change the version number in both package.json and src/index.ts
const version = '2.3.3';
// https://npmjs.com/package/npm-registry-fetch
import fetch from 'npm-registry-fetch';
// builtin
import { argv, cwd, exit, stdout } from 'process';
const cmnd = argv.length > 2 ? `${argv[2].toLowerCase()}` : null;
if (cmnd == 'version' || cmnd == 'v' || cmnd == '-v' || cmnd == '--version') {
    stdout.write(`Local installation is tsfm @${version}\nFetching package info from NPM, stand by for up to 5 seconds...\n`);
    stdout.write(`tsfm@latest version published on NPM: ${(await fetch
        .json('tsfm', {
        timeout: 5000
    })
        .catch(() => {
        stdout.write('Failed to fetch version info from NPM\n');
        exit(1);
    }))['dist-tags'].latest}\n`);
    exit(0);
}
// https://npmjs.com/package/ansi-colors
import ansiColors from 'ansi-colors';
const { blueBright, bold, cyanBright, greenBright, magentaBright, redBright, underline, yellowBright } = ansiColors;
function orangeBright(text) {
    return redBright(yellowBright(text));
}
function purpleBright(text) {
    return redBright(magentaBright(text));
}
// nothing to do here...
if (argv.length == 3 && cmnd == 'cdc') {
    stdout.write(`${redBright('C')}${orangeBright('D')}${yellowBright('C')}${greenBright(':')} ${blueBright('C')}${purpleBright('e')}${redBright('n')}${orangeBright('t')}${yellowBright('r')}${greenBright('a')}${blueBright('l')} ${purpleBright('D')}${redBright('e')}${orangeBright('f')}${yellowBright('e')}${greenBright('c')}${blueBright('a')}${purpleBright('t')}${redBright('i')}${orangeBright('o')}${yellowBright('n')} ${greenBright('C')}${blueBright('e')}${purpleBright('n')}${redBright('t')}${orangeBright('e')}${yellowBright('r')}\n`);
    process.exit(0);
}
const helpText = `${redBright(`Usage: ${underline('tsfm')}`)}\n${yellowBright('Use arrow keys, hjkl, or WASD to navigate.')}\n${greenBright('C-c, C-d, C-q, C-w, q, or escape to quit.')}\n${blueBright("Press '?' or '/' for help.")}\n${magentaBright("Run 'tsfm help' for help, or 'tsfm v' for version info.")}\n\ntsfm v${version}\n`;
// Check if help flag is present
if (argv.length > 2 && cmnd == 'help') {
    stdout.write(helpText);
    process.exit(0);
}
// https://npmjs.com/package/blessed
import blessed from 'blessed';
const { box, list, screen } = blessed;
// builtin
import { accessSync, readdirSync } from 'fs';
// builtin
import { join, resolve } from 'path';
// builtin
import { access, constants, readdir, readFile } from 'fs/promises';
// https://npmjs.com/package/cli-highlight
import { highlight } from 'cli-highlight';
// My own package: @feces-cli/internals
// https://npmjs.com/package/@feces-cli/internals
import { commandHandlers } from '@feces-cli/internals';
// global variables
const State = {
    currentFiles: new Array(),
    currentFileNames: new Array(),
    selectedFile: 0,
    dir: cwd(),
    dirIndex: {},
    firstDir: cwd(),
    inHelp: false,
    inFile: false,
    inModal: false
};
if (argv.length === 3) {
    try {
        accessSync(argv[2], constants.F_OK);
        readdirSync(argv[2]);
        State.dir = resolve(argv[2]);
    }
    catch {
        stdout.write(redBright(`Whoopsy! '${argv[2]}' is not a directory, does not exist, or cannot be read. Try again, or run 'tsfm help' for help.\n`));
        process.exit(1);
    }
}
// check if file is executable
function isExec(path) {
    try {
        accessSync(path, constants.X_OK);
        return true;
    }
    catch (err) {
        return false;
    }
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
const modalContainer = box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    content: '...',
    border: 'line',
    hidden: true,
    valign: 'middle',
    align: 'center'
});
win.append(modalContainer);
// key event handlers
win.key('w', upHandler);
win.key('a', leftHandler);
win.key('s', downHandler);
win.key('d', rightHandler);
win.key('up', upHandler);
win.key('down', downHandler);
win.key('left', leftHandler);
win.key('right', rightHandler);
win.key('h', leftHandler);
win.key('j', upHandler);
win.key('k', downHandler);
win.key('l', rightHandler);
// help key handler
win.key('/', helpHandler);
win.key('?', helpHandler);
// feces key handlers
win.key('p', plopHandler);
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
    State.selectedFile = State.dirIndex[State.dir] ?? 0;
    // get current directory contents with type
    State.currentFiles = await readdir(State.dir, { withFileTypes: true });
    if (State.currentFiles.length == 0) {
        listContainer.setItems([
            State.dir,
            '  ^ You are definitely not here, why would you be?',
            "Press '?' or '/' for help.",
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
        if (isExec(resolve(join(State.dir, file.name))))
            return yellowBright(`${file.name}*`);
        return file.name;
    });
    // render screen
    await reRender();
}
async function reRender() {
    // set container content
    listContainer.setItems(State.currentFileNames.map((file, index) => {
        if (index === State.selectedFile)
            return bold(`> ${file}`);
        else
            return `  ${file}`;
    }));
    // select file for "scrolling"
    listContainer.select(State.selectedFile);
    // render screen
    win.render();
}
// key event handlers
async function upHandler() {
    if (State.inHelp || State.inModal)
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
    if (State.inHelp || State.inModal)
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
    if (State.inHelp || State.inModal)
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
        saveDirIndex();
        State.dir = State.dir.split('/').slice(0, -1).join('/');
        if (State.dir == '')
            State.dir = '/';
        // re-render screen
        await renderDir();
    }
}
async function rightHandler() {
    if (State.inHelp || State.inModal || State.inFile)
        return;
    const selected = State.currentFiles[State.selectedFile];
    if (selected.isDirectory() || selected.isSymbolicLink()) {
        saveDirIndex();
        // change directory
        State.dir += `/${State.currentFiles[State.selectedFile].name}`;
        if (State.dir.slice(0, 2) == '//')
            State.dir = State.dir.slice(1);
        // re-render screen
        await renderDir();
    }
    else if (selected.isFile()) {
        State.inFile = true;
        const fileContent = (await readFile(`${State.dir}/${State.currentFiles[State.selectedFile].name}`)).toString();
        boxContainer.setContent((fileContent.length * 2 + 2) > 128 * 1024 ? fileContent : await highlight(fileContent));
        listContainer.hide();
        boxContainer.show();
        win.render();
    }
    else if (selected.isSymbolicLink()) {
        try {
            // if directory
            await access(State.dir + `/${State.currentFiles[State.selectedFile].name}`, constants.O_DIRECTORY);
            // change directory
            saveDirIndex();
            State.dir += `/${State.currentFiles[State.selectedFile].name}`;
            if (State.dir.slice(0, 2) == '//')
                State.dir = State.dir.slice(1);
            // re-render screen
            await renderDir();
        }
        catch { }
        try {
            await access(State.dir + `/${State.currentFiles[State.selectedFile].name}`, constants.F_OK);
            State.inFile = true;
            boxContainer.setContent(highlight((await readFile(`${State.dir}/${State.currentFiles[State.selectedFile].name}`)).toString()));
            listContainer.hide();
            boxContainer.show();
            win.render();
        }
        catch { }
    }
}
async function helpHandler() {
    if (State.inModal)
        return;
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
    win.render();
}
// feces command handlers
async function plopHandler() {
    if (State.inHelp || State.inModal || State.inFile)
        return;
    // plop file
    const filedata = await commandHandlers.plop(State.dir, State.currentFiles[State.selectedFile].name);
    State.inModal = true;
    // display modal
    modalContainer.setContent(yellowBright(`Sucessfully plopped ${filedata.originalPath}!\nThe file can be plunged using \n'feces plunge ${filedata.trashedPath
        .split('/')
        .at(-1)}' (assuming you have installed 'feces-cli').`));
    modalContainer.show();
    win.render();
    // hide modal after 2.5 seconds
    setTimeout(async () => {
        modalContainer.hide();
        State.inModal = false;
        renderDir();
    }, 2_500);
}
function saveDirIndex() {
    State.dirIndex[State.dir] = State.selectedFile;
}

#!/usr/bin/env node
import blessed from 'blessed';
const { list, screen } = blessed;
import { accessSync } from 'fs';
import { constants as fsConst, readdir } from 'fs/promises';
import { cwd } from 'process';
import ansiColors from 'ansi-colors';
const { blueBright, bold, cyanBright, yellowBright } = ansiColors;
let currentFiles = [], selectedFile = 0, dir = cwd();
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
const win = screen({ smartCSR: true });
win.title = 'tsfm';
win.key('w', upHandler);
win.key('a', async () => { });
win.key('s', downHandler);
win.key('d', async () => { });
win.key('up', upHandler);
win.key('down', downHandler);
win.key('left', async () => { });
win.key('right', async () => { });
win.key(['escape', 'q', 'C-c', 'C-q', 'C-w'], () => process.exit(0));
win.on('resize', () => {
    container.width = '100%';
    container.height = '100%';
});
const container = list({
    top: 'center',
    left: 'center',
    width: '100%',
    height: '100%',
    content: 'Loading...',
    border: 'line'
});
win.append(container);
async function renderDir() {
    currentFiles = (await readdir(dir, { withFileTypes: true })).map((file) => {
        if (file.isDirectory())
            return blueBright(`${file.name}/`);
        if (file.isSymbolicLink())
            return cyanBright(`${file.name}@`);
        if (isExec(file.name))
            return yellowBright(`${file.name}*`);
        return file.name;
    });
    await reRender();
}
async function reRender() {
    container.setItems(currentFiles.map((file, i) => i === selectedFile ? bold(`> ${file}`) : `  ${file}`));
    container.select(selectedFile);
    win.render();
}
async function upHandler() {
    if (selectedFile > 0)
        selectedFile--;
    else
        selectedFile = currentFiles.length - 1;
    await reRender();
}
async function downHandler() {
    if (selectedFile < currentFiles.length - 1)
        selectedFile++;
    else
        selectedFile = 0;
    await reRender();
}
renderDir();

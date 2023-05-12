#!/usr/bin/env node

// builtin
import { argv, cwd, stdout } from 'process';
// npmjs.com/package/ansi-colors
import ansiColors from 'ansi-colors';
const {
	blueBright,
	bold,
	cyanBright,
	greenBright,
	redBright,
	underline,
	unstyle,
	yellowBright
} = ansiColors;

// nothing to do here...
if (argv.length == 3 && argv[2].toLowerCase() == 'cdc') {
	stdout.write(`CDC: Central Defecation Center`);
	process.exit(0);
}

// Check if help flag is present
if (argv.length > 2) {
	stdout.write(
		`${redBright(`Usage: ${underline('tsfm')}`)}\n${yellowBright(
			'Use arrow keys or WASD to navigate.'
		)}\n${greenBright(
			'C-c, C-d, C-q, C-w, q, or escape to quit.'
		)}\n${blueBright(
			'Navigating into linked directories is not supported at this time.'
		)}\n`
	);
	process.exit(0);
}

// npmjs.com/package/blessed
import blessed from 'blessed';
const { list, screen } = blessed;
// builtin
import { accessSync } from 'fs';
// builtin
import { constants as fsConst, readdir } from 'fs/promises';

// global variables
let currentFiles: string[] = [],
	selectedFile = 0,
	dir = cwd();
// initialize first-tim constants
const firstDir = cwd();

// check if file is executable
function isExec(p: string) {
	let r;
	try {
		accessSync(p, fsConst.X_OK);
		r = true;
	} catch (e) {
		r = false;
	}
	return r;
}

// create blessed screen
const win = screen({ smartCSR: true });
win.title = 'tsfm';

// create main container (blessed list)
const container = list({
	top: 'center',
	left: 'center',
	width: '100%',
	height: '100%',
	content: 'Loading...',
	border: 'line'
});
win.append(container);

// render screen with current directory
renderDir();

// key event handlers
win.key('w', upHandler);
win.key('a', leftHandler);
win.key('s', downHandler);
win.key('d', rightHandler);
win.key('up', upHandler);
win.key('down', downHandler);
win.key('left', leftHandler);
win.key('right', rightHandler);
win.key('h', homeHandler);
win.key('home', homeHandler);
// resize event handler
win.on('resize', () => {
	container.width = '100%';
	container.height = '100%';
});
// quit handlers
win.key(['escape', 'q', 'C-c', 'C-d', 'C-q', 'C-w'], () => win.destroy());

// render screen with current directory
async function renderDir() {
	// get current directory contents with type
	currentFiles = (await readdir(dir, { withFileTypes: true })).map((file) => {
		if (file.isDirectory()) return blueBright(`${file.name}/`);
		if (file.isSymbolicLink()) return cyanBright(`${file.name}@`);
		if (isExec(file.name)) return yellowBright(`${file.name}*`);
		return file.name;
	});
	// render screen
	await reRender();
}

async function reRender() {
	// set container content
	container.setItems(
		currentFiles.map((file, i) =>
			i == selectedFile ? bold(`> ${file}`) : `  ${file}`
		)
	);
	// select file for "scrolling"
	container.select(selectedFile);
	// render screen
	win.render();
}

// key event handlers
async function upHandler() {
	// change selected file index
	if (selectedFile > 0) selectedFile--;
	else selectedFile = currentFiles.length - 1;
	// re-render screen
	await reRender();
}
async function downHandler() {
	if (selectedFile < currentFiles.length - 1) selectedFile++;
	else selectedFile = 0;
	// re-render screen
	await reRender();
}
async function leftHandler() {
	// system bell character
	if (dir == '/') stdout.write('\u0007');
	else {
		dir = dir.split('/').slice(0, -1).join('/');
		if (dir == '') dir = '/';
		selectedFile = 0;
		// re-render screen
		await renderDir();
	}
}
async function rightHandler() {
	const activeDir = unstyle(currentFiles[selectedFile]);
	if (!activeDir.endsWith('/')) stdout.write('\u0007');
	else {
		// change directory
		dir += `/${activeDir.slice(0, -1)}`;
		selectedFile = 0;
		// re-render screen
		await renderDir();
	}
}
async function homeHandler() {
	dir = firstDir;
	// re-render screen
	await renderDir();
}

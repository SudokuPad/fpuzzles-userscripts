// ==UserScript==
// @name         FPuzzles-FogLight
// @version      1.5
// @downloadURL  https://github.com/SudokuPad/fpuzzles-userscripts/raw/main/src/fpuzzles-foglight/Fpuzzles-FogLight.user.js
// @updateURL    https://github.com/SudokuPad/fpuzzles-userscripts/raw/main/src/fpuzzles-foglight/Fpuzzles-FogLight.user.js
// @description  Place single cell light in fog (or fog entire board)
// @author       Sven Neumann <sven@svencodes.com>
// @match        https://*.f-puzzles.com/*
// @match        https://f-puzzles.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
	'use strict';
	const id = 'foglight';
	const name = 'Fog Light';
	const descriptionFogLight = ['Adds puzzle fog.', 'Each placed bulb represents an unfogged cell.'];
	const descriptionFogLightNeg = ['Adds puzzle fog across entire puzzle (if no bulbs are placed).'];

	const doShim = () => {
		const {exportPuzzle, importPuzzle, drawConstraints, categorizeTools, compressor} = window;
		const origExportPuzzle = exportPuzzle;
		window.exportPuzzle = function exportPuzzle(includeCandidates) {
			const compressed = origExportPuzzle(includeCandidates);
			const puzzle = JSON.parse(compressor.decompressFromBase64(compressed));
			if(puzzle[id]) puzzle[id] = puzzle[id].map(({cell}) => cell);
			return compressor.compressToBase64(JSON.stringify(puzzle));
		};

		const origImportPuzzle = importPuzzle;
		window.importPuzzle = function importPuzzle(string, clearHistory) {
			const puzzle = JSON.parse(compressor.decompressFromBase64(string));
			if(Array.isArray(puzzle[id])) puzzle[id] = puzzle[id].map(cell => ({cell}));
			else delete puzzle[id];
			string = compressor.compressToBase64(JSON.stringify(puzzle));
			origImportPuzzle(string, clearHistory);
		};

		const origDrawConstraints = drawConstraints;
		window.drawConstraints = function drawConstraints(...args) {
			origDrawConstraints(...args);
			for(const c of constraints[id] || []) c.show();
		};

		window[id] = function drawFoglight(cells) {
			const {ctx, cellSL} = window;
			if(cells && cells.length) this.cell = cells[0];
			this.show = function show() {
				if(!this.cell) return;
				ctx.save();
				const size = 0.7;
				ctx.translate(this.cell.x + cellSL / 2, this.cell.y + cellSL / 2);
				ctx.globalAlpha = 0.3;
				ctx.font = (cellSL * 0.5 * size) + 'px Arial';
				ctx.fillText('💡', 0, cellSL * 0.3 * size);
				ctx.restore();
			};
		};

		const origCategorizeTools = categorizeTools;
		window.categorizeTools = () => {
			origCategorizeTools();
			const {toolConstraints, perCellConstraints, oneCellAtATimeTools, tools, negativableConstraints} = window;
			toolConstraints.push(name);
			perCellConstraints.push(name);
			oneCellAtATimeTools.push(name);
			tools.push(name);
			descriptions[name] = descriptionFogLight;
			descriptions[name+'-'] = descriptionFogLightNeg;
			negativableConstraints.push(name);
		};
		if (window.boolConstraints) {
			let prevButtons = buttons.splice(0, buttons.length);
			window.onload();
			buttons.splice(0, buttons.length);
			for (let i = 0; i < prevButtons.length; i++) {
				buttons.push(prevButtons[i]);
			}
		}
	};

	const checkGlobals = () => ['grid', 'exportPuzzle', 'importPuzzle', 'categorizeTools', 'drawConstraints'].every(key => window[key] !== undefined);
	if(checkGlobals()) {
		doShim();
	}
	else {
		const intervalId = setInterval(() => {
			if(!checkGlobals()) return;
			clearInterval(intervalId);
			doShim();
		}, 16);
	}
})();

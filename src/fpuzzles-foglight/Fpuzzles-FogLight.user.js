// ==UserScript==
// @name         FPuzzles-FogLight
// @version      1.0
// @description  Place single cell light in fog
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

	const doShim = () => {
		const {exportPuzzle, importPuzzle, drawConstraints, categorizeTools, compressor} = window;
		const origExportPuzzle = exportPuzzle;
		window.exportPuzzle = function exportPuzzle(includeCandidates) {
			const compressed = origExportPuzzle(includeCandidates);
			const puzzle = JSON.parse(compressor.decompressFromBase64(compressed));
			console.log('exportPuzzle > puzzle:', puzzle);
			if(puzzle[id]) puzzle[id] = puzzle[id].map(({cell}) => cell);
			return compressor.compressToBase64(JSON.stringify(puzzle));
		};

		const origImportPuzzle = importPuzzle;
		window.importPuzzle = function importPuzzle(string, clearHistory) {
			const puzzle = JSON.parse(compressor.decompressFromBase64(string));
			console.log('importPuzzle > puzzle:', puzzle);
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
			const {toolConstraints, perCellConstraints, oneCellAtATimeTools, tools} = window;
			toolConstraints.push(name);
			perCellConstraints.push(name);
			oneCellAtATimeTools.push(name);
			tools.push(name);
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

	const intervalId = setInterval(() => {
		if (typeof grid === 'undefined' ||
			typeof exportPuzzle === 'undefined' ||
			typeof importPuzzle === 'undefined' ||
			typeof drawConstraints === 'undefined' ||
			typeof categorizeTools === 'undefined') {
			return;
		}

		clearInterval(intervalId);
		doShim();
	}, 16);
})();

<script lang="ts">
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import { Compartment, EditorState } from "@codemirror/state";
import {
	EditorView,
	type ViewUpdate,
	drawSelection,
	dropCursor,
	highlightActiveLineGutter,
	keymap,
	lineNumbers,
} from "@codemirror/view";
import { onMount, createEventDispatcher } from "svelte";
import type { BibTeXSyntaxError } from "../parsers/bibtexParser";
import CopyButton from "./CopyButton.svelte";
import ViewToggleButton from "./ViewToggleButton.svelte";
import TableView from "./TableView.svelte";
import {
	bibtexLanguage,
	bibtexSyntaxHighlighting,
} from "./codemirrorExtensions";

export let bibtex: string;
export let error: BibTeXSyntaxError | undefined;
export let isTableView: boolean;

const dispatch = createEventDispatcher<{
	toggle: undefined;
	update: string;
}>();

let editorRef: HTMLElement;
let cmEditor: EditorView | undefined;
let lintCompartment: Compartment;

function createEditor() {
	if (!editorRef || cmEditor) return;

	const onUpdate = EditorView.updateListener.of((v: ViewUpdate) => {
		if (cmEditor && v.docChanged) {
			bibtex = cmEditor.state.doc.toString();
		}
	});

	lintCompartment = new Compartment();

	cmEditor = new EditorView({
		parent: editorRef,
		state: EditorState.create({
			doc: bibtex,
			extensions: [
				lineNumbers(),
				highlightActiveLineGutter(),
				dropCursor(),
				EditorState.allowMultipleSelections.of(true),
				bracketMatching(),
				drawSelection(),
				bibtexLanguage(),
				bibtexSyntaxHighlighting(),
				keymap.of([...defaultKeymap,...historyKeymap, indentWithTab]),
				history(),
				onUpdate,
				lintCompartment.of([]),
			],
		}),
	});

	cmEditor.focus();
	window.cmEditor = cmEditor;
}

onMount(() => {
	createEditor();
});

// Recreate editor when switching from table to editor view
$: if (!isTableView && editorRef && !cmEditor) {
	createEditor();
}

$: {
	cmEditor?.dispatch({
		effects: lintCompartment.reconfigure(
			linter(() => {
				if (error && cmEditor) {
					const line = cmEditor.state.doc.line(error.line);
					const from = line.from;
					const to = line.to;
					return [{ from, to, severity: "error", message: "Syntax Error" }];
				}
				return [];
			}),
		),
	});
}

$: {
	if (cmEditor && bibtex !== cmEditor.state.doc.toString()) {
		const currentPos = cmEditor.state.selection.main.head;
		cmEditor.dispatch({
			changes: { from: 0, to: cmEditor.state.doc.length, insert: bibtex },
			selection: { anchor: Math.min(currentPos, bibtex.length) }
		});
	}
}

// When bibtex changes externally (from tidy operations), we need to invalidate table positions
let lastExternalBibtex = bibtex;
$: {
	if (bibtex !== lastExternalBibtex && !isTableView) {
		// This is an external change (like from tidy), invalidate positions
		lastExternalBibtex = bibtex;
	}
}

function handleViewToggle() {
	if (!isTableView && cmEditor) {
		// Switching to table view - destroy editor
		cmEditor.destroy();
		cmEditor = undefined;
	}
	dispatch('toggle');
}

function handleTableUpdate(event: CustomEvent<string>) {
	dispatch('update', event.detail);
}
</script>

<main id="editor">
	<CopyButton {bibtex} />
	<ViewToggleButton {isTableView} on:toggle={handleViewToggle} />

	{#if isTableView}
		<TableView {bibtex} on:update={handleTableUpdate} />
	{:else}
		<div bind:this={editorRef} class="codemirror-container"></div>
	{/if}
</main>

<style>
#editor {
	flex-grow: 1;
	position: relative;
	overflow: hidden;
}

.codemirror-container {
	height: 100%;
}

:global(.cm-editor) {
	color: var(--dark-gray);
	height: 100%;
}

:global(.cm-editor .cm-scroller) {
	font: var(--mono-normal);
	font-size: 14px;
	line-height: 1.3em;
	padding: 12px 0 12px 0;
}
:global(.cm-editor .cm-gutters) {
	background: var(--main-bg);
	border-right: 14px solid var(--main-bg);
	color: var(--light6);
	padding-left: 12px;
}
:global(.cm-editor .cm-activeLineGutter) {
	background: var(--main-bg);
	color: var(--light1);
}
:global(.cm-editor .cm-gutters .cm-gutter) {
	min-width: 32px;
}
:global(.cm-editor .cm-selectionBackground) {
	background: #283655 !important;
}
:global(.cm-editor .cm-cursor) {
	border-left: 2px solid #ffffec;
}
:global(.cm-editor .cm-lintRange-error) {
	background: none;
	border-bottom: 2px solid var(--red);
}
</style>
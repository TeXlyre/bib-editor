<script lang="ts">
import { ASTProxy } from "../ASTProxy";
import { parseBibTeX } from "../parsers/bibtexParser";
import type { EntryNode, FieldNode } from "../parsers/bibtexParser";
import { createEventDispatcher } from "svelte";

export let bibtex: string;

const dispatch = createEventDispatcher<{ update: string }>();

type EntryPosition = {
	entry: EntryNode;
	keyRange?: { start: number; end: number };
	typeRange: { start: number; end: number };
	fields: Array<{
		field: FieldNode;
		nameRange: { start: number; end: number };
		valueRange: { start: number; end: number };
	}>;
};

let entryList: EntryNode[] = [];
let sortedEntries: EntryNode[] = [];
let allFields: string[] = [];
let sortColumn = "";
let sortDirection: "asc" | "desc" = "asc";
let editingCell: { entryIndex: number; field: string } | null = null;
let editValue = "";
let positions: EntryPosition[] = [];
let lastBibtex = "";

$: {
	try {
		const ast = parseBibTeX(bibtex);
		const cache = new ASTProxy(ast);
		entryList = cache.entries();

		// Only rebuild positions if this is external change (not our edit)
		if (bibtex !== lastBibtex && positions.length === 0) {
			positions = buildPositions(bibtex, entryList);
		}
		lastBibtex = bibtex;

		const fieldSet = new Set<string>();
		for (const entry of entryList) {
			for (const field of entry.fields) {
				fieldSet.add(field.name.toLowerCase());
			}
		}
		allFields = ["key", ...Array.from(fieldSet).sort()];

		sortedEntries = sortColumn ? applySorting([...entryList]) : [...entryList];
	} catch {
		entryList = [];
		sortedEntries = [];
		allFields = [];
		positions = [];
	}
}

function buildPositions(text: string, entries: EntryNode[]): EntryPosition[] {
	return entries.map(entry => {
		const typePattern = new RegExp(`@${escapeRegex(entry.parent.command)}\\s*\\{`, 'i');
		const entryStart = text.search(typePattern);
		if (entryStart === -1) return null;

		const typeStart = entryStart + 1;
		const typeEnd = typeStart + entry.parent.command.length;

		let keyRange: { start: number; end: number } | undefined;
		if (entry.key) {
			const afterBrace = text.indexOf('{', entryStart) + 1;
			const keyMatch = text.substring(afterBrace).indexOf(entry.key);
			if (keyMatch !== -1) {
				const keyStart = afterBrace + keyMatch;
				keyRange = { start: keyStart, end: keyStart + entry.key.length };
			}
		}

		const fields = entry.fields.map(field => {
			const fieldPattern = new RegExp(`\\b${escapeRegex(field.name)}\\s*=`, 'i');
			const match = text.substring(entryStart).search(fieldPattern);
			if (match === -1) return null;

			const nameStart = entryStart + match;
			const nameEnd = nameStart + field.name.length;
			const equalPos = text.indexOf('=', nameEnd);

			let valueStart = equalPos + 1;
			while (valueStart < text.length && /\s/.test(text[valueStart])) valueStart++;

			let valueEnd = valueStart;
			let braceCount = 0;
			let inQuotes = false;

			while (valueEnd < text.length) {
				const char = text[valueEnd];
				if (char === '"' && braceCount === 0) inQuotes = !inQuotes;
				else if (char === '{' && !inQuotes) braceCount++;
				else if (char === '}' && !inQuotes) {
					if (braceCount === 0) break;
					braceCount--;
				} else if ((char === ',' || char === '}') && braceCount === 0 && !inQuotes) break;
				valueEnd++;
			}

			while (valueEnd > valueStart && /\s/.test(text[valueEnd - 1])) valueEnd--;

			return {
				field,
				nameRange: { start: nameStart, end: nameEnd },
				valueRange: { start: valueStart, end: valueEnd }
			};
		}).filter(Boolean);

		return {
			entry,
			keyRange,
			typeRange: { start: typeStart, end: typeEnd },
			fields
		};
	}).filter(Boolean);
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getFieldValue(entry: EntryNode, fieldName: string): string {
	if (fieldName === "key") return entry.key || "";
	const field = entry.fields.find(f => f.name.toLowerCase() === fieldName);
	return field ? field.value.concat.map(node => node.value).join(" ") : "";
}

function getEntryType(entry: EntryNode): string {
	return entry.parent.command;
}

function applySorting(entries: EntryNode[]): EntryNode[] {
	return entries.sort((a, b) => {
		let aVal: string, bVal: string;

		if (sortColumn === "type") {
			aVal = getEntryType(a).toLowerCase();
			bVal = getEntryType(b).toLowerCase();
		} else {
			aVal = getFieldValue(a, sortColumn).toLowerCase();
			bVal = getFieldValue(b, sortColumn).toLowerCase();
		}

		const result = aVal.localeCompare(bVal);
		return sortDirection === "asc" ? result : -result;
	});
}

function sortBy(column: string) {
	if (sortColumn === column) {
		sortDirection = sortDirection === "asc" ? "desc" : "asc";
	} else {
		sortColumn = column;
		sortDirection = "asc";
	}
	sortedEntries = applySorting([...entryList]);
}

function startEdit(entryIndex: number, field: string) {
	const entry = sortedEntries[entryIndex];
	if (!entry) return;

	editingCell = { entryIndex, field };
	editValue = field === "type" ? getEntryType(entry) : getFieldValue(entry, field);
}

function saveEdit() {
	if (!editingCell) return;

	const entry = sortedEntries[editingCell.entryIndex];
	const originalIndex = entryList.indexOf(entry);
	const pos = positions[originalIndex];
	if (!entry || !pos) return;

	try {
		let newText = bibtex;
		let offset = 0;

		if (editingCell.field === "key") {
			if (pos.keyRange) {
				newText = replaceRange(newText, pos.keyRange, editValue);
				offset = editValue.length - (pos.keyRange.end - pos.keyRange.start);
				pos.keyRange.end = pos.keyRange.start + editValue.length;
			} else if (editValue.trim()) {
				const insertPos = pos.typeRange.end + 1;
				const keyText = `${editValue},`;
				newText = insertAt(newText, insertPos, keyText);
				offset = keyText.length;
				pos.keyRange = { start: insertPos, end: insertPos + editValue.length };
			}
			entry.key = editValue || undefined;
		} else if (editingCell.field === "type") {
			newText = replaceRange(newText, pos.typeRange, editValue);
			offset = editValue.length - (pos.typeRange.end - pos.typeRange.start);
			pos.typeRange.end = pos.typeRange.start + editValue.length;
			entry.parent.command = editValue;
		} else {
			const fieldPos = pos.fields.find(f => f.field.name.toLowerCase() === editingCell!.field);

			if (editValue.trim() === "") {
				if (fieldPos) {
					const start = fieldPos.nameRange.start;
					let end = fieldPos.valueRange.end;
					while (end < newText.length && /[\s,]/.test(newText[end])) {
						if (newText[end] === ',') { end++; break; }
						end++;
					}
					newText = removeRange(newText, start, end);
					offset = -(end - start);
					pos.fields = pos.fields.filter(f => f !== fieldPos);
					entry.fields = entry.fields.filter(f => f.name.toLowerCase() !== editingCell!.field);
				}
			} else {
				if (fieldPos) {
					const formattedValue = `{${editValue}}`;
					newText = replaceRange(newText, fieldPos.valueRange, formattedValue);
					offset = formattedValue.length - (fieldPos.valueRange.end - fieldPos.valueRange.start);
					fieldPos.valueRange.end = fieldPos.valueRange.start + formattedValue.length;

					const field = entry.fields.find(f => f.name.toLowerCase() === editingCell!.field);
					if (field) {
						field.value.concat = [{ type: "braced", parent: field.value, value: editValue }];
					}
				} else {
					const insertPos = findInsertPosition(newText, pos.typeRange.start);
					const fieldText = `,\n  ${editingCell.field} = {${editValue}}`;
					newText = insertAt(newText, insertPos, fieldText);
					offset = fieldText.length;

					const newField = {
						type: "field" as const,
						parent: entry,
						name: editingCell.field,
						whitespacePrefix: "",
						hasComma: false,
						value: {
							type: "concat" as const,
							parent: null as any,
							concat: [{ type: "braced" as const, parent: null as any, value: editValue }],
							canConsumeValue: false,
							whitespacePrefix: ""
						}
					};
					newField.value.parent = newField;
					newField.value.concat[0].parent = newField.value;
					entry.fields.push(newField);
				}
			}
		}

		updatePositions(pos, offset);
		console.log("Dispatching updated bibtex:", newText.substring(0, 200) + "...");
		dispatch("update", newText);
	} catch (error) {
		console.error("Failed to save edit:", error);
	}

	editingCell = null;
	editValue = "";
}

function replaceRange(text: string, range: { start: number; end: number }, replacement: string): string {
	return text.substring(0, range.start) + replacement + text.substring(range.end);
}

function insertAt(text: string, position: number, insertion: string): string {
	return text.substring(0, position) + insertion + text.substring(position);
}

function removeRange(text: string, start: number, end: number): string {
	return text.substring(0, start) + text.substring(end);
}

function findInsertPosition(text: string, entryStart: number): number {
	const entryText = text.substring(entryStart);
	const match = entryText.match(/\s*\}\s*$/);
	return match ? entryStart + entryText.length - match[0].length : text.length;
}

function updatePositions(changedPos: EntryPosition, offset: number) {
	if (offset === 0) return;

	const changeEnd = Math.max(
		changedPos.typeRange.end,
		changedPos.keyRange?.end || 0,
		...changedPos.fields.map(f => f.valueRange.end)
	);

	for (const pos of positions) {
		if (pos.typeRange.start > changeEnd) {
			pos.typeRange.start += offset;
			pos.typeRange.end += offset;
		}
		if (pos.keyRange && pos.keyRange.start > changeEnd) {
			pos.keyRange.start += offset;
			pos.keyRange.end += offset;
		}
		for (const field of pos.fields) {
			if (field.nameRange.start > changeEnd) {
				field.nameRange.start += offset;
				field.nameRange.end += offset;
				field.valueRange.start += offset;
				field.valueRange.end += offset;
			}
		}
	}
}

function cancelEdit() {
	editingCell = null;
	editValue = "";
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Enter") saveEdit();
	else if (event.key === "Escape") cancelEdit();
}
</script>

<div class="table-container">
	<table>
		<thead>
			<tr>
				<th
					class:sorted={sortColumn === "type"}
					class:asc={sortColumn === "type" && sortDirection === "asc"}
					class:desc={sortColumn === "type" && sortDirection === "desc"}
					on:click={() => sortBy("type")}
				>
					Type
				</th>
				{#each allFields as field}
					<th
						class:sorted={sortColumn === field}
						class:asc={sortColumn === field && sortDirection === "asc"}
						class:desc={sortColumn === field && sortDirection === "desc"}
						on:click={() => sortBy(field)}
					>
						{field}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sortedEntries as entry, idx}
				<tr>
					<td on:dblclick={() => startEdit(idx, "type")}>
						{#if editingCell?.entryIndex === idx && editingCell.field === "type"}
							<input
								bind:value={editValue}
								on:blur={saveEdit}
								on:keydown={handleKeydown}
								class="edit-input"
								autofocus
							/>
						{:else}
							{getEntryType(entry)}
						{/if}
					</td>
					{#each allFields as field}
						<td on:dblclick={() => startEdit(idx, field)}>
							{#if editingCell?.entryIndex === idx && editingCell.field === field}
								<input
									bind:value={editValue}
									on:blur={saveEdit}
									on:keydown={handleKeydown}
									class="edit-input"
									autofocus
								/>
							{:else}
								{getFieldValue(entry, field)}
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
.table-container {
	height: 100%;
	overflow: auto;
	background: var(--main-bg);
	padding: 12px;
}

table {
	width: 100%;
	border-collapse: collapse;
	font: var(--mono-normal);
	font-size: 12px;
}

th, td {
	padding: 4px 8px;
	text-align: left;
	border: 1px solid var(--border-color);
	vertical-align: top;
	word-break: break-word;
	max-width: 200px;
}

th {
	background: var(--dark3);
	color: var(--header-fg);
	font-weight: 500;
	position: sticky;
	top: 0;
	cursor: pointer;
	user-select: none;
}

th:hover {
	background: var(--hover-bg);
}

th.sorted {
	background: var(--dark4);
}

th.sorted::after {
	content: "";
	margin-left: 4px;
	display: inline-block;
	width: 0;
	height: 0;
}

th.sorted.asc::after {
	border-left: 4px solid transparent;
	border-right: 4px solid transparent;
	border-bottom: 4px solid var(--light2);
}

th.sorted.desc::after {
	border-left: 4px solid transparent;
	border-right: 4px solid transparent;
	border-top: 4px solid var(--light2);
}

td {
	background: var(--main-bg);
	color: var(--main-fg);
	cursor: pointer;
}

tr:nth-child(even) td {
	background: var(--dark2);
}

tbody tr:hover td {
	background: var(--hover-bg);
}

.edit-input {
	width: 100%;
	background: var(--textfield-bg);
	color: var(--header-fg);
	border: 1px solid var(--border-color);
	padding: 2px 4px;
	font: var(--mono-normal);
	font-size: 12px;
	border-radius: 2px;
}

.edit-input:focus {
	outline: none;
	border-color: var(--light-blue);
}
</style>
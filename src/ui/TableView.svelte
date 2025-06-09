<script lang="ts">
import { ASTProxy } from "../ASTProxy";
import { parseBibTeX } from "../parsers/bibtexParser";
import type { EntryNode } from "../parsers/bibtexParser";

export let bibtex: string;

let entries: EntryNode[] = [];
let sortedEntries: EntryNode[] = [];
let allFields: string[] = [];
let sortColumn = "";
let sortDirection: "asc" | "desc" = "asc";

$: {
	try {
		const ast = parseBibTeX(bibtex);
		const cache = new ASTProxy(ast);
		entries = cache.entries();

		const fieldSet = new Set<string>();
		for (const entry of entries) {
			for (const field of entry.fields) {
				fieldSet.add(field.name.toLowerCase());
			}
		}
		allFields = ["key", ...Array.from(fieldSet).sort()];

		// Reset sorting when bibtex changes and re-sort if there was a sort column
		if (sortColumn) {
			sortBy(sortColumn);
		} else {
			sortedEntries = [...entries];
		}
	} catch {
		entries = [];
		sortedEntries = [];
		allFields = [];
	}
}

function getFieldValue(entry: EntryNode, fieldName: string): string {
	if (fieldName === "key") {
		return entry.key || "";
	}

	const field = entry.fields.find(f => f.name.toLowerCase() === fieldName);
	if (!field) return "";

	return field.value.concat.map(node => node.value).join(" ");
}

function sortBy(column: string) {
	if (sortColumn === column) {
		sortDirection = sortDirection === "asc" ? "desc" : "asc";
	} else {
		sortColumn = column;
		sortDirection = "asc";
	}

	sortedEntries = [...entries].sort((a, b) => {
		let aVal: string;
		let bVal: string;

		if (column === "type") {
			aVal = getEntryType(a).toLowerCase();
			bVal = getEntryType(b).toLowerCase();
		} else {
			aVal = getFieldValue(a, column).toLowerCase();
			bVal = getFieldValue(b, column).toLowerCase();
		}

		if (sortDirection === "asc") {
			return aVal.localeCompare(bVal);
		} else {
			return bVal.localeCompare(aVal);
		}
	});
}

function getEntryType(entry: EntryNode): string {
	return entry.parent.command;
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
			{#each sortedEntries as entry}
				<tr>
					<td>{getEntryType(entry)}</td>
					{#each allFields as field}
						<td>{getFieldValue(entry, field)}</td>
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
}

tr:nth-child(even) td {
	background: var(--dark2);
}

tbody tr:hover td {
	background: var(--hover-bg);
}
</style>
import {
	BracedNode,
	type ConcatNode,
	type EntryNode,
	type FieldNode,
} from "../parsers/bibtexParser";
import { parseNameList } from "../parsers/nameFieldParser";
import type { Transform, Warning } from "../types";

const MIN_SCORE = 50;
const MIN_SCORE_GAP = 10;

export function createLookupDoisTransform(): Transform {
	return {
		name: "lookup-dois",
		apply: async (astProxy) => {
			const warnings: Warning[] = [];
			const entries = astProxy.entries();
			let processed = 0;
			let found = 0;

			for (const entry of entries) {
				processed++;

				const hasDoiField = entry.fields.some(
					(f) => f.name.toLowerCase() === "doi",
				);
				if (hasDoiField) {
					continue;
				}

				const title = astProxy.lookupRenderedEntryValue(entry, "title");
				if (!title || !title.trim()) {
					continue;
				}

				const authorField =
					astProxy.lookupRenderedEntryValue(entry, "author") ||
					astProxy.lookupRenderedEntryValue(entry, "editor");

				if (!authorField || !authorField.trim()) {
					continue;
				}

				try {
					const authors = parseNameList(authorField);
					let doi: string | undefined;

					for (const author of authors) {
						if (author.last) {
							doi = await searchDoi(title, author.last);
							if (doi) break;
						}
					}

					if (doi) {
						const doiField = addDoiToEntry(entry, doi);
						astProxy.invalidateField(doiField);
						found++;
					}
				} catch (error) {
					warnings.push({
						code: "DOI_LOOKUP_ERROR",
						message: `Failed to lookup DOI for entry ${entry.key}: ${error instanceof Error ? error.message : "Unknown error"}`,
					});
				}
			}

			if (found > 0) {
				warnings.push({
					code: "DOI_LOOKUP_SUCCESS",
					message: `Found ${found} DOIs out of ${processed} entries processed`,
				});
			}

			return warnings;
		},
	};
}

async function searchDoi(
	title: string,
	author: string,
): Promise<string | undefined> {
	const normalizedTitle = normalize(title);
	const normalizedAuthor = normalize(author);

	try {
		const params = new URLSearchParams({
			"query.bibliographic": normalizedTitle,
			"query.author": normalizedAuthor,
			rows: "2",
			select: "DOI,score",
		});
		const apiUrl = `https://api.crossref.org/works?${params.toString()}`;

		const response = await fetch(apiUrl, {
			headers: {
				Accept: "application/json",
				"User-Agent":
					"Bib-Editor/1.14.0 (https://github.com/TeXlyre/bibtex-tidy; mailto:support@texlyre.com)",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		const items = data.message?.items ?? [];
		if (items.length === 0) return undefined;

		const top = items[0];
		const second = items[1];
		const topScore = top.score ?? 0;

		if (topScore < MIN_SCORE) return undefined;
		if (second && topScore - (second.score ?? 0) < MIN_SCORE_GAP) {
			return undefined;
		}

		return top.DOI;
	} catch (error) {
		throw new Error(
			`DOI lookup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

function normalize(str: string): string {
	return str
		.replace(/[{}\\'"`^]/g, "")
		.replace(/\$.*?\$/g, "")
		.replace(/[\u0080-\uFFFF]/g, "")
		.trim();
}

function addDoiToEntry(entry: EntryNode, doi: string): FieldNode {
	const bracedNode = new BracedNode(null as unknown as ConcatNode);
	bracedNode.value = doi;

	const doiField = {
		type: "field" as const,
		parent: entry,
		name: "doi",
		whitespacePrefix: "",
		hasComma: false,
		value: {
			type: "concat" as const,
			parent: null as unknown as FieldNode,
			concat: [bracedNode],
			canConsumeValue: false,
			whitespacePrefix: "",
		},
	};

	doiField.value.parent = doiField as FieldNode;
	bracedNode.parent = doiField.value as ConcatNode;

	entry.fields.push(doiField as FieldNode);
	return doiField as FieldNode;
}

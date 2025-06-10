import { LiteralNode, EntryNode, FieldNode, ConcatNode } from "../parsers/bibtexParser";
import { parseNameList } from "../parsers/nameFieldParser";
import type { Transform, Warning } from "../types";

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

				const existingDoi = astProxy.lookupRenderedEntryValue(entry, "doi");
				if (existingDoi?.trim()) {
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
		const query = `${normalizedTitle} ${normalizedAuthor}`;
		const apiUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=1`;

		const response = await fetch(apiUrl, {
			headers: {
				Accept: "application/json",
				"User-Agent":
					"BibTeX-Tidy/1.14.0 (https://github.com/TeXlyre/bibtex-tidy)",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();

		if (data.message?.items?.length > 0) {
			const item = data.message.items[0];
			const score = item.score || 0;
			if (score > 1.0) {
				return item.DOI;
			}
		}

		return undefined;
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
		.replace(/[^\u0000-\u007F]/g, "")
		.trim();
}

function addDoiToEntry(entry: EntryNode, doi: string): FieldNode {
	const literalNode = new LiteralNode(null as unknown as ConcatNode, doi);
	const doiField = {
		type: "field" as const,
		parent: entry,
		name: "doi",
		whitespacePrefix: "",
		hasComma: false,
		value: {
			type: "concat" as const,
			parent: null as unknown as FieldNode,
			concat: [literalNode],
			canConsumeValue: false,
			whitespacePrefix: "",
		},
	};

	doiField.value.parent = doiField as FieldNode;
	literalNode.parent = doiField.value as ConcatNode;

	entry.fields.push(doiField as FieldNode);
	return doiField as FieldNode;
}
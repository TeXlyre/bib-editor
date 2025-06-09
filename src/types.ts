import type { ASTProxy } from "./ASTProxy";
import type { DuplicateRule } from "./optionUtils";

export type Transform = {
	name: string;
	dependencies?: string[];
	apply: (ast: ASTProxy) => Promise<Warning[]> | Warning[] | undefined;
};

export type Warning = (
	| { code: "MISSING_KEY" }
	| { code: "DUPLICATE_ENTRY"; rule: DuplicateRule }
	| { code: "DOI_LOOKUP_ERROR" }
	| { code: "DOI_LOOKUP_SUCCESS" }
) & {
	message: string;
};

export type BibTeXTidyResult = {
	bibtex: string;
	warnings: Warning[];
	count: number;
};
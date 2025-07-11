import { ASTProxy } from "./ASTProxy";
import { logAST } from "./debug";
import { formatBibtex } from "./format";
import { normalizeOptions } from "./optionUtils";
import type { Options } from "./optionUtils";
import { parseBibTeX } from "./parsers/bibtexParser";
import { generateTransformPipeline } from "./pipeline";
import type { BibTeXTidyResult, Warning } from "./types";
import { convertCRLF } from "./utils";

const verbose = false;

export async function tidy(
	input: string,
	options_: Options = {},
): Promise<BibTeXTidyResult> {
	const options = normalizeOptions(options_);
	const inputFixed = convertCRLF(input);
	const ast = parseBibTeX(inputFixed);
	const cache = new ASTProxy(ast);
	const pipeline = generateTransformPipeline(options);

	const warnings: Warning[] = cache
		.entries()
		.filter((entry) => !entry.key)
		.map((entry) => ({
			code: "MISSING_KEY",
			message: `${entry.parent.command} entry does not have a citation key.`,
		}));

	if (verbose) {
		console.log(logAST(ast));
	}

	for (const transform of pipeline) {
		const result = await transform.apply(cache);
		if (verbose) {
			console.log(`\n\n## Applying transform: ${transform.name}`);
			console.log(logAST(ast));
		}
		if (result) warnings.push(...result);
	}

	const bibtex = formatBibtex(ast);

	return { bibtex, warnings, count: cache.entries().length };
}

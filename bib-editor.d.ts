/**
 * bibtex-tidy v1.14.0
 * https://github.com/FlamingTempura/bibtex-tidy
 *
 * DO NOT EDIT THIS FILE. This file is automatically generated
 * using `npm run build`. Edit files in './src' then rebuild.
 **/
export type BibTeXTidyOptions = {
	/**
	 * Help
	 *
	 * Show help
	 */
	help?: boolean;
	/**
	 * Enable planned v2 CLI changes
	 *
	 * Input files will no longer be modified by default. Instead, you will need to specify `--modify`/`-m` option to overwrite the file, or `--output`/`-o` to output to a different file.
	 */
	v2?: string;
	/**
	 * Output path
	 *
	 * Write output to specified path. When omitted (and -m/--modify is not used), the result will be printed to stdout.
	 */
	outputPath?: string;
	/**
	 * Modify input files
	 *
	 * Overwrite the original input files with the tidied result. This is enabled by default but will be disabled by default in v2. For v1, use --no-modify to output to stdout instead of overwriting the input files.
	 */
	modify?: boolean;
	/**
	 * Remove fields
	 *
	 * Remove specified fields from bibliography entries.
	 */
	omit?: string[];
	/**
	 * Enclose values in braces
	 *
	 * Enclose all property values in braces. Quoted values will be converted to braces. For example, "Journal of Tea" will become {Journal of Tea}.
	 */
	curly?: boolean;
	/**
	 * Use numeric values where possible
	 *
	 * Strip quotes and braces from numeric/month values. For example, {1998} will become 1998.
	 */
	numeric?: boolean;
	/**
	 * Abbreviate months
	 *
	 * Convert all months to three letter abbreviations (jan, feb, etc).
	 */
	months?: boolean;
	/**
	 * Indent with spaces
	 *
	 * Indent all fields with the specified number of spaces. Ignored if tab is set.
	 */
	space?: boolean | number;
	/**
	 * Indent with tabs
	 *
	 * Indent all fields with a tab.
	 */
	tab?: boolean;
	/**
	 * Align values
	 *
	 * Insert whitespace between fields and values so that values are visually aligned.
	 */
	align?: boolean | number;
	/**
	 * Insert blank lines
	 *
	 * Insert an empty line between each entry.
	 */
	blankLines?: boolean;
	/**
	 * Sort bibliography entries
	 *
	 * Sort entries by the specified field names (citation key is used if no fields are specified). For descending order, prefix the field with a dash (-).
	 * Multiple fields may be specified to sort everything by first field, then by the second field whenever the first field for entries are equal, etc.
	 * The following additional fields are also permitted: key (entry citation key), type (sorts by the type of entry, e.g. article), and special (ensures that @string, @preamble, @set, and @xdata entries are first).
	 */
	sort?: boolean | string[];
	/**
	 * Check for duplicates
	 *
	 * Warn if duplicates are found, which are entries where DOI, abstract, or author and title are the same.
	 */
	duplicates?: boolean | ("doi" | "key" | "abstract" | "citation")[];
	/**
	 * Merge duplicate entries
	 *
	 * Merge duplicates entries. Use the duplicates option to determine how duplicates are identified. There are different ways to merge:
	 * - first: only keep the original entry
	 * - last: only keep the last found duplicate
	 * - combine: keep original entry and merge in fields of duplicates if they do not already exist
	 * - overwrite: keep original entry and merge in fields of duplicates, overwriting existing fields if they exist
	 */
	merge?: boolean | "first" | "last" | "combine" | "overwrite";
	/**
	 * Strip double-braced values
	 *
	 * Where an entire value is enclosed in double braces, remove the extra braces. For example, {{Journal of Tea}} will become {Journal of Tea}.
	 */
	stripEnclosingBraces?: boolean;
	/**
	 * Drop all caps
	 *
	 * Where values are all caps, make them title case. For example, {JOURNAL OF TEA} will become {Journal of Tea}. Roman numerals will be left unchanged.
	 */
	dropAllCaps?: boolean;
	/**
	 * Escape special characters
	 *
	 * Escape special characters, such as umlaut. This ensures correct typesetting with latex. Enabled by default.
	 */
	escape?: boolean;
	/**
	 * Sort fields
	 *
	 * Sort the fields within entries.
	 * If no fields are specified fields will be sorted by: title, shorttitle, author, year, month, day, journal, booktitle, location, on, publisher, address, series, volume, number, pages, doi, isbn, issn, url, urldate, copyright, category, note, metadata
	 */
	sortFields?: boolean | string[];
	/**
	 * Sort properties
	 *
	 * Alias of sort fields (legacy)
	 */
	sortProperties?: boolean | string[];
	/**
	 * Remove comments
	 *
	 * Remove all comments from the bibtex source.
	 */
	stripComments?: boolean;
	/**
	 * Trailing commas
	 *
	 * End the last key value pair in each entry with a comma.
	 */
	trailingCommas?: boolean;
	/**
	 * Encode URLs
	 *
	 * Replace invalid URL characters with percent encoded values.
	 */
	encodeUrls?: boolean;
	/**
	 * Tidy comments
	 *
	 * Remove whitespace surrounding comments.
	 */
	tidyComments?: boolean;
	/**
	 * Remove empty fields
	 *
	 * Remove any fields that have empty values.
	 */
	removeEmptyFields?: boolean;
	/**
	 * Remove duplicate fields
	 *
	 * Only allow one of each field in each entry. Enabled by default.
	 */
	removeDuplicateFields?: boolean;
	/**
	 * Generate citation keys [Experimental]
	 *
	 * For all entries replace the key with a new key of the form <author><year><title>. A JabRef citation pattern can be provided. This is an experimental option that may change without warning.
	 */
	generateKeys?: boolean | string;
	/**
	 * Maximum authors
	 *
	 * Truncate authors if above a given number into "and others".
	 */
	maxAuthors?: number;
	/**
	 * Lowercase fields
	 *
	 * Lowercase field names and entry type. Enabled by default.
	 */
	lowercase?: boolean;
	/**
	 * Enclose values in double braces
	 *
	 * Enclose the given fields in double braces, such that case is preserved during BibTeX compilation.
	 */
	enclosingBraces?: boolean | string[];
	/**
	 * Remove braces
	 *
	 * Remove any curly braces within the value, unless they are part of a command.
	 */
	removeBraces?: boolean | string[];
	/**
	 * Wrap values
	 *
	 * Wrap long values at the given column
	 */
	wrap?: boolean | number;
	/**
	 * Version
	 *
	 * Show bib-editor version.
	 */
	version?: boolean;
	/**
	 * Quiet
	 *
	 * Suppress logs on stdout.
	 */
	quiet?: boolean;
	/**
	 * Backup
	 *
	 * Make a backup <filename>.original. Enabled by default (unless --modify is explicitly provided or outputting to a different file/stdio). Deprecated but provided for backward compatibility.
	 */
	backup?: boolean;
	/**
	 * Lookup missing DOIs
	 *
	 * Search for missing DOI fields using CrossRef. This will query CrossRef's database using the entry's title and author information to find matching DOIs.
	 */
	lookupDois?: boolean;
};
export type Options = Omit<BibTeXTidyOptions, "help" | "version" | "quiet" | "backup">;
export type DuplicateRule = Exclude<BibTeXTidyOptions["duplicates"], boolean | undefined>[number];
export type Warning = ({
	code: "MISSING_KEY";
} | {
	code: "DUPLICATE_ENTRY";
	rule: DuplicateRule;
} | {
	code: "DOI_LOOKUP_ERROR";
} | {
	code: "DOI_LOOKUP_SUCCESS";
}) & {
	message: string;
};
export type BibTeXTidyResult = {
	bibtex: string;
	warnings: Warning[];
	count: number;
};
export declare function tidy(input: string, options_?: Options): Promise<BibTeXTidyResult>;

export {};

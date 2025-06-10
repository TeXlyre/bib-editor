import { strictEqual } from "node:assert";
import { bibtex, bibtexTidy, test } from "./utils";

const input = bibtex`
@ARTICLE {feinberg1983technique,
    number={1},
    title={A technique for radiolabeling DNA restriction endonuclease fragments to high specific activity},
  author="Feinberg, Andrew P and Vogelstein, Bert",
    journal    = {Analytical biochemistry},
    volume = 132,
    pages={6-13},
    year={1983},
    month={aug},
    publisher={Elsevier},}`;

const output = bibtex`
@article{feinberg1983technique,
  number        = {1},
  title         = {A technique for radiolabeling DNA restriction endonuclease fragments to high specific activity},
  author        = {Feinberg, Andrew P and Vogelstein, Bert},
  journal       = {Analytical biochemistry},
  volume        = {132},
  pages         = {6--13},
  year          = {1983},
  month         = {aug},
  publisher     = {Elsevier}
}
`;

test("curly (enforce braced values)", async () => {
	const tidied = await bibtexTidy(input, { curly: true });
	strictEqual(tidied.bibtex, output);
});

test("do not brace abbreviated months", async () => {
	const input = bibtex`@article{foo, title={Foo}, month = mar }`;

	const expected = bibtex`
@article{foo,
  title         = {Foo},
  month         = mar
}
`;

	const tidied = await bibtexTidy(input, { curly: true });
	strictEqual(tidied.bibtex, expected);
});
//bib-editor --curly --numeric --months --tab --align=13 --duplicates=key --no-escape --sort-fields --no-remove-dupe-fields YOUR_FILE.bib

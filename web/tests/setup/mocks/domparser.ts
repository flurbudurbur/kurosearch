export class SimpleDOMParser implements DOMParser {
	parseFromString(str: string, type: DOMParserSupportedType): Document {
		// Use the real JSDOM DOMParser if available
		const Real = (globalThis as any).DOMParser;
		if (Real && Real !== SimpleDOMParser) {
			return new Real().parseFromString(str, type);
		}
		// Fallback: create a document and set innerHTML
		const parser = new (class {
			parseFromString(s: string) {
				const doc = document.implementation.createHTMLDocument('x');
				(doc.documentElement as any).innerHTML = s;
				return doc as unknown as Document;
			}
		})();
		// @ts-ignore
		return parser.parseFromString(str, type);
	}
}

export const installDOMParserMock = () => {
	// @ts-ignore
	global.DOMParser = SimpleDOMParser;
};

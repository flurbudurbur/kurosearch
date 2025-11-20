import { formatCount } from './format-count';

export const formatTagname = (tagname: unknown) => {
	if (typeof tagname !== 'string') return 'error';
	return tagname.replace(/_/g, ' ');
};

export const formatActiveTag = (tag: { name: unknown; count?: unknown }) => {
	const name = formatTagname(tag.name);
	if (name === 'error') return 'error';

	if (typeof tag.count !== 'number' || tag.count === 0) {
		return name;
	}
	const count = formatCount(tag.count);

	return `${name} (${count})`;
};

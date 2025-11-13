export default {
	plugins: {
		autoprefixer: {
			overrideBrowserslist: [
				'Safari >= 12',
				'Firefox >= 60',
				'Chrome >= 70',
				'Edge >= 79',
				'iOS >= 12',
				'Android >= 70'
			],
			grid: 'autoplace',
			flexbox: 'no-2009'
		}
	}
};

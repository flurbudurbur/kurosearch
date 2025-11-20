export const mockGitHubReleaseResponse = {
	tag_name: 'v1.2.3',
	name: 'Release v1.2.3',
	published_at: '2024-01-01T12:00:00Z',
	body: 'Release notes here'
};

export const mockGitHubReleaseResponseNoTag = {
	name: 'Release v1.2.3',
	published_at: '2024-01-01T12:00:00Z',
	body: 'Release notes here'
	// Missing tag_name
};

export const mockGitHub404Response = {
	message: 'Not Found',
	documentation_url: 'https://docs.github.com/rest'
};

export const mockGitHub403RateLimitResponse = {
	message:
		'API rate limit exceeded. Documentation: https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting',
	documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
};

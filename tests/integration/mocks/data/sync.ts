/**
 * Mock sync data for integration tests
 */

export const createMockSyncCode = (): string => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

export const mockSyncCodeResponse = {
	code: '123456'
};

export const mockSyncConfigData = {
	theme: 'dark',
	blocked: ['nsfw', 'gore'],
	supertags: []
};

export const createMockSyncConfigResponse = (config: any = mockSyncConfigData) => {
	return config;
};

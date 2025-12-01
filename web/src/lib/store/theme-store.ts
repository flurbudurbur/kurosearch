import { createStringStore } from './generic/string-store';
import { StoreKey } from './store-keys';
import type { Theme } from '$lib/types/theme';

const defaultTheme: Theme = 'crimson system';

export default createStringStore(StoreKey.Theme, defaultTheme);

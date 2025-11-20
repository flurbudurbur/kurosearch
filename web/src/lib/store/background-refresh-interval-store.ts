import { persistentWritable } from './persistent-store';
import { StoreKey } from './store-keys';

// Interval in milliseconds (default: 3 minutes)
const DEFAULT_INTERVAL = 3 * 60 * 1000;

const numberSerializer = (value: number) => value.toString();
const numberParser = (value: string) => {
	const parsed = parseInt(value, 10);
	return isNaN(parsed) ? undefined : parsed;
};

export default persistentWritable(
	StoreKey.BackgroundRefreshInterval,
	DEFAULT_INTERVAL,
	numberSerializer,
	numberParser
);

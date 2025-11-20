import { createNumberStore } from './generic/number-store';
import { StoreKey } from './store-keys';

const columnWidthStore = createNumberStore(StoreKey.ColumnWidth, 100);

export default columnWidthStore;

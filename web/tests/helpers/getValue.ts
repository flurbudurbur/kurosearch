export const getValue = async <T>(store: any) =>
	new Promise<T>((resolve) => {
		let unsub: () => void;
		unsub = store.subscribe((v: T) => {
			resolve(v);
			setTimeout(() => unsub(), 0);
		});
	});

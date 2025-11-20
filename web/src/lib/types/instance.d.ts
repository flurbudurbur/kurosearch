namespace flur34 {
	type InstanceConfiguration = {
		name: string;
		url: string;
		country: string;
		description: string;
		status: number;
		source_url: string;
		details: Details;
	};

	interface Details {
		version: string;
		last_check: EpochTimeStamp;
		uptime: number;
	}
}

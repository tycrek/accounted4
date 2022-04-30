export interface Options {
	/**
	 * Hostname of the server (the domain name)
	 */
	hostname: string;

	/**
	 * Port of the server (optional; default based on useHttps)
	 */
	port?: number;

	/**
	 * Whether to use HTTPS (optional; default false)
	 */
	useHttps?: boolean;
}

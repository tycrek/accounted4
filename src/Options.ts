import { ProviderOptions } from './Provider';

// Providers
import { DigitalOcean, DigitalOceanOptions } from './providers/DigitalOcean';
import { Discord, DiscordOptions } from './providers/Discord';
import { GitHub, GitHubOptions } from './providers/GitHub';
import { Google, GoogleOptions } from './providers/Google';
import { Microsoft, MicrosoftOptions } from './providers/Microsoft';
import { Spotify, SpotifyOptions } from './providers/Spotify';
import { Twitch, TwitchOptions } from './providers/Twitch';
export const Providers = {
	DigitalOcean,
	Discord,
	GitHub,
	Google,
	Microsoft,
	Spotify,
	Twitch,
};

// Export names as a type
export type ProviderNames = keyof typeof Providers;

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

	/**
	 * Default provider to use
	 */
	defaultProvider: ProviderNames;

	/**
	 * Additional providers to use
	 */
	optionalProviders?: ProviderNames[];

	/**
	 * Provider options
	 */
	providerOptions: {
		DigitalOcean?: DigitalOceanOptions;
		Discord?: DiscordOptions;
		GitHub?: GitHubOptions;
		Google?: GoogleOptions;
		Microsoft?: MicrosoftOptions;
		Spotify?: SpotifyOptions;
		Twitch?: TwitchOptions;
	};
}

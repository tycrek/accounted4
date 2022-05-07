import { Request, Response, NextFunction } from 'express';

export interface Provider {
	/**
	 * The name of the provider
	 */
	name: string;

	/**
	 * Base URL
	 */
	baseUrl: string;

	/**
	 * Authorization URL
	 */
	authUrl: string;

	/**
	 * Token URL
	 */
	tokenUrl: string;

	/**
	 * Redirect URI
	 */
	redirectUri: string;

	/**
	 * Called when the user has successfully authenticated. Aka, the "redirect uri" route
	 */
	onSuccess: (req: Request, res: Response, next: NextFunction) => void;
}

export interface ProviderOptions {
	/**
	 * Client ID
	 */
	clientId: string;

	/**
	 * Client Secret
	 */
	clientSecret: string;

	/**
	 * Scopes
	 */
	scopes?: string[];
}

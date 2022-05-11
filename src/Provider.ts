import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { ac4session } from './accounted4';

type SessionDataSchemaFunction = (provider: Provider, data: any) => ac4session;

export function getTokenFromCode(provider: Provider, req: Request, res: Response, next: NextFunction, url: string, params: string, sessionDataSchema: SessionDataSchemaFunction, headers?: any) {
	axios.post(url, params, headers ? { headers } : undefined)
		.then(({ data }) => req.session.accounted4 = sessionDataSchema(provider, data))
		.then(() => res.redirect(req.session?.postAuthPath ?? '/'))
		.catch(next);
}

export function getTokenFromRefresh(provider: Provider, req: Request, url: string, params: string, sessionDataSchema: SessionDataSchemaFunction, headers?: any) {
	return new Promise((resolve, reject) =>
		axios.post(url, params, headers ? { headers } : undefined)
			.then(({ data }) => req.session.accounted4 = sessionDataSchema(provider, data))
			.then(() => resolve(void 0))
			.catch(reject));
}

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
	 * Refresh URL (if applicable)
	 */
	refreshUrl?: string;

	/**
	 * Redirect URI
	 */
	redirectUri: string;

	/**
	 * Called when the user has successfully authenticated. Aka, the "redirect uri" route
	 */
	onSuccess: (req: Request, res: Response, next: NextFunction) => void;

	/**
	 * Called when the token expires. Aka, the "refresh token" route. Optional, as not all providers support refresh tokens
	 */
	doRefresh?: (req: Request) => Promise<any>;

	/**
	 * sessionDataSchema: parses OAuth responses into usable session information
	 */
	sessionDataSchema?: SessionDataSchemaFunction;
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

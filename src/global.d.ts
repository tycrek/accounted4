import { ac4session } from './accounted4';

declare module 'express-session' {
	interface SessionData {
		/**
		 * The path the user was intending to reach prior to auth
		 */
		postAuthPath: string;

		accounted4: ac4session;
	}
}

import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const extra = Constants.expoConfig?.extra || {};

function extractHost(value) {
	if (!value || typeof value !== 'string') return '';
	const trimmed = value.trim();
	const withoutScheme = trimmed.replace(/^[a-zA-Z]+:\/\//, '');
	const hostPort = withoutScheme.split('/')[0];
	if (!hostPort) return '';
	return hostPort.split(':')[0] || '';
}

function isPrivateOrLocalHost(hostValue) {
	if (!hostValue) return false;
	if (hostValue === 'localhost' || hostValue === '127.0.0.1' || hostValue === '10.0.2.2') return true;
	if (/^10\./.test(hostValue)) return true;
	if (/^192\.168\./.test(hostValue)) return true;
	if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostValue)) return true;
	return false;
}

const detectedHost =
	extractHost(NativeModules?.SourceCode?.scriptURL) ||
	extractHost(Constants.linkingUri) ||
	extractHost(Constants.expoGoConfig?.debuggerHost) ||
	extractHost(Constants.manifest2?.extra?.expoClient?.hostUri) ||
	extractHost(Constants.manifest?.debuggerHost) ||
	extractHost(Constants.expoConfig?.hostUri) ||
	'';
const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const host = detectedHost || fallbackHost;
const extraApiHost = extractHost(extra.API_BASE_URL);
const extraMockHost = extractHost(extra.MOCK_PLATFORM_API_URL);

function fallback(url) {
	if (!url) return true;
	if (url.includes('your_local_ip')) return true;
	if (url.includes('192.168.1.2')) return true;
	if (url.includes('10.0.2.2') && detectedHost && detectedHost !== '10.0.2.2') return true;
	const configuredHost = extractHost(url);
	if (
		detectedHost &&
		configuredHost &&
		configuredHost !== detectedHost &&
		isPrivateOrLocalHost(configuredHost) &&
		isPrivateOrLocalHost(detectedHost)
	) {
		// Prefer the current Expo host over stale local IPs from app.json/.env.
		return true;
	}
	return false;
}

function unique(values) {
	return [...new Set(values.filter(Boolean))];
}

const configuredApiBase = fallback(extra.API_BASE_URL) ? `http://${host}:3000/api` : extra.API_BASE_URL;
const configuredMockBase = fallback(extra.MOCK_PLATFORM_API_URL) ? `http://${host}:3001` : extra.MOCK_PLATFORM_API_URL;

export const API_BASE_URL_CANDIDATES = unique([
	detectedHost ? `http://${detectedHost}:3000/api` : '',
	configuredApiBase,
	extraApiHost ? `http://${extraApiHost}:3000/api` : '',
	'http://10.0.2.2:3000/api',
	'http://localhost:3000/api',
	'http://127.0.0.1:3000/api',
]);

export const MOCK_PLATFORM_API_URL_CANDIDATES = unique([
	detectedHost ? `http://${detectedHost}:3001` : '',
	configuredMockBase,
	extraMockHost ? `http://${extraMockHost}:3001` : '',
	'http://10.0.2.2:3001',
	'http://localhost:3001',
	'http://127.0.0.1:3001',
]);

export const API_BASE_URL = API_BASE_URL_CANDIDATES[0];

export const MOCK_PLATFORM_API_URL = MOCK_PLATFORM_API_URL_CANDIDATES[0];

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

function fallback(url) {
	if (!url) return true;
	if (url.includes('your_local_ip')) return true;
	if (url.includes('10.0.2.2') && detectedHost && detectedHost !== '10.0.2.2') return true;
	return false;
}

function unique(values) {
	return [...new Set(values.filter(Boolean))];
}

const configuredApiBase = fallback(extra.API_BASE_URL) ? `http://${host}:3000/api` : extra.API_BASE_URL;
const configuredMockBase = fallback(extra.MOCK_PLATFORM_API_URL) ? `http://${host}:3001` : extra.MOCK_PLATFORM_API_URL;

export const API_BASE_URL_CANDIDATES = unique([
	configuredApiBase,
	detectedHost ? `http://${detectedHost}:3000/api` : '',
	'http://10.0.2.2:3000/api',
	'http://localhost:3000/api',
	'http://127.0.0.1:3000/api',
]);

export const MOCK_PLATFORM_API_URL_CANDIDATES = unique([
	configuredMockBase,
	detectedHost ? `http://${detectedHost}:3001` : '',
	'http://10.0.2.2:3001',
	'http://localhost:3001',
	'http://127.0.0.1:3001',
]);

export const API_BASE_URL = API_BASE_URL_CANDIDATES[0];

export const MOCK_PLATFORM_API_URL = MOCK_PLATFORM_API_URL_CANDIDATES[0];

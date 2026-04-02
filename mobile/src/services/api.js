import axios from 'axios';
import { API_BASE_URL, API_BASE_URL_CANDIDATES } from './config';

const TIMEOUT_MS = 10000;
let preferredBaseURL = API_BASE_URL;

function candidateBaseURLs() {
  const ordered = [preferredBaseURL, ...API_BASE_URL_CANDIDATES];
  return [...new Set(ordered.filter(Boolean))];
}

async function requestWithFallback(method, path, data, config = {}) {
  let lastError;

  for (const baseURL of candidateBaseURLs()) {
    try {
      const response = await axios({
        method,
        baseURL,
        url: path,
        data,
        timeout: TIMEOUT_MS,
        ...config,
      });

      preferredBaseURL = baseURL;
      return response;
    } catch (error) {
      lastError = error;

      const status = error?.response?.status;
      if (status && status < 500 && status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
}

const api = {
  get: (path, config) => requestWithFallback('get', path, undefined, config),
  post: (path, data, config) => requestWithFallback('post', path, data, config),
  put: (path, data, config) => requestWithFallback('put', path, data, config),
  patch: (path, data, config) => requestWithFallback('patch', path, data, config),
  delete: (path, config) => requestWithFallback('delete', path, undefined, config),
};

export default api;

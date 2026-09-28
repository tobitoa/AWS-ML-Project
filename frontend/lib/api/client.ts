export class ApiError extends Error {
  status: number;
  statusText: string;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = getHttpStatusText(status);
    this.data = data;
  }
}

function getHttpStatusText(status: number): string {
  switch (status) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Unprocessable Entity';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 502:
      return 'Bad Gateway';
    case 503:
      return 'Service Unavailable';
    case 504:
      return 'Gateway Timeout';
    default:
      return 'Network Error';
  }
}

export function formatErrorMessage(status: number, detail?: string): string {
  if (detail && typeof detail === 'string' && detail.trim().length > 0) {
    return detail;
  }
  switch (status) {
    case 400:
      return 'The request was invalid or contained unsupported parameters.';
    case 401:
      return 'Authentication required. Please verify your credentials.';
    case 403:
      return 'Permission denied to perform this operation.';
    case 404:
      return 'The requested resource, run, or entity could not be found.';
    case 409:
      return 'A conflict occurred with the current server or run state.';
    case 422:
      return 'Input validation failed. Please check the dataset format and columns.';
    case 429:
      return 'Rate limit exceeded. Please wait a moment before trying again.';
    case 500:
      return 'Internal ML engine error while processing the request.';
    case 502:
      return 'Bad gateway. The upstream API worker did not respond.';
    case 503:
      return 'ML service is currently unavailable or initializing.';
    case 504:
      return 'Gateway timed out waiting for the resolver to complete.';
    default:
      return `Unexpected API error (Status ${status}).`;
  }
}

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      'Unable to connect to the RESOMESH backend API. Check that the service is running on ' + API_BASE_URL
    );
  }

  if (!response.ok) {
    let errorDetail: string | undefined;
    let errorData: unknown;
    try {
      const body = await response.json();
      errorData = body;
      if (typeof body.detail === 'string') {
        errorDetail = body.detail;
      } else if (Array.isArray(body.detail)) {
        errorDetail = body.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
      }
    } catch {
      // Body not JSON
    }

    const message = formatErrorMessage(response.status, errorDetail);
    throw new ApiError(response.status, message, errorData);
  }

  // Handle empty bodies (204 No Content, etc.)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

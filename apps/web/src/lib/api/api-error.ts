/** Error thrown for any non-2xx API response, parsed from `{error:{code,message}}`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    let code = 'UNKNOWN';
    let message = response.statusText || `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { error?: { code?: string; message?: string } };
      if (body.error?.code) code = body.error.code;
      if (body.error?.message) message = body.error.message;
    } catch {
      // Non-JSON body: keep the defaults.
    }
    return new ApiError(response.status, code, message);
  }
}

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Something went wrong';

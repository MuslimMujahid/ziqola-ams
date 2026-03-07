/**
 * Extracts error message from an unknown error object.
 * @param error
 * @returns
 */
export const getErrorMessage = (error: unknown): string | null => {
  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    return typeof message === "string" ? message : null;
  }

  return null;
};

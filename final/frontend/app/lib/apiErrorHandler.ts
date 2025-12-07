export interface ApiErrorResponse {
    error: string;
    details?: string;
    status: number;
}

export function handleApiError(
    error: unknown,
    defaultMessage: string
): ApiErrorResponse {
    if (error instanceof Error) {
        // Check if it's a "not found" error
        if (error.message.includes("not found")) {
            return {
                error: error.message,
                status: 404,
            };
        }
        return {
            error: defaultMessage,
            details: error.message,
            status: 500,
        };
    }

    return {
        error: defaultMessage,
        details: "Unknown error",
        status: 500,
    };
}

export function validateSuburbName(name: string | undefined): void {
    if (!name) {
        throw { error: "Suburb name is required", status: 400 };
    }
}

export function validateSuburbsList(suburbs: string[]): void {
    if (suburbs.length === 0) {
        throw { error: "At least one suburb is required", status: 400 };
    }

    if (suburbs.length > 5) {
        throw { error: "Maximum 5 suburbs allowed", status: 400 };
    }
}

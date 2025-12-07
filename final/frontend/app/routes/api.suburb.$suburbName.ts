import type { Route } from "./+types/api.suburb.$suburbName";
import { fetchSuburbData } from "~/lib/api";
import type { SuburbData } from "~/types";
import {
    validateSuburbName,
    handleApiError,
} from "~/lib/apiErrorHandler";

export async function loader({ params, request }: Route.LoaderArgs) {
    const suburb = params.suburbName;
    const url = new URL(request.url);
    const type = (url.searchParams.get("type") || "all") as
        | "all"
        | "house"
        | "unit";

    try {
        validateSuburbName(suburb);
    } catch (error) {
        throw error;
    }

    try {
        const data = await fetchSuburbData(suburb, type);

        if (!data) {
            return {
                error: `No data found for suburb: ${suburb}`,
                status: 404,
            };
        }

        return data as SuburbData;
    } catch (error) {
        console.error(`Error loading suburb data for ${suburb}:`, error);
        return handleApiError(
            error,
            "Failed to load suburb data"
        );
    }
}

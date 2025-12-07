import type { Route } from "./+types/api.suburbs-analytics";
import { fetchBulkSuburbsData } from "~/lib/api";
import type { BulkSuburbsData } from "~/types";
import {
    validateSuburbsList,
    handleApiError,
} from "~/lib/apiErrorHandler";

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const suburbsParam = url.searchParams.get("suburbs");
    const type = (url.searchParams.get("type") || "all") as
        | "all"
        | "house"
        | "unit";

    if (!suburbsParam) {
        throw { error: "Suburbs parameter is required", status: 400 };
    }

    const suburbs = suburbsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    try {
        validateSuburbsList(suburbs);
    } catch (error) {
        throw error;
    }

    try {
        const data = await fetchBulkSuburbsData(suburbs, type);
        return data as BulkSuburbsData;
    } catch (error) {
        console.error("Error loading bulk suburbs data:", error);
        throw handleApiError(error, "Failed to load suburbs data");
    }
}

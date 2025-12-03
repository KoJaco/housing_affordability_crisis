import type { Route } from "./+types/api.suburb.$suburbName";
import { fetchSuburbData } from "~/lib/api";
import type { SuburbData } from "~/types";

export async function loader({ params, request }: Route.LoaderArgs) {
    const suburb = params.suburbName;
    const url = new URL(request.url);
    const type = (url.searchParams.get("type") || "all") as
        | "all"
        | "house"
        | "unit";

    if (!suburb) {
        throw { error: "Suburb name is required", status: 400 };
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

        // Check if it's a "not found" error
        if (error instanceof Error && error.message.includes("not found")) {
            return {
                error: `No data found for suburb: ${suburb}`,
                status: 404,
            };
        }

        return {
            error: "Failed to load suburb data",
            details: error instanceof Error ? error.message : "Unknown error",
            status: 500,
        };
    }
}

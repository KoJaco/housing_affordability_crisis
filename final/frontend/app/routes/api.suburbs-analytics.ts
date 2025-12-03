import type { Route } from "./+types/api.suburbs-analytics";
import { fetchBulkSuburbsData } from "~/lib/api";
import type { BulkSuburbsData } from "~/types";

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

    if (suburbs.length === 0) {
        throw { error: "At least one suburb is required", status: 400 };
    }

    if (suburbs.length > 5) {
        throw { error: "Maximum 5 suburbs allowed", status: 400 };
    }

    try {
        const data = await fetchBulkSuburbsData(suburbs, type);
        return data as BulkSuburbsData;
    } catch (error) {
        console.error("Error loading bulk suburbs data:", error);
        throw {
            error: "Failed to load suburbs data",
            details: error instanceof Error ? error.message : "Unknown error",
            status: 500,
        };
    }
}

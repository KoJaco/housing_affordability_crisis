import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("sydney-suburbs", "routes/sydney-suburbs.tsx"),
    route("api/suburb/:suburbName", "routes/api.suburb.$suburbName.ts"),
    route("api/suburbs-analytics", "routes/api.suburbs-analytics.ts"),
] satisfies RouteConfig;

import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("analyze", "routes/analyze.tsx"),
  route("api/suburb/:suburbName", "routes/api.suburb.$suburbName.ts"),
  route("api/suburbs-analytics", "routes/api.suburbs-analytics.ts"),
] satisfies RouteConfig;

import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Sydney Property Analysis - Home" },
        {
            name: "description",
            content:
                "Explore 24 years of property data across 653 Sydney suburbs. Compare prices, growth trends, and market insights.",
        },
    ];
}

export default function Home() {
    return <Welcome />;
}

import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import {
    BarChart3,
    Building2,
    MapPin,
    Search,
    TrendingUp,
    HouseIcon,
    type LucideIcon,
} from "lucide-react";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface Feature {
    icon: LucideIcon;
    iconBgColor: string;
    iconTextColor: string;
    title: string;
    description: string;
    comingSoon?: boolean;
}

const features: Feature[] = [
    {
        icon: MapPin,
        iconBgColor: "bg-blue-100",
        iconTextColor: "text-blue-600",
        title: "Interactive Map",
        description:
            "Visualize suburb-based property prices across Sydney with an interactive heatmap. Click on suburbs to explore detailed analytics.",
    },
    {
        icon: TrendingUp,
        iconBgColor: "bg-green-100",
        iconTextColor: "text-green-600",
        title: "24 Years of Data",
        description:
            "Comprehensive property data from 2001 to 2024. Track price trends, growth rates, and market performance over time.",
    },
    {
        icon: BarChart3,
        iconBgColor: "bg-purple-100",
        iconTextColor: "text-purple-600",
        title: "Detailed Analytics",
        description:
            "Compare up to 5 suburbs side-by-side. View median prices, sales quantities, and growth rates.",
    },
    {
        icon: Search,
        iconBgColor: "bg-orange-100",
        iconTextColor: "text-orange-600",
        title: "Smart Filters",
        description:
            "Filter suburbs by property type (houses, apartments, or all), price range, and search by name. Find exactly what you're looking for.",
    },
    {
        icon: HouseIcon,
        iconBgColor: "bg-red-100",
        iconTextColor: "text-red-600",
        title: "Property Types",
        description:
            "Separate analytics for houses and apartments. Switch between property types to see how each market performs differently.",
    },
    {
        icon: Building2,
        iconBgColor: "bg-indigo-100",
        iconTextColor: "text-indigo-600",
        title: "Market Insights",
        description:
            "Get market health scores, volatility metrics, liquidity indicators, and 12-month price forecasts to make informed decisions.",
        comingSoon: true,
    },
];

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Sydney Property Analysis" },
        {
            name: "description",
            content:
                "Explore 20 years of property data across 653 Sydney suburbs. Compare prices, growth trends, and market insights.",
        },
    ];
}

export default function Home() {
    return (
        <main className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="container mx-auto max-w-2xl px-4 md:px-6 py-16 md:py-24 flex flex-col items-left justify-start h-full">
                <header className="md:text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                        Sydney Property Analysis
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Explore 24 years of property data across 653 Sydney
                        suburbs. Compare prices, growth trends, and market
                        insights.
                    </p>
                    <Link to="/sydney-suburbs">
                        <Button size="lg" className="text-lg px-8 py-6">
                            <MapPin className="mr-2 size-5" />
                            Start Analyzing
                        </Button>
                    </Link>
                </header>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-4 mb-16">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <Card key={feature.title}>
                                <CardHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div
                                            className={`p-2 ${feature.iconBgColor} rounded-lg`}
                                        >
                                            <Icon
                                                className={`size-6 ${feature.iconTextColor}`}
                                            />
                                        </div>
                                        <CardTitle>{feature.title}</CardTitle>
                                    </div>
                                    <CardDescription>
                                        {feature.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
                {/* Data sources */}
                <div className="flex flex-col gap-2 text-left md:text-center">
                    <p className="text-foreground/75 text-xs">
                        NSW property price data. Creative Commons BY-NC-ND 4.0
                    </p>
                    <p className="text-foreground/75 text-xs">
                        Sydney suburb spatial data from NSW - SEED
                    </p>
                </div>
            </div>
        </main>
    );
}

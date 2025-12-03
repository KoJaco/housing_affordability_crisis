import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import {
    MapPin,
    TrendingUp,
    BarChart3,
    Search,
    Home,
    Building2,
} from "lucide-react";

export function Welcome() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                        Sydney Property Analysis
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Explore 24 years of property data across 653 Sydney
                        suburbs. Compare prices, growth trends, and market
                        insights.
                    </p>
                    <Link to="/analyze">
                        <Button size="lg" className="text-lg px-8 py-6">
                            <MapPin className="mr-2 size-5" />
                            Start Analyzing
                        </Button>
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <MapPin className="size-6 text-blue-600" />
                                </div>
                                <CardTitle>Interactive Map</CardTitle>
                            </div>
                            <CardDescription>
                                Visualize property prices across Sydney with an
                                interactive choropleth map. Click on suburbs to
                                explore detailed analytics.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp className="size-6 text-green-600" />
                                </div>
                                <CardTitle>24 Years of Data</CardTitle>
                            </div>
                            <CardDescription>
                                Comprehensive property data from 2001 to 2024.
                                Track price trends, growth rates, and market
                                performance over time.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <BarChart3 className="size-6 text-purple-600" />
                                </div>
                                <CardTitle>Detailed Analytics</CardTitle>
                            </div>
                            <CardDescription>
                                Compare up to 5 suburbs side-by-side. View
                                median prices, growth rates, days on market, and
                                market health scores.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Search className="size-6 text-orange-600" />
                                </div>
                                <CardTitle>Smart Filters</CardTitle>
                            </div>
                            <CardDescription>
                                Filter suburbs by property type (houses,
                                apartments, or all), price range, and search by
                                name. Find exactly what you're looking for.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <Home className="size-6 text-red-600" />
                                </div>
                                <CardTitle>Property Types</CardTitle>
                            </div>
                            <CardDescription>
                                Separate analytics for houses and apartments.
                                Switch between property types to see how each
                                market performs differently.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Building2 className="size-6 text-indigo-600" />
                                </div>
                                <CardTitle>Market Insights</CardTitle>
                            </div>
                            <CardDescription>
                                Get market health scores, volatility metrics,
                                liquidity indicators, and 12-month price
                                forecasts to make informed decisions.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* Stats Section */}
                <div className="bg-gray-100 rounded-xl p-8 md:p-12 mb-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                653
                            </div>
                            <div className="text-gray-600">Suburbs</div>
                        </div>
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                24
                            </div>
                            <div className="text-gray-600">Years of Data</div>
                        </div>
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                2
                            </div>
                            <div className="text-gray-600">Property Types</div>
                        </div>
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                5
                            </div>
                            <div className="text-gray-600">Compare at Once</div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                        Ready to explore Sydney's property market?
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                        Start analyzing property trends, compare suburbs, and
                        discover insights to help you make informed property
                        decisions.
                    </p>
                    <Link to="/analyze">
                        <Button
                            size="lg"
                            variant="default"
                            className="text-lg px-8 py-6"
                        >
                            <MapPin className="mr-2 size-5" />
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

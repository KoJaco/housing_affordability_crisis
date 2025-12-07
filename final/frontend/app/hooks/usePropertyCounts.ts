import { useState, useEffect } from "react";
import { fetchSuburbAnalytics } from "~/lib/api";

export function usePropertyCounts(selectedSuburbs: string[]) {
    const [propertyCounts, setPropertyCounts] = useState<{
        all: number;
        house: number;
        unit: number;
    } | null>(null);

    useEffect(() => {
        if (selectedSuburbs.length === 0) {
            setPropertyCounts(null);
            // console.log("No suburbs selected, setting property counts to null");
            return;
        }

        const fetchCounts = async () => {
            try {
                // console.log("Fetching property counts for suburbs: ", selectedSuburbs);
                const [houseAnalytics, unitAnalytics] = await Promise.all([
                    Promise.all(
                        selectedSuburbs.map((suburb) =>
                            fetchSuburbAnalytics(suburb, "house")
                                .then((data) => data[0]?.current_num_sales ?? 0)
                                .catch(() => 0)
                        )
                    ),
                    Promise.all(
                        selectedSuburbs.map((suburb) =>
                            fetchSuburbAnalytics(suburb, "unit")
                                .then((data) => data[0]?.current_num_sales ?? 0)
                                .catch(() => 0)
                        )
                    ),
                ]);

                const houseCount = houseAnalytics.reduce(
                    (sum, count) => sum + count,
                    0
                );
                const unitCount = unitAnalytics.reduce(
                    (sum, count) => sum + count,
                    0
                );
                const allCount = houseCount + unitCount;

                setPropertyCounts({
                    all: allCount,
                    house: houseCount,
                    unit: unitCount,
                });
            } catch (error) {
                console.error("Error fetching property counts:", error);
                setPropertyCounts(null);
            }
        };

        fetchCounts();
    }, [selectedSuburbs]);

    return propertyCounts;
}

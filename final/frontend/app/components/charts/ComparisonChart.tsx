import { formatPrice } from "~/lib/formatters";
import { isValidPrice } from "~/lib/typeGuards";
import { TimeSeriesChart } from "./TimeSeriesChart";
import type { BulkSuburbsData } from "~/types";

interface ComparisonChartProps {
    data: BulkSuburbsData;
    height?: number;
    useSmoothed?: boolean;
    onSmoothedChange?: (enabled: boolean) => void;
}

export function ComparisonChart({
    data,
    height = 400,
    useSmoothed,
    onSmoothedChange,
}: ComparisonChartProps) {
    return (
        <TimeSeriesChart
            data={data}
            height={height}
            dataField="median_price"
            formatter={formatPrice}
            isValidValue={isValidPrice}
            useSmoothed={useSmoothed}
            onSmoothedChange={onSmoothedChange}
        />
    );
}

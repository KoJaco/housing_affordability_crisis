import { formatSales } from "~/lib/formatters";
import { isValidSales } from "~/lib/typeGuards";
import { TimeSeriesChart } from "./TimeSeriesChart";
import type { BulkSuburbsData } from "~/types";

interface SalesQuantityChartProps {
    data: BulkSuburbsData;
    height?: number;
}

export function SalesQuantityChart({
    data,
    height = 400,
}: SalesQuantityChartProps) {
    return (
        <TimeSeriesChart
            data={data}
            height={height}
            dataField="num_sales"
            formatter={formatSales}
            isValidValue={isValidSales}
        />
    );
}

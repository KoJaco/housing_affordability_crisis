import { formatPrice, formatSales, formatPercentage } from "~/lib/formatters";

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{
        name?: string;
        value?: number | null;
        color?: string;
        payload?: Record<string, any>;
    }>;
    formatter?: (value: number | null | undefined) => string;
    labelFormatter?: (label: string) => string;
}

export function ChartTooltip({
    active,
    payload,
    formatter,
    labelFormatter,
}: ChartTooltipProps) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const label =
        payload[0]?.payload?.quarter || payload[0]?.payload?.period || "";
    const formattedLabel = labelFormatter ? labelFormatter(label) : label;

    return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
            <p className="mb-2 font-semibold">{formattedLabel}</p>
            {payload.map((entry, index) => {
                const value = entry.value;
                if (value === null || value === undefined) return null;

                const formattedValue = formatter
                    ? formatter(value)
                    : typeof value === "number"
                      ? value.toLocaleString()
                      : String(value);

                return (
                    <p key={index} style={{ color: entry.color }}>
                        {entry.name}: {formattedValue}
                    </p>
                );
            })}
        </div>
    );
}

export function PriceTooltip(props: Omit<ChartTooltipProps, "formatter">) {
    return <ChartTooltip {...props} formatter={formatPrice} />;
}

export function SalesTooltip(props: Omit<ChartTooltipProps, "formatter">) {
    return <ChartTooltip {...props} formatter={formatSales} />;
}

export function PercentageTooltip(props: Omit<ChartTooltipProps, "formatter">) {
    return <ChartTooltip {...props} formatter={formatPercentage} />;
}

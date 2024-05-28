const labels = ['預金・現金・暗号資産', '投資信託', '年金', '株式', 'ポイント'] as const;
export type Labels = (typeof labels)[number];

export interface TimeSeriesData {
    name: Labels;
    data: number[];
    stack: number;
    color: string;
}

declare global {
    interface Window {
        categoriesData: string[];
        timeSeriesData: TimeSeriesData[];
    }
}

export {};

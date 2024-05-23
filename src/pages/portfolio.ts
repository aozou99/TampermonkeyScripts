interface ProfitLossInfo {
    Section名: string;
    評価損益の合計: number;
    評価額の合計: number;
    評価損益率: number;
    元本額の合計: number;
}

interface TargetInfo {
    id: string;
    対象名: string;
    評価損益カラムIndex: number;
    評価額カラムIndex: number;
}

export function handlePortfolioPage(): void {
    const sectionInfo = displayTotalProfitLossForEachSection();
    displayTotalProfitLossAtTop(sectionInfo);
}

function calculateColumnTotal(table: HTMLTableElement, columnIndex: number): number {
    const rows = table.getElementsByTagName('tr');
    let total = 0;

    for (let i = 1; i < rows.length; i++) {
        const cell = rows[i].getElementsByTagName('td')[columnIndex];
        if (cell) {
            const text = cell.textContent || cell.innerText;
            const valueString = text.replace(/,/g, '').replace('円', '').trim();
            const value = parseFloat(valueString);
            if (!isNaN(value)) {
                total += value;
            }
        }
    }
    return total;
}

function updateHeaderTotal(t: TargetInfo, totalProfitLoss: number, profitLossRate: number): void {
    const header = document.querySelector(`#${t.id} > section > h1.heading-small`);
    if (header) {
        header.textContent += `(評価損益： ${totalProfitLoss.toLocaleString()}円、 評価損益率： ${(
            profitLossRate * 100
        ).toFixed(2)}%)`;
    }
}

function extractNecessaryTotalFromTable(t: TargetInfo): ProfitLossInfo {
    const table = document.querySelector(`#${t.id} > table`) as HTMLTableElement;
    const totalProfitLoss = calculateColumnTotal(table, t.評価損益カラムIndex);
    const totalValuation = calculateColumnTotal(table, t.評価額カラムIndex);
    const profitLossRate = totalProfitLoss / (totalValuation - totalProfitLoss);
    const totalPrincipal = totalValuation - totalProfitLoss;

    return {
        Section名: t.対象名,
        評価損益の合計: totalProfitLoss,
        評価額の合計: totalValuation,
        評価損益率: profitLossRate,
        元本額の合計: totalPrincipal,
    };
}

function displayTotalProfitLossForEachSection(): ProfitLossInfo[] {
    const sectionInfoList: ProfitLossInfo[] = [];
    const targetInfoList: TargetInfo[] = [
        {
            id: 'portfolio_det_mf',
            対象名: '投資信託',
            評価損益カラムIndex: 6,
            評価額カラムIndex: 4,
        },
        {
            id: 'portfolio_det_pns',
            対象名: '年金',
            評価損益カラムIndex: 3,
            評価額カラムIndex: 2,
        },
    ];

    targetInfoList.forEach((t) => {
        const totalInfo = extractNecessaryTotalFromTable(t);
        updateHeaderTotal(t, totalInfo.評価損益の合計, totalInfo.評価損益率);
        sectionInfoList.push(totalInfo);
    });

    return sectionInfoList;
}

function displayTotalProfitLossAtTop(sectionInfo: ProfitLossInfo[]): void {
    const adElement = document.querySelector('.mf-col-custom-ad');
    if (adElement) {
        adElement.remove();
    }

    const totalResult = sectionInfo.reduce((acc, current) => {
        Object.keys(current).forEach((key) => {
            if (['評価損益率', 'Section名'].includes(key)) {
                return;
            }
            const numericKey = key as keyof Omit<ProfitLossInfo, '評価損益率' | 'Section名'>;
            if (!(numericKey in acc)) {
                acc[numericKey] = 0;
            }
            acc[numericKey] += current[numericKey];
        });
        return acc;
    }, {} as Omit<ProfitLossInfo, '評価損益率'>);

    const headingElement = document.querySelector('section.bs-total-assets > div.heading-radius-box');
    if (headingElement) {
        headingElement.classList.remove('mf-mb20');
        headingElement.classList.add('mf-mb0');

        const displayTexts = [
            `有価証券： ${totalResult.評価額の合計.toLocaleString()}円`,
            `評価損益： ${totalResult.評価損益の合計.toLocaleString()}円`,
        ];

        displayTexts.forEach((text) => {
            const newNode = headingElement.cloneNode() as HTMLElement;
            newNode.textContent = text;
            headingElement.parentNode?.insertBefore(newNode, headingElement.nextSibling);
        });
    }

    const assetBreakdown = document.querySelector('section.bs-total-assets > h1.heading-small');
    if (assetBreakdown) {
        const profitLossBreakdown = assetBreakdown.cloneNode() as HTMLElement;
        profitLossBreakdown.textContent = '評価損益の内訳';
        profitLossBreakdown.style.borderLeftColor = 'green';
        assetBreakdown.parentNode?.appendChild(profitLossBreakdown);

        const profitLossTable = document.createElement('table');
        profitLossTable.classList.add('table', 'table-bordered');

        const rowData = [
            {
                タイトル: '投資信託',
                リンク先: 'portfolio_det_mf',
                評価損益: sectionInfo.find((v) => v.Section名 === '投資信託')?.評価損益の合計 || 0,
            },
            {
                タイトル: '年金',
                リンク先: 'portfolio_det_pns',
                評価損益: sectionInfo.find((v) => v.Section名 === '年金')?.評価損益の合計 || 0,
            },
        ];

        rowData.forEach((data) => {
            const tr = document.createElement('tr');

            const sectionName = document.createElement('th');
            const icon = document.createElement('img');
            icon.src =
                'https://assets.moneyforward.com/assets/bs/icon_table_arrow-528280ce2bfa721a3a1ee5b7c9bfc6e14aee0a27737c4a3bf34d854cbae2091f.png';
            const link = document.createElement('a');
            link.href = `portfolio#${data.リンク先}`;
            link.textContent = data.タイトル;
            sectionName.append(icon);
            sectionName.append(link);
            tr.append(sectionName);

            const profitLoss = document.createElement('td');
            profitLoss.textContent = `${data.評価損益.toLocaleString()}円`;
            tr.append(profitLoss);

            const percentage = document.createElement('td');
            percentage.textContent = `${((data.評価損益 / totalResult.評価損益の合計) * 100).toFixed(2)}%`;
            tr.append(percentage);

            profitLossTable.appendChild(tr);
        });

        headingElement?.parentNode?.appendChild(profitLossTable);
    }
}

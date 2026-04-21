import { TimeSeriesData } from '../../global';
import { HttpHookProp, hookFetch, hookXHR } from '../http/networkHooks';

const activeSectionLabelSelector = '.highcharts-legend-item:not(.highcharts-legend-item-hidden) tspan';

let hiddenSectionIndexs: number[] = [];

export function handleHistoryPage(): void {
    setCss();
    setNetWorkHook();
    kick();
}

function setCss() {
    const style = document.createElement('style');
    style.textContent = `
    .is-red-ink {
        color: #d04e4e;
        font-weight: 500;
    }
    .is-blue-ink {
        color: #52aaca;
        font-weight: 500;
    }
    .ml-8 {
        margin-left: 8px;
    }
    .mt-16 {
        margin-top: 16px;
    }
    .mb-2 {
        margin-bottom: 2px;
    }
    .total-price {
        font-size: 24px;
        margin-left: 8px;
    }
    .text-align-right {
        text-align: right;
    }
    `;
    document.head.appendChild(style);
}

function genChangesHtml(type: string, period: string, price: number, percentageText: string) {
    const isNegative = percentageText.startsWith('-');

    const base = document.createElement(type);
    base.classList.add(...[isNegative ? 'is-red-ink' : 'is-blue-ink']);

    const textNode = document.createTextNode(`${period}：¥${price.toLocaleString()}( ${percentageText} )`);
    base.appendChild(textNode);

    const iElement = document.createElement('i');
    iElement.classList.add(...[isNegative ? 'mf-icon-down' : 'mf-icon-up', 'ml-8']);
    base.appendChild(iElement);

    return base;
}

function genTotalPriceHtml(totalPrice: number, period: string, changePrice: number, changePer: string) {
    const base = document.createElement('div');
    base.id = 'us_total-price-html';
    base.classList.add(...['mt-16', 'pull-right', 'text-align-right']);

    // make totalPrice
    const totalPriceHtml = document.createElement('p');
    totalPriceHtml.classList.add(...['mb-2']);
    const label = document.createElement('span');
    label.textContent = '総資産';
    const price = document.createElement('span');
    price.classList.add(...['total-price']);
    price.textContent = `¥${totalPrice.toLocaleString()}`;
    totalPriceHtml.appendChild(label);
    totalPriceHtml.appendChild(price);
    // add changes
    const changesHtml = genChangesHtml('span', periodToJP(period), changePrice, changePer);

    base.appendChild(totalPriceHtml);
    base.appendChild(changesHtml);

    return base;
}

async function kick() {
    await addExtraPeriodButtons();
    const defaultPeriod = document.querySelector('[href="/update_chart/30"]');
    if (defaultPeriod) {
        (defaultPeriod as HTMLElement).click();
    }
}

async function addExtraPeriodButtons() {
    await sleep(10);
    const oneYearBtn = document.querySelector('[href="/update_chart/365"]') as HTMLAnchorElement | null;
    if (!oneYearBtn || !oneYearBtn.parentNode) {
        return;
    }

    const extras: { days: number; label: string }[] = [
        { days: 730, label: '2年' },
        { days: 1095, label: '3年' },
    ];

    let anchor: HTMLElement = oneYearBtn;
    for (const { days, label } of extras) {
        const href = `/update_chart/${days}`;
        const existing = document.querySelector(`[href="${href}"]`) as HTMLElement | null;
        if (existing) {
            anchor = existing;
            continue;
        }
        const newBtn = oneYearBtn.cloneNode(true) as HTMLAnchorElement;
        newBtn.setAttribute('href', href);
        const termSpan = newBtn.querySelector('.term');
        if (termSpan) {
            termSpan.textContent = label;
        } else {
            newBtn.textContent = label;
        }
        newBtn.classList.remove('active');
        newBtn.addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                newBtn.blur();
                void triggerUpdateChart(days, newBtn);
            },
            true,
        );
        anchor.parentNode?.insertBefore(newBtn, anchor.nextSibling);
        anchor = newBtn;
    }
}

async function triggerUpdateChart(days: number, clickedBtn: HTMLElement) {
    const indicator = clickedBtn.querySelector('.indicator') as HTMLElement | null;
    const term = clickedBtn.querySelector('.term') as HTMLElement | null;
    indicator?.classList.remove('hide');
    term?.classList.add('hide');
    try {
        const csrfToken =
            (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content || '';
        const resp = await fetch(`/update_chart/${days}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                Accept: '*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        if (!resp.ok) {
            return;
        }
        const js = await resp.text();
        const script = document.createElement('script');
        script.textContent = js;
        document.head.appendChild(script);
        document.head.removeChild(script);

        setActivePeriodButton(clickedBtn);
        await sleep(100);
        setActivePeriodButton(clickedBtn);
        update();
    } finally {
        indicator?.classList.add('hide');
        term?.classList.remove('hide');
    }
}

function setActivePeriodButton(btn: HTMLElement) {
    document.querySelectorAll('.btn.range-radio.active').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
}

async function update() {
    await sleep(10);
    const activeSection = getActiveSectionLabels();
    const { timeSeriesData } = window;
    const { percentageChange, totalStart, totalEnd } = getTotalChangesOfActiveSection(activeSection, timeSeriesData);
    display(getActivePeriod(), totalEnd, totalEnd - totalStart, percentageChange);
}

function getTotalChangesOfActiveSection(activeSection: string[], timeSeriesData: TimeSeriesData[]) {
    const sum = timeSeriesData.reduce(
        (p, c) => {
            if (activeSection.includes(c.name)) {
                p.start += c.data[0];
                p.end += c.data.at(-1) || 0;
            }
            return p;
        },
        { start: 0, end: 0 },
    );
    return {
        percentageChange: percentageChange(sum.start, sum.end),
        totalStart: sum.start,
        totalEnd: sum.end,
    };
}

function display(period: string, total: number, changePrice: number, changePer: string) {
    const targetParent = document.querySelector('#graph_contents');
    const targetChild = document.querySelector('#container_time_series_trend');
    if (!targetParent || !targetChild) {
        return;
    }
    const totalPriceHtml = genTotalPriceHtml(total, period, changePrice, changePer);
    const old = document.querySelector('#us_total-price-html');
    if (old) {
        old.parentNode?.removeChild(old);
    }
    targetParent.insertBefore(totalPriceHtml, targetChild);
}

function periodToJP(period: string) {
    if (period == '前日') {
        return period;
    }
    return `${period}前比`;
}

function percentageChange(oldValue: number, newValue: number): string {
    const difference = newValue - oldValue;
    const percentageChange = (difference / oldValue) * 100;
    return `${isNaN(percentageChange) ? 0 : percentageChange.toFixed(2)}%`;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getActiveSectionLabels(): string[] {
    const elements = document.querySelectorAll(activeSectionLabelSelector);
    const textContents = Array.from(elements).map((element) => element.textContent || '');
    return textContents;
}

function getActivePeriod(): string {
    return document.querySelector('.btn.range-radio.active')?.textContent?.replaceAll('\n', '') || '';
}

async function addClickHandlers() {
    await sleep(10);
    const legendItems = document.querySelectorAll('.highcharts-legend-item');
    legendItems.forEach((e) => {
        e.addEventListener('click', () => {
            update();
            hiddenSectionIndexs = getHiddenSectionIndexs();
        });
    });
}

function getHiddenSectionIndexs(): number[] {
    const labels = document.querySelectorAll('.highcharts-legend-item');
    const indexs: number[] = [];
    labels.forEach((e, i) => {
        if (e.classList.contains('highcharts-legend-item-hidden')) {
            indexs.push(i);
        }
    });
    return indexs;
}

function setNetWorkHook() {
    const cb = async (prop: HttpHookProp) => {
        if (prop.url.includes('https://moneyforward.com/update_chart/')) {
            await addClickHandlers();
            await recoverHideSection();
            update();
        }
    };
    hookXHR(cb);
    hookFetch(cb);
}

async function recoverHideSection() {
    const labels = document.querySelectorAll('.highcharts-legend-item');
    hiddenSectionIndexs.forEach((i) => {
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
        });
        labels.item(i).dispatchEvent(clickEvent);
    });
}

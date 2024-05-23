'use strict';
// ==UserScript==
// @name マネーフォワードME Web
// @namespace https://github.com/aozou99/TempermonkeyScripts
// @version v0.1.1
// @description Make a few changes to the design of MoneyforwardME
// @author A.A
// @match https://moneyforward.com/bs/portfolio
// @iconURL https://assets.moneyforward.com/assets/favicon-710b014dd04a85070bb0a55fa894b599015b5310333d38da9c85ad03594bbc20.ico
// @grant none
// @updateURL https://github.com/aozou99/TempermonkeyScripts/raw/main/dist/moneyforward.user.js
// @downloadURL https://github.com/aozou99/TempermonkeyScripts/raw/main/dist/moneyforward.user.js
// @supportURL https://github.com/aozou99/TempermonkeyScripts
// ==/UserScript==
(function () {
    'use strict';
    var sectionInfo = displayTotalProfitLossForEachSection();
    displayTotalProfitLossAtTop(sectionInfo);
})();
function calculateColumnTotal(table, columnIndex) {
    var rows = table.getElementsByTagName('tr');
    var total = 0;
    for (var i = 1; i < rows.length; i++) {
        var cell = rows[i].getElementsByTagName('td')[columnIndex];
        if (cell) {
            var text = cell.textContent || cell.innerText;
            var valueString = text.replace(/,/g, '').replace('円', '').trim();
            var value = parseFloat(valueString);
            if (!isNaN(value)) {
                total += value;
            }
        }
    }
    return total;
}
function updateHeaderTotal(t, totalProfitLoss, profitLossRate) {
    var header = document.querySelector('#'.concat(t.id, ' > section > h1.heading-small'));
    if (header) {
        header.textContent += '(\u8A55\u4FA1\u640D\u76CA\uFF1A '
            .concat(totalProfitLoss.toLocaleString(), '\u5186\u3001 \u8A55\u4FA1\u640D\u76CA\u7387\uFF1A ')
            .concat((profitLossRate * 100).toFixed(2), '%)');
    }
}
function extractNecessaryTotalFromTable(t) {
    var table = document.querySelector('#'.concat(t.id, ' > table'));
    var totalProfitLoss = calculateColumnTotal(table, t.評価損益カラムIndex);
    var totalValuation = calculateColumnTotal(table, t.評価額カラムIndex);
    var profitLossRate = totalProfitLoss / (totalValuation - totalProfitLoss);
    var totalPrincipal = totalValuation - totalProfitLoss;
    return {
        Section名: t.対象名,
        評価損益の合計: totalProfitLoss,
        評価額の合計: totalValuation,
        評価損益率: profitLossRate,
        元本額の合計: totalPrincipal,
    };
}
function displayTotalProfitLossForEachSection() {
    var sectionInfoList = [];
    var targetInfoList = [
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
    targetInfoList.forEach(function (t) {
        var totalInfo = extractNecessaryTotalFromTable(t);
        updateHeaderTotal(t, totalInfo.評価損益の合計, totalInfo.評価損益率);
        sectionInfoList.push(totalInfo);
    });
    return sectionInfoList;
}
function displayTotalProfitLossAtTop(sectionInfo) {
    var _a, _b, _c, _d;
    var adElement = document.querySelector('.mf-col-custom-ad');
    if (adElement) {
        adElement.remove();
    }
    var totalResult = sectionInfo.reduce(function (acc, current) {
        Object.keys(current).forEach(function (key) {
            if (['評価損益率', 'Section名'].includes(key)) {
                return;
            }
            var numericKey = key;
            if (!(numericKey in acc)) {
                acc[numericKey] = 0;
            }
            acc[numericKey] += current[numericKey];
        });
        return acc;
    }, {});
    var headingElement = document.querySelector('section.bs-total-assets > div.heading-radius-box');
    if (headingElement) {
        headingElement.classList.remove('mf-mb20');
        headingElement.classList.add('mf-mb0');
        var displayTexts = [
            '\u6709\u4FA1\u8A3C\u5238\uFF1A '.concat(totalResult.評価額の合計.toLocaleString(), '\u5186'),
            '\u8A55\u4FA1\u640D\u76CA\uFF1A '.concat(totalResult.評価損益の合計.toLocaleString(), '\u5186'),
        ];
        displayTexts.forEach(function (text) {
            var _a;
            var newNode = headingElement.cloneNode();
            newNode.textContent = text;
            (_a = headingElement.parentNode) === null || _a === void 0
                ? void 0
                : _a.insertBefore(newNode, headingElement.nextSibling);
        });
    }
    var assetBreakdown = document.querySelector('section.bs-total-assets > h1.heading-small');
    if (assetBreakdown) {
        var profitLossBreakdown = assetBreakdown.cloneNode();
        profitLossBreakdown.textContent = '評価損益の内訳';
        profitLossBreakdown.style.borderLeftColor = 'green';
        (_a = assetBreakdown.parentNode) === null || _a === void 0 ? void 0 : _a.appendChild(profitLossBreakdown);
        var profitLossTable_1 = document.createElement('table');
        profitLossTable_1.classList.add('table', 'table-bordered');
        var rowData = [
            {
                タイトル: '投資信託',
                リンク先: 'portfolio_det_mf',
                評価損益:
                    ((_b = sectionInfo.find(function (v) {
                        return v.Section名 === '投資信託';
                    })) === null || _b === void 0
                        ? void 0
                        : _b.評価損益の合計) || 0,
            },
            {
                タイトル: '年金',
                リンク先: 'portfolio_det_pns',
                評価損益:
                    ((_c = sectionInfo.find(function (v) {
                        return v.Section名 === '年金';
                    })) === null || _c === void 0
                        ? void 0
                        : _c.評価損益の合計) || 0,
            },
        ];
        rowData.forEach(function (data) {
            var tr = document.createElement('tr');
            var sectionName = document.createElement('th');
            var icon = document.createElement('img');
            icon.src =
                'https://assets.moneyforward.com/assets/bs/icon_table_arrow-528280ce2bfa721a3a1ee5b7c9bfc6e14aee0a27737c4a3bf34d854cbae2091f.png';
            var link = document.createElement('a');
            link.href = 'portfolio#'.concat(data.リンク先);
            link.textContent = data.タイトル;
            sectionName.append(icon);
            sectionName.append(link);
            tr.append(sectionName);
            var profitLoss = document.createElement('td');
            profitLoss.textContent = ''.concat(data.評価損益.toLocaleString(), '\u5186');
            tr.append(profitLoss);
            var percentage = document.createElement('td');
            percentage.textContent = ''.concat(((data.評価損益 / totalResult.評価損益の合計) * 100).toFixed(2), '%');
            tr.append(percentage);
            profitLossTable_1.appendChild(tr);
        });
        (_d = headingElement === null || headingElement === void 0 ? void 0 : headingElement.parentNode) === null ||
        _d === void 0
            ? void 0
            : _d.appendChild(profitLossTable_1);
    }
}

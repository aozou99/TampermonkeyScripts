// ==UserScript==
// @name         MoneyforwardMe
// @namespace    https://github.com/aozou99/TempermonkeyScripts
// @version      v0.0.2
// @description  Make a few changes to the design of MoneyforwardME
// @author       A.A
// @match        https://moneyforward.com/bs/portfolio
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @updateURL    https://github.com/aozou99/TempermonkeyScripts/raw/main/src/moenyfowardme.user.js
// @downloadURL  https://github.com/aozou99/TempermonkeyScripts/raw/main/src/moenyfowardme.user.js
// @supportURL   https://github.com/aozou99/TempermonkeyScripts
// ==/UserScript==

/**
 * @typedef 損益情報
 * @property {number} 損益評価額の合計
 * @property {number} 評価額の合計
 * @property {number} 評価損益率
 * @property {number} 元本額の合計
 */

/**
 * @typedef 各Sectionの損益情報合計結果
 * @property {number} 損益評価額の合計
 * @property {number} 評価額の合計
 * @property {number} 元本額の合計
 */

/**
 * @typedef 評価損益の合計を表示させる対象
 * @property {string} id
 * @property {string} 対象名
 * @property {number} 評価損益カラムIndex
 * @property {number} 評価額カラムIndex
 */

(function () {
    'use strict';
    const 各Sectionの損益情報 = 各Sectionに評価損益の合計を表示();
    各Sectionの損益情報の合計をページ上部見出しに表示する(各Sectionの損益情報);
})();

// 指定されたカラムの値の合計を計算する関数
const calculateColumnTotal = (table, columnIndex) => {
    const rows = table.getElementsByTagName('tr');
    let total = 0;

    // テーブルの各行に対してループ
    for (let i = 1; i < rows.length; i++) {
        // i = 1 から開始してヘッダーをスキップ
        const cell = rows[i].getElementsByTagName('td')[columnIndex];
        if (cell) {
            // 通貨フォーマットから数値に変換
            const text = cell.textContent || cell.innerText;
            const valueString = text.replace(/,/g, '').replace('円', '').trim();
            const value = parseFloat(valueString);
            if (!isNaN(value)) {
                // 数値であれば加算
                total += value;
            }
        }
    }

    return total;
};

const 対象の合計額の見出しの更新 = (t, 損益評価額の合計, 評価損益率) => {
    // 対象の合計額の見出し
    const 対象の合計額の見出し = document.querySelector(`#${t.id}>section>h1.heading-small`);
    対象の合計額の見出し.textContent += `(損益評価額: ${損益評価額の合計.toLocaleString()}円, 評価損益率: ${(
        評価損益率 * 100
    ).toFixed(2)}%)`;
};

/**
 * @param {評価損益の合計を表示させる対象} t
 * @returns {損益情報}
 */
const 対象テーブルから必要な合計額を抽出 = (t) => {
    const 対象テーブル = document.querySelector(`#${t.id}>table`);
    const 損益評価額の合計 = calculateColumnTotal(対象テーブル, t.評価損益カラムIndex);
    const 評価額の合計 = calculateColumnTotal(対象テーブル, t.評価額カラムIndex);
    const 評価損益率 = 損益評価額の合計 / (評価額の合計 - 損益評価額の合計);
    const 元本額の合計 = 評価額の合計 - 損益評価額の合計;
    return { 損益評価額の合計, 評価額の合計, 評価損益率, 元本額の合計 };
};

/**
 * @returns {損益情報[]}
 */
const 各Sectionに評価損益の合計を表示 = () => {
    const 各セクション毎の損益情報 = [];
    const 評価損益の合計を表示させる対象 = [
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
    評価損益の合計を表示させる対象.forEach((t) => {
        const 合計結果 = 対象テーブルから必要な合計額を抽出(t);
        対象の合計額の見出しの更新(t, 合計結果.損益評価額の合計, 合計結果.評価損益率);
        各セクション毎の損益情報.push({
            名前: t.対象名,
            ...合計結果,
        });
    });
    return 各セクション毎の損益情報;
};

/**
 * @param {損益情報[]} 各Sectionの損益情報
 */
const 各Sectionの損益情報の合計をページ上部見出しに表示する = (各Sectionの損益情報) => {
    /** @type {各Sectionの損益情報合計結果} */
    const 合計結果 = 各Sectionの損益情報.reduce((acc, current) => {
        Object.keys(current).forEach((key) => {
            if (key === '評価損益率') {
                return;
            }
            if (!acc[key]) {
                acc[key] = 0;
            }
            acc[key] += current[key];
        });
        return acc;
    }, {});
    const ページ上部見出し = document.querySelector('section.bs-total-assets > div.heading-radius-box');
    ページ上部見出し.textContent += `損益評価額: ${合計結果.損益評価額の合計}`;
};

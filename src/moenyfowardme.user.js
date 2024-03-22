// ==UserScript==
// @name         MoneyforwardMe
// @namespace    https://github.com/aozou99/TempermonkeyScripts
// @version      v0.1.0
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
 * @property {string} Section名
 * @property {number} 評価損益の合計
 * @property {number} 評価額の合計
 * @property {number} 評価損益率
 * @property {number} 元本額の合計
 */

/**
 * @typedef 各Sectionの損益情報合計結果
 * @property {number} 評価損益の合計
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
function calculateColumnTotal(table, columnIndex) {
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
}

function 対象の合計額の見出しの更新(t, 評価損益の合計, 評価損益率) {
    // 対象の合計額の見出し
    const 対象の合計額の見出し = document.querySelector(`#${t.id}>section>h1.heading-small`);
    対象の合計額の見出し.textContent += `(評価損益： ${評価損益の合計.toLocaleString()}円、 評価損益率： ${(
        評価損益率 * 100
    ).toFixed(2)}%)`;
}

/**
 * @param {評価損益の合計を表示させる対象} t
 * @returns {損益情報}
 */
function 対象テーブルから必要な合計額を抽出(t) {
    const 対象テーブル = document.querySelector(`#${t.id}>table`);
    const 評価損益の合計 = calculateColumnTotal(対象テーブル, t.評価損益カラムIndex);
    const 評価額の合計 = calculateColumnTotal(対象テーブル, t.評価額カラムIndex);
    const 評価損益率 = 評価損益の合計 / (評価額の合計 - 評価損益の合計);
    const 元本額の合計 = 評価額の合計 - 評価損益の合計;
    return { Section名: t.対象名, 評価損益の合計, 評価額の合計, 評価損益率, 元本額の合計 };
}

/**
 * @returns {損益情報[]}
 */
function 各Sectionに評価損益の合計を表示() {
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
        対象の合計額の見出しの更新(t, 合計結果.評価損益の合計, 合計結果.評価損益率);
        各セクション毎の損益情報.push(合計結果);
    });
    return 各セクション毎の損益情報;
}

/**
 * @param {損益情報[]} 各Sectionの損益情報
 */
function 各Sectionの損益情報の合計をページ上部見出しに表示する(各Sectionの損益情報) {
    // 不要な広告は削除
    document.querySelector('.mf-col-custom-ad').remove();

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
    ページ上部見出し.classList.remove('mf-mb20');
    ページ上部見出し.classList.add('mf-mb0');

    const 評価損益合計の表示先 = ページ上部見出し.cloneNode();
    評価損益合計の表示先.textContent = `評価損益： ${合計結果.評価損益の合計.toLocaleString()}円`;
    // オリジナルの要素の後ろにクローンを挿入
    if (ページ上部見出し.nextSibling) {
        // オリジナルの要素に次の兄弟要素がある場合、その前にクローンを挿入
        ページ上部見出し.parentNode.insertBefore(評価損益合計の表示先, ページ上部見出し.nextSibling);
    } else {
        // オリジナルの要素が親の最後の子要素の場合、クローンを親の最後に追加
        ページ上部見出し.parentNode.appendChild(評価損益合計の表示先);
    }

    // 評価損益の内訳を見出し作成
    const 資産の内訳 = document.querySelector('section.bs-total-assets > h1.heading-small');
    const 評価損益の内訳 = 資産の内訳.cloneNode();
    評価損益の内訳.textContent = '評価損益の内訳';
    評価損益の内訳.style.borderLeftColor = 'green';
    資産の内訳.parentNode.appendChild(評価損益の内訳);

    // 評価損益の内訳テーブルを作成
    // テーブル要素を作成
    const 評価損益の内訳テーブル = document.createElement('table');
    評価損益の内訳テーブル.classList.add('table', 'table-bordered');
    const 行情報 = [
        ['投資信託', 'portfolio_det_mf', 各Sectionの損益情報.find((v) => v.Section名 === '投資信託').評価損益の合計],
        ['年金', 'portfolio_det_pns', 各Sectionの損益情報.find((v) => v.Section名 === '年金').評価損益の合計],
    ];
    for (let i = 0; i < 行情報.length; i++) {
        const tr = document.createElement('tr');

        // 見出し列のSection名を追加
        const Section名 = document.createElement('th');
        const icon = document.createElement('img');
        icon.src =
            'https://assets.moneyforward.com/assets/bs/icon_table_arrow-528280ce2bfa721a3a1ee5b7c9bfc6e14aee0a27737c4a3bf34d854cbae2091f.png';
        const link = document.createElement('a');
        link.href = `portfolio#${行情報[i][1]}`;
        link.textContent = 行情報[i][0];
        Section名.append(icon);
        Section名.append(link);
        tr.append(Section名);

        // 評価損益を追加
        const 評価損益 = document.createElement('td');
        評価損益.textContent = `${行情報[i][2].toLocaleString()}円`;
        tr.append(評価損益);

        // 割合を追加
        const 割合 = document.createElement('td');
        割合.textContent = `${((行情報[i][2] / 合計結果.評価損益の合計) * 100).toFixed(2)}%`;
        tr.append(割合);

        // 行をテーブルに追加
        評価損益の内訳テーブル.appendChild(tr);
    }
    ページ上部見出し.parentNode.appendChild(評価損益の内訳テーブル);
}

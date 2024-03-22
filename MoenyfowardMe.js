// ==UserScript==
// @name         MoneyforwardMe
// @namespace    xxx
// @version      v0.0.1
// @description  Make a few changes to the design of MoneyforwardME
// @author       A.A
// @match        https://moneyforward.com/bs/portfolio
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
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
    // 対象のテーブルと合計するカラムのインデックス
    const 対象テーブル = document.querySelector(`#${t.id}>table`);
    // 対象の合計額の見出し
    const 対象の合計額の見出し = document.querySelector(
      `#${t.id}>section>h1.heading-small`,
    );
    // 合計を計算してセクションのタイトルに追加
    const 損益評価額の合計 = calculateColumnTotal(
      対象テーブル,
      t.評価損益カラムIndex,
    );
    const 評価額の合計 = calculateColumnTotal(
      対象テーブル,
      t.評価額カラムIndex,
    );
    const 評価損益率 = 損益評価額の合計 / (評価額の合計 - 損益評価額の合計);
    対象の合計額の見出し.textContent += `(損益評価額: ${損益評価額の合計.toLocaleString()}円, 評価損益率: ${(
      評価損益率 * 100
    ).toFixed(2)}%)`;
  });
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

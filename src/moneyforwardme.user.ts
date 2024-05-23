// ==UserScript==
// @name マネーフォワードME Web
// @namespace https://github.com/aozou99/TempermonkeyScripts
// @version v0.1.1
// @description Make a few changes to the design of MoneyforwardME
// @author A.A
// @match https://moneyforward.com/bs/portfolio
// @match https://moneyforward.com/bs/history
// @iconURL https://assets.moneyforward.com/assets/favicon-710b014dd04a85070bb0a55fa894b599015b5310333d38da9c85ad03594bbc20.ico
// @grant none
// @updateURL https://github.com/aozou99/TempermonkeyScripts/raw/main/dist/moneyforward.user.js
// @downloadURL https://github.com/aozou99/TempermonkeyScripts/raw/main/dist/moneyforward.user.js
// @supportURL https://github.com/aozou99/TempermonkeyScripts
// ==/UserScript==

import { handlePortfolioPage } from './pages/portfolio';
import { handleHistoryPage } from './pages/history';

(function () {
    'use strict';

    const currentURL = window.location.href;

    if (currentURL.includes('/bs/portfolio')) {
        handlePortfolioPage();
    } else if (currentURL.includes('/bs/history')) {
        handleHistoryPage();
    }
})();

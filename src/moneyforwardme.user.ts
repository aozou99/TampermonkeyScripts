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

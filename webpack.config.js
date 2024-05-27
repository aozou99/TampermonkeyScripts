const path = require('path');
const fs = require('fs');
const { UserscriptPlugin } = require('webpack-userscript');

const version = fs.readFileSync(path.resolve(__dirname, '.version'), 'utf-8').trim();

module.exports = {
    entry: './src/moneyforwardme.user.ts',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'moneyforwardme.user.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new UserscriptPlugin({
            headers: {
                name: 'マネーフォワードME Web',
                namespace: 'https://github.com/aozou99/TempermonkeyScripts',
                version: version,
                description: 'Make a few changes to the design of MoneyforwardME',
                author: 'A.A',
                match: ['https://moneyforward.com/bs/portfolio', 'https://moneyforward.com/bs/history'],
                iconURL:
                    'https://assets.moneyforward.com/assets/favicon-710b014dd04a85070bb0a55fa894b599015b5310333d38da9c85ad03594bbc20.ico',
                grant: 'none',
                updateURL: 'https://github.com/aozou99/TempermonkeyScripts/raw/main/dist/moneyforwardme.user.js',
                downloadURL: 'https://github.com/aozou99/TempermonkeyScripts/raw/main/dist/moneyforwardme.user.js',
                supportURL: 'https://github.com/aozou99/TempermonkeyScripts',
            },
        }),
    ],
};

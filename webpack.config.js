const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './src/index.ts',
    output: {
        libraryTarget: "commonjs2",
        filename: 'spawn.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.ts']
    },
    module: {
        rules: [
            { loader: 'ts-loader' }
        ]
    }
};

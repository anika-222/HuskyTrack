const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      // 🔧 Allow ESM without “fully specified” extensions (fixes Amplify .mjs imports)
      {
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    // 🔧 Provide Node globals expected by aws-amplify
    new webpack.ProvidePlugin({
      process: 'process/browser.js',      // NOTE the .js extension
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  devServer: {
    static: [
      { directory: path.join(__dirname, 'dist') },
      { directory: path.join(__dirname, 'public'), publicPath: '/' },
    ],
    historyApiFallback: true,
    port: 3000,
    open: true,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    // 🔧 Prefer explicit .js to satisfy “fully specified” modules
    alias: {
      'process/browser': 'process/browser.js', // make sure imports resolve WITH extension
    },
    // 🔧 Polyfills for Node modules used by Amplify
    fallback: {
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser.js'), // NOTE the .js extension
    },
  },
};

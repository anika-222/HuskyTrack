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
      // Allow ESM without “fully specified” extensions (fixes Amplify .mjs imports)
      {
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    // Provide Node globals expected by aws-amplify
    new webpack.ProvidePlugin({
      process: 'process/browser.js', // note .js extension
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  devServer: {
    static: [
      { directory: path.join(__dirname, 'dist') },
      { directory: path.join(__dirname, 'public'), publicPath: '/' },
    ],
    historyApiFallback: true,  // SPA routing (so /signin works on refresh)
    port: 3000,
    // Open the sign-in route when you run `npm start`
    open: ['/signin'],
    // If your dev-server version doesn’t support array syntax, use:
    // open: { target: ['http://localhost:3000/signin'] },
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      // Ensure "process/browser" resolves with explicit extension
      'process/browser': 'process/browser.js',
    },
    fallback: {
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser.js'), // note .js extension
    },
  },
};

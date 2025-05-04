const path = require('path');

module.exports = {
  mode: 'development',
  entry: './dist/renderer/apps/xeroapp.js',
  output: {
    path: path.resolve(__dirname, 'dist', 'renderer'),
    filename: 'xeroapp.bundle.js',
  },
  devtool: 'inline-source-map',
};

const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  target: 'web'
, node: {
    fs: 'empty'
  , module: 'empty'
  }
, entry: {
    'background': './src/background.ts'
  , 'options': './src/options.tsx'
  }
, output: {
    path: path.join(__dirname, 'dist')
  , filename: '[name].js'
  }
, resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  }
, module: {
    rules: [
      {
        test: /\.tsx?$/
      , exclude: /node_module/
      , use: 'ts-loader'
      }
    ]
  }
, plugins: [
    new CleanWebpackPlugin(['dist'])
  , new CopyWebpackPlugin(
      [
        { from: './src', ignore: ['*.ts', '*.tsx'] }
      ]
    )
  ]
}

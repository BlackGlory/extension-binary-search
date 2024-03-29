const path = require('path')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  target: 'web'
, entry: {
    'background': './src/background/index.ts'
  , 'popup': './src/popup/index.tsx'
  , 'dialog': './src/dialog/index.tsx'
  }
, output: {
    path: path.join(__dirname, 'dist')
  , filename: '[name].js'
  }
, resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  , plugins: [new TsconfigPathsPlugin()]
  }
, module: {
    rules: [
      {
        test: /\.tsx?$/
      , exclude: /node_module/
      , use: 'ts-loader'
      }
    , {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      }
    ]
  }
, plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: './src'
        , globOptions: {
            ignore: ['**/*.ts', '**/*.tsx', '**/*.html', '**/manifest.*.json']
          }
        }
      , { from: './src/popup/index.html', to: 'popup.html' }
      , { from: './src/dialog/index.html', to: 'dialog.html' }
      ]
    })
  ]
}

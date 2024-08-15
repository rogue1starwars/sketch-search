const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const config = {
  mode: "production",
  entry: "./src/web/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true,
  },
  devServer: {
    static: "./build",
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: "body",
      template: "./src/web/index.html",
    }),
    new MiniCssExtractPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.js[x]?$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: "images/[hash][ext][query]",
        },
      },
    ],
  },
  target: "web",
  resolve: {
    extensions: [".js", ".jsx"],
  },
};

module.exports = (env, argv) => {
  if (argv.mode === "development") {
    config.mode = "development";
    config.watch = true;
    config.devtool = "source-map";
  }
  return config;
};

var path = require('path');
var webpack = require('webpack');

var { VueLoaderPlugin } = require('vue-loader');
var TerserPlugin = require("terser-webpack-plugin");

var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
var nodeExternals = require('webpack-node-externals');
// https://github.com/webpack/webpack/tree/master/examples

module.exports = (env, argv) => {

    console.log(argv, env);

    const prod = argv.mode === 'production';
    const filename = prod ? '[name].min' : '[name]'; //'[contenthash:6]'; 
    // const BASE_URL = process.env.BASE_URL ?? '/';

    return {
        mode: 'development',
        target: 'web',
        devtool: prod ? false : 'source-map',
        // entry: {
        //     'main': { import: './src/main.js', dependOn: ["vue.lib"] },
        //     'vue.lib': ['vue', 'vuex', 'vue-router', '@vuelidate/core', '@vuelidate/validators', '@headlessui/vue'],
        // },
        entry: {
            editor: { import: './src/index.js' },
        },
       
        output: {
            path: path.join(__dirname, './dist'),
            //filename: '[name].[hash:8].js',
            filename: filename + '.js',
            // publicPath: BASE_URL,
            clean: prod,
            // chunkFilename: '[name]/chunk.js',
            //sourceMapFilename: '[name].map'
        },
        // externals: ['vue','crypto'],
        externals: [
            nodeExternals(),
        ],
        optimization: {
            minimize: prod,           
            minimizer: [
                new TerserPlugin(),
                new CssMinimizerPlugin()
            ],
        },

        performance: { hints: prod ? false : 'warning' },
        stats: {
            chunks: true,
            chunkRelations: true
        },


        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader',
                },

                {
                    test: /\.js$/,
                    loader: 'babel-loader'
                },


                {

                    test: /\.s?[ac]ss$/,
                    use: [
                        // 'vue-style-loader',
                        MiniCssExtractPlugin.loader,
                        // 
                        'css-loader',
                        'postcss-loader',
                        'sass-loader'
                        // {
                        //     loader: 'sass-loader',
                        //     options: {
                        //         sassOptions: {
                        //             includePaths: ['./node_modules']
                        //         },
                        //         // Prefer Dart Sass
                        //         implementation: require('sass'),

                        //         // See https://github.com/webpack-contrib/sass-loader/issues/804
                        //         webpackImporter: false,
                        //     }
                        // },

                    ]
                }


            ]
        },

        plugins: [          
           
            new webpack.EnvironmentPlugin({
                DEBUG: !prod,                
            }),

            new MiniCssExtractPlugin({
                filename: filename + '.css',
            }),

            new VueLoaderPlugin(),           

            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            }),

            

        ],


    };
};
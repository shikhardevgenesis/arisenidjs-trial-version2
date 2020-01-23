const path = require('path');
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')


const getPackagePath = x => `./packages/${x}/src/index.js`;

const packageFiles = [
	'core',
	'plugin-arisenjs',
	'plugin-arisenjs2',
	'plugin-web3',
	'plugin-tron',
	'plugin-lynx',
];

const entry = packageFiles.reduce((o, file) => Object.assign(o, {[`${file}.min.js`]: getPackagePath(file)}), {});


module.exports = {
	entry,
	output: {
		path: path.resolve(__dirname, './bundles'),
		filename: 'arisenidjs-[name]'
	},
	resolve: {
		modules:[
			"node_modules"
		]
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							'@babel/preset-env'
						],
						plugins:[
							'@babel/plugin-transform-runtime'
						]
					}
				},
				exclude: /node_modules/
			}
		],
	},
	plugins: [
		new webpack.BannerPlugin({
			banner:(x) => {
				const packageName = x.filename.replace('arisenidjs-', '').replace('.min.js', '');
				const version = require(`./packages/${packageName}/package.json`).version;
				return `
ArisenidJS - ${packageName} v${version}
https://github.com/GetArisenid/arisenid-js/
Released under the MIT license.
				`;
			}
		}),
		// new UglifyJsPlugin()

	],
	stats: { colors: true },
	// devtool: false,
	devtool: 'inline-source-map',
	externals: {
		'arisenidjs-trial-version2-core': 'ArisenidJS'
	}
}

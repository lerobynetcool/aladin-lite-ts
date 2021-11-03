const fs = require('fs')
const uglify = require("uglify-js")
const less = require('less')

const lessPluginCleanCSS = require('less-plugin-clean-css')

const version = new Date().toISOString().split('T')[0]
// const buildpath = `build/${version}`
const buildpath = `build/`

function mkdir(path) { return fs.mkdirSync(path, {recursive: true}) }
function write(path,data) { return fs.writeFileSync(`${buildpath}/${path}`, data) }
function read(path) { return fs.readFileSync(path).toString() }

async function mincss(css) {
	return await less.render(css, {plugins: [new lessPluginCleanCSS({advanced: true})]})
}

async function main() {
	mkdir(buildpath)

	const files = [
		'src/js/cds.js',
		'src/js/libs/json2.js',
		'src/js/Logger.js',
		'src/js/libs/jquery.mousewheel.js',
		'src/js/libs/RequestAnimationFrame.js',
		'src/js/libs/Stats.js',
		'src/js/libs/healpix.min.js',
		'src/js/libs/astro/astroMath.js',
		'src/js/libs/astro/projection.js',
		'src/js/libs/astro/coo.js',
		'src/js/SimbadPointer.js',
		'src/js/Box.js',
		'src/js/CooConversion.js',
		'src/js/Sesame.js',
		'src/js/HealpixCache.js',
		'src/js/Utils.js',
		'src/js/URLBuilder.js',
		'src/js/MeasurementTable.js',
		'src/js/Color.js',
		'src/js/AladinUtils.js',
		'src/js/ProjectionEnum.js',
		'src/js/CooFrameEnum.js',
		'src/js/HiPSDefinition.js',
		'src/js/Downloader.js',
		'src/js/libs/fits.js',
		'src/js/MOC.js',
		'src/js/CooGrid.js',
		'src/js/Footprint.js',
		'src/js/Popup.js',
		'src/js/Circle.js',
		'src/js/Polyline.js',
		'src/js/Overlay.js',
		'src/js/Source.js',
		'src/js/Catalog.js',
		'src/js/ProgressiveCat.js',
		'src/js/Tile.js',
		'src/js/TileBuffer.js',
		'src/js/ColorMap.js',
		'src/js/HpxKey.js',
		'src/js/HpxImageSurvey.js',
		'src/js/HealpixGrid.js',
		'src/js/Location.js',
		'src/js/View.js',
		'src/js/Aladin.js',
	]

	let aladinjs = files.map(path => read(path).replace(/{ALADIN-LITE-VERSION-NUMBER}/g,version)).join('\n')
	let aladinmin = uglify.minify(aladinjs)

	write('aladin.js',aladinjs)
	write('aladin.min.js',aladinmin.code)

	let aladincss = read('src/css/aladin.css')
	let aladinmincss = (await mincss(aladincss)).css

	write('aladin.css',aladincss)
	write('aladin.min.css',aladinmincss)
}

main()

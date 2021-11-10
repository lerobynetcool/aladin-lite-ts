#!/bin/bash

# Build script for Aladin Lite
#
#
# Create files aladin.js, aladin.min.js, aladin.min.css
# 
# Pre-requisite : 
# - uglifyjs version 2 : https://github.com/mishoo/UglifyJS2
# - lessc
#

scriptdir="$( cd "$( dirname "$0" )" && pwd )"
srcdir=${scriptdir}/src

distribfile=${scriptdir}/aladin.js
distribfileminified=${scriptdir}/aladin.min.js

csssrcfile=${srcdir}/css/aladin.css
cssfileminified=${scriptdir}/aladin.min.css

uglifyjs="/usr/bin/uglifyjs"
lessc="/usr/bin/lessc"

jsfiles=('cds.js' 'json2.js' 'Logger.js' 'jquery.mousewheel.js' 'RequestAnimationFrame.js' 'Stats.js' 'healpix.min.js' 'astroMath.js' 'projection.js' 'coo.js' 'SimbadPointer.js' 'Box.js' 'fits.js' 'CooConversion.js' 'Sesame.js' 'HealpixCache.js' 'Utils.js' 'URLBuilder.js' 'MeasurementTable.js' 'Color.js' 'AladinUtils.js' 'ProjectionEnum.js' 'CooFrameEnum.js' 'HiPSDefinition.js' 'Downloader.js' 'CooGrid.js' 'Footprint.js' 'Popup.js' 'Circle.js' 'Polyline.js' 'Overlay.js' 'Source.js' 'Catalog.js' 'ProgressiveCat.js' 'Tile.js' 'TileBuffer.js' 'ColorMap.js' 'HpxKey.js' 'HpxImageSurvey.js' 'HealpixGrid.js' 'Location.js' 'View.js' 'Aladin.js')

list=""
for t in "${jsfiles[@]}"
do
    list="${list} ${srcdir}/js/$t"
done

# version non minifiée
cat ${list} > ${distribfile}

# version minifiée
${uglifyjs} ${list} --comments -c -m > ${distribfileminified}

# traitement des CSS
${lessc} --compress ${csssrcfile} > ${cssfileminified}


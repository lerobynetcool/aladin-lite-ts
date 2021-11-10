#!/bin/bash

scriptdir="$( cd "$( dirname "$0" )" && pwd )"
srcdir=${scriptdir}/../src

# create version number
version=$(date +%F)

distribdir=${scriptdir}/../distrib/${version}

mkdir -p ${distribdir}

distribfile=${distribdir}/aladin.js

jsfiles=(
    'js/cds.js'
    'js/libs/json2.js'
    'js/Logger.js'
    'js/libs/jquery.mousewheel.js'
    'js/libs/RequestAnimationFrame.js'
    'js/libs/Stats.js'
    'js/libs/healpix.min.js'
    'js/libs/astro/astroMath.js'
    'js/libs/astro/projection.js'
    'js/libs/astro/coo.js'
    'js/SimbadPointer.js'
    'js/Box.js'
    'js/CooConversion.js'
    'js/Sesame.js'
    'js/HealpixCache.js'
    'js/Utils.js'
    'js/URLBuilder.js'
    'js/MeasurementTable.js'
    'js/Color.js'
    'js/AladinUtils.js'
    'js/ProjectionEnum.js'
    'js/CooFrameEnum.js'
    'js/HiPSDefinition.js'
    'js/Downloader.js'
    'js/libs/fits.js'
    'js/MOC.js'
    'js/CooGrid.js'
    'js/Footprint.js'
    'js/Popup.js'
    'js/Circle.js'
    'js/Polyline.js'
    'js/Overlay.js'
    'js/Source.js'
    'js/Catalog.js'
    'js/ProgressiveCat.js'
    'js/Tile.js'
    'js/TileBuffer.js'
    'js/ColorMap.js'
    'js/HpxKey.js'
    'js/HpxImageSurvey.js'
    'js/HealpixGrid.js'
    'js/Location.js'
    'js/View.js'
    'js/Aladin.js'
)

fileList=""
for t in "${jsfiles[@]}"
do
    fileList="${fileList} ${srcdir}/$t"
done

# version non minifiée
cat ${fileList} | sed -e 's/{ALADIN-LITE-VERSION-NUMBER}/${version}/g' > ${distribfile}
# version minifiée
npx uglifyjs ${distribfile} --comments -c -m > ${distribdir}/aladin.min.js

csssrcfile=${srcdir}/css/aladin.css
# npx lessc --compress ${csssrcfile}                          > ${distribdir}/aladin.min.css
npx lessc            ${csssrcfile} --clean-css="--advanced" > ${distribdir}/aladin.min.css

cp ${csssrcfile} ${distribdir}

# update symbolic link pointing to latest release
latest_symlink=${scriptdir}/../distrib/latest
ln -sf ${distribdir} ${latest_symlink}

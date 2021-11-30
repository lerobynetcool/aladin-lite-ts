// Copyright 2016 - UDS/CNRS
// The Aladin Lite program is distributed under the terms
// of the GNU General Public License version 3.
//
// This file is part of Aladin Lite.
//
//    Aladin Lite is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, version 3 of the License.
//
//    Aladin Lite is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    The GNU General Public License is available in COPYING file
//    along with Aladin Lite.
//

/******************************************************************************
 * Aladin Lite project
 *
 * File HpxKey
 * This class represents a HEALPix cell
 *
 * Author: Thomas Boch[CDS]
 *
 *****************************************************************************/

/** Returns the squared distance for points in array c at indexes g and d */
function dist(c, g, d) {
	let dx=c[g].vx-c[d].vx
	let dy=c[g].vy-c[d].vy
	return dx*dx + dy*dy
}

let M = 280*280
let N = 150*150
let RAP=0.7

/** Returns true if the HEALPix rhomb described by its 4 corners (array c)
 * is too large to be drawn in one pass ==> need to be subdivided */
function isTooLarge(c) {
	let d1
	let d2
	if ( (d1=dist(c,0,2))>M || (d2=dist(c,2,1))>M ) return true
	if ( d1==0 || d2==0 ) throw "Rhomb error"
	let diag1 = dist(c,0,3)
	let diag2 = dist(c,1,2)
	if ( diag2==0 || diag2==0 ) throw "Rhomb error" // TODO : potential bug, this is testing twice for the same thing.
	let rap = diag2>diag1 ? diag1/diag2 : diag2/diag1
	return rap<RAP && (diag1>N || diag2>N)
}

let MAX_PARENTE = 4

class HpxKey {
	constructor(norder, npix, hips, width, height, dx, dy, allskyTexture, allskyTextureSize) {
		this.norder = norder
		this.npix = npix

		this.nside = Math.pow(2, norder)

		this.hips = hips // survey to which this HpxKey is attached
		this.frame = hips.cooFrame // coordinate frame of the survey to which this HpxKey is attached

		this.width = width // width of the tile
		this.height = height // height of the tile

		this.dx = dx || 0 // shift in x (for all-sky tiles)
		this.dy = dy || 0 // shift in y (for all-sky tiles)

		this.allskyTexture = allskyTexture
		this.allskyTextureSize = allskyTextureSize

		this.parente = 0 // if this key comes from an ancestor, length of the filiation

		this.children = null
		this.ancestor = null // ancestor having the pixels
	}

	// "static" methods
	static createHpxKeyfromAncestor(father, childNb) {
		let hpxKey = new HpxKey(
			father.norder+1,
			father.npix*4 + childNb,
			father.hips,
			father.width/2,
			father.height/2,
			childNb==2 || childNb==3 ? father.dx+father.width/2 : father.dx, childNb==1 || childNb==3 ? father.dy+father.height/2 : father.dy,
			father.allskyTexture, father.allskyTextureSize)
		hpxKey.parente = father.parente + 1
		hpxKey.ancestor = father.ancestor || father

		return hpxKey
	}

	draw(ctx, view) {
		//console.log('Drawing ', this.norder, this.npix)
		let n = 0 // number of traced triangles
		let corners = this.getProjViewCorners(view)

		if (corners==null) return 0

		let now = new Date().getTime()
		let updateNeededTiles = this.ancestor==null && this.norder>=3 && (now-this.hips.lastUpdateDateNeededTiles) > 0.1

		try {
			if (isTooLarge(corners)) {
				//console.log('too large')
				let m = this.drawChildren(ctx, view, MAX_PARENTE)

				// Si aucun sous-losange n'a pu être dessiné, je trace tout de même le père
				if( m>0 ) {
					return m
				}
			}
		}
		catch(e) {
			return 0
		}

		// actual drawing
		let norder = this.ancestor==null ? this.norder : this.ancestor.norder
		let npix = this.ancestor==null ? this.npix : this.ancestor.npix

		//console.log(corners)
		//corners = AladinUtils.grow2(corners, 1) // grow by 1 pixel in each direction
		//console.log(corners)
		let url = this.hips.getTileURL(norder, npix)
		let tile = this.hips.tileBuffer.getTile(url)
		if (tile && Tile.isImageOk(tile.img) || this.allskyTexture) {
			if (!this.allskyTexture && !this.hips.tileSize) {
				this.hips.tileSize = tile.img.width
			}
			let img = this.allskyTexture || tile.img
			let w = this.allskyTextureSize || img.width
			if (this.parente) {
				w = w / Math.pow(2, this.parente)
			}

			this.hips.drawOneTile2(ctx, img, corners, w, null, this.dx, this.dy, true, norder)
			n += 2
		}
		else if (updateNeededTiles && ! tile) {
			tile = this.hips.tileBuffer.addTile(url)
			view.downloader.requestDownload(tile.img, tile.url, this.hips.useCors)
			this.hips.lastUpdateDateNeededTiles = now
			view.requestRedrawAtDate(now+HpxImageSurvey.UPDATE_NEEDED_TILES_DELAY+10)
		}

		return n
	}

	drawChildren(ctx, view, maxParente) {
		let n=0
		let limitOrder = 13 // corresponds to NSIDE=8192, current HealpixJS limit
		if ( this.width>1 && this.norder<limitOrder && this.parente<maxParente ) {
			let children = this.getChildren()
			if ( children!=null ) {
				for (let i=0; i<4; i++) {
					//console.log(i)
					if ( children[i]!=null ) {
						n += children[i].draw(ctx , view, maxParente)
					}
				}
			}
		}

		return n
	}

	// returns the 4 HpxKey children
	getChildren() {
		if (this.children!=null) return this.children

		let children = []
		for (let childNb=0; childNb<4; childNb++) {
			let child = HpxKey.createHpxKeyfromAncestor(this, childNb)
			children[childNb] = child
		}
		this.children = children

		return this.children
	}

	getProjViewCorners(view) {
		let cornersXY = []
		let cornersXYView = []
		let spVec = new SpatialVector()

		corners = HealpixCache.corners_nest(this.npix, this.nside)

		let lon, lat
		for (let k=0; k<4; k++) {
			spVec.setXYZ(corners[k].x, corners[k].y, corners[k].z)

			// need for frame transformation ?
			if (this.frame.system != view.cooFrame.system) {
				if (this.frame.system == CooFrameEnum.SYSTEMS.J2000) {
					let radec = CooConversion.J2000ToGalactic([spVec.ra(), spVec.dec()])
					lon = radec[0]
					lat = radec[1]
				}
				else if (this.frame.system == CooFrameEnum.SYSTEMS.GAL) {
					let radec = CooConversion.GalacticToJ2000([spVec.ra(), spVec.dec()])
					lon = radec[0]
					lat = radec[1]
				}
			}
			else {
				lon = spVec.ra()
				lat = spVec.dec()
			}
			cornersXY[k] = view.projection.project(lon, lat)
		}

		if (cornersXY[0] == null || cornersXY[1] == null || cornersXY[2] == null || cornersXY[3] == null ) return null

		for (let k=0; k<4; k++) {
			cornersXYView[k] = AladinUtils.xyToView(cornersXY[k].X, cornersXY[k].Y, view.width, view.height, view.largestDim, view.zoomFactor)
		}

		return cornersXYView
	}

}

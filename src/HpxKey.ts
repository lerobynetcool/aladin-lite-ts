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

import { AladinUtils } from './AladinUtils'
import { CooConversion } from './CooConversion'
import { CooFrameEnum } from './CooFrameEnum'
import { View } from './View'
import { TXY, Vxy } from './Basic'
import { HealpixCache } from './HealpixCache'
import { HpxImageSurvey } from './HpxImageSurvey'
import { Tile } from './Tile'
import { SpatialVector } from './Healpix'

const MAX_PARENTE = 4

/** Returns the squared distance for points in array c at indexes g and d */
function dist(c: Vxy[], g: number, d: number) {
	let dx=c[g].vx-c[d].vx
	let dy=c[g].vy-c[d].vy
	return  dx*dx + dy*dy
}

let M = 280*280
let N = 150*150
let RAP=0.7

/** Returns true if the HEALPix rhomb described by its 4 corners (array c)
 * is too large to be drawn in one pass ==> need to be subdivided */
function isTooLarge(c: Vxy[]) {
	let d1: number
	let d2: number
	if ( (d1=dist(c,0,2))>M || (d2=dist(c,2,1))>M ) return true
	if ( d1==0 || d2==0 ) throw "Rhomb error"
	let diag1 = dist(c,0,3)
	let diag2 = dist(c,1,2)
	if ( diag1==0 || diag2==0 ) throw "Rhomb error"
	let rap = diag2>diag1 ? diag1/diag2 : diag2/diag1
	return rap<RAP && (diag1>N || diag2>N)
}

export class HpxKey {

	parente = 0 // if this key comes from an ancestor, length of the filiation
	children: HpxKey[] = []
	ancestor: HpxKey | null = null // ancestor having the pixels

	nside: number
	width: number
	height: number
	dx: number
	dy: number
	norder: number
	npix: number
	hips: HpxImageSurvey
	frame
	allskyTexture?: HTMLImageElement
	allskyTextureSize?: number

	constructor(norder: number, npix: number, hips: HpxImageSurvey, width: number, height: number, dx = 0, dy = 0, allskyTexture?: HTMLImageElement, allskyTextureSize?: number) {
		this.norder = norder
		this.npix = npix

		this.nside = Math.pow(2, norder)

		this.hips = hips // survey to which this HpxKey is attached
		this.frame = hips.cooFrame // coordinate frame of the survey to which this HpxKey is attached

		this.width = width // width of the tile
		this.height = height // height of the tile

		this.dx = dx // shift in x (for all-sky tiles)
		this.dy = dy // shift in y (for all-sky tiles)

		this.allskyTexture = allskyTexture
		this.allskyTextureSize = allskyTextureSize
	}

	static createHpxKeyfromAncestor(father: HpxKey, childNb: number): HpxKey {
		let hpxKey = new HpxKey(
			father.norder+1,
			father.npix*4 + childNb,
			father.hips,
			father.width/2,
			father.height/2,
			childNb==2 || childNb==3 ? father.dx+father.width/2 : father.dx, childNb==1 || childNb==3 ? father.dy+father.height/2 : father.dy,
			father.allskyTexture,
			father.allskyTextureSize)
		hpxKey.parente = father.parente + 1
		hpxKey.ancestor = father.ancestor || father

		return hpxKey
	}

	draw(ctx: CanvasRenderingContext2D, view: View) {
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
				if ( m>0 ) return m // Si aucun sous-losange n'a pu être dessiné, je trace tout de même le père
			}
		}
		catch(e) { return 0 }

		// actual drawing
		let norder = this.ancestor==null ? this.norder : this.ancestor.norder
		let npix   = this.ancestor==null ? this.npix   : this.ancestor.npix

		//console.log(corners)
		//corners = AladinUtils.grow2(corners, 1) // grow by 1 pixel in each direction
		//console.log(corners)
		let url = this.hips.getTileURL(norder, npix)
		let tile = this.hips.tileBuffer?.getTile(url)
		if (tile && Tile.isImageOk(tile.img) || this.allskyTexture) {
			if (!this.allskyTexture) {
				this.hips.tileSize = this.hips.tileSize || tile?.img.width
			}
			let img = (this.allskyTexture || tile?.img) as HTMLImageElement // TODO : can this be undefined ?
			let w   = (this.allskyTextureSize || img?.width) as number      // TODO : can this be undefined ?
			if (this.parente) {
				w = w / Math.pow(2, this.parente)
			}

			this.hips.drawOneTile2(ctx, img, corners, w, null, this.dx, this.dy, true, norder)
			n += 2
		}
		else if (updateNeededTiles && ! tile) {
			let tile2 = this.hips.tileBuffer?.addTile(url) as Tile // TODO : can this be undefined ?
			view.downloader.requestDownload(tile2.img, tile2.url, this.hips.useCors)
			this.hips.lastUpdateDateNeededTiles = now
			view.requestRedrawAtDate(now+HpxImageSurvey.UPDATE_NEEDED_TILES_DELAY+10)
		}

		return n
	}

	drawChildren(ctx: CanvasRenderingContext2D, view: View, maxParente: number): number {
		let limitOrder = 13 // corresponds to NSIDE=8192, current HealpixJS limit
		if ( 1<this.width && this.norder<limitOrder && this.parente<maxParente ) {
			return this.getChildren().map( child => child.draw(ctx, view) ).reduce((a,b)=>a+b)
		}
		return 0
	}

	// returns the 4 HpxKey children
	getChildren(): HpxKey[] {
		if (this.children.length == 4) return this.children // TODO : maybe a better way to check it was initialiized

		this.children = []
		for (let childNb=0; childNb<4; childNb++) {
			this.children[childNb] = HpxKey.createHpxKeyfromAncestor(this, childNb)
		}
		return this.children
	}

	getProjViewCorners(view: View) {
		let cornersXY: TXY[] = []
		let cornersXYView = []
		let spVec = new SpatialVector()

		let corners = HealpixCache.corners_nest(this.npix, this.nside)

		let lon = 0 // TODO : ts thinks `lon` could be undefined
		let lat = 0 // TODO : ts thinks `lat` could be undefined
		for(let k=0; k<4; k++) {
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
			cornersXY[k] = view.projection.project(lon, lat) as TXY // TODO : could be null
		}

		if (cornersXY[0] == null || cornersXY[1] == null || cornersXY[2] == null || cornersXY[3] == null ) return null

		for(let k=0; k<4; k++) cornersXYView[k] = AladinUtils.xyToView(cornersXY[k].X, cornersXY[k].Y, view.width as number, view.height as number, view.largestDim as number, view.zoomFactor)

		return cornersXYView
	}
}

/******************************************************************************
 * Aladin Lite project
 *
 * File MOC
 *
 * This class represents a MOC (Multi Order Coverage map) layer
 *
 * Author: Thomas Boch[CDS]
 *
 *****************************************************************************/

import { Utils, uniq } from './Utils'
import { Aladin } from './Aladin'
import { AladinUtils } from './AladinUtils'
import { CooFrameEnum } from './CooFrameEnum'
import { CooConversion } from './CooConversion'
import { Color } from './Color'
import { View } from './View'
import { Projection } from './libs/astro/projection'
import { TXY, Vxy, map } from './Basic'
import { HealpixCache } from './HealpixCache'
import { HealpixIndex, SpatialVector } from './Healpix'

import { FITS } from './libs/astro/fits'

function log2(x: number) { return Math.log(x)/Math.LN2 }

function drawCorners(ctx: CanvasRenderingContext2D, xyCorners: Vxy[]) {
	ctx.moveTo(xyCorners[0].vx, xyCorners[0].vy)
	ctx.lineTo(xyCorners[1].vx, xyCorners[1].vy)
	ctx.lineTo(xyCorners[2].vx, xyCorners[2].vy)
	ctx.lineTo(xyCorners[3].vx, xyCorners[3].vy)
	ctx.lineTo(xyCorners[0].vx, xyCorners[0].vy)
}

// TODO: merge with what is done in View.getVisibleCells
let spVec = new SpatialVector()
function getXYCorners(nside: number, ipix: number, viewFrame: any, surveyFrame: any, width: number, height: number, largestDim: number, zoomFactor: number, projection: Projection) {
	let cornersXYView = []
	let cornersXY: TXY[] = []

	let corners = HealpixCache.corners_nest(ipix, nside)
	for (let k=0; k<4; k++) {
		spVec.setXYZ(corners[k].x, corners[k].y, corners[k].z)
		let radec: number[] = [spVec.ra(),spVec.dec()]
		// need for frame transformation ?
		if (surveyFrame && surveyFrame.system != viewFrame.system) {
			if (surveyFrame.system == CooFrameEnum.SYSTEMS.J2000)    radec = CooConversion.J2000ToGalactic(radec)
			else if (surveyFrame.system == CooFrameEnum.SYSTEMS.GAL) radec = CooConversion.GalacticToJ2000(radec)
		}
		let xy = projection.project(radec[0], radec[1])
		if (xy) cornersXY[k] = xy
		else return null
	}

	for (let k=0; k<4; k++) {
		cornersXYView[k] = AladinUtils.xyToView(cornersXY[k].X, cornersXY[k].Y, width, height, largestDim, zoomFactor)
	}

	// detect pixels outside view. Could be improved !
	// we minimize here the number of cells returned
	if( cornersXYView[0].vx<0       && cornersXYView[1].vx<0       && cornersXYView[2].vx<0       && cornersXYView[3].vx<0       ) return null
	if( cornersXYView[0].vy<0       && cornersXYView[1].vy<0       && cornersXYView[2].vy<0       && cornersXYView[3].vy<0       ) return null
	if( cornersXYView[0].vx>=width  && cornersXYView[1].vx>=width  && cornersXYView[2].vx>=width  && cornersXYView[3].vx>=width  ) return null
	if( cornersXYView[0].vy>=height && cornersXYView[1].vy>=height && cornersXYView[2].vy>=height && cornersXYView[3].vy>=height ) return null

	cornersXYView = AladinUtils.grow2(cornersXYView, 1)
	return cornersXYView
}

export class MOC {
	color: string
	name: string
	opacity: number
	lineWidth: number // TODO or string ?
	adaptativeDisplay: boolean
	proxyCalled = false // this is a flag to check whether we already tried to load the MOC through the proxy
	nbCellsDeepestLevel = 0 // needed to compute the sky fraction of the MOC

	// index of MOC cells at high and low resolution
	_highResIndexOrder3: {[key: string]: any[]}[] = Array.from({length: 768}, () => {return{}}) // an array filled with 768 empty element {}
	_lowResIndexOrder3 : {[key: string]: any[]}[] = Array.from({length: 768}, () => {return{}}) // an array filled with 768 empty element {}

	isShowing = true
	ready = false

	order: number
	type = 'moc'

	constructor(options: any = {}) {
		this.order = undefined as any // TODO : seems like a bad idea
		// TODO homogenize options parsing for all kind of overlay (footprints, catalog, MOC)
		this.name = options.name || "MOC"
		this.color = options.color || Color.getNextColor()
		this.opacity = options.opacity || 1
		this.opacity = Math.max(0, Math.min(1, this.opacity)) // 0 <= this.opacity <= 1
		this.lineWidth = options["lineWidth"] || 1
		this.adaptativeDisplay = options['adaptativeDisplay'] !== false
	}

	// max norder we can currently handle (limitation of healpix.js)
	static MAX_NORDER = 13 // NSIDE = 8192

	static LOWRES_MAXORDER = 6 // 5 or 6 ??
	static HIGHRES_MAXORDER = 11 // ??

	// TODO: options to modifiy this ?
	static PIVOT_FOV = 30 // when do we switch from low res cells to high res cells (fov in degrees)

	// at end of parsing, we need to remove duplicates from the 2 indexes
	_removeDuplicatesFromIndexes() {
		this._highResIndexOrder3 = this._highResIndexOrder3.map( o => map(o, (v: any[]) => uniq(v) ) )
		this._lowResIndexOrder3  = this._lowResIndexOrder3 .map( o => map(o, (v: any[]) => uniq(v) ) )
	}

	// add pixel (order, ipix)
	_addPix(order: number, ipix: number) {
		let ipixOrder3 = Math.floor( ipix * Math.pow(4, (3 - order)) )
		// fill low and high level cells
		// 1. if order <= LOWRES_MAXORDER, just store value in low and high res cells
		if (order<=MOC.LOWRES_MAXORDER) {
			if (! (order in this._lowResIndexOrder3[ipixOrder3])) {
				this._lowResIndexOrder3[ipixOrder3][order] = []
				this._highResIndexOrder3[ipixOrder3][order] = []
			}
			this._lowResIndexOrder3[ipixOrder3][order].push(ipix)
			this._highResIndexOrder3[ipixOrder3][order].push(ipix)
		}
		// 2. if LOWRES_MAXORDER < order <= HIGHRES_MAXORDER , degrade ipix for low res cells
		else if (order<=MOC.HIGHRES_MAXORDER) {
			if (! (order in this._highResIndexOrder3[ipixOrder3])) this._highResIndexOrder3[ipixOrder3][order] = []
			this._highResIndexOrder3[ipixOrder3][order].push(ipix)

			let degradedOrder = MOC.LOWRES_MAXORDER
			let degradedIpix  = Math.floor(ipix / Math.pow(4, (order - degradedOrder)))
			let degradedIpixOrder3 = Math.floor( degradedIpix * Math.pow(4, (3 - degradedOrder)) )
			if (! (degradedOrder in this._lowResIndexOrder3[degradedIpixOrder3])) this._lowResIndexOrder3[degradedIpixOrder3][degradedOrder]= []
			this._lowResIndexOrder3[degradedIpixOrder3][degradedOrder].push(degradedIpix)
		}
		// 3. if order > HIGHRES_MAXORDER , degrade ipix for low res and high res cells
		else {
			// low res cells
			let degradedOrder = MOC.LOWRES_MAXORDER
			let degradedIpix  = Math.floor(ipix / Math.pow(4, (order - degradedOrder)))
			let degradedIpixOrder3 = Math.floor(degradedIpix * Math.pow(4, (3 - degradedOrder)) )
			if (! (degradedOrder in this._lowResIndexOrder3[degradedIpixOrder3])) this._lowResIndexOrder3[degradedIpixOrder3][degradedOrder]= []
			this._lowResIndexOrder3[degradedIpixOrder3][degradedOrder].push(degradedIpix)

			// high res cells
			degradedOrder = MOC.HIGHRES_MAXORDER
			degradedIpix  = Math.floor(ipix / Math.pow(4, (order - degradedOrder)))
			degradedIpixOrder3 = Math.floor(degradedIpix * Math.pow(4, (3 - degradedOrder)) )
			if (! (degradedOrder in this._highResIndexOrder3[degradedIpixOrder3])) this._highResIndexOrder3[degradedIpixOrder3][degradedOrder]= []
			this._highResIndexOrder3[degradedIpixOrder3][degradedOrder].push(degradedIpix)
		}
		this.nbCellsDeepestLevel += Math.pow(4, (this.order - order))
	}

	/**
	 *  Return a value between 0 and 1 denoting the fraction of the sky
	 *  covered by the MOC
	 */
	skyFraction() { return this.nbCellsDeepestLevel / (12 * Math.pow(4, this.order)) }

	/**
	 * set MOC data by parsing a MOC serialized in JSON
	 * (as defined in IVOA MOC document, section 3.1.1)
	 */
	dataFromJSON(jsonMOC: any) {
		for (let orderStr in jsonMOC) {
			if (jsonMOC.hasOwnProperty(orderStr)) {
				let order = parseInt(orderStr)
				if (this.order===undefined || order > this.order) this.order = order
				jsonMOC[orderStr]?.forEach( (ipix: number) => this._addPix(order, ipix) )
			}
		}
		this.reportChange()
		this.ready = true
	}

	dataURL: string|undefined
	/**
	 * set MOC data by parsing a URL pointing to a FITS MOC file
	 */
	dataFromFITSURL(mocURL: string, successCallback = ()=>{}) {
		let self = this
		let callback = function() {
			// note: in the callback, 'this' refers to the FITS instance

			// first, let's find MOC norder
			let hdr0
			try {
				// A zero-length hdus array might mean the served URL does not have CORS header
				// --> let's try again through the proxy
				if (this.hdus.length == 0) {
					if (self.proxyCalled !== true) {
						self.proxyCalled = true
						let proxiedURL = `${Aladin.JSONP_PROXY}?url=${encodeURIComponent(self.dataURL as string)}`
						new FITS(proxiedURL, callback)
					}
					return
				}
				hdr0 = this.getHeader(0)
			}
			catch (e) {
				console.error('Could not get header of extension #0')
				return
			}
			let hdr1 = this.getHeader(1)

			     if (hdr0.contains('HPXMOC'))   self.order = hdr0.get('HPXMOC')
			else if (hdr0.contains('MOCORDER')) self.order = hdr0.get('MOCORDER')
			else if (hdr1.contains('HPXMOC'))   self.order = hdr1.get('HPXMOC')
			else if (hdr1.contains('MOCORDER')) self.order = hdr1.get('MOCORDER')
			else {
				console.error('Can not find MOC order in FITS file')
				return
			}

			let data = this.getDataUnit(1)
			let colName = data.columns[0]
			data.getRows(0, data.rows, function(rows: any[][]) {
				rows.forEach( row => {
					let uniq = row[colName]
					let order = Math.floor(Math.floor(log2(Math.floor(uniq/4))) / 2)
					let ipix = uniq - 4 *(Math.pow(4, order))
					self._addPix(order, ipix)
				})
			})
			data = null // this helps releasing memory
			self._removeDuplicatesFromIndexes()
			successCallback()
			self.reportChange()
			self.ready = true
		} // end of callback function

		this.dataURL = mocURL

		// instantiate the FITS object which will fetch the URL passed as parameter
		new FITS(this.dataURL, callback)
	}

	view?: View
	setView(view: View) {
		this.view = view
		this.reportChange()
	}

	draw(ctx: CanvasRenderingContext2D, projection: Projection, viewFrame: any, width: number, height: number, largestDim: number, zoomFactor: number, fov: number) {
		if (!this.isShowing || !this.ready) return
		let mocCells = fov > MOC.PIVOT_FOV && this.adaptativeDisplay ? this._lowResIndexOrder3 : this._highResIndexOrder3
		this._drawCells(ctx, mocCells, fov, projection, viewFrame, CooFrameEnum.J2000, width, height, largestDim, zoomFactor)
	}

	_drawCells(ctx: CanvasRenderingContext2D, mocCellsIdxOrder3: any[], fov: any, projection: Projection, viewFrame: any, surveyFrame: any, width: number, height: number, largestDim: number, zoomFactor: number) {
		ctx.lineWidth = this.lineWidth
		// if opacity==1, we draw solid lines, else we fill each HEALPix cell
		if (this.opacity==1) ctx.strokeStyle = this.color
		else {
			ctx.fillStyle = this.color
			ctx.globalAlpha = this.opacity
		}

		ctx.beginPath()

		let orderedKeys: number[] = []
		for (let k=0; k<768; k++) {
			let mocCells = mocCellsIdxOrder3[k]
			for (let key in mocCells) orderedKeys.push(parseInt(key))
		}
		orderedKeys.sort(function(a, b) {return a - b;})
		let norderMax = orderedKeys[orderedKeys.length-1]

		let potentialVisibleHpxCellsOrder3 = this.view?.getVisiblePixList(3, CooFrameEnum.J2000) || []

		// let's test first all potential visible cells and keep only the one with a projection inside the view
		let visibleHpxCellsOrder3 = potentialVisibleHpxCellsOrder3
			.filter( ipix => getXYCorners(8, ipix, viewFrame, surveyFrame, width, height, largestDim, zoomFactor, projection) )

		let mocCells
		for (let norder=0; norder<=norderMax; norder++) {
			let nside = 1 << norder
			for (let i=0; i<visibleHpxCellsOrder3.length; i++) {
				let ipixOrder3 = visibleHpxCellsOrder3[i]
				mocCells = mocCellsIdxOrder3[ipixOrder3]
				if (typeof mocCells[norder]==='undefined') continue
				if (norder<=3) {
					for (let j=0; j<mocCells[norder].length; j++) {
						let ipix = mocCells[norder][j]
						let factor = Math.pow(4, (3-norder))
						let startIpix = ipix * factor
						for (let k=0; k<factor; k++) {
							let norder3Ipix = startIpix + k
							let xyCorners = getXYCorners(8, norder3Ipix, viewFrame, surveyFrame, width, height, largestDim, zoomFactor, projection)
							if (xyCorners) drawCorners(ctx, xyCorners)
						}
					}
				}
				else {
					for (let j=0; j<mocCells[norder].length; j++) {
						let ipix = mocCells[norder][j]
						let parentIpixOrder3 = Math.floor(ipix/Math.pow(4, norder-3))
						let xyCorners = getXYCorners(nside, ipix, viewFrame, surveyFrame, width, height, largestDim, zoomFactor, projection)
						if (xyCorners) drawCorners(ctx, xyCorners)
					}
				}
			}
		}

		if (this.opacity==1) ctx.stroke()
		else {
			ctx.fill()
			ctx.globalAlpha = 1.0
		}
	}

	reportChange() { this.view?.requestRedraw() }

	show() {
		if (this.isShowing) return
		this.isShowing = true
		this.reportChange()
	}

	hide() {
		if (! this.isShowing) return
		this.isShowing = false
		this.reportChange()
	}

	// Tests whether a given (ra, dec) point on the sky is within the current MOC object
	//
	// returns true if point is contained, false otherwise
	contains(ra: number, dec: number) {
		let hpxIdx = new HealpixIndex(Math.pow(2, this.order))
		let polar = Utils.radecToPolar(ra, dec)
		let ipix = hpxIdx.ang2pix_nest(polar.theta, polar.phi)
		let ipixMapByOrder: any = {}
		for (let curOrder=0; curOrder<=this.order; curOrder++) {
			ipixMapByOrder[curOrder] = Math.floor(ipix / Math.pow(4, this.order - curOrder))
		}
		// first look for large HEALPix cells (order<3)
		for (let ipixOrder3=0; ipixOrder3<768; ipixOrder3++) {
			let mocCells = this._highResIndexOrder3[ipixOrder3]
			for (let order in mocCells) {
				if (Number(order)<3) {
					for (let k=mocCells[order].length; k>=0; k--) {
						if (ipixMapByOrder[order] == mocCells[order][k]) return true
					}
				}
			}
		}
		// look for finer cells
		let ipixOrder3 = ipixMapByOrder[3]
		let mocCells = this._highResIndexOrder3[ipixOrder3]
		for (let order in mocCells) {
			for (let k=mocCells[order].length; k>=0; k--) {
				if (ipixMapByOrder[order] == mocCells[order][k]) return true
			}
		}
		return false
	}
}

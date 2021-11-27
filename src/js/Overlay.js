// Copyright 2015 - UDS/CNRS
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
 * File Overlay
 *
 * Description: a plane holding overlays (footprints, polylines, circles)
 *
 * Author: Thomas Boch[CDS]
 *
 *****************************************************************************/

class Overlay {
	type = 'overlay'

	isShowing = true
	overlays = []
	overlay_items = [] // currently Circle or Polyline

	constructor(options = {}) {
		this.name      = options.name || "overlay"
		this.color     = options.color || Color.getNextColor()
		this.lineWidth = options.lineWidth || 2

		//this.indexationNorder = 5 // at which level should we index overlays?
		//this.hpxIdx = new HealpixIndex(this.indexationNorder)
		//this.hpxIdx.init()
	}

	// TODO : show/hide methods should be integrated in a parent class
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

	// return an array of Footprint from a STC-S string
	static parseSTCS(stcs) {
		let footprints = []
		let parts = stcs.match(/\S+/g)
		let k = 0
		let len = parts.length
		while(k<len) {
			let s = parts[k].toLowerCase()
			if(s=='polygon') {
				let curPolygon = []
				k++
				let frame = parts[k].toLowerCase()
				if (frame=='icrs' || frame=='j2000' || frame=='fk5') {
					while(k+2<len) {
						let ra = parseFloat(parts[k+1])
						if (isNaN(ra)) break
						let dec = parseFloat(parts[k+2])
						curPolygon.push([ra, dec])
						k += 2
					}
					curPolygon.push(curPolygon[0])
					footprints.push(new Footprint(curPolygon))
				}
			}
			else if (s=='circle') {
				k++
				let frame = parts[k].toLowerCase()
				if (frame=='icrs' || frame=='j2000' || frame=='fk5') {
					let ra = parseFloat(parts[k+1])
					let dec = parseFloat(parts[k+2])
					let radiusDegrees = parseFloat(parts[k+3])
					footprints.push(A.circle(ra, dec, radiusDegrees))
					k += 3
				}
			}
			k++
		}
		return footprints
	}

	// ajout d'un tableau d'overlays (= objets Footprint, Circle ou Polyline)
	addFootprints(overlaysToAdd) {
		let self = this
		overlaysToAdd.forEach( o => self.add(o, false) )
		this.view.requestRedraw()
	}

	// TODO : item doit pouvoir prendre n'importe quoi en param (footprint, circle, polyline)
	add(item, requestRedraw = true) {
		if (item instanceof Footprint) this.overlays.push(item)
		else                           this.overlay_items.push(item)
		item.setOverlay(this)
		if (requestRedraw) this.view.requestRedraw()
	}

	// return a footprint by index
	getFootprint(idx) { return idx < this.footprints.length ? this.footprints[idx] : null }

	setView(view) { this.view = view }

	removeAll() {
		// TODO : RAZ de l'index
		this.overlays = []
		this.overlay_items = []
	}

	draw(ctx, projection, frame, width, height, largestDim, zoomFactor) {
		if (!this.isShowing) return

		// simple drawing
		ctx.strokeStyle= this.color

		// 1. Drawing polygons

		// TODO: les overlay polygons devrait se tracer lui meme (methode draw)
		ctx.lineWidth = this.lineWidth
		ctx.beginPath()
		let xyviews = this.overlays.map( o => this.drawFootprint(o, ctx, projection, frame, width, height, largestDim, zoomFactor) )
		ctx.stroke()

		// selection drawing
		ctx.strokeStyle= Overlay.increaseBrightness(this.color, 50)
		ctx.beginPath()
		this.overlays.forEach( (o,i) => { if (o.isSelected) this.drawFootprintSelected(ctx, xyviews[i]) })
		ctx.stroke()

		// 2. Circle and polylines drawing
		this.overlay_items.forEach( o => o.draw(ctx, projection, frame, width, height, largestDim, zoomFactor) )
	}

	static increaseBrightness(hex, percent){
		// strip the leading # if it's there
		hex = hex.replace(/^\s*#|\s*$/g, '')

		// convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
		if(hex.length == 3) hex = hex.replace(/(.)/g, '$1$1')

		let r = parseInt(hex.substr(0, 2), 16),
			g = parseInt(hex.substr(2, 2), 16),
			b = parseInt(hex.substr(4, 2), 16)

		return '#' +
			((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
			((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
			((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1)
	}

	drawFootprint(f, ctx, projection, frame, width, height, largestDim, zoomFactor) {
		if (!f.isShowing) return null
		let show = false
		let xyviews = f.polygons.map( radec => {
			if (frame.system != CooFrameEnum.SYSTEMS.J2000) {
				radec = CooConversion.J2000ToGalactic([radec[0], radec[1]])
			}
			let xy = projection.project(radec[0], radec[1])
			if (!xy) return null

			let xyview = AladinUtils.xyToView(xy.X, xy.Y, width, height, largestDim, zoomFactor)
			if (!show && xyview.vx<width && xyview.vx>=0 && xyview.vy<=height && xyview.vy>=0) {
				show = true
			}
			return xyview
		})

		if (show) this.drawFootprintSelected(ctx,xyviews)

		return xyviews
	}

	drawFootprintSelected(ctx, xyviews) {
		if (!xyviews) return
		ctx.moveTo(xyviews[0].vx, xyviews[0].vy)
		for (let k=1, len=xyviews.length; k<len; k++) {
			ctx.lineTo(xyviews[k].vx, xyviews[k].vy)
		}
	}

	// callback function to be called when the status of one of the footprints has changed
	reportChange() { this.view.requestRedraw() }
}

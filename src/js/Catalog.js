// Copyright 2013 - UDS/CNRS
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
 * File Catalog
 *
 * Author: Thomas Boch[CDS]
 *
 *****************************************************************************/

// find RA, Dec fields among the given fields
//
// @param fields: list of objects with ucd, unit, ID, name attributes
// @param raField:  index or name of right ascension column (might be undefined)
// @param decField: index or name of declination column (might be undefined)
//
function findRADecFields(fields, raField, decField) {
	let raFieldIdx
	let decFieldIdx
	// first, look if RA/DEC fields have been already given
	if (raField) { // ID or name of RA field given at catalogue creation
		for (let l=0, len=fields.length; l<len; l++) {
			let field = fields[l]
			if (Utils.isInt(raField) && raField<fields.length) { // raField can be given as an index
				raFieldIdx = raField
				break
			}
			if ( (field.ID && field.ID===raField) || (field.name && field.name===raField) ) {
				raFieldIdx = l
				break
			}
		}
	}
	if (decField) { // ID or name of dec field given at catalogue creation
		for (let l=0, len=fields.length; l<len; l++) {
			let field = fields[l]
			if (Utils.isInt(decField) && decField<fields.length) { // decField can be given as an index
				decFieldIdx = decField
				break
			}
			if ( (field.ID && field.ID===decField) || (field.name && field.name===decField)) {
				decFieldIdx = l
				break
			}
		}
	}
	// if not already given, let's guess position columns on the basis of UCDs
	for (let l=0, len=fields.length; l<len; l++) {
		if (raFieldIdx!=undefined && decFieldIdx!=undefined) break
		let field = fields[l]
		if (!raFieldIdx) {
			if (field.ucd) {
				let ucd = $.trim(field.ucd.toLowerCase())
				if (ucd.indexOf('pos.eq.ra')==0 || ucd.indexOf('pos_eq_ra')==0) {
					raFieldIdx = l
					continue
				}
			}
		}

		if (!decFieldIdx) {
			if (field.ucd) {
				let ucd = $.trim(field.ucd.toLowerCase())
				if (ucd.indexOf('pos.eq.dec')==0 || ucd.indexOf('pos_eq_dec')==0) {
					decFieldIdx = l
					continue
				}
			}
		}
	}

	// still not found ? try some common names for RA and Dec columns
	if (raFieldIdx==undefined && decFieldIdx==undefined) {
		for (let l=0, len=fields.length; l<len; l++) {
			let field = fields[l]
			let name = (field.name || field.ID || '').toLowerCase()
			if (!raFieldIdx) {
				if (name.indexOf('ra')==0 || name.indexOf('_ra')==0 || name.indexOf('ra(icrs)')==0 || name.indexOf('_ra')==0 || name.indexOf('alpha')==0) {
					raFieldIdx = l
					continue
				}
			}
			if (!decFieldIdx) {
				if (name.indexOf('dej2000')==0 || name.indexOf('_dej2000')==0 || name.indexOf('de')==0 || name.indexOf('de(icrs)')==0 || name.indexOf('_de')==0 || name.indexOf('delta')==0) {
					decFieldIdx = l
					continue
				}
			}
		}
	}
	// last resort: take two first fieds
	if (raFieldIdx==null || decFieldIdx==null) {
		raFieldIdx  = 0
		decFieldIdx = 1
	}
	return [raFieldIdx, decFieldIdx]
}

// TODO : harmoniser parsing avec classe ProgressiveCat
class Catalog {
	constructor(options = {}) {
		this.type = 'catalog';    	this.name = options.name || "catalog"
		this.color = options.color || Color.getNextColor()
		this.sourceSize = options.sourceSize || 8
		this.markerSize = options.sourceSize || 12
		this.shape = options.shape || "square"
		this.maxNbSources = options.limit || undefined
		this.onClick = options.onClick || undefined

		this.raField = options.raField || undefined // ID or name of the field holding RA
		this.decField = options.decField || undefined // ID or name of the field holding dec

		this.indexationNorder = 5 // à quel niveau indexe-t-on les sources
		this.sources = []
		this.hpxIdx = new HealpixIndex(this.indexationNorder)
		this.hpxIdx.init()

		this.displayLabel = options.displayLabel || false
		this.labelColor = options.labelColor || this.color
		this.labelFont = options.labelFont || '10px sans-serif'
		if (this.displayLabel) {
			this.labelColumn = options.labelColumn
			if (!this.labelColumn) {
				this.displayLabel = false
			}
		}

		if (this.shape instanceof Image || this.shape instanceof HTMLCanvasElement) {
			this.sourceSize = this.shape.width
		}
		this._shapeIsFunction = false; // if true, the shape is a function drawing on the canvas
		if ($.isFunction(this.shape)) {
			this._shapeIsFunction = true
		}

		this.selectionColor = '#00ff00'

		// create this.cacheCanvas
		// cacheCanvas permet de ne créer le path de la source qu'une fois, et de le réutiliser (cf. http://simonsarris.com/blog/427-increasing-performance-by-caching-paths-on-canvas)
		this.updateShape(options)

		this.cacheMarkerCanvas = document.createElement('canvas')
		this.cacheMarkerCanvas.width = this.markerSize
		this.cacheMarkerCanvas.height = this.markerSize
		let cacheMarkerCtx = this.cacheMarkerCanvas.getContext('2d')
		cacheMarkerCtx.fillStyle = this.color
		cacheMarkerCtx.beginPath()
		let half = (this.markerSize)/2.
		cacheMarkerCtx.arc(half, half, half-2, 0, 2 * Math.PI, false)
		cacheMarkerCtx.fill()
		cacheMarkerCtx.lineWidth = 2
		cacheMarkerCtx.strokeStyle = '#ccc'
		cacheMarkerCtx.stroke()

		this.isShowing = true
	}

	static createShape(shapeName, color, sourceSize) {
		if (shapeName instanceof Image || shapeName instanceof HTMLCanvasElement) { // in this case, the shape is already created
			return shapeName
		}
		let c = document.createElement('canvas')
		c.width = c.height = sourceSize
		let ctx= c.getContext('2d')
		ctx.beginPath()
		ctx.strokeStyle = color
		ctx.lineWidth = 2.0
		if (shapeName=="plus") {
			ctx.moveTo(sourceSize/2., 0)
			ctx.lineTo(sourceSize/2., sourceSize)
			ctx.stroke()

			ctx.moveTo(0, sourceSize/2.)
			ctx.lineTo(sourceSize, sourceSize/2.)
			ctx.stroke()
		}
		else if (shapeName=="cross") {
			ctx.moveTo(0, 0)
			ctx.lineTo(sourceSize-1, sourceSize-1)
			ctx.stroke()

			ctx.moveTo(sourceSize-1, 0)
			ctx.lineTo(0, sourceSize-1)
			ctx.stroke()
		}
		else if (shapeName=="rhomb") {
			ctx.moveTo(sourceSize/2, 0)
			ctx.lineTo(0, sourceSize/2)
			ctx.lineTo(sourceSize/2, sourceSize)
			ctx.lineTo(sourceSize, sourceSize/2)
			ctx.lineTo(sourceSize/2, 0)
			ctx.stroke()
		}
		else if (shapeName=="triangle") {
			ctx.moveTo(sourceSize/2, 0)
			ctx.lineTo(0, sourceSize-1)
			ctx.lineTo(sourceSize-1, sourceSize-1)
			ctx.lineTo(sourceSize/2, 0)
			ctx.stroke()
		}
		else if (shapeName=="circle") {
			ctx.arc(sourceSize/2, sourceSize/2, sourceSize/2 - 1, 0, 2*Math.PI, true)
			ctx.stroke()
		}
		else { // default shape: square
			ctx.moveTo(1, 0)
			ctx.lineTo(1,  sourceSize-1)
			ctx.lineTo( sourceSize-1,  sourceSize-1)
			ctx.lineTo( sourceSize-1, 1)
			ctx.lineTo(1, 1)
			ctx.stroke()
		}

		return c
	}

	// return an array of Source(s) from a VOTable url
	// callback function is called each time a TABLE element has been parsed
	static parseVOTable(url, callback, maxNbSources, useProxy, raField, decField) {
		// adapted from votable.js
		function getPrefix($xml) {
			let prefix
			// If Webkit chrome/safari/... (no need prefix)
			if($xml.find('RESOURCE').length>0) {
				prefix = ''
			}
			else {
				// Select all data in the document
				prefix = $xml.find("*").first()
				if (prefix.length==0) return ''
				prefix = prefix.prop("tagName") // get name of the first tag
				let idx = prefix.indexOf(':')
				prefix = prefix.substring(0, idx) + "\\:"
			}
			return prefix
		}

		function doParseVOTable(xml, callback = ()=>{}) {
			xml = xml.replace(/^\s+/g, '') // we need to trim whitespaces at start of document
			let attributes = ["name", "ID", "ucd", "utype", "unit", "datatype", "arraysize", "width", "precision"]

			let fields = []
			let k = 0
			let $xml = $($.parseXML(xml))
			let prefix = getPrefix($xml)
			$xml.find(prefix + "FIELD").each(function() {
				let f = {}
				attributes.forEach( attribute => {
					if ($(this).attr(attribute)) f[attribute] = $(this).attr(attribute)
				})
				if (!f.ID) f.ID = `col_${k}`
				fields.push(f)
				k++
			})

			let raDecFieldIdxes = findRADecFields(fields, raField, decField)
			let raFieldIdx = raDecFieldIdxes[0]
			let decFieldIdx = raDecFieldIdxes[1]
			let sources = []
			let coo = new Coo()
			let ra
			let dec
			$xml.find(prefix + "TR").each(function() {
				let mesures = {}
				let k = 0
				$(this).find(prefix + "TD").each(function() {
					let key = fields[k].name ? fields[k].name : fields[k].id
					mesures[key] = $(this).text()
					k++
				})
				let keyRa = fields[raFieldIdx].name ? fields[raFieldIdx].name : fields[raFieldIdx].id
				let keyDec = fields[decFieldIdx].name ? fields[decFieldIdx].name : fields[decFieldIdx].id

				if (Utils.isNumber(mesures[keyRa]) && Utils.isNumber(mesures[keyDec])) {
					ra  = parseFloat(mesures[keyRa])
					dec = parseFloat(mesures[keyDec])
				}
				else {
					coo.parse(`${mesures[keyRa]} ${mesures[keyDec]}`)
					ra = coo.lon
					dec = coo.lat
				}
				sources.push(new cds.Source(ra, dec, mesures))
				if (maxNbSources && sources.length==maxNbSources) return false // break the .each loop
			})
			callback(sources)
		}
		Utils.getAjaxObject(url, 'GET', 'text', useProxy)
			.done( (xml) => doParseVOTable(xml, callback) )
	}

	// API
	updateShape(options = {}) {
		this.color = options.color || this.color || Color.getNextColor()
		this.sourceSize = options.sourceSize || this.sourceSize || 6
		this.shape = options.shape || this.shape || "square"

		this.selectSize = this.sourceSize + 2

		this.cacheCanvas = cds.Catalog.createShape(this.shape, this.color, this.sourceSize)
		this.cacheSelectCanvas = cds.Catalog.createShape('square', this.selectionColor, this.selectSize)

		this.reportChange()
	}

	// API
	addSources(sourcesToAdd) {
		sourcesToAdd = [].concat(sourcesToAdd) // make sure we have an array and not an individual source
		this.sources = this.sources.concat(sourcesToAdd)
		sourcesToAdd.forEach( s => s.setCatalog(this) )
		this.reportChange()
	}

	// API
	//
	// create sources from a 2d array and add them to the catalog
	//
	// @param columnNames: array with names of the columns
	// @array: 2D-array, each item being a 1d-array with the same number of items as columnNames
	addSourcesAsArray(columnNames, array) {
		let fields = columnNames.map( colName => {return {name: colName}} )
		let raDecFieldIdxes = findRADecFields(fields, this.raField, this.decField)
		let raFieldIdx = raDecFieldIdxes[0]
		let decFieldIdx = raDecFieldIdxes[1]
		let coo = new Coo()
		let newSources = array.map( row => {
			let ra
			let dec
			if (Utils.isNumber(row[raFieldIdx]) && Utils.isNumber(row[decFieldIdx])) {
				ra = parseFloat(row[raFieldIdx])
				dec = parseFloat(row[decFieldIdx])
			}
			else {
				coo.parse(row[raFieldIdx] + " " + row[decFieldIdx])
				ra = coo.lon
				dec = coo.lat
			}
			let dataDict = {}
			columnNames.forEach( (colName,colIdx) => dataDict[colName] = row[colIdx] )
			return A.source(ra, dec, dataDict)
		})
		this.addSources(newSources)
	}

	// return the current list of Source objects
	getSources() { return this.sources }

	// TODO : fonction générique traversant la liste des sources
	selectAll() {
		if (!this.sources) return
		this.sources.forEach( s => s.select() )
	}

	deselectAll() {
		if (! this.sources) return
		this.sources.forEach( s => s.deselect() )
	}

	// return a source by index
	getSource(idx) {
		return this.sources[idx]
	}

	setView(view) {
		this.view = view
		this.reportChange()
	}

	// remove a source
	remove(source) {
		let idx = this.sources.indexOf(source)
		if (idx<0) return

		this.sources[idx].deselect()
		this.sources.splice(idx, 1)

		this.reportChange()
	}

	removeAll() { this.sources = [] } // TODO : RAZ de l'index
	clear() { return this.removeAll() }

	draw(ctx, projection, frame, width, height, largestDim, zoomFactor) {
		if (! this.isShowing) return
		// tracé simple
		//ctx.strokeStyle= this.color

		//ctx.lineWidth = 1
		//ctx.beginPath()
		if (this._shapeIsFunction) {
			ctx.save()
		}
		let sourcesInView = []
 		for (var k=0, len = this.sources.length; k<len; k++) {
			let inView = cds.Catalog.drawSource(this, this.sources[k], ctx, projection, frame, width, height, largestDim, zoomFactor)
			if (inView) {
				sourcesInView.push(this.sources[k])
			}
		}
		if (this._shapeIsFunction) {
			ctx.restore()
		}
		//ctx.stroke()

		// tracé sélection
		ctx.strokeStyle= this.selectionColor
		//ctx.beginPath()
		let source
		for (var k=0, len = sourcesInView.length; k<len; k++) {
			source = sourcesInView[k]
			if (! source.isSelected) {
				continue
			}
			cds.Catalog.drawSourceSelection(this, source, ctx)

		}
		// NEEDED ?
		//ctx.stroke()

		// tracé label
		if (this.displayLabel) {
			ctx.fillStyle = this.labelColor
			ctx.font = this.labelFont
			for (var k=0, len = sourcesInView.length; k<len; k++) {
				cds.Catalog.drawSourceLabel(this, sourcesInView[k], ctx)
			}
		}
	}

	static drawSource(catalogInstance, s, ctx, projection, frame, width, height, largestDim, zoomFactor) {
		if (!s.isShowing) return false

		let sourceSize = catalogInstance.sourceSize
		let radec = [s.ra, s.dec]
		// TODO : we could factorize this code with Aladin.world2pix
		if (frame.system != CooFrameEnum.SYSTEMS.J2000) {
			radec = CooConversion.J2000ToGalactic(radec)
		}
		let xy = projection.project(radec[0], radec[1])

		if (xy) {
			let xyview = AladinUtils.xyToView(xy.X, xy.Y, width, height, largestDim, zoomFactor, true)
			let max = s.popup ? 100 : s.sourceSize
			if (xyview) {
				// TODO : index sources by HEALPix cells at level 3, 4 ?

				// check if source is visible in view
				if (xyview.vx>(width+max)  || xyview.vx<(0-max) ||
					xyview.vy>(height+max) || xyview.vy<(0-max)) {
					s.x = s.y = undefined
					return false
				}

				s.x = xyview.vx
				s.y = xyview.vy
				if (catalogInstance._shapeIsFunction) {
					catalogInstance.shape(s, ctx, catalogInstance.view.getViewParams())
				}
				else if (s.marker && s.useMarkerDefaultIcon) {
					ctx.drawImage(catalogInstance.cacheMarkerCanvas, s.x-sourceSize/2, s.y-sourceSize/2)
				}
				else {
					ctx.drawImage(catalogInstance.cacheCanvas, s.x-catalogInstance.cacheCanvas.width/2, s.y-catalogInstance.cacheCanvas.height/2)
				}

				// has associated popup ?
				if (s.popup) s.popup.setPosition(s.x, s.y)

			}
			return true
		}
		else return false
	}

	static drawSourceSelection(catalogInstance, s, ctx) {
		if (!s || !s.isShowing || !s.x || !s.y) return
		let sourceSize = catalogInstance.selectSize
		ctx.drawImage(catalogInstance.cacheSelectCanvas, s.x-sourceSize/2, s.y-sourceSize/2)
	}

	static drawSourceLabel(catalogInstance, s, ctx) {
		if (!s || !s.isShowing || !s.x || !s.y) return

		let label = s.data[catalogInstance.labelColumn]
		if (!label) return

		ctx.fillText(label, s.x, s.y)
	}

	// callback function to be called when the status of one of the sources has changed
	reportChange() { this.view && this.view.requestRedraw() }

	show() {
		if (this.isShowing) return
		this.isShowing = true
		this.reportChange()
	}

	hide() {
		if (! this.isShowing) return
		this.isShowing = false
		if (this.view && this.view.popup && this.view.popup.source && this.view.popup.source.catalog==this) {
			this.view.popup.hide()
		}

		this.reportChange()
	}

}

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
 * File ProgressiveCat.js
 *
 * Author: Thomas Boch[CDS]
 *
 *****************************************************************************/

import { MetaCatalog } from './Catalog'
import { Utils, LRUCache, uniq } from './Utils'
import { CooFrameEnum, CooFrameEnumType } from './CooFrameEnum'
import { Color } from './Color'
import { View } from './View'
import { Projection } from './libs/astro/projection'
import { Source } from './Source'
import { Coo } from './libs/astro/coo'
import { HipsServiceDesc } from './HiPSDefinition'

function getFields(self: ProgressiveCat, xml: any) {
	let attributes = ["name", "ID", "ucd", "utype", "unit", "datatype", "arraysize", "width", "precision"]
	let fields: any[] = []
	let k = 0
	self.keyRa = self.keyDec = undefined
	$(xml).find("FIELD").each(function() {
		let f: any = {}
		attributes.forEach( attribute => {
			if ($(this).attr(attribute)) f[attribute] = $(this).attr(attribute)
		})
		f.ID = f.ID || `col_${k}`
		if (!self.keyRa && f.ucd && (f.ucd.indexOf('pos.eq.ra')==0 || f.ucd.indexOf('POS_EQ_RA')==0)) {
			self.keyRa = f.name || f.ID
		}
		if (!self.keyDec && f.ucd && (f.ucd.indexOf('pos.eq.dec')==0 || f.ucd.indexOf('POS_EQ_DEC')==0)) {
			self.keyDec = f.name || f.ID
		}
		fields.push(f)
		k++
	})
	return fields
}

function getSources(instance: any, csv: string, fields: any[]) {
	// TODO : find ra and dec key names (see in Catalog)
	if (!instance.keyRa || ! instance.keyDec) return []
	let lines = csv.split('\n')
	let mesureKeys = fields.map( field => field.name || field.ID )

	let sources = []
	let coo = new Coo()
	let newSource
	// start at i=1, as first line repeat the fields names
	for (let i=2; i<lines.length; i++) {
		let mesures: {[key: string]: any} = {}
		let data = lines[i].split('\t')
		if (data.length<mesureKeys.length) continue
		for (let j=0; j<mesureKeys.length; j++) {
			mesures[mesureKeys[j]] = data[j]
		}
		let ra, dec
		if (Utils.isNumber(mesures[instance.keyRa]) && Utils.isNumber(mesures[instance.keyDec])) {
			ra = parseFloat(mesures[instance.keyRa])
			dec = parseFloat(mesures[instance.keyDec])
		}
		else {
			coo.parse(mesures[instance.keyRa] + " " + mesures[instance.keyDec])
			ra  = coo.lon
			dec = coo.lat
		}
		newSource = new Source(ra, dec, mesures)
		sources.push(newSource)
		newSource.setCatalog(instance)
	}
	return sources
}

// TODO: index sources according to their HEALPix ipix
// TODO : merge parsing with class Catalog
export class ProgressiveCat extends MetaCatalog {
	type = 'progressivecat'

	rootUrl: string
	frameStr?: string
	maxOrder: number
	isShowing = true // TODO : inherit from catalogue
	frame: CooFrameEnum
	name: string
	selectionColor = '#00ff00' // TODO: to be merged with Catalog

	maxOrderAllsky = 2
	isReady = false

	keyRa?: number
	keyDec?: number

	tilesInView: [number,number][] = []

	order1Sources: Source[] = []
	order2Sources: Source[] = []
	order3Sources: Source[] = []

	fields: any[] = []

	sourcesCache: LRUCache<Source[]>
	filterFn: (src: Source) => boolean

	// TODO : test if CORS support. If no, need to pass through a proxy
	// currently, we suppose CORS is supported
	constructor(rootUrl: string, frameStr: string|undefined, maxOrder: number, options: any = {}) {
		super()
		this.rootUrl = rootUrl // TODO: method to sanitize rootURL (absolute, no duplicate slashes, remove end slash if existing)
		// fast fix for HTTPS support --> will work for all HiPS served by CDS
		if (Utils.isHttpsContext() && ( /u-strasbg.fr/i.test(this.rootUrl) || /unistra.fr/i.test(this.rootUrl)  ) ) {
			this.rootUrl = this.rootUrl.replace('http://', 'https://')
		}

		this.frameStr = frameStr
		this.frame = CooFrameEnum.fromString(frameStr) || CooFrameEnum.J2000
		this.maxOrder = maxOrder

		this.name = options.name || "progressive-cat"
		this.color = options.color || Color.getNextColor()
		this.shape = options.shape || "square"
		this.sourceSize = options.sourceSize || 6
		this.selectSize = this.sourceSize + 2

		// allows for filtering of sources
		this.filterFn = options.filter || ((s)=>true) // TODO: do the same for catalog

		this.onClick = options.onClick || undefined // TODO: inherit from catalog

		// we cache the list of sources in each healpix tile. Key of the cache is norder+'-'+npix
		this.sourcesCache = new LRUCache(100)

		this.updateShape(options)
	}

	// TODO: to be put higher in the class diagram, in a HiPS generic class
	static readProperties(rootUrl: string, successCallback: (props: HipsServiceDesc)=>void, errorCallback = (err: any)=>{}) {
		if (!successCallback) return

		let propertiesURL = `${rootUrl}/properties`
		$.ajax({
			url: propertiesURL,
			method: 'GET',
			dataType: 'text',
			success: function(propertiesTxt: string) {
				let props: any = {}
				let lines = propertiesTxt.split('\n')
				lines.forEach( line => {
					let idx = line.indexOf('=')
					let propName  = $.trim(line.substring(0, idx))
					let propValue = $.trim(line.substring(idx + 1))
					props[propName] = propValue
				})
				successCallback(props)
			},
			error: (err) => errorCallback(err) // TODO : which parameters should we put in the error callback
		})
	}

	properties?: HipsServiceDesc

	init(view: View) {
		let self = this
		this.view = view
		if (this.maxOrder && this.frameStr) this._loadMetadata()
		else {
			ProgressiveCat.readProperties(self.rootUrl,
				(properties) => {
					self.properties = properties
					self.maxOrder = self.properties['hips_order'] as number // TODO : this could be a string
					self.frame = CooFrameEnum.fromString(self.properties['hips_frame']) as CooFrameEnumType // TODO : could be undefined

					self._loadMetadata()
				}, () => {
					console.log('Could not find properties for HiPS ' + self.rootUrl)
				}
			)
		}
	}

	_loadMetadata() {
		let self = this
		$.ajax({
			url: `${self.rootUrl}/Metadata.xml`,
			method: 'GET',
			success: (xml) => {
				self.fields = getFields(self, xml)
				self._loadAllskyNewMethod()
			},
			error: () => {
				self._loadAllskyOldMethod()
			}
		})
	}

	_loadAllskyNewMethod() {
		let self = this
		$.ajax({
			url: `${self.rootUrl}/Norder1/Allsky.tsv`,
			method: 'GET',
			success: function(tsv) {
				self.order1Sources = getSources(self, tsv, self.fields)
				if (self.order2Sources) {
					self.isReady = true
					self._finishInitWhenReady()
				}
			},
			error: (err) => console.log('Something went wrong: ' + err)
		})
		$.ajax({
			url: `${self.rootUrl}/Norder2/Allsky.tsv`,
			method: 'GET',
			success: function(tsv) {
				self.order2Sources = getSources(self, tsv, self.fields)
				if (self.order1Sources) {
					self.isReady = true
					self._finishInitWhenReady()
				}
			},
			error: (err) => console.log('Something went wrong: ' + err)
		})
	}

	_loadAllskyOldMethod() {
		this.maxOrderAllsky = 3
		this._loadLevel2Sources()
		this._loadLevel3Sources()
	}

	_loadLevel2Sources() {
		let self = this
		$.ajax({
			url: `${self.rootUrl}/Norder2/Allsky.xml`,
			method: 'GET',
			success: (xml) => {
				self.fields = getFields(self, xml)
				self.order2Sources = getSources(self, $(xml).find('CSV').text(), self.fields)
				if (self.order3Sources) {
					self.isReady = true
					self._finishInitWhenReady()
				}
			},
			error: (err) => console.log('Something went wrong: ' + err)
		})
	}

	_loadLevel3Sources() {
		let self = this
		$.ajax({
			url: `${self.rootUrl}/Norder3/Allsky.xml`,
			method: 'GET',
			success: (xml) => {
				self.order3Sources = getSources(self, $(xml).find('CSV').text(), self.fields)
				if (self.order2Sources) {
					self.isReady = true
					self._finishInitWhenReady()
				}
			},
			error: (err) => console.log('Something went wrong: ' + err)
		})
	}

	_finishInitWhenReady() {
		this.view.requestRedraw()
		this.loadNeededTiles()
	}

	draw(ctx: CanvasRenderingContext2D, projection: Projection, frame: any, width: number, height: number, largestDim: number, zoomFactor: number) {
		if (! this.isShowing || ! this.isReady) return
		this.drawSources(this.order1Sources, ctx, projection, frame, width, height, largestDim, zoomFactor)
		this.drawSources(this.order2Sources, ctx, projection, frame, width, height, largestDim, zoomFactor)
		this.drawSources(this.order3Sources, ctx, projection, frame, width, height, largestDim, zoomFactor)

		this.tilesInView.forEach( t => {
			let key = t[0] + '-' + t[1]
			let sources = this.sourcesCache.get(key)
			if (sources) {
				this.drawSources(sources, ctx, projection, frame, width, height, largestDim, zoomFactor)
			}
		})
	}

	drawSources(sources: Source[], ctx: CanvasRenderingContext2D, projection: Projection, frame: any, width: number, height: number, largestDim: number, zoomFactor: number) {
		if (!sources) return
		let src = sources.filter( s => this.filterFn(s) )
		src.forEach( s => this.drawSource(s, ctx, projection, frame, width, height, largestDim, zoomFactor) )
		src.filter( s => s.isSelected ).forEach( s => this.drawSourceSelection(s, ctx) )
	}

	getSources() {
		let ret: Source[] = []
		ret = ret.concat(this.order1Sources)
		ret = ret.concat(this.order2Sources)
		ret = ret.concat(this.order3Sources)

		this.tilesInView.forEach( t => {
			let key = t[0] + '-' + t[1]
			let sources = this.sourcesCache.get(key) || []
			ret = ret.concat(sources)
		})
		return ret
	}

	deselectAll() {
		this.order1Sources.forEach( s => s.deselect() )
		this.order2Sources.forEach( s => s.deselect() )
		this.order3Sources.forEach( s => s.deselect() )

		for (let key in this.sourcesCache.keys()) {
			this.sourcesCache.get(key).forEach( s => s.deselect() )
		}
	}

	show() {
		if (this.isShowing) return
		this.isShowing = true
		this.loadNeededTiles()
		this.reportChange()
	}

	hide() {
		if (!this.isShowing) return
		this.isShowing = false
		this.reportChange()
	}

	getTileURL(norder: number, npix: number) {
		let dirIdx = Math.floor(npix/10000)*10000
		return `${this.rootUrl}/Norder${norder}/Dir${dirIdx}/Npix${npix}.tsv`
	}

	loadNeededTiles() {
		if (!this.isShowing) return
		this.tilesInView = []

		let norder = this.view.realNorder
		if (norder>this.maxOrder) norder = this.maxOrder

		if (norder<=this.maxOrderAllsky) return // nothing to do, hurrayh !
		let cells = this.view.getVisibleCells(norder, this.frame)
		for (let curOrder=3; curOrder<=norder; curOrder++) {
			let ipixList = uniq(cells.map( cell => Math.floor((cell as any).ipix / Math.pow(4, norder - curOrder)) )) // TODO :
			ipixList.forEach( ipix => this.tilesInView.push([curOrder, ipix])) // load needed tiles
		}

		this.tilesInView.forEach( t => {
			let key = t[0] + '-' + t[1] // t[0] is norder, t[1] is ipix
			if (!this.sourcesCache.get(key)) {
				(function(self, norder, ipix) { // wrapping function is needed to be able to retrieve norder and ipix in ajax success function
					let key = norder + '-' + ipix
					$.ajax({
						/*
						url: Aladin.JSONP_PROXY,
						data: {"url": self.getTileURL(norder, ipix)},
						*/
						// ATTENTIOn : je passe en JSON direct, car je n'arrive pas a choper les 404 en JSONP
						url: self.getTileURL(norder, ipix),
						method: 'GET',
						//dataType: 'jsonp',
						success: (tsv) => {
							self.sourcesCache.set(key, getSources(self, tsv, self.fields))
							self.view.requestRedraw()
						},
						error: () => self.sourcesCache.set(key, []) // on suppose qu'il s'agit d'une erreur 404
					})
				})(this, t[0], t[1])
			}
		})
	}

	reportChange() { this.view.requestRedraw() }// TODO: to be shared with Catalog
}

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

// cds namespace

import { Catalog } from './Catalog'
import { Overlay } from './Overlay'
import { MOC } from './MOC'
import { Source } from './Source'
import { URLBuilder } from './URLBuilder'
import { Circle, Footprint, Polyline } from './CircleFootprintPolyline'
import { RaDec } from './Basic'
import { Coo } from './libs/astro/coo'
import { HpxImageSurvey } from './HpxImageSurvey'
import { Aladin } from './Aladin'
import { ProgressiveCat } from './ProgressiveCat'

export class cds {
	static Catalog = Catalog
	static Source = Source
}

export class A {
	// API
	static footprintsFromSTCS(stcs: string) {
		let footprints = Overlay.parseSTCS(stcs)
		return footprints
	}

	// API
	static MOCFromURL(url: string, options?: any, successCallback = ()=>{}) {
		let moc = new MOC(options)
		moc.dataFromFITSURL(url, successCallback)
		return moc
	}

	// API
	static MOCFromJSON(jsonMOC: any, options?: any) {
		let moc = new MOC(options)
		moc.dataFromJSON(jsonMOC)
		return moc
	}

	// TODO: try first without proxy, and then with, if param useProxy not set
	// API
	static catalogFromURL(url: string, options?: any, successCallback = (src: Source[])=>{}, useProxy = false) {
		let catalog = A.catalog(options)
		// TODO: should be self-contained in Catalog class
		Catalog.parseVOTable(url, (sources: Source[]) => {
				catalog.addSources(sources)
				successCallback(sources)
			},
			catalog.maxNbSources, useProxy,
			catalog.raField, catalog.decField
		)
		return catalog
	}

	// API
	// @param target: can be either a string representing a position or an object name, or can be an object with keys 'ra' and 'dec' (values being in decimal degrees)
	static catalogFromSimbad(target: string|RaDec, radius: number, options: any = {}, successCallback = (src: Source[])=>{}) {
		options.name = options.name || 'Simbad'
		let url = URLBuilder.buildSimbadCSURL(target, radius)
		return A.catalogFromURL(url, options, successCallback, false)
	}

	// API
	static catalogFromNED(target: string|RaDec, radius: number, options: any = {}, successCallback = (src: Source[])=>{}) {
		options.name = options.name || 'NED'
		let url
		if (typeof target  === "object" && 'ra' in target && 'dec' in target) {
			url = URLBuilder.buildNEDPositionCSURL(target.ra, target.dec, radius)
		}
		else {
			let isObjectName = /[a-zA-Z]/.test(target)
			if (isObjectName) url = URLBuilder.buildNEDObjectCSURL(target, radius)
			else {
				let coo = new Coo()
				coo.parse(target)
				url = URLBuilder.buildNEDPositionCSURL(coo.lon, coo.lat, radius)
			}
		}
		return A.catalogFromURL(url, options, successCallback)
	}

	// API
	static catalogFromVizieR(vizCatId: string, target: string|RaDec, radius: number, options: any = {}, successCallback = (src: Source[])=>{}) {
		options.name = options.name || `VizieR:${vizCatId}`
		let url = URLBuilder.buildVizieRCSURL(vizCatId, target, radius, options)
		return A.catalogFromURL(url, options, successCallback, false)
	}

	// API
	static catalogFromSkyBot(ra: number, dec: number, radius: number, epoch: number, queryOptions: any={}, options: any={}, successCallback = (src: Source[])=>{}) {
		if (! ('name' in options)) options['name'] = 'SkyBot'
		let url = URLBuilder.buildSkyBotCSURL(ra, dec, radius, epoch, queryOptions)
		return A.catalogFromURL(url, options, successCallback, false)
	}

	//// New API ////
	// For developers using Aladin lite: all objects should be created through the API,
	// rather than creating directly the corresponding JS objects
	// This facade allows for more flexibility as objects can be updated/renamed harmlessly

	//@API
	static aladin(divSelector: any, options?: any) { return new Aladin($(divSelector)[0], options) }

	//@API
	// TODO : lecture de properties
	static imageLayer(id: any, name: any, rootUrl: string, options?: any) { return new HpxImageSurvey(id, name, rootUrl, null, undefined, options) }

	// @API
	static source(ra: number, dec: number, data?: {}, options?: any) { return new Source(ra, dec, data, options) }

	// @API
	static marker(ra: number, dec: number, options?: any, data?: any) {
		options['marker'] = true
		return A.source(ra, dec, data, options)
	};

	// @API
	static polygon(raDecArray: number[][]) {
		let l = raDecArray.length
		if (l>0) {
			// close the polygon if needed
			if (raDecArray[0][0]!=raDecArray[l-1][0] || raDecArray[0][1]!=raDecArray[l-1][1]) {
				raDecArray.push([raDecArray[0][0], raDecArray[0][1]])
			}
		}
		return new Footprint(raDecArray)
	}

	//@API
	static polyline(raDecArray: number[][], options?: any) { return new Polyline(raDecArray, options) }

	// @API
	static circle(ra: number, dec: number, radiusDeg: number, options?: any) { return new Circle([ra, dec], radiusDeg, options) }

	// @API
	static graphicOverlay(options?: any) { return new Overlay(options) }

	// @API
	static catalog(options?: any) { return new Catalog(options) }

	// @API
	static catalogHiPS(rootURL: string, options?: any) { return new ProgressiveCat(rootURL, undefined, null as any, options) } // TODO : what should be the default value ?

}

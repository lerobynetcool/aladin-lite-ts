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
 * File URLBuilder
 * 
 * Author: Thomas Boch[CDS]
 * 
 *****************************************************************************/
import { RaDec } from './Basic'
import { Coo } from './libs/astro/coo'
import { Utils } from './Utils'
import { forEach } from './Basic'

export class URLBuilder {
	static buildSimbadCSURL(target: RaDec|string, radiusDegrees: number) {
		if(typeof target  === "object") {
			if('ra' in target && 'dec' in target) {
				let coo = new Coo(target.ra, target.dec, 7)
				target = coo.format('s') as string
			}
		}
		let url = 'https://alasky.unistra.fr/cgi/simbad-flat/simbad-cs.py'
		return `${url}?target=${encodeURIComponent(target)}&SR=${radiusDegrees}&format=votable&SRUNIT=deg&SORTBY=nbref`
	}

	static buildNEDPositionCSURL(ra: number, dec: number, radiusDegrees: number) {
		return `https://ned.ipac.caltech.edu/cgi-bin/nph-objsearch?search_type=Near+Position+Search&of=xml_main&RA=${ra}&DEC=${dec}'&SR=${radiusDegrees}`
	}

	static buildNEDObjectCSURL(object: string, radiusDegrees: number) {
		return `https://ned.ipac.caltech.edu/cgi-bin/nph-objsearch?search_type=Near+Name+Search&radius=${60*radiusDegrees}&of=xml_main&objname=${object}`
	}

	static buildVizieRCSURL(vizCatId: string, target: RaDec|string, radiusDegrees: number, options: any = {}) {
		if(typeof target === "object") {
			if('ra' in target && 'dec' in target) {
				let coo = new Coo(target.ra, target.dec, 7)
				target = coo.format('s') as string
			}
		}
		let maxNbSources = 1e5
		if(options.hasOwnProperty('limit') && Utils.isNumber(options.limit)) maxNbSources = parseInt(options.limit)
		return `https://vizier.unistra.fr/viz-bin/votable?-source=${vizCatId}&-c=${encodeURIComponent(target)}&-out.max=${maxNbSources}&-c.rd=${radiusDegrees}`
	}

	// TODO : check types
	static buildSkyBotCSURL(ra: number, dec: number, radius: number, epoch: number, queryOptions: Object = {}) {
		let url = 'http://vo.imcce.fr/webservices/skybot/skybotconesearch_query.php?-from=AladinLite'
		url += `&RA=${encodeURIComponent(ra)}`
		url += `&DEC=${encodeURIComponent(dec)}`
		url += `&SR=${encodeURIComponent(radius)}`
		url += `&EPOCH=${encodeURIComponent(epoch)}`

		url += forEach(queryOptions, (val: any,key) => `&${key}=${encodeURIComponent(val)}`).join('')
		return url
	}
}

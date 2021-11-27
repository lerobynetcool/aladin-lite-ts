// Copyright 2013-2017 - UDS/CNRS
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
 * File HiPSDefinition
 *
 * Author: Thomas Boch [CDS]
 *
 *****************************************************************************/

// cache (at the source code level) of the list of HiPS
// this is the result to a query to http://alasky.u-strasbg.fr/MocServer/query?dataproduct_type=image&client_application=AladinLite&fmt=json&fields=ID,obs_title,client_sort_key,client_application,hips_service_url*,hips_order,hips_tile_format,hips_frame
let AL_CACHE_CLASS_LEVEL = [{
	"ID": "CDS/P/2MASS/color",
	"obs_title": "2MASS color J (1.23 microns), H (1.66 microns), K (2.16 microns)",
	"client_sort_key": "04-001-00",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "9",
	"hips_frame": "equatorial",
	"hips_tile_format": "jpeg",
	"hips_service_url": "http://alasky.unistra.fr/2MASS/Color",
	"hips_service_url_1": "http://alaskybis.unistra.fr/2MASS/Color",
	"hips_service_url_2": "https://alaskybis.unistra.fr/2MASS/Color"
	}, {
	"ID": "CDS/P/AKARI/FIS/Color",
	"obs_title": "AKARI Far-infrared All-Sky Survey - color composition WideL/WideS/N60",
	"client_sort_key": "04-05-00",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "5",
	"hips_frame": "equatorial",
	"hips_tile_format": "png jpeg",
	"hips_service_url": "http://alasky.unistra.fr/AKARI-FIS/ColorLSN60",
	"hips_service_url_1": "http://alaskybis.unistra.fr/AKARI-FIS/ColorLSN60",
	"hips_service_url_2": "https://alaskybis.unistra.fr/AKARI-FIS/ColorLSN60"
	}, {
	"ID": "CDS/P/DECaLS/DR3/color",
	"obs_title": "DECaLS DR3 color",
	"hips_frame": "equatorial",
	"hips_order": "11",
	"hips_tile_format": "jpeg",
	"hips_service_url": "http://alasky.unistra.fr/DECaLS/DR3/color"
	}, {
	"ID": "CDS/P/DSS2/blue",
	"obs_title": "DSS2 Blue (XJ+S)",
	"client_sort_key": "03-01-03",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "9",
	"hips_frame": "equatorial",
	"hips_tile_format": "jpeg fits",
	"hips_service_url": "http://alasky.unistra.fr/DSS/DSS2-blue-XJ-S",
	"hips_service_url_1": "http://alaskybis.unistra.fr/DSS/DSS2-blue-XJ-S",
	"hips_service_url_2": "https://alaskybis.unistra.fr/DSS/DSS2-blue-XJ-S",
	"hips_service_url_3": "http://healpix.ias.u-psud.fr/DSS2Blue"
	}, {
	"ID": "CDS/P/DSS2/color",
	"obs_title": "DSS colored",
	"client_sort_key": "03-00",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "9",
	"hips_frame": "equatorial",
	"hips_tile_format": "jpeg",
	"hips_service_url": "http://alasky.unistra.fr/DSS/DSSColor",
	"hips_service_url_1": "http://alaskybis.unistra.fr/DSS/DSSColor",
	"hips_service_url_2": "https://alaskybis.unistra.fr/DSS/DSSColor",
	"hips_service_url_3": "http://healpix.ias.u-psud.fr/DSSColorNew",
	"hips_service_url_4": "http://skies.esac.esa.int/DSSColor/"
	}, {
	"ID": "CDS/P/DSS2/red",
	"obs_title": "DSS2 Red (F+R)",
	"client_sort_key": "03-01-02",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "9",
	"hips_frame": "equatorial",
	"hips_tile_format": "jpeg fits",
	"hips_service_url": "http://alasky.unistra.fr/DSS/DSS2Merged",
	"hips_service_url_1": "http://alaskybis.unistra.fr/DSS/DSS2Merged",
	"hips_service_url_2": "https://alaskybis.unistra.fr/DSS/DSS2Merged",
	"hips_service_url_3": "http://healpix.ias.u-psud.fr/DSS2Merged"
	}, {
	"ID": "P/PanSTARRS/DR1/g",
	"hips_service_url": "http://alasky.u-strasbg.fr/Pan-STARRS/DR1/g",
	"obs_title": "PanSTARRS DR1 g",
	"hips_order": 11,
	"hips_frame": "equatorial",
	"hips_tile_format": "jpeg fits"
	}, {
	"ID": "CDS/P/Fermi/color",
	"obs_title": "Fermi Color HEALPix survey",
	"client_sort_key": "00-01-01",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "3",
	"hips_frame": "equatorial",
	"hips_tile_format": "jpeg",
	"hips_service_url": "http://alasky.unistra.fr/Fermi/Color",
	"hips_service_url_1": "http://alaskybis.unistra.fr/Fermi/Color",
	"hips_service_url_2": "https://alaskybis.unistra.fr/Fermi/Color"
	}, {
	"ID": "CDS/P/Finkbeiner",
	"obs_title": "Finkbeiner Halpha composite survey",
	"client_sort_key": "06-01",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "3",
	"hips_frame": "galactic",
	"hips_tile_format": "jpeg fits",
	"hips_service_url": "http://alasky.unistra.fr/FinkbeinerHalpha",
	"hips_service_url_1": "http://alaskybis.unistra.fr/FinkbeinerHalpha",
	"hips_service_url_2": "https://alaskybis.unistra.fr/FinkbeinerHalpha"
	}, {
	"ID": "CDS/P/GALEXGR6/AIS/color",
	"obs_title": "GALEX GR6 AIS (until March 2014)- Color composition",
	"client_sort_key": "02-01-01",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "8",
	"hips_frame": "equatorial",
	"hips_tile_format": "png jpeg",
	"hips_service_url": "http://alasky.unistra.fr/GALEX/GR6-03-2014/AIS-Color",
	"hips_service_url_1": "http://alaskybis.unistra.fr/GALEX/GR6-03-2014/AIS-Color",
	"hips_service_url_2": "https://alaskybis.unistra.fr/GALEX/GR6-03-2014/AIS-Color"
	}, {
	"ID": "CDS/P/IRIS/color",
	"obs_title": "IRAS-IRIS HEALPix survey, color",
	"client_sort_key": "04-02-01",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "3",
	"hips_frame": "galactic",
	"hips_tile_format": "jpeg",
	"hips_service_url": "http://alasky.unistra.fr/IRISColor",
	"hips_service_url_1": "http://alaskybis.unistra.fr/IRISColor",
	"hips_service_url_2": "https://alaskybis.unistra.fr/IRISColor",
	"hips_service_url_3": "http://healpix.ias.u-psud.fr/IRISColor",
	"hips_service_url_4": "http://skies.esac.esa.int/IRISColor/"
	}, {
	"ID": "CDS/P/Mellinger/color",
	"obs_title": "Mellinger optical survey, color",
	"client_sort_key": "03-03",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "4",
	"hips_frame": "galactic",
	"hips_tile_format": "jpeg",
	"hips_service_url": "http://alasky.unistra.fr/MellingerRGB",
	"hips_service_url_1": "http://alaskybis.unistra.fr/MellingerRGB",
	"hips_service_url_2": "https://alaskybis.unistra.fr/MellingerRGB"
	}, {
	"ID": "CDS/P/SDSS9/color",
	"obs_title": "SDSS 9 color",
	"client_sort_key": "03-02-01",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "10",
	"hips_frame": "equatorial",
	"hips_tile_format": "jpeg",
	"hips_service_url": "http://alasky.unistra.fr/SDSS/DR9/color",
	"hips_service_url_1": "http://alaskybis.unistra.fr/SDSS/DR9/color",
	"hips_service_url_2": "https://alaskybis.unistra.fr/SDSS/DR9/color",
	"hips_service_url_3": "http://healpix.ias.u-psud.fr/SDSS9Color",
	"hips_service_url_4": "http://skies.esac.esa.int/SDSS9Color/"
	}, {
	"ID": "CDS/P/SPITZER/color",
	"obs_title": "IRAC HEALPix survey, color",
	"client_sort_key": "04-03-00",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "9",
	"hips_frame": "galactic",
	"hips_tile_format": "jpeg",
	"hips_service_url": "http://alasky.unistra.fr/SpitzerI1I2I4color",
	"hips_service_url_1": "http://alaskybis.unistra.fr/SpitzerI1I2I4color",
	"hips_service_url_2": "https://alaskybis.unistra.fr/SpitzerI1I2I4color",
	"hips_service_url_3": "http://healpix.ias.u-psud.fr/SPITZERColor"
	}, {
	"ID": "CDS/P/allWISE/color",
	"obs_title": "AllWISE color  Red (W4) , Green (W2) , Blue (W1) from raw Atlas Images",
	"client_sort_key": "04-003-00",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "8",
	"hips_frame": "equatorial",
	"hips_tile_format": "jpeg",
	"hips_service_url": "http://alasky.unistra.fr/AllWISE/RGB-W4-W2-W1",
	"hips_service_url_1": "http://alaskybis.unistra.fr/AllWISE/RGB-W4-W2-W1",
	"hips_service_url_2": "https://alaskybis.unistra.fr/AllWISE/RGB-W4-W2-W1"
	}, {
	"ID": "IPAC/P/GLIMPSE360",
	"obs_title": "GLIMPSE360: Spitzer's Infrared Milky Way",
	"client_sort_key": "04-03-0",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "9",
	"hips_frame": "equatorial",
	"hips_tile_format": "jpeg",
	"hips_service_url": "http://www.spitzer.caltech.edu/glimpse360/aladin/data"
	}, {
	"ID": "JAXA/P/MAXI_SSC_SUM",
	"hips_tile_format": "png",
	"hips_frame": "equatorial",
	"obs_title": "MAXI SSC all-sky image integrated for 4.5 years",
	"hips_order": "6",
	"hips_service_url": "http://darts.isas.jaxa.jp/pub/judo2/HiPS/maxi_ssc_sum",
	"hips_service_url_1": "http://alasky.unistra.fr//JAXA/JAXA_P_MAXI_SSC_SUM",
	"hips_service_url_2": "http://alaskybis.unistra.fr//JAXA/JAXA_P_MAXI_SSC_SUM",
	"hips_service_url_3": "https://alaskybis.unistra.fr//JAXA/JAXA_P_MAXI_SSC_SUM"
	}, {
	"ID": "JAXA/P/SWIFT_BAT_FLUX",
	"hips_tile_format": "png",
	"hips_frame": "equatorial",
	"obs_title": "Swift-BAT 70-month all-sray hard X-ray survey image",
	"hips_order": "6",
	"hips_service_url": "http://darts.isas.jaxa.jp/pub/judo2/HiPS/swift_bat_flux/",
	"hips_service_url_1": "http://alasky.unistra.fr//JAXA/JAXA_P_SWIFT_BAT_FLUX",
	"hips_service_url_2": "http://alaskybis.unistra.fr//JAXA/JAXA_P_SWIFT_BAT_FLUX",
	"hips_service_url_3": "https://alaskybis.unistra.fr//JAXA/JAXA_P_SWIFT_BAT_FLUX"
	}, {
	"ID": "ov-gso/P/VTSS/Ha",
	"obs_title": "Virginia Tech Spectral-Line Survey (VTSS) - Halpha image",
	"client_sort_key": "06-xx",
	"client_application":[ "AladinLite", "AladinDesktop"],
	"hips_order": "3",
	"hips_frame": ["galactic", "galactic"],
	"hips_tile_format": "png jpeg fits",
	"hips_service_url": "http://cade.irap.omp.eu/documents/Ancillary/4Aladin/VTSS",
	"hips_service_url_1": "http://alasky.unistra.fr/IRAP/VTSS",
	"hips_service_url_2": "http://alaskybis.unistra.fr/IRAP/VTSS",
	"hips_service_url_3": "https://alaskybis.unistra.fr/IRAP/VTSS"
	}, {
	"ID": "xcatdb/P/XMM/EPIC",
	"obs_title": "XMM-Newton stacked EPIC images",
	"hips_frame": "equatorial",
	"hips_order": "7",
	"hips_service_url": "http://saada.u-strasbg.fr/xmmallsky",
	"hips_tile_format": "png fits",
	"hips_service_url_1": "http://alasky.unistra.fr/SSC/xmmallsky",
	"hips_service_url_2": "http://alaskybis.unistra.fr/SSC/xmmallsky",
	"hips_service_url_3": "https://alaskybis.unistra.fr/SSC/xmmallsky"
	}, {
	"ID": "xcatdb/P/XMM/PN/color",
	"obs_title": "False color X-ray images (Red=0.5-1 Green=1-2 Blue=2-4.5)Kev",
	"hips_order": "7",
	"hips_frame": "equatorial",
	"hips_tile_format": "png jpeg",
	"hips_service_url": "http://saada.unistra.fr/PNColor",
	"hips_service_url_1": "http://alasky.u-strasbg.fr/SSC/xcatdb_P_XMM_PN_color",
	"hips_service_url_2": "http://alaskybis.u-strasbg.fr/SSC/xcatdb_P_XMM_PN_color",
	"hips_service_url_3": "https://alaskybis.u-strasbg.fr/SSC/xcatdb_P_XMM_PN_color"
}]

let listHipsProperties = [] // this variable stores our current knowledge

let RETRIEVAL_TIMESTAMP_KEY = '_timestamp_retrieved'
let LAST_URL_KEY = '_last_used_url' // URL previousy used to retrieve data from this HiPS

let MOCSERVER_MIRRORS_HTTP = ['http://alasky.u-strasbg.fr/MocServer/query', 'http://alaskybis.u-strasbg.fr/MocServer/query'] // list of base URL for MocServer mirrors, available in HTTP
let MOCSERVER_MIRRORS_HTTPS = ['https://alasky.u-strasbg.fr/MocServer/query', 'https://alaskybis.unistra.fr/MocServer/query'] // list of base URL for MocServer mirrors, available in HTTPS

// complement the baseList with the items in newList
function merge(baseList, newList) {
	let newListById = {}
	newList.forEach( item => newListById[item.ID] = item )

	let updatedList = baseList.map( item => {
		let id = item.ID
		if (newListById.hasOwnProperty(id)) {
			let itemToAdd = newListById[id]
			// we keep the last used URL property
			if (item.hasOwnProperty(LAST_URL_KEY) && ! itemToAdd.hasOwnProperty(LAST_URL_KEY)) {
				itemToAdd[LAST_URL_KEY] = item[LAST_URL_KEY]
			}
			return itemToAdd
		}
		else {
			return item
		}
	})
	return updatedList
}

class HiPSDefinition {

	// constructor
	constructor(properties) {
		this.properties = properties // key-value object corresponding to the properties file

		this.id = this.getID()
		this.obsTitle = properties['obs_title']
		this.frame = properties['hips_frame']
		this.order = parseInt(properties['hips_order'])
		this.clientSortKey = properties['client_sort_key']
		this.tileFormats = properties.hasOwnProperty('hips_tile_format') && properties['hips_tile_format'].split(' ')
		this.urls = []
		this.urls.push(properties['hips_service_url'])
		let k = 1
		while (properties.hasOwnProperty('hips_service_url_' + k)) {
			this.urls.push(properties['hips_service_url_' + k])
			k++
		}

		this.clientApplications = properties['client_application']
	}

	getServiceURLs(httpsOnly) {
		httpsOnly = httpsOnly === true
		// TODO: TO BE COMPLETED
	}

	// return the ID according to the properties
	getID() {
		// ID is explicitely given
		if (this.properties.hasOwnProperty('ID')) return this.properties['ID']

		let id = null
		// ID might be built from different fields
		if (this.properties.hasOwnProperty('creator_did'))               id = this.properties['creator_did']
		if (id==null && this.properties.hasOwnProperty('publisher_did')) id = this.properties['publisher_did']

		if (id != null) {
			// remove ivo:// prefix
			if (id.slice(0, 6) === 'ivo://') id = id.slice(6)

			// '?' are replaced by '/'
			id = id.replace(/\?/g, '/')
		}

		return id
	}

	static LOCAL_STORAGE_KEY = 'aladin:hips-list'

	// retrieve definitions previousy stored in local storage
	// @return an array with the HiPS definitions, empty array if nothing found or if an error occured
	static getLocalStorageDefinitions() {
		try {
			let defs = window.localStorage.getItem(HiPSDefinition.LOCAL_STORAGE_KEY)
			return defs === null ? [] : window.JSON.parse(defs)
		}
		catch(e) {
			// silently fail and return empty array
			return []
		}
	}

	// store in local storage a list of HiPSDefinition objects
	// @return true if storage was successful
	static storeInLocalStorage(properties) {
		try {
			window.localStorage.setItem(HiPSDefinition.LOCAL_STORAGE_KEY, window.JSON.stringify(properties))
		}
		catch(e) {
			// silently fail and return false
			return false
		}
		return true
	}

	// get HiPS definitions, by querying the MocServer
	// return data as dict-like objects
	static getRemoteDefinitions(params, successCallbackFn, failureCallbackFn) {
		let params = params || {client_application: 'AladinLite'} // by default, retrieve only HiPS tagged "Aladin Lite"

		params['fmt'] = 'json'
		params['fields'] = 'ID,obs_title,client_sort_key,client_application,hips_service_url*,hips_order,hips_tile_format,hips_frame'

		let urls = Utils.isHttpsContext() ? MOCSERVER_MIRRORS_HTTPS : MOCSERVER_MIRRORS_HTTP

		let successCallback = function(data) {
			(typeof successCallbackFn === 'function') && successCallbackFn(data)
		}
		let failureCallback = function() {
			console.error('Could not load HiPS definitions from urls ' + urls)
			(typeof failureCallbackFn === 'function') && failureCallbackFn()
		}

		Utils.loadFromMirrors(urls, {data: params, onSuccess: successCallback, onFailure: failureCallback, timeout: 5})
	}

	static CACHE_RETENTION_TIME_SECONDS = 7 * 86400 // definitions can be kept 7 days
	static init() {
		// first, merge local definitions at class level with definitions in local storage
		listHipsProperties = AL_CACHE_CLASS_LEVEL

		// second, remove old definitions (client != AladinLite and timestamp older than CACHE_RETENTION_TIME_SECONDS) and merge
		let localDefs = HiPSDefinition.getLocalStorageDefinitions()
		// 2.1 remove old defs
		let now = new Date().getTime()
		localDefs = localDefs.filter( def => !(def.hasOwnProperty(RETRIEVAL_TIMESTAMP_KEY) && (now - def[RETRIEVAL_TIMESTAMP_KEY]) > 1000 * HiPSDefinition.CACHE_RETENTION_TIME_SECONDS))

		// 2.2 merge
		listHipsProperties = merge(listHipsProperties, localDefs)

		// third, retrieve remote definitions, merge and save
		HiPSDefinition.getRemoteDefinitions({dataproduct_type: 'image', client_application: 'AladinLite'}, function(remoteDefs) {
			// adding timestamp of retrieval
			let now = new Date().getTime()
			for (let k=0; k<remoteDefs.length; k++) {
				remoteDefs[k][RETRIEVAL_TIMESTAMP_KEY] = now
			}
			listHipsProperties = merge(listHipsProperties, remoteDefs)
			HiPSDefinition.storeInLocalStorage(listHipsProperties)
		})
	}

	// return list of HiPSDefinition objects, filtering out definitions whose client_application is not AladinLite
	static getALDefaultHiPSDefinitions() {
		// filter out definitions with client_application != 'AladinLite'
		let ret = []
		for (let k=0; k<listHipsProperties.length; k++) {
			let properties = listHipsProperties[k]
			if ( ! properties.hasOwnProperty('client_application') || properties['client_application'].indexOf('AladinLite')<0) {
				continue
			}

			ret.push(new HiPSDefinition(properties))
		}
		return ret
	}

	// return list of known HiPSDefinition objects
	static getDefinitions() {
		let ret = []
		for (let k=0; k<listHipsProperties.length; k++) {
			let properties = listHipsProperties[k]
			ret.push(new HiPSDefinition(properties))
		}
		return ret
	}

	// parse a HiPS properties and return a dict-like object with corresponding key-values
	// return null if parsing failed
	static parseHiPSProperties(propertiesStr) {
		if (propertiesStr==null) {
			return null
		}

		let propertiesDict = {}
		// remove CR characters
		propertiesStr = propertiesStr.replace(/[\r]/g, '')
		// split on LF
		let lines = propertiesStr.split('\n')
		for (let k=0; k<lines.length; k++)  {
			let l = $.trim(lines[k])
			// ignore comments lines
			if (l.slice(0, 1)==='#') {
				continue
			}
			let idx = l.indexOf('=')
			if (idx<0) {
				continue
			}
			let key = $.trim(l.slice(0, idx))
			let value = $.trim(l.slice(idx+1))

			propertiesDict[key] = value
		}

		return propertiesDict
	}

	// find a HiPSDefinition by id.
	// look first locally, and remotely only if local search was unsuccessful
	//
	// call callback function with a list of HiPSDefinition candidates, empty array if nothing found

	static findByID(id, callback = ()=>{}) {
		// look first locally
		let candidates = findByIDLocal(id)
		if (candidates.length>0) {
			callback(candidates)
			return
		}
		// then remotely
		findByIDRemote(id, callback)
	}

	// find a HiPSDefinition by id.
	// search is done on the local knowledge of HiPSDefinitions
	static findByIDLocal(id2search) {
		let candidates = []
		for (let k=0; k<listHipsProperties.length; k++) {
			let properties = listHipsProperties[k]
			let id = properties['ID']
			if (id.match(id2search) != null ) {
				candidates.push(new HiPSDefinition(properties))
			}
		}
		return candidates
	}

	// find remotely a HiPSDefinition by ID
	static findByIDRemote(id, callback) {
		HiPSDefinition.findHiPSRemote({ID: '*' + id + '*'}, callback)
	}

	// search a HiPS according to some criteria
	static findHiPSRemote(searchOptions, callback = ()=>{}) {
		searchOptions = searchOptions || {}
		if (! searchOptions.hasOwnProperty('dataproduct_type')) {
			searchOptions['dataproduct_type'] = 'image'
		}
		HiPSDefinition.getRemoteDefinitions(searchOptions, function(candidates) {
			let defs = []
			for (let k=0; k<candidates.length; k++) {
				defs.push(new HiPSDefinition(candidates[k]))
			}
			callback(defs)
		})
	}

	// Create a HiPSDefinition object from a URL
	//
	// If the URL ends with 'properties', it is assumed to be the URL of the properties file
	// else, it is assumed to be the base URL of the HiPS
	//
	// return a HiPSDefinition if successful, null if it failed
	static fromURL(url, callback = ()=>{}) {
		let hipsUrl
		let propertiesUrl
		if (url.slice(-10) === 'properties') {
			propertiesUrl = url
			hipsUrl = propertiesUrl.slice(0, -11)
		}
		else {
			if (url.slice(-1) === '/') {
				url = url.slice(0, -1)
			}
			hipsUrl = url
			propertiesUrl = hipsUrl + '/properties'
		}

		let callbackWhenPropertiesLoaded = function(properties) {
			// Sometimes, hips_service_url is missing. That can happen for instance Hipsgen does not set the hips_service_url keyword
			// --> in that case, we add as an attribyte the URL that was given as input parameter
			let hipsPropertiesDict = HiPSDefinition.parseHiPSProperties(properties)
			if (! hipsPropertiesDict.hasOwnProperty('hips_service_url')) {
				hipsPropertiesDict['hips_service_url'] = hipsUrl
			}
			callback(new HiPSDefinition(hipsPropertiesDict))
		}

		// try first without proxy
		Utils.getAjaxObject(propertiesUrl, 'GET', 'text', false)
			.done( (data) => callbackWhenPropertiesLoaded(data) )
			.fail( () => {
				// if not working, try with the proxy
				Utils.getAjaxObject(propertiesUrl, 'GET', 'text', true)
					.done( (data) => callbackWhenPropertiesLoaded(data) )
					.fail( () => callback() )
			})
	}

	// HiPSDefinition generation from a properties dict-like object
	static fromProperties(properties) {
		return new HiPSDefinition(properties)
	}

}

HiPSDefinition.init()

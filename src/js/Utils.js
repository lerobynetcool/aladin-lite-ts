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
 * File Utils
 *
 * Author: Thomas Boch[CDS]
 *
 *****************************************************************************/

// TODO : utiliser le LRU cache pour les tuiles images
Utils.LRUCache = class {
	content = {}

	constructor(maxsize=1024) { this.maxsize = maxsize }
	set(key, value) {
		this.content[key] = [ value, Date.now() ]
		// remove oldest element when no more room
		let keys = this.keys()
		if(keys.length > this.maxsize) {
			let oldest_k = keys.pop()
			keys.forEach( k => oldest_k = this.content[k][1] < this.content[oldest_k][1] ? k : oldest_k )
			delete this.content[oldest_k]
		}
	}
	get(key) {
		this.content[key][1] = Date.now()
		return this.content[key][0]
	}
	keys() { return Object.keys(this.content) }
}

// adding relMouseCoords to HTMLCanvasElement prototype (see http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element )
function relMouseCoords(event) {
	if (event.offsetX) {
		return {x: event.offsetX, y:event.offsetY}
	}
	else {
		let e = event
		// http://www.jacklmoore.com/notes/mouse-position/
		let target = e.target || e.srcElement
		let style = target.currentStyle || window.getComputedStyle(target, null)
		let borderLeftWidth = parseInt(style['borderLeftWidth'], 10)
		let borderTopWidth = parseInt(style['borderTopWidth'], 10)
		let rect = target.getBoundingClientRect()

		let clientX = e.clientX
		let clientY = e.clientY
		if (e.clientX == undefined) {
			clientX = e.originalEvent.changedTouches[0].clientX
			clientY = e.originalEvent.changedTouches[0].clientY
		}

		let offsetX = clientX - borderLeftWidth - rect.left
		let offsetY = clientY - borderTopWidth - rect.top

		return {x: parseInt(offsetX/Utils.cssScale), y: parseInt(offsetY/Utils.cssScale)}
	}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords

$ = $ || jQuery

/* source : http://stackoverflow.com/a/8764051 */
$.urlParam = function(name, queryString = location.search){
	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(queryString)||[,""])[1].replace(/\+/g, '%20'))||null
}

class Utils {
	static __cssScale = undefined
	// TODO : this sounds hackish and not clean
	static get cssScale() {
		if(Utils.__cssScale === undefined) {
			let st = window.getComputedStyle(document.body, null)
			let tr = st.getPropertyValue("transform") ||
					st.getPropertyValue("-webkit-transform") ||
					st.getPropertyValue("-moz-transform") ||
					st.getPropertyValue("-ms-transform") ||
					st.getPropertyValue("-o-transform")
			let matrixRegex = /matrix\((-?\d*\.?\d+),\s*0,\s*0,\s*(-?\d*\.?\d+),\s*0,\s*0\)/
			let matches = tr.match(matrixRegex)
			Utils.__cssScale = matches ? parseFloat(matches[1]) : 1
			// TODO add event Listener to watch changes on CSS.
		}
		return Utils.__cssScale
	}
	static set cssScale(v) { Utils.__cssScale = v }

	/* source: http://stackoverflow.com/a/1830844 */
	static isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n) }

	static isInt(n) { return Utils.isNumber(n) && Math.floor(n)==n }

	/* a debounce function, used to prevent multiple calls to the same function if less than delay milliseconds have passed */
	static debounce(fn, delay) {
		let timer = null
		return () => {
			let context = this
			let args = arguments
			clearTimeout(timer)
			timer = setTimeout(() => fn.apply(context, args), delay)
		}
	}

	/* return a throttled function, to rate limit the number of calls (by default, one call every 250 milliseconds) */
	static throttle(fn, threshhold = 250, scope) {
		let last
		let deferTimer
		return () => {
			let context = scope || this

			let now = +new Date
			let args = arguments
			if (last && now < last + threshhold) {
				// hold on to it
				clearTimeout(deferTimer)
				deferTimer = setTimeout(() => {
					last = now
					fn.apply(context, args)
				}, threshhold)
			} else {
				last = now
				fn.apply(context, args)
			}
		}
	}

	/**
	 * Make an AJAX call, given a list of potential mirrors
	 * First successful call will result in options.onSuccess being called back
	 * If all calls fail, onFailure is called back at the end
	 * 
	 * This method assumes the URL are CORS-compatible, no proxy will be used
	 */
	static loadFromMirrors(urls, options = {}) {
		let data     = options?.data || null
		let dataType = options?.dataType || null

		let onSuccess = options?.onSuccess || (()=>{})
		let onFailure = options?.onFailure || (()=>{})

		if (urls.length === 0) onFailure()
		else {
			let ajaxOptions = {
				url: urls[0],
				data: data
			}
			if (dataType) {
				ajaxOptions.dataType = dataType
			}
			$.ajax(ajaxOptions)
				.done( (data) => onSuccess(data) )
				.fail( () => Utils.loadFromMirrors(urls.slice(1), options) )
		}
	}

	// return the jquery ajax object configured with the requested parameters
	// by default, we use the proxy (safer, as we don't know if the remote server supports CORS)
	static getAjaxObject(url, method = 'GET', dataType = null, useProxy = true) {
		let urlToRequest = useProxy ? `${Aladin.JSONP_PROXY}?url=${encodeURIComponent(url)}` : url
		return $.ajax({
			url: urlToRequest,
			method: method,
			dataType: dataType,
		})
	}

	// return true if script is executed in a HTTPS context
	// return false otherwise
	static isHttpsContext() { return ( window.location.protocol === 'https:' ) }

	// generate an absolute URL from a relative URL
	// example: getAbsoluteURL('foo/bar/toto') return http://cds.unistra.fr/AL/foo/bar/toto if executed from page http://cds.unistra.fr/AL/
	static getAbsoluteURL(url) {
		let a = document.createElement('a')
		a.href = url
		return a.href
	}

	// generate a valid v4 UUID
	static uuidv4() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
			return v.toString(16)
		})
	}
}

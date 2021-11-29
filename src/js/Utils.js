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

// adding relMouseCoords to HTMLCanvasElement prototype (see http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element )
function relMouseCoords(event) {
	if (event.offsetX) {
		return {x: event.offsetX, y:event.offsetY}
	}
	else {
		if (!Utils.cssScale) {
			let st = window.getComputedStyle(document.body, null)
			let tr = st.getPropertyValue("-webkit-transform") ||
					st.getPropertyValue("-moz-transform") ||
					st.getPropertyValue("-ms-transform") ||
					st.getPropertyValue("-o-transform") ||
					st.getPropertyValue("transform")
			let matrixRegex = /matrix\((-?\d*\.?\d+),\s*0,\s*0,\s*(-?\d*\.?\d+),\s*0,\s*0\)/
			let matches = tr.match(matrixRegex)
			if (matches) {
				Utils.cssScale = parseFloat(matches[1])
			}
			else {
				Utils.cssScale = 1
			}
		}
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

//Function.prototype.bind polyfill from
//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
	Function.prototype.bind = function (obj) {
		// closest thing possible to the ECMAScript 5 internal IsCallable function
		if (typeof this !== 'function') {
			throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
		}

		let slice = [].slice
		let args = slice.call(arguments, 1)
		let self = this
		let nop = ()=>{}
		let bound = function () {
			return self.apply(
				this instanceof nop ? this : (obj || {}),
				args.concat(slice.call(arguments))
			)
		}

		bound.prototype = this.prototype

		return bound
	}
}

$ = $ || jQuery

/* source : http://stackoverflow.com/a/8764051 */
$.urlParam = function(name, queryString = location.search){
	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(queryString)||[,""])[1].replace(/\+/g, '%20'))||null
}

class Utils {
	static cssScale = undefined

	/* source: http://stackoverflow.com/a/1830844 */
	static isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n) }

	static isInt(n) { return Utils.isNumber(n) && Math.floor(n)==n }

	/* a debounce function, used to prevent multiple calls to the same function if less than delay milliseconds have passed */
	static debounce(fn, delay) {
		let timer = null
		return function () {
			let context = this
			let args = arguments
			clearTimeout(timer)
			timer = setTimeout(() => fn.apply(context, args), delay)
		}
	}

	/* return a throttled function, to rate limit the number of calls (by default, one call every 250 milliseconds) */
	static throttle(fn, threshhold, scope) {
		threshhold || (threshhold = 250)
		let last
		let deferTimer
		return function () {
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

	/* A LRU cache, inspired by https://gist.github.com/devinus/409353#file-gistfile1-js */
	// TODO : utiliser le LRU cache pour les tuiles images
	static LRUCache(maxsize) {
		this._keys = []
		this._items = {}
		this._expires = {}
		this._size = 0
		this._maxsize = maxsize || 1024
	}

	////////////////////////////////////////////////////////////////////////////:
	/**
	 Make an AJAX call, given a list of potential mirrors
	First successful call will result in options.onSuccess being called back
	If all calls fail, onFailure is called back at the end

	This method assumes the URL are CORS-compatible, no proxy will be used
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
			dataType: dataType
		})
	}

	// return true if script is executed in a HTTPS context
	// return false otherwise
	static isHttpsContext() {
		return ( window.location.protocol === 'https:' )
	}

	// generate an absolute URL from a relative URL
	// example: getAbsoluteURL('foo/bar/toto') return http://cds.unistra.fr/AL/foo/bar/toto if executed from page http://cds.unistra.fr/AL/
	static getAbsoluteURL(url) {
		var a = document.createElement('a')
		a.href = url
		return a.href
	}

	// generate a valid v4 UUID
	static uuidv4() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
			return v.toString(16)
		})
	}
}

Utils.LRUCache = class {
	set(key, value) {
		let keys    = this._keys
		let items   = this._items
		let expires = this._expires
		let size    = this._size
		let maxsize = this._maxsize

		if (size >= maxsize) { // remove oldest element when no more room
			keys.sort(function (a, b) {
				if (expires[a] > expires[b]) return -1
				if (expires[a] < expires[b]) return 1
				return 0
			})

			size--
			delete expires[keys[size]]
			delete items[keys[size]]
		}

		keys[size] = key
		items[key] = value
		expires[key] = Date.now()
		size++

		this._keys = keys
		this._items = items
		this._expires = expires
		this._size = size
	}

	get(key) {
		var item = this._items[key]
		if (item) this._expires[key] = Date.now()
		return item
	}

	keys() {
		return this._keys
	}

}

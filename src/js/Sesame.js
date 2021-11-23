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
 * File Sesame.js
 * 
 * Author: Thomas Boch[CDS]
 * 
 *****************************************************************************/

class Sesame {
	static cache = {}
	static SESAME_URL = "http://cds.u-strasbg.fr/cgi-bin/nph-sesame.jsonp"

	/** find RA, DEC for any target (object name or position)
	 *  if successful, callback is called with an object {ra: <ra-value>, dec: <dec-value>}
	 *  if not successful, errorCallback is called
	 */
	static getTargetRADec(target, callback, errorCallback = ()=>{}) {
		if (!callback) return

		let isObjectName = /[a-zA-Z]/.test(target)

		// try to parse as a position
		if (!isObjectName) {
			let coo = new Coo()
			coo.parse(target)
			callback({ra: coo.lon, dec: coo.lat})
		}
		// ask resolution by Sesame
		else {
			Sesame.resolve(target,
				(data) => { // success callback
					callback({
						ra:  data.Target.Resolver.jradeg,
						dec: data.Target.Resolver.jdedeg
					})
				},
				(data) => errorCallback() // error callback
			)
		}
	}

	static resolve(objectName, callbackSuccess, callbackFail) {
		let sesameUrl = Sesame.SESAME_URL
		if (Utils.isHttpsContext()) sesameUrl = sesameUrl.replace('http://', 'https://')

		$.ajax({
			url: sesameUrl,
			data: {"object": objectName},
			method: 'GET',
			dataType: 'jsonp',
			success: (data) => {
				if (data.Target?.Resolver) callbackSuccess(data)
				else                       callbackFail(data)
			},
			error: callbackFail
		})
	}
}

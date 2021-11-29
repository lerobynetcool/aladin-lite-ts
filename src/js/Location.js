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
 * File Location.js
 *
 * Author: Thomas Boch[CDS]
 *
 *****************************************************************************/

class Location {
	constructor(locationDiv) {
		this.$div = $(locationDiv)
	}

	update(lon, lat, cooFrame, isViewCenterPosition = false) {
		var coo = new Coo(lon, lat, 7)
		if (cooFrame==CooFrameEnum.J2000)       this.$div.html(coo.format('s/'))
		else if (cooFrame==CooFrameEnum.J2000d) this.$div.html(coo.format('d/'))
		else                                    this.$div.html(coo.format('d/'))
		this.$div.toggleClass('aladin-reticleColor', isViewCenterPosition)
	}
}

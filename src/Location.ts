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

import { Coo } from './libs/astro/coo'
import { CooFrameEnum } from './CooFrameEnum'

export class Location {
	$div
	constructor(locationDiv: any) { this.$div = $(locationDiv) }

	update(lon: number, lat: number, cooFrame: CooFrameEnum, isViewCenterPosition = false) {
		let coo = new Coo(lon, lat, 7)
		if (cooFrame==CooFrameEnum.J2000)       this.$div.html(coo.format('s/') as string)
		else if (cooFrame==CooFrameEnum.J2000d) this.$div.html(coo.format('d/') as string)
		else                                    this.$div.html(coo.format('d/') as string)
		this.$div.toggleClass('aladin-reticleColor', isViewCenterPosition)
	}
}

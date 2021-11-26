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
 * File MeasurementTable
 *
 * Graphic object showing measurement of a catalog
 *
 * Author: Thomas Boch[CDS]
 *
 *****************************************************************************/

class MeasurementTable {

	constructor(aladinLiteDiv) {
		this.isShowing = false

		this.divEl = $('<div class="aladin-measurement-div"></div>')

		$(aladinLiteDiv).append(this.divEl)
	}

	// show measurement associated with a given source
	showMeasurement(source) {
		this.divEl.empty()

		let keys = Object.keys(source.data)
		let header  = keys.map(k=>`<th>${k             }</th>`).reduce((a,b)=>a+b)
		let content = keys.map(k=>`<td>${source.data[k]}</td>`).reduce((a,b)=>a+b)

		this.divEl.append(`<table><thead><tr>${header}</tr></thead><tr>${content}</tr></table>`)
		this.show()
	}

	show() { this.divEl.show() }
	hide() { this.divEl.hide() }
}

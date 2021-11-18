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
 * File Source
 *
 * Author: Thomas Boch[CDS]
 *
 *****************************************************************************/

class Source {
	catalog = null
	isShowing = true
	isSelected = false
	constructor(ra, dec, data = {}, options = {}) {
		this.ra = ra
		this.dec = dec
		this.data = data
		this.marker = options.marker || false
		if (this.marker) {
			this.popupTitle = options.popupTitle ? options.popupTitle : ''
			this.popupDesc = options.popupDesc ? options.popupDesc : ''
			this.useMarkerDefaultIcon = options.useMarkerDefaultIcon!==undefined ? options.useMarkerDefaultIcon : true
		}
	}

	setCatalog(catalog) { this.catalog = catalog }

	show() {
		if (this.isShowing) return
		this.isShowing = true
		if (this.catalog) this.catalog?.reportChange()
	}

	hide() {
		if (!this.isShowing) return
		this.isShowing = false
		if (this.catalog) this.catalog.reportChange()
	}

	select() {
		if (this.isSelected) return
		this.isSelected = true
		if (this.catalog) this.catalog.reportChange()
	}

	deselect() {
		if (!this.isSelected) return
		this.isSelected = false
		if (this.catalog) this.catalog.reportChange()
	}

	// function called when a source is clicked. Called by the View object
	actionClicked() {
		if (this.catalog && this.catalog.onClick) {
			let view = this.catalog.view
			if (this.catalog.onClick=='showTable') {
				view.aladin.measurementTable.showMeasurement(this)
				this.select()
			}
			else if (this.catalog.onClick=='showPopup') {
				view.popup.setTitle('<br><br>')
				let m = '<div class="aladin-marker-measurement">'
				m += '<table>'
				for (let key in this.data) {
					m += `<tr><td>${key}</td><td>${this.data[key]}</td></tr>`
				}
				m += '</table>'
				m += '</div>'
				view.popup.setText(m)
				view.popup.setSource(this)
				view.popup.show()
			}
			else if (typeof this.catalog.onClick === 'function') {
				this.catalog.onClick(this)
				view.lastClickedObject = this
			}
		}
	}

	actionOtherObjectClicked() {
		if (this?.catalog?.onClick) this.deselect()
	}
}

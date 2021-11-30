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
 * File Popup.js
 *
 * Author: Thomas Boch [CDS]
 *
 *****************************************************************************/

import { Source } from './Source'
import { View } from './View'

export class Popup {
	domEl
	view: View
	source?: Source
	w: number = 0
	h: number = 0
	constructor(parentDiv: any, view: View) {
		this.domEl = $(`<div class="aladin-popup-container"><div class="aladin-popup"><a class="aladin-closeBtn">&times;</a><div class="aladin-popupTitle"></div><div class="aladin-popupText"></div></div><div class="aladin-popup-arrow"></div></div>`)
		this.domEl.appendTo(parentDiv)

		this.view = view

		let self = this
		// close popup
		this.domEl.find('.aladin-closeBtn').click(() => self.hide() )
	}

	hide() {
		this.domEl.hide()
		this.view.mustClearCatalog=true
		this.view.catalogForPopup.hide()
	}

	show() { this.domEl.show() }

	setTitle(title: string = '') {
		this.domEl.find('.aladin-popupTitle').html(title)
	}

	setText(text: string = '') {
		this.domEl.find('.aladin-popupText').html(text)
		this.w = this.domEl.outerWidth() as number // TODO : this is not safe
		this.h = this.domEl.outerHeight() as number // TODO : this is not safe
	}

	setSource(source: Source) {
		// remove reference to popup for previous source
		if (this.source) this.source.popup = undefined
		source.popup = this
		this.source = source
		this.setPosition((source as any).x, (source as any).y) // TODO : should Source have x y fields, or is this a wrong type ?
	}

	setPosition(x: number, y: number) {
		let newX = x - this.w/2
		let newY = y - this.h
		if (this.source?.catalog) newY += this.source.catalog.sourceSize/2

		this.domEl[0].style.left = `${newX}px`
		this.domEl[0].style.top  = `${newY}px`
	}
}

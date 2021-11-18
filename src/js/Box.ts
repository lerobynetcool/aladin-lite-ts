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
 * File Box
 *
 * A Box instance is a GUI element providing a div nested
 * in Aladin Lite parent div
 * 
 * Author: Thomas Boch [CDS]
 * ts version: Laurent Rohrbasser
 *****************************************************************************/

type cssDirection = 'bottom'|'left'|'top'|'right'

// return the css class corresponding to the given position and open/close state
function getChevronClass(position: cssDirection, isOpen: boolean): string {
	if(position=='top'    && isOpen || position=='bottom' && !isOpen) return 'aladin-chevron-up'
	if(position=='bottom' && isOpen || position=='top'    && !isOpen) return 'aladin-chevron-down'
	if(position=='right'  && isOpen || position=='left'   && !isOpen) return 'aladin-chevron-right'
	if(position=='left'   && isOpen || position=='right'  && !isOpen) return 'aladin-chevron-left'
	return ''
}

type BoxOptions = {
	// css?: {[key: string]: string},
	// contentCss?: {[key: string]: string},
	showHandler?: boolean
	position?: cssDirection,
	title?: string,
	openCallback ?: ()=>void, // callback called when the user opens the panel
	closeCallback?: ()=>void, // callback called when the user closes the panel
	content?: string
}

export class Box {
	open: boolean
	position: cssDirection = 'bottom'
	openCallback  = ()=>{}
	closeCallback = ()=>{}

	html_root: HTMLDivElement = document.createElement('div')
	html_title_container: HTMLDivElement = document.createElement('div')
	html_title: HTMLSpanElement = document.createElement('span')
	html_chevron: HTMLSpanElement = document.createElement('span')
	html_content: HTMLDivElement = document.createElement('div')

	constructor(properties: BoxOptions = {}) {
		this.html_root.classList.add('aladin-box')
		this.html_title.classList.add('aladin-box-title-label')
		this.html_content.classList.add('aladin-box-content')

		this.html_title_container.appendChild(this.html_chevron)
		this.html_title_container.appendChild(this.html_title)
		this.html_root.appendChild(this.html_title_container)
		this.html_root.appendChild(this.html_content)

		let self = this
		this.html_title_container.addEventListener('click', e => self.open ? self.hide() : self.show() )

		this.position = properties.position || this.position
		// let css = properties.css || {padding: '4px'}
		// if(this.position=='right') css['left'] = 'unset'
		// this.html_root.css(css)
		this.html_root.style.padding='4px'

		// let contentCss = properties.contentCss || {}
		// this.html_content.css(contentCss)

		this.setTitle(properties.title || "")
		if(properties.content) this.setContent(properties.content)

		this.openCallback  = properties.openCallback  || this.openCallback
		this.closeCallback = properties.closeCallback || this.closeCallback

		if( properties.showHandler == false ) this.html_chevron.style.display='none'

		this.open = true
		this.hide()
	}

	show() {
		// if(this.open) return
		this.open = true
		this._updateChevron()

		if (this.position=='left' || this.position=='right') this.html_title.style.display=''
		this.html_content.style.display=''
		this.html_root.style[this.position] = '4px'
		this.openCallback()
	}

	hide() {
		// if(!this.open) return
		this.open = false
		this._updateChevron()

		if (this.position=='left' || this.position=='right') this.html_title.style.display='none'
		this.html_content.style.display='none'
		this.html_root.style[this.position] = '0px'
		this.closeCallback()
	}

	// // complety hide parent div
	// realHide() {
	// 	this.open = false
	// 	this.$parentDiv.hide()
	// }

	// updateStyle(css) { this.$parentDiv.css(this.css) }

	setContent(content: string) {
		this.html_content.innerHTML=content
	}

	setTitle(title: string) {
		this.html_title.textContent=title
		this._updateChevron()
	}

	// enable() { this.$parentDiv.enable() }
	// disable() { this.$parentDiv.disable() }

	_updateChevron() {
		this.html_chevron.className=`aladin-chevron ${getChevronClass(this.position, this.open)}`
		this.html_chevron.setAttribute('title', `Click to ${this.open?'hide':'show'} ${this.html_title.textContent} panel`)
	}

}

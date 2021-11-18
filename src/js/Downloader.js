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
 * File Downloader
 * Queue downloading for image elements
 *
 * Author: Thomas Boch[CDS]
 *
 *****************************************************************************/

let NB_MAX_SIMULTANEOUS_DL = 4
 // TODO : le fading ne marche pas bien actuellement
// let FADING_ENABLED = false
// let FADING_DURATION = 700 // in milliseconds

export class Downloader {
	nbDownloads = 0 // number of current downloads
	dlQueue = [] // queue of items being downloaded
	urlsInQueue = {}

	constructor(view) {
		this.view = view // reference to the view to be able to request redraw
	}

	emptyQueue() {
		this.dlQueue = []
		this.urlsInQueue = {}
	}

	requestDownload(img, url, cors) {
		if (url in this.urlsInQueue) return // first check if url already in queue
		// put in queue
		this.dlQueue.push({img: img, url: url, cors: cors})
		this.urlsInQueue[url] = true
		this.tryDownload()
	}

	// try to download next items in queue if possible
	tryDownload() {
		//if (this.dlQueue.length>0 && this.nbDownloads<NB_MAX_SIMULTANEOUS_DL) {
		while (this.dlQueue.length>0 && this.nbDownloads<NB_MAX_SIMULTANEOUS_DL) this.startDownloadNext()
	}

	startDownloadNext() {
		// get next in queue
		let next = this.dlQueue.shift()
		if (!next) return

		this.nbDownloads++
		let downloaderRef = this
		next.img.onload = () => downloaderRef.completeDownload(this, true) // in this context, 'this' is the Image
		next.img.onerror = e => downloaderRef.completeDownload(this, false) // in this context, 'this' is the Image
		if (next.cors) next.img.crossOrigin = 'anonymous'
		else if (next.img.crossOrigin !== undefined) next.img.crossOrigin = null

		next.img.src = next.url
	}

	completeDownload(img, success) {
		delete this.urlsInQueue[img.src]
		img.onerror = null
		img.onload = null
		this.nbDownloads--
		if (success) {
			// if (FADING_ENABLED) {
			// 	let now = new Date().getTime()
			// 	img.fadingStart = now
			// 	img.fadingEnd = now + FADING_DURATION
			// }
			this.view.requestRedraw()
		}
		else img.dlError = true
		this.tryDownload()
	}
}

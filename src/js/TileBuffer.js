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
 * File TileBuffer
 * 
 * Author: Thomas Boch[CDS]
 * 
 *****************************************************************************/

let NB_MAX_TILES = 800 // buffer size

export class TileBuffer {

	pointer = 0
	tilesMap = {}
	tilesArray = Array.from({length: NB_MAX_TILES}, () => new Tile(new Image(), null))
	
	addTile(url) {
		// return null if already in buffer
		if (this.getTile(url)) return null

		// delete existing tile
		let curTile = this.tilesArray[this.pointer]
		if (curTile.url != null) {
			curTile.img.src = ""
			delete this.tilesMap[curTile.url]
		}

		this.tilesArray[this.pointer].url = url
		this.tilesMap[url] = this.tilesArray[this.pointer]

		this.pointer++
		if (this.pointer>=NB_MAX_TILES) this.pointer = 0

		return this.tilesMap[url]
	}

	getTile(url) { return this.tilesMap[url] }
}

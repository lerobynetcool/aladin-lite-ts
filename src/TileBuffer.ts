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

import { Tile } from "./Tile"

let NB_MAX_TILES = 800 // buffer size

export class TileBuffer {

	tilesMap: {[key: string]: Tile} = {}
	tilesArray: Tile[] = []

	addTile(url: string) {
		// if already in buffer
		if (this.getTile(url)) return

		let tile: Tile
		if (this.tilesArray.length<NB_MAX_TILES) {
			// create new one
			tile = new Tile(new Image(), url)
		} else {
			// reuse old one
			tile = this.tilesArray.shift() as Tile
			tile.img.src = ""
			tile.url = url
			delete this.tilesMap[tile.url]
		}
		this.tilesArray.push(tile)
		this.tilesMap[url] = tile

		return this.tilesMap[url]
	}

	getTile(url: string): Tile|undefined { return this.tilesMap[url] }
}

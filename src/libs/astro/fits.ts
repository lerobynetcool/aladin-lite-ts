// let _ref
// let __hasProp = {}.hasOwnProperty
// let __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }
let __slice = [].slice

export class Base {
	constructor() {}

	static include(obj: any) {
		for (let key in obj) (this as any).prototype[key] = obj[key]
		return this
	}

	static extend(obj: any) {
		for (let key in obj) (this as any)[key] = obj[key]
		return this
	}

	proxy(func: Function) {
		let _this = this
		return function() { return func.apply(_this, arguments) }
	}

	invoke(callback: Function, opts: any, data: any) {
		let context = (opts != null ? opts.context : void 0) != null ? opts.context : this
		if (callback != null) {
			return callback.call(context, data, opts)
		}
	}
}

// File.prototype.slice = File.prototype.slice || File.prototype.webkitSlice
// Blob.prototype.slice = Blob.prototype.slice || Blob.prototype.webkitSlice

export class Parser extends Base {
	LINEWIDTH = 80
	BLOCKLENGTH = 2880

	arg: any
	callback: any
	opts: any
	hdus: HDU[] = []
	blockCount = 0
	begin = 0
	end = this.BLOCKLENGTH
	offset = 0
	headerStorage = new Uint8Array()
	length: any
	readNextBlock: any
	invoke: any
	reader?: FileReader

	constructor(arg: any, callback: Function, opts: any = undefined) {
		super()
		let _this = this
		this.arg = arg
		this.callback = callback
		this.opts = opts
		if (typeof this.arg === 'string') {
			this.readNextBlock = this._readBlockFromBuffer
			let xhr = new XMLHttpRequest()
			xhr.open('GET', this.arg)
			xhr.responseType = 'arraybuffer'

			// the onerror handling has been added wrt the original fitsjs library as retrieved on the astrojs github repo
			// if an error occurs, we return an empty object
			xhr.onerror = function() {
				_this.invoke(_this.callback, _this.opts)
			}

			xhr.onload = function() {
				if (xhr.status !== 200) {
					_this.invoke(_this.callback, _this.opts)
					return
				}
				_this.arg = xhr.response
				_this.length = _this.arg.byteLength
				return _this.readFromBuffer()
			};
			xhr.send();
		} else {
			this.length = this.arg.size
			this.readNextBlock = this._readBlockFromFile
			this.readFromFile()
		}
	}

	readFromBuffer() {
		let block = this.arg.slice(this.begin + this.offset, this.end + this.offset)
		return this.readBlock(block)
	}

	readFromFile() {
		let _this = this
		this.reader = new FileReader()
		this.reader.onloadend = function(e) {
			return _this.readBlock((e as any).target.result)
		}
		let block = this.arg.slice(this.begin + this.offset, this.end + this.offset)
		return this.reader.readAsArrayBuffer(block)
	}

	start: any
	readBlock(block: any) {
		let dataunit
		let arr = new Uint8Array(block)
		let tmp = new Uint8Array(this.headerStorage)
		this.headerStorage = new Uint8Array(this.end)
		this.headerStorage.set(tmp, 0)
		this.headerStorage.set(arr, this.begin)
		let rows = this.BLOCKLENGTH / this.LINEWIDTH
		while (rows--) {
			let rowIndex = rows * this.LINEWIDTH
			if (arr[rowIndex] === 32) continue
			if (arr[rowIndex] === 69 && arr[rowIndex + 1] === 78 && arr[rowIndex + 2] === 68 && arr[rowIndex + 3] === 32) {
				let s = ''
				let _ref = this.headerStorage
				for (let _i = 0, _len = _ref.length; _i < _len; _i++) {
					let value = _ref[_i]
					s += String.fromCharCode(value)
				}
				let header = new Header(s)
				this.start = this.end + this.offset
				let dataLength = header.getDataLength()
				let slice = this.arg.slice(this.start, this.start + dataLength)
				if (header.hasDataUnit()) {
					dataunit = this.createDataUnit(header, slice)
				}
				this.hdus.push(new HDU(header, dataunit))
				this.offset += this.end + dataLength + this.excessBytes(dataLength)
				if (this.offset === this.length) {
					this.headerStorage = undefined as any // TODO : sounds messed up
					this.invoke(this.callback, this.opts, this)
					return
				}
				this.blockCount = 0
				this.begin = this.blockCount * this.BLOCKLENGTH
				this.end = this.begin + this.BLOCKLENGTH
				this.headerStorage = new Uint8Array()
				block = this.arg.slice(this.begin + this.offset, this.end + this.offset)
				this.readNextBlock(block)
				return
			}
			break
		}
		this.blockCount += 1
		this.begin = this.blockCount * this.BLOCKLENGTH
		this.end = this.begin + this.BLOCKLENGTH
		block = this.arg.slice(this.begin + this.offset, this.end + this.offset)
		this.readNextBlock(block)
	}

	_readBlockFromBuffer(block: any) { return this.readBlock(block) }

	_readBlockFromFile(block: any) { return this.reader?.readAsArrayBuffer(block) }

	createDataUnit(header: Header, blob: any) {
		let type = header.getDataType()
		switch(type) {
			case "DataUnit"        : return new DataUnit(header, blob)
			case "HeaderVerify"    : return new HeaderVerify()
			case "Header"          : return new Header(header)
			case "ImageUtils"      : return new ImageUtils()
			case "Image"           : return new Image(header, blob)
			case "Tabular"         : return new Tabular(header, blob)
			case "Table"           : return new Table(header, blob)
			case "BinaryTable"     : return new BinaryTable(header, blob)
			case "Decompress"      : return new Decompress()
			case "CompressedImage" : return new CompressedImage(header, blob)
			case "HDU"             : return new HDU(header, blob)
		}
		// return new FITS[type](header, blob)
	}

	excessBytes(length: number) { return (this.BLOCKLENGTH - (length % this.BLOCKLENGTH)) % this.BLOCKLENGTH }

	isEOF() { return (this.offset === this.length) }
}

export class FITS extends Base {
	static version = '0.6.5'

	// static DataUnit        = DataUnit
	// static HeaderVerify    = HeaderVerify
	// static Header          = Header
	// static ImageUtils      = ImageUtils
	// static Image           = Image
	// static Tabular         = Tabular
	// static Table           = Table
	// static BinaryTable     = BinaryTable
	// static Decompress      = Decompress
	// static CompressedImage = CompressedImage
	// static HDU             = HDU

	arg: any
	hdus: HDU[] = []
	constructor(arg: any, callback: Function, opts: any = undefined) {
		super()
		let _this = this
		this.arg = arg
		let parser = new Parser(this.arg, () => {
			_this.hdus = parser.hdus
			return _this.invoke(callback, opts, _this)
		})
	}

	getHDU(index: number) {
		if ((index != null) && (this.hdus[index] != null)) {
			return this.hdus[index]
		}
		let _ref = this.hdus
		for (let _i = 0, _len = _ref.length; _i < _len; _i++) {
			let hdu = _ref[_i]
			if (hdu.hasData()) return hdu
		}
	}

	getHeader(index: number) { return this.getHDU(index)?.header }

	getDataUnit(index: number) { return this.getHDU(index)?.data }
}

class DataUnit extends Base {
	static swapEndian: any = {
		B: function(v: number) { return v },
		I: function(v: number) { return (v << 8) | (v >> 8) },
		J: function(v: number) { return ((v & 0xFF) << 24) | ((v & 0xFF00) << 8) | ((v >> 8) & 0xFF00) | ((v >> 24) & 0xFF) }
	}

	buffer: any
	blob: any

	constructor(header: any, data: any) {
		super()
		if (data instanceof ArrayBuffer) {
			this.buffer = data
		} else {
			this.blob = data
		}
	}
}
DataUnit.swapEndian[8]  = DataUnit.swapEndian['B']
DataUnit.swapEndian[16] = DataUnit.swapEndian['I']
DataUnit.swapEndian[32] = DataUnit.swapEndian['J']

class HeaderVerify {
	cardIndex: any
	static verifyOrder(keyword: string, order: any) {
		if (order !== (this as any).cardIndex) {
			return console.warn(`${keyword} should appear at index ${(this as any).cardIndex} in the FITS header`)
		}
	}
	static verifyBetween(keyword: string, x: number, lower: number, upper: number) {
		if (!(x >= lower && x <= upper)) {
			throw `The ${keyword} value of ${x} is not between ${lower} and ${upper}`
		}
	}
	static verifyBoolean(v: string) { return v === "T" }
	static VerifyFns = {
		SIMPLE: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let value = arguments[0]
			this.primary = true
			this.verifyOrder("SIMPLE", 0)
			return this.verifyBoolean(value)
		},
		XTENSION: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			this.extension = true
			this.extensionType = arguments[0]
			this.verifyOrder("XTENSION", 0)
			return this.extensionType
		},
		BITPIX: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let key = "BITPIX"
			let value = parseInt(arguments[0])
			this.verifyOrder(key, 1)
			if (value !== 8 && value !== 16 && value !== 32 && value !== (-32) && value !== (-64)) {
				throw "" + key + " value " + value + " is not permitted"
			}
			return value
		},
		NAXIS: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let key = "NAXIS"
			let value = parseInt(arguments[0])
			let array = arguments[1]
			if (!array) {
				this.verifyOrder(key, 2)
				this.verifyBetween(key, value, 0, 999)
				if (this.isExtension()) {
					let _ref = this.extensionType
					if (_ref === "TABLE" || _ref === "BINTABLE") {
						let required = 2
						if (value !== required) {
							throw "" + key + " must be " + required + " for TABLE and BINTABLE extensions"
						}
					}
				}
			}
			return value
		},
		PCOUNT: function() {
			let _ref
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let key = "PCOUNT"
			let value = parseInt(arguments[0])
			let order = 1 + 1 + 1 + this.get("NAXIS")
			this.verifyOrder(key, order)
			if (this.isExtension()) {
				if ((_ref = this.extensionType) === "IMAGE" || _ref === "TABLE") {
					let required = 0
					if (value !== required) {
						throw "" + key + " must be " + required + " for the " + this.extensionType + " extensions"
					}
				}
			}
			return value;
		},
		GCOUNT: function() {
			let _ref
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let key = "GCOUNT"
			let value = parseInt(arguments[0])
			let order = 1 + 1 + 1 + this.get("NAXIS") + 1
			this.verifyOrder(key, order)
			if (this.isExtension()) {
				if ((_ref = this.extensionType) === "IMAGE" || _ref === "TABLE" || _ref === "BINTABLE") {
					let required = 1
					if (value !== required) {
						throw "" + key + " must be " + required + " for the " + this.extensionType + " extensions"
					}
				}
			}
			return value;
		},
		EXTEND: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let value = arguments[0]
			if (!this.isPrimary()) {
				throw "EXTEND must only appear in the primary header"
			}
			return this.verifyBoolean(value)
		},
		BSCALE: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return parseFloat(arguments[0])
		},
		BZERO: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return parseFloat(arguments[0])
		},
		BLANK: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let value = arguments[0]
			if (!(this.get("BITPIX") > 0)) {
				console.warn("BLANK is not to be used for BITPIX = " + (this.get('BITPIX')))
			}
			return parseInt(value)
		},
		DATAMIN: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return parseFloat(arguments[0])
		},
		DATAMAX: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return parseFloat(arguments[0])
		},
		EXTVER: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return parseInt(arguments[0])
		},
		EXTLEVEL: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return parseInt(arguments[0])
		},
		TFIELDS: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let value = parseInt(arguments[0])
			this.verifyBetween("TFIELDS", value, 0, 999)
			return value
		},
		TBCOL: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let value = arguments[0]
			let index = arguments[2]
			this.verifyBetween("TBCOL", index, 0, this.get("TFIELDS"))
			return value
		},
		ZIMAGE: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return this.verifyBoolean(arguments[0])
		},
		ZCMPTYPE: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let value = arguments[0]
			if (value !== 'GZIP_1' && value !== 'RICE_1' && value !== 'PLIO_1' && value !== 'HCOMPRESS_1') {
				throw "ZCMPTYPE value " + value + " is not permitted"
			}
			if (value !== 'RICE_1') {
				throw "Compress type " + value + " is not yet implement"
			}
			return value
		},
		ZBITPIX: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let value = parseInt(arguments[0])
			if (value !== 8 && value !== 16 && value !== 32 && value !== 64 && value !== (-32) && value !== (-64)) {
				throw "ZBITPIX value " + value + " is not permitted"
			}
			return value
		},
		ZNAXIS: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			let value = parseInt(arguments[0])
			let array = arguments[1]
			value = value
			if (!array) {
				this.verifyBetween("ZNAXIS", value, 0, 999)
			}
			return value
		},
		ZTILE: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return parseInt(arguments[0])
		},
		ZSIMPLE: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return arguments[0] === "T"
		},
		ZPCOUNT: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return parseInt(arguments[0])
		},
		ZGCOUNT: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return parseInt(arguments[0])
		},
		ZDITHER0: function() {
			let args = 1 <= arguments.length ? __slice.call(arguments, 0) : []
			return parseInt(arguments[0])
		}
	}
}

class Header extends Base {

	arrayPattern = /(\D+)(\d+)/
	maxLines = 600

	primary = false
	extension = false
	verifyCard: any = {}
	VerifyFns: any
	cards: any = {
		COMMENT: [],
		HISTORY: []
	}
	cardIndex = 0
	block: any

	constructor(block: any) {
		super()
		let _ref = this.VerifyFns
		for (let name in _ref) {
			let method = _ref[name]
			this.verifyCard[name] = this.proxy(method)
		}
		this.block = block
		this.readBlock(block)
	}

	get(key: any) {
		if (this.contains(key)) {
			return this.cards[key].value
		} else {
			return null
		}
	}

	set(key: any, value: any, comment = '') {
		this.cards[key] = {
			index: this.cardIndex,
			value: value,
			comment: comment
		}
		return this.cardIndex += 1
	}

	contains(key: any) { return this.cards.hasOwnProperty(key) }

	readLine(l: string) {
		let key = l.slice(0, 8).trim()
		let blank = key === ''
		if (blank) { return }
		let indicator = l.slice(8, 10)
		let value = l.slice(10)
		if (indicator !== "= ") {
			if (key === 'COMMENT' || key === 'HISTORY') {
				this.cards[key].push(value.trim())
			}
			return
		}
		let _ref = value.split(' /')
		value = _ref[0]
		let comment = _ref[1]
		value = value.trim()
		let firstByte = value[0]
		if (firstByte === "'") {
			value = value.slice(1, -1).trim();
		} else {
			if (value !== 'T' && value !== 'F') {
				value = parseFloat(value) as any
			}
		}
		value = this.validate(key, value)
		return this.set(key, value, comment)
	}

	validate(key: any, value: any) {
		let index = null
		let baseKey = key
		let isArray = this.arrayPattern.test(key)
		if (isArray) {
			let match = this.arrayPattern.exec(key) as any
			let _ref = match.slice(1)
			baseKey = _ref[0]
			index = _ref[1]
		}
		if (baseKey in this.verifyCard) {
			value = this.verifyCard[baseKey](value, isArray, index)
		}
		return value
	}

	readBlock(block: any) {
		let _i
		let lineWidth = 80
		let nLines = block.length / lineWidth
		nLines = nLines < this.maxLines ? nLines : this.maxLines
		let _results = []
		for (let i = _i = 0, _ref = nLines - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
			let line = block.slice(i * lineWidth, (i + 1) * lineWidth)
			_results.push(this.readLine(line))
		}
		return _results
	}

	hasDataUnit() { return (this.get("NAXIS") !== 0) }

	getDataLength() {
		let _i
		if (!this.hasDataUnit()) { return 0 }
		let naxis = []
		for (let i = _i = 1, _ref = this.get("NAXIS"); 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
			naxis.push(this.get("NAXIS" + i))
		}
		let length = naxis.reduce( (a, b) => a * b ) * Math.abs(this.get("BITPIX")) / 8
		length += this.get("PCOUNT")
		return length
	}

	extensionType: any
	getDataType() {
		switch (this.extensionType) {
			case 'BINTABLE':
				if (this.contains('ZIMAGE')) return 'CompressedImage'
				return 'BinaryTable'
			case 'TABLE':
				return 'Table'
			default:
				if (this.hasDataUnit()) return 'Image'
				else return null
		}
	}

	isPrimary() { return this.primary }

	isExtension() { return this.extension }
}
Header.include(HeaderVerify)

class ImageUtils {

	static getExtent(arr: any[]) {
		let max, min, value
		let index = arr.length
		while (index--) {
			value = arr[index]
			if (isNaN(value)) continue
			min = max = value
			break
		}
		if (index === -1) {
			return [NaN, NaN]
		}
		while (index--) {
			value = arr[index]
			if (isNaN(value)) continue
			if (value < min) min = value
			if (value > max) max = value
		}
		return [min, max]
	}

	static getPixel(arr: any[], x: number, y: number) {
		return arr[y * (this as any).width + x]
	}
}

class Image extends DataUnit {
	allocationSize = 16777216

	bitpix: any
	naxis: any[] = []
	width: any
	height: any
	depth: any
	bzero: any
	bscale: any
	bytes: any
	length: any
	frame = 0
	frameOffsets: any[] = []
	frameLength: any
	nBuffers: any

	constructor(header: any, data: any) {
		super(header, data)
		let _i, _j
		let naxis = header.get("NAXIS")
		this.bitpix = header.get("BITPIX")
		for (let i = _i = 1; 1 <= naxis ? _i <= naxis : _i >= naxis; i = 1 <= naxis ? ++_i : --_i) {
			this.naxis.push(header.get("NAXIS" + i))
		}
		this.width = header.get("NAXIS1")
		this.height = header.get("NAXIS2") || 1
		this.depth = header.get("NAXIS3") || 1
		this.bzero = header.get("BZERO") || 0
		this.bscale = header.get("BSCALE") || 1
		this.bytes = Math.abs(this.bitpix) / 8
		this.length = this.naxis.reduce((a, b) => a * b ) * Math.abs(this.bitpix) / 8
		this.frameLength = this.bytes * this.width * this.height
		this.nBuffers = this.buffer != null ? 1 : 2
		for (let i = _j = 0, _ref = this.depth - 1; 0 <= _ref ? _j <= _ref : _j >= _ref; i = 0 <= _ref ? ++_j : --_j) {
			let begin = i * this.frameLength
			let frame: any = { begin: begin }
			if (this.buffer != null) {
				frame.buffers = [this.buffer.slice(begin, begin + this.frameLength)]
			}
			this.frameOffsets.push(frame)
		}
	}

	_getFrame(buffer: any, bitpix: number, bzero: number, bscale: number) {
		let arr
		let i
		let swapEndian: any
		let tmp: any
		let bytes = Math.abs(bitpix) / 8
		let nPixels = i = buffer.byteLength / bytes
		let dataType = Math.abs(bitpix)
		if (bitpix > 0) {
			switch (bitpix) {
				case 8:
					tmp = new Uint8Array(buffer)
					tmp = new Uint16Array(tmp)
					swapEndian = (v: any) => v
					break
				case 16:
					tmp = new Int16Array(buffer)
					swapEndian = (v: any) => ((v & 0xFF) << 8) | ((v >> 8) & 0xFF)
					break
				case 32:
					tmp = new Int32Array(buffer)
					swapEndian = (v: any) => ((v & 0xFF) << 24) | ((v & 0xFF00) << 8) | ((v >> 8) & 0xFF00) | ((v >> 24) & 0xFF)
			}
			if (!(parseInt(bzero as any) === bzero && parseInt(bscale as any) === bscale)) {
				arr = new Float32Array(tmp.length)
			} else {
				arr = tmp
			}
			while (nPixels--) {
				tmp[nPixels] = swapEndian(tmp[nPixels])
				arr[nPixels] = bzero + bscale * tmp[nPixels]
			}
		} else {
			arr = new Uint32Array(buffer)
			swapEndian = (v: number) => ((v & 0xFF) << 24) | ((v & 0xFF00) << 8) | ((v >> 8) & 0xFF00) | ((v >> 24) & 0xFF)
			while (i--) {
				arr[i] = swapEndian(arr[i])
			}
			arr = new Float32Array(buffer)
			while (nPixels--) {
				arr[nPixels] = bzero + bscale * arr[nPixels]
			}
		}
		return arr
	}

	_getFrameAsync(buffers: any[], callback: Function, opts: any) {
		let _this = this
		let onmessage = function(e: any) {
			let data = e.data
			let buffer = data.buffer
			let bitpix = data.bitpix
			let bzero = data.bzero
			let bscale = data.bscale
			let url = data.url
			// importScripts(url) // ← ??? TODO : what is that ??? it's implemented nowhere...
			let arr = _this._getFrame(buffer, bitpix, bzero, bscale)
			return postMessage(arr)
		}
		let fn1 = "onmessage = " + onmessage.toString().replace('return postMessage', 'postMessage')
		let fn2 = this._getFrame.toString().replace('function', 'function _getFrame')
		let mime = "application/javascript"
		let blobOnMessage = new Blob([fn1], { type: mime })
		let blobGetFrame = new Blob([fn2], { type: mime })
		let URL = window.URL || window.webkitURL
		let urlOnMessage = URL.createObjectURL(blobOnMessage)
		let urlGetFrame = URL.createObjectURL(blobGetFrame)
		let worker = new Worker(urlOnMessage)
		let msg = {
			buffer: buffers[0],
			bitpix: this.bitpix,
			bzero: this.bzero,
			bscale: this.bscale,
			url: urlGetFrame
		}
		let i = 0
		let pixels: any = null
		let start = 0
		worker.onmessage = function(e) {
			let arr = e.data
			if (pixels == null) {
				pixels = new arr.constructor(_this.width * _this.height)
			}
			pixels.set(arr, start)
			start += arr.length
			i += 1
			if (i === _this.nBuffers) {
				_this.invoke(callback, opts, pixels)
				URL.revokeObjectURL(urlOnMessage)
				URL.revokeObjectURL(urlGetFrame)
				return worker.terminate()
			} else {
				msg.buffer = buffers[i]
				return worker.postMessage(msg, [buffers[i]])
			}
		}
		worker.postMessage(msg, [buffers[0]])
	}

	getFrame(frame: any, callback: Function, opts: any) {
		let _this = this
		this.frame = frame || this.frame
		let frameInfo = this.frameOffsets[this.frame]
		let buffers = frameInfo.buffers
		if ((buffers != null ? buffers.length : void 0) === this.nBuffers) {
			return this._getFrameAsync(buffers, callback, opts)
		} else {
			this.frameOffsets[this.frame].buffers = []
			let begin = frameInfo.begin
			let blobFrame = this.blob.slice(begin, begin + this.frameLength)
			let blobs: any[] = []
			let nRowsPerBuffer = Math.floor(this.height / this.nBuffers)
			let bytesPerBuffer = nRowsPerBuffer * this.bytes * this.width
			let _i
			for (let i = _i = 0, _ref = this.nBuffers - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
				let start = i * bytesPerBuffer
				if (i === this.nBuffers - 1) {
					blobs.push(blobFrame.slice(start))
				} else {
					blobs.push(blobFrame.slice(start, start + bytesPerBuffer))
				}
			}
			buffers = []
			let reader = new FileReader() as any
			reader.frame = this.frame
			let i = 0
			reader.onloadend = function(e: any) {
				var buffer
				frame  = e.target.frame
				buffer = e.target.result
				_this.frameOffsets[frame].buffers.push(buffer)
				i += 1
				if (i === _this.nBuffers) {
					return _this.getFrame(frame, callback, opts)
				} else {
					return reader.readAsArrayBuffer(blobs[i])
				}
			}
			return reader.readAsArrayBuffer(blobs[0])
		}
	}

	getFrames(frame: number, number: number, callback: Function, opts: any) {
		let _this = this
		let cb = function(arr: any[], opts: any) {
			_this.invoke(callback, opts, arr)
			number -= 1
			frame += 1
			if (!number) return
			return _this.getFrame(frame, cb, opts)
		}
		return this.getFrame(frame, cb, opts)
	}

	isDataCube() { return this.naxis.length > 2 }
}
Image.include(ImageUtils)

class Tabular extends DataUnit {
	maxMemory = 1048576
	rowByteSize: any
	rows: any
	cols: any
	length: any
	heapLength: any
	columns: any
	rowsInMemory: any
	heap: any
	firstRowInBuffer: any
	nRowsInBuffer: any
	accessors: Function[] = []
	descriptors: any[] = []
	elementByteLengths: any[] = []
	lastRowInBuffer: any

	setAccessors(header: any) {} // TODO : should this be added ?

	constructor(header: any, data: any) {
		super(header, data)
		this.rowByteSize = header.get("NAXIS1")
		this.rows = header.get("NAXIS2")
		this.cols = header.get("TFIELDS")
		this.length = this.rowByteSize * this.rows
		this.heapLength = header.get("PCOUNT")
		this.columns = this.getColumns(header)
		if (this.buffer != null) {
			this.rowsInMemory = this._rowsInMemoryBuffer
			this.heap = this.buffer.slice(this.length, this.length + this.heapLength)
		} else {
			this.rowsInMemory = this._rowsInMemoryBlob
			this.firstRowInBuffer = this.lastRowInBuffer = 0
			this.nRowsInBuffer = Math.floor(this.maxMemory / this.rowByteSize)
		}
		this.setAccessors(header)
	}

	_rowsInMemoryBuffer() { return true }

	_rowsInMemoryBlob = function(firstRow: number, lastRow: number) {
		if (firstRow < this.firstRowInBuffer) return false
		if (lastRow > this.lastRowInBuffer) return false
		return true
	}

	getColumns(header: any) {
		let _i
		let columns = []
		for (let i = _i = 1, _ref = this.cols; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
			let key = "TTYPE" + i
			if (!header.contains(key)) return null
			columns.push(header.get(key))
		}
		return columns
	}

	typedArray: any

	getColumn(name: string, callback: Function, opts: any) {
		let _this = this
		if (this.blob != null) {
			let index = this.columns.indexOf(name)
			let descriptor = this.descriptors[index]
			let accessor = this.accessors[index]
			let elementByteLength = this.elementByteLengths[index]
			let elementByteOffset = (this.elementByteLengths.slice(0, index) as number[]).reduce( (a,b) => a+b)
			let column = this.typedArray[descriptor] != null ? new this.typedArray[descriptor](this.rows) : []
			let rowsPerIteration = ~~(this.maxMemory / this.rowByteSize)
			rowsPerIteration = Math.min(rowsPerIteration, this.rows)
			let factor = this.rows / rowsPerIteration
			let iterations = Math.floor(factor) === factor ? factor : Math.floor(factor) + 1
			let i = 0
			index = 0
			let cb = function(buffer: any, opts: any) {
				let nRows = buffer.byteLength / _this.rowByteSize
				let view = new DataView(buffer)
				let offset = elementByteOffset
				while (nRows--) {
					column[i] = accessor(view, offset)[0]
					i += 1
					offset += _this.rowByteSize
				}
				iterations -= 1
				index += 1
				if (iterations) {
					let startRow = index * rowsPerIteration
					return _this.getTableBuffer(startRow, rowsPerIteration, cb, opts)
				} else {
					_this.invoke(callback, opts, column)
				}
			}
			return this.getTableBuffer(0, rowsPerIteration, cb, opts)
		} else {
			let cb = function(rows: any[], opts: any) {
				let column = rows.map( (d) => d[name])
				return _this.invoke(callback, opts, column)
			}
			return this.getRows(0, this.rows, cb, opts)
		}
	}

	getTableBuffer(row: number, number: number, callback: Function, opts: any) {
		let _this = this
		number = Math.min(this.rows - row, number)
		let begin = row * this.rowByteSize
		let end = begin + number * this.rowByteSize
		let blobRows = this.blob.slice(begin, end)
		let reader = new FileReader() as any
		reader.row = row
		reader.number = number
		reader.onloadend = function(e: any) {
			return _this.invoke(callback, opts, (e as any).target.result)
		}
		return reader.readAsArrayBuffer(blobRows)
	}

	getRows(row: number, number: number, callback: Function, opts: any) {
		let begin, buffer, end
		let _this = this
		if (this.rowsInMemory(row, row + number)) {
			if (this.blob != null) {
				buffer = this.buffer
			} else {
				begin = row * this.rowByteSize
				end = begin + number * this.rowByteSize
				buffer = this.buffer.slice(begin, end)
			}
			let rows = (this as any)._getRows(buffer, number)
			this.invoke(callback, opts, rows)
			return rows
		} else {
			begin = row * this.rowByteSize
			end = begin + Math.max(this.nRowsInBuffer * this.rowByteSize, number * this.rowByteSize)
			let blobRows = this.blob.slice(begin, end)
			let reader = new FileReader() as any
			reader.row = row
			reader.number = number
			reader.onloadend = function(e: any) {
				let target = e.target
				_this.buffer = target.result
				_this.firstRowInBuffer = _this.lastRowInBuffer = target.row
				_this.lastRowInBuffer += target.number
				return _this.getRows(row, number, callback, opts)
			}
			return reader.readAsArrayBuffer(blobRows)
		}
	}
}

class Table extends Tabular {
	constructor(header: any, data: any) {
		super(header, data)
		// return Table.__super__.constructor.apply(this, arguments);
	}

	dataAccessors = {
		A: (v: any) => v.trim() ,
		I: (v: any) => parseInt(v) ,
		F: (v: any) => parseFloat(v),
		E: (v: any) => parseFloat(v),
		D: (v: any) => parseFloat(v)
	}

	setAccessors(header: any) {
		let _this = this
		let pattern = /([AIFED])(\d+)\.*(\d+)*/;
		let _results = []
		let _i
		for (let i = _i = 1, _ref1 = this.cols; 1 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 1 <= _ref1 ? ++_i : --_i) {
			let form = header.get("TFORM" + i)
			let type = header.get("TTYPE" + i)
			let match = pattern.exec(form) as any
			let descriptor = match[1]
			_results.push((function(descriptor) {
				let accessor = function(value: any) {
					return (_this.dataAccessors as any)[descriptor](value)
				}
				return _this.accessors.push(accessor)
			})(descriptor))
		}
		return _results
	}

	_getRows(buffer: any) {
		let value, _i, _k
		let nRows = buffer.byteLength / this.rowByteSize
		let arr = new Uint8Array(buffer)
		let rows = []
		for (let i = _i = 0, _ref1 = nRows - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
			let begin = i * this.rowByteSize
			let end = begin + this.rowByteSize
			let subarray = arr.subarray(begin, end)
			let line = '' as any
			for (let _j = 0, _len = subarray.length; _j < _len; _j++) {
				value = subarray[_j]
				line += String.fromCharCode(value)
			}
			line = line.trim().split(/\s+/)
			let row: any = {}
			let _ref2 = this.accessors
			for (let index = _k = 0, _len1 = _ref2.length; _k < _len1; index = ++_k) {
				let accessor = _ref2[index]
				value = line[index]
				row[this.columns[index]] = accessor(value)
			}
			rows.push(row)
		}
		return rows
	}
}

class BinaryTable extends Tabular {
	constructor(header: any, data: any) {
		super(header, data)
		// return BinaryTable.__super__.constructor.apply(this, arguments)
	}

	typedArray: any = {
		B: Uint8Array,
		I: Uint16Array,
		J: Uint32Array,
		E: Float32Array,
		D: Float64Array,
		1: Uint8Array,
		2: Uint16Array,
		4: Uint32Array
	}

	static offsets: any = {
		L: 1,
		B: 1,
		I: 2,
		J: 4,
		K: 8,
		A: 1,
		E: 4,
		D: 8,
		C: 8,
		M: 16
	}

	dataAccessors: any = {
		L: function(view: any, offset: number) {
			let x = view.getInt8(offset)
			offset += 1
			let val = x === 84 ? true : false
			return [val, offset]
		},
		B: function(view: any, offset: number) {
			let val = view.getUint8(offset)
			offset += 1
			return [val, offset]
		},
		I: function(view: any, offset: number) {
			let val = view.getInt16(offset)
			offset += 2
			return [val, offset]
		},
		J: function(view: any, offset: number) {
			let val = view.getInt32(offset)
			offset += 4
			return [val, offset]
		},
		K: function(view: any, offset: number) {
			let highByte = Math.abs(view.getInt32(offset))
			offset += 4
			let lowByte = Math.abs(view.getInt32(offset))
			offset += 4
			let mod = highByte % 10
			let factor = mod ? -1 : 1
			highByte -= mod
			let val = factor * ((highByte << 32) | lowByte)
			return [val, offset]
		},
		A: function(view: any, offset: number) {
			let val = view.getUint8(offset)
			val = String.fromCharCode(val)
			offset += 1
			return [val, offset]
		},
		E: function(view: any, offset: number) {
			let val = view.getFloat32(offset)
			offset += 4
			return [val, offset]
		},
		D: function(view: any, offset: number) {
			let val = view.getFloat64(offset)
			offset += 8
			return [val, offset]
		},
		C: function(view: any, offset: number) {
			let val1 = view.getFloat32(offset)
			offset += 4
			let val2 = view.getFloat32(offset)
			offset += 4
			let val = [val1, val2]
			return [val, offset]
		},
		M: function(view: any, offset: number) {
			let val1 = view.getFloat64(offset)
			offset += 8
			let val2 = view.getFloat64(offset)
			offset += 8
			let val = [val1, val2]
			return [val, offset]
		}
	}

	toBits(byte: number) {
		let arr = []
		let i = 128
		while (i >= 1) {
			arr.push((byte & i ? 1 : 0))
			i /= 2
		}
		return arr
	}

	getFromHeap(view: any, offset: number, descriptor: any) {
		let length = view.getInt32(offset)
		offset += 4
		let heapOffset = view.getInt32(offset)
		offset += 4
		let heapSlice = this.heap.slice(heapOffset, heapOffset + length)
		let arr = new this.typedArray[descriptor](heapSlice)
		let i = arr.length
		while (i--) {
			arr[i] = DataUnit.swapEndian[descriptor](arr[i])
		}
		return [arr, offset]
	}

	algorithmParameters: any
	ztile: any
	width: any
	setAccessors(header: any) {
		let _i
		let _this = this
		let pattern = /(\d*)([P|Q]*)([L|X|B|I|J|K|A|E|D|C|M]{1})/
		let _results = []
		for (let i = _i = 1, _ref2 = this.cols; 1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 1 <= _ref2 ? ++_i : --_i) {
			let form = header.get("TFORM" + i)
			let type = header.get("TTYPE" + i)
			let match = pattern.exec(form) as any
			let count = parseInt(match[1]) || 1
			let isArray = match[2]
			let descriptor = match[3]
			_results.push((function(descriptor, count) {
				let accessor
				_this.descriptors.push(descriptor)
				_this.elementByteLengths.push(BinaryTable.offsets[descriptor] * count)
				if (isArray) {
					switch (type) {
						case "COMPRESSED_DATA":
							accessor = function(view: any, offset: any) {
								let _ref3 = _this.getFromHeap(view, offset, descriptor)
								let arr = _ref3[0]
								offset = _ref3[1]
								let pixels = new _this.typedArray[_this.algorithmParameters["BYTEPIX"]](_this.ztile[0])
								Decompress.Rice(arr, _this.algorithmParameters["BLOCKSIZE"], _this.algorithmParameters["BYTEPIX"], pixels, _this.ztile[0], Decompress.RiceSetup)
								return [pixels, offset]
							}
							break
						case "GZIP_COMPRESSED_DATA":
							accessor = function(view: any, offset: any) {
								let arr = new Float32Array(_this.width)
								i = arr.length
								while (i--) arr[i] = NaN
								return [arr, offset]
							}
							break
						default:
							accessor = function(view: any, offset: any) {
								return _this.getFromHeap(view, offset, descriptor)
							}
					}
				} else {
					if (count === 1) {
						accessor = function(view: any, offset: any) {
							let _ref3 = _this.dataAccessors[descriptor](view, offset)
							let value = _ref3[0]
							offset = _ref3[1]
							return [value, offset]
						}
					} else {
						if (descriptor === 'X') {
							let nBytes = Math.log(count) / Math.log(2)
							accessor = function(view: any, offset: any) {
								let buffer = view.buffer.slice(offset, offset + nBytes)
								let bytes = new Uint8Array(buffer)
								let bits: any[] = []
								for (let _j = 0, _len = bytes.length; _j < _len; _j++) {
									let byte = bytes[_j]
									let arr = _this.toBits(byte)
									bits = bits.concat(arr)
								}
								offset += nBytes
								return [bits.slice(0, +(count - 1) + 1 || 9e9), offset]
							}
						} else if (descriptor === 'A') {
							accessor = function(view: any, offset: any) {
								let buffer = view.buffer.slice(offset, offset + count)
								let arr = new Uint8Array(buffer)
								let s = ''
								for (let _j = 0, _len = arr.length; _j < _len; _j++) {
									let value = arr[_j]
									s += String.fromCharCode(value)
								}
								s = s.trim()
								offset += count
								return [s, offset]
							}
						} else {
							accessor = function(view: any, offset: any) {
								i = count
								let data = []
								while (i--) {
									let _ref3 = _this.dataAccessors[descriptor](view, offset)
									let value = _ref3[0]
									offset = _ref3[1]
									data.push(value)
								}
								return [data, offset]
							}
						}
					}
				}
				return _this.accessors.push(accessor)
			})(descriptor, count))
		}
		return _results
	}

	_getRows(buffer: any, nRows: any): any {
		let view = new DataView(buffer)
		let offset = 0
		let rows = []
		let _i
		while (nRows--) {
			let row: any = {}
			let _ref2 = this.accessors
			for (let index = _i = 0, _len = _ref2.length; _i < _len; index = ++_i) {
				let accessor = _ref2[index]
				let _ref3 = accessor(view, offset)
				let value = _ref3[0]
				offset = _ref3[1]
				row[this.columns[index]] = value
			}
			rows.push(row)
		}
		return rows
	}

}

class Decompress {
	static RiceSetup = {
		1: function(array: number[]) {
			let pointer = 1
			let fsbits = 3
			let fsmax = 6
			let lastpix = array[0]
			return [fsbits, fsmax, lastpix, pointer]
		},
		2: function(array: number[]) {
			let pointer = 2
			let fsbits = 4
			let fsmax = 14
			let lastpix = 0
			let bytevalue = array[0]
			lastpix = lastpix | (bytevalue << 8)
			bytevalue = array[1]
			lastpix = lastpix | bytevalue
			return [fsbits, fsmax, lastpix, pointer]
		},
		4: function(array: number[]) {
			let pointer = 4
			let fsbits = 5
			let fsmax = 25
			let lastpix = 0
			let bytevalue = array[0]
			lastpix = lastpix | (bytevalue << 24)
			bytevalue = array[1]
			lastpix = lastpix | (bytevalue << 16)
			bytevalue = array[2]
			lastpix = lastpix | (bytevalue << 8)
			bytevalue = array[3]
			lastpix = lastpix | bytevalue
			return [fsbits, fsmax, lastpix, pointer]
		}
	}
	static Rice(array: any[], blocksize: number, bytepix: number, pixels: any[], nx: number, setup: any) {
		let fsbits: any
		let bbits = 1 << fsbits
		let _ref2 = setup[bytepix](array)
		fsbits = _ref2[0]
		let fsmax = _ref2[1]
		let lastpix = _ref2[2]
		let pointer = _ref2[3]
		let nonzeroCount = new Uint8Array(256)
		let nzero = 8
		let _ref3 = [128, 255]
		let k = _ref3[0]
		let i = _ref3[1]
		while (i >= 0) {
			while (i >= k) {
				nonzeroCount[i] = nzero
				i -= 1
			}
			k = k / 2
			nzero -= 1
		}
		nonzeroCount[0] = 0
		let b = array[pointer++]
		let nbits = 8
		i = 0
		while (i < nx) {
			nbits -= fsbits
			while (nbits < 0) {
				b = (b << 8) | array[pointer++]
				nbits += 8
			}
			let fs = (b >> nbits) - 1
			b &= (1 << nbits) - 1
			let imax = i + blocksize
			if (imax > nx) imax = nx
			if (fs < 0) {
				while (i < imax) {
					pixels[i] = lastpix
					i += 1
				}
			} else if (fs === fsmax) {
				while (i < imax) {
					k = bbits - nbits
					let diff = b << k
					k -= 8
					while (k >= 0) {
						b = array[pointer++]
						diff |= b << k
						k -= 8
					}
					if (nbits > 0) {
						b = array[pointer++]
						diff |= b >> (-k)
						b &= (1 << nbits) - 1
					} else {
						b = 0
					}
					if ((diff & 1) === 0) {
						diff = diff >> 1
					} else {
						diff = ~(diff >> 1)
					}
					pixels[i] = diff + lastpix
					lastpix = pixels[i]
					i++
				}
			} else {
				while (i < imax) {
					while (b === 0) {
						nbits += 8
						b = array[pointer++]
					}
					nzero = nbits - nonzeroCount[b]
					nbits -= nzero + 1
					b ^= 1 << nbits
					nbits -= fs
					while (nbits < 0) {
						b = (b << 8) | array[pointer++]
						nbits += 8
					}
					let diff = (nzero << fs) | (b >> nbits)
					b &= (1 << nbits) - 1
					if ((diff & 1) === 0) {
						diff = diff >> 1
					} else {
						diff = ~(diff >> 1)
					}
					pixels[i] = diff + lastpix
					lastpix = pixels[i]
					i++
				}
			}
		}
		return pixels
	}
}

class CompressedImage extends BinaryTable {
	static randomGenerator() {
		let _i
		let a = 16807
		let m = 2147483647
		let seed = 1
		let random = new Float32Array(10000)
		for (let i = _i = 0; _i <= 9999; i = ++_i) {
			let temp = a * seed
			seed = temp - m * parseInt((temp/m) as any)
			random[i] = seed / m
		}
		return random
	}

	static randomSequence = CompressedImage.randomGenerator()

	ztile: any[] = []
	zcmptype: any
	zbitpix: any
	znaxis: any
	zblank: any
	blank: any
	zdither: any
	width: any
	height: any
	algorithmParameters: any = {}
	zmaskcmp: any
	zquantiz: any
	bzero: any
	bscale: any
	constructor(header: any, data: any) {
		super(header, data)
		let _i
		// CompressedImage.__super__.constructor.apply(this, arguments);
		this.zcmptype = header.get("ZCMPTYPE")
		this.zbitpix = header.get("ZBITPIX")
		this.znaxis = header.get("ZNAXIS")
		this.zblank = header.get("ZBLANK")
		this.blank = header.get("BLANK")
		this.zdither = header.get('ZDITHER0') || 0
		for (let i = _i = 1, _ref2 = this.znaxis; 1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 1 <= _ref2 ? ++_i : --_i) {
			let ztile = header.contains("ZTILE" + i) ? header.get("ZTILE" + i) : i === 1 ? header.get("ZNAXIS1") : 1
			this.ztile.push(ztile)
		}
		this.width = header.get("ZNAXIS1")
		this.height = header.get("ZNAXIS2") || 1
		if (this.zcmptype === 'RICE_1') {
			this.algorithmParameters["BLOCKSIZE"] = 32
			this.algorithmParameters["BYTEPIX"] = 4
		}
		let i = 1
		while (true) {
			let key = "ZNAME" + i
			if (!header.contains(key)) break
			let value = "ZVAL" + i
			this.algorithmParameters[header.get(key)] = header.get(value)
			i += 1
		}
		this.zmaskcmp = header.get("ZMASKCMP")
		this.zquantiz = header.get("ZQUANTIZ") || "LINEAR_SCALING"
		this.bzero = header.get("BZERO") || 0
		this.bscale = header.get("BSCALE") || 1
	}

	_getRows(buffer: any, nRows: number): any {
		var _i, _j
		let view = new DataView(buffer)
		let offset = 0
		let arr = new Float32Array(this.width * this.height)
		while (nRows--) {
			let row: any = {}
			let _ref2 = this.accessors
			for (let index = _i = 0, _len = _ref2.length; _i < _len; index = ++_i) {
				let accessor = _ref2[index]
				let _ref3 = accessor(view, offset)
				let value = _ref3[0]
				offset = _ref3[1]
				row[this.columns[index]] = value
			}
			let data = row['COMPRESSED_DATA'] || row['UNCOMPRESSED_DATA'] || row['GZIP_COMPRESSED_DATA']
			let blank = row['ZBLANK'] || this.zblank
			let scale = row['ZSCALE'] || this.bscale
			let zero = row['ZZERO'] || this.bzero
			let nTile = this.height - nRows
			let seed0 = nTile + this.zdither - 1
			let seed1 = (seed0 - 1) % 10000
			let rIndex = parseInt(CompressedImage.randomSequence[seed1] * 500 as any)
			for (let index = _j = 0, _len1 = data.length; _j < _len1; index = ++_j) {
				let value = data[index]
				let i = (nTile - 1) * this.width + index
				if (value === -2147483647) {
					arr[i] = NaN
				} else if (value === -2147483646) {
					arr[i] = 0
				} else {
					let r = CompressedImage.randomSequence[rIndex]
					arr[i] = (value - r + 0.5) * scale + zero
				}
				rIndex += 1
				if (rIndex === 10000) {
					seed1 = (seed1 + 1) % 10000
					rIndex = parseInt(CompressedImage.randomSequence[seed1] * 500 as any)
				}
			}
		}
		return arr
	}

	frame: any

	getFrame(nFrame: any, callback: Function, opts: any) {
		let _this = this
		if (this.heap) {
			this.frame = nFrame || this.frame
			return this.getRows(0, this.rows, callback, opts)
		} else {
			let heapBlob = this.blob.slice(this.length, this.length + this.heapLength)
			let reader = new FileReader()
			reader.onloadend = function(e: any) {
				_this.heap = e.target.result
				return _this.getFrame(nFrame, callback, opts)
			}
			return reader.readAsArrayBuffer(heapBlob)
		}
	}
}
CompressedImage.include(ImageUtils)
CompressedImage.extend(Decompress)

export class HDU {
	header
	data
	constructor(header: any, data: any) {
		this.header = header
		this.data = data
	}
	hasData() { return this.data != null }
}

class astro {
	static FITS = FITS
}

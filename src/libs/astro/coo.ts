//=================================
// Class Coo
//=================================

import { AstroMath } from './astroMath'
import { mat3 } from '../../Basic'

export class Coo {
	static factor = [ 3600.0, 60.0, 1.0 ]

	lon: number
	lat: number
	prec: number
	x = 0
	y = 0
	z = 0
	/**
	 * Constructor
	 * @param longitude longitude (decimal degrees)
	 * @param latitude latitude (decimal degrees)
	 * @param prec precision
	 * (8: 1/1000th sec, 7: 1/100th sec, 6: 1/10th sec, 5: sec, 4: 1/10th min, 3: min, 2: 1/10th deg, 1: deg
	 */
	constructor(longitude: number, latitude: number, prec: number) {
		this.lon = longitude
		this.lat = latitude
		this.prec = prec
		this.computeDirCos()
	}

	// setFrame(astroframe) { this.frame = astroframe }

	computeDirCos() {
		let coslat = AstroMath.cosd(this.lat)
		this.x = coslat*AstroMath.cosd(this.lon)
		this.y = coslat*AstroMath.sind(this.lon)
		this.z = AstroMath.sind(this.lat)
	}

	computeLonLat() {
		let r2 = this.x*this.x+this.y*this.y
		this.lon = 0.0
		if (r2 == 0.0) {
			// In case of poles
			if (this.z == 0.0) {
				this.lon = 0.0/0.0
				this.lat = 0.0/0.0
			} else {
				this.lat = (this.z > 0.0) ? 90.0 : -90.0
			}
		} else {
			this.lon = AstroMath.atan2d(this.y, this.x)
			this.lat = AstroMath.atan2d(this.z, Math.sqrt(r2))
			if (this.lon < 0) this.lon += 360.0
		}
	}

	/*
	 * Squared distance between 2 points (= 4.sin<sup>2</sup>(r/2))
	 * @param  pos      another position on the sphere
	 * @return ||pos-this||<sup>2</sup> = 4.sin<sup>2</sup>(r/2)
	 */
	dist2(pos: Coo) {
		// if ((this.x==0)&&(this.y==0)&&(this.z==0)) return(0./0.);
		// if ((pos.x==0)&&(pos.y==0)&&(pos.z==0)) return(0./0.);
		let w = pos.x - this.x
		let r2 = w * w
		w = pos.y - this.y; r2 += w * w
		w = pos.z - this.z; r2 += w * w
		return r2
	}

	/*
	 * Distance between 2 points on the sphere.
	 * @param  pos another position on the sphere
	 * @return distance in degrees in range [0, 180]
	 */
	distance(pos: Coo) {
		// Take care of NaN:
		if ((pos.x==0)&&(pos.y==0)&&(pos.z==0)) return(0/0)
		if ((this.x==0)&&(this.y==0)&&(this.z==0)) return(0/0)
		return (2 * AstroMath.asind(0.5 * Math.sqrt(this.dist2(pos))))
	}

	/*
	 * Rotate a coordinate (apply a rotation to the position).
	 * @param R [3][3] Rotation Matrix
	 */
	rotate(R: mat3) {
		let X, Y, Z
		X = R[0][0]*this.x + R[0][1]*this.y + R[0][2]*this.z
		Y = R[1][0]*this.x + R[1][1]*this.y + R[1][2]*this.z
		Z = R[2][0]*this.x + R[2][1]*this.y + R[2][2]*this.z
		// this.set(X, Y, Z); Not necessary to compute positions each time.
		this.x = X; this.y = Y; this.z = Z
		this.lon = this.lat = 0./0.
	}

	/*
	 * Rotate a coordinate (apply a rotation to the position) in reverse direction.
	 * The method is the inverse of rotate.
	 * @param R [3][3] Rotation Matrix
	 */
	rotate_1(R: mat3) {
		let X, Y, Z
		X = R[0][0]*this.x + R[1][0]*this.y + R[2][0]*this.z
		Y = R[0][1]*this.x + R[1][1]*this.y + R[2][1]*this.z
		Z = R[0][2]*this.x + R[1][2]*this.y + R[2][2]*this.z
		// this.set(X, Y, Z); Not necessary to compute positions each time.
		this.x = X; this.y = Y; this.z = Z
		this.lon = this.lat = 0./0.
	}

	/**
	 * Test equality of Coo.
	 * @param coo Second coordinate to compare with
	 * @return  True if the two coordinates are equal
	 */
	equals(coo: Coo) { return this.x == coo.x && this.y == coo.y && this.z == coo.z }

	/**
	 * parse a coordinate string. The coordinates can be in decimal or sexagesimal
	 * @param str string to parse
	 * @return true if the parsing succeded, false otherwise
	 */
	parse(str: string) {
		let p = str.indexOf('+')
		if (p < 0) p = str.indexOf('-')
		if (p < 0) p = str.indexOf(' ')
		if (p < 0) {
			this.lon = 0/0
			this.lat = 0/0
			this.prec = 0
			return false
		}
		let strlon = str.substring(0,p)
		let strlat = str.substring(p)

		this.lon = this.parseLon(strlon) // sets the precision parameter
		this.lat = this.parseLat(strlat) // sets the precision parameter
		return true
	}

	parseLon(str: string) {
		str = str.trim()
		str = str.replace(/:/g, ' ')

		if (str.indexOf(' ') < 0) {
			// The longitude is a integer or decimal number
			let p = str.indexOf('.')
			this.prec = p < 0 ? 0 : str.length - p - 1
			return parseFloat(str)
		} else {
			let stok = new Tokenizer(str,' ')
			let i = 0
			let l = 0
			let pr = 0
			while (stok.hasMore()) {
				let tok = stok.nextToken()
				let dec = tok.indexOf('.')
				l += parseFloat(tok)*Coo.factor[i]
				// pr = dec < 0 ? 1 : 2;
				switch (i) {
					case 0: pr = dec < 0 ? 1 : 2; break
					case 1: pr = dec < 0 ? 3 : 4; break
					case 2: pr = dec < 0 ? 5 : 4+tok.length-dec
					default: break
				}
				i++
			}
			this.prec = pr
			return l*15/3600
		}
	}

	parseLat(str: string) {
		str = str.trim();
		str = str.replace(/:/g, ' ')

		let sign
		if (str.charAt(0) == '-') {
			sign = -1
			str = str.substring(1)
		} else if (str.charAt(0) == '-') {
			sign = 1
			str = str.substring(1)
		} else {
			// No sign specified
			sign = 1
		}
		if (str.indexOf(' ') < 0) {
			// The longitude is a integer or decimal number
			let p = str.indexOf('.')
			this.prec = p < 0 ? 0 : str.length - p - 1
			return parseFloat(str)*sign
		} else {
			let stok = new Tokenizer(str,' ')
			let i = 0
			let l = 0
			let pr = 0
			while (stok.hasMore()) {
				let tok = stok.nextToken()
				let dec = tok.indexOf('.')
				l += parseFloat(tok)*Coo.factor[i]
				switch (i) {
					case 0: pr = dec < 0 ? 1 : 2; break
					case 1: pr = dec < 0 ? 3 : 4; break
					case 2: pr = dec < 0 ? 5 : 4+tok.length-dec
					default: break
				}
				i++
			}
			this.prec = pr
			return l*sign/3600
		}
	}

	/**
	 * Format coordinates according to the options
	 * @param options 'd': decimal, 's': sexagésimal, '/': space separated, '2': return [ra,dec] in an array
	 * @return the formatted coordinates
	 */
	format(options: string = '') {
		if (isNaN(this.lon)) this.computeLonLat()
		let strlon = "", strlat = ""
		if (options.indexOf('d') >= 0) {
			// decimal display
			strlon = Numbers.format(this.lon, this.prec)
			strlat = Numbers.format(this.lat, this.prec)
		} else {
			// sexagesimal display
			let hlon = this.lon/15.0
			strlon = Numbers.toSexagesimal(hlon    , this.prec+1, false)
			strlat = Numbers.toSexagesimal(this.lat, this.prec  , false)
		}
		if (this.lat > 0) strlat = '+'+strlat

		if (options.indexOf('/') >= 0) return strlon+' '+strlat
		else if (options.indexOf('2') >= 0) return [strlon, strlat]
		return strlon+strlat
	}

}

/*
 * Distance between 2 points on the sphere.
 * @param coo1 firs	let coslat = AstroMath.cosd(this.lat);

	this.x = coslat*AstroMath.cosd(this.lon);
	this.y = coslat*AstroMath.sind(this.lon);
	this.z = AstroMath.sind(this.lat);
t coordinates point
 * @param coo2 second coordinates point
 * @return distance in degrees in range [0, 180]
 */
/*
Coo.distance = function(Coo coo1, Coo coo2) {
	return Coo.distance(coo1.lon, coo1.lat, coo2.lon, coo2.lat);
}
*/
/*
 * Distance between 2 points on the sphere.
 * @param lon1 longitude of first point in degrees
 * @param lat1 latitude of first point in degrees
 * @param lon2 longitude of second point in degrees
 * @param lat2 latitude of second point in degrees
 * @return distance in degrees in range [0, 180]
 */
/*
Coo.distance = function(lon1, lat1, lon2, lat2) {
	let c1 = AstroMath.cosd(lat1);
	let c2 = AstroMath.cosd(lat2);

	let w, r2;
	w = c1 * AstroMath.cosd(lon1) - c2 * AstroMath.cosd(lon2);
	r2 = w*w;
	w = c1 * AstroMath.sind(lon1) - c2 * AstroMath.sind(lon2);
	r2 += w*w;
	w = AstroMath.sind(lat1) - AstroMath.sind(lat2);
	r2 += w*w;

	return 2. * AstroMath.asind(0.5 * Math.sqrt(r2));
}
 */

//===================================
// Class Tokenizer (similar to Java)
//===================================

class Tokenizer {
	string: string
	sep: string
	pos = 0

	/*
	* Constructor
	* @param str String to tokenize
	* @param sep token separator char
	*/
	constructor(str: string, sep: string) {
		this.string = Strings.trim(str, sep)
		this.sep = sep
	}

	/**
	 * Check if the string has more tokens
	 * @return true if a token remains (read with nextToken())
	 */
	hasMore() { return this.pos < this.string.length }

	/**
	 * Returns the next token (as long as hasMore() is true)
	 * @return the token string
	 */
	nextToken() {
		// skip all the separator chars
		let p0 = this.pos
		while (p0 < this.string.length && this.string.charAt(p0) == this.sep) p0++
		let p1 = p0
		// get the token
		while (p1 < this.string.length && this.string.charAt(p1) != this.sep) p1++
		this.pos = p1
		return this.string.substring(p0, p1)
	}
}

//================================
// Class Strings (static methods)
//================================

class Strings {
	/**
	 * Removes a given char at the beginning and the end of a string
	 * @param str string to trim
	 * @param c char to remove
	 * @return the trimmed string
	 */
	static trim(str: string, c: string) {
		let p0=0, p1=str.length-1
		while (p0 < str.length && str.charAt(p0) == c) p0++
		if (p0 == str.length) return ""
		while (p1 > p0 && str.charAt(p1) == c) p1--
		return str.substring(p0, p1+1)
	}
}

//================================
// Class Numbers (static methods)
//================================

class Numbers {
	constructor() {}

	//               0  1   2    3     4      5       6        7         8          9           10           11            12             13              14
	static pow10 = [ 1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 10000000000, 100000000000, 1000000000000, 10000000000000, 100000000000000 ]

	//                0    1     2      3       4        5         6          7      8            9             10             11              12                    13                14
	static rndval = [ 0.5, 0.05, 0.005, 0.0005, 0.00005, 0.000005, 0.0000005, 0.00000005, 0.000000005, 0.0000000005, 0.00000000005, 0.000000000005, 0.0000000000005, 0.00000000000005, 0.00000000000005 ]

	/**
	 * Format a integer or decimal number, adjusting the value with 'prec' decimal digits
	 * @param num number (integer or decimal)
	 * @param prec precision (= number of decimal digit to keep or append)
	 * @return a string with the formatted number
	 */
	static format(num: number, prec: number) {
		if (prec <= 0) return (Math.round(num)).toString() // Return an integer number
		let str = num.toString()
		let p = str.indexOf('.')
		let nbdec = p >= 0 ? str.length-p-1 : 0
		if (prec >= nbdec) {
			if (p < 0) str += '.'
			for (let i=0; i<prec-nbdec; i++) str += '0'
			return str
		}
		// HERE: prec > 0 and prec < nbdec
		str = (num+Numbers.rndval[prec]).toString()
		return str.substr(0, p+prec+1)
	}

	/**
	 * Convert a decimal coordinate into sexagesimal string, according to the given precision<br>
	 * 8: 1/1000th sec, 7: 1/100th sec, 6: 1/10th sec, 5: sec, 4: 1/10th min, 3: min, 2: 1/10th deg, 1: deg
	 * @param num number (integer or decimal)
	 * @param prec precision (= number of decimal digit to keep or append)
	 * @param plus if true, the '+' sign is displayed
	 * @return a string with the formatted sexagesimal number
	 */
	static toSexagesimal(num: number, prec: number, plus: boolean) {
		let sign = num < 0 ? '-' : (plus ? '+' : '')
		let n = Math.abs(num)
		let n1
		let n2
		let n3
		let n4
		switch (prec) {
			case 1: return `${sign}${Math.round(n)}` // deg
			case 2: return `${sign}${Numbers.format(n,1)}` // deg.d
			case 3:	// deg min
				n1 = Math.floor(n)
				n2 = Math.round((n-n1)*60)
				return `${sign}${n1} ${n2}`
			case 4:	// deg min.d
				n1 = Math.floor(n)
				n2 = (n-n1)*60
				return `${sign}${n1} ${Numbers.format(n2, 1)}`
			case 5:	// deg min sec
				n1 = Math.floor(n) // d
				n2 = (n-n1)*60 // M.d
				n3 = Math.floor(n2) // M
				n4 = Math.round((n2-n3)*60) // S
				return `${sign}${n1} ${n3} ${n4}`
			case 6:	// deg min sec.d
			case 7:	// deg min sec.dd
			case 8:	// deg min sec.ddd
				n1 = Math.floor(n)   // d
				n2 = (n-n1)*60       // M.d
				n3 = Math.floor(n2)  // M
				n4 = (n2-n3)*60      // S.ddd
				return `${sign}${n1.toString().padStart(2,'0')} ${n3.toString().padStart(2,'0')} ${Numbers.format(n4, prec-5)}`
			default:
				return `${sign}${Numbers.format(n,1)}`
		}
	}
}

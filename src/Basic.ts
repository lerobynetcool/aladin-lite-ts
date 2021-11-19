
export type Vxy = {
	vx: number
	vy: number
}
export type Txy = {
	x: number
	y: number
}

export type mat3 = number[][] // TODO can ts fix size ?
export type vec3 = number[]   // TODO can ts fix size ?
export type vec2 = number[]   // TODO can ts fix size ?

export type TXY = {
	X: number
	Y: number
}

export type RaDec = {
	ra: number
	dec: number
}

// useful extension of default object
// TODO : this is not necessarily best practise, but it really makes sens
declare global {
	interface Object {
		forEach: <T>(fun: (val: any, key: string) => T ) => T[]
		map: <T>(fun: (val: any, key: string) => T ) => {[key: string]: T}
	}
}
Object.prototype.forEach = function<T>(fun: (val: any, key: string) => T ): T[] {
	return Object.keys(this).map( key => fun((this as any)[key],key) )
}
Object.prototype.map = function<T>(fun: (val: any, key: string) => T ): {[key: string]: T} {
	let keys = Object.keys(this)
	let res = keys.map( key => fun((this as any)[key],key) )
	let out: {[key: string]: T} = {}
	for (let k in keys) out[keys[k]] = res[k]
	return out
}

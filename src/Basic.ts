
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
		map: <T>(fun: (val: any, key: string) => T ) => T[]
	}
}
Object.prototype.map = function<T>(fun: (val: any, key: string) => T ): T[] {
	return Object.keys(this).map( key => fun((this as any)[key],key) )
}

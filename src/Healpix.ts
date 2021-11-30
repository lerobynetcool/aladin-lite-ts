import { Utils } from './Utils'

// this is healpix.min.js

enum Constants {
	PI=Math.PI,
	C_PR=Math.PI/180,
	VLEV=2,
	EPS=1e-7,
	c=.105,
	LN10=Math.log(10),
	PIOVER2=Math.PI/2,
	TWOPI=2*Math.PI,
	TWOTHIRD=2/3,
	ARCSECOND_RADIAN=484813681109536e-20,
}

export class SpatialVector {
	x: number
	y: number
	z: number
	ra_=0
	dec_=0
	okRaDec_=!1
	constructor(x=0, y=0, z=0) {
		this.x=x
		this.y=y
		this.z=z
	}

	setXYZ(x: number,y: number,z: number) {
		this.x=x
		this.y=y
		this.z=z
		this.okRaDec_=!1
	}

	length() { return Math.sqrt(this.lengthSquared()) }

	lengthSquared() { return this.x*this.x+this.y*this.y+this.z*this.z }

	normalized() {
		let n=this.length()
		this.x/=n
		this.y/=n
		this.z/=n
	}

	set(ra: number, dec: number) {
		this.ra_=ra
		this.dec_=dec
		this.okRaDec_=!0
		this.updateXYZ()
	}

	angle(v: SpatialVector) {
		let s=this.y*v.z-this.z*v.y
		let i=this.z*v.x-this.x*v.z
		let n=this.x*v.y-this.y*v.x
		let a=Math.sqrt(s*s+i*i+n*n)
		return Math.abs(Math.atan2(a,this.dot(v)))
	}

	get() { return[this.x,this.y,this.z] }

	toString() { return`SpatialVector[${this.x}, ${this.y}, ${this.z}]` }

	cross(v: SpatialVector) { return new SpatialVector(this.y*v.z-v.y*this.z,this.z*v.x-v.z*this.x,this.x*v.y-v.x*this.y)}

	equal(v: SpatialVector) { return this.x==v.x && this.y==v.y && this.z==v.z }

	mult(s: number) { return new SpatialVector(s*this.x,s*this.y,s*this.z) }

	dot(v: SpatialVector) { return this.x*v.x+this.y*v.y+this.z*v.z}

	add(v: SpatialVector) { return new SpatialVector(this.x+v.x,this.y+v.y,this.z+v.z) }

	sub(v: SpatialVector) { return new SpatialVector(this.x-v.x,this.y-v.y,this.z-v.z) }

	dec() { return this.okRaDec_||(this.normalized(),this.updateRaDec()),this.dec_ }

	ra()  { return this.okRaDec_||(this.normalized(),this.updateRaDec()),this.ra_ }

	updateXYZ() {
		let c=Math.cos(this.dec_*Constants.C_PR)
		this.x=Math.cos(this.ra_*Constants.C_PR)*c
		this.y=Math.sin(this.ra_*Constants.C_PR)*c
		this.z=Math.sin(this.dec_*Constants.C_PR)
	}

	updateRaDec() {
		this.dec_=Math.asin(this.z)/Constants.C_PR
		let t=Math.cos(this.dec_*Constants.C_PR)
		this.ra_=t>Constants.EPS||-Constants.EPS>t?this.y>Constants.EPS||this.y<-Constants.EPS?0>this.y?360-Math.acos(this.x/t)/Constants.C_PR:Math.acos(this.x/t)/Constants.C_PR:0>this.x?180:0:0,this.okRaDec_=!0
	}

	toRaRadians() {
		let t=0
		return(0!=this.x||0!=this.y)&&(t=Math.atan2(this.y,this.x)),0>t&&(t+=2*Math.PI),t
	}

	toDeRadians() {
		let z=this.z/this.length()
		let a=Math.acos(z)
		return Math.PI/2-a
	}
}

class AngularPosition {
	theta: number
	phi: number
	constructor(theta: number,phi: number){this.theta=theta,this.phi=phi}
	toString() { return `theta: ${this.theta}, phi: ${this.phi}` }
}

class LongRangeSetBuilder {
	items: number[] = []
	appendRange(from: number,to: number) {
		for(let i=from;i<=to;i++) i in this.items||this.items.push(i)
	}
}

let HealpixIndexSize=256
type XYF = {
	ix: number,
	iy: number,
	face_num: number,
}
export class HealpixIndex {
	nside:  number
	ctab:   number[] = Array(HealpixIndexSize)
	utab:   number[] = Array(HealpixIndexSize)
	nl2:    number
	nl3:    number
	nl4:    number
	npface: number
	ncap:   number
	npix:   number
	fact2:  number
	fact1:  number
	order:  number
	constructor(nside: number) {
		this.nside=nside
		let i=0
		for(;i<HealpixIndexSize;++i) this.ctab[i]=1&i|(2&i)<<7|(4&i)>>1|(8&i)<<6|(16&i)>>2|(32&i)<<5|(64&i)>>3|(128&i)<<4
		this.utab[i]= 1&i|(2&i)<<1|(4&i)<<2|(8&i)<<3|(16&i)<<4|(32&i)<<5|(64&i)<<6|(128&i)<<7
		this.nl2    = 2*this.nside
		this.nl3    = 3*this.nside
		this.nl4    = 4*this.nside
		this.npface =   this.nside*this.nside
		this.ncap   = 2*this.nside*(this.nside-1)
		this.npix   = 12*this.npface
		this.fact2  = 4/this.npix
		this.fact1  = (this.nside<<1)*this.fact2
		this.order  = HealpixIndex.nside2order(this.nside)
	}

	static NS_MAX=8192
	static ORDER_MAX=13
	static NSIDELIST=[1,2,4,8,16,32,64,128,256,512,1024,2048,4096,8192]
	static JRLL=[2,2,2,2,3,3,3,3,4,4,4,4]
	static JPLL=[1,3,5,7,0,2,4,6,1,3,5,7]
	static XOFFSET=[-1,-1,0,1,1,1,0,-1]
	static YOFFSET=[0,1,1,1,0,-1,-1,-1]
	static FACEARRAY=[[8,9,10,11,-1,-1,-1,-1,10,11,8,9],[5,6,7,4,8,9,10,11,9,10,11,8],[-1,-1,-1,-1,5,6,7,4,-1,-1,-1,-1],[4,5,6,7,11,8,9,10,11,8,9,10],[0,1,2,3,4,5,6,7,8,9,10,11],[1,2,3,0,0,1,2,3,5,6,7,4],[-1,-1,-1,-1,7,4,5,6,-1,-1,-1,-1],[3,0,1,2,3,0,1,2,4,5,6,7],[2,3,0,1,-1,-1,-1,-1,0,1,2,3]]
	static SWAPARRAY=[[0,0,0,0,0,0,0,0,3,3,3,3],[0,0,0,0,0,0,0,0,6,6,6,6],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,5,5,5,5],[0,0,0,0,0,0,0,0,0,0,0,0],[5,5,5,5,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[6,6,6,6,0,0,0,0,0,0,0,0],[3,3,3,3,0,0,0,0,0,0,0,0]]
	static Z0=Constants.TWOTHIRD

	static calculateNSide(s: number) {
		let i=0
		for(let n=s*s,a=180/Constants.PI,e=3600*3600*4*Constants.PI*a*a,h=Utils.castToInt(e/n),r=h/12,o=Math.sqrt(r),c=HealpixIndex.NS_MAX,u=0,p=0;HealpixIndex.NSIDELIST.length>p;p++)
			if(c>=Math.abs(o-HealpixIndex.NSIDELIST[p])&&(c=Math.abs(o-HealpixIndex.NSIDELIST[p]),i=HealpixIndex.NSIDELIST[p],u=p),o>i&&HealpixIndex.NS_MAX>o&&(i=HealpixIndex.NSIDELIST[u+1]),o>HealpixIndex.NS_MAX)
				return console.log("nside cannot be bigger than "+HealpixIndex.NS_MAX),HealpixIndex.NS_MAX
			return i
	}

	static nside2order(nside: number) { return(nside&nside-1)>0?-1:Utils.castToInt(HealpixIndex.log2(nside)) }

	static log2(x: number) { return Math.log(x)/Math.log(2) }

	ang2pix_nest(theta: number,phi: number) {
		let n,a,e,h,r,o,c,u,p,l,d,f,I
		if(phi>=Constants.TWOPI&&(phi-=Constants.TWOPI),0>phi&&(phi+=Constants.TWOPI),theta>Constants.PI||0>theta)
			throw {
				name:"Illegal argument",
				message:"theta must be between 0 and "+Constants.PI
			}
		if(phi>Constants.TWOPI||0>phi)
			throw {
				name:"Illegal argument",
				message:"phi must be between 0 and "+Constants.TWOPI
			}
		if(a=Math.cos(theta),e=Math.abs(a),h=phi/Constants.PIOVER2,HealpixIndex.Z0>=e) {
			let M=this.nside*(.5+h)
			let y=this.nside*.75*a
			let u=M-y
			let p=M+y
			o=u>>this.order
			c=p>>this.order
			d=o==c?4==o?4:o+4:c>o?o:c+8
			f=Utils.castToInt(p&this.nside-1)
			I=Utils.castToInt(this.nside-(u&this.nside-1)-1)
		} else {
			l=Utils.castToInt(h)
			l>=4&&(l=3)
			r=h-l
			let g=this.nside*Math.sqrt(3*(1-e))
			u=Utils.castToInt(r*g)
			p=Utils.castToInt((1-r)*g)
			u=Math.min(HealpixIndex.NS_MAX-1,u)
			p=Math.min(HealpixIndex.NS_MAX-1,p)
			a>=0?(d=l,f=Utils.castToInt(this.nside-p-1),I=Utils.castToInt(this.nside-u-1)):(d=l+8,f=u,I=p)
		}
		return n=this.xyf2nest(f,I,d)
	}

	xyf2nest(x: number, y: number, f: number) {
		return(f<<2*this.order)+(this.utab[255&x]|this.utab[255&x>>8]<<16|this.utab[255&x>>16]<<32|this.utab[255&x>>24]<<48|this.utab[255&y]<<1|this.utab[255&y>>8]<<17|this.utab[255&y>>16]<<33|this.utab[255&y>>24]<<49)
	}

	nest2xyf(nest: number): XYF {
		let face_num=nest>>2*this.order
		let i=nest&this.npface-1
		let n=(93823560581120&i)>>16|(614882086624428e4&i)>>31|21845&i|(1431633920&i)>>15
		let ix=this.ctab[255&n]|this.ctab[255&n>>8]<<4|this.ctab[255&n>>16]<<16|this.ctab[255&n>>24]<<20
		i>>=1
		n=(93823560581120&i)>>16|(614882086624428e4&i)>>31|21845&i|(1431633920&i)>>15
		let iy=this.ctab[255&n]|this.ctab[255&n>>8]<<4|this.ctab[255&n>>16]<<16|this.ctab[255&n>>24]<<20
		return {
			ix:ix,
			iy:iy,
			face_num: face_num,
		}
	}

	pix2ang_nest(pix: number) {
		if(0>pix||pix>this.npix-1) throw {
			name:"Illegal argument",
			message:"ipix out of range"
		}
		let i,n,a,e=this.nest2xyf(pix),h=e.ix,r=e.iy,o=e.face_num,c=(HealpixIndex.JRLL[o]<<this.order)-h-r-1
		this.nside>c?(i=c,n=1-i*i*this.fact2,a=0):c>this.nl3?(i=this.nl4-c,n=i*i*this.fact2-1,a=0):(i=this.nside,n=(this.nl2-c)*this.fact1,a=1&c-this.nside)
		let u=Math.acos(n),p=(HealpixIndex.JPLL[o]*i+h-r+1+a)/2
		p>this.nl4&&(p-=this.nl4),1>p&&(p+=this.nl4)
		let l=(p-.5*(a+1))*(Constants.PIOVER2/i)
		return {
			theta:u,
			phi:l,
		}
	}

	static nside2Npix(s: number) {
		if(0>s||(s&-s)!=s||s>HealpixIndex.NS_MAX) throw {
			name:"Illegal argument",
			message:"nside should be >0, power of 2, <"+HealpixIndex.NS_MAX
		}
		return 12*s*s
	}

	xyf2ring(s: number,i: number,n: number) {
		let a,e,h,r=HealpixIndex.JRLL[n]*this.nside-s-i-1
		this.nside>r?(a=r,h=2*a*(a-1),e=0):r>3*this.nside?(a=this.nl4-r,h=this.npix-2*(a+1)*a,e=0):(a=this.nside,h=this.ncap+(r-this.nside)*this.nl4,e=1&r-this.nside)
		let o=(HealpixIndex.JPLL[n]*a+s-i+1+e)/2
		return o>this.nl4?o-=this.nl4:1>o&&(o+=this.nl4),h+o-1
	}

	nest2ring(nest: number) {
		let s=this.nest2xyf(nest)
		return this.xyf2ring(s.ix,s.iy,s.face_num)
	}

	corners_nest(nest: number, s: number) { return this.corners_ring(this.nest2ring(nest),s) }

	pix2ang_ring(pix: number) {
		let s,i,n,a,e,h,r,o,c
		if(0>pix||pix>this.npix-1) throw {
			name:"Illegal argument",
			message:"ipix out of range"
		}
		h=pix+1
		this.ncap>=h?(o=h/2,c=Utils.castToInt(o),n=Utils.castToInt(Math.sqrt(o-Math.sqrt(c)))+1,a=h-2*n*(n-1),s=Math.acos(1-n*n*this.fact2),i=(a-.5)*Constants.PI/(2*n)):this.npix-this.ncap>pix?(e=pix-this.ncap,n=e/this.nl4+this.nside,a=e%this.nl4+1,r=(1&n+this.nside)>0?1:.5,s=Math.acos((this.nl2-n)*this.fact1),i=(a-r)*Constants.PI/this.nl2):(e=this.npix-pix,n=Utils.castToInt(.5*(1+Math.sqrt(2*e-1))),a=4*n+1-(e-2*n*(n-1)),s=Math.acos(-1+Math.pow(n,2)*this.fact2),i=(a-.5)*Constants.PI/(2*n))
		return [s,i]
	}

	ring(t: number) {
		let s,i,n=0,a=t+1,e=0
		this.ncap>=a?(i=a/2,e=Utils.castToInt(i),n=Utils.castToInt(Math.sqrt(i-Math.sqrt(e)))+1):this.nl2*(5*this.nside+1)>=a?(s=Utils.castToInt(a-this.ncap-1),n=Utils.castToInt(s/this.nl4+this.nside)):(s=this.npix-a+1,i=s/2,e=Utils.castToInt(i),n=Utils.castToInt(Math.sqrt(i-Math.sqrt(e)))+1,n=this.nl4-n)
		return n
	}

	integration_limits_in_costh(t: number) {
		let s,i,n,a
		a=1*this.nside
		this.nside>=t?(i=1-Math.pow(t,2)/3/this.npface,n=1-Math.pow(t-1,2)/3/this.npface,s=t==this.nside?2*(this.nside-1)/3/a:1-Math.pow(t+1,2)/3/this.npface):this.nl3>t?(i=2*(2*this.nside-t)/3/a,n=2*(2*this.nside-t+1)/3/a,s=2*(2*this.nside-t-1)/3/a):(n=t==this.nl3?2*(-this.nside+1)/3/a:-1+Math.pow(4*this.nside-t+1,2)/3/this.npface,s=-1+Math.pow(this.nl4-t-1,2)/3/this.npface,i=-1+Math.pow(this.nl4-t,2)/3/this.npface)
		return [n,i,s]
	}

	pixel_boundaries(t: number, s: number, i: number, n: number) {
		let a,e,h,r,o,c,u,p,l=1*this.nside
		if(Math.abs(n)>=1-1/3/this.npface)
			return u=i*Constants.PIOVER2,p=(i+1)*Constants.PIOVER2,[u,p]
		if(1.5*n>=1)
			a=Math.sqrt(3*(1-n)),e=1/l/a,h=s,r=h-1,o=t-s,c=o+1,u=Constants.PIOVER2*(Math.max(r*e,1-c*e)+i),p=Constants.PIOVER2*(Math.min(1-o*e,h*e)+i)
		else if(1.5*n>-1) {
			let d=.5*(1-1.5*n),f=d+1,I=this.nside+t%2
			h=s-(I-t)/2,r=h-1,o=(I+t)/2-s,c=o+1,u=Constants.PIOVER2*(Math.max(f-c/l,-d+r/l)+i),p=Constants.PIOVER2*(Math.min(f-o/l,-d+h/l)+i)
		} else {
			a=Math.sqrt(3*(1+n)),e=1/l/a
			let M=2*this.nside
			h=t-M+s,r=h-1,o=M-s,c=o+1,u=Constants.PIOVER2*(Math.max(1-(M-r)*e,(M-c)*e)+i),p=Constants.PIOVER2*(Math.min(1-(M-h)*e,(M-o)*e)+i)
		}
		return[u,p]
	}

	static vector(theta: number,phi: number) {
		let i=1*Math.sin(theta)*Math.cos(phi)
		let n=1*Math.sin(theta)*Math.sin(phi)
		let a=1*Math.cos(theta)
		return new SpatialVector(i,n,a)
	}

	corners_ring(ring: number,i: number) {
		let n=2*i+2
		let a=Array(n)
		let e=this.pix2ang_ring(ring)
		let h=Math.cos(e[0])
		let r=e[0]
		let o=e[1]
		let c=Utils.castToInt(o/Constants.PIOVER2)
		let u=this.ring(ring)
		let p=Math.min(u,Math.min(this.nside,this.nl4-u))
		let l=0
		let d=Constants.PIOVER2/p
		l=u>=this.nside&&this.nl3>=u?Utils.castToInt(o/d+u%2/2)+1:Utils.castToInt(o/d)+1
		l-=c*p
		let f=n/2
		let I=this.integration_limits_in_costh(u)
		let M=Math.acos(I[0])
		let y=Math.acos(I[2])
		let g=this.pixel_boundaries(u,l,c,I[0])
		if(a[0]=l>p/2?HealpixIndex.vector(M,g[1]):HealpixIndex.vector(M,g[0]),g=this.pixel_boundaries(u,l,c,I[2]),a[f]=l>p/2?HealpixIndex.vector(y,g[1]):HealpixIndex.vector(y,g[0]),1==i) {
			let P=Math.acos(I[1])
			g=this.pixel_boundaries(u,l,c,I[1]),a[1]=HealpixIndex.vector(P,g[0]),a[3]=HealpixIndex.vector(P,g[1])
		}
		else for(let x=I[2]-I[0],C=x/(i+1),v=1;i>=v;v++)h=I[0]+C*v,r=Math.acos(h),g=this.pixel_boundaries(u,l,c,h),a[v]=HealpixIndex.vector(r,g[0]),a[n-v]=HealpixIndex.vector(r,g[1])
		return a
	}

	static vec2Ang(v: SpatialVector) {
		let s=v.z/v.length()
		let i=Math.acos(s)
		let n=0
		if (0!=v.x||0!=v.y) n=Math.atan2(v.y,v.x)
		0>n && (n+=2*Math.PI)
		return [i,n]
	}

	queryDisc(vec: SpatialVector, i: number, n: boolean, a: boolean) {
		if(0>i||i>Constants.PI) throw {
			name:"Illegal argument",
			message:"angular radius is in RADIAN and should be in [0,pi]"
		}
		let e,h,r,o,u,p,l,d,f,I,M,y,g,P,x,C,v,_,R=new LongRangeSetBuilder,T=null
		if(a&&(i+=Constants.PI/this.nl4),T=HealpixIndex.vec2Ang(vec),u=T[0],p=T[1],I=this.fact2,M=this.fact1,o=Math.cos(u),_=1/Math.sqrt((1-o)*(1+o)),g=u-i,P=u+i,l=Math.cos(i),C=Math.cos(g),e=this.ringAbove(C)+1,x=Math.cos(P),h=this.ringAbove(x),e>h&&0==h&&(h=e),0>=g)
		for(let m=1;e>m;++m) this.inRing(m,0,Math.PI,R)
		for(r=e;h>=r;++r) v=this.nside>r?1-r*r*I:this.nl3>=r?(this.nl2-r)*M:-1+(this.nl4-r)*(this.nl4-r)*I,d=(l-v*o)*_,f=1-v*v-d*d,y=Math.atan2(Math.sqrt(f),d),isNaN(y)&&(y=i),this.inRing(r,p,y,R)
		if(P>=Math.PI) for(let m=h+1;this.nl4>m;++m)this.inRing(m,0,Math.PI,R,!1)
		let b
		if(n){
			let U = []
			for(let S=R.items,A=0;S.length>A;A++){
				let O=this.ring2nest(S[A])
				U.indexOf(O)>=0||U.push(O)
			}
			b=U
		}
		else b=R.items
		return b
	}

	inRing(t: number, s: number, i: number, n: LongRangeSetBuilder, a: boolean = false) {
		let e,h,r,o
		let c=!1
		let u=!1
		let p=1e-12
		let l=0
		let d=0
		let f=0
		let I=0
		let M=(s-i)%Constants.TWOPI-p
		let y=s+i+p
		let g=(s+i)%Constants.TWOPI+p
		if (p>Math.abs(i-Constants.PI)&&(c=!0),t>=this.nside&&this.nl3>=t?(d=t-this.nside+1,r=this.ncap+this.nl4*(d-1),o=r+this.nl4-1,e=d%2,h=this.nl4):(this.nside>t?(d=t,r=2*d*(d-1),o=r+4*d-1):(d=4*this.nside-t,r=this.npix-2*d*(d+1),o=r+4*d-1),h=4*d,e=1),c)
			return n.appendRange(r,o),void 0
		if (l=e/2,a)
			f=Math.round(h*M/Constants.TWOPI-l),I=Math.round(h*y/Constants.TWOPI-l),f%=h,I>h&&(I%=h)
		else {
			if(f=Math.ceil(h*M/Constants.TWOPI-l),I=Utils.castToInt(h*g/Constants.TWOPI-l),f>I&&1==t&&(I=Utils.castToInt(h*y/Constants.TWOPI-l)),f==I+1&&(f=I),1==f-I&&Constants.PI>i*h)
				return console.log("the interval is too small and avay from center"),void 0
			f=Math.min(f,h-1),I=Math.max(I,0)
		}
		if(f>I&&(u=!0),u)
			f+=r,I+=r,n.appendRange(r,I),n.appendRange(f,o)
		else {
			if(0>f) return f=Math.abs(f),n.appendRange(r,r+I),n.appendRange(o-f+1,o),void 0
			f+=r,I+=r,n.appendRange(f,I)
		}
	}

	ringAbove(ring: number) {
		let s=Math.abs(ring)
		if(s>Constants.TWOTHIRD) {
			let i=Utils.castToInt(this.nside*Math.sqrt(3*(1-s)))
			return ring>0?i:4*this.nside-i-1
		}
		return Utils.castToInt(this.nside*(2-1.5*ring))
	}

	ring2nest(ring: number) {
		let xyf=this.ring2xyf(ring)
		return this.xyf2nest(xyf.ix,xyf.iy,xyf.face_num)
	}

	ring2xyf(ring: number): XYF {
		let i,n,a,e
		let face_num
		if(this.ncap>ring){
			i=Utils.castToInt(.5*(1+Math.sqrt(1+2*ring)))
			n=ring+1-2*i*(i-1)
			a=0
			e=i
			face_num=0
			let r=n-1
			if(r>=2*i) {
				face_num=2
				r-=2*i
			}
			if(r>=i) ++face_num
		} else if(this.npix-this.ncap>ring) {
			let o=ring-this.ncap
			this.order>=0?(i=(o>>this.order+2)+this.nside,n=(o&this.nl4-1)+1):(i=o/this.nl4+this.nside,n=o%this.nl4+1)
			a=1&i+this.nside
			e=this.nside
			let c
			let u
			let p=i-this.nside+1
			let l=this.nl2+2-p
			this.order>=0?(c=n-Utils.castToInt(p/2)+this.nside-1>>this.order,u=n-Utils.castToInt(l/2)+this.nside-1>>this.order):(c=(n-Utils.castToInt(p/2)+this.nside-1)/this.nside,u=(n-Utils.castToInt(l/2)+this.nside-1)/this.nside)
			face_num=u==c?4==u?4:Utils.castToInt(u)+4:c>u?Utils.castToInt(u):Utils.castToInt(c)+8
		} else {
			let o=this.npix-ring
			i=Utils.castToInt(.5*(1+Math.sqrt(2*o-1)))
			n=4*i+1-(o-2*i*(i-1))
			a=0
			e=i
			i=2*this.nl2-i
			face_num=8
			let r=n-1
			r>=2*e&&(face_num=10,r-=2*e)
			r>=e&&++face_num
		}
		let d=i-HealpixIndex.JRLL[face_num]*this.nside+1
		let f=2*n-HealpixIndex.JPLL[face_num]*e-a-1
		f>=this.nl2&&(f-=8*this.nside)
		let ix=f-d>>1
		let iy=-(f+d)>>1
		return {
			ix: ix,
			iy: iy,
			face_num: face_num
		}
	}
}

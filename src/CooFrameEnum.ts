
export class CooFrameEnumType {
	label: string
	system: string
	constructor(label: string, system: string) {
		this.label=label
		this.system=system
	}
}

enum systems {
	J2000 = 'J2000',
	GAL = 'Galactic'
}
export class CooFrameEnum {
	static SYSTEMS = systems
	static J2000 = new CooFrameEnumType('J2000', systems.J2000)
	static J2000d = new CooFrameEnumType('J2000d', systems.J2000)
	static GAL =    new CooFrameEnumType('Galactic', systems.GAL)
	static fromString(str: string|null|undefined, defaultValue: CooFrameEnumType|undefined = undefined) {
		if (!str) return defaultValue
		str = str.toLowerCase().replace(/^\s+|\s+$/g, ''); // convert to lowercase and trim
		     if (str.indexOf('j2000d')==0 || str.indexOf('icrsd')==0)return CooFrameEnum.J2000d;
		else if (str.indexOf('j2000' )==0 || str.indexOf('icrs')==0) return CooFrameEnum.J2000;
		else if (str.indexOf('gal')==0)                              return CooFrameEnum.GAL;
		else                                                         return defaultValue
	}
}

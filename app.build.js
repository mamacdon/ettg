({
	appDir: '../',				// source
	baseUrl: 'lib',
	dir: '../../ettg-built',	// destination
	paths: {
		ettg: '../ettg',
		requireLib: './require'
	},
	modules: [
		{	name: '../ettg/main',
			include: ['requireLib']
		}
	]
})
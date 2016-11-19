/*global require*/
require({
	baseUrl: 'lib',
	paths: {
		ettg: '../ettg'
	}
});

require(['ettg/ui', 'domReady!'], function(ui) {
	ui.init();
});

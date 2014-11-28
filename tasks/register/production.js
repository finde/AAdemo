module.exports = function (grunt) {
	grunt.registerTask('production', [
		'compileAssets',
		'concat',
		'uglify',
		'cssmin',
		'sails-linker:prodJs',
		'sails-linker:prodStyles',
		'sails-linker:devTpl',
	]);
};

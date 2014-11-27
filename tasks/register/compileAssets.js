module.exports = function (grunt) {
	grunt.registerTask('compileAssets', [
		'clean:dev',
    'bower_concat:dev',
		'copy:dev',
		'sass:dev'
	]);
};

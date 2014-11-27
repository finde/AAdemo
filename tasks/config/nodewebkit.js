module.exports = function (grunt) {

  grunt.config.set('nodewebkit', {
    options: {
      platforms: ['win', 'osx'],
      buildDir: './webkitbuilds', // Where the build version of my node-webkit app is saved
    },
    src: [
      './api/**/*',
      './assets/**/*',
      './config/**/*',
      './views/**/*',
      './node_modules/ejs/**/*',
      './node_modules/rc/**/*',
      './node_modules/sails/**/*',
      './node_modules/sails-disk/**/*',
      './package.json',
      './app.js',
      './splash.html',
    ] // Your node-webkit app
  });

  grunt.loadNpmTasks('grunt-node-webkit-builder');
};
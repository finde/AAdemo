module.exports = function (grunt) {

  grunt.config.set('nodewebkit', {
    options: {
      platforms: ['osx'],
      buildDir: './webkitbuilds', // Where the build version of my node-webkit app is saved
    },
    src: [
      './.tmp/**/*',
      './api/**/*',
//      './assets/**/*',
      './config/**/*',
      './views/**/*',
      './node_modules/ejs/**/*',
      './node_modules/rc/**/*',
      './node_modules/sails/**/*',
      '!./node_modules/sails/node_modules/.bin/**',
      '!./node_modules/sails/node_modules/grunt-cli/**',
      '!./node_modules/sails/node_modules/grunt-contrib-coffee/**',
      '!./node_modules/sails/node_modules/grunt-contrib-jst/**',
      '!./node_modules/sails/node_modules/grunt-contrib-less/**',
      './node_modules/sails-disk/**/*',
      './node_modules/async/**/*.js',
      './node_modules/numbers/**/*.js',
      './node_modules/shortid/**/*.js',
      './node_modules/performance-now/**/*.js',
      './package.json',
      './app.js',
      './splash.html',
    ] // Your node-webkit app
  });

  grunt.loadNpmTasks('grunt-node-webkit-builder');
};
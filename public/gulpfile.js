const { src, dest, watch } = require("gulp");
const sass                 = require('gulp-sass');
const connect              = require('gulp-connect');

function generateCSS(cb) {
  src('./stylesheets/sass/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(dest('stylesheets/css'));
  cb();
}

// function watchFiles(cb) {
//   watch('sass/**.scss', generateCSS);
// }

function connectServer(cb) {
  connect.server();
  watch('stylesheets/sass/**.scss', generateCSS);
}

exports.css = generateCSS;
// exports.watch = watchFiles;
exports.default = connectServer;
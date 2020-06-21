const { src, dest, watch } = require("gulp");
const sass                 = require('gulp-sass');
const connect              = require('gulp-connect');

function generateCSS(cb) {
  src('./sass/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(dest('stylesheets'));
  cb();
}

// function watchFiles(cb) {
//   watch('sass/**.scss', generateCSS);
// }

function connectServer(cb) {
  connect.server();

  watch('sass/**.scss', generateCSS).on('change', connect.reload);
  watch("templates/**.html").on('change', connect.reload);
}

// exports.css = generateCSS;
// exports.watch = watchFiles;
exports.default = connectServer;
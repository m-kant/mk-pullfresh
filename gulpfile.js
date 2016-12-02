/* dorado theme */
var gulp		= require('gulp');
var uglify		= require('gulp-uglify');
var rename		= require('gulp-rename');
var del			= require('del');
var newer		= require('gulp-newer');
var less		= require('gulp-less');
var cleanCSS	= require('gulp-clean-css');
var autoprefixer= require('gulp-autoprefixer');

gulp.task('clean', function(){ return del(['build/*']); });

gulp.task('styles', function() {
	return gulp.src('src/mk-pullfresh.less',{since:gulp.lastRun('styles')})
		.pipe(newer('build/mk-pullfresh.css'))
		.pipe(less())
		.pipe(autoprefixer())
		.pipe(gulp.dest('build'))
		.pipe(cleanCSS())
		.pipe(rename('mk-pullfresh.min.css'))
		.pipe(gulp.dest('build'));
});
gulp.task('js', function() {
	return gulp.src('src/mk-pullfresh.js',{since:gulp.lastRun('js')})
		.pipe(newer('build/mk-pullfresh.min.js'))
		.pipe(gulp.dest('build/'))
		.pipe(uglify())
		.pipe(rename('mk-pullfresh.min.js'))
		.pipe(gulp.dest('build/'));
});

gulp.task('build', gulp.parallel( 'styles', 'js' ));
gulp.task('clean_build', gulp.series('clean','build'));
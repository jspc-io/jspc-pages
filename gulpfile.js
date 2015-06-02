var gulp = require('gulp');

var aws = require('gulp-awspublish');
var bower = require('gulp-bower');
var cache = require('gulp-cache');
var concat = require('gulp-concat');
var data = require('gulp-data');
var declare = require('gulp-declare');
var del = require('del');
var filter = require('gulp-filter');
var gutil = require('gulp-util');
var handlebars = require('gulp-compile-handlebars');
var imagemin = require('gulp-imagemin');
var jshint = require('gulp-jshint');
var jsonlint = require('gulp-json-lint');
var minifyCss = require('gulp-minify-css');
var minifyHTML = require('gulp-minify-html');
var objectAssign = require('object-assign');
var path = require('path');
var rename = require('gulp-rename');
var rev = require('gulp-rev');
var revNapkin = require('gulp-rev-napkin');
var revReplace = require('gulp-rev-replace');
var sass = require('gulp-sass');
var scsslint = require('gulp-scss-lint');
var sequence = require('run-sequence');
var ttf2woff = require('gulp-ttf2woff');
var uglify = require('gulp-uglify');
var wrap = require('gulp-wrap');

var paths = {};

paths.src = {};
paths.src.root = './src';
paths.src.html = {};
paths.src.html.index    = path.join(paths.src.root, 'html/index.hbs');
paths.src.html.partials = path.join(paths.src.root, 'html/partials');
paths.src.html.data     = path.join(paths.src.root, 'html/data.json');
paths.src.js    = path.join(paths.src.root, 'js/*.js');
paths.src.css   = path.join(paths.src.root, 'sass/*.scss');
paths.src.img   = path.join(paths.src.root, 'img/*.png');
paths.src.fonts = path.join(paths.src.root, 'fonts/*');

paths.build = {};
paths.build.root  = './build';
paths.build.html  = 'index.html';
paths.build.js    = path.join(paths.build.root, 'js');
paths.build.css   = path.join(paths.build.root, 'css');
paths.build.img   = path.join(paths.build.root, 'img');
paths.build.fonts = path.join(paths.build.root, 'fonts');

paths.dist = {};
paths.dist.root = './dist';
paths.dist.js   = path.join(paths.dist.root, 'js');
paths.dist.css  = path.join(paths.dist.root, 'css');
paths.dist.img  = path.join(paths.dist.root, 'img');
paths.dist.fonts = path.join(paths.dist.root, 'fonts');

paths.bower = {};
paths.bower.root = './bower_components';
paths.bower.konami = {}
paths.bower.konami.js = path.join(paths.bower.root, 'konami.js/konami.js');
paths.bower.bootstrap = {};
paths.bower.bootstrap.css = path.join(paths.bower.root, 'bootstrap/dist/css/bootstrap.css');
paths.bower.bootstrap.js  = path.join(paths.bower.root, 'bootstrap/dist/js/bootstrap.js');

var assets = {
    development: {
        css: [
            path.basename(paths.bower.bootstrap.css),
            'garamond.css',
            'caslon.css',
            'main.css'
        ],
        js: [
            path.basename(paths.bower.konami.js),
            path.basename(paths.bower.bootstrap.js)
        ],
    },
    production: {
        css: [
            'all.css'
        ],
        js: [
            'all.js'
        ],
    }
};

var creds = {
    'key': process.env.AWS_ACCESS_KEY_ID,
    'secret': process.env.AWS_SECRET_ACCESS_KEY,
    'bucket': 'jspc-static-site'
};

var isDev = gutil.env.dev;

gulp.task('env', function() {
    if (isDev) {
        gutil.log(gutil.colors.cyan('Development Env'));
    } else {
        gutil.log(gutil.colors.magenta('Production Env'));
    }

});

gulp.task('bower', function() {
    return bower()
        .pipe(gulp.dest(paths.bower.root));
});

gulp.task('lint:sass', function() {
    return gulp.src(paths.src.css)
        .pipe(scsslint());
});

gulp.task('lint:js', function() {
    return gulp.src(paths.src.js)
        .pipe(jshint())
        .pipe(jshint.reporter('unix'));
});

gulp.task('lint:json', function() {
    return gulp.src(paths.src.html.data)
        .pipe(jsonlint())
        .pipe(jsonlint.report('verbose'));
});

gulp.task('compile:clean', function(callback) {
    if (isDev) {
        del([paths.build.root], callback);
    } else {
        del([paths.dist.root], callback);
    }
});

gulp.task('compile:sass', function() {
    return gulp.src([ paths.bower.bootstrap.css,
                      paths.src.css
                    ])
        .pipe(sass())
        .pipe(isDev ? gutil.noop() : concat('all.css'))
        .pipe(isDev ? gutil.noop() : minifyCss())
        .pipe(gulp.dest(isDev ? paths.build.css : paths.dist.css))
});

gulp.task('compile:js', function() {
    // We're writing plain old JS so this is a little simple
    return gulp.src([ paths.src.js,
                      paths.bower.konami.js,
                      paths.bower.bootstrap.js
                    ])
        .pipe(isDev ? gutil.noop() : concat('all.js'))
        .pipe(isDev ? gutil.noop() : uglify())
        .pipe(gulp.dest(isDev ? paths.build.js : paths.dist.js))
});

gulp.task('compile:img', function() {
    return gulp.src( paths.src.img )
        .pipe(cache(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
        .pipe(gulp.dest(isDev ? paths.build.img : paths.dist.img));
});

gulp.task('compile:fonts', function() {
    return gulp.src(paths.src.fonts)
        .pipe(ttf2woff())
        .pipe(gulp.dest(isDev ? paths.build.fonts : paths.dist.fonts));
});

gulp.task('compile:hbs', function() {
    var options = {
        ignorePartials: true,
        batch : [paths.src.html.partials]
    }

    var jsonData = require('./' + paths.src.html.data);
    var templateData = objectAssign( jsonData,
                                     {js: isDev ? assets.development.js : assets.production.js},
                                     {css: isDev ? assets.development.css : assets.production.css});

    return gulp.src(paths.src.html.index)
        .pipe(handlebars(templateData, options))
        .pipe(rename(paths.build.html))
        .pipe(isDev ? gutil.noop() : minifyHTML())
        .pipe(gulp.dest(isDev ? paths.build.root : paths.dist.root));
});

gulp.task('post:version', function() {
    return gulp.src(["dist/**/*.css", "dist/**/*.js", "dist/**/*.png"])
        .pipe(rev())
        .pipe(gulp.dest(paths.dist.root))
        .pipe(revNapkin())
        .pipe(rev.manifest())
        .pipe(gulp.dest(paths.dist.root))
});

gulp.task('post:replace', function() {
    var manifestFile = path.join(paths.dist.root, 'rev-manifest.json');
    var manifest = gulp.src(manifestFile);
    del(manifestFile);

    return gulp.src(path.join(paths.dist.root, "index.html"))
        .pipe(revReplace({manifest: manifest}))
        .pipe(gulp.dest(paths.dist.root))
});

var headers = function(filetype) {
    switch(filetype){
    case 'html':
        return {'Cache-Control': 'no-cache, must-revalidate, no-store'};
    default:
        return {'Cache-Control': 'max-age=86400, must-revalidate, no-transform, public'};
    };
};

var publisher = aws.create(creds);

gulp.task('deploy:html', function() {
    return gulp.src('dist/**/*.html')
        .pipe(aws.gzip())
        .pipe(publisher.publish(headers('html')))
        .pipe(aws.reporter())
});

gulp.task('deploy:assets', function() {
    return gulp.src(['dist/**', '!dist/**/*.html'])
        .pipe(aws.gzip())
        .pipe(publisher.publish(headers()))
        .pipe(aws.reporter())

});

gulp.task('deploy', function(callback) {
    if (! isDev) {
        sequence('deploy:assets', 'deploy:html');
    }
});

gulp.task('post', function(callback) {
    if (! isDev) {
        sequence('post:version', 'post:replace', callback);
    }
});

gulp.task('compile', function(callback) {
    sequence('compile:clean', ['compile:sass', 'compile:img', 'compile:js', 'compile:hbs', 'compile:fonts'], callback);
});

gulp.task('lint', ['lint:sass', 'lint:js', 'lint:json']);

gulp.task('default', function(callback) {
    sequence('env', 'lint', 'bower', 'compile', 'post', 'deploy', callback);
});

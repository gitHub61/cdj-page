// TODO: Implement module
module.exports = (name, options) => {
  if (typeof name !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof name}`)
  }

  options = Object.assign({}, options)

  return `${name}@${options.host || 'zce.me'}`
}
const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')

const loadPlugins = require('gulp-load-plugins')

const plugins = loadPlugins()
const bs = browserSync.create()

const data = {
  menus: [
    {
      name: 'Home',
      icon: 'aperture',
      link: 'index.html'
    },
    {
      name: 'Features',
      link: 'features.html'
    },
    {
      name: 'About',
      link: 'about.html'
    },
    {
      name: 'Contact',
      link: '#',
      children: [
        {
          name: 'Twitter',
          link: 'https://twitter.com/w_zce'
        },
        {
          name: 'About',
          link: 'https://weibo.com/zceme'
        },
        {
          name: 'divider'
        },
        {
          name: 'About',
          link: 'https://github.com/zce'
        }
      ]
    }
  ],
  pkg: require('./package.json'),
  date: new Date()
}
const clean = () => {
  return del(['dist', 'temp']) // 指定路径
}

const style = () => {
  return src('src/assets/styles/*.scss', { base: 'src' })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true })) // 监视更新推送至浏览器
}

const script = () => {
  return src('src/assets/scripts/*.js', { base: 'src' })
    .pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}

const page = () => {
  return src('src/*.html', { base: 'src' })
    .pipe(plugins.swig({ data }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}

const image = () => {
  return src('src/assets/images/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const font = () => {
  return src('src/assets/fonts/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const extra = () => {
  return src('public/**', { base: 'public' })
    .pipe(dest('dist'))
}

const serve = () => {
  watch('src/assets/styles/*.scss', style)
  watch('src/assets/scripts/*.js', script)
  watch('src/*.html', page)
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  watch([
    'src/assets/images/**',
    'src/assets/fonts/**',
    'public/**'
  ], bs.reload) // 监视同类型不常修改文件  自动调用bs.reload方法

  bs.init({ // 初始化配置
    notify: false, // 关闭网页右上角browserSync连接成功提示
    // port:2080, //设置端口
    // open:false, // 关闭自动打开浏览器功能
    // files:'dist/**', // 指定字符串->browseSync启动后监听的通配符,这里指定导出后的路径，在构建任务监视，这里不使用了
    server: {
      // baseDir:'dist',// 网站根目录
      baseDir: ['temp', 'src', 'public'], // 优化 dist路径下找不到会自动查找src层层往下找到为止
      routes: { // 添加路由 对于/开头的目录指定路径
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src('temp/*.html', { base: 'dist' })
    .pipe(plugins.useref({ searchPath: ['dist', '.'] }))
    // html js css 压缩
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true, //  指定压缩空白换行字符 不指定默认压缩注释
      minifyCSS: true, // 指定压缩页面中style内脚本
      minifyJS: true // 指定压缩面中script内脚本
    })))
    .pipe(dest('dist'))
}

const compile = parallel(style, script, page)

// 上线之前执行的任务
const build = series(
  clean,
  parallel(
    series(compile, useref),
    image,
    font,
    extra
  )
)

const delevop = series(compile, serve)

module.exports = {
  clean,
  build,
  delevop
}

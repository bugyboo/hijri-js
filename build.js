const fs = require('fs');
const path = require('path');
const uglify = require('uglify-js');
const rollup = require('rollup');
const buble = require('rollup-plugin-buble');

const version = require('./package.json').version;
const banner =
`/*!
 * hijri-js v${version}
 * (c) ${new Date().getFullYear()} Yasser Harbi
 * @license MIT
 */`;

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

const resolve = _path => path.resolve(__dirname, _path);

const entry = resolve('src/index.js');

build([
  {
    dest: resolve('dist/hijri-js.js'),
    format: 'umd',
  },
  {
    dest: resolve('dist/hijri-js.min.js'),
    format: 'umd',
  },
  {
    dest: resolve('dist/hijri-js.common.js'),
    format: 'cjs'
  },
  {
    dest: resolve('dist/hijri-js.esm.js'),
    format: 'es'
  }
]);

function build(builds) {
  let built = 0;
  const total = builds.length;
  const next = () => {
    buildEntry(builds[built]).then(() => {
      built++;
      if (built < total) {
        next();
      }
    }).catch((e) => console.log(e));
  }

  next();
}

function buildEntry(opts) {
  const isProd = /min\.js$/.test(opts.dest);
  return rollup
    .rollup({
      input: entry,
      sourcemap: JSON.debug,
      plugins: [buble()],
    })
    .then(bundle => bundle.generate({
      file: opts.dest,
      format: opts.format,
      name: 'HijriJs',
      banner,
    }))
    .then(({code}) => {
      if (isProd) {
        code = (banner ? banner + '\n' : '') + uglify.minify(code, {
          output: {
            ascii_only: true
          },
          compress: {
            pure_funcs: ['makeMap']
          }
        }).code;
      }
      return write(opts.dest, code);
    })
}

function write(dest, code) {
  return new Promise((resolve, reject) => {
    fs.writeFile(dest, code, err => {
      if (err) {
        return reject(err);
      }

      console.log(path.relative(process.cwd(), dest));
      resolve();
    });
  });
}

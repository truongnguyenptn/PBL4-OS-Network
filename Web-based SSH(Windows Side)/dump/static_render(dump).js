// // Load static files into memory
// var staticFiles = {};
// var basePath = path.join(require.resolve('xterm'), '..').replace("\\lib",'');
// [ 
//   //'addons/fit/fit.js',
//   'css/xterm.css',
//   'lib/xterm.js'
// ].forEach(function(f) {
//   staticFiles['/' + f] = fs.readFileSync(path.join(basePath, f));
// });

// var fitAddonPath = path.join(require.resolve('xterm-addon-fit'), '..');

// staticFiles['/lib/xterm-addon-fit.js'] = fs.readFileSync(path.join(fitAddonPath, 'xterm-addon-fit.js'));

// // var fitAddonPath = path.join(require.resolve('xterm-addon-fit'), '..').replace("\\lib",'');

// // staticFiles['/lib/FitAddon.ts'] = fs.readFileSync(path.join(fitAddonPath, '\\src\\FitAddon.ts'));

// staticFiles['/'] = fs.readFileSync('index.html');

// // Handle static file serving
// function onRequest(req, res) {
//   var file;
//   if (req.method === 'GET' && (file = staticFiles[req.url])) {
//     res.writeHead(200, {
//       'Content-Type': 'text/'
//                       + (/css$/.test(req.url)
//                          ? 'css'
//                          : (/js$/.test(req.url) ? 'javascript' : 'html'))
//     });
//     return res.end(file);
//   }
//   res.writeHead(404);
//   res.end();
// }
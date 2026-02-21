import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'path';
import fs from 'fs';

const cyberchefDir = path.resolve(__dirname, '../CyberChef');
const ccNodeModules = path.resolve(cyberchefDir, 'node_modules');

/**
 * Stub out CyberChef's non-JS asset imports (.fnt font files)
 * and patch modules that use unsupported JS features
 */
function cyberchefPatches(): Plugin {
  return {
    name: 'cyberchef-patches',
    enforce: 'pre',
    resolveId(source) {
      if (source === 'chi-squared') {
        return '\0chi-squared-esm';
      }
      return null;
    },
    load(id) {
      if (id.includes('/web/static/') && id.endsWith('.fnt')) {
        return 'export default ""';
      }
      // Provide a self-contained ESM version of chi-squared + gamma
      if (id === '\0chi-squared-esm') {
        return `
// -- gamma (inlined) --
var g = 7;
var p = [0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
var g_ln = 607/128;
var p_ln = [0.99999999999999709182,57.156235665862923517,-59.597960355475491248,14.136097974741747174,-0.49191381609762019978,0.33994649984811888699e-4,0.46523628927048575665e-4,-0.98374475304879564677e-4,0.15808870322491248884e-3,-0.21026444172410488319e-3,0.21743961811521264320e-3,-0.16431810653676389022e-3,0.84418223983852743293e-4,-0.26190838401581408670e-4,0.36899182659531622704e-5];
function lngamma(z){if(z<0)return NaN;var x=p_ln[0];for(var i=p_ln.length-1;i>0;--i)x+=p_ln[i]/(z+i);var t=z+g_ln+0.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x)-Math.log(z)}
function gamma(z){if(z<0.5)return Math.PI/(Math.sin(Math.PI*z)*gamma(1-z));else if(z>100)return Math.exp(lngamma(z));else{z-=1;var x=p[0];for(var i=1;i<g+2;i++)x+=p[i]/(z+i);var t=z+g+0.5;return Math.sqrt(2*Math.PI)*Math.pow(t,z+0.5)*Math.exp(-t)*x}}
// -- chi-squared cdf (inlined, with(Math) expanded) --
function Gcf(X,A){var A0=0,B0=1,A1=1,B1=X,AOLD=0,N=0;while(Math.abs((A1-AOLD)/A1)>.00001){AOLD=A1;N=N+1;A0=A1+(N-A)*A0;B0=B1+(N-A)*B0;A1=X*A0+N*A1;B1=X*B0+N*B1;A0=A0/B1;B0=B0/B1;A1=A1/B1;B1=1}var Prob=Math.exp(A*Math.log(X)-X-lngamma(A))*A1;return 1-Prob}
function Gser(X,A){var T9=1/A,G=T9,I=1;while(T9>G*.00001){T9=T9*X/(A+I);G=G+T9;I=I+1}G=G*Math.exp(A*Math.log(X)-X-lngamma(A));return G}
function Gammacdf(x,a){if(x<=0)return 0;else if(x<a+1)return Gser(x,a);else return Gcf(x,a)}
function cdf(Z,DF){if(DF<=0)throw new Error("Degrees of freedom must be positive");return Gammacdf(Z/2,DF/2)}
// -- chi-squared pdf --
function pdf(x,k_){if(x<0)return 0;var k=k_/2;return 1/(Math.pow(2,k)*gamma(k))*Math.pow(x,k-1)*Math.exp(-x/2)}
var chiSquared = {pdf:pdf, cdf:cdf};
export default chiSquared;
export { pdf, cdf };
`;
      }
      return null;
    },
    transform(code, id) {
      // chi-squared/cdf.js uses `with(Math)` which Rollup's native parser can't handle
      if (id.includes('chi-squared') && /cdf\.js(\?.*)?$/.test(id)) {
        return code
          .replace(/with \(Math\) \{/g, '{')
          .replace(/\babs\(/g, 'Math.abs(')
          .replace(/\bexp\(/g, 'Math.exp(')
          .replace(/\blog\(/g, 'Math.log(');
      }
      // zlibjs IIFE modules register on global `this` via `.call(this)` — wrap them
      // to export the Zlib namespace as default export
      if (id.includes('zlibjs/bin/') && /\.min\.js(\?.*)?$/.test(id)) {
        return `var self = {};\n${code.replace(/\}\)\.call\(this\);?\s*$/, '}).call(self);')}\nexport default self;`;
      }
      // node-md6 uses an implicit global `_hash = function()` which fails
      // in strict mode (ES modules). Add `var` declaration.
      if (id.includes('node-md6') && /md6\.js(\?.*)?$/.test(id)) {
        return code.replace(/^(\s*)_hash = function/m, '$1var _hash = function');
      }
      // GOST vendor modules illegally reassign import bindings —
      // convert to mutable variable declarations
      if (id.includes('vendor/gost/') && /\.mjs(\?.*)?$/.test(id)) {
        let patched = code;
        const bindings: string[] = [];
        for (const name of ['GostRandom', 'GostCipher', 'GostDigest', 'GostSign']) {
          const re = new RegExp(`import\\s+${name}\\s+from\\s+`);
          if (re.test(patched)) {
            patched = patched.replace(re, `import _imp_${name} from `);
            bindings.push(`var ${name} = _imp_${name};`);
          }
        }
        if (bindings.length > 0) {
          // Insert mutable bindings after the last import statement
          const lines = patched.split('\n');
          let lastImport = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trimStart().startsWith('import ')) lastImport = i;
          }
          lines.splice(lastImport + 1, 0, ...bindings);
          return lines.join('\n');
        }
      }
      return null;
    },
  };
}

// Buffer/process globals are injected via src/polyfills.ts (imported in main.tsx)

export default defineConfig({
  plugins: [
    cyberchefPatches(),
    react(),
    wasm(),
    topLevelAwait(),
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      allow: [
        // Allow CyberChef source and its node_modules (zlibjs etc.)
        path.resolve(__dirname, '..'),
      ],
    },
  },
  define: {
    'global': 'globalThis',
    '__dirname': '""',
    '__filename': '""',
  },
  resolve: {
    alias: {
      '@cyberchef': path.resolve(cyberchefDir, 'src/core'),
      '@': path.resolve(__dirname, 'src'),
      // Node.js polyfills — point to CyberChef's existing browser shims
      'buffer': path.resolve(ccNodeModules, 'buffer'),
      'process': path.resolve(ccNodeModules, 'process'),
      'stream': path.resolve(ccNodeModules, 'stream-browserify'),
      'crypto': path.resolve(ccNodeModules, 'crypto-browserify'),
      'path': path.resolve(ccNodeModules, 'path'),
      'zlib': path.resolve(ccNodeModules, 'browserify-zlib'),
      'util': path.resolve(ccNodeModules, 'util'),
      'assert': path.resolve(ccNodeModules, 'assert'),
      'events': path.resolve(ccNodeModules, 'events'),
      'https': path.resolve(ccNodeModules, 'https-browserify'),
    },
  },
  assetsInclude: ['**/*.fnt'],
  optimizeDeps: {
    include: ['react', 'react-dom', '@xyflow/react', 'zustand', 'fuse.js', 'nanoid', 'dagre', 'dompurify',
      'qr-image', 'jsqr'],
    exclude: ['@cyberchef', 'chi-squared', 'argon2-browser', 'zlibjs'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
        __dirname: '""',
        __filename: '""',
      },
      plugins: [
        {
          name: 'patch-gost',
          setup(build) {
            build.onLoad({ filter: /vendor\/gost\/.*\.mjs$/ }, (args) => {
              let code = fs.readFileSync(args.path, 'utf8');
              const bindings: string[] = [];
              for (const name of ['GostRandom', 'GostCipher', 'GostDigest', 'GostSign']) {
                const re = new RegExp(`import\\s+${name}\\s+from\\s+`);
                if (re.test(code)) {
                  code = code.replace(re, `import _imp_${name} from `);
                  bindings.push(`var ${name} = _imp_${name};`);
                }
              }
              if (bindings.length > 0) {
                const lines = code.split('\n');
                let lastImport = 0;
                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].trimStart().startsWith('import ')) lastImport = i;
                }
                lines.splice(lastImport + 1, 0, ...bindings);
                return { contents: lines.join('\n'), loader: 'js' };
              }
              return null;
            });
          },
        },
      ],
    },
  },
  worker: {
    format: 'es',
    plugins: () => [cyberchefPatches(), wasm(), topLevelAwait()],
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
      defaultIsModuleExports: 'auto',
      esmExternals: true,
      strictRequires: false,
    },
    rollupOptions: {
      external: [/\.wasm$/],
      onwarn(warning, defaultHandler) {
        if (
          warning.message?.includes('has been externalized') ||
          warning.message?.includes('circular dependency') ||
          warning.message?.includes('Use of eval') ||
          warning.message?.includes('.wasm')
        ) {
          return;
        }
        defaultHandler(warning);
      },
    },
  },
});

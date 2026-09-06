try {
  const vite = require('vite');
  console.log('vite loaded ok');
} catch(e) {
  console.log('vite FAIL:', e.message);
}
try {
  const ve = require('vite-plugin-electron');
  console.log('vite-plugin-electron loaded ok');
} catch(e) {
  console.log('vite-plugin-electron FAIL:', e.message);
}
try {
  const vr = require('vite-plugin-electron-renderer');
  console.log('vite-plugin-electron-renderer loaded ok');
} catch(e) {
  console.log('vite-plugin-electron-renderer FAIL:', e.message);
}
try {
  const tw = require('@tailwindcss/vite');
  console.log('@tailwindcss/vite loaded ok');
} catch(e) {
  console.log('@tailwindcss/vite FAIL:', e.message);
}

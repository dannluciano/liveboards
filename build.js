const {generateSW} = require('workbox-build')

generateSW({
  globDirectory: "public/",
  globPatterns: [
    "**/*.{css,ico,png,html,json,js}"
  ],
  swDest: "public/sw.js"
});
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Poor-man's HTML includes: replaces <!--#include partials/x.html--> with
// the referenced file's contents, at both dev-serve and build time, so the
// shared header/footer only need to be edited in one place.
function htmlIncludes() {
  const includeRe = /<!--\s*#include\s+(partials\/[\w-]+\.html)\s*-->/g
  const transform = (html) =>
    html.replace(includeRe, (_, path) => readFileSync(resolve(__dirname, path), 'utf-8'))
  return {
    name: 'html-includes',
    transformIndexHtml: transform,
  }
}

export default defineConfig({
  plugins: [tailwindcss(), htmlIncludes()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        project: resolve(__dirname, 'project-barcelona.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        shop: resolve(__dirname, 'shop.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        blog: resolve(__dirname, 'blog.html'),
        blogColorTheory: resolve(__dirname, 'blog-color-theory.html'),
        blogBlankWall: resolve(__dirname, 'blog-blank-wall.html'),
        blogBranding: resolve(__dirname, 'blog-branding.html'),
      },
    },
  },
})

import fs from 'fs'
import path from 'path'

const dist = path.join(process.cwd(), 'dist')
const portal = path.join(process.cwd(), 'public', 'portal')
const contentDir = path.join(process.cwd(), 'content', 'orphanages')

async function ensureDir(p){ await fs.promises.mkdir(p, { recursive: true }) }
async function copyFile(src, dst){ await ensureDir(path.dirname(dst)); await fs.promises.copyFile(src, dst) }

async function build(){
  await ensureDir(dist)
  // copy portal static files
  const files = ['index.html','panti.html','styles.css','app.js']
  for(const f of files){
    await copyFile(path.join(portal,f), path.join(dist,'portal',f))
  }

  // build content index and copy content
  const items = []
  if (fs.existsSync(contentDir)){
    const files = (await fs.promises.readdir(contentDir)).filter(f=>f.endsWith('.json'))
    for(const f of files){
      const src = path.join(contentDir, f)
      const raw = await fs.promises.readFile(src, 'utf8')
      const obj = JSON.parse(raw)
      items.push({ slug: obj.slug, name: obj.name, city: obj.city, province: obj.province, description: obj.description })
      await copyFile(src, path.join(dist,'content','orphanages',f))
    }
  }
  await fs.promises.writeFile(path.join(dist,'content-index.json'), JSON.stringify({ orphanages: items }, null, 2))

  // .nojekyll safeguard
  await fs.promises.writeFile(path.join(dist,'.nojekyll'), '')

  console.log(`Portal built: ${items.length} orphanage entries.`)
}

build().catch(e=>{ console.error(e); process.exitCode = 1 })

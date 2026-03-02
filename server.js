const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public/uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g,'-'))
});
const upload = multer({ storage });

const DATA = path.join(__dirname, 'data');
const readJSON = f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const writeJSON = (f, d) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(d, null, 2));

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

function tagColor(tag) {
  const palette=['#7C3AED','#DB2777','#059669','#D97706','#2563EB','#DC2626','#0891B2','#65A30D','#9333EA','#EA580C','#0284C7','#C026D3','#16A34A','#CA8A04','#E11D48'];
  let hash=0;
  for(let i=0;i<tag.length;i++) hash=tag.charCodeAt(i)+((hash<<5)-hash);
  return palette[Math.abs(hash)%palette.length];
}

app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use((req,res,next)=>{
  res.locals.settings = readJSON('settings.json');
  res.locals.tagColor = tagColor;
  res.locals.allTags = readJSON('tags.json');
  res.locals.categories = ['Radio','Podcast','Project','Mix'];
  res.locals.slugify = slugify;
  next();
});

// PUBLIC ROUTES
app.get('/',(req,res)=>{
  const posts = readJSON('posts.json').sort((a,b)=>new Date(b.publishedDate)-new Date(a.publishedDate));
  const settings = readJSON('settings.json');
  const contributors = readJSON('contributors.json');
  res.render('index',{featured:posts.slice(0,5), listed:posts.slice(0,settings.maxPostsOnHome||20), contributors});
});

app.get('/post/:slug',(req,res)=>{
  const posts = readJSON('posts.json');
  const post = posts.find(p=>p.slug===req.params.slug);
  if(!post) return res.status(404).render('404',{message:'Show not found'});
  const contributor = readJSON('contributors.json').find(c=>c.id===post.contributorId);
  res.render('post',{post,contributor});
});

app.get('/category/:slug',(req,res)=>{
  const cat = req.params.slug;
  const label = res.locals.categories.find(c=>slugify(c)===cat)||cat;
  const posts = readJSON('posts.json').filter(p=>p.category&&slugify(p.category)===cat).sort((a,b)=>new Date(b.publishedDate)-new Date(a.publishedDate));
  const contributors = readJSON('contributors.json');
  res.render('archive',{posts,heading:'Category: '+label,contributors});
});

app.get('/tag/:slug',(req,res)=>{
  const tag = req.params.slug;
  const posts = readJSON('posts.json').filter(p=>p.tags&&p.tags.map(t=>slugify(t)).includes(tag)).sort((a,b)=>new Date(b.publishedDate)-new Date(a.publishedDate));
  const tagLabel = readJSON('tags.json').find(t=>slugify(t)===tag)||tag;
  const contributors = readJSON('contributors.json');
  res.render('archive',{posts,heading:'Tag: '+tagLabel,contributors});
});

app.get('/contributor/:slug',(req,res)=>{
  const contributors = readJSON('contributors.json');
  const contributor = contributors.find(c=>c.slug===req.params.slug);
  if(!contributor) return res.status(404).render('404',{message:'Contributor not found'});
  const posts = readJSON('posts.json').filter(p=>p.contributorId===contributor.id).sort((a,b)=>new Date(b.publishedDate)-new Date(a.publishedDate));
  res.render('contributor',{contributor,posts,contributors});
});

app.get('/contributors',(req,res)=>{
  res.render('contributors',{contributors:readJSON('contributors.json')});
});

app.get('/about',(req,res)=>{ res.render('about',{page:readJSON('pages.json').about}); });
app.get('/contact',(req,res)=>{ res.render('contact',{page:readJSON('pages.json').contact}); });

// ADMIN
app.get('/admin',(req,res)=>{
  res.render('admin/dashboard',{posts:readJSON('posts.json').sort((a,b)=>new Date(b.publishedDate)-new Date(a.publishedDate)),contributors:readJSON('contributors.json')});
});

app.get('/admin/posts/new',(req,res)=>{ res.render('admin/post-form',{post:null,contributors:readJSON('contributors.json')}); });

app.post('/admin/posts/new', upload.single('image'),(req,res)=>{
  const posts = readJSON('posts.json');
  const {title,contributorId,category,tags,showLength,publishedDate,description,playlist,audioUrl,imageUrl}=req.body;
  const tagList = tags?(Array.isArray(tags)?tags:tags.split(',').map(t=>t.trim()).filter(Boolean)):[];
  const allTags=readJSON('tags.json');
  tagList.forEach(t=>{ if(!allTags.includes(t)) allTags.push(t); });
  writeJSON('tags.json',allTags);
  posts.push({
    id:uuidv4(), title,
    slug:slugify(title)+'-'+Date.now(),
    contributorId, category, tags:tagList, showLength,
    publishedDate:publishedDate||new Date().toISOString().split('T')[0],
    description, playlist, audioUrl,
    image:req.file?'/uploads/'+req.file.filename:(imageUrl||'')
  });
  writeJSON('posts.json',posts);
  res.redirect('/admin');
});

app.get('/admin/posts/:id/edit',(req,res)=>{
  const post=readJSON('posts.json').find(p=>p.id===req.params.id);
  if(!post) return res.redirect('/admin');
  res.render('admin/post-form',{post,contributors:readJSON('contributors.json')});
});

app.post('/admin/posts/:id/edit', upload.single('image'),(req,res)=>{
  const posts=readJSON('posts.json');
  const idx=posts.findIndex(p=>p.id===req.params.id);
  if(idx===-1) return res.redirect('/admin');
  const {title,contributorId,category,tags,showLength,publishedDate,description,playlist,audioUrl,imageUrl}=req.body;
  const tagList=tags?(Array.isArray(tags)?tags:tags.split(',').map(t=>t.trim()).filter(Boolean)):[];
  const allTags=readJSON('tags.json');
  tagList.forEach(t=>{ if(!allTags.includes(t)) allTags.push(t); });
  writeJSON('tags.json',allTags);
  posts[idx]={...posts[idx],title,contributorId,category,tags:tagList,showLength,publishedDate,description,playlist,audioUrl,image:req.file?'/uploads/'+req.file.filename:(imageUrl||posts[idx].image||'')};
  writeJSON('posts.json',posts);
  res.redirect('/admin');
});

app.post('/admin/posts/:id/delete',(req,res)=>{
  writeJSON('posts.json',readJSON('posts.json').filter(p=>p.id!==req.params.id));
  res.redirect('/admin');
});

app.get('/admin/contributors/new',(req,res)=>res.render('admin/contributor-form',{contributor:null}));

app.post('/admin/contributors/new', upload.single('image'),(req,res)=>{
  const contributors=readJSON('contributors.json');
  const {name,bio,imageUrl}=req.body;
  contributors.push({id:uuidv4(),name,slug:slugify(name),bio,image:req.file?'/uploads/'+req.file.filename:(imageUrl||'')});
  writeJSON('contributors.json',contributors);
  res.redirect('/admin');
});

app.get('/admin/contributors/:id/edit',(req,res)=>{
  const contributor=readJSON('contributors.json').find(c=>c.id===req.params.id);
  if(!contributor) return res.redirect('/admin');
  res.render('admin/contributor-form',{contributor});
});

app.post('/admin/contributors/:id/edit', upload.single('image'),(req,res)=>{
  const contributors=readJSON('contributors.json');
  const idx=contributors.findIndex(c=>c.id===req.params.id);
  if(idx===-1) return res.redirect('/admin');
  const {name,bio,imageUrl}=req.body;
  contributors[idx]={...contributors[idx],name,slug:slugify(name),bio,image:req.file?'/uploads/'+req.file.filename:(imageUrl||contributors[idx].image||'')};
  writeJSON('contributors.json',contributors);
  res.redirect('/admin');
});

app.post('/admin/contributors/:id/delete',(req,res)=>{
  writeJSON('contributors.json',readJSON('contributors.json').filter(c=>c.id!==req.params.id));
  res.redirect('/admin');
});

app.get('/admin/pages',(req,res)=>res.render('admin/pages',{pages:readJSON('pages.json')}));

app.post('/admin/pages/about',(req,res)=>{
  const pages=readJSON('pages.json');
  pages.about={title:req.body.title,content:req.body.content};
  writeJSON('pages.json',pages);
  res.redirect('/admin/pages');
});

app.post('/admin/pages/contact',(req,res)=>{
  const pages=readJSON('pages.json');
  pages.contact={title:req.body.title,content:req.body.content,email:req.body.email,address:req.body.address};
  writeJSON('pages.json',pages);
  res.redirect('/admin/pages');
});

app.get('/admin/settings',(req,res)=>res.render('admin/settings',{settings:readJSON('settings.json')}));

app.post('/admin/settings',(req,res)=>{
  writeJSON('settings.json',{siteName:req.body.siteName,siteTagline:req.body.siteTagline,maxPostsOnHome:parseInt(req.body.maxPostsOnHome)||20,logoText:req.body.logoText});
  res.redirect('/admin/settings');
});

app.use((req,res)=>res.status(404).render('404',{message:'Page not found'}));

app.listen(PORT,()=>{
  console.log('Sounds Of: http://localhost:'+PORT);
  console.log('Admin:     http://localhost:'+PORT+'/admin');
});

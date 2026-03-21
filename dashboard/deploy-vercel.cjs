// deploy-vercel.js — Upload pre-built dist/ to Vercel, bypassing remote build
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const authPath = path.join(process.env.APPDATA, 'com.vercel.cli', 'Data', 'auth.json');
const token = JSON.parse(fs.readFileSync(authPath, 'utf8')).token;

const distDir = path.join(__dirname, 'dist');

function getAllFiles(dir, base = '') {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(path.join(dir, entry.name), rel));
    } else {
      results.push({ rel, abs: path.join(dir, entry.name) });
    }
  }
  return results;
}

function sha1(buf) {
  return crypto.createHash('sha1').update(buf).digest('hex');
}

function apiRequest(method, urlPath, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.vercel.com${urlPath}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function uploadFile(buf, sha) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: '/v2/files',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': buf.length,
        'x-vercel-digest': sha,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

async function main() {
  const files = getAllFiles(distDir);
  console.log(`Found ${files.length} files in dist/`);
  
  // Build file list with SHA1 hashes
  const fileEntries = [];
  for (const f of files) {
    const buf = fs.readFileSync(f.abs);
    const sha = sha1(buf);
    fileEntries.push({ file: `/${f.rel}`, sha, size: buf.length, buf });
    console.log(`  ${f.rel} (${buf.length} bytes, sha1: ${sha.substring(0, 8)}...)`);
  }
  
  // Upload each file
  console.log('\nUploading files...');
  for (const entry of fileEntries) {
    await uploadFile(entry.buf, entry.sha);
    process.stdout.write('.');
  }
  console.log(' done!');
  
  // Create deployment
  console.log('\nCreating deployment...');
  const deployBody = {
    name: 'dashboard',
    project: 'dashboard',
    target: 'production',
    files: fileEntries.map(e => ({
      file: e.file,
      sha: e.sha,
      size: e.size,
    })),
    projectSettings: {
      framework: null,
      buildCommand: '',
      installCommand: '',
      outputDirectory: '',
    },
    routes: [
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/index.html' },
    ],
  };
  
  const result = await apiRequest('POST', '/v13/deployments?forceNew=1', deployBody);
  
  if (result.error) {
    console.error('Deployment error:', JSON.stringify(result.error, null, 2));
    process.exit(1);
  }
  
  console.log(`Deployment created!`);
  console.log(`  ID: ${result.id}`);
  console.log(`  URL: ${result.url}`);
  console.log(`  State: ${result.readyState}`);
  
  // Poll for ready state
  console.log('\nWaiting for deployment to be ready...');
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const status = await apiRequest('GET', `/v13/deployments/${result.id}`);
    process.stdout.write(`  ${status.readyState} `);
    if (status.readyState === 'READY') {
      console.log('\n\nDeployment is READY!');
      console.log(`Production URL: https://${result.url}`);
      return;
    }
    if (status.readyState === 'ERROR') {
      console.error('\n\nDeployment FAILED');
      process.exit(1);
    }
  }
  console.log('\nTimeout waiting for deployment');
}

main().catch(err => { console.error(err); process.exit(1); });

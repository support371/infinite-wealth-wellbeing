import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const patterns = [
  /sb_secret_[A-Za-z0-9_-]{20,}/g,
  /service_role["'\s:=]+eyJ[A-Za-z0-9._-]+/gi,
  /sk_(?:live|test)_[A-Za-z0-9]{20,}/g,
  /(?:ghp|github_pat)_[A-Za-z0-9_]{20,}/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g
];
const findings=[];
for(const file of files){if(/(?:package-lock\.json|\.(?:png|jpg|jpeg|gif|woff2?|zip))$/i.test(file))continue;let text='';try{text=readFileSync(file,'utf8');}catch{continue;}for(const pattern of patterns){if(pattern.test(text))findings.push(`${file}: ${pattern.source}`);pattern.lastIndex=0;}}
if(findings.length){console.error(`Potential secrets found:\n${findings.join('\n')}`);process.exit(1);}console.log(`Secret scan passed (${files.length} tracked files checked).`);

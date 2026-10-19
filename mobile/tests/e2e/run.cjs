const {spawnSync}=require('child_process');
const path=require('path');
for(const script of ['auth','dashboard','routes','flows','audit-regressions']) {
  const result=spawnSync(process.execPath,[path.join(__dirname,`${script}.cjs`)],{stdio:'inherit'});
  if(result.status !== 0) process.exit(result.status || 1);
}

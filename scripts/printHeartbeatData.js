var fs=require('fs');

var base='/mnt/ramdisk/services'
var dir=fs.readdirSync(base)
dir=dir.filter(e=>e.endsWith('.json'));

dir.sort();

dir.forEach(f=>{
  var path=`${base}/${f}`
  var d=fs.readFileSync(path).toString('utf8');
  console.log(`${path} (${d.length} bytes)`);
  console.log(JSON.stringify(JSON.parse(d),0,2));
  console.log()
  console.log('-'.repeat(40))
  console.log()
})

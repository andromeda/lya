module.exports=function(x){return x==null||(typeof x == 'number'&&isNaN(x))||(x.length<1&&typeof x!='function')||(typeof x=='object'&&x.constructor.name=='Object'&&Object.keys(x).length<1)}

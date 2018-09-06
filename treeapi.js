console.log("[opf403 ] start treeapi 20180515x1 ...");

var router    = require('express').Router();

var Client = require('node-rest-client').Client;
var client = new Client();

var pdbuffer  = require('./pdbuffer_v02.js');
var cmdcode = require("./handelrs485x2");


//=== syspub function ===
function jobjcopy(jobj){
	return JSON.parse(JSON.stringify(jobj));	
}

function apipamcheck(res,cmd,uuid,pos,group,cstu,callback){
	console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	//if(typeof(group) == "undefined" )console.log("group Fail ...");
	if( (uuid != pdbuffer.setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined") || (typeof(cstu) == "undefined") ){
		let jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	let jobj = {  "success" : "true"  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj);
	
	callback();
}

//localhost:3000/api/telephone
router.get('/',function(req,res,next){
	//console.log(req.body)
	console.log(req.query.pin);
	res.send('Wellcom TREE API !')
});

router.get('/check',function(req,res,next){
	//console.log(req.body)
	console.log(req.query.pin);
	res.send('Hello tree check !')
});


//==== WEB REGCMF API COMMAND === 

router.get('/MACADD',function(req,res,next){
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU

	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
		let cmdindex=0
		if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
		//let regadd = Number("0x"+cstu.substr(0,2))
		let cregadd = cstu.substr(0,2)
		let	nstu = Number('0x'+cstu.substr(2))
		let ttbuf = ""	
		ttbuf = Buffer.from(cmdcode.rs485v050.se0cmd,'hex');//f5 20 05 00 02 02 00 00 02
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		}
		if(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"]){ //check subcmd is working
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].sub=cmdindex;			
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].stu=0;
		}else{
		   //ttbuf[6]=0x55
		   console.log(cregadd+" not maping => "+pos);
		   return;
		}	
		
		switch(cmd){
			case "OFF":
				return
				break
			case "ON":	
				return
				break
			case "LOAD":
				console.log(cregadd+" not x15 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array		
				break
			case "AUTO":
				return
				break
			case "LOW":
				return
				break
			case "HI":		
				break
			case "ALARM":
				return
				break
			case "MODELOOP":
				return
				break
			case "MODETRIG":
				return
				break
			default:
				console.log(cregadd+" not define =>"+cmd);	
				return
		}
		
		console.log("send:"+ttbuf.toString('hex'));
		pdbuffer.totxbuff(ttbuf);	
	});
});

router.get('/IPADD',function(req,res,next){
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU

	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
		let cmdindex=0
		if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
		//let regadd = Number("0x"+cstu.substr(0,2))
		let cregadd = cstu.substr(0,2)//e1 01 23 45 67 89 AB DE FG
		let cmacadd = cstu.substr(2,12)
		let cipadd =  cstu.substr(14,4)
		let	nstu = Number('0x'+cstu.substr(2))
		let ttbuf = ""	
		ttbuf = Buffer.from(cmdcode.rs485v050.se1cmd,'hex');//f5 20 05 00 02 02 00 00 02
		console.log("macadd load ipd add ...");
		// use macadd define ipadd no check POS in Devtab
		//if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		//   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		//}else{			
		//   return;              
		//} //"f5 fd 0c 00 04 e1 12 34 56 78 90 12 00 00 e1"
		//	    0  1  2  3  4  5  6  7  8  9 10 11 12 13 14
		//  //0xf5,0xfd,len,0x00,0x02,0xE1,[m1],[m2],[m3],[m4],[m5],[m6],[ipadd_H],[ipadd_L],0xE1
		//if(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"]){ //check subcmd is working
		//    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].sub=cmdindex;			
		//    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].stu=0;
		//}else{
		   //ttbuf[6]=0x55
		//   console.log(cregadd+" not maping => "+pos);
		//   return;
		//}	
		
		switch(cmd){
			case "OFF":
				return
				break
			case "ON":	
				return
				break
			case "LOAD":
				console.log(cregadd+" macadd = "+cmacadd);	
				//ttbuf = Buffer.from(cmdcode.rs485v050.s03cmd,'hex');
				ttbuf[1]= 0xfd //pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= 0x02 //pdbuffer.pdjobj.subcmd[cmd];	//subcmd code LOAD			
				ttbuf[6]= Number("0x"+cmacadd.substr(0,2));	//### regadd data to ttbuf array		
				ttbuf[7]= Number("0x"+cmacadd.substr(2,2));	//### regadd data to ttbuf array		
				ttbuf[8]= Number("0x"+cmacadd.substr(4,2));	//### regadd data to ttbuf array		
				ttbuf[9]= Number("0x"+cmacadd.substr(6,2));	//### regadd data to ttbuf array		
				ttbuf[10]= Number("0x"+cmacadd.substr(8,2));	//### regadd data to ttbuf array
				ttbuf[11]= Number("0x"+cmacadd.substr(10,2));	//### regadd data to ttbuf array
				ttbuf[12]= Number("0x"+cipadd.substr(0,2));	//### regadd data to ttbuf array
				ttbuf[13]= Number("0x"+cipadd.substr(2,2));	//### regadd data to ttbuf array
				break
			case "AUTO":
				return
				break
			case "SET":
				console.log(cregadd+" set="+ cmacadd+" ipadd = ");	
				ttbuf[1]= 0xfd //pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= 0x04 //pdbuffer.pdjobj.subcmd[cmd];	//subcmd code SET			
				ttbuf[6]= Number("0x"+cmacadd.substr(0,2));	//### regadd data to ttbuf array		
				ttbuf[7]= Number("0x"+cmacadd.substr(2,2));	//### regadd data to ttbuf array		
				ttbuf[8]= Number("0x"+cmacadd.substr(4,2));	//### regadd data to ttbuf array		
				ttbuf[9]= Number("0x"+cmacadd.substr(6,2));	//### regadd data to ttbuf array		
				ttbuf[10]= Number("0x"+cmacadd.substr(8,2));	//### regadd data to ttbuf array
				ttbuf[11]= Number("0x"+cmacadd.substr(10,2));	//### regadd data to ttbuf array
				ttbuf[12]= Number("0x"+cipadd.substr(0,2));	//### regadd data to ttbuf array
				ttbuf[13]= Number("0x"+cipadd.substr(2,2));	//### regadd data to ttbuf array
				break
			case "HI":		
				break
			case "ALARM":
				return
				break
			case "MODELOOP":
				return
				break
			case "MODETRIG":
				return
				break
			default:
				console.log(cregadd+" not define =>"+cmd);	
				return
		}
		
		console.log("send:"+ttbuf.toString('hex'));
		pdbuffer.totxbuff(ttbuf);	
	});
});

router.get('/FWVER',function(req,res,next){
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU

	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
		let cmdindex=0
		if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
		//let regadd = Number("0x"+cstu.substr(0,2))
		let cregadd = cstu.substr(0,2)
		let	nstu = Number('0x'+cstu.substr(2))
		let ttbuf = ""	
		ttbuf = Buffer.from(cmdcode.rs485v050.se2cmd,'hex');//f5 00 06 00 02 e2 00 00 e2
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		}
		if(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"]){ //check subcmd is working
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].sub=cmdindex;			
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].stu=0;
		}else{
		   //ttbuf[6]=0x55
		   console.log(cregadd+" not maping => "+pos);
		   return;
		}	
		
		switch(cmd){
			case "OFF":
				return
				break
			case "ON":	
				return
				break
			case "LOAD":
				console.log(cregadd+" not x15 "+pos);	
				//ttbuf = Buffer.from(cmdcode.rs485v050.s03cmd,'hex');
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array				
				break
			case "AUTO":
				return
				break
			case "LOW":
				return
				break
			case "HI":		
				break
			case "ALARM":
				return
				break
			case "MODELOOP":
				return
				break
			case "MODETRIG":
				return
				break
			default:
				console.log(cregadd+" not define =>"+cmd);	
				return
		}
		
		console.log("send:"+ttbuf.toString('hex'));
		pdbuffer.totxbuff(ttbuf);	
	});
});
       
router.get('/HWVER',function(req,res,next){
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU

	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
		let cmdindex=0
		if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
		//let regadd = Number("0x"+cstu.substr(0,2))
		let cregadd = cstu.substr(0,2)
		let	nstu = Number('0x'+cstu.substr(2))
		let ttbuf = ""	
		ttbuf = Buffer.from(cmdcode.rs485v050.se3cmd,'hex');//f5 20 05 00 02 02 00 00 02
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		}
		if(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"]){ //check subcmd is working
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].sub=cmdindex;			
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].stu=0;
		}else{
		   //ttbuf[6]=0x55
		   console.log(cregadd+" not maping => "+pos);
		   return;
		}	
		
		switch(cmd){
			case "OFF":
				return
				break
			case "ON":	
				return
				break
			case "LOAD":
				console.log(cregadd+" not x15 "+pos);	
				//ttbuf = Buffer.from(cmdcode.rs485v050.s03cmd,'hex');
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array				
				break
			case "AUTO":
				return
				break
			case "LOW":
				return
				break
			case "HI":		
				break
			case "ALARM":
				return
				break
			case "MODELOOP":
				return
				break
			case "MODETRIG":
				return
				break
			default:
				console.log(cregadd+" not define =>"+cmd);	
				return
		}
		
		console.log("send:"+ttbuf.toString('hex'));
		pdbuffer.totxbuff(ttbuf);	
	});
});

router.get('/TREESCAN',function(req,res,next){
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	
	//console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
	  //console.log("treescan process ! ")
	  //scmd = rs485v050.se0cmd  "se0cmd" : "f5 20 03 00 01 01 01"
	   
		let cmdindex=0
		//console.log(JSON.stringify(pdbuffer.pdjobj.subcmd)+"=>"+cmd)
		if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
		//let regadd = Number("0x"+cstu.substr(0,2))
		let cregadd = cstu.substr(0,2)
		let	nstu = Number('0x'+cstu.substr(2))
		let ttbuf = ""	
		//console.log("tx=>"+cmdcode.rs485v050.s01cmd)
		ttbuf = Buffer.from(cmdcode.rs485v050.s01cmd,'hex');
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		}
		if(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"]){ //check subcmd is working
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].sub=cmdindex;			
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].stu=0;
			console.log(cregadd+" maping => "+pos);
		}else{
		   //ttbuf[6]=0x55
		   console.log(cregadd+" not maping => "+pos);
		   return;
		}	
		
		switch(cmd){
			case "OFF":
				break
			case "ON":				
				ttbuf = Buffer.from(cmdcode.rs485v050.se0cmd,'hex');
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### S72auto data to stu array
				console.log(cregadd+" run => "+cmd);
				
				break
			case "LOAD":
				break
			case "AUTO":		
				break
			case "LOW":
				break
			case "HI":		
				break
			case "ALARM":		
				break
			case "MODELOOP":		
				break
			case "MODETRIG":	
				break
			default:
				return
		}		
		console.log("send:"+ttbuf.toString('hex'));
		pdbuffer.totxbuff(ttbuf);		
	});
	
});

router.get('/TREECOUNT',function(req,res,next){
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	//console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
	  //scmd = rs485v050.se0cmd  "se0cmd" : "f5200300020303"
	  
		let cmdindex=0
		if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
		//let regadd = Number("0x"+cstu.substr(0,2))
		let cregadd = cstu.substr(0,2)
		let	nstu = Number('0x'+cstu.substr(2))
		let ttbuf = ""	
		ttbuf = Buffer.from(cmdcode.rs485v050.s03cmd,'hex');
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		}
		if(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"]){ //check subcmd is working
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].sub=cmdindex;			
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].stu=0;
		}else{
		   //ttbuf[6]=0x55
		   console.log(cregadd+" not maping => "+pos);
		   return;
		}	
		
		switch(cmd){
			case "OFF":
				return
				break
			case "ON":	
				return
				break
			case "LOAD":
				console.log(cregadd+" not x15 "+pos);	
				ttbuf = Buffer.from(cmdcode.rs485v050.s03cmd,'hex');
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array				
				break
			case "AUTO":
				return
				break
			case "LOW":
				return
				break
			case "HI":		
				break
			case "ALARM":
				return
				break
			case "MODELOOP":
				return
				break
			case "MODETRIG":
				return
				break
			default:
				console.log(cregadd+" not define =>"+cmd);	
				return
		}		
		console.log("send:"+ttbuf.toString('hex'));
		pdbuffer.totxbuff(ttbuf);	
	});
});

router.get('/TREELIST',function(req,res,next){
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	
	//console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
		let cmdindex=0
		if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
		//let regadd = Number("0x"+cstu.substr(0,2))
		let cregadd = cstu.substr(0,2)
		let	nstu = Number('0x'+cstu.substr(2))
		let ttbuf = ""	
		ttbuf = Buffer.from(cmdcode.rs485v050.s02cmd,'hex');//f5 20 05 00 02 02 00 00 02
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		}
		if(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"]){ //check subcmd is working
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].sub=cmdindex;			
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].stu=0;
		}else{
		   //ttbuf[6]=0x55
		   console.log(cregadd+" not maping => "+pos);
		   return;
		}	
		
		switch(cmd){
			case "OFF":
				return
				break
			case "ON":	
				return
				break
			case "LOAD":
				console.log(cregadd+" not x15 "+pos);	
				//ttbuf = Buffer.from(cmdcode.rs485v050.s03cmd,'hex');
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array	0x20
				ttbuf[6]= Number('0x'+cstu.substr(2,2));	//tree index high byte
				ttbuf[7]= Number('0x'+cstu.substr(4,2));	//tree index low byte						
				break
			case "AUTO":
				return
				break
			case "LOW":
				return
				break
			case "HI":		
				break
			case "ALARM":
				return
				break
			case "MODELOOP":
				return
				break
			case "MODETRIG":
				return
				break
			default:
				console.log(cregadd+" not define =>"+cmd);	
				return
		}
		
		console.log("send:"+ttbuf.toString('hex'));
		pdbuffer.totxbuff(ttbuf);	
	});
});


router.get('/TREESCANLOAD',function(req,res,next){
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	
	//console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
		let cmdindex=0
		if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
		//let regadd = Number("0x"+cstu.substr(0,2))
		let cregadd = cstu.substr(0,2)
		let	nstu = Number('0x'+cstu.substr(2))
		if(pdbuffer.jtreescan.SCANCOUNT < 1)return;
		
		
		switch(cmd){
			case "OFF":
				return
				break
			case "ON":	
				for(jj in pdbuffer.jtreescan.SCANLIST){
					tsss = pdbuffer.jtreescan.SCANLIST[jj];
					tss = jj+","+tsss+",0001,0001"
					webtreelisturl ="http://tscloud.opcom.com/Cloud/API/v2/DeviceScan?ID="+pdbuffer.setuuid+"&DeviceMAC="+tss
					console.log("link==>"+webtreelisturl)
					client.get(webtreelisturl, function (data, response) {
						console.log("reload devtab web link !"+data.toString())
					});		
				}
				break
			case "LOAD":
				console.log("start load treelist to buffer ! ");	//for (i = 0; i < cars.length; i++) {
				let ii;
				for(ii=0 ; ii<pdbuffer.jtreescan.SCANCOUNT ;ii++){
					sii=ii.toString(16)
					if(sii.length==1)sii="0"+sii;
					//http://192.168.5.105:3000/TREE/TREELIST?UUID=OFA1C002DC0E7105AD6A2886&Action=LOAD&POS=E001&STU=02000b&GROUP=0000 
					treelisturl = "http://127.0.0.1:3000/TREE/TREELIST?UUID="+pdbuffer.setuuid+"&GROUP=0000&Action=LOAD&POS=E001&STU=0200"+sii
					//console.log("link==>"+treelisturl)
					client.get(treelisturl, function (data, response) {
						console.log("reload devtab web link !"+data.toString())
					});	
				}
				break
			case "AUTO":
				return
				break
			case "LOW":
				return
				break
			case "HI":		
				break
			case "ALARM":
				return
				break
			case "MODELOOP":
				return
				break
			case "MODETRIG":
				return
				break
			default:
				console.log(cregadd+" not define =>"+cmd);	
				return
		}
		
		//console.log("send:"+ttbuf.toString('hex'));
		//pdbuffer.totxbuff(ttbuf);	
	});
});

//setInterval(function(){			
	//console.log("0xfc command check 0..."+global.arxokflag)
	//treebuff.testflag1++;
	//console.log("treeapi  command check 2...",treebuff.testflag1)
	//console.log("treeapi  command show uuid...",pdbuffer.setuuid)
//},2 * 1000 );


module.exports = router;
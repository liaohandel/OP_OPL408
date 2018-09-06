console.log("[opf403 ] start regcmd_gx8 20180701x1 ...");

var router    = require('express').Router();

var Client = require('node-rest-client').Client;
var client = new Client();
var cargs = {
    requestConfig: {
        timeout: 500,
        noDelay: true,
        keepAlive: true
    },
    responseConfig: {
        timeout: 1000 //response timeout 
    }
};

var pdbuffer  = require('./pdbuffer_v02.js');
var autocmd = require('./autocmd_gx8.js');
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

function vcmdapipamcheck(res,cmd,uuid,pos,group,cstu,callback){
	console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	//if(typeof(group) == "undefined" )console.log("group Fail ...");
	if( (uuid != pdbuffer.setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined") || (typeof(cstu) == "undefined") ){
		let jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	//let jobj = {  "success" : "true"  }; 
	//console.log(JSON.stringify(jobj));
	//res.json(jobj); //viture api command msut res data to web server!!!
	
	callback();
}


//=== keyPad function call ===
const KPADLIB = ["KEYPAD0","KEYPAD1","KEYPAD2"];

function keylistapicall(kapilist){
	let chkcmd =""
	if(kapilist.length > 0 ){
		for(kk in kapilist ){
			//console.log("CMD="+kapilist[kk].CMD +"POS="+kapilist[kk].POS +"Action="+kapilist[kk].Action +"STU="+kapilist[kk].STU +"GROUP="+kapilist[kk].GROUP);
			chkcmd = kapilist[kk].CMD;
			//keypadlisturl = "http://127.0.0.1:3000/"+kapilist[kk].CMD+"?UUID="+pdbuffer.setuuid+"&Action="+kapilist[kk].Action+"&POS="+kapilist[kk].POS+"&STU="+kapilist[kk].STU+"&GROUP="+kapilist[kk].GROUP
			keypadlisturl = "http://127.0.0.1:3000/"+chkcmd+"?UUID="+pdbuffer.setuuid+"&Action="+kapilist[kk].Action+"&POS="+kapilist[kk].POS+"&STU="+kapilist[kk].STU+"&GROUP="+kapilist[kk].GROUP
			client.get(keypadlisturl, function (data, response) {
				console.log("get ok...");
			}).on("error", function(err) {console.log("err for client");});
	
			//ext = http://tscloud.opcom.com/Cloud/API/v2/KeypadUpdate?ID=OFA1C0044826BEF87AEA0481&KeypadID=KEYPAD0&Index=K004&value=ON			
			if(chkcmd == "REGCMD/KEYSETUP"){
				
				updatekeysstuatusurl= pdbuffer.pdjobj.PDDATA.v2keypadstatusupdateurl+"?ID="+pdbuffer.setuuid+"&KeypadID="+kapilist[kk].POS+"&Index="+kapilist[kk].GROUP+"&value="+kapilist[kk].STU;
				console.log("sudo active update to webui =>"+updatekeysstuatusurl);
				client.get(updatekeysstuatusurl,cargs, function (data, response) {
					console.log("keypad active update to webui   ok ...");
				}).on("error", function(err) {console.log("err for client");}).on('requestTimeout', function (req) {req.abort();});
				
				updatekeysstuatusurl220 = "http://192.168.5.220/API/v2/KeypadUpdate.php"+"?ID="+pdbuffer.setuuid+"&KeypadID="+kapilist[kk].POS+"&Index="+kapilist[kk].GROUP+"&value="+kapilist[kk].STU;
				console.log("sudo active update to webui =>"+updatekeysstuatusurl220);
				client.get(updatekeysstuatusurl220,cargs, function (data, response) {
					console.log("keypad active update to webui   ok ...");
				}).on("error", function(err) {console.log("err for client");}).on('requestTimeout', function (req) {req.abort();});
				
			};
		}
	}
}

function keypadjload(keyscan){
	let keypadno = Number('0x'+keyscan.substr(0,2));
	if(keypadno < KPADLIB.length ){	
		let keypadname = KPADLIB[keypadno];
		
		let skeyinx = 	keyscan.substr(2,2);	
		let skeystu = 	keyscan.substr(4,2);	
		//===
		if(!(keypadname in pdbuffer.jkeypd.KEYLIB)){
			console.log(">>JSON KEYLIB not define "+keypadname);
			return
		}
			
		let stpt = Number("0x"+skeystu);
		let jketbuff={};
		let jkeypush ={};
		let keycmask ="ON";
		ksop = "K0"+skeyinx
		console.log("key="+ksop)
		if(ksop in pdbuffer.jkeypd.KEYLIB[keypadname]){
			jketbuff = pdbuffer.jkeypd.KEYLIB[keypadname][ksop];
			if(stpt < jketbuff.STATUS.stcnt){
				keycmask = jketbuff.STATUS.stmask[stpt];
				jkeypush = jketbuff.EVENT[keycmask];
				keylistapicall(jkeypush)
				// for(jkk in jkeypush ){
					// console.log("keyapi>>"+jkeypush[jkk]);
				// }
				
				console.log("key="+ksop+"no define in keypad1="+stpt)
			}else{
				console.log("keystu="+stpt+"no define in "+ksop);
			}
		}else{
			console.log("key="+ksop+"no define in keypad1="+stpt)
		}
	}
}

function regcmdchkloop(){

		//### fa auto check keypad push event ###
		setInterval(function(){			
			//console.log("0xfc command check 0..."+global.arxokflag)
			if(pdbuffer.keypadpushbuffer.length > 0){
				let kpadrun = pdbuffer.keypadpushbuffer.shift();
				console.log("psuh keypad = "+kpadrun);
				keypadjload(kpadrun);
			}
		},177);

}


//localhost:3000/api/telephone
router.get('/',function(req,res,next){
	//console.log(req.body)
	console.log(req.query.pin);
	res.send('Wellcom REGCMD API !')
});

router.get('/check',function(req,res,next){
	//console.log(req.body)
	console.log(req.query.pin);
	res.send('Hello regcmd check !')
});

//==== WEB REGCMF API COMMAND === 
router.get('/DEVTRIG',function(req,res,next){	
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
		ttbuf = Buffer.from(cmdcode.rs485v050.s04cmd,'hex');//"f5200d00020401230123456789abcdef04"
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
				console.log(cregadd+" not x11 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array	
				break
			case "LOAD":
				console.log(cregadd+" not x12 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array				
				break
			case "AUTO":
				return
				break
			case "SET":
				console.log(cregadd+" not x14 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				break
			case "LOW":
				console.log(cregadd+" not x15 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array	
				break
			case "HI":
				console.log(cregadd+" not x16 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array	
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

router.get('/DEVTRIGCOUNT',function(req,res,next){	
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
		ttbuf = Buffer.from(cmdcode.rs485v050.s05cmd,'hex');//"f5200300020505"
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
				console.log(cregadd+" not x12 "+pos);	
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

router.get('/DEVEVENT',function(req,res,next){	
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
		ttbuf = Buffer.from(cmdcode.rs485v050.s06cmd,'hex');//"f5200d00020601230123456789abcdef06"
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
				console.log(cregadd+" not x11 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array	
				break
			case "LOAD":
				console.log(cregadd+" not x12 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array				
				break
			case "AUTO":
				return
				break
			case "SET":
				console.log(cregadd+" not x14 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				break
			case "LOW":
				console.log(cregadd+" not x15 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array	
				break
			case "HI":
				console.log(cregadd+" not x16 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array	
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

router.get('/DEVEVENTCOUNT',function(req,res,next){	
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
		ttbuf = Buffer.from(cmdcode.rs485v050.s07cmd,'hex');//"f5200300020707"
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



//=== KEYPAD EVENT LIST === 
router.get('/KEYVER',function(req,res,next){//ok	
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
		let	nstu = Number('0x'+cstu.substr(0,2))
		let ttbuf = ""	
		ttbuf = Buffer.from(cmdcode.rs485v050.s0fcmd,'hex');//"f5200500020f00000f"
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
				console.log(cregadd+" not x15 "+pos);	//f5 20 06 00 02 0f 00 00 0f
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				ttbuf[6]= Number('0x'+cstu.substr(2,2)); //### ver  byte1 to ttbuf array
				ttbuf[7]= Number('0x'+cstu.substr(4,2)); //### ver  byte1 to ttbuf array				
				break
			case "AUTO":
				return
				break
			case "SET":                                              // 0123456789012345678901234567890123
				ttbuf = Buffer.from(cmdcode.rs485v050.s0fscmd,'hex');//"f5200E00040f000000000000000000000f"
				console.log(cregadd+" not x14 "+pos);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array	
				ttbuf[6]= Number('0x'+cstu.substr(2,2)); //### ver  byte1 to ttbuf array
				ttbuf[7]= Number('0x'+cstu.substr(4,2)); //### ver  byte1 to ttbuf array
				ttbuf[8]= Number('0x'+cstu.substr(6,2)); //### ver  byte1 to ttbuf array
				ttbuf[9]= Number('0x'+cstu.substr(8,2)); //### ver  byte1 to ttbuf array
				ttbuf[10]= Number('0x'+cstu.substr(10,2)); //### ver  byte1 to ttbuf array
				ttbuf[11]= Number('0x'+cstu.substr(12,2)); //### ver  byte1 to ttbuf array
				//ttbuf[12]= Number('0x'+cstu.substr(14,2)); //### ver  byte1 to ttbuf array
				//ttbuf[13]= Number('0x'+cstu.substr(16,2)); //### ver  byte1 to ttbuf array
				
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

router.get('/KEYEVLIST',function(req,res,next){//ok
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
		//let	nstu = Number('0x'+cstu.substr(2))
		let ttbuf = ""	
		ttbuf = Buffer.from(cmdcode.rs485v050.s10cmd,'hex');//"f5200d00021001230123456789abcdef10"
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
		//0123456789012345678901234567890123
		//f5200e00021001230123456789abcdef10
		// 0 1 2 3 4 5 6 7 8 910111213141516 [6:7] [8:15]
		switch(cmd){
			case "OFF":
				ttbuf = Buffer.from(cmdcode.rs485v050.s11cmd,'hex');//"f5200d00021001230123456789abcdef10"
				console.log(cregadd+" not x12 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				
				ttbuf[6]= Number('0x'+cstu.substr(2,2));//### indexH
				ttbuf[7]= Number('0x'+cstu.substr(4,2));//### indexL (0:off/1:on)
				break
			case "ON"://buffer save  to eeprom 
				console.log(cregadd+" not x11 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				
				//ttbuf[6]= Number('0x'+cstu.substr(2,2));//### indexH
				//ttbuf[7]= Number('0x'+cstu.substr(4,2));//### indexL (0:off/1:on)
				
				ttbuf[6]= Number('0x'+cstu.substr(2,2));  //0### flag (0x00)
				ttbuf[7]= Number('0x'+cstu.substr(4,2));  //1### keycode (0x91:0x98)
				ttbuf[8]= Number('0x'+cstu.substr(6,2));  //2### keystu (0:off/1:on)
				ttbuf[9]= Number('0x'+cstu.substr(8,2));  //3### ipadd 
				ttbuf[10]= Number('0x'+cstu.substr(10,2));//4### reg 
				ttbuf[11]= Number('0x'+cstu.substr(12,2));//5### subcmd 
				ttbuf[12]= Number('0x'+cstu.substr(14,2));//6### valh
				ttbuf[13]= Number('0x'+cstu.substr(16,2));//7### vall
				ttbuf[14]= Number('0x'+cstu.substr(18,2));//8### groupH 
				ttbuf[15]= Number('0x'+cstu.substr(20,2));//9### groupL
				
				break
			case "LOAD": // load by index(keycode) f52006000211123411
				ttbuf = Buffer.from(cmdcode.rs485v050.s11cmd,'hex');//"f5200d00021001230123456789abcdef10"
				console.log(cregadd+" not x12 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				
				ttbuf[6]= Number('0x'+cstu.substr(2,2));//### indexH
				ttbuf[7]= Number('0x'+cstu.substr(4,2));//### indexL (0:off/1:on)
				
				//ttbuf[6]= Number('0x'+cstu.substr(2,2));  //0### flag (0x00)
				//ttbuf[7]= Number('0x'+cstu.substr(4,2));  //1### keycode (0x91:0x98)
				//ttbuf[8]= Number('0x'+cstu.substr(6,2));  //2### keystu (0:off/1:on)
				//ttbuf[9]= Number('0x'+cstu.substr(8,2));  //3### ipadd 
				//ttbuf[10]= Number('0x'+cstu.substr(10,2));//4### reg 
				//ttbuf[11]= Number('0x'+cstu.substr(12,2));//5### subcmd 
				//ttbuf[12]= Number('0x'+cstu.substr(14,2));//6### valh
				//ttbuf[13]= Number('0x'+cstu.substr(16,2));//7### vall
				//ttbuf[14]= Number('0x'+cstu.substr(18,2));//8### groupH 
				//ttbuf[15]= Number('0x'+cstu.substr(20,2));//9### groupL
							
				break
			case "AUTO": //call the keycode event 
				console.log(cregadd+" not x13 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				//ttbuf[6]= Number('0x'+cstu.substr(2,2));//### indexH
				//ttbuf[7]= Number('0x'+cstu.substr(4,2));//### indexL (0:off/1:on)
				
				ttbuf[6]= Number('0x'+cstu.substr(2,2));  //0### flag (0x00)
				ttbuf[7]= Number('0x'+cstu.substr(4,2));  //1### keycode (0x91:0x98)
				ttbuf[8]= Number('0x'+cstu.substr(6,2));  //2### keystu (0:off/1:on)
				ttbuf[9]= Number('0x'+cstu.substr(8,2));  //3### ipadd 
				ttbuf[10]= Number('0x'+cstu.substr(10,2));//4### reg 
				ttbuf[11]= Number('0x'+cstu.substr(12,2));//5### subcmd 
				ttbuf[12]= Number('0x'+cstu.substr(14,2));//6### valh
				ttbuf[13]= Number('0x'+cstu.substr(16,2));//7### vall
				ttbuf[14]= Number('0x'+cstu.substr(18,2));//8### groupH 
				ttbuf[15]= Number('0x'+cstu.substr(20,2));//9### groupL
				//return
				break
			case "SET"://update the index
				console.log(cregadd+" not x14 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				//ttbuf[6]= Number('0x'+cstu.substr(2,2));//### indexH
				//ttbuf[7]= Number('0x'+cstu.substr(4,2));//### indexL (0:off/1:on)
				
				ttbuf[6]= Number('0x'+cstu.substr(2,2));  //0### flag (0x00)
				ttbuf[7]= Number('0x'+cstu.substr(4,2));  //1### keycode (0x91:0x98)
				ttbuf[8]= Number('0x'+cstu.substr(6,2));  //2### keystu (0:off/1:on)
				ttbuf[9]= Number('0x'+cstu.substr(8,2));  //3### ipadd 
				ttbuf[10]= Number('0x'+cstu.substr(10,2));//4### reg 
				ttbuf[11]= Number('0x'+cstu.substr(12,2));//5### subcmd 
				ttbuf[12]= Number('0x'+cstu.substr(14,2));//6### valh
				ttbuf[13]= Number('0x'+cstu.substr(16,2));//7### vall
				ttbuf[14]= Number('0x'+cstu.substr(18,2));//8### groupH 
				ttbuf[15]= Number('0x'+cstu.substr(20,2));//9### groupL
				break
			case "LOW"://del last
				console.log(cregadd+" not x15x "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				//ttbuf[6]= Number('0x'+cstu.substr(2,2));//### indexH
				//ttbuf[7]= Number('0x'+cstu.substr(4,2));//### indexL (0:off/1:on)
				
				ttbuf[6]= Number('0x'+cstu.substr(2,2));  //0### flag (0x00)
				ttbuf[7]= Number('0x'+cstu.substr(4,2));  //1### keycode (0x91:0x98)
				ttbuf[8]= Number('0x'+cstu.substr(6,2));  //2### keystu (0:off/1:on)
				ttbuf[9]= Number('0x'+cstu.substr(8,2));  //3### ipadd 
				ttbuf[10]= Number('0x'+cstu.substr(10,2));//4### reg 
				ttbuf[11]= Number('0x'+cstu.substr(12,2));//5### subcmd 
				ttbuf[12]= Number('0x'+cstu.substr(14,2));//6### valh
				ttbuf[13]= Number('0x'+cstu.substr(16,2));//7### vall
				ttbuf[14]= Number('0x'+cstu.substr(18,2));//8### groupH 
				ttbuf[15]= Number('0x'+cstu.substr(20,2));//9### groupL
					
				break
			case "HI"://add a new 
				console.log(cregadd+" not x16 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				//ttbuf[6]= Number('0x'+cstu.substr(2,2));//### indexH
				//ttbuf[7]= Number('0x'+cstu.substr(4,2));//### indexL (0:off/1:on)
				
				ttbuf[6]= Number('0x'+cstu.substr(2,2));  //0### flag (0x00)
				ttbuf[7]= Number('0x'+cstu.substr(4,2));  //1### keycode (0x91:0x98)
				ttbuf[8]= Number('0x'+cstu.substr(6,2));  //2### keystu (0:off/1:on)
				ttbuf[9]= Number('0x'+cstu.substr(8,2));  //3### ipadd 
				ttbuf[10]= Number('0x'+cstu.substr(10,2));//4### reg 
				ttbuf[11]= Number('0x'+cstu.substr(12,2));//5### subcmd 
				ttbuf[12]= Number('0x'+cstu.substr(14,2));//6### valh
				ttbuf[13]= Number('0x'+cstu.substr(16,2));//7### vall
				ttbuf[14]= Number('0x'+cstu.substr(18,2));//8### groupH 
				ttbuf[15]= Number('0x'+cstu.substr(20,2));//9### groupL
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

router.get('/KEYEVCOUNT',function(req,res,next){	
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
		ttbuf = Buffer.from(cmdcode.rs485v050.s11cmd,'hex');//"f5200300021111"
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
				console.log(cregadd+" not x12 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				
				ttbuf[6]= Number('0x'+cstu.substr(2,2));//### indexH
				ttbuf[7]= Number('0x'+cstu.substr(4,2));//### indexL (0:off/1:on)			
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

router.get('/KEYEVGROUP',function(req,res,next){	
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
		ttbuf = Buffer.from(cmdcode.rs485v050.s14cmd,'hex');//"f5 20 08 00 02 14 12 34 12 34 13"
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working 
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		}
		if(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"]){ //check typecmd reg is working
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].sub=cmdindex;			
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].stu=0;
		}else{
		   //ttbuf[6]=0x55
		   console.log(cregadd+" not maping => "+pos);
		   return;
		}	
		
		switch(cmd){//sch subcmd //"f5 20 08 00 02 14 12 34 12 34 13" 14920000A0
			case "OFF":
				console.log(cregadd+"  keygroupx10 "+pos+cmd+cstu);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				
				ttbuf[6]= Number('0x'+cstu.substr(2,2));//### indexH
				ttbuf[7]= Number('0x'+cstu.substr(4,2));//### indexL (0:off/1:on)
				
				ttbuf[8]= Number('0x'+cstu.substr(6,2));//### indexH
				ttbuf[9]= Number('0x'+cstu.substr(8,2));//### indexL (0:off/1:on)	
				break
			case "SET":
				console.log(cregadd+" keygroupx11 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				
				ttbuf[6]= Number('0x'+cstu.substr(2,2));//### keycode
				ttbuf[7]= Number('0x'+cstu.substr(4,2));//### keystu (0:off/1:on)
				
				ttbuf[8]= Number('0x'+cstu.substr(6,2));//### group H
				ttbuf[9]= Number('0x'+cstu.substr(8,2));//### group L  				
				break
			case "AUTO":
				console.log(cregadd+" keygroupx12 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				
				ttbuf[6]= Number('0x'+cstu.substr(2,2));//### keycode
				ttbuf[7]= Number('0x'+cstu.substr(4,2));//### keystu (0:off/1:on)
				
				ttbuf[8]= Number('0x'+cstu.substr(6,2));//### group H
				ttbuf[9]= Number('0x'+cstu.substr(8,2));//### group L  
				break
			default:
				console.log(cregadd+" not define =>"+cmd);	
				return
		}
		
		console.log("send:"+ttbuf.toString('hex'));
		pdbuffer.totxbuff(ttbuf);	
				
	});	
});

router.get('/KEYEVGROUPINIT',function(req,res,next){	
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
		ttbuf = Buffer.from(cmdcode.rs485v050.s14cmd,'hex');//"f5 20 08 00 02 14 12 34 12 34 13"
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working 
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		}
		
		if(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"]){ //check typecmd reg is working
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].sub=cmdindex;			
		    pdbuffer.pdjobj.PDDATA.Devtab[pos]["C70"]["chtab"][cregadd].stu=0;
		}else{
		   //ttbuf[6]=0x55
		   console.log(cregadd+" not maping => "+pos);
		   return;
		}	
		
		switch(cmd){//sch subcmd //"f5 20 08 00 02 14 12 34 12 34 13" 14920000A0
			case "OFF":
				console.log(cregadd+" keygroupx11 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				pdbuffer.totxbuff(ttbuf);	
				break
			case "SET":
				console.log(cregadd+" keygroupx11 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				
				for(kk in pdbuffer.jkeypd.KEYLIB.KEYPAD2 ){					
					//ttbuf[6]= Number('0x'+kk.substr(2,2));//### keycode
					if(kk.substr(0,1)=="K"){
						console.log(">>keycode="+kk.substr(2,2))
						console.log(">>>>keygroup="+pdbuffer.jkeypd.KEYLIB.KEYPAD2[kk]["STATUS"]["GROUP"]);
						ttbuf[6]= Number('0x'+kk.substr(2,2));//### keycode
						ttbuf[7]= 0x01;//### keystu (0:off/1:on)
				
						ttbuf[8]= 0x00;//### group H
						ttbuf[9]= Number('0x'+pdbuffer.jkeypd.KEYLIB.KEYPAD2[kk]["STATUS"]["GROUP"]);//### group L  
						
						console.log("send:"+ttbuf.toString('hex'));
						pdbuffer.totxbuff(ttbuf);	
						
					}
				}
				//ttbuf[6]= Number('0x'+cstu.substr(2,2));//### keycode
				//ttbuf[7]= Number('0x'+cstu.substr(4,2));//### keystu (0:off/1:on)
				
				//ttbuf[8]= Number('0x'+cstu.substr(6,2));//### group H
				//ttbuf[9]= Number('0x'+cstu.substr(8,2));//### group L  				
				break
			case "ON":
				console.log(cregadd+" keygroupx11 "+pos+cmd);	
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;//ipadd 0x20
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];	//subcmd code				
				ttbuf[5]= Number("0x"+cregadd);	//### regadd data to ttbuf array
				pdbuffer.totxbuff(ttbuf);	
				break
			default:
				console.log(cregadd+" not define =>"+cmd);	
				return
		}
		
		//console.log("send:"+ttbuf.toString('hex'));
		//pdbuffer.totxbuff(ttbuf);	
				
	});	
});


//system ATUO JSON formt data load and set to buffer 
const webuiautokey = {
	"GROWLED":0,"CYCLEFAN":0,"SPRAY":0,"REFRESH":0,"UV":0,"PUMP":0,"GROWUPDOWN":0,
	"AIRCON":0,"AIRRH":0,"WATERTM":0,"CO2":0,"OPWAVE":0,"DOSE":0
}

//=====================================================
router.get('/AUTOSETUP',function(req,res,next){	//ok	
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	
	//console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	vcmdapipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
		let cmdindex=0;
		let jobj = { "success" : "false" };  
		
		if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
			
		if((pos in pdbuffer.jautocmd.DEVLIST) || (pos in pdbuffer.jautocmd.WATERLOOP) ){ //check pos is working 
			if(cmdindex <= 1){
				console.log("OFF/ON Command only by pos = 0000");
				res.json(jobj);
				//console.log(">>autox11");
				return;// OFF /ON must POS="0000"
			}
		}else{			
			if(pos != "0000"){  // OFF /ON must POS="0000"
				if(cmd != "SET"){//if pos no define must SET command  					
					console.log(" SET Command only by new pos = "+pos);
					res.json(jobj);
				//console.log(">>autox12");
					return;//if new POS must use SET
				}
			}else {
				if(cmdindex > 1){//ON/OFF by 0000
					if(cmdindex != 3 && cmdindex!=4){//AUTO by 0000 or SET by 0000
						console.log(" AUTO/SET Command only by pos = 0000");
						res.json(jobj);
				//console.log(">>autox13");
						return;// OFF /ON must POS="0000"
					}
				}
			}
		}

		jobj = {  "success" : "true"  }; 
		switch(cmd){//sch subcmd //"f5 20 08 00 02 14 12 34 12 34 13" 14920000A0
			case "OFF":
				res.json(jobj);
				if(pos == "0000")pdbuffer.jautocmd_load(()=>{
					console.log("JAUTO reload ok !");
					autocmd.reload_autojob();//relaod auto json to buffer 
				});//reload files to buffer
				break
			case "ON":
				res.json(jobj);
				if(pos == "0000")pdbuffer.jautocmd_update(()=>{
					console.log("JAUTO Save ok !");
				});//update buffer to Files
				break
			case "LOAD":			
				if(cstu == "02"){					
					jobj = pdbuffer.jautocmd.WATERLOOP[pos];
				}else{	
					jobj = pdbuffer.jautocmd.DEVLIST[pos];
				}
				res.json(jobj);	
				break
			case "AUTO":
				res.json(jobj);
				//console.log(">>autox31");
				if(pos == "0000"){
					if(cstu == "00"){//all web ui auto Stop 	
						for(kk in pdbuffer.jautocmd.DEVLIST){
							if(kk in webuiautokey){
								pdbuffer.jautocmd.DEVLIST[kk].STATU=0;
								if(kk in autocmd.sch_autojob)autocmd.sch_autojob[kk].STATU=0;
							}
						}
					}
					if(cstu == "01"){//all web ui auto Start run	
						for(kk in pdbuffer.jautocmd.DEVLIST){
							if(kk in webuiautokey){
								pdbuffer.jautocmd.DEVLIST[kk].STATU=1;
								if(kk in autocmd.sch_autojob)autocmd.sch_autojob[kk].STATU=1;
							}
						}
					}					
				}else{
					if(cstu == "00"){//DEVLIST AUTO OFF
						pdbuffer.jautocmd.DEVLIST[pos].STATU=0;
						if(pos in autocmd.sch_autojob)autocmd.sch_autojob[pos].STATU=0;
					}
					if(cstu == "01"){//DEVLIST AUTO ON
						pdbuffer.jautocmd.DEVLIST[pos].STATU=1;
						if(pos in autocmd.sch_autojob)autocmd.sch_autojob[pos].STATU=1;
					}
					if(cstu == "02"){//WATERLOOP mode5 OFF
						pdbuffer.jautocmd.WATERLOOP[pos].SENSOR_CONTROL=0;
						pdbuffer.jautocmd.WATERLOOP[pos].STATU=0;						
					}
					if(cstu == "03"){//WATERLOOP mode5 ON
						pdbuffer.jautocmd.WATERLOOP[pos].SENSOR_CONTROL=0;
						pdbuffer.jautocmd.WATERLOOP[pos].STATU=1;
					}
					
				}
				//####
				
				break
			case "SET":
				res.json(jobj);
				
				if(pos == "0000"){//when pos ="0000" is load default auto json 
					for(jaa in pdbuffer.jautocmd.DEFAUTOLIST){
						pdbuffer.jautocmd.DEVLIST[jaa] = pdbuffer.jautocmd.DEFAUTOLIST[jaa];
					}
					pdbuffer.jautocmd_update(()=>{
						console.log("JAUTO Save ok !");
									
					});//update buffer to Files
					return;
				}
				
				//autojsonloadurl = "http://tscloud.opcom.com/Cloud/API/v2/AUTOJSON?SID="+cstu;
				autojsonloadurl =  pdbuffer.pdjobj.PDDATA.v2autojsonloadurl+"?SID="+cstu;
				console.log("get ok...["+pos+"] link>>"+autojsonloadurl);
				if(pos == "DOSE"){					
					client.get(autojsonloadurl, function (data, response) {	
						console.log("get auto json ok...["+pos+"]>>"+JSON.stringify(data));
						//console.log("get auto json ok...sch_autoloadmark ="+JSON.stringify(autocmd.sch_autoloadmark));						
						if(!((typeof data) == 'object'))return;
						
						ddjdata = jobjcopy(data);
						if("DOSEA" in ddjdata){
							for(dda in ddjdata.DOSEA.SCHEDULE.EPOS){
								sec02val = Number(ddjdata.DOSEA.SCHEDULE.EPOS[dda].STU.substr(2,4));
								sec02str = "0000"+sec02val.toString(16)
								sec02valhex = ddjdata.DOSEA.SCHEDULE.EPOS[dda].STU.substr(0,2)+sec02str.substr((sec02str.length-4),4);
								ddjdata.DOSEA.SCHEDULE.EPOS[dda].STU = sec02valhex;		
							}
							pdbuffer.jautocmd.DEVLIST.DOSEA = jobjcopy(ddjdata.DOSEA);
							pdbuffer.jautocmd.DEVLIST.DOSEA.STATU=1;
							autocmd.load_autojob("DOSEA",pdbuffer.jautocmd.DEVLIST.DOSEA)
							if("DOSEA" in autocmd.sch_autojob)autocmd.sch_autojob.DOSEA.STATU=1;
							if(!("DOSEA" in autocmd.sch_autoloadmark))autocmd.sch_autoloadmark.DOSEA=0;
						};
						if("DOSEB" in ddjdata){
							for(dda in ddjdata.DOSEB.SCHEDULE.EPOS){
								sec02val = Number(ddjdata.DOSEB.SCHEDULE.EPOS[dda].STU.substr(2,4));
								sec02str = "0000"+sec02val.toString(16)
								sec02valhex = ddjdata.DOSEB.SCHEDULE.EPOS[dda].STU.substr(0,2)+sec02str.substr((sec02str.length-4),4);
								ddjdata.DOSEB.SCHEDULE.EPOS[dda].STU = sec02valhex;		
							}
							pdbuffer.jautocmd.DEVLIST.DOSEB = jobjcopy(ddjdata.DOSEB);
							pdbuffer.jautocmd.DEVLIST.DOSEB.STATU=1;
							autocmd.load_autojob("DOSEB",pdbuffer.jautocmd.DEVLIST.DOSEB)
							if("DOSEB" in autocmd.sch_autojob)autocmd.sch_autojob.DOSEB.STATU=1;
							if(!("DOSEB" in autocmd.sch_autoloadmark))autocmd.sch_autoloadmark.DOSEB=0; 
						};
						if("DOSEC" in ddjdata){
							for(dda in ddjdata.DOSEC.SCHEDULE.EPOS){
								sec02val = Number(ddjdata.DOSEC.SCHEDULE.EPOS[dda].STU.substr(2,4));
								sec02str = "0000"+sec02val.toString(16)
								sec02valhex = ddjdata.DOSEC.SCHEDULE.EPOS[dda].STU.substr(0,2)+sec02str.substr((sec02str.length-4),4);
								ddjdata.DOSEC.SCHEDULE.EPOS[dda].STU = sec02valhex;		
							}
							pdbuffer.jautocmd.DEVLIST.DOSEC = jobjcopy(ddjdata.DOSEC);
							pdbuffer.jautocmd.DEVLIST.DOSEC.STATU=1;
							autocmd.load_autojob("DOSEC",pdbuffer.jautocmd.DEVLIST.DOSEC)
							if("DOSEC" in autocmd.sch_autojob)autocmd.sch_autojob.DOSEC.STATU=1;
							if(!("DOSEC" in autocmd.sch_autoloadmark))autocmd.sch_autoloadmark.DOSEC=0; 
						};
						if("DOSED" in ddjdata){
							for(dda in ddjdata.DOSED.SCHEDULE.EPOS){
								sec02val = Number(ddjdata.DOSED.SCHEDULE.EPOS[dda].STU.substr(2,4));
								sec02str = "0000"+sec02val.toString(16)
								sec02valhex = ddjdata.DOSED.SCHEDULE.EPOS[dda].STU.substr(0,2)+sec02str.substr((sec02str.length-4),4);
								ddjdata.DOSED.SCHEDULE.EPOS[dda].STU = sec02valhex;		
							}
							pdbuffer.jautocmd.DEVLIST.DOSED = jobjcopy(ddjdata.DOSED);
							pdbuffer.jautocmd.DEVLIST.DOSED.STATU=1;
							autocmd.load_autojob("DOSED",pdbuffer.jautocmd.DEVLIST.DOSED)
							if("DOSED" in autocmd.sch_autojob)autocmd.sch_autojob.DOSED.STATU=1;
							if(!("DOSED" in autocmd.sch_autoloadmark))autocmd.sch_autoloadmark.DOSED=0; 
						};
						
						pdbuffer.jautocmd_update(()=>{
								console.log("DOSE A,B,C,D JAUTO Save ok !");
						});//update buffer to Files
						
					}).on("error", function(err) {console.log("err for client");});				
					
				}else if(pos == "OPWAVE"){										
					client.get(autojsonloadurl, function (data, response) {					
						console.log("get auto json ok...["+pos+"]>>"+JSON.stringify(data));
						//jobj = jobjcopy(response)						
						if(!((typeof data) == 'object'))return;
						
						jobj =  jobjcopy(data);
						if("MODE" in jobj){//check is auto JSON format 
							//console.log(">>autox43");
							jobj.STATU=1;
							pdbuffer.jautocmd.DEVLIST[pos] =  jobjcopy(jobj);
							autocmd.load_autojob(pos,pdbuffer.jautocmd.DEVLIST[pos]);//load json to buffer 
							pdbuffer.jautocmd_update(()=>{
									console.log("JAUTO Save ok !");
							});//update buffer to Files
						}
					}).on("error", function(err) {console.log("err for client");});
				}else{						
					client.get(autojsonloadurl, function (data, response) {					
						console.log("get auto json ok...["+pos+"]>>"+JSON.stringify(data));
						//jobj = jobjcopy(response)
						if(!((typeof data) == 'object'))return;
						
						jobj =  jobjcopy(data);
						if("MODE" in jobj){//check is auto JSON format 
							//console.log(">>autox43");
							pdbuffer.jautocmd.DEVLIST[pos] =  jobjcopy(jobj);
							autocmd.load_autojob(pos,pdbuffer.jautocmd.DEVLIST[pos]);//load json to buffer 
							pdbuffer.jautocmd_update(()=>{
									console.log("JAUTO Save ok !");
							});//update buffer to Files
						}
					}).on("error", function(err) {console.log("err for client");});
				}
				
				break;
			default:
				res.json(jobj);
				console.log(cregadd+" not define =>"+cmd);	
				return
		}
		
	});	
});


//=====================================================
router.get('/KEYSETUP',function(req,res,next){	//ok	
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	//let group = Number(req.query.GROUP)
	let group = req.query.GROUP
	let cstu = req.query.STU
	
	//console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	vcmdapipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
		let cmdindex=0;
		let jobj = { "success" : "false" };  
		
		if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
		
		if(pos in pdbuffer.jkeypd.KEYLIB){ //check keypad is define 
			if(group in pdbuffer.jkeypd.KEYLIB[pos]){ //check pos is working 
				if(cmdindex <= 1){
					console.log("OFF/ON Command only by pos = 0000");
					res.json(jobj);
					return;// OFF /ON must POS="0000"
				}
			}else{			
				if(pos != "0000" ){  // OFF /ON must POS="0000"
					if(cmd !="SET"){
						res.json(jobj);
						return;//if new POS must use SET
					}
				}
			}
		}else{
			if(pos =="0000" && group=="0000"){
				if(cmdindex > 1){					
					console.log("OFF/ON Command only by pos = "+pos);
					res.json(jobj);
					return;// OFF /ON must POS="0000"
				}
			}else{					
				console.log("KEYPDA No Define ="+pos);
				res.json(jobj);
				return;
			}
		}
		
		jobj = {  "success" : "true"  }; 
		switch(cmd){//sch subcmd //"f5 20 08 00 02 14 12 34 12 34 13" 14920000A0
			case "OFF":
				res.json(jobj);
				if(pos == "0000")pdbuffer.jkeypd_load(()=>{
					console.log("JAUTO reload ok !");
				});//reload files to buffer
				break
			case "ON":
				res.json(jobj);
				if(pos == "0000")pdbuffer.jkeypd_update(()=>{
					console.log("JAUTO Save ok !");
				});//update buffer to Files
				break
			case "LOAD":			
				jobj = pdbuffer.jkeypd.KEYLIB[pos][group];
				res.json(jobj);	
				break
			case "AUTO"://POS= KEYPAD , GROUP = keyno ,STU=key action(ON/OFF/AUTO) 
				res.json(jobj);
				autocmd.active_keypadjob(pos,group,cstu)
				
				break
			case "SET":
				res.json(jobj);				
				
				//autojsonloadurl = "http://tscloud.opcom.com/Cloud/API/v2/AUTOJSON?SID="+cstu;	
				autojsonloadurl =  pdbuffer.pdjobj.PDDATA.v2keypadjsonloadurl+"?SID="+cstu;			
				console.log("get ok...["+pos+"] link>>"+autojsonloadurl);
				client.get(autojsonloadurl, function (data, response) {					
					console.log("get auto json ok...["+pos+"]>>"+JSON.stringify(data));
					//jobj = jobjcopy(response)
					jobj =  jobjcopy(data);					
					if("STATUS" in jobj){//check is auto JSON format 
						pdbuffer.jkeypd.KEYLIB[pos][group] =  jobjcopy(jobj);
						
						pdbuffer.jkeypd.KEYLIB[pos][group].STATUS.korglist=[]
						for(kk in pdbuffer.jkeypd.KEYLIB[pos][group]){
							if(kk ==  "STATUS")continue;
							pdbuffer.jkeypd.KEYLIB[pos][group].STATUS.korglist.push(kk);
						}
						pdbuffer.jkeypd.KEYLIB[pos][group].STATUS.evncount = pdbuffer.jkeypd.KEYLIB[pos][group].STATUS.korglist.length
						pdbuffer.jkeypd_update(()=>{
							console.log("JAUTO Save ok !");
						});//update buffer to Files
						
					}
					
				}).on("error", function(err) {console.log("err for client");});
				
				break
			default:
				console.log(cregadd+" not define =>"+cmd);	
				return
		}	
				
	});	
});



//=====================================================
router.get('/IPADDMACSETUP',function(req,res,next){	
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = req.query.STU
	
	//console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
		//pos = POS , STU=macadd, GROUP = group + IPADD
		
		let ttbuf = ""	                                    //[0] [1][2][3][4][5][6][7][8][9] [10][11][12][13][14]
		ttbuf = Buffer.from(cmdcode.rs485v050.se1cmd,'hex');//"f5 fd  0c 00 04 e1 12 34 56 78 90   12  00  00 e1"

		let ttbuf2 = ""	   //F5 IPAddr 06 12 04 1F 00 group check
		ttbuf2 = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex');
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working 
		   ipadd = pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		}
		if( (cstu.length <12)||(cstu.substr(0,1)!='8') )return;
		
		switch(cmd){//sch subcmd //"f5 20 08 00 02 14 12 34 12 34 13" 14920000A0
			case "LOAD":
				break
			case "ON"://setup GROUP by IPADD
				console.log("set pos="+pos+" ipadd="+ipadd+" group="+group+"by cmd="+cmd);	
				
				//set group by ipadd
				ttbuf2[1]= ipadd;//ipadd 0x20
				ttbuf2[4]= 0x04;	//subcmd code set		
				ttbuf2[5]= 0x1f;	//### regadd data by ipadd setup
				ttbuf2[6]= 0x00;	//### regadd data by ipadd setup
				ttbuf2[7]= group;	//### regadd data by ipadd setup		  
				
				pdbuffer.totxbuff(ttbuf2);
				break
			case "SET"://setup IPADD by MACADD
				console.log("set pos="+pos+" ipadd="+ipadd+" group="+group+"by cmd="+cmd);	
				
				//set ipadd by macadd 
				ttbuf[1]= 0xfd;//ipadd 
				ttbuf[4]= 0x04;	//subcmd code set		
				ttbuf[5]= 0xe1;	//### regadd data by ipadd setup
				
				ttbuf[6]= Number('0x'+cstu.substr(0,2));//### indexH;	//### macadd 1 byte
				ttbuf[7]= Number('0x'+cstu.substr(2,2));	//### macadd 2 byte
				ttbuf[8]= Number('0x'+cstu.substr(4,2));	//### macadd 3 byte
				ttbuf[9]= Number('0x'+cstu.substr(6,2));	//### macadd 4 byte
				ttbuf[10]= Number('0x'+cstu.substr(8,2));//### macadd 5 byte
				ttbuf[11]= Number('0x'+cstu.substr(10,2));//### macadd 6 byte
				
				ttbuf[12]= 0x00;//### ipadd 1 byte
				ttbuf[13]= ipadd ;//### ipadd 2 byte
				
				pdbuffer.totxbuff(ttbuf);
								
				//set group by ipadd
				ttbuf2[1]= ipadd;   //ipadd 
				ttbuf2[4]= 0x04;	//subcmd code set		
				ttbuf2[5]= 0x1f;	//### regadd data by ipadd setup
				ttbuf2[6]= 0x00;	//### regadd data by ipadd setup
				ttbuf2[7]= group;	//### regadd data by ipadd setup		  
				
				pdbuffer.totxbuff(ttbuf2);
				//ttbuf[6]= Number('0x'+cstu.substr(2,2));//### keycode
				//ttbuf[7]= Number('0x'+cstu.substr(4,2));//### keystu (0:off/1:on)
				
				//ttbuf[8]= Number('0x'+cstu.substr(6,2));//### group H
				//ttbuf[9]= Number('0x'+cstu.substr(8,2));//### group L  				
				break
			default:
				console.log(cregadd+" not define =>"+cmd);	
				return
		}
		
	});	
});




//=====================================================
/* 
router.get('/PDMACDEV',function(req,res,next){	
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	
	//console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
		
				
	});	
});

router.get('/SENSORAUTO',function(req,res,next){	
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	
	//console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
				
	});	
});

router.get('/EVENTID',function(req,res,next){	
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	
	//console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{
				
	});	
});
 */

regcmdchkloop();

//setInterval(function(){			
	//console.log("0xfc command check 0..."+global.arxokflag)
	//treebuff.testflag1 = treebuff.testflag1 +1 ;
	//console.log("regcmd command check 1...",treebuff.testflag1)
	//console.log("regcmd  command show uuid...",pdbuffer.setuuid)
//},3 * 1000 );

module.exports = router;
const vermess = "[opf402 ] start autocmd_gx8 20180701x1 ..."
console.log(vermess);

var EventEmitter = require('events').EventEmitter; 
var event = new EventEmitter(); 
var schedule = require('node-schedule');
var moment = require('moment');

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
var cmdcode = require("./handelrs485x2");


//=== syspub function ===
function jobjcopy(jobj){
	return JSON.parse(JSON.stringify(jobj));	
}

function autoeventcall(callmask){
	event.emit(callmask);
}

event.on('sensorcheck_event', function(){ 
	console.log("sensor check =>"+pdbuffer.jautocmd.AUTOSN);
	if(!("GROWLED" in sch_autojob))reload_autojob();
	for(ii in sch_autojob){
		mpos=ii;
		if(!(mpos in sch_autoloadmark))sch_autoloadmark[mpos]=0;	
		console.log(">>["+mpos+"]auto statu="+sch_autojob[mpos].STATU+" loadmark="+sch_autoloadmark[mpos]);
		if(sch_autojob[mpos].STATU==1){//auto is run enable to event process
			if(sch_autojob[mpos].MODE == 1){ //TIMER
				if(!(mpos in sch_autoloadmark))sch_autoloadmark[mpos]=0;	
				if(sch_autoloadmark[mpos]==0){	
					settimeobj(mpos);//setup mask auto schedule 		
					sch_autoloadmark[mpos]=1;//auto load to times schedule mark flag 0:no 1:load 
					console.log(">>4["+mpos+"]auto time active ="+sch_autoloadmark[mpos]);		
				}				
			}else if(sch_autojob[mpos].MODE == 2){//SCHEDULE
				if(!(mpos in sch_autoloadmark))sch_autoloadmark[mpos]=0;	
				if(sch_autoloadmark[mpos]==0){
					setschobj(mpos);//setup mask auto schedule 		
					sch_autoloadmark[mpos]=1;//auto load to times schedule mark flag 0:no 1:load 
					console.log(">>4["+mpos+"]auto sch active ="+sch_autoloadmark[mpos]);		
				}								
			}else if(sch_autojob[mpos].MODE == 3){//RUNLOOP
				if(!(mpos in sch_autoloadmark))sch_autoloadmark[mpos]=0;	
				if(sch_autoloadmark[mpos]==0){
					sch_autoloadmark[mpos]=1;//auto load to times schedule mark flag 0:no 1:load 
					setrunobj(mpos)		
					console.log(">>4["+mpos+"]auto runloop active ="+sch_autoloadmark[mpos]);	
				}								
			}
		}else if(sch_autojob[mpos].STATU == 0){//auto is disable 
			//console.log(">>5["+mpos+"]auto sch active ="+sch_autoloadmark[mpos]);
			if(sch_autojob[mpos].MODE == 1){			
				if(!(mpos in sch_autoloadmark))sch_autoloadmark[mpos]=0;
				if(sch_autoloadmark[mpos]==1){
					if(sch_autojob[mpos].stid != null)clearTimeout(sch_autojob[mpos].stid);//clear  on/off command 
					sch_autojob[mpos].schobj.cancel();//cancel schdule time active
					sch_autoloadmark[mpos]=0;
					console.log(">>9["+mpos+"]auto sch active ="+sch_autoloadmark[mpos]);				
				}								
			}else if(sch_autojob[mpos].MODE == 2){			
				if(!(mpos in sch_autoloadmark))sch_autoloadmark[mpos]=0;
				if(sch_autoloadmark[mpos]==1){
					if(sch_autojob[mpos].stid != null)clearTimeout(sch_autojob[mpos].stid);//clear  on/off command 
					sch_autojob[mpos].schobj.cancel();//cancel schdule time active
					sch_autoloadmark[mpos]=0;
					console.log(">>9["+mpos+"]auto sch active ="+sch_autoloadmark[mpos]);				
				}				
			}else if(sch_autojob[mpos].MODE == 3){			
				if(!(mpos in sch_autoloadmark))sch_autoloadmark[mpos]=0;
				if(sch_autoloadmark[mpos]==1){	
					if(sch_autojob[mpos].stid != null)clearTimeout(sch_autojob[mpos].stid);//clear  on/off command 	
					sch_autoloadmark[mpos]=0;
					console.log(">>9["+mpos+"]auto runloop active ="+sch_autoloadmark[mpos]);		
				}
			}

		}
	}
});

function scanstart_comm(timearr,stval){
    let chkval = stval
    //let setval = 0
	if(timearr.length == 0)return [0,0,0];	
	if(!("ont" in timearr[0]))return [0,0,0];	
	
    for(tt in timearr){
        if(chkval >= timearr[tt].ont){
            chkval = chkval - timearr[tt].ont
        }else{
            chkval = timearr[tt].ont - chkval
            return [tt,"ont",chkval];
        }
        
        if(chkval >= timearr[tt].offt){
            chkval = chkval - timearr[tt].offt
        }else{
            chkval = timearr[tt].offt - chkval
            return [tt,"offt",chkval];
        }
    }
}

function scan_schedule_chkloop(chklist){
	let chktimehh = new Date().getHours();//var sttime = new Date(Date.now() + 5000)getMonth(), getFullYear(), getDate(), getDat(), getHours(), getMinutes(), 
	let chktimemm = new Date().getMinutes();//"chkloop":[{"stt":"0001","endt":"0900"}],
	let chkmmvalue = chktimehh*60 + chktimemm;
	let chkflagtt =0; 
	
	for(tt in chklist ){
		cendmmval = Number(chklist[tt].endt.substr(0,2))*60 + Number(chklist[tt].endt.substr(2,2));
		if(chkmmvalue < cendmmval ){
			cstmmval = Number(chklist[tt].stt.substr(0,2))*60 + Number(chklist[tt].stt.substr(2,2));
			if(chkmmvalue >= cstmmval ){
				return 1;
			}			
		}
	}
	return 0;
}

function device_auto_client(devlist,devcmd){
	let cmdindex = pdbuffer.pdjobj.subcmd[devcmd]
	//console.log(">>auto_Client ="+JSON.stringify(devlist)+"for "+devcmd+"="+cmdindex+"@time= "+Date());
	for(kk in devlist){
		//console.log("1>>auto_Client ="+JSON.stringify(devlist)+"for "+devcmd+" = "+cmdindex+" = "+kk+" time="+Date());
		dpos = devlist[kk].POS;
		dtype = devlist[kk].CMD;
		dregadd = devlist[kk].STU.substr(0,2);
		//dstu = devlist[kk].STU.substr(0,2);
		dstu = devlist[kk].STU.substr(0,2);
		dgroup = devlist[kk].GROUP;
		
		//console.log("2>>auto_Client pos="+dpos+" cmd="+dtype+" add= "+dregadd+" time="+Date());
		if(Number("0x0"+dregadd)<0x20)continue;
		chkss = device_chek_stu(dpos,dtype,dregadd);
		//console.log("4>>auto_Client pos="+dpos+" cmd="+dtype+" add= "+dregadd+" time="+Date());
		console.log(">>check =>"+cmdindex+" for "+chkss);
		if(cmdindex != chkss){	//check the active command is working to device now?
			//client command 			
			//console.log("3>>auto_Client ="+JSON.stringify(devlist)+"for "+devcmd+" = "+cmdindex+" = "+kk+" time="+Date());
			if(dpos=="E002" && dstu=="58"){
				//console.log(">>reffanloop json="+JSON.stringify(pdbuffer.jautocmd.DEVICESET.REFFAN));
				if(devcmd == "ON"){
					run1_active=pdbuffer.jautocmd.DEVICESET.REFFAN.ONLEV[0];
					run2_active=pdbuffer.jautocmd.DEVICESET.REFFAN.ONLEV[1];
					run4_active=pdbuffer.jautocmd.DEVICESET.REFFAN.ONLEV[2];
					run6_active=pdbuffer.jautocmd.DEVICESET.REFFAN.ONLEV[3];	
				}else if(devcmd == "OFF"){
					run1_active="OFF";
					run2_active="OFF";
					run4_active="OFF";
					run6_active="OFF";	
				}
				
				keyactiveurl = "http://127.0.0.1:3000/"+dtype+'?UUID='+pdbuffer.setuuid+"&POS="+dpos+"&Action="+run1_active+"&STU=580000&GROUP="+dgroup
				console.log(">>reffanloop client active send to =>"+keyactiveurl);
				client.get(keyactiveurl, function (data, response) {
					console.log("keypad client active  ok ...");
				}).on("error", function(err) {console.log("err for client");});			
			
				keyactiveurl = "http://127.0.0.1:3000/"+dtype+'?UUID='+pdbuffer.setuuid+"&POS="+dpos+"&Action="+run2_active+"&STU=570000&GROUP="+dgroup
				console.log(">>reffanloop client active send to =>"+keyactiveurl);
				client.get(keyactiveurl, function (data, response) {
					console.log("keypad client active  ok ...");
				}).on("error", function(err) {console.log("err for client");});				
				
				keyactiveurl = "http://127.0.0.1:3000/"+dtype+'?UUID='+pdbuffer.setuuid+"&POS="+dpos+"&Action="+run4_active+"&STU=560000&GROUP="+dgroup
				console.log(">>reffanloop client active send to =>"+keyactiveurl);
				client.get(keyactiveurl, function (data, response) {
					console.log("keypad client active  ok ...");
				}).on("error", function(err) {console.log("err for client");});				
				
				keyactiveurl = "http://127.0.0.1:3000/"+dtype+'?UUID='+pdbuffer.setuuid+"&POS="+dpos+"&Action="+run6_active+"&STU=550000&GROUP="+dgroup
				console.log(">>reffanloop client active send to =>"+keyactiveurl);
				client.get(keyactiveurl, function (data, response) {
					console.log("keypad client active  ok ...");
				}).on("error", function(err) {console.log("err for client");});
			
			}else if(dpos.substr(0,2)=="A0" && dtype=="LED"){				
				//console.log(">>ledrunloop json="+devcmd+"="+JSON.stringify(pdbuffer.jautocmd.DEVICESET.GROWLED));
				if(dpos == "A001")run_stu = pdbuffer.jautocmd.DEVICESET.GROWLED.ONLEV[0];
				if(dpos == "A008")run_stu = pdbuffer.jautocmd.DEVICESET.GROWLED.ONLEV[0];
				if(dpos == "A021")run_stu = pdbuffer.jautocmd.DEVICESET.GROWLED.ONLEV[0];
				if(dpos == "A028")run_stu = pdbuffer.jautocmd.DEVICESET.GROWLED.ONLEV[0];
				
				runloopactiveurl = "http://127.0.0.1:3000/"+dtype+'?UUID='+pdbuffer.setuuid+"&POS="+dpos+"&Action="+devcmd+"&STU="+run_stu+"&GROUP="+dgroup
				console.log(">>ledrunloop and auto  client active send to =>"+runloopactiveurl);
				client.get(runloopactiveurl, function (data, response) {
					console.log("keypad client active  ok ...");
				}).on("error", function(err) {console.log("err for client");});
				
			}else{
				runloopactiveurl = "http://127.0.0.1:3000/"+dtype+'?UUID='+pdbuffer.setuuid+"&POS="+dpos+"&Action="+devcmd+"&STU="+dstu+"0000"+"&GROUP="+dgroup
				console.log(">>runloop and auto  client active send to =>"+runloopactiveurl);
				client.get(runloopactiveurl, function (data, response) {
					console.log("keypad client active  ok ...");
				}).on("error", function(err) {console.log("err for client");});
				
			}
		}
		
	}
}

function device_auto_client_trige(devlist,devcmd){
	let cmdindex = pdbuffer.pdjobj.subcmd[devcmd]
	//console.log(">>auto_Client ="+JSON.stringify(devlist)+"for "+devcmd+"="+cmdindex+"@time= "+Date());
	for(kk in devlist){
		//console.log("1>>auto_Client ="+JSON.stringify(devlist)+"for "+devcmd+" = "+cmdindex+" = "+kk+" time="+Date());
		dpos = devlist[kk].POS;
		dtype = devlist[kk].CMD;
		dregadd = devlist[kk].STU.substr(0,2);
		dstu = devlist[kk].STU.substr(0,2)+"0000";
		if(devlist[kk].STU.length >= 6)dstu = devlist[kk].STU;
		dgroup = devlist[kk].GROUP;
		//console.log("2>>auto_Client pos="+dpos+" cmd="+dtype+" add= "+dregadd+" time="+Date());
		chkss = device_chek_stu(dpos,dtype,dregadd);
		//console.log("4>>auto_Client pos="+dpos+" cmd="+dtype+" add= "+dregadd+" time="+Date());
		console.log(">>check =>"+cmdindex+" for "+chkss);
		if(cmdindex != chkss){	//check the active command is working to device now?
			//client command 			
			//console.log("3>>auto_Client ="+JSON.stringify(devlist)+"for "+devcmd+" = "+cmdindex+" = "+kk+" time="+Date());
			runloopactiveurl = "http://127.0.0.1:3000/"+dtype+'?UUID='+pdbuffer.setuuid+"&POS="+dpos+"&Action="+devcmd+"&STU="+dstu+"&GROUP="+dgroup
			console.log(">>runloop and auto  client active send to =>"+runloopactiveurl);
			client.get(runloopactiveurl, function (data, response) {
				console.log("keypad client active  ok ...");
			}).on("error", function(err) {console.log("err for client");});
		}
	}
}


function settimeobj(akey){
	let swk=""
	for(ii in sch_autojob[akey].goweek)swk=swk+sch_autojob[akey].goweek[ii]+",";
	rulest = "1 "+sch_autojob[akey].gotime.substr(2,2)+" "+sch_autojob[akey].gotime.substr(0,2)+" * * "+swk.substr(0,swk.length-1)
	//rulest = "1 */2 * * * 0,1,2,3,4,5,6"
	console.log("["+akey+"]="+rulest);
	sch_autojob[akey].schobj =  schedule.scheduleJob( rulest , function(){
		console.log('>>>scheduleCronstyle xx:step ' + new Date());    
		if(sch_autojob[akey].stid != null)clearTimeout(sch_autojob[akey].stid);
		console.log('>>>'+akey);
		sch_autojob[akey].loopcnt=-1;
		sch_autojob[akey].stid = new setTimeout(function(){ f3run(akey,"on")},1000);
		
	}); 
	sch_autojob[akey].stid = new setTimeout(function(){ f3run(akey,"on")},1000);//when setup then start TIME funcion ### 
	sch_autoloadmark[akey]=1;//auto load to times schedule mark flag 0:no 1:load 
}

function setschobj(akey){
	let swk=""
	for(ii in sch_autojob[akey].goweek)swk=swk+sch_autojob[akey].goweek[ii]+",";
	//rulest = " 1 "+sch_autojob[akey].gotime.substr(2,2)+" "+sch_autojob[akey].gotime.substr(0,2)+" * * "+swk.substr(0,swk.length-1)
	rulest = "1 */2 * * * "+swk.substr(0,swk.length-1)
	//rulest = "1 */2 * * * 0,1,2,3,4,5,6"
	console.log(">>["+akey+"]="+rulest);
	
	sch_autojob[akey].schobj =  schedule.scheduleJob( rulest , function(){
		console.log('>>>scheduleCronstyle xx:step ' + new Date());    
		if(sch_autojob[akey].stid != null)clearTimeout(sch_autojob[akey].stid);
		console.log('>>>'+akey);
		sch_autojob[akey].loopcnt=-1;
		sch_autojob[akey].stid = new setTimeout(function(){ f3run(akey,"schcheck")},10);
	}); 

	
	//sch_autoloadmark[akey]=1;//auto load to times schedule mark flag 0:no 1:load 
	
	// dd = new Date()
	// strunmin = dd.getHours()*60 + dd.getMinutes()
	// console.log("today_start time = "+ strunmin);
	// let stinx =0
	// let stcmd = "ont"
	// let stval =0

	// rlist = scanstart_comm(sch_autojob[akey].loop,strunmin);
	// stinx = rlist[0]
	// stcmd = rlist[1]
	// stval = rlist[2]
	
	//console.log('>>>schedule Cronstyle xx:step ' + new Date());  
	//console.log('>>>'+akey+" loop="+JSON.stringify(sch_autojob[akey].loop));
	
	// if(stcmd == "ont"){		
		// device_auto_client(sch_autojob[akey].devpos,"ON")  
		// if(sch_autojob[akey].stid != null)clearTimeout(sch_autojob[akey].stid);
		
		// sch_autojob[akey].loopcnt=stinx;
		// sch_autojob[akey].stid = setTimeout(function(){ f3run(akey,"off")},stval*60*1000);//next command   
		// console.log('1>>>'+akey+" stcmd="+stcmd+" stval="+stval+" loopinx="+stinx);
		
	// }else if(stcmd == "offt"){				
		// device_auto_client(sch_autojob[akey].devpos,"OFF")
		// if(sch_autojob[akey].stid != null)clearTimeout(sch_autojob[akey].stid);
		
		// sch_autojob[akey].loopcnt=stinx;
		// sch_autojob[akey].stid = setTimeout(function(){ f3run(akey,"on")},stval*60*000);//next command  
		// console.log('2>>>'+akey+" stcmd="+stcmd+" stval="+stval+" loopinx="+stinx);
	// }
	
	sch_autoloadmark[akey]=1;//auto load to times schedule mark flag 0:no 1:load 
}

function setrunobj(akey){//startup RUNLOOP
	if(sch_autojob[akey].stid != null)clearTimeout(sch_autojob[akey].stid);//stop and delete  old data 
	//sch_autojob[akey].loopcnt=-1;
	sch_autojob[akey].stid = new setTimeout(function(){f3run(akey,"load")},1000); //start event load 
	sch_autoloadmark[akey]=1;//auto load to times schedule mark flag 0:no 1:load 
}

function device_chek_stu(dpos,dtype,dregadd){//"EPOS": [{"POS":"E002","CMD":"PUMP","STU":"00","GROUP":"00"}]
	console.log(">>check pos="+dpos+" type="+dtype+" regadd="+dregadd);
	if(!(dpos in pdbuffer.pdjobj.PDDATA.Devtab))return 0;
	
	dtypecode = pdbuffer.pdjobj.CMDDATA[dtype][0]
	
	let devstatus = pdbuffer.pdjobj.PDDATA.Devtab[dpos][dtypecode]["chtab"][dregadd].sub;	
	return  devstatus;	
}

function device_load_client(devlist,devcmd){
	let dpos = ""
	let dtype = ""
	let dregadd = ""
	//let dstu = ""
	let dgroup = ""
	for(kk in devlist){
		dpos = devlist[kk].POS;
		dtype = devlist[kk].CMD;
		dregadd = devlist[kk].STU.substr(0,2);
		//dstu = devlist[kk].STU.substr(0,2);
		dgroup = "00";
		//client command 			
		loadloopactiveurl = "http://127.0.0.1:3000/"+dtype+'?UUID='+pdbuffer.setuuid+"&POS="+dpos+"&Action="+devcmd+"&STU="+dregadd+"0000"+"&GROUP="+dgroup
		console.log(">>runloop and auto  client active send to =>"+loadloopactiveurl);
		client.get(loadloopactiveurl, function (data, response) {
			console.log("sensor load client   ok ...");
		}).on("error", function(err) {console.log("err for client");});
	}

}

// auto status = 0x00: auto off , 0x01:auto on ,0x10:buffer active by schedule  
//=== ON/OFF fucnction list ======
function f3run(akey,cmd){
    console.log("["+akey+"] cmd="+cmd);

    switch(akey){
        case "GROWLED":
            if(cmd == "on"){
                sch_autojob[akey].loopcnt++;
                if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				//console.log("["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos));
				pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 1;//### auto
				if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
						device_auto_client(sch_autojob[akey].devpos,"ON")
					}
				}
				//device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.GROWLED.stid = new setTimeout(function(){f3run("GROWLED","off")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].ont*60*1000); 
            }
            if(cmd == "off"){ 
				//console.log("["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)); 
				pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 0;//### auto
				if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
						device_auto_client(sch_autojob[akey].devpos,"OFF");
					}
				}
				//device_auto_client(sch_autojob[akey].devpos,"OFF")
				sch_autojob.GROWLED.stid = new setTimeout(function(){f3run("GROWLED","on")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt*60*1000);         
            }			
            if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				//console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 1;//### auto
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
						if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
							device_auto_client(sch_autojob[akey].devpos,"ON");
						}
					}
					//device_auto_client(sch_autojob[akey].devpos,"ON");
				}else{
					pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 0;//### auto
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
						if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
							device_auto_client(sch_autojob[akey].devpos,"OFF");		
						}
					}
					//device_auto_client(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.GROWLED.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
            }
            break;
        case "CYCLEFAN":
            if(cmd == "on"){
                sch_autojob[akey].loopcnt++;
                if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log(">>["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos)+" loopcnt="+sch_autojob[akey].loopcnt);
				device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.CYCLEFAN.stid = new setTimeout(function(){f3run("CYCLEFAN","off")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].ont*60*1000); 
            }
            if(cmd == "off"){    
                //if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log(">>["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)+" loopcnt="+sch_autojob[akey].loopcnt); 
				device_auto_client(sch_autojob[akey].devpos,"OFF")				
				console.log(">>["+akey+"] devofft="+sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt+" loopcnt="+sch_autojob[akey].loopcnt); 
				sch_autojob.CYCLEFAN.stid = new setTimeout(function(){f3run("CYCLEFAN","on")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt*60*1000);      
            }
						
            if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					device_auto_client(sch_autojob[akey].devpos,"ON");
				}else{
					device_auto_client(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.CYCLEFAN.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
            }
            break;
        case "SPRAY":
            if(cmd == "on"){
                sch_autojob[akey].loopcnt++;
                if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log("["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos));
				device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.SPRAY.stid = new setTimeout(function(){f3run("SPRAY","off")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].ont*60*1000); 
            }
            if(cmd == "off"){   
				console.log("["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)); 
				device_auto_client(sch_autojob[akey].devpos,"OFF")
				sch_autojob.SPRAY.stid = new setTimeout(function(){f3run("SPRAY","on")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt*60*1000);           
            }
            if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					device_auto_client(sch_autojob[akey].devpos,"ON");
				}else{
					device_auto_client(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.SPRAY.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
            }
            break;
        case "REFRESH":
            if(cmd == "on"){
                sch_autojob[akey].loopcnt++;
                if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log(">>["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos)+" loopcnt="+sch_autojob[akey].loopcnt);
				device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.REFRESH.stid = new setTimeout(function(){f3run("REFRESH","off")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].ont*60*1000); 
            }
            if(cmd == "off"){   
                //if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log(">>["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)+" loopcnt="+sch_autojob[akey].loopcnt); 
				device_auto_client(sch_autojob[akey].devpos,"OFF");
				console.log(">>["+akey+"] devofft="+sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt+" loopcnt="+sch_autojob[akey].loopcnt); 
				
				sch_autojob.REFRESH.stid = new setTimeout(function(){f3run("REFRESH","on")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt*60*1000);       
            }
            if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					device_auto_client(sch_autojob[akey].devpos,"ON");
				}else{
					device_auto_client(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.REFRESH.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
            }
            break;
        case "UV":
            if(cmd == "on"){
                sch_autojob[akey].loopcnt++;
                if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log("["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos));
				device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.UV.stid = new setTimeout(function(){f3run("UV","off")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].ont*60*1000); 
            }
            if(cmd == "off"){ 
				console.log("["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)); 
				device_auto_client(sch_autojob[akey].devpos,"OFF")
				sch_autojob.UV.stid = new setTimeout(function(){f3run("UV","on")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt*60*1000);          
            }
            if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					device_auto_client(sch_autojob[akey].devpos,"ON");
				}else{
					device_auto_client(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.UV.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
            }
            break;
        case "PUMP":
            if(cmd == "on"){
                sch_autojob[akey].loopcnt++;
                if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log("["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos));
				device_auto_client(sch_autojob[akey].devpos,"ON")
				
				sch_autojob.PUMP.stid = new setTimeout(function(){f3run("PUMP","off")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].ont*60*1000); 
            }
            if(cmd == "off"){   
				console.log("["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)); 
				device_auto_client(sch_autojob[akey].devpos,"OFF")
				sch_autojob.PUMP.stid = new setTimeout(function(){f3run("PUMP","on")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt*60*1000);          
            }
            if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					device_auto_client(sch_autojob[akey].devpos,"ON");
				}else{
					device_auto_client(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.PUMP.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
            }
            break;
        case "GROWUPDOWN":
            if(cmd == "on"){
                sch_autojob[akey].loopcnt++;
                if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log("["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos));
				device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.GROWUPDOWN.stid = new setTimeout(function(){f3run("GROWUPDOWN","off")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].ont*60*1000); 
            }
            if(cmd == "off"){   
				console.log("["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)); 
				device_auto_client(sch_autojob[akey].devpos,"OFF")
				sch_autojob.GROWUPDOWN.stid = new setTimeout(function(){f3run("GROWUPDOWN","on")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt*60*1000);          
            }
            if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					device_auto_client(sch_autojob[akey].devpos,"ON");
				}else{
					device_auto_client(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.GROWUPDOWN.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
            }
            break;
        case "AIRCON":
            if(cmd == "load"){
				console.log("["+akey+"] sensorpos="+JSON.stringify(sch_autojob[akey].sensorpos));
				console.log("["+akey+"] outsensorpos="+JSON.stringify(sch_autojob[akey].outsensorpos));
				device_load_client(sch_autojob[akey].sensorpos,"LOAD");
				device_load_client(sch_autojob[akey].outsensorpos,"LOAD");
				sch_autojob.AIRCON.stid = new setTimeout(function(){f3run("AIRCON","check")},sch_autojob[akey].loop[0].checkt*60*1000); 
			}
            if(cmd == "check"){				
				let chkval = jobjcopy( loadstudata(akey));//clear checek value buffer
				let ochkval = jobjcopy(loadoutstudata(akey));
				
				console.log("all airtm=>"+JSON.stringify(chkval)+" chkhigh="+sch_autojob[akey].chkhigh +" chklow="+ sch_autojob[akey].chklow )
				//=== RUNLOOP check Login  =======
				if( chkval.vmax > 0){
					if(chkval.vmax >= sch_autojob[akey].chkhigh){
						sch_autojob.AIRCON.stid = new setTimeout(function(){f3run("AIRCON","on")},sch_autojob[akey].loop[0].ont*60*1000); 
						console.log("1>> goto tm on")
					}else if(chkval.vmax <= sch_autojob[akey].chklow){
						sch_autojob.AIRCON.stid = new setTimeout(function(){f3run("AIRCON","on")},sch_autojob[akey].loop[0].ont*60*1000);	
						console.log("2>> goto tm on")						
					}else{
						sch_autojob.AIRCON.stid = new setTimeout(function(){f3run("AIRCON","off")},sch_autojob[akey].loop[0].offt*60*1000);
						console.log("3>> goto tm off")							
					}
				}else{
					sch_autojob.AIRCON.stid = new setTimeout(function(){f3run("AIRCON","load")},sch_autojob[akey].loop[0].loadt*60*1000); 
					console.log("4>> goto tm load")							
				}
			}
            if(cmd == "off"){
				console.log("["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)); //"EPOS": [{"POS":"A001","CMD":"PUMP","GROUP":0}]
				device_auto_client(sch_autojob[akey].devpos,"OFF")
				sch_autojob.AIRCON.stid = new setTimeout(function(){f3run("AIRCON","load")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].loadt*60*1000);
				console.log(">> goto tm load")
			}
            if(cmd == "on"){
				console.log("["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos)); 
				device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.AIRCON.stid = new setTimeout(function(){f3run("AIRCON","load")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].loadt*60*1000);
				console.log(">> goto tm load")
			}
            break;
        case "AIRRH":
            if(cmd == "load"){
				console.log("["+akey+"] sensorpos="+JSON.stringify(sch_autojob[akey].sensorpos));
				console.log("["+akey+"] outsensorpos="+JSON.stringify(sch_autojob[akey].outsensorpos));
				device_load_client(sch_autojob[akey].sensorpos,"LOAD");
				device_load_client(sch_autojob[akey].outsensorpos,"LOAD");
				sch_autojob.AIRRH.stid = new setTimeout(function(){f3run("AIRRH","check")},sch_autojob[akey].loop[0].checkt*60*1000); 
			}
            if(cmd == "check"){
				let chkval = jobjcopy( loadstudata(akey));//clear checek value buffer
				let ochkval = jobjcopy(loadoutstudata(akey));
				
				console.log("all airrrh=>"+JSON.stringify(chkval)+" chkhigh"+sch_autojob[akey].chkhigh +" chklow="+ sch_autojob[akey].chklow )
				//=== RUNLOOP check Login  =======
				if( chkval.vmax > 0){
					if(chkval.vmax >= sch_autojob[akey].chkhigh){
						sch_autojob.AIRRH.stid = new setTimeout(function(){f3run("AIRRH","on")},sch_autojob[akey].loop[0].ont*60*1000); 
						console.log(">> goto rh on")
					}else if(chkval.vmax <= sch_autojob[akey].chklow){
						sch_autojob.AIRRH.stid = new setTimeout(function(){f3run("AIRRH","on")},sch_autojob[akey].loop[0].ont*60*1000);	
						console.log(">> goto rh on")						
					}else{
						sch_autojob.AIRRH.stid = new setTimeout(function(){f3run("AIRRH","off")},sch_autojob[akey].loop[0].offt*60*1000);
						console.log(">> goto rh off")							
					}
				}else{
					sch_autojob.AIRRH.stid = new setTimeout(function(){f3run("AIRRH","load")},sch_autojob[akey].loop[0].loadt*60*1000); 
					console.log(">> goto rh load")							
				}
				
			}
            if(cmd == "off"){
				console.log("["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)); 
				device_auto_client(sch_autojob[akey].devpos,"OFF")
				sch_autojob.AIRRH.stid = new setTimeout(function(){f3run("AIRRH","load")},sch_autojob[akey].loop[0].loadt*60*1000); 
				console.log(">> goto rh load")							
			}
            if(cmd == "on"){
				console.log("["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos)); 
				device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.AIRRH.stid = new setTimeout(function(){f3run("AIRRH","load")},sch_autojob[akey].loop[0].loadt*60*1000); 
				console.log(">> goto rh load")							
			}
            break;
        case "WATERTM":		
            break;
        case "CO2":
            if(cmd == "load"){
				console.log("["+akey+"] sensorpos="+JSON.stringify(sch_autojob[akey].sensorpos));
				console.log("["+akey+"] outsensorpos="+JSON.stringify(sch_autojob[akey].outsensorpos));
				device_load_client(sch_autojob[akey].sensorpos,"LOAD");
				device_load_client(sch_autojob[akey].outsensorpos,"LOAD");
				sch_autojob.CO2.stid = new setTimeout(function(){f3run("CO2","check")},sch_autojob[akey].loop[0].checkt*60*1000); 
			}
            if(cmd == "check"){				
				let chkval = jobjcopy( loadstudata(akey));//clear checek value buffer
				let ochkval = jobjcopy(loadoutstudata(akey));
				
				console.log("all airco2=>"+JSON.stringify(chkval)+" chkhigh"+sch_autojob[akey].chkhigh +" chklow="+ sch_autojob[akey].chklow )
				//=== RUNLOOP check Login  =======
				if( chkval.vmax > 0){
					if(chkval.vmax >= sch_autojob[akey].chkhigh){
						sch_autojob.CO2.stid = new setTimeout(function(){f3run("CO2","off")},sch_autojob[akey].loop[0].ont*60*1000); 
						console.log(">> goto co2 off")
					}else if(chkval.vmax <= sch_autojob[akey].chklow){
						sch_autojob.CO2.stid = new setTimeout(function(){f3run("CO2","off")},sch_autojob[akey].loop[0].ont*60*1000);	
						console.log(">> goto co2 off")						
					}else{
						sch_autojob.CO2.stid = new setTimeout(function(){f3run("CO2","on")},sch_autojob[akey].loop[0].offt*60*1000);
						console.log(">> goto co2 on")							
					}
				}else{
					sch_autojob.CO2.stid = new setTimeout(function(){f3run("CO2","load")},sch_autojob[akey].loop[0].loadt*60*1000); 
					console.log(">> goto co2 load")							
				}
				
			}
            if(cmd == "off"){
				console.log("["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos));  
				device_auto_client(sch_autojob[akey].devpos,"OFF")				
				sch_autojob.CO2.stid = new setTimeout(function(){f3run("CO2","load")},sch_autojob[akey].loop[0].loadt*60*1000); 
				console.log(">> goto co2 load")		
			}
            if(cmd == "on"){
				console.log("["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos));
				device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.CO2.stid = new setTimeout(function(){f3run("CO2","load")},sch_autojob[akey].loop[0].loadt*60*1000); 
				console.log(">> goto co2 load")			
			}
            break;
        case "OPWAVE":
			if(cmd == "on"){
                sch_autojob[akey].loopcnt++;
                if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log(">>["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos)+" loopcnt="+sch_autojob[akey].loopcnt);
				device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.OPWAVE.stid = new setTimeout(function(){f3run("OPWAVE","off")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].ont*60*1000); 
				
			};
			if(cmd == "off"){
                //if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log(">>["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)+" loopcnt="+sch_autojob[akey].loopcnt); 
				device_auto_client(sch_autojob[akey].devpos,"OFF")				
				console.log(">>["+akey+"] devofft="+sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt+" loopcnt="+sch_autojob[akey].loopcnt); 
				sch_autojob.OPWAVE.stid = new setTimeout(function(){f3run("OPWAVE","on")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt*60*1000);   
				
			};
			if(cmd == "schcheck"){
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					device_auto_client(sch_autojob[akey].devpos,"ON");
				}else{
					device_auto_client(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.OPWAVE.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
				
				ssipcam106 = "http://opcom:88888888@192.168.5.106:8006/cgi/ptz_set?Channel=1&Group=PTZCtrlInfo&AutoScan=1"
				ssipcam107 = "http://opcom:88888888@192.168.5.107:8007/cgi/ptz_set?Channel=1&Group=PTZCtrlInfo&AutoScan=1"
				ssipcam108 = "http://opcom:88888888@192.168.5.108:8008/cgi/ptz_set?Channel=1&Group=PTZCtrlInfo&AutoScan=1"
				ssipcam109 = "http://opcom:88888888@192.168.5.109:8009/cgi/ptz_set?Channel=1&Group=PTZCtrlInfo&AutoScan=1"
					//ipcam auto turn run command 
				client.get(ssipcam106, function (data, response) {console.log("ipcam 106 ok ...");}).on("error", function(err) {console.log("err for client");});
				client.get(ssipcam107, function (data, response) {console.log("ipcam 107 ok ...");}).on("error", function(err) {console.log("err for client");});
				client.get(ssipcam108, function (data, response) {console.log("ipcam 108 ok ...");}).on("error", function(err) {console.log("err for client");});
				client.get(ssipcam109, function (data, response) {console.log("ipcam 109 ok ...");}).on("error", function(err) {console.log("err for client");});
			};
            break;
        case "DOSE":
            break;
        case "DOSEA":
			if(cmd == "on"){};
			if(cmd == "off"){};
			if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					device_auto_client_trige(sch_autojob[akey].devpos,"ON");
				}else{
					device_auto_client_trige(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.DOSEA.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
			};
            break;
        case "DOSEB":
			if(cmd == "on"){};
			if(cmd == "off"){};
			if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					device_auto_client_trige(sch_autojob[akey].devpos,"ON");
				}else{
					device_auto_client_trige(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.DOSEB.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
				
			};
            break;
        case "DOSEC":
			if(cmd == "on"){};
			if(cmd == "off"){};
			if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					device_auto_client_trige(sch_autojob[akey].devpos,"ON");
				}else{
					device_auto_client_trige(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.DOSEC.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
				
			};
            break;
        case "DOSED":
			if(cmd == "on"){};
			if(cmd == "off"){};
			if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					device_auto_client_trige(sch_autojob[akey].devpos,"ON");
				}else{
					device_auto_client_trige(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.DOSED.stid = new setTimeout(function(){f3run(akey,"schcheck")},2*60*1000);//
				
			};
            break;
        case "ECDOSE"://"ECDOSE","PHDOSE"
			if(cmd == "load"){				
			
				sch_autojob.ECDOSE.stid = new setTimeout(function(){f3run("ECDOSE","check")},sch_autojob[akey].loop[0].checkt*60*1000); 
				
			};
			if(cmd == "check"){
				
				sch_autojob.ECDOSE.stid = new setTimeout(function(){f3run("ECDOSE","on")},sch_autojob[akey].loop[0].checkt*60*1000);				
			};
			if(cmd == "on"){
				sch_autojob.ECDOSE.stid = new setTimeout(function(){f3run("ECDOSE","off")},sch_autojob[akey].loop[0].checkt*60*1000); 				
			};
			if(cmd == "off"){
				sch_autojob.ECDOSE.stid = new setTimeout(function(){f3run("ECDOSE","load")},sch_autojob[akey].loop[0].checkt*60*1000); 				
			};
			if(cmd == "schcheck"){
				
			};
            break;
        case "PHDOSE":
			if(cmd == "load"){				
				sch_autojob.PHDOSE.stid = new setTimeout(function(){f3run("PHDOSE","check")},sch_autojob[akey].loop[0].checkt*60*1000); 
			};
			if(cmd == "check"){
				sch_autojob.PHDOSE.stid = new setTimeout(function(){f3run("PHDOSE","on")},sch_autojob[akey].loop[0].checkt*60*1000);				
			};
			if(cmd == "on"){
				sch_autojob.PHDOSE.stid = new setTimeout(function(){f3run("PHDOSE","off")},sch_autojob[akey].loop[0].checkt*60*1000); 				
			};
			if(cmd == "off"){
				sch_autojob.PHDOSE.stid = new setTimeout(function(){f3run("PHDOSE","load")},sch_autojob[akey].loop[0].checkt*60*1000); 				
			};
			if(cmd == "schcheck"){};
            break;
        case "LEDHI":
            if(cmd == "on"){
                sch_autojob[akey].loopcnt++;
                if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log("["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos));
				pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 1;//### auto
				if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
						device_auto_client(sch_autojob[akey].devpos,"ON");
					}
				}
				//device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.LEDHI.stid = new setTimeout(function(){f3run("LEDHI","off")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].ont*60*1000); 
            }
            if(cmd == "off"){ 
				console.log("["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)); 
				pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 0;//### auto
				if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
						device_auto_client(sch_autojob[akey].devpos,"OFF");
					}
				}
				//device_auto_client(sch_autojob[akey].devpos,"OFF")
				sch_autojob.LEDHI.stid = new setTimeout(function(){f3run("LEDHI","on")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt*60*1000);         
            }			
            if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 1;//### auto
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
						if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
							device_auto_client(sch_autojob[akey].devpos,"ON");
						}
					}
					//device_auto_client(sch_autojob[akey].devpos,"ON");
				}else{
					pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 0;//### auto
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
						if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
							device_auto_client(sch_autojob[akey].devpos,"OFF");
						}
					}
					//device_auto_client(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.LEDHI.stid = new setTimeout(function(){f3run("LEDHI","schcheck")},2*60*1000);//
            }
            break;
        case "LEDLOW":
            if(cmd == "on"){
                sch_autojob[akey].loopcnt++;
                if( sch_autojob[akey].loopcnt >=  sch_autojob[akey].loop.length)sch_autojob[akey].loopcnt=0;
				console.log("["+akey+"] devon="+JSON.stringify(sch_autojob[akey].devpos));
				pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 1;//### auto
				if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
						device_auto_client(sch_autojob[akey].devpos,"ON");
					}
				}
				//device_auto_client(sch_autojob[akey].devpos,"ON")
				sch_autojob.LEDLOW.stid = new setTimeout(function(){f3run("LEDLOW","off")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].ont*60*1000); 
            }
            if(cmd == "off"){ 
				console.log("["+akey+"] devoff="+JSON.stringify(sch_autojob[akey].devpos)); 
				pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 0;//### auto
				if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
						device_auto_client(sch_autojob[akey].devpos,"OFF");
					}
				}
				//device_auto_client(sch_autojob[akey].devpos,"OFF")
				sch_autojob.LEDLOW.stid = new setTimeout(function(){f3run("LEDLOW","on")},sch_autojob[akey].loop[sch_autojob[akey].loopcnt].offt*60*1000);         
            }			
            if(cmd == "schcheck"){
				//console.log("["+akey+"] schloop="+JSON.stringify(sch_autojob[akey].devpos));
				console.log("["+akey+"] schloop");
				chkflag = scan_schedule_chkloop(sch_autojob[akey].chkloop);
				if(chkflag == 1){
					pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 1;//### auto
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
						if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
							device_auto_client(sch_autojob[akey].devpos,"ON");
						}
					}
					//device_auto_client(sch_autojob[akey].devpos,"ON");
				}else{
					pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 0;//### auto
					if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU==1){//### tmauto en 
						if(pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDAUTOEN==1){						
							device_auto_client(sch_autojob[akey].devpos,"OFF");
						}
					}
					//device_auto_client(sch_autojob[akey].devpos,"OFF");					
				}
				sch_autojob.LEDLOW.stid = new setTimeout(function(){f3run("LEDLOW","schcheck")},2*60*1000);//
            }
            break;
        default:
            return 	
    }	
}

function loadstudata(akey){
	let rhchkval = [];//clear checek value buffer
	let ksspos = "";
	let typecmd = "";
	let typedevreg = "";
	let loadval = 0;
	let vobj = {"vmax" :0 , "vmin": 0};
	for(kss in  sch_autojob[akey].sensorpos){
		ksspos = sch_autojob[akey].sensorpos[kss].POS
		kssfuncmd = sch_autojob[akey].sensorpos[kss].CMD
		console.log(">>index="+kss+">>pos="+ksspos+">>CMDDATA="+sch_autojob[akey].type)
		if(ksspos in pdbuffer.pdjobj.PDDATA.Devtab){
			//typecmd = pdbuffer.pdjobj.CMDDATA[sch_autojob[akey].type][0]
			typecmd = pdbuffer.pdjobj.CMDDATA[kssfuncmd][0]
			typedevreg = sch_autojob[akey].sensorpos[kss].STU.substr(0,2) //v2 device 
			//console.log(">>index="+kss+">>pos="+ksspos+">>"+typecmd)
			loadval = pdbuffer.pdjobj.PDDATA.Devtab[ksspos][typecmd]["chtab"][typedevreg].stu;
			if(loadval > 0 && loadval <5000)rhchkval.push(loadval);
		}
	}
	if(rhchkval.length > 0){
		vobj.vmax = Math.max.apply(null, rhchkval);
		vobj.vmin = Math.min.apply(null, rhchkval);
	}else{
		vobj.vmax = 0;
		vobj.vmin = 0;
	}
	return vobj;
	
	//return rhchkval;
}

function loadoutstudata(akey){
	let outrhchkval=[];//clear checek value buffer
	let outksspos = "";
	let typecmd = "";
	let typedevreg = "";
	let oloadval = 0;
	let vobj = {"vmax" :0 , "vmin": 0};
	for(outkss in  sch_autojob[akey].outsensorpos){
		outksspos = sch_autojob[akey].outsensorpos[outkss].POS
		outkssfuncmd = sch_autojob[akey].outsensorpos[outkss].CMD
		
		//console.log(">>index="+outkss+">>pos="+outksspos)
		if(outksspos in pdbuffer.pdjobj.PDDATA.Devtab){
			//typecmd = pdbuffer.pdjobj.CMDDATA[sch_autojob[akey].type][0]
			typecmd = pdbuffer.pdjobj.CMDDATA[outkssfuncmd][0]
			typedevreg = sch_autojob[akey].sensorpos[kss].STU.substr(0,2) //v2 device 
			//console.log(">>index="+outkss+">>pos="+outksspos+">>"+typecmd)
			oloadval = pdbuffer.pdjobj.PDDATA.Devtab[outksspos][typecmd]["chtab"][typedevreg].stu;
			if(oloadval > 0 && oloadval <5000)outrhchkval.push(oloadval);
		}
	}
	if(outrhchkval.length > 0){
		vobj.vmax = Math.max.apply(null, outrhchkval);
		vobj.vmin = Math.min.apply(null, outrhchkval);
	}else{
		vobj.vmax = 0;
		vobj.vmin = 0;
	}
	return vobj;
	//return outrhchkval;
}

//=== auto time schedule funcion ======
var sch_autojob={}
var sch_autoloadmark={}//排程載入flag 0:未載入 1:已載入

var jobitem = { 
		"gotime":0,
		"goweek":[0,1,2,3,4,5,6],
		"schobj":0,stid:null,
		"loop":[{"ont":5,"offt":5}],
		"chkloop":[{"stt":"0001","endt":"0900"}],
		"loopcnt":0 ,
		"devpos":[] 
	};
	
var timeloopitem = {"ont":5,"offt":5};
var chkloopitem = {"stt":"0001","endt":"0900"};

var runjobitem = {		
		"schobj":0,stid:null,
		"loop":[{"ont":1,"offt":1,"loadt":1,"checkt":1}],
		"loopcnt":0 ,		
		"devpos":[],
		"sensorpos":[],
		"outsensorpos":[],
		"limlow":0,
		"limhigh":0,
		"chklow":0,
		"chkhigh":0,
		"type":"TEMPERATURE"
	}

	
//MODE =0 NC pass , 1: TIMER , 2:SCHEDULE , 3:RUNLOOP 
function load_autojob(akey,jautodata){
	let timeitem =  {"ont":5,"offt":5};
	console.log(">>"+JSON.stringify(jautodata));
	if( jautodata.MODE == 1){//TIMER
		if(!("TIMER" in jautodata))return;
		if(!(akey in sch_autojob))sch_autojob[akey]={}
		sch_autojob[akey]= jobjcopy(jobitem);
		
		sch_autojob[akey].MODE = 1 //jautodata.MODE;
		sch_autojob[akey].STATU = jautodata.STATU;	
		sch_autojob[akey].SENSOR_CONTROL = jautodata.SENSOR_CONTROL;
		
		sch_autojob[akey].gotime = jautodata.TIMER.ST
		sch_autojob[akey].goweek = [0,1,2,3,4,5,6]
		sch_autojob[akey].loop = []
		
		timeitem.ont = Number(jautodata.TIMER.ON.substr(0,2))*60+Number(jautodata.TIMER.ON.substr(2,2))
		timeitem.offt = Number(jautodata.TIMER.OFF.substr(0,2))*60+Number(jautodata.TIMER.OFF.substr(2,2))
		sch_autojob[akey].loop[0]= jobjcopy(timeitem);
		sch_autojob[akey].loopcnt = 0
		sch_autojob[akey].devpos = jobjcopy(jautodata.TIMER.EPOS);
		// if(sch_autojob[akey].STATU == 1){
			// setschobj(akey);
		// }
		sch_autoloadmark[akey]=0;//auto load to times schedule mark flag 0:no 1:load 
		console.log("load ["+akey+"]="+JSON.stringify(sch_autojob[akey]));		
	}else if(jautodata.MODE == 2){//SCHEDULE
		if(!("SCHEDULE" in jautodata))return;
		if(!(akey in sch_autojob))sch_autojob[akey]={}	
		sch_autojob[akey]= jobjcopy(jobitem);
		
		sch_autojob[akey].MODE = 2 //jautodata.MODE;
		sch_autojob[akey].STATU = jautodata.STATU;			
		sch_autojob[akey].SENSOR_CONTROL = jautodata.SENSOR_CONTROL;	
		
		sch_autojob[akey].gotime = "0001";
		//sch_autojob[akey].goweek = [0,1,2,3,4,5,6];//Number('0x'+cstu)
		sch_autojob[akey].goweek = [];
		//nwk=Number('0x'+jautodata.SCHEDULE.WEEK.substr(0,2));
		//if(nwk & 0x01)sch_autojob[akey].goweek.push(0);
		//if(nwk & 0x02)sch_autojob[akey].goweek.push(1);
		//if(nwk & 0x04)sch_autojob[akey].goweek.push(2);
		//if(nwk & 0x08)sch_autojob[akey].goweek.push(3);
		//if(nwk & 0x10)sch_autojob[akey].goweek.push(4);
		//if(nwk & 0x20)sch_autojob[akey].goweek.push(5);
		//if(nwk & 0x40)sch_autojob[akey].goweek.push(6);	
		//WEEK = "01111111" [][6][5][4][3][2][1][0]
		chm6 = jautodata.SCHEDULE.WEEK.substr(1,1);	
		chm5 = jautodata.SCHEDULE.WEEK.substr(2,1);	
		chm4 = jautodata.SCHEDULE.WEEK.substr(3,1);	
		chm3 = jautodata.SCHEDULE.WEEK.substr(4,1);	
		chm2 = jautodata.SCHEDULE.WEEK.substr(5,1);	
		chm1 = jautodata.SCHEDULE.WEEK.substr(6,1);	
		chm0 = jautodata.SCHEDULE.WEEK.substr(7,1);	
		if(chm0 == '1')sch_autojob[akey].goweek.push(0);
		if(chm1 == '1')sch_autojob[akey].goweek.push(1);
		if(chm2 == '1')sch_autojob[akey].goweek.push(2);
		if(chm3 == '1')sch_autojob[akey].goweek.push(3);
		if(chm4 == '1')sch_autojob[akey].goweek.push(4);
		if(chm5 == '1')sch_autojob[akey].goweek.push(5);
		if(chm6 == '1')sch_autojob[akey].goweek.push(6);	
		
		sch_autojob[akey].devpos = jobjcopy(jautodata.SCHEDULE.EPOS);
				
		//=== setup the schedule to time loop ====
		let simst_time = 0;
		let simend_time = 23*60+59;//by min count
		let xston = 0;
		let xstoff = 0;
		let simoutitem = {"ont":0,"offt":0};	
		let chksimitem = {"stt":"0001","endt":"0900"};
		
		sch_autojob[akey].loop = [];
		sch_autojob[akey].chkloop = [];
		
		for(ii in jautodata.SCHEDULE.ONLOOP){
			jsttt = jautodata.SCHEDULE.ONLOOP[ii];
			console.log("["+ii+"]>>"+jsttt);
			
			
			chksimitem.stt = jsttt.substr(0,4);
			chksimitem.endt  = jsttt.substr(4,4);
			sch_autojob[akey].chkloop.push(jobjcopy(chksimitem));//###
			
			xston = Number(jsttt.substr(0,2))*60+ Number(jsttt.substr(2,2));
			xstoff = Number(jsttt.substr(4,2))*60+ Number(jsttt.substr(6,2));
			if(ii == 0 ){
				simoutitem.ont  = 0;
				simoutitem.offt = xston - simst_time;
				sch_autojob[akey].loop.push(jobjcopy(simoutitem));//###
				if(xstoff > xston ){
					simoutitem.ont  =  xstoff - xston ;

				}else{            
					simoutitem.ont  =  0;
				}
				simoutitem.offt = xstoff;
			}else if(ii == jautodata.SCHEDULE.ONLOOP.length-1){        
				if( xston > simoutitem.offt ){
					simoutitem.offt  =  xston - simoutitem.offt ;
				}else{            
					simoutitem.offt  = 1;
				}        
				sch_autojob[akey].loop.push(jobjcopy(simoutitem));//###
				
				if(xstoff > xston ){
					simoutitem.ont  =  xstoff - xston ;

				}else{            
					simoutitem.ont  =  0;
				}
				simoutitem.offt = simend_time - xstoff;
				sch_autojob[akey].loop.push(jobjcopy(simoutitem));//###
				

			}else{
				
				if( xston > simoutitem.offt ){
					simoutitem.offt  =  xston - simoutitem.offt ;
				}else{            
					simoutitem.offt  = 1;
				}        
				sch_autojob[akey].loop.push(jobjcopy(simoutitem));//###
				
				if(xstoff > xston ){
					simoutitem.ont  =  xstoff - xston ;

				}else{            
					simoutitem.ont  =  0;
				}
				simoutitem.offt = xstoff;
			}			
		}
		
		
		// for(ii in jautodata.SCHEDULE.ONLOOP){
			// timeitem.ont= jautodata.SCHEDULE.ONLOOP[ii].substr(0,4);
			// timeitem.offt= jautodata.SCHEDULE.ONLOOP[ii].substr(4,4);
			// sch_autojob[akey].loop.push(jobjcopy(timeitem));
		// }		
		sch_autojob[akey].loopcnt = 0
		
		sch_autoloadmark[akey]=0;//auto load to times schedule mark flag 0:no 1:load 
		console.log(">>load ["+akey+"]="+JSON.stringify(sch_autojob[akey]));		
	}else if(jautodata.MODE == 3){//RUNLOOP
		if(!("RUNLOOP" in jautodata))return;
		if(!(akey in sch_autojob))sch_autojob[akey]={}	
		sch_autojob[akey]= jobjcopy(runjobitem);
		
		sch_autojob[akey].MODE = 3 //jautodata.MODE;
		sch_autojob[akey].STATU = jautodata.STATU;			
		sch_autojob[akey].SENSOR_CONTROL = jautodata.SENSOR_CONTROL;
		
		sch_autojob[akey].loop = [{"ont":1,"offt":1,"loadt":1,"checkt":1}]
		sch_autojob[akey].devpos = jobjcopy(jautodata.RUNLOOP.EPOS);
		sch_autojob[akey].sensorpos = jobjcopy(jautodata.RUNLOOP.SENSORPOS);		
		sch_autojob[akey].outsensorpos = jobjcopy(jautodata.RUNLOOP.OUTSENSORPOS);
		
		for(kk in jautodata.RUNLOOP){
			if(kk.indexOf('!') > 0 ){
				ll = kk.split("!");
				sch_autojob[akey].type = ll[0]
				console.log(">>akey="+akey+">>kk="+kk+">>type="+sch_autojob[akey].type);
				sch_autojob[akey].chklow  = Number(jautodata.RUNLOOP[kk].substr(0,4))
				sch_autojob[akey].chkhigh = Number(jautodata.RUNLOOP[kk].substr(4,4))
				console.log(">>chklow="+sch_autojob[akey].chklow+">>chkhigh="+sch_autojob[akey].chkhigh);
				if(sch_autojob[akey].type in pdbuffer.jautocmd.LIMITPAM){
					sch_autojob[akey].limlow = pdbuffer.jautocmd.LIMITPAM[sch_autojob[akey].type].limlow 	//jautodata.
					sch_autojob[akey].limhigh = pdbuffer.jautocmd.LIMITPAM[sch_autojob[akey].type].limhigh 	//jautodata.
				}else{
					sch_autojob[akey].limlow = 0 	//jautodata.
					sch_autojob[akey].limhigh = 0  	//jautodata.
				}
				console.log(">>limlow="+sch_autojob[akey].limlow+">>limhigh="+sch_autojob[akey].limhigh);
			}
		}		
	}
}

function reload_autojob(){
	for(jj in pdbuffer.jautocmd.DEVLIST){
		load_autojob(jj,pdbuffer.jautocmd.DEVLIST[jj]);
	}
	console.log("reload auto to buffer ok !");
}

//=== keypad AUTO POS active  === 
const kactivecode = {"OFF":0,"ON":1,"AUTO":2}
function autopushkeypad(kpos,kcode,kactive){
	let ttbuf = ""
	if(kpos == "KEYPAD0"){// KEYPAD0 active update to KEYPAD2 auto mode display LED cmdcode.r485subcmd[]
		ttbuf = Buffer.from(cmdcode.rs485v050.s11cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6:keycode][7:status][10]"f5 00 06 00 03 12 12 34 11"	
		ttbuf[4]= 0x03;//set auto command display
		ttbuf[5]= 0x12;//for KEYPAD2 display
		switch(kcode){
			case "K001":
					if(!(kactive in pdbuffer.jkeypd.KEYLIB.KEYPAD2.K091.EVENT))return;
					ttbuf[6]= 0x91;
					ttbuf[7]= kactivecode[kactive];
					break;
			case "K002":
					return;
					break;
			case "K003":
					if(!(kactive in pdbuffer.jkeypd.KEYLIB.KEYPAD2.K093.EVENT))return;
					ttbuf[6]= 0x93;
					ttbuf[7]= kactivecode[kactive];
					break;
			case "K004":
					if(!(kactive in pdbuffer.jkeypd.KEYLIB.KEYPAD2.K094.EVENT))return;
					ttbuf[6]= 0x94;
					ttbuf[7]= kactivecode[kactive];
					break;
			case "K005":
					if(!(kactive in pdbuffer.jkeypd.KEYLIB.KEYPAD2.K094.EVENT))return;
					ttbuf[6]= 0x94;
					ttbuf[7]= kactivecode[kactive];
					break;
			default:
				return 	
		}
		
		pdbuffer.totxbuff(ttbuf);
	}
}

const keypad1x8list = {
	"K012":"91" ,"K017":"92" ,"K004":"93"  ,"K005":"94",
	"K003":"98" ,"K006":"97" ,"K007":"96"  ,"K001":"95" 	
}

function active_keypadjob(kpos,kcode,kactive){
	console.log(">>"+kpos+">>"+kcode+">>"+kactive);
	if(!(kpos in pdbuffer.jkeypd.KEYLIB))return;
	if(!(kcode in pdbuffer.jkeypd.KEYLIB[kpos]))return;
	if(!(kactive in pdbuffer.jkeypd.KEYLIB[kpos][kcode].EVENT))return;
	
	for(inx in pdbuffer.jkeypd.KEYLIB[kpos][kcode].STATUS.stmask){
		if(kactive == pdbuffer.jkeypd.KEYLIB[kpos][kcode].STATUS.stmask[inx]){
			pdbuffer.jkeypd.KEYLIB[kpos][kcode].STATUS.stpt = inx;
			console.log(">>key= set index to mode="+kactive+" stpt="+inx);
			break;
		}
	} 
	
	let ttbuf = ""
	let kjob = jobjcopy(pdbuffer.jkeypd.KEYLIB[kpos][kcode]["EVENT"][kactive]);
	let keyactiveurl = ""
	let run_cmd = ""
	let run_pos =""
	let run_active = ""
	let run_stu = ""
	let run_group = ""
	
	if(kpos == "KEYPAD0" && kcode =="K003" ){//mask the LED on/OFF control status by autotmloop check ###
		if(kactive == "AUTO")pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 0;//### auto
		if(kactive == "ON")pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 1;//### auto
		if(kactive == "HI")pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 0;//### auto
		if(kactive == "LOW")pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 0;//### auto
		if(kactive == "OFF")pdbuffer.jautocmd.WATERLOOP.autotmloop.CHKLOOP.CHKVALUE.LEDDRVSTU = 0;//### auto
	}
	
	//http://tscloud.opcom.com/Cloud/API/v2/KeypadUpdate?ID=OFA1C0044826BEF87AEA0481&KeypadID=KEYPAD0&Index=K004&value=ON
	console.log(">>"+kactive+"="+JSON.stringify(kjob));
	for(cc in kjob){
		run_cmd = kjob[cc].CMD;
		run_pos = kjob[cc].POS;
		run_active = kjob[cc].Action;
		run_stu = kjob[cc].STU;
		run_group = kjob[cc].GROUP;
		
		if(run_pos=="E002" && run_stu=="580000" ){// setup the ref fan set on/off
			if(run_active == "ON"){
				run1_active=pdbuffer.jautocmd.DEVICESET.REFFAN.ONLEV[0];
				run2_active=pdbuffer.jautocmd.DEVICESET.REFFAN.ONLEV[1];
				run4_active=pdbuffer.jautocmd.DEVICESET.REFFAN.ONLEV[2];
				run6_active=pdbuffer.jautocmd.DEVICESET.REFFAN.ONLEV[3];	
			}else if(run_active == "OFF"){
				run1_active="OFF";
				run2_active="OFF";
				run4_active="OFF";
				run6_active="OFF";	
			}
			
			keyactiveurl = "http://127.0.0.1:3000/"+run_cmd+'?UUID='+pdbuffer.setuuid+"&POS="+run_pos+"&Action="+run1_active+"&STU=580000&GROUP="+run_group
			console.log(">>keypad client active send to =>"+keyactiveurl);
			client.get(keyactiveurl, function (data, response) {
				console.log("keypad client active  ok ...");
			}).on("error", function(err) {console.log("err for client");});
		
		
			keyactiveurl = "http://127.0.0.1:3000/"+run_cmd+'?UUID='+pdbuffer.setuuid+"&POS="+run_pos+"&Action="+run2_active+"&STU=570000&GROUP="+run_group
			console.log(">>keypad client active send to =>"+keyactiveurl);
			client.get(keyactiveurl, function (data, response) {
				console.log("keypad client active  ok ...");
			}).on("error", function(err) {console.log("err for client");});
			
			
			keyactiveurl = "http://127.0.0.1:3000/"+run_cmd+'?UUID='+pdbuffer.setuuid+"&POS="+run_pos+"&Action="+run4_active+"&STU=560000&GROUP="+run_group
			console.log(">>keypad client active send to =>"+keyactiveurl);
			client.get(keyactiveurl, function (data, response) {
				console.log("keypad client active  ok ...");
			}).on("error", function(err) {console.log("err for client");});
			
			
			keyactiveurl = "http://127.0.0.1:3000/"+run_cmd+'?UUID='+pdbuffer.setuuid+"&POS="+run_pos+"&Action="+run6_active+"&STU=550000&GROUP="+run_group
			console.log(">>keypad client active send to =>"+keyactiveurl);
			client.get(keyactiveurl, function (data, response) {
				console.log("keypad client active  ok ...");
			}).on("error", function(err) {console.log("err for client");});
			
			continue;
		}
		
		if(run_cmd == "LED" && run_active =="ON" ){// setup the LED lev set
			if(run_pos == "A001")run_stu = pdbuffer.jautocmd.DEVICESET.GROWLED.ONLEV[0];
			if(run_pos == "A008")run_stu = pdbuffer.jautocmd.DEVICESET.GROWLED.ONLEV[0];
			if(run_pos == "A021")run_stu = pdbuffer.jautocmd.DEVICESET.GROWLED.ONLEV[0];
			if(run_pos == "A028")run_stu = pdbuffer.jautocmd.DEVICESET.GROWLED.ONLEV[0];
		}
		
		//console.log(">>["+cc+"]"+run_cmd)
		keyactiveurl = "http://127.0.0.1:3000/"+run_cmd+'?UUID='+pdbuffer.setuuid+"&POS="+run_pos+"&Action="+run_active+"&STU="+run_stu+"&GROUP="+run_group
		console.log(">>keypad client active send to =>"+keyactiveurl);
		client.get(keyactiveurl, function (data, response) {
			console.log("keypad client active  ok ...");
		}).on("error", function(err) {console.log("err for client");});
	}
	
	//pdbuffer.jkeypd.KEYLIB[kpos][kcode].STATUS.stpt = kactive;//active ok 	
			
//if(run_cmd == "REGCMD/KEYSETUP"){
	updatekeysstuatusurl= pdbuffer.pdjobj.PDDATA.v2keypadstatusupdateurl+"?ID="+pdbuffer.setuuid+"&KeypadID="+kpos+"&Index="+kcode+"&value="+kactive;
	console.log("sudo active update to webui =>"+updatekeysstuatusurl);
	client.get(updatekeysstuatusurl,cargs, function (data, response) {
		console.log("keypad active update to webui   ok ...");
	}).on("error", function(err) {console.log("err for client");}).on('requestTimeout', function (req) {req.abort();});

	//autopushkeypad(kpos,kcode,kactive);
	
	updatekeysstuatusurl220 = "http://192.168.5.220/API/v2/KeypadUpdate.php"+"?ID="+pdbuffer.setuuid+"&KeypadID="+kpos+"&Index="+kcode+"&value="+kactive;
	console.log("sudo active update to webui =>"+updatekeysstuatusurl220);
	client.get(updatekeysstuatusurl220,cargs, function (data, response) {
		console.log("keypad active update to webui   ok ...");
	}).on("error", function(err) {console.log("err for client");}).on('requestTimeout', function (req) {req.abort();});
	
	if(kcode in keypad1x8list){
		keypadinx = keypad1x8list[kcode];
		//console.log(">>key"+kcode +"="+keypadinx);
				
		ttbuf = Buffer.from(cmdcode.rs485v050.s14cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6:keycode][7:status][10]"f5 00 06 00 03 12 12 34 11"	
		ttbuf[4]=0x03;
		ttbuf[5]=0x10;		
		ttbuf[6]= Number("0x"+keypadinx);
		if(kactive == "ON"){
			ttbuf[7]=0x01;			
		}else if(kactive == "OFF"){
			ttbuf[7]=0x00;			
		}else{			
			ttbuf[7]=0x01;
		}		
		ttbuf[8]=0x00;
		ttbuf[9]=0x00;		
		
		pdbuffer.totxbuff(ttbuf);
	}
	
	//}		
	
}

//==== Power ON/OFF fuunctini  ===== ###
const pass_pwmkey = {
	"KEYPAD0":{
		"STATUS":0,"K001":0, "K002":0, "K010":0, "K011":0, "  ":0,
		"K014":0, "K016":0, "K017":0, "K018":0, "K019":0, "K020":0,"K021":0,"K022":0
	},
	"KEYPAD1":{},
	"KEYPAD2":{}
};

function restart_keypadjob(kpos){//power on reactive all key status 
	if(!(kpos in pdbuffer.jkeypd.KEYLIB))return;
	let kcode =""
	let kactive =""
	for( kk in  pdbuffer.jkeypd.KEYLIB[kpos]){
		if(kk in  pass_pwmkey[kpos])continue;
		
		kcode = kk;
		kindex = pdbuffer.jkeypd.KEYLIB[kpos][kk].STATUS.stpt;
		kactive = pdbuffer.jkeypd.KEYLIB[kpos][kk].STATUS.stmask[kindex];
		console.log(">>key="+kpos+">"+kcode+">"+kactive);
		active_keypadjob(kpos,kcode,kactive);
	}
}

function holdkey_pwmon(kpos){
	if(!(kpos in pdbuffer.jautocmd.PWMOFFBACKUP.KEYPADLIST))return;
	console.log(">>key=on"+kpos);
	for( kk in  pdbuffer.jautocmd.PWMOFFBACKUP.KEYPADLIST[kpos]){		
		if(kk in  pass_pwmkey[kpos])continue;
		
		kcode = kk;
		kindex = pdbuffer.jautocmd.PWMOFFBACKUP.KEYPADLIST[kpos][kk];
		kactive = pdbuffer.jkeypd.KEYLIB[kpos][kk].STATUS.stmask[kindex];
		
		console.log(">>key=on"+kpos+">"+kcode+">"+kactive+">>"+kindex);
		active_keypadjob(kpos,kcode,kactive);		
	}
}
function holdkey_pwmoff(kpos){
	console.log(">>key=off"+kpos);	
	pdbuffer.jautocmd.PWMOFFBACKUP.KEYPADLIST[kpos] = {};
	for(kk in  pdbuffer.jkeypd.KEYLIB[kpos]){	
		console.log(">>key="+kk)
		if(kk in  pass_pwmkey[kpos])continue;
		
		console.log(">>key=off"+kpos+">"+kk+">"+pdbuffer.jkeypd.KEYLIB[kpos][kk].STATUS.stpt );
		pdbuffer.jautocmd.PWMOFFBACKUP.KEYPADLIST[kpos][kk]=pdbuffer.jkeypd.KEYLIB[kpos][kk].STATUS.stpt;
		console.log(">>key=off"+kpos+">"+kk+">"+pdbuffer.jautocmd.PWMOFFBACKUP.KEYPADLIST[kpos][kk]+"="+pdbuffer.jkeypd.KEYLIB[kpos][kk].STATUS.stpt);		
	}
}


function runauto_pwmoff(){
	pdbuffer.jautocmd.PWMOFFBACKUP.AUTOLIST = [];
	for(aa in pdbuffer.jautocmd.DEVLIST ){
		if( pdbuffer.jautocmd.DEVLIST[aa].STATU == 1){
			pdbuffer.jautocmd.PWMOFFBACKUP.AUTOLIST.push(aa);
			 pdbuffer.jautocmd.DEVLIST[aa].STATU = 0;
		}
	}
	
	pdbuffer.jautocmd.PWMOFFBACKUP.WATERLOOPLIST = [];
	for(aa in pdbuffer.jautocmd.WATERLOOP ){
		if( pdbuffer.jautocmd.WATERLOOP[aa].STATU == 1){
			pdbuffer.jautocmd.PWMOFFBACKUP.WATERLOOPLIST.push(aa);
			 pdbuffer.jautocmd.WATERLOOP[aa].STATU = 0;
		}
	}
}

function runauto_pwmon(){
	if(pdbuffer.jautocmd.PWMOFFBACKUP.AUTOLIST.length > 0){
		for(aa in pdbuffer.jautocmd.PWMOFFBACKUP.AUTOLIST ){
			autoname = pdbuffer.jautocmd.PWMOFFBACKUP.AUTOLIST[aa];
			pdbuffer.jautocmd.DEVLIST[autoname].STATU = 1;
		}
	}
	if(pdbuffer.jautocmd.PWMOFFBACKUP.WATERLOOPLIST.length > 0){
		for(aa in pdbuffer.jautocmd.PWMOFFBACKUP.WATERLOOPLIST ){		
			autoname = pdbuffer.jautocmd.PWMOFFBACKUP.WATERLOOPLIST[aa];
			pdbuffer.jautocmd.WATERLOOP[autoname].STATU = 1;
		}
	}	
}

//=== alarm check fucniton === 

function alarm_loadstudata(vjob){
	let vobj = {"vmax" :0 , "vmin": 0 ,"vavg":0 };
	let vallist =[]
	let getpos = 0;
	let getcmd = 0;
	let cmdcode = 0;
	let getreg = "00";
	let getval =0;
	
	for(pp in vjob){
		getpos = vjob[pp].POS; 
		getcmd = vjob[pp].CMD;
		cmdcode = pdbuffer.pdjobj.CMDDATA[getcmd][0];//load type cmdcode
		if(!(getpos in pdbuffer.pdjobj.PDDATA.Devtab))continue;
		if(!(cmdcode in pdbuffer.pdjobj.PDDATA.Devtab[getpos]))continue;
		
		getreg =  vjob[pp].STU.substr(0,2);
		
		if("chtab" in pdbuffer.pdjobj.PDDATA.Devtab[getpos][cmdcode] ){	
			//chtab reg mode load
			getval = pdbuffer.pdjobj.PDDATA.Devtab[getpos][cmdcode]["chtab"][getreg].stu;
		}else{
			//command mode load
			getval = pdbuffer.pdjobj.PDDATA.Devtab[getpos][cmdcode].stu;
		}
		
		if(getval != 0)vallist.push(getval);
	}
	
	if(vallist.length > 0){		
		vobj.vmax = Math.max.apply(null, vallist);
		vobj.vmin = Math.min.apply(null, vallist);
		sum =0
		for(vv in vallist)sum = sum + vallist[vv];
		vobj.vavg = (sum / vallist.length);
	}
	return vobj;
	//vobj.vmax = Math.max.apply(null, outrhchkval);
	//vobj.vmin = Math.min.apply(null, outrhchkval);
}

function alarmchk_load(alarmjob){
	let achkmode =0 ;
	let aapos ="0000";
	let devlist =[];
	
	//let chkval = jobjcopy( loadstudata(akey));//clear checek value buffer
	let chkval = jobjcopy(alarm_loadstudata(alarmjob.SENSORPOS));
	
	if(chkval.vmax == 0)return;//device link ERR !
	
	if( chkval.vmax >= alarmjob.MODETRIG.high)achkmode = 3;
	if((chkval.vmax > alarmjob.MODETRIG.low) && (chkval.vmax < alarmjob.MODETRIG.high) )achkmode = 2;
	if( chkval.vmax <= alarmjob.MODETRIG.low)achkmode = 1;
	
	if(alarmjob.CHKMODE == achkmode){
		if(alarmjob.CHKCOUNT<6)alarmjob.CHKCOUNT ++;
		if(alarmjob.CHKCOUNT>=6)alarmjob.CHKCOUNT = 0;
	}else{
		alarmjob.CHKMODE = achkmode;
		alarmjob.CHKCOUNT = 0;
	}
	
	if(alarmjob.CHKCOUNT == 3){
		
		for(dd in alarmjob.EPOS){
			aapos = alarmjob.EPOS[dd].POS;		
			if(!(aapos in pdbuffer.pdjobj.PDDATA.Devtab) && (aapos != "0000") )continue;
			if(aapos == "0000"){
				if("LINK" in alarmjob.EPOS[dd].ACTION){
					if((alarmjob.EPOS[dd].ACTION.LINK == alarmjob.CHKMODE)){
						//client 
						console.log(">>alarm code ="+alarmjob.AMCODE);
							//if(run_cmd == "REGCMD/KEYSETUP"){
						//http://tscloud.opcom.com/Cloud/API/v2/Alarm?ID={UUID}
						//&POS={POS}&Type={Type}&value={value}					
		
			update_alarmcodeurl= "http://tscloud.opcom.com/Cloud/API/v2/Alarm"+"?ID="+pdbuffer.setuuid+"&POS="+aapos+"&Type="+alarmjob.EPOS[dd].CMD+"&value="+alarmjob.AMCODE+"&Data="+chkval.vmax;
						console.log(">>alarm update to web DB =>"+update_alarmcodeurl);
						client.get(update_alarmcodeurl,cargs, function (data, response) {
							console.log("alarm code active update to webDB   ok ...");
						}).on("error", function(err) {console.log("err for client");}).on('requestTimeout', function (req) {req.abort();});
						
						
			updateipc_alarmcodeurl= "http://192.168.5.220/API/v2/Alarm.php"+"?ID="+pdbuffer.setuuid+"&POS="+aapos+"&Type="+alarmjob.EPOS[dd].CMD+"&value="+alarmjob.AMCODE+"&Data="+chkval.vmax;
						console.log(">>alarm update to web DB =>"+updateipc_alarmcodeurl);
						client.get(updateipc_alarmcodeurl,cargs, function (data, response) {
							console.log("alarm code active update to webDB   ok ...");
						}).on("error", function(err) {console.log("err for client");}).on('requestTimeout', function (req) {req.abort();});
						
		// updateipc_alarmcodeurl= "http://192.168.5.250/API/v2/Alarm.php"+"?ID="+pdbuffer.setuuid+"&POS="+aapos+"&Type="+alarmjob.EPOS[dd].CMD+"&value="+alarmjob.AMCODE+"&Data="+chkval.vmax;
						// console.log(">>alarm update to web DB =>"+updateipc_alarmcodeurl);
						// client.get(updateipc_alarmcodeurl,cargs, function (data, response) {
							// console.log("alarm code active update to webDB   ok ...");
						// }).on("error", function(err) {console.log("err for client");}).on('requestTimeout', function (req) {req.abort();});
						
					}
				}
			}else{
				if("ON" in alarmjob.EPOS[dd].ACTION){
					if(alarmjob.EPOS[dd].ACTION.ON == alarmjob.CHKMODE){
						//client 
						devlist.push(alarmjob.EPOS[dd]);
						device_auto_client(devlist,"ON");
					}
				}
				if("OFF" in alarmjob.EPOS[dd].ACTION){
					if(alarmjob.EPOS[dd].ACTION.OFF == alarmjob.CHKMODE){
						//client 
						devlist.push(alarmjob.EPOS[dd]);
						device_auto_client(devlist,"OFF");
						
					}
				}
				if("AUTO" in alarmjob.EPOS[dd].ACTION){
					if(alarmjob.EPOS[dd].ACTION.AUTO == alarmjob.CHKMODE){
						//client 
						devlist.push(alarmjob.EPOS[dd]);
						device_auto_client(devlist,"AUTO");
						
					}					
				}
				
			}
			
		}
	}	
}

event.on('alarmcheck_event', function(){ 
	console.log("alarm check =>"+pdbuffer.jautocmd.AUTOSN);
	for(aa in pdbuffer.jautocmd.ALARMCHECK){
		if(pdbuffer.jautocmd.ALARMCHECK[aa].STATU == 1){
			console.log(">>alarm check ="+aa);
			alarmchk_load(pdbuffer.jautocmd.ALARMCHECK[aa]);
		}
	}	
});


//=== EC/PH load event loop ===
function waterlev_load_client(devlist,devcmd){		
	let dpos = ""
	let dtype = ""
	let dregadd = ""
	let dstu = ""
	let dgroup = ""

	dpos = devlist.POS;
	dtype = devlist.CMD;
	dregadd = devlist.STU.substr(0,2);
	dstu =  devlist.STU.substr(0,2);
	dgroup = devlist.GROUP;
	
	water_switch_url = "http://127.0.0.1:3000/"+dtype+'?UUID='+pdbuffer.setuuid+"&POS="+dpos+"&Action="+devcmd+"&STU="+dstu+"&GROUP="+dgroup
	console.log(">>water PUMP drive  =>"+water_switch_url);
	client.get(water_switch_url, function (data, response) {
		console.log("PUMP client active  ok ...");
	}).on("error", function(err) {console.log("err for client");});	
}

function water_client_trige(devlist,devcmd){	
	let dpos = ""
	let dtype = ""
	let dregadd = ""
	let dstu = ""
	let dgroup = ""

	dpos = devlist.POS;
	dtype = devlist.CMD;
	dregadd = devlist.STU.substr(0,2);
	dstu =  devlist.STU;
	dgroup = devlist.GROUP;
	
	water_switch_url = "http://127.0.0.1:3000/"+dtype+'?UUID='+pdbuffer.setuuid+"&POS="+dpos+"&Action="+devcmd+"&STU="+dstu+"&GROUP="+dgroup
	console.log(">>water PUMP drive  =>"+water_switch_url);
	client.get(water_switch_url, function (data, response) {
		console.log("PUMP client active  ok ...");
	}).on("error", function(err) {console.log("err for client");});	
}


//=== waterloop ====
function GOBOX2LOOP(ljob){
	let outksspos = "";
	let typecmd = "";
	let typedevreg = "";
	let chkloadval = 0;
	let oloadval = 0;
	console.log(">>waterloop ="+ljob.SENSOR_CONTROL);
	ljob.SENSOR_CONTROL = Number(ljob.SENSOR_CONTROL);
	
	switch(ljob.SENSOR_CONTROL){
		case 0:
			waterlev_load_client(ljob.CHKLOOP.SENSORPOS.WATERLEVEL6,"LOAD");
			waterlev_load_client(ljob.CHKLOOP.SENSORPOS.WATERLEVEL7,"LOAD");			
			water_client_trige(ljob.CHKLOOP.DEVPOS.M4,"OFF"); //check box2 is full	
			
			outksspos = ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.POS;
			outkssfuncmd = ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.CMD;
			typecmd = pdbuffer.pdjobj.CMDDATA[outkssfuncmd][0];
			typedevreg = ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.STU.substr(0,2);
			oloadval = pdbuffer.pdjobj.PDDATA.Devtab[outksspos][typecmd]["chtab"][typedevreg].stu;//### lev scan load over 3 time is ready
			if(oloadval == ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.Value ){
				if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.count <= 2)ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.count ++;//0,1,2 
			}else{
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.Value = oloadval;//### lev scan load over 3 time is ready
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.count = 0;				
			}
			
			outksspos = ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.POS;
			outkssfuncmd = ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.CMD;
			typecmd = pdbuffer.pdjobj.CMDDATA[outkssfuncmd][0];
			typedevreg = ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.STU.substr(0,2);
			oloadval = pdbuffer.pdjobj.PDDATA.Devtab[outksspos][typecmd]["chtab"][typedevreg].stu;//### lev scan load over 3 time is ready
			if(oloadval == ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.Value ){
				if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count <= 2)ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count ++;
			}else{
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.Value = oloadval;//### lev scan load over 3 time is ready
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count = 0;				
			}			
			ljob.SENSOR_CONTROL = 0;
			if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count == 3)ljob.SENSOR_CONTROL = 1;
			break;
		case 1:
			ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count = 0;
			console.log(">>waterloop wlev7="+ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.Value+" type="+(typeof ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.Value));
			if( ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.Value < 11){//### box2 lev is low check 
				ljob.SENSOR_CONTROL = 6; // add new water 
			}else{
				if(ljob.CHKLOOP.CHKVALUE.DELAY1 < 3 ){//box2 runloop 30min and ec/ph check
					ljob.CHKLOOP.CHKVALUE.DELAY1++;
					ljob.SENSOR_CONTROL = 0;
				}else{
					ljob.CHKLOOP.CHKVALUE.DELAY1 = 0;
					ljob.SENSOR_CONTROL = 2;
				}
			}
			break;
		case 2:
			//M1 = 0 switch to Box2 
			//console.log(">>["+cc+"]"+run_cmd
			water_client_trige(ljob.CHKLOOP.DEVPOS.M1,"OFF");//switch to box2 ???
			//water_client_trige(ljob.CHKLOOP.DEVPOS.M1,"ON");//switch to box2
			water_client_trige(ljob.CHKLOOP.DEVPOS.M3,"OFF");//switch to box2
				console.log(">>waterloop M1 OFF , M3 OFF by Box2 ...");
			ljob.CHKLOOP.CHKVALUE.WAIT1 = 3;
			ljob.SENSOR_CONTROL = 3;
			break;
		case 3:
			if(ljob.CHKLOOP.CHKVALUE.WAIT1 > 0){
				ljob.CHKLOOP.CHKVALUE.WAIT1 --;
				ljob.SENSOR_CONTROL = 3;
			}else {
				ljob.SENSOR_CONTROL = 4;// wait loop 3
			}
			break;
		case 4:			
			water_client_trige(ljob.CHKLOOP.DEVPOS.M2,"ON");//start pump box2 to box2
			water_client_trige(ljob.CHKLOOP.DEVPOS.M4,"ON");//start pump box2 to ec/ph box
				console.log(">>waterloop ecph M2 ON ,box2 m4 ON");
			ljob.CHKLOOP.CHKVALUE.WAIT1 = 2*3;//3 min
			ljob.SENSOR_CONTROL = 5;
			break;
		case 5:
			if(ljob.CHKLOOP.CHKVALUE.WAIT1 > 0){
				if(ljob.CHKLOOP.CHKVALUE.WAIT1==3){
					water_client_trige(ljob.CHKLOOP.DEVPOS.M4,"OFF");//stop EC/PH pump
					console.log(">>waterloop M4 OFF");
				}
				waterlev_load_client(ljob.CHKLOOP.SENSORPOS.ECDATA,"LOAD");
				waterlev_load_client(ljob.CHKLOOP.SENSORPOS.PHDATA,"LOAD");
				
				console.log(">>waterloop EC LOAD ="+pdbuffer.pdjobj.PDDATA.Devtab.E002.C7A["chtab"]["94"].stu);
				console.log(">>waterloop PH LOAD ="+pdbuffer.pdjobj.PDDATA.Devtab.E002.C7B["chtab"]["93"].stu);
				ljob.CHKLOOP.CHKVALUE.WAIT1 --;				
				ljob.SENSOR_CONTROL = 5;
			}else {
				water_client_trige(ljob.CHKLOOP.DEVPOS.M2,"OFF");
				water_client_trige(ljob.CHKLOOP.DEVPOS.M4,"OFF");
				
				console.log(">>waterloop M2 OFF , M4 M5 OFF");
				ljob.SENSOR_CONTROL = 0;
			}
			break;
		case 6:	//start box1 to box2
			ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.count = 0;
			if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.Value <= 10){//chekc box1 is full 
				ljob.SENSOR_CONTROL = 0; 
			}else{
				ljob.SENSOR_CONTROL = 7;// ### add new water 
			}
			break;
		case 7:
			water_client_trige(ljob.CHKLOOP.DEVPOS.M1,"ON");//switch to Clear water 
			//water_client_trige(ljob.CHKLOOP.DEVPOS.M1,"OFF");//switch to Clear water ??
			ljob.CHKLOOP.CHKVALUE.WAIT1 = 4;
			ljob.SENSOR_CONTROL = 8;			
			break;
		case 8:
			if(ljob.CHKLOOP.CHKVALUE.WAIT1 > 0){
				ljob.CHKLOOP.CHKVALUE.WAIT1 --;
				ljob.SENSOR_CONTROL = 8;
			}else {			
				water_client_trige(ljob.CHKLOOP.DEVPOS.M2,"ON");//start pump box1 to box2
				ljob.SENSOR_CONTROL = 9;
			}
			break;
		case 9:
			waterlev_load_client(ljob.CHKLOOP.SENSORPOS.WATERLEVEL6,"LOAD");
			waterlev_load_client(ljob.CHKLOOP.SENSORPOS.WATERLEVEL7,"LOAD");
			
			outksspos = ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.POS;
			outkssfuncmd = ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.CMD;			
			typecmd = pdbuffer.pdjobj.CMDDATA[outkssfuncmd][0];
			typedevreg = ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.STU.substr(0,2);
			oloadval = pdbuffer.pdjobj.PDDATA.Devtab[outksspos][typecmd]["chtab"][typedevreg].stu;
			if(oloadval == ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.Value ){ //### box1 lev check 
				if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.count <= 2)ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.count ++;
			}else{
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.Value = oloadval;
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.count = 0;				
			}
			
			outksspos = ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.POS;
			outkssfuncmd = ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.CMD;
			typecmd = pdbuffer.pdjobj.CMDDATA[outkssfuncmd][0];
			typedevreg = ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.STU.substr(0,2);
			oloadval = pdbuffer.pdjobj.PDDATA.Devtab[outksspos][typecmd]["chtab"][typedevreg].stu;
			if(oloadval == ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.Value ){//### box2 lev check 
				if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count <= 2)ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count ++;
			}else{
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.Value = oloadval;
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count = 0;				
			}			
			
			ljob.SENSOR_CONTROL = 9;
			if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.count >= 3){
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.count = 0;
				if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL6.Value <=5){	//chek box1 = low
					water_client_trige(ljob.CHKLOOP.DEVPOS.M2,"OFF");	
					ljob.SENSOR_CONTROL = 0;
				}else{
					ljob.SENSOR_CONTROL = 10;
				}
			}			
			break;
		case 10:
			if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count >= 3){
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count = 0;
				if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.Value <16){//chekc box2 not full
					ljob.SENSOR_CONTROL = 9;
				}else{
					water_client_trige(ljob.CHKLOOP.DEVPOS.M2,"OFF"); //check box2 is full		
					ljob.SENSOR_CONTROL = 0;
				}
			}else{
				ljob.SENSOR_CONTROL = 9;
			}				
			break;
		default:
			water_client_trige(ljob.CHKLOOP.DEVPOS.M2,"OFF"); //check box2 is full	
			ljob.SENSOR_CONTROL=0;
			break;
	}	
}

function GOECDOSELOOP(ljob){
	let outksspos = "";
	let typecmd = "";
	let typedevreg = "";
	let chkloadval = 0;
	let oloadval = 0;
	console.log(">>ecphscanloop ="+ljob.SENSOR_CONTROL);
	ljob.SENSOR_CONTROL = Number(ljob.SENSOR_CONTROL);
	
	switch(ljob.SENSOR_CONTROL){
		case 0:
			waterlev_load_client(ljob.CHKLOOP.SENSORPOS.WATERLEVEL6,"LOAD");
			waterlev_load_client(ljob.CHKLOOP.SENSORPOS.WATERLEVEL7,"LOAD");
					
			outksspos = ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.POS;
			outkssfuncmd = ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.CMD;
			typecmd = pdbuffer.pdjobj.CMDDATA[outkssfuncmd][0];
			typedevreg = ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.STU.substr(0,2);
			oloadval = pdbuffer.pdjobj.PDDATA.Devtab[outksspos][typecmd]["chtab"][typedevreg].stu;//### lev scan load over 3 time is ready
			
			if(oloadval == ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.Value ){
				if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count <= 2)ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count ++;
			}else{
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.Value = oloadval;//### lev scan load over 3 time is ready
				ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count = 0;				
			}			
			ljob.SENSOR_CONTROL = 0;
			if(ljob.CHKLOOP.SENSORPOS.WATERLEVEL7.count == 3)ljob.SENSOR_CONTROL = 1;
			break;
		case 1:
		
			break;
		case 2:
		
			break;
		case 3:
		
			break;
		case 4:
		
			break;
		case 5:
		
			break;
		case 6:
		
			break;
		case 7:
		
			break;
		case 8:
		
			break;
		case 9:
		
			break;
		case 10:
		
			break;
		case 11:
		
			break;
		case 12:
		
			break;
		default:
			//water_client_trige(ljob.CHKLOOP.DEVPOS.M2,"OFF"); //check box2 is full	
			ljob.SENSOR_CONTROL=0;
			break;
		
	}
}


function GOPHDOSELOOP(ljob){
	
}



//=== autotm loop ====

function chktmmode(tmlist,tmlow,tmhi,cktmlist){
	let maxtm =0;
	let mintm =0;
	let tmmode = 0;

	maxtm = Math.max.apply(null, tmlist);
	mintm = Math.min.apply(null, tmlist);
	
	// if(tm1>=tm2){
		// maxtm = tm1;
		// mintm = tm2;
	// }else{
		// maxtm = tm2;
		// mintm = tm1;
	// }
	
	// if(maxtm < tmlow){
		// tmmode = 1;
	// }else if(maxtm > tmhi){
		// tmmode =3;
	// }else{
		// tmmode =2;
	// }
	tmmode = 1;
	tmcnt = cktmlist.length;
	if(tmcnt > 0){
		for(tt in cktmlist){
			if(maxtm <= cktmlist[tt]){
				break;
			}else{
				tmmode++;
			}
		}
	}
	
	
	if(maxtm == 0)tmmode=0;
	console.log(">>autotmloop tmcheck = "+maxtm+" mode="+tmmode);
	return tmmode;
}

function chkwkmodesetup(ljob){
	//let updownchk = 0;
	let updownchk1 = 0;
	let updownchk2 = 0;
	ljob.SENSOR_CONTROL =0;
	//updownchk = ljob.CHKLOOP.CHKVALUE.WKINMODE;
	console.log(">>autotmloop x1 updownflag="+ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG +" wkmdoe="+ljob.CHKLOOP.CHKVALUE.WKINMODE);
	if(ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG == 1){//upcheck 
		updownchk1 = chktmmode(ljob.CHKLOOP.CHKVALUE.INSTDATALIST,
			ljob.CHKLOOP.CHKVALUE.INTM_LOW,ljob.CHKLOOP.CHKVALUE.INTM_HI,ljob.CHKLOOP.CHKVALUE.INTM_LEVLISTUP);
			
		if(updownchk1 >= ljob.CHKLOOP.CHKVALUE.WKINMODE){ 
			ljob.CHKLOOP.CHKVALUE.WKINMODE = updownchk1; 
		}else{
			if(ljob.CHKLOOP.CHKVALUE.INSTCODEALL=="L111")ljob.CHKLOOP.CHKVALUE.WKINMODE = updownchk1;
		}
	}else{//downcheck	
		updownchk2 = chktmmode(ljob.CHKLOOP.CHKVALUE.INSTDATALIST,
			ljob.CHKLOOP.CHKVALUE.INTM_LOW,ljob.CHKLOOP.CHKVALUE.INTM_HI,ljob.CHKLOOP.CHKVALUE.INTM_LEVLISTDOWN);
			
		if(updownchk2 <= ljob.CHKLOOP.CHKVALUE.WKINMODE){ 
			ljob.CHKLOOP.CHKVALUE.WKINMODE = updownchk2;
		}else{
			if(ljob.CHKLOOP.CHKVALUE.INSTCODEALL=="L555")ljob.CHKLOOP.CHKVALUE.WKINMODE = updownchk2;			
		}
		
		//if(ljob.CHKLOOP.CHKVALUE.WKINMODE<updownchk)ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG =1;
	}			
	//if(ljob.CHKLOOP.SENSORPOS.LEDSTU.LEDSTU == 0){
	
	console.log(">>autotmloop x2 updownflag="+ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG +" wkmdoe="+ljob.CHKLOOP.CHKVALUE.WKINMODE);
	if(ljob.CHKLOOP.CHKVALUE.LEDDRVSTU == 0){	
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 0)ljob.SENSOR_CONTROL =0;
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 1)ljob.SENSOR_CONTROL =31;
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 2)ljob.SENSOR_CONTROL =32;
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 3)ljob.SENSOR_CONTROL =33;
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 4)ljob.SENSOR_CONTROL =34;	
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 5)ljob.SENSOR_CONTROL =35;
	}else{
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 0)ljob.SENSOR_CONTROL =0;
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 1)ljob.SENSOR_CONTROL =21;
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 2)ljob.SENSOR_CONTROL =22;
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 3)ljob.SENSOR_CONTROL =23;
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 4)ljob.SENSOR_CONTROL =24;	
		if(ljob.CHKLOOP.CHKVALUE.WKINMODE == 5)ljob.SENSOR_CONTROL =25;
	}	
}

function drvledlev4on(ljob){	
	ljob.CHKLOOP.CHKVALUE.LEDAUTOEN=0;//stop LED auto disable
	water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 on					
}

function devledlev1on(ljob){
	ljob.CHKLOOP.CHKVALUE.LEDAUTOEN=0;//stop LED auto disable
	water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON1,"AUTO");//led=4 
}

function devledlev1on30min(ljob){
	ljob.CHKLOOP.CHKVALUE.LEDAUTOEN=0;//stop LED auto disable
	water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1x10minM3,"ON");
}

function devledlevoff(ljob){
	ljob.CHKLOOP.CHKVALUE.LEDAUTOEN=0;//stop LED auto disable
	water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5OFF,"AUTO");//led=4 
	
}

function devledlevauto(ljob){
	ljob.CHKLOOP.CHKVALUE.LEDAUTOEN=1;//stop LED auto disable
	
}


function autotmloop(ljob){
	let outksspos = "";
	let typecmd = "";
	let typedevreg = "";
	let chkloadval = 0;
	let oloadval = 0;
	let indoortmlist =[];
	let outdoortmlist =[];
	let lss="E"
	let chkinmode = 0;
	let chkoutmode = 0;
	
	console.log(">>autotmloop ="+ljob.SENSOR_CONTROL);
	ljob.SENSOR_CONTROL = Number(ljob.SENSOR_CONTROL);
	
	switch(ljob.SENSOR_CONTROL){
		case 0://load pam to buffer 			

				ljob.CHKLOOP.SENSORPOS.LEDSTU.LEDSTU = pdbuffer.pdjobj.PDDATA.Devtab.A001.C71.chtab["20"].sub;	
				ljob.CHKLOOP.SENSORPOS.INDOORTM1.Value = pdbuffer.pdjobj.PDDATA.Devtab.H001.C77.chtab["A1"].stu;
				ljob.CHKLOOP.SENSORPOS.INDOORTM2.Value = pdbuffer.pdjobj.PDDATA.Devtab.H002.C77.chtab["A1"].stu;	
				ljob.CHKLOOP.SENSORPOS.INDOORTM3.Value = pdbuffer.pdjobj.PDDATA.Devtab.H003.C77.chtab["A1"].stu;	
				ljob.CHKLOOP.SENSORPOS.INDOORTM4.Value = pdbuffer.pdjobj.PDDATA.Devtab.H004.C77.chtab["A1"].stu;	
				ljob.CHKLOOP.SENSORPOS.INDOORTM5.Value = pdbuffer.pdjobj.PDDATA.Devtab.H005.C77.chtab["A1"].stu;	
				ljob.CHKLOOP.SENSORPOS.INDOORTM6.Value = pdbuffer.pdjobj.PDDATA.Devtab.H006.C77.chtab["A1"].stu;
				
				//pdbuffer.pdjobj.PDDATA.Devtab.H001.C77.chtab["A1"].stu=0;
				//pdbuffer.pdjobj.PDDATA.Devtab.H002.C77.chtab["A1"].stu=0;
				//pdbuffer.pdjobj.PDDATA.Devtab.H003.C77.chtab["A1"].stu=0;
				//pdbuffer.pdjobj.PDDATA.Devtab.H004.C77.chtab["A1"].stu=0;
				//pdbuffer.pdjobj.PDDATA.Devtab.H005.C77.chtab["A1"].stu=0;
				//pdbuffer.pdjobj.PDDATA.Devtab.H006.C77.chtab["A1"].stu=0;
				
				indoortmlist.push(ljob.CHKLOOP.SENSORPOS.INDOORTM1.Value);
				indoortmlist.push(ljob.CHKLOOP.SENSORPOS.INDOORTM2.Value);
				indoortmlist.push(ljob.CHKLOOP.SENSORPOS.INDOORTM3.Value);
				indoortmlist.push(ljob.CHKLOOP.SENSORPOS.INDOORTM4.Value);
				indoortmlist.push(ljob.CHKLOOP.SENSORPOS.INDOORTM5.Value);
				indoortmlist.push(ljob.CHKLOOP.SENSORPOS.INDOORTM6.Value);
				
				ljob.CHKLOOP.SENSORPOS.OUTDOORTM.Value =  pdbuffer.pdjobj.PDDATA.Devtab.E002.C77.chtab["A1"].stu;
				outdoortmlist.push(ljob.CHKLOOP.SENSORPOS.OUTDOORTM.Value);
				
				ljob.CHKLOOP.CHKVALUE.INSTDATALIST=jobjcopy(indoortmlist);
				ljob.CHKLOOP.CHKVALUE.OUTSTDATALIST=jobjcopy(outdoortmlist);
				
				
				// if(ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG == 1){
					// chkinmode = chktmmode(indoortmlist,ljob.CHKLOOP.CHKVALUE.INTM_LOW,ljob.CHKLOOP.CHKVALUE.INTM_HI,ljob.CHKLOOP.CHKVALUE.INTM_LEVLISTUP);
					// if(chkinmode == 0){					
						// ljob.SENSOR_CONTROL =0;
						// break;
					// }					
				// }else{
					// chkinmode = chktmmode(indoortmlist,ljob.CHKLOOP.CHKVALUE.INTM_LOW,ljob.CHKLOOP.CHKVALUE.INTM_HI,ljob.CHKLOOP.CHKVALUE.INTM_LEVLISTDOWN);
					// if(chkinmode == 0){					
						// ljob.SENSOR_CONTROL =0;
						// break;
					// }					
				// }
				
				chkinmode = chktmmode(indoortmlist,ljob.CHKLOOP.CHKVALUE.INTM_LOW,ljob.CHKLOOP.CHKVALUE.INTM_HI,ljob.CHKLOOP.CHKVALUE.INTM_LEVLIST);
				if(chkinmode == 0){					
					ljob.SENSOR_CONTROL =0;
					break;
				}					
						
				chkoutmode= chktmmode(outdoortmlist,
							ljob.CHKLOOP.CHKVALUE.OUTTM_LOW,ljob.CHKLOOP.CHKVALUE.OUTTM_HI,ljob.CHKLOOP.CHKVALUE.OUTTM_LEVLIST);
				if(chkoutmode == 0){					
					ljob.SENSOR_CONTROL =0;
					break;
				}
				
				//in mode check
				ljob.CHKLOOP.CHKVALUE.INSTCODE2 = ljob.CHKLOOP.CHKVALUE.INSTCODE1;
				ljob.CHKLOOP.CHKVALUE.INSTCODE1 = ljob.CHKLOOP.CHKVALUE.INMODE;
				ljob.CHKLOOP.CHKVALUE.INMODE = chkinmode;							
				ljob.CHKLOOP.CHKVALUE.INSTCODEALL = "L"+ljob.CHKLOOP.CHKVALUE.INSTCODE2+ljob.CHKLOOP.CHKVALUE.INSTCODE1+ljob.CHKLOOP.CHKVALUE.INMODE
				
				//out mode check
				ljob.CHKLOOP.CHKVALUE.OUTSTCODE2 = ljob.CHKLOOP.CHKVALUE.OUTSTCODE1
				ljob.CHKLOOP.CHKVALUE.OUTSTCODE1 = ljob.CHKLOOP.CHKVALUE.OUTMODE			
				ljob.CHKLOOP.CHKVALUE.OUTMODE= chkoutmode;							
				ljob.CHKLOOP.CHKVALUE.OUTSTCODEALL = "L"+ljob.CHKLOOP.CHKVALUE.OUTSTCODE2+ljob.CHKLOOP.CHKVALUE.OUTSTCODE1+ljob.CHKLOOP.CHKVALUE.OUTMODE			
			
				ljob.SENSOR_CONTROL =20;
			break; 
					
		case 20://mode 3
			console.log(">>autotmloop intmtype="+ljob.CHKLOOP.CHKVALUE.INSTCODEALL);
			switch(ljob.CHKLOOP.CHKVALUE.INSTCODEALL){
				case "L122":
					ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG = 1;
					ljob.SENSOR_CONTROL =0;
					break;
				case "L233":
					ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG = 1;
					ljob.SENSOR_CONTROL =0;
					break;
				case "L344":
					ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG = 1;
					ljob.SENSOR_CONTROL =0;
					break;
				case "L455":
					ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG = 1;
					ljob.SENSOR_CONTROL =0;
					break;
				case "L544":
					ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG = 0;
					ljob.SENSOR_CONTROL =0;
					break;
				case "L433":
					ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG = 0;
					ljob.SENSOR_CONTROL =0;
					break;
				case "L322":
					ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG = 0;
					ljob.SENSOR_CONTROL =0;
					break;
				case "L211":
					ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG = 0;
					ljob.SENSOR_CONTROL =0;
					break;
					
				case "L111":
					chkwkmodesetup(ljob);
					if(ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG == 0)ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG=1;
					break;
				case "L222":
					chkwkmodesetup(ljob);
					break;
				case "L333":
					chkwkmodesetup(ljob);
					break;
				case "L444":
					chkwkmodesetup(ljob);
					break;
				case "L555":
					chkwkmodesetup(ljob);
					if(ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG == 1)ljob.CHKLOOP.CHKVALUE.INTMDIRFLAG=0;
					break;
					
				default:	
					ljob.SENSOR_CONTROL=0;
					break;
			}
	
			break;		
		//=== LED ON type =======
		case 21://wkimmode = 1	
			switch(ljob.CHKLOOP.CHKVALUE.OUTMODE){
				case 1:
					console.log(">>autotmloop led=ON in15_out15 wkmode=1");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2101")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2101";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");	
			
					drvledlev4on(ljob);
					
					break;
				case 2:
					console.log(">>autotmloop led=ON in15_out1520  wkmode=1");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2102")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2102";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
					
					drvledlev4on(ljob);
				
					break;
				case 3:
					console.log(">>autotmloop led=ON in15_out2028 wkmode=1");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2103")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2103";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");//E002#R53 ON
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4AUTO,"AUTO");	
					
					drvledlev4on(ljob);
					
			//water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1x10minM3,"ON");
				
					break;
				case 4:
					console.log(">>autotmloop led=ON in15_out2835 wkmode=1");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2104")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2104";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4AUTO,"AUTO");	
					
					drvledlev4on(ljob);
					
					break;
				case 5:
					console.log(">>autotmloop led=ON in15_out35 wkmode=1");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2105")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2105";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4AUTO,"AUTO");	
					
					drvledlev4on(ljob);
					break;
				default:	
					ljob.SENSOR_CONTROL=0;
					break;
			}
			ljob.SENSOR_CONTROL=0;
			break;		
		case 22://wkimmode = 2	
			switch(ljob.CHKLOOP.CHKVALUE.OUTMODE){
				case 1:
					console.log(">>autotmloop led=ON in1520_out15 wkmode=2");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2201")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2201";
					
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
					
					drvledlev4on(ljob);
			
					break;
				case 2:
					console.log(">>autotmloop led=ON in1520_out1520  wkmode=2");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2202")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2202";
					
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
					
					drvledlev4on(ljob);
				
					break;
				case 3:
					console.log(">>autotmloop led=ON  in1520_out2028  wkmode=2");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2203")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2203";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");				
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");	
					
					drvledlev4on(ljob);
				
					break;
				case 4:
					console.log(">>autotmloop led=ON  in1520_out2835  wkmode=2");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2204")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2204";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");				
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
					
					drvledlev4on(ljob);
				
					break;
				case 5:
					console.log(">>autotmloop led=ON  in1520_out35  wkmode=2");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2205")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2205";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
					
					drvledlev4on(ljob);
				
					break;
				default:	
					ljob.SENSOR_CONTROL=0;
					break;
			}
			ljob.SENSOR_CONTROL=0;
			break;		
		case 23://wkimmode = 3
			switch(ljob.CHKLOOP.CHKVALUE.OUTMODE){
				case 1:
					console.log(">>autotmloop led=ON  in2028_out15  wkmode=3");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2301")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2301";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4AUTO,"AUTO");
					
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 on	
			 devledlevauto(ljob);
					
					break;
				case 2:
					console.log(">>autotmloop led=ON  in2028_out1520  wkmode=3");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2302")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2302";
					
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4AUTO,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 on	
			 devledlevauto(ljob);
				
					break;
				case 3:
					console.log(">>autotmloop led=ON  in2028_out2028  wkmode=3");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2303")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2303";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4AUTO,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 on	
			 devledlevauto(ljob);
				
					break;
				case 4:
					console.log(">>autotmloop led=ON  in2028_out2835 wkmode=3");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2304")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2304";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 on
			 devledlevauto(ljob);
				
					break;
				case 5:
					console.log(">>autotmloop led=ON  in2028_out35 wkmode=3");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2305")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2305";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 on
			 devledlevauto(ljob);
				
					break;
				default:	
					ljob.SENSOR_CONTROL=0;
					break;
			}
			ljob.SENSOR_CONTROL=0;
			break;		
		case 24://wkimmode = 4
			switch(ljob.CHKLOOP.CHKVALUE.OUTMODE){
				case 1:
					console.log(">>autotmloop led=ON   in2835_out15 wkmode=4");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2401")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2401";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4ON,"AUTO");
			devledlevoff(ljob);
					break;
				case 2:
					console.log(">>autotmloop  led=ON  in2835_out1520 wkmode=4");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2402")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2402";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4ON,"AUTO");
			devledlevoff(ljob);
				
					break;
				case 3:
					console.log(">>autotmloop led=ON   in2835_out2028 wkmode=4");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2403")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2403";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4ON,"AUTO");
			devledlevoff(ljob);
				
					break;
				case 4:
					console.log(">>autotmloop led=ON   in2835_out2835 wkmode=4");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2404")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2404";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");	
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");	
			
			devledlevoff(ljob);
					devledlev1on30min(ljob);
				
					break;
				case 5:
					console.log(">>autotmloop led=ON   in2835_out35 wkmode=4");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2405")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2405";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");	
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			
			devledlevoff(ljob);
					devledlev1on30min(ljob);
					
					break;
				default:	
					ljob.SENSOR_CONTROL=0;
					break;
			}
			ljob.SENSOR_CONTROL=0;
			break;		
		case 25://wkimmode = 5
			switch(ljob.CHKLOOP.CHKVALUE.OUTMODE){
				case 1:
					console.log(">>autotmloop led=ON   in35_out15 wkmode=5");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2501")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2501";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
					devledlevoff(ljob);
					
					break;
				case 2:
					console.log(">>autotmloop led=ON   in35_out1520 wkmode=5");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2502")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2502";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
					devledlevoff(ljob);
				
					break;
				case 3:
					console.log(">>autotmloop led=ON   in35_out2028 wkmode=5");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2503")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2503";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
					devledlevoff(ljob);			
					devledlev1on30min(ljob);
				
					break;
				case 4:
					console.log(">>autotmloop led=ON   in135_out2835 wkmode=5");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2504")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2504";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
					devledlevoff(ljob);
				
					break;
				case 5:
					console.log(">>autotmloop led=ON   in35_out35 wkmode=5");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "2505")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "2505";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			
					devledlevoff(ljob);			
					devledlev1on30min(ljob);
				
					break;
				default:	
					ljob.SENSOR_CONTROL=0;
					break;
			}
			ljob.SENSOR_CONTROL=0;
			break;		
			
		//=== LED OFF type =======
		case 31://wkimmode = 1	
			switch(ljob.CHKLOOP.CHKVALUE.OUTMODE){
				case 1:
					console.log(">>autotmloop led=OFF  in15_out15 wkmode=1");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3101")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3101";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 on 
					//devledlevauto(ljob);
					
					break;
				case 2:
					console.log(">>autotmloop led=OFF   in15_out1520 wkmode=1");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3102")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3102";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 on
					//devledlevauto(ljob);
				
					break;
				case 3:
					console.log(">>autotmloop led=OFF   in15_out2028 wkmode=1");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3103")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3103";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 on
					//devledlevauto(ljob);
				
					break;
				case 4:
					console.log(">>autotmloop led=OFF   in15_out2835 wkmode=1");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3104")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3104";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");	
					//devledlevauto(ljob);
			
					break;
				case 5:
					console.log(">>autotmloop led=OFF   in15_out35 wkmode=1");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3105")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3105";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");	
			
					//devledlevauto(ljob);		
					break;
				default:	
					ljob.SENSOR_CONTROL=0;
					break;
			}
			ljob.SENSOR_CONTROL=0;
			break;		
		case 32://wkimmode = 2	
			switch(ljob.CHKLOOP.CHKVALUE.OUTMODE){
				case 1:
					console.log(">>autotmloop led=OFF   in1520_out15 wkmode=2");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3201")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3201";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 on
					//devledlevauto(ljob);
			
					break;
				case 2:
					console.log(">>autotmloop led=OFF   in1520_out1520 wkmode=2");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3202")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3202";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 on
				
					break;
				case 3:
					console.log(">>autotmloop led=OFF   in1520_out2028 wkmode=2");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3203")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3203";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");	
				
					break;
				case 4:
					console.log(">>autotmloop led=OFF   in1520_out2835 wkmode=2");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3204")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3204";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");	
				
					break;
				case 5:
					console.log(">>autotmloop  led=OFF  in1520_out35 wkmode=2");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3205")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3205";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");		
				
					break;
				default:	
					ljob.SENSOR_CONTROL=0;
					break;
			}
			ljob.SENSOR_CONTROL=0;
			break;		
		case 33://wkimmode = 3
			switch(ljob.CHKLOOP.CHKVALUE.OUTMODE){
				case 1:
					console.log(">>autotmloop led=OFF   in2028_out15 wkmode=3");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3301")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3301";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
					break;
				case 2:
					console.log(">>autotmloop  led=OFF  in2028_out1520 wkmode=3");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3302")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3302";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
				
					break;
				case 3:
					console.log(">>autotmloop  led=OFF  in2028_out2028 wkmode=3");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3303")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3303";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");	
				
					break;
				case 4:
					console.log(">>autotmloop led=OFF   in2028_out2835 wkmode=3");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3304")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3304";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");	
				
					break;
				case 5:
					console.log(">>autotmloop  led=OFF  in2028_out35 wkmode=3");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3305")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3305";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");	
				
					break;
				default:	
					ljob.SENSOR_CONTROL=0;
					break;
			}
			ljob.SENSOR_CONTROL=0;
			break;		
		case 34://wkimmode = 4
			switch(ljob.CHKLOOP.CHKVALUE.OUTMODE){
				case 1:
					console.log(">>autotmloop led=OFF   in2835_out15 wkmode=4");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3401")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3401";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4ON,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 o
					break;
				case 2:
					console.log(">>autotmloop led=OFF   in2835_out1520 wkmode=4");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3402")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3402";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4ON,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 o
				
					break;
				case 3:
					console.log(">>autotmloop led=OFF   in2835_out2028 wkmode=4");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3403")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3403";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 o
				
					break;
				case 4:
					console.log(">>autotmloop led=OFF   in2835_out2835 wkmode=4");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3404")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3404";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 o
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
				
					break;
				case 5:
					console.log(">>autotmloop led=OFF   in2835_out35 wkmode=4");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3405")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3405";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"OFF");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"OFF");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 o
			//water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
				
					break;
				default:	
					ljob.SENSOR_CONTROL=0;
					break;
			}
			ljob.SENSOR_CONTROL=0;
			break;		
		case 35://wkimmode = 5
			switch(ljob.CHKLOOP.CHKVALUE.OUTMODE){
				case 1:
					console.log(">>autotmloop led=OFF   in35_out15 wkmode=5");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3501")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3501";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4ON,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 o
					break;
				case 2:
					console.log(">>autotmloop led=OFF   in35_out1520 wkmode=5");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3502")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3502";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4ON,"AUTO")
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"OFF");;
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 o
				
					break;
				case 3:
					console.log(">>autotmloop led=OFF   in35_out2028 wkmode=5");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3503")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3503";
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.LEDM5ON100,"AUTO");//led=4 o
				
					break;
				case 4:
					console.log(">>autotmloop led=OFF   in35_out2835 wkmode=5");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3504")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3504";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			//water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx4MJAUTOOFF,"AUTO");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx5M3,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx1M3,"ON");
			
				
					break;
				case 5:
					console.log(">>autotmloop led=OFF   in35_out35 wkmode=5");
					if(ljob.CHKLOOP.CHKVALUE.RUNMODE == "3505")break;
					ljob.CHKLOOP.CHKVALUE.RUNMODE = "3505";
			water_client_trige(ljob.CHKLOOP.DEVPOS.AIRM1,"ON");
			water_client_trige(ljob.CHKLOOP.DEVPOS.REFx6M4OFF,"AUTO");
				
					break;
				default:	
					ljob.SENSOR_CONTROL=0;
					break;
			}
			ljob.SENSOR_CONTROL=0;
			break;
		
		default:	
			ljob.SENSOR_CONTROL=0;
			break;
	}

}


event.on('sec30status_event', function(){ 
	for(jj in pdbuffer.jautocmd.WATERLOOP){	
		switch(jj){
			case "BOX2LOOP":
				if(pdbuffer.jautocmd.WATERLOOP.BOX2LOOP.STATU == 1)GOBOX2LOOP(pdbuffer.jautocmd.WATERLOOP.BOX2LOOP);
				
				break;
			case "ECDOSELOOP":
				if(pdbuffer.jautocmd.WATERLOOP.ECDOSELOOP.STATU == 1)GOECDOSELOOP(pdbuffer.jautocmd.WATERLOOP.ECDOSELOOP);
				
				break;
			case "PHDOSELOOP":
				if(pdbuffer.jautocmd.WATERLOOP.PHDOSELOOP.STATU == 1)GOPHDOSELOOP(pdbuffer.jautocmd.WATERLOOP.PHDOSELOOP);
				
				break;
			case "autotmloop":
				if(pdbuffer.jautocmd.WATERLOOP.autotmloop.STATU == 1)autotmloop(pdbuffer.jautocmd.WATERLOOP.autotmloop);
				
				break;
			default:
				break;
		}	
	}
});

exports.autoeventcall = autoeventcall

//=== autojob array fucnion and data ===
exports.sch_autojob = sch_autojob

exports.reload_autojob = reload_autojob
exports.load_autojob = load_autojob
exports.sch_autoloadmark = sch_autoloadmark;

//=== set time schedule funcion === 
exports.setschobj = setschobj

//=== keypad function call ===
exports.active_keypadjob = active_keypadjob
exports.restart_keypadjob = restart_keypadjob

exports.runauto_pwmoff = runauto_pwmoff
exports.runauto_pwmon = runauto_pwmon

exports.holdkey_pwmon = holdkey_pwmon
exports.holdkey_pwmoff = holdkey_pwmoff




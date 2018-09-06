console.log("read handel_rs485 v40 20180310 ... ");
/*
{
	var ackcmd = "f500025050"
	var okcmd = "f500025151"
	var failcmd = "f500025252"

}
*/

var rs485v029 = {
	"ackcmd" : "f500025050",
	"okcmd"  : "f500025151",
	"failcmd" : "f500025252",	
	"s70cmd" :  "f500027070",
	"s71cmd" :  "f5000471000071",
	"s71chcmd" :"f500047100000071",
	"s71autocmd" : "f50009710300000000000091",
	"s72cmd" :  "f5000472000072",
	"s73cmd" :  "f5000473000073",
	"s74cmd" :  "f5000474000074",
	"s75cmd" :  "f5000475000075",
	"s76cmd" :  "f500057600000076",
	"s77cmd" :  "f500057700000077",
	"s78cmd" :  "f500057800000078",
	"s79cmd" :  "f500057900000079",
	"s7acmd" :  "f500057a0000007a",
	"s7bcmd" :  "f500057b0000007b",
	"s7ccmd" :  "f500047c00007c",
	"s7dcmd" :  "f500057d0000007d",
	"s7ecmd" :  "f500047e00007e",
	"s96chcmd": "f5fe05960000000096",
	"s96cmd" :  "f5fe059600000096",
	"s97cmd" :  "f5fe059700000097",
	"s98cmd" :  "f5fe059800000098",
	"s99cmd" :  "f5fe059900000099",
	"s9acmd" :  "f5fe059a0000009a",
	"s9bcmd" :  "f5fe059b0000009b"		
}

var rs485v040 = {
	"ackcmd" : "f500025050",
	"okcmd"  : "f500025151",
	"failcmd" : "f500025252",	
	"s70cmd" :  "f500027070",
	"s71cmd" :  "f5000471000071",
	"s71chcmd" :  "f500047100000071",
	"s71autocmd" : "f50009710300000000000091",
	"s72cmd" :  "f5000472000072",
	"s73cmd" :  "f5000473000073",
	"s74cmd" :  "f5000474000074",
	"s75cmd" :  "f5000475000075",
	"s76cmd" :  "f500057600000076",
	"s77cmd" :  "f500057700000077",
	"s78cmd" :  "f500057800000078",
	"s79cmd" :  "f500057900000079",
	"s7acmd" :  "f500057a0000007a",
	"s7bcmd" :  "f500057b0000007b",
	"s7ccmd" :  "f500047c00007c",
	"s7dcmd" :  "f500057d0000007d",
	"s7ecmd" :  "f500047e00007e",
	"s96chcmd": "f5fe05960000000096",
	"s96cmd" :  "f5fe059600000096",
	"s97cmd" :  "f5fe059700000097",
	"s98cmd" :  "f5fe059800000098",
	"s99cmd" :  "f5fe059900000099",
	"s9acmd" :  "f5fe059a0000009a",
	"sa0cmd" :  "f5fe05a0000000a0",
	"s9bcmd" :  "f5fe059b0000009b"		
}

var rs485v050 = {
	"ackcmd" : "f500025050",
	"okcmd"  : "f500025151",
	"failcmd" : "f500025252",	
	"s70cmd" :  "f500027070",
	"s71cmd" :  "f5000471000071",
	"s71chcmd" :  "f500047100000071",
	"s71autocmd" : "f50009710300000000000091",
	"s72cmd" :  "f5000472000072",
	"s73cmd" :  "f5000473000073",
	"s74cmd" :  "f5000474000074",
	"s75cmd" :  "f5000475000075",
	"s76cmd" :  "f500057600000076",
	"s77cmd" :  "f500057700000077",
	"s78cmd" :  "f500057800000078",
	"s79cmd" :  "f500057900000079",
	"s7acmd" :  "f500057a0000007a",
	"s7bcmd" :  "f500057b0000007b",
	"s7ccmd" :  "f500047c00007c",
	"s7dcmd" :  "f500057d0000007d",
	"s7ecmd" :  "f500047e00007e",

	"s96chcmd": "f5fe05960000000096",
	"s96cmd" :  "f5fe059600000096",
	"s97cmd" :  "f5fe059700000097",
	"s98cmd" :  "f5fe059800000098",
	"s99cmd" :  "f5fe059900000099",
	"s9acmd" :  "f5fe059a0000009a",
	"sa0cmd" :  "f5fe05a0000000a0",
	"s9bcmd" :  "f5fe059b0000009b",
	
	"se0cmd" :  "f500060002e00000e0", 					//REG-E0 macadd
	"se1cmd" :  "f5fd0c0004e11234567890120000e1",		//REG-E1 ipadd
	"se2cmd" :  "f500060002e20000e2",					//REG-E2 fw ver
	"se3cmd" :  "f500060002e30000e2",					//REG-E3 hw ver
	"s01cmd" :  "f52006000101000001",					//REG-01 treescan
	"s03cmd" :  "f52006000203000003",					//REG-03 TREECOUNT
	"s02cmd" :  "f52006000202000002",  					//REG-02 TREELIST
	"s04cmd" :  "f5200e00020401230123456789abcdef04",  	//REG-04
	"s05cmd" :  "f5200400020505",  						//REG-05
	"s06cmd" :  "f5200e00020601230123456789abcdef10",  	//REG-06
	"s07cmd" :  "f5200400020707",  						//REG-07
	"s0fcmd" :  "f5200600020f00000f",  					//REG-0F
	"s0fscmd":  "f5200A00020f0000112233440f",  			//REG-0F
	"s10cmd" :  "f5200E0002100123456789abcdef012310",  	//REG-10  len = 0x10 
	"s11cmd" :  "f52006000211123411",  					//REG-11
	"s12cmd" :  "f5200e00021201230123456789abcdef12",  	//REG-12
	"s13cmd" :  "f52006000213123413",   				//REG-13 ==>[0] 1  2  3  4  5  6  7  8  9 10
	"s14cmd" :  "f520080002141234123413",   			//REG-14 ==>f5 20 08 00 03 10 91 01 00 00 A9 =>Reg=0x10 for 8 key
	"s15cmd" :  "f520080002151234123413",   			//REG-15
	
	"s1fcmd" :  "f5000800021f1234567820",   			//REG-1f ..7f [0][1][2][3][4:cmd][5:reg][6,7:value],[8,9:group],[10] group
	"sb0cmd" :  "f50006000220123420",   			    //REG-20 ..7f [0][1][2][3][4:cmd][5:reg][6,7:value],[10]
	"sb0gcmd" : "f5f1080002201234567820",   			//REG-20 ..7f [0][1][2][3][4:cmd][5:reg][6,7:value],[8,9:group],[10]
	"sb0ledcmd" :  "f5000a000220123456789abc20",   		//REG-20 ..7f [0][1][2][3][4:cmd][5:reg][6,7,8,9,10,11:value],[12] by 408x2 led 
	"sb0gledcmd" : "f5f10c000220123456789abcdef020"   	//REG-20 ..7f [0][1][2][3][4:cmd][5:reg][6,7,8,9,10,11:value][12,13:group],[14] by 408x2 led group
	
}


var subcmdtype = {
	"STATU" : "s70cmd",
	"C71": "s71chcmd",
	"C72": "s72cmd",
	"C73": "s73cmd",
	"C74": "s74cmd",
	"C75": "s75cmd",
	"C76": "s76cmd",
	"C77": "s77cmd",
	"C78": "s78cmd",
	"C79": "s79cmd",
	"C7A": "s7acmd",
	"C7B": "s7bcmd",
	"C7C": "s7ccmd",
	"C7D": "s7dcmd",
	"C7E": "s7ecmd",
	
	"CE0": "se0cmd",	//REG-E0
	"CE1": "se1cmd",    //REG-E1
	"CE2": "se2cmd",    //REG-E2
	"CE3": "se3cmd",    //REG-E3
	"C01": "s01cmd",    //REG-01
	"C03": "s03cmd",    //REG-03
	"C02": "s02cmd",    //REG-02
	"C04": "s04cmd",    //REG-04
	"C05": "s05cmd",    //REG-05
	"C06": "s06cmd",    //REG-06
	"C07": "s07cmd",    //REG-07
	"C0F": "s0fcmd",    //REG-0F
	"C10": "s10cmd",    //REG-10
	"C11": "s11cmd",    //REG-11
	"C12": "s12cmd",    //REG-12
	"C13": "s13cmd",    //REG-13
	"CB0": "sb0cmd"     //REG-20 ..7f
}

var apicmdtype = {
	"STATU" : "GROUP",
	"C71": "LED",
	"C72": "PUMP",
	"C73": "AIRFAN",
	"C74": "GROUP",
	"C75": "UV",
	"C76": "CO2",
	"C77": "TEMPERATURE",
	"C78": "RH",
	"C79": "WATERLEVEL",
	"C7A": "ELECTRONS",
	"C7B": "PH",
	"C7C": "PWM",
	"C7D": "SETTIME",
	"C7E": "AUTO",
	
	"CE0": "MACADD",  		//REG-E0
	"CE1": "IPADD",			//REG-E1
	"CE2": "FWVER",			//REG-E2
	"CE3": "HWVER",			//REG-E3
	"C01": "TREESCAN",		//REG-01	
	"C03": "TREECOUNT",		//REG-03
	"C02": "TREELIST",		//REG-02
	"C04": "DEVTRIG",		//REG-04
	"C05": "DEVTRIGCOUNT",	//REG-05
	"C06": "DEVEVENT",		//REG-06
	"C07": "DEVEVENTCOUNT",	//REG-07
	"C0F": "KEYVER",		//REG-0F
	"C10": "KEY1EVLIST",	//REG-10
	"C11": "KEY1EVCOUNT",	//REG-11
	"C12": "KEY2EVLIST",	//REG-12
	"C13": "KEY2EVCOUNT",	//REG-13
	"CB0": "DEVINOUT"		//REG-20
}

var r485subcmd = {
	    "OFF":0,
		"ON":1,
	    "LOAD":2,
	    "AUTO":3,
	    "SET":4,
	    "LOW":5,
	    "HI":6,
		"ALARM": 7,
		"MODELOOP": 8,
		"MODETRIG": 9
}

var R485CMDDATA = {
		"LED":["C71","POS","GROUP","Action","UUID","STU"],
		"PUMP":["C72","POS","GROUP","Action","UUID"],
		"AIRFAN":["C73","POS","GROUP","Action","UUID","STU"],
		"GROUP":["C74","POS","GROUP","Action","UUID"],
		"UV":["C75","POS","GROUP","Action","UUID"],
		"CO2":["C76","POS","GROUP","Action","UUID"],
		"TEMPERATURE":["C77","POS","GROUP","Action","UUID"],
		"RH":["C78","POS","GROUP","Action","UUID"],
		"WATERLEVEL":["C79","POS","GROUP","Action","UUID"],
		"ELECTRONS":["C7A","POS","GROUP","Action","UUID"],
		"PH":["C7B","POS","GROUP","Action","UUID"],
		"PWM":["C7C","POS","GROUP","Action","UUID"],
		"SETTIME":["C7D","POS","GROUP","Action","UUID","STU"],
		"AUTO":["C7E","POS","GROUP","Action","UUID","STU"],		
		
		"MACADD":["CE0","POS","GROUP","Action","UUID","STU"],
		"IPADD":["CE1","POS","GROUP","Action","UUID","STU"],
		"FWVER":["CE2","POS","GROUP","Action","UUID","STU"],
		"HWVER":["CE3","POS","GROUP","Action","UUID","STU"],
		"TREESCAN":["C01","POS","GROUP","Action","UUID","STU"],
		"TREECOUNT":["C03","POS","GROUP","Action","UUID","STU"],
		"TREELIST":["C02","POS","GROUP","Action","UUID","STU"],
		"DEVTRIG":["C04","POS","GROUP","Action","UUID","STU"],
		"DEVTRIGCOUNT":["C05","POS","GROUP","Action","UUID","STU"],
		"DEVEVENT":["C06","POS","GROUP","Action","UUID","STU"],
		"DEVEVENTCOUNT":["C07","POS","GROUP","Action","UUID","STU"],
		"KEYVER":["C0F","POS","GROUP","Action","UUID","STU"],
		"KEY1EVLIST":["C10","POS","GROUP","Action","UUID","STU"],
		"KEY1EVCOUNT":["C11","POS","GROUP","Action","UUID","STU"],
		"KEY2EVLIST":["C12","POS","GROUP","Action","UUID","STU"],
		"KEY2EVCOUNT":["C13","POS","GROUP","Action","UUID","STU"],
		"DEVINOUT":["CB0","POS","GROUP","Action","UUID","STU"]
}

var devtypelib = {
	"A000":[ "LED","PUMP","AIRFAN", "GROUP"],
	"B000":[ "AIRFAN", "GROUP"],
	"B100":[ "PUMP","GROUP"],
	"B200":[ "PUMP","GROUP"],
	"B300":[ "PUMP","GROUP"],
	"B400":[ "LED","PUMP","AIRFAN","GROUP"],
	"B500":[ "PUMP","GROUP"],
	"B600":[ "PUMP","GROUP"],
	"B700":[ "TEMPERATURE","RH","GROUP"],
	"B800":[ "LED","GROUP"],
	"B900":[ "LED","GROUP"],
	"C000":[ "CO2","TEMPERATURE","RH","GROUP"],
	"C100":[ "CO2","GROUP"],
	"C200":[ "TEMPERATURE","RH","GROUP"],
	"C300":[ "ELECTRONS","GROUP"],
	"C400":[ "PH","GROUP"],
	"C500":[ "PUMP","GROUP"],
	"C600":[ "PUMP","GROUP"],
	"C700":[ "WATERLEVEL","GROUP"],
	"C800":[ "LED","GROUP"],
	"C900":[ "LED","GROUP"],
	"CA00":[ "WATERLEVEL","GROUP"],
	"D010":[ "LED","PUMP","PWM","AUTO","GROUP"],
	"D020":[ "LED","PUMP","PWM","AUTO","GROUP"],
	"D030":[ "LED","PUMP","PWM","AUTO","GROUP"],
	"D040":[ "LED","PUMP","PWM","AUTO","GROUP"],
	"D050":[ "LED","PUMP","PWM","AUTO","GROUP"],
	"D060":[ "LED","PUMP","PWM","AUTO","GROUP"],
	"D070":[ "LED","PUMP","PWM","AUTO","GROUP"],
	"D080":[ "LED","PUMP","PWM","AUTO","GROUP"],
	"D090":[ "LED","PUMP","PWM","AUTO","GROUP"],
	"D100":[ "LED","PUMP","PWM","AUTO","GROUP"],
	"E081":[ "GROUP"],
	"E082":[ "AIRFAN", "PUMP", "TEMPERATURE", "WATERLEVEL","PH","ELECTRONS","GROUP"],
	"E083":[ "GROUP"],
	"E084":[ "LED","GROUP"],
	"E085":[ "CO2","TEMPERATURE","RH","GROUP"],
	"E086":[ "PUMP","GROUP"],
	"E087":[ "LED","GROUP"],
	"E088":[ "AIRFAN", "GROUP"],
	"E089":[ "PUMP","GROUP"]
	
}

var devtablib = {
		"M081": {
			"STATU": {"devadd":33,"LINK": 1,"GROUP": 0,"MACADD":"000000000000","MTYPE":"81"},
			"C70":	{"sub": 0,"stu": 0,"Data": 0, 
					 "chtab":{
						"01":{"sub": 0,"stu": 0,"Data": 0},
						"02":{"sub": 0,"stu": 0,"Data": 0},
						"03":{"sub": 0,"stu": 0,"Data": 0},
						"04":{"sub": 0,"stu": 0,"Data": 0},
						"05":{"sub": 0,"stu": 0,"Data": 0},
						"06":{"sub": 0,"stu": 0,"Data": 0},
						"07":{"sub": 0,"stu": 0,"Data": 0},
						"0F":{"sub": 0,"stu": 0,"Data": 0},
						"10":{"sub": 0,"stu": 0,"Data": 0},
						"11":{"sub": 0,"stu": 0,"Data": 0},
						"12":{"sub": 0,"stu": 0,"Data": 0},
						"13":{"sub": 0,"stu": 0,"Data": 0},
						"E0":{"sub": 0,"stu": 0,"Data": 0},
						"E1":{"sub": 0,"stu": 0,"Data": 0},
						"E2":{"sub": 0,"stu": 0,"Data": 0},
						"E3":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C74": {"sub": 0,"stu": 0,"Data": 0,
					"chtab":{
						"1F":{"sub": 0,"stu": 0,"Data": 0}
					}
			}
		},	
		"M082": {
			"STATU":{"devadd":33,"LINK": 1,"GROUP": 0,"MACADD":"000000000000","MTYPE":"82"},
			"C70":	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"0F":{"sub": 0,"stu": 0,"Data": 0},
						"10":{"sub": 0,"stu": 0,"Data": 0},
						"11":{"sub": 0,"stu": 0,"Data": 0},
						"E0":{"sub": 0,"stu": 0,"Data": 0},
						"E1":{"sub": 0,"stu": 0,"Data": 0},
						"E2":{"sub": 0,"stu": 0,"Data": 0},
						"E3":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C73": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"31":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C72": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"41":{"sub": 0,"stu": 0,"Data": 0},
						"42":{"sub": 0,"stu": 0,"Data": 0},
						"43":{"sub": 0,"stu": 0,"Data": 0},
						"44":{"sub": 0,"stu": 0,"Data": 0},
						"45":{"sub": 0,"stu": 0,"Data": 0},
						"46":{"sub": 0,"stu": 0,"Data": 0},
						"47":{"sub": 0,"stu": 0,"Data": 0},
						"48":{"sub": 0,"stu": 0,"Data": 0},
						"49":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C77": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"51":{"sub": 0,"stu": 0,"Data": 0},
						"52":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C79": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"61":{"sub": 0,"stu": 0,"Data": 0},
						"62":{"sub": 0,"stu": 0,"Data": 0},
						"63":{"sub": 0,"stu": 0,"Data": 0},
						"64":{"sub": 0,"stu": 0,"Data": 0},
						"65":{"sub": 0,"stu": 0,"Data": 0},
						"66":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C7B": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"73":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C7A": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"74":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C74": {"sub": 0,"stu": 0,"Data": 0,
					"chtab":{
						"1F":{"sub": 0,"stu": 0,"Data": 0}
					}
			}
		},	
		"M083": {
			"STATU":{"devadd":33,"LINK": 1,"GROUP": 0,"MACADD":"000000000000","MTYPE":"83"},
			"C70":	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"E0":{"sub": 0,"stu": 0,"Data": 0},
						"E1":{"sub": 0,"stu": 0,"Data": 0},
						"E2":{"sub": 0,"stu": 0,"Data": 0},
						"E3":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C74": {"sub": 0,"stu": 0,"Data": 0,
					"chtab":{
						"1F":{"sub": 0,"stu": 0,"Data": 0}
					}
			}
		},	
		"M084": {
			"STATU":{"devadd":33,"LINK": 1,"GROUP": 0,"MACADD":"000000000000","MTYPE":"84"},
			"C70":	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"E0":{"sub": 0,"stu": 0,"Data": 0},
						"E1":{"sub": 0,"stu": 0,"Data": 0},
						"E2":{"sub": 0,"stu": 0,"Data": 0},
						"E3":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C71": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"21":{"sub": 0,"stu": 0,"Data": 0},
						"22":{"sub": 0,"stu": 0,"Data": 0},
						"23":{"sub": 0,"stu": 0,"Data": 0},
						"24":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C74": {"sub": 0,"stu": 0,"Data": 0,
					"chtab":{
						"1F":{"sub": 0,"stu": 0,"Data": 0}
					}
			}
		},	
		"M085": {
			"STATU":{"devadd":33,"LINK": 1,"GROUP": 0,"MACADD":"000000000000","MTYPE":"85"},
			"C70":	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"E0":{"sub": 0,"stu": 0,"Data": 0},
						"E1":{"sub": 0,"stu": 0,"Data": 0},
						"E2":{"sub": 0,"stu": 0,"Data": 0},
						"E3":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C77": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"51":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C76": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"71":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C78": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"72":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C74": {"sub": 0,"stu": 0,"Data": 0,
					"chtab":{
						"1F":{"sub": 0,"stu": 0,"Data": 0}
					}
			}
		},	
		"M086": {
			"STATU":{"devadd":33,"LINK": 1,"GROUP": 0,"MACADD":"000000000000","MTYPE":"86"},
			"C70":	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"E0":{"sub": 0,"stu": 0,"Data": 0},
						"E1":{"sub": 0,"stu": 0,"Data": 0},
						"E2":{"sub": 0,"stu": 0,"Data": 0},
						"E3":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C72": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"41":{"sub": 0,"stu": 0,"Data": 0},
						"42":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C74": {"sub": 0,"stu": 0,"Data": 0,
					"chtab":{
						"1F":{"sub": 0,"stu": 0,"Data": 0}
					}
			}
		},	
		"M087": {
			"STATU":{"devadd":33,"LINK": 1,"GROUP": 0,"MACADD":"000000000000","MTYPE":"87"},
			"C70":	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"E0":{"sub": 0,"stu": 0,"Data": 0},
						"E1":{"sub": 0,"stu": 0,"Data": 0},
						"E2":{"sub": 0,"stu": 0,"Data": 0},
						"E3":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C71": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"21":{"sub": 0,"stu": 0,"Data": 0},
						"22":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C74": {"sub": 0,"stu": 0,"Data": 0,
					"chtab":{
						"1F":{"sub": 0,"stu": 0,"Data": 0}
					}
			}
		},	
		"M088": {
			"STATU":{"devadd":33,"LINK": 1,"GROUP": 0,"MACADD":"000000000000","MTYPE":"88"},
			"C70":	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"E0":{"sub": 0,"stu": 0,"Data": 0},
						"E1":{"sub": 0,"stu": 0,"Data": 0},
						"E2":{"sub": 0,"stu": 0,"Data": 0},
						"E3":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C73": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"31":{"sub": 0,"stu": 0,"Data": 0},
						"32":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C74": {"sub": 0,"stu": 0,"Data": 0,
					"chtab":{
						"1F":{"sub": 0,"stu": 0,"Data": 0}
					}
			}
		},	
		"M089": {
			"STATU":{"devadd":33,"LINK": 1,"GROUP": 0,"MACADD":"000000000000","MTYPE":"89"},
			"C70":	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"E0":{"sub": 0,"stu": 0,"Data": 0},
						"E1":{"sub": 0,"stu": 0,"Data": 0},
						"E2":{"sub": 0,"stu": 0,"Data": 0},
						"E3":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C72": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"41":{"sub": 0,"stu": 0,"Data": 0},
						"42":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C74": {"sub": 0,"stu": 0,"Data": 0,
					"chtab":{
						"1F":{"sub": 0,"stu": 0,"Data": 0}
					}
			}
		},	
		"M08A": {
			"STATU":{"devadd":33,"LINK": 1,"GROUP": 0,"MACADD":"000000000000","MTYPE":"89"},
			"C70":	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"E0":{"sub": 0,"stu": 0,"Data": 0},
						"E1":{"sub": 0,"stu": 0,"Data": 0},
						"E2":{"sub": 0,"stu": 0,"Data": 0},
						"E3":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C72": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"41":{"sub": 0,"stu": 0,"Data": 0},
						"42":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C74": {"sub": 0,"stu": 0,"Data": 0,
					"chtab":{
						"1F":{"sub": 0,"stu": 0,"Data": 0}
					}
			}
		},	
		"M08B": {
			"STATU":{"devadd":33,"LINK": 1,"GROUP": 0,"MACADD":"000000000000","MTYPE":"89"},
			"C70":	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"E0":{"sub": 0,"stu": 0,"Data": 0},
						"E1":{"sub": 0,"stu": 0,"Data": 0},
						"E2":{"sub": 0,"stu": 0,"Data": 0},
						"E3":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C72": 	{"sub": 0,"stu": 0,"Data": 0, 
					"chtab":{
						"41":{"sub": 0,"stu": 0,"Data": 0},
						"42":{"sub": 0,"stu": 0,"Data": 0}
					}
			},
			"C74": {"sub": 0,"stu": 0,"Data": 0,
					"chtab":{
						"1F":{"sub": 0,"stu": 0,"Data": 0}
					}
			}
		}
}

exports.rs485v050 = rs485v050
exports.rs485v040 = rs485v040
exports.rs485v029 = rs485v029
exports.subcmdtype = subcmdtype
exports.apicmdtype = apicmdtype
exports.r485subcmd = r485subcmd
exports.R485CMDDATA = R485CMDDATA
exports.devtypelib = devtypelib
exports.devtablib = devtablib

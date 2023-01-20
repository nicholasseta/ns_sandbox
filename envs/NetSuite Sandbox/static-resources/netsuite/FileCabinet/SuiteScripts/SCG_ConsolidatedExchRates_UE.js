/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       02 Oct 2019     Doug Humberd     Handles user events on Consolidated Exchange Rates records
 * 1.10       16 Sep 2019     Doug Humberd     Added 'is_consExchRate_restrictEditingToAdmin' and 'is_consExchRate_restrictInlineEditingToAdmin' to prevent non-administrators from editing Consolidated Exchange Rate records
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord consolidatedexchangerate
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_consExchRate_beforeLoad(type, form, request){
    try {
    	is_consExchRate_restrictEditingToAdmin(type, form, request);
        //is_consExchRate_beforeLoadScript(type, form, request);
    } catch (e) {
        is_consExchRate_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord consolidatedexchangerate
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_consExchRate_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
    	is_consExchRate_restrictInlineEditingToAdmin(type);
        //is_consExchRate_beforeSubmitScript(type);
    } catch (e) {
        is_consExchRate_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord consolidatedexchangerate
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_consExchRate_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        is_consExchRate_setNextPeriodRates(type);
    } catch (e) {
        is_consExchRate_logError(e);
        throw e;
    }
}


/**
 * Writes an error message to the Script Execution Log
 *
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 *
 * @returns {Void}
 */
function is_consExchRate_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}





/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord consolidatedexchangerate
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_consExchRate_setNextPeriodRates(type){
	
	nlapiLogExecution('DEBUG', 'type', type);
	
	//Run on edit and xedit
	if (type != 'edit' && type != 'xedit'){
		return;
	}
	
	var CERrecord = nlapiGetNewRecord();
	var oldCERrecord = nlapiGetOldRecord();
	
	
	//Initialize Variables
	var CERid = CERrecord.getId();
	//nlapiLogExecution('DEBUG', 'Cons Exch Rate ID', CERid);
	
	var newCurrentRate = CERrecord.getFieldValue('currentrate');
	var newAverageRate = CERrecord.getFieldValue('averagerate');
	var newHistoricalRate = CERrecord.getFieldValue('historicalrate');
	var oldCurrentRate = oldCERrecord.getFieldValue('currentrate');
	var oldAverageRate = oldCERrecord.getFieldValue('averagerate');
	var oldHistoricalRate = oldCERrecord.getFieldValue('historicalrate');
	
	nlapiLogExecution('DEBUG', 'old Current: ' + oldCurrentRate, 'new Current: ' + newCurrentRate);
	nlapiLogExecution('DEBUG', 'old Average: ' + oldAverageRate, 'new Average: ' + newAverageRate);
	nlapiLogExecution('DEBUG', 'old Historical: ' + oldHistoricalRate, 'new Historical: ' + newHistoricalRate);
	
	//If none of the rates are modified, exit code
	if (newCurrentRate == oldCurrentRate && newAverageRate == oldAverageRate && newHistoricalRate == oldHistoricalRate){
		nlapiLogExecution('DEBUG', 'NO RATE CHANGES', 'EXIT CODE');
		return;
	}
	
	//Get values from current consolidated exch rate record
    var searchresults = getCurrentCERrecord(CERid);
    
    if (searchresults){
    	
    	for (var i = 0; i < searchresults.length; i++){
    		
    		var searchId = searchresults[i].getValue('internalid');
    		var postPeriod = searchresults[i].getValue('periodname');
    		var periodStartDate = searchresults[i].getValue('periodstartdate');
    		var periodClosed = searchresults[i].getValue('closed');
    		var fromSubsidiary = searchresults[i].getValue('fromsubsidiary');
    		var toSubsidiary = searchresults[i].getValue('tosubsidiary');
    		var fromCurrency = searchresults[i].getValue('fromcurrency');
    		var toCurrency = searchresults[i].getValue('tocurrency');
    		var currExchRate = searchresults[i].getValue('currentrate');
    		var avgExchRate = searchresults[i].getValue('averagerate');
    		var histExchRate = searchresults[i].getValue('historicalrate');
    		
    		nlapiLogExecution('DEBUG', 'SEARCH Cons Exch Rate ID', searchId);
    		//nlapiLogExecution('DEBUG', 'SEARCH Closed', periodClosed);
    		//nlapiLogExecution('DEBUG', 'SEARCH Posting Period', postPeriod);
    		nlapiLogExecution('DEBUG', 'SEARCH Current Exch Rate', currExchRate);
    		nlapiLogExecution('DEBUG', 'SEARCH Average Exch Rate', avgExchRate);
    		nlapiLogExecution('DEBUG', 'SEARCH Historical Exch Rate', histExchRate);
    		nlapiLogExecution('DEBUG', 'SEARCH Period Start Date', periodStartDate);
    		nlapiLogExecution('DEBUG', 'SEARCH From Subsidiary = ' + fromSubsidiary, 'SEARCH To Subsidiary = ' + toSubsidiary);
    		//nlapiLogExecution('DEBUG', 'SEARCH From Currency = ' + fromCurrency, 'SEARCH To Currency = ' + toCurrency);
    		
    	}
    	
    }//End if (searchresults)
	
    //Calculate Period Start Date for the Next Period
    var date = new Date(periodStartDate);
    //nlapiLogExecution('DEBUG', 'Initial Period Start Date', date);
    date.setMonth(date.getMonth() + 1);
    var psdMonth = date.getMonth();
    var psdYear = date.getFullYear();
    nlapiLogExecution('DEBUG', 'Next Period Start Date Month', psdMonth);
    nlapiLogExecution('DEBUG', 'Next Period Start Date Year', psdYear);
    //nlapiLogExecution('DEBUG', 'Updated Period Start Date', date);
    nextPeriodStartDate = nlapiDateToString(date, 'date');
    nlapiLogExecution('DEBUG', 'Next Period Start Date', nextPeriodStartDate);
	
    //Only allow update if change is in same pay period as current month/year
    var today = new Date();
    nlapiLogExecution('DEBUG', 'Now', today);
    var todayMonth = today.getMonth();
    var todayYear = today.getFullYear();
    nlapiLogExecution('DEBUG', 'Today Month', todayMonth);
    nlapiLogExecution('DEBUG', 'Today Year', todayYear);
    
    if (psdMonth != todayMonth || psdYear != todayYear){
    	nlapiLogExecution('DEBUG', 'Next Period Start Date is not in the Current Month / Year', 'DO NOT UPDATE');
    	return;
    }
    
    
    var nextFromSubId;
    var nextToSubId;
    
    
    //Get the internal id for the 'From Subsidiary'
    var fromSubsearch = getSubsidiaryID(fromSubsidiary);
    
    if (fromSubsearch){
    	
    	for (var x = 0; x < fromSubsearch.length; x++){
    		
    		var fromSubId = fromSubsearch[x].getValue('internalid');
    		var fromSubName = fromSubsearch[x].getValue('namenohierarchy');
    		
    		nlapiLogExecution('DEBUG', 'SUB SEARCH From Subsidiary ID', fromSubId);
    		nlapiLogExecution('DEBUG', 'SUB SEARCH From Name', fromSubName);
    		
    		if (fromSubName == fromSubsidiary){
    			nextFromSubId = fromSubId;
    			break;
    		}
    		
    	}//End for x loop
    	
    	nlapiLogExecution('DEBUG', 'Next From Subsidiary Id', nextFromSubId);
    	
    }//End if (fromSubsearch)

    
    //Get the internal id for the 'To Subsidiary'
    var toSubsearch = getSubsidiaryID(toSubsidiary);
    
    if (toSubsearch){
    	
    	for (var y = 0; y < fromSubsearch.length; y++){
    		
    		var toSubId = toSubsearch[y].getValue('internalid');
    		var toSubName = toSubsearch[y].getValue('namenohierarchy');
    		
    		nlapiLogExecution('DEBUG', 'SUB SEARCH To Subsidiary ID', toSubId);
    		nlapiLogExecution('DEBUG', 'SUB SEARCH To Name', toSubName);
    		
    		if (toSubName == toSubsidiary){
    			nextToSubId = toSubId;
    			break;
    		}
    		
    	}//End for x loop
    	
    	nlapiLogExecution('DEBUG', 'Next To Subsidiary Id', nextToSubId);
    	
    }//End if (fromSubsearch)
    
    
	//Get the internal id for the Next Exch Rate Period with identified parameters
    var nextperiodsearchresults = getNextCERrecord(nextPeriodStartDate, nextFromSubId, nextToSubId);
    
    if (nextperiodsearchresults){
    	
    	for (var z = 0; z < nextperiodsearchresults.length; z++){
    		
    		var nextPeriodId = nextperiodsearchresults[z].getValue('internalid');
    		var nextPeriodStartDate = nextperiodsearchresults[z].getValue('periodstartdate');
    		var nextFromSubsidiary = nextperiodsearchresults[z].getValue('fromsubsidiary');
    		var nextToSubsidiary = nextperiodsearchresults[z].getValue('tosubsidiary');
    		
    		nlapiLogExecution('DEBUG', 'NEXT Cons Exch Rate ID', nextPeriodId);
    		nlapiLogExecution('DEBUG', 'NEXT Period Start Date', nextPeriodStartDate);
    		nlapiLogExecution('DEBUG', 'NEXT From Subsidiary = ' + nextFromSubsidiary, 'NEXT To Subsidiary = ' + nextToSubsidiary);
    		
    	}
    	
    }//End if (searchresults)
    
    //Update Next Consolidated Exch Rate Table with rate values
    nlapiLogExecution('DEBUG', 'Update New CER Record: ' + nextPeriodId, currExchRate + ' | ' + avgExchRate + ' | ' + histExchRate);
    nlapiSubmitField('consolidatedexchangerate', nextPeriodId, ['currentrate', 'averagerate', 'historicalrate'], [currExchRate, avgExchRate, histExchRate]);
    
}




function getCurrentCERrecord(CERid){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalidnumber', null, 'equalto', CERid));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('periodname', null, null));
	columns.push(new nlobjSearchColumn('periodstartdate', null, null));
	columns.push(new nlobjSearchColumn('closed', null, null));
	columns.push(new nlobjSearchColumn('fromsubsidiary', null, null));
	columns.push(new nlobjSearchColumn('tosubsidiary', null, null));
	columns.push(new nlobjSearchColumn('fromcurrency', null, null));
 	columns.push(new nlobjSearchColumn('currentrate', null, null));
	columns.push(new nlobjSearchColumn('averagerate', null, null));
	columns.push(new nlobjSearchColumn('historicalrate', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('consolidatedexchangerate', null, filters, columns);
	  
	// Return
	return results;
	
}





function getNextCERrecord(nextPeriodStartDate, nextFromSubId, nextToSubId){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('periodstartdate', null, 'on', nextPeriodStartDate));
	filters.push(new nlobjSearchFilter('fromsubsidiary', null, 'anyof', nextFromSubId));
	filters.push(new nlobjSearchFilter('tosubsidiary', null, 'anyof', nextToSubId));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	//columns.push(new nlobjSearchColumn('periodname', null, null));
	columns.push(new nlobjSearchColumn('periodstartdate', null, null));
	//columns.push(new nlobjSearchColumn('closed', null, null));
	columns.push(new nlobjSearchColumn('fromsubsidiary', null, null));
	columns.push(new nlobjSearchColumn('tosubsidiary', null, null));
	//columns.push(new nlobjSearchColumn('fromcurrency', null, null));
	//columns.push(new nlobjSearchColumn('tocurrency', null, null));
	//columns.push(new nlobjSearchColumn('currentrate', null, null));
	//columns.push(new nlobjSearchColumn('averagerate', null, null));
	//columns.push(new nlobjSearchColumn('historicalrate', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('consolidatedexchangerate', null, filters, columns);
	  
	// Return
	return results;
	
}





function getSubsidiaryID(subsidiary){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('name', null, 'contains', subsidiary));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('namenohierarchy', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('subsidiary', null, filters, columns);
	  
	// Return
	return results;
	
}





function is_consExchRate_restrictEditingToAdmin(type, form, request){
	
	if (type != 'edit'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'restrictEditingToAdmin', 'START');
	
	var urole = nlapiGetRole();
	nlapiLogExecution('DEBUG', 'User Role', urole);
	
	if (urole != '3'){
		
		var recType = nlapiGetRecordType();
		var cerId = nlapiGetRecordId();
		
		nlapiLogExecution('DEBUG', 'Not an Administrator', 'REDIRECT TO VIEW MODE');
		
		//nlapiResolveURL('SUITELET', 'customscript_scg_consolidatedexchrate_sl', 'customdeploy_scg_consolidatedexchrate_sl') + '&cerid=' + cerId + '&rectype=' + recType;
		nlapiSetRedirectURL('RECORD', recType, cerId, 'VIEW');
		
	}
	
	nlapiLogExecution('DEBUG', 'restrictEditingToAdmin', 'END');
	
}





function is_consExchRate_restrictInlineEditingToAdmin(type){
	
	if (type != 'xedit'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'restrictInlineEditingToAdmin', 'START');
	
	var urole = nlapiGetRole();
	nlapiLogExecution('DEBUG', 'User Role', urole);
	
	if (urole != '3'){
		
		//var recType = nlapiGetRecordType();
		//var cerId = nlapiGetRecordId();
		
		nlapiLogExecution('DEBUG', 'Not an Administrator', 'RESET TO ORIGINAL VALUES');
		
		//nlapiSetRedirectURL('RECORD', recType, cerId, 'VIEW');
		
		var oldCERrec = nlapiGetOldRecord();
		var oldAvgExchRate = oldCERrec.getFieldValue('averagerate');
		var oldCurrExchRate = oldCERrec.getFieldValue('currentrate');
		var oldHistExchRate = oldCERrec.getFieldValue('historicalrate');
		
		nlapiLogExecution('DEBUG', 'Original Avg Rate', oldAvgExchRate);
		nlapiLogExecution('DEBUG', 'Original Current Rate', oldCurrExchRate);
		nlapiLogExecution('DEBUG', 'Original Historical Rate', oldHistExchRate);
		
		var avgExchRate = nlapiGetFieldValue('averagerate');
		var currExchRate = nlapiGetFieldValue('currentrate');
		var histExchRate = nlapiGetFieldValue('historicalrate');
		
		nlapiLogExecution('DEBUG', 'New Avg Rate', avgExchRate);
		nlapiLogExecution('DEBUG', 'New Current Rate', currExchRate);
		nlapiLogExecution('DEBUG', 'New Historical Rate', histExchRate);
		
		if (avgExchRate != oldAvgExchRate){
			nlapiLogExecution('DEBUG', 'Reset Average Rate', 'AVERAGE RESET');
			nlapiSetFieldValue('averagerate', oldAvgExchRate);
		}
		
		if (currExchRate != oldCurrExchRate){
			nlapiLogExecution('DEBUG', 'Reset Current Rate', 'CURRENT RESET');
			nlapiSetFieldValue('currentrate', oldCurrExchRate);
		}
		
		if (histExchRate != oldHistExchRate){
			nlapiLogExecution('DEBUG', 'Reset Historical Rate', 'HISTORICAL RESET');
			nlapiSetFieldValue('historicalrate', oldHistExchRate);
		}
		
	}
	
	nlapiLogExecution('DEBUG', 'restrictInlineEditingToAdmin', 'END');
	
}




/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       14 Oct 2021     Doug Humberd     Handles Reverse Charge functionality on Invoice and Credit Memo records
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord invoice creditmemo
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_revchrg_beforeLoad(type, form, request){
    try {
        //is_revchrg_beforeLoadScript(type, form, request);
    } catch (e) {
        is_revchrg_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord invoice creditmemo
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_revchrg_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        is_revchrg_revCharge(type);
        //is_revchrg_beforeSubmitScript(type);
    } catch (e) {
        is_revchrg_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord invoice creditmemo
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_revchrg_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //is_revchrg_afterSubmitScript(type);
    } catch (e) {
        is_revchrg_logError(e);
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
function is_revchrg_logError(e) {
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




function is_revchrg_revCharge(type){
	
	//Run on create and edit
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	var subsidiary = nlapiGetFieldValue('subsidiary');
	var subCountry = nlapiLookupField('subsidiary', subsidiary, 'country');
	var shipCountry = nlapiGetFieldValue('shipcountry_insubrecord');
	
	nlapiLogExecution('DEBUG', 'Subsidiary: ' + subsidiary, 'Subsidiary Country: ' + subCountry);
	nlapiLogExecution('DEBUG', 'Ship Country', shipCountry);
	
	if (subCountry != shipCountry){
		
		nlapiLogExecution('DEBUG', 'Subsidiary Country != Ship Country', 'CONTINUE');
		
		var searchresults = isEuropeanCountry(subCountry);
		
		//Check if Subsidiary Country is EU
		if (searchresults){
			
			//for (var i = 0; i < searchresults.length; i++){
			var euCountrySub = searchresults[0].getValue('custrecord_ec');
			//}
			
		}
		
		//Check if Ship Country is EU
		var searchresults2 = isEuropeanCountry(shipCountry);
		
		if (searchresults2){
			
			//for (var i = 0; i < searchresults.length; i++){
			var euCountryShip = searchresults2[0].getValue('custrecord_ec');
			//}
			
		}
		
		nlapiLogExecution('DEBUG', 'Subsidiary EU: ' + euCountrySub, 'Ship EU: ' + euCountryShip);
		
		//If both Subsidiary Country and Ship Country are EU, then check Reversed Charge, else uncheck
		if (euCountrySub == 'T' && euCountryShip == 'T'){
			nlapiSetFieldValue('custbody_reversed_charge', 'T');
		}else{
			nlapiSetFieldValue('custbody_reversed_charge', 'F');
		}
		
	}else{//End if (subCountry != shipCountry)
		nlapiSetFieldValue('custbody_reversed_charge', 'F');
	}
	
}



function isEuropeanCountry(country){
	
	//Define filters
	var filters = new Array();
	//filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_cr_country_code', null, 'is', country));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('custrecord_ec', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('customrecord_countries_regions', null, filters, columns);
	  
	// Return
	return results;
	
}





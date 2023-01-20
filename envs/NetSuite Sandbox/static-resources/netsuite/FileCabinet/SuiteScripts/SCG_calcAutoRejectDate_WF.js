/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Mar 2021     Doug Humberd     Calculates the Auto-Reject Date on a Purchase Order
 * 1.05       23 Apr 2021     Doug Humberd     Updated for reworked PO Approval WF
 * 
 *
 */


/***********************************
 * Constants
 *
 ***********************************/



/**
 * Calculates the Auto-Reject Date on a Purchase Order
 * 
 * @returns Employee ID - to be used in the Next Approver field
 */
function is_card_calcAutoRejectDate(form, type){
	
	try{
		
		var autoRejDate;
		//var missing = 'F';
		
		var date = new Date();
		nlapiLogExecution('DEBUG', 'Today', date);
		
		date.setDate(date.getDate() + 28);
		var autoRejDate = nlapiDateToString(date, 'date');
		nlapiLogExecution('DEBUG', 'Four Weeks from Today (Auto Reject Date)', autoRejDate);
		
		return autoRejDate;
		
		
	}catch(e){
		is_card_logError(e);
		return 0;
	}
	
}


/**
 * Writes an error message to the Script Execution Log
 * 
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 * 
 * @returns {Void}
 */
function is_card_logError(e) {
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




/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Mar 2021     Doug Humberd     Calculates the Unapproved PO Reminder Date on a Purchase Order
 * 
 *
 */


/***********************************
 * Constants
 *
 ***********************************/



/**
 * Calculates the Unapproved PO Reminder Date on a Purchase Order
 * 
 * @returns Employee ID - to be used in the Next Approver field
 */
function is_crd_calcReminderDate(form, type){
	
	try{
		
		var reminderDate;
		
		var date = new Date();
		nlapiLogExecution('DEBUG', 'Today', date);
		
		date.setDate(date.getDate() + 4);
		
		//If 4 days from now includes either weekend day, add additional days
		var dayOfWeek = date.getDay();
		if (dayOfWeek == 0 || dayOfWeek == 1 || dayOfWeek == 2 || dayOfWeek == 6){//0 = Sunday, 1 = Monday, 2 = Tuesday, 6 = Saturday
			date.setDate(date.getDate() + 2);
		}
		if (dayOfWeek == 3){//3 = Wednesday
			date.setDate(date.getDate() + 1);
		}
		
		var reminderDate = nlapiDateToString(date, 'date');
		nlapiLogExecution('DEBUG', 'Four Days from Today (Reminder Date)', reminderDate);
		
		return reminderDate;
		
		
	}catch(e){
		is_crd_logError(e);
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
function is_crd_logError(e) {
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




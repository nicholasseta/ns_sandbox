/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       24 Feb 2022     Doug Humberd     Checks to see if the Invoice should be Pending Approval or Approved
 * 
 *
 */


/***********************************
 * Constants
 *
 ***********************************/



/**
 * Checks to see if the Invoice should be Pending Approval or Approved
 * 
 * @returns Boolean
 */
function is_sias_setInvoiceApprovalStatus(form, type){
	
	try{
		
		var invId = nlapiGetRecordId();
		nlapiLogExecution('DEBUG', 'Invoice ID', invId);
		
		var approved = 'F';

		
		var tranDate = nlapiGetFieldValue('trandate');
		nlapiLogExecution('DEBUG', 'Transaction Date', tranDate);
		
		var postPd = nlapiGetFieldValue('postingperiod');
		nlapiLogExecution('DEBUG', 'Posting Period', postPd);
		
		var acctPdFields = nlapiLookupField('accountingperiod', postPd, ['startdate', 'enddate']);
		
		var startDate = acctPdFields.startdate;
		var endDate = acctPdFields.enddate;
		nlapiLogExecution('DEBUG', 'Acct Pd Start Date: ' + startDate, 'Acct Pd End Date: ' + endDate);
		
		var tranDateObj = new Date(tranDate);
		var startDateObj = new Date(startDate);
		var endDateObj = new Date(endDate);
		
		if (tranDateObj >= startDateObj && tranDateObj <= endDateObj){
			approved = 'T';
		}
		
		

		return approved;

		
	}catch(e){
		is_sias_logError(e);
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
function is_sias_logError(e) {
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




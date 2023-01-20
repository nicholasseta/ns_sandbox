/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Aug 2021     Doug Humberd     Checks to see if Vendor has a value in the Represents Subsidiary field, and checks 'Is Intercompany' if it does
 * 
 *
 */


/***********************************
 * Constants
 *
 ***********************************/



/**
 * Checks 'Department Approved' boxes when various Department Approvers have approved the PO
 * 
 * @returns Employee ID - to be used in the Next Approver field
 */
function is_iiv_isIntercompanyVendor(form, type){
	
	try{
		
		var poId = nlapiGetRecordId();
		nlapiLogExecution('DEBUG', 'Purchase Order ID', poId);
		
		var isIntercompany = 'F';
		
		var vendId = nlapiGetFieldValue('entity');
		
		//If vendor is empty, exit
		if (isEmpty(vendId)){
			nlapiLogExecution('DEBUG', 'Vendor Empty', 'Exit');
			return;
		}
		
		//Check for a 'Represents Subsidiary' value on the Vendor Record, check 'Is Intercompany' if found
		var vendRec = nlapiLoadRecord('vendor', vendId);
		
		var repSub = vendRec.getFieldValue('representingsubsidiary');
		nlapiLogExecution('DEBUG', 'Represents Subsidiary', repSub);
		
		if (!isEmpty(repSub)){
			nlapiLogExecution('DEBUG', 'Represents Subsidiary has value', 'Is Intercompany to be checked on PO ' + poId);
			isIntercompany = 'T';
		}else{
			nlapiLogExecution('DEBUG', 'Represents Subsidiary has no value', 'Is Intercompany to be unchecked on PO ' + poId);
			isIntercompany = 'F';
		}
		
		
		return isIntercompany;

		
	}catch(e){
		is_iiv_logError(e);
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
function is_iiv_logError(e) {
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




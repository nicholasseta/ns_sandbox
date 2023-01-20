/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Dec 2019     Doug Humberd     Handles client events on Return Authorization records
 *                            Doug Humberd     Added scripts (is_ra_setClientScript, is_ra_addCommLinesButton, is_ra_3rdPartyCommissions)to execute 3rd Party Commission functionality
 *
 */


/**
 * Constants
 */



/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord returnauthorization
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_ra_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
		alert(e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
		alert(e.toString());
	}
}


/**
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord returnauthorization
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_ra_fieldChanged(type, name, linenum){
    try {
        //is_ra_fieldChangedFunction(type, name, linenum);
    } catch (e) {
    	is_ra_logError(e);
    }
}



/**
 * Handles client events after dependent fields are updated upon a field changed event
 *
 * @appliedtorecord returnauthorization
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function is_ra_postSourcing(type, name) {
    try {
    	//is_ra_postSourcingFunction(type, name);
    } catch (e) {
    	is_ra_logError(e);
        throw e;
    }
}


/**
 * Adds 3rd Party Commission line items to the order if the item has a Commission Rate value
 *  
 * @appliedtorecord salesorder
 *   
 * @returns {Void}
 */
function is_ra_3rdPartyCommissions() {
	
	//Run code to add 3rd party commission items, where applicable
	scg_so_set3rdPartyCommissionLines();
	
}




function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}




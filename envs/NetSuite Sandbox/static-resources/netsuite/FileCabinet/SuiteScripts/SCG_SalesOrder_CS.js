/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       27 Aug 2018     Doug Humberd     Handles client events on Sales Order records
 * 1.10       01 Oct 2018     Doug Humberd     Added functionality to update Term Start Date and Term End Date fields on SO when Rev Rec Start & End Dates are modified
 * 1.20       04 Mar 2019     Doug Humberd     Removed "is_so_updateTermStartEndDates" - moved to a stand-alone script so that it can be deployed to multiple transaction records
 *
 */


/**
 * Constants
 */



/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord salesorder
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_so_logError(e) {
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
 * @appliedtorecord salesorder
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_so_fieldChanged(type, name, linenum){
    try {
        //is_so_fieldChangedFunction(type, name, linenum);
    } catch (e) {
    	is_so_logError(e);
    }
}



/**
 * Handles client events after dependent fields are updated upon a field changed event
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function is_so_postSourcing(type, name) {
    try {
    	//is_so_postSourcingFunction(type, name);
    } catch (e) {
    	is_so_logError(e);
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
function is_so_3rdPartyCommissions() {
	
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





/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Jun 2019     Doug Humberd     Restricts the IS A/R Clerk Role from changing Rev Rec Start / End Date values on transactions
 *
 */


/**
 * Constants
 */
const IS_AR_CLERK = '1014';


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord salesorder, returnauthorization, creditmemo, invoice, cashsale
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_rrrdc_logError(e) {
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
 * Performs actions when a form is loaded in the user's browser
 *
 * @appliedtorecord salesorder, returnauthorization, creditmemo, invoice, cashsale
 *
 * @param {String} type Sublist internal id
 * @returns {Void}
 */
function is_rrrdc_pageInit(type){
    try {
    	is_rrrdc_disableRevRecFields(type);
    } catch (e) {
    	is_rrrdc_logError(e);
    }
}




/**
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord salesorder, returnauthorization, creditmemo, invoice, cashsale
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_rrrdc_fieldChanged(type, name, linenum){
    try {
        //is_rrrdc_fieldChangedFunction(type, name, linenum);
    } catch (e) {
    	is_rrrdc_logError(e);
    }
}



/**
 * Handles client events after dependent fields are updated upon a field changed event
 *
 * @appliedtorecord salesorder, returnauthorization, creditmemo, invoice, cashsale
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function is_rrrdc_postSourcing(type, name) {
    try {
    	//is_rrrdc_postSourcingFunction(type, name);
    } catch (e) {
    	is_rrrdc_logError(e);
        throw e;
    }
}




/**
 * Checks the User Role to determine if Rev Rec Dates should be disabled
 * If 'IS A/R Clerk', disable
 *
 * @appliedtorecord salesorder, returnauthorization, creditmemo, invoice, cashsale
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_rrrdc_disableRevRecFields(type){
	
	var urole = nlapiGetRole();
	
	if (type == 'edit' && urole == IS_AR_CLERK){
		nlapiDisableLineItemField('item', 'custcol_rev_rec_start_date', true);
		nlapiDisableLineItemField('item', 'custcol_rev_rec_end_date', true);
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





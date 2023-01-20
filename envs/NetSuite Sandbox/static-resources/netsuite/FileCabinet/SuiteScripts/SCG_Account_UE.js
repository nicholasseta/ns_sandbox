/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       01 Nov 2018     Doug Humberd     Handles user events on Account records
 * 1.05       31 Jul 2020     Doug Humberd     Added '' to copy value from 'Number' to 'Account#'
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord account
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_acct_beforeLoad(type, form, request){
    try {
        //is_acct_beforeLoadScript(type, form, request);
    } catch (e) {
        is_acct_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord account
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_acct_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
    	is_acct_setAccountNumField(type);
        //is_acct_beforeSubmitScript(type);
    } catch (e) {
        is_acct_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord account
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_inv_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        is_acct_setElimRevalueCheckboxes(type);
    } catch (e) {
        is_acct_logError(e);
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
function is_acct_logError(e) {
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
 * Sets custom Revalue and Eliminate checkbox fields on an account record based on the native NS values.
 *
 * @appliedtorecord account
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_acct_setElimRevalueCheckboxes(type){
	
	//Run on Create or Edit
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	var acct = nlapiGetNewRecord();
	var acctId = acct.getId();
	nlapiLogExecution('DEBUG', 'Acct ID', acctId);
	
	var revalue = acct.getFieldValue('revalue');
	var eliminate = acct.getFieldValue('eliminate');
	nlapiLogExecution('DEBUG', 'Revalue = ' + revalue, 'Eliminate = ' + eliminate);
	
	var acctRec = nlapiLoadRecord('account', acctId);
	
	if (revalue == 'T'){
		nlapiLogExecution('DEBUG', 'Check Custom Revalue Field', 'T');
		acctRec.setFieldValue('custrecord_revalue_checkbox', 'T');
	}
		
	if (revalue == 'F' || isEmpty(revalue)){
		nlapiLogExecution('DEBUG', 'Uncheck Custom Revalue Field', 'F');
		acctRec.setFieldValue('custrecord_revalue_checkbox', 'F');
	}
		
	if (eliminate == 'T'){
		nlapiLogExecution('DEBUG', 'Check Custom Eliminate Field', 'T');
		acctRec.setFieldValue('custrecord_elim_checkbox', 'T');
	}
	
	if (eliminate == 'F' || isEmpty(eliminate)){
		nlapiLogExecution('DEBUG', 'Uncheck Custom Eliminate Field', 'F');
		acctRec.setFieldValue('custrecord_elim_checkbox', 'F');
	}
		
	nlapiSubmitRecord(acctRec);
	
}




/**
 * Copies the value from the 'Number' field to the 'Account#' field on save
 *
 * @appliedtorecord account
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_acct_setAccountNumField(type){
	
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	var number = nlapiGetFieldValue('acctnumber');
	nlapiLogExecution('DEBUG', 'Number Field', number);
	
	nlapiSetFieldValue('custrecord_account_number', number);
	
}





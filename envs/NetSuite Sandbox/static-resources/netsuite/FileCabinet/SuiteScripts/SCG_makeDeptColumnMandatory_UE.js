/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Dec 2020     Doug Humberd     Makes the Department (line field) Mandatory for Item and Expenses tab
 *
 */


/**
 * Handles user events that occur before the record loads in the user's browser
 * 
 * @appliedtorecord vendorbill vendorcredit purchaseorder
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_mdcm_beforeLoad(type, form, request) {
	try {
		is_mdcm_setDeptOnLineMandatory(type, form, request);
	} catch (e) {
		is_mdcm_logError(e);
		throw e;
	}
}


/**
 * Performs actions immediately prior to a write event on a record.
 *
 * @appliedtorecord vendorbill vendorcredit purchaseorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_mdcm_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        //is_mdcm_beforeSubmitFunction(type);
    } catch (e) {
        is_mdcm_logError(e);
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
function is_mdcm_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}




function is_mdcm_setDeptOnLineMandatory(type, form, request){
	
	//Run in Edit mode, On Create, or On Copy
	if (type != 'edit' && type != 'create' && type != 'copy'){
		return;
	}
	
	//var lineLevelDept = nlapiGetLineItemField('expense', 'department', '1');
	var lineLevelDept = nlapiGetLineItemField('expense', 'department');
	
	if (lineLevelDept){
		lineLevelDept.setMandatory(true);
	}
	
	var lineLevelDeptItem = nlapiGetLineItemField('item', 'department');
	
	if (lineLevelDeptItem){
		lineLevelDeptItem.setMandatory(true);
	}
	
}




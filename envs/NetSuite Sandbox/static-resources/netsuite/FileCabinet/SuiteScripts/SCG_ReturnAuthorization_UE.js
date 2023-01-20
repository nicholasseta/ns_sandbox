/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       09 Jan 2019     Doug Humberd     Handles user events on Return Authorization records
 * 	                          Doug Humberd     Added scripts (is_ra_setClientScript, is_ra_addCommLinesButton, is_ra_3rdPartyCommissions)to execute 3rd Party Commission functionality
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord returnauthorization
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_ra_beforeLoad(type, form, request){
    try {
    	is_ra_setClientScript(type, form, request);
		is_ra_addCommLinesButton(type, form, request);
    } catch (e) {
        is_ra_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately prior to a write event on a record.
 *
 * @appliedtorecord returnauthorization
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_ra_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        is_ra_3rdPartyCommissions(type);
    } catch (e) {
        is_ra_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord returnauthorization
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_ra_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //is_ra_afterSubmitFunction(type);
    } catch (e) {
        is_ra_logError(e);
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
function is_ra_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}


/**
 * Adds 3rd Party Commission line items to the return authorization on create if the item has a Commission Rate value
 *
 * @appliedtorecord returnauthorization
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */

function is_ra_3rdPartyCommissions(type){
	
	//Only run on create
	if (type != 'create'){
		return;
	}
	
	
	//Run code to add 3rd party commission items, where applicable
	scg_so_set3rdPartyCommissionLines();
	
}



/**
 * Sets the client script to be used by this form
 * 
 * @appliedtorecord returnauthorization
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_ra_setClientScript(type, form, request) {
	form.setScript('customscript_scg_returnauthorization_cs');
}


/**
 * Handles click events on the Add Commission Lines button
 * 
 * @appliedtorecord returnauthorization
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_ra_addCommLinesButton(type, form, request){
	
	if (type == 'edit') {
		
		nlapiLogExecution('DEBUG', 'addCommLinesButton run', 'Add Commission Lines Button Added');
		
		form.addButton('custpage_add_comm_lines_button', 'Add Commission Lines', 'is_ra_3rdPartyCommissions()');
		
	}
}




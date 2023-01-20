/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       21 Aug 2018     Doug Humberd     Handles user events on Vendor Bill records
 * 1.10       23 Aug 2018     Doug Humberd     Added function is_vb_setCreatedFromPO to check if Vendor Bill was created from a PO.  If so, approve.
 * 1.15       10 Mar 2020     Doug Humberd     Added functionality to set Dept (line field) mandatory on VB Expenses tab
 * 1.20       10 Dec 2020     Doug Humberd     Commented out 'is_vb_setDeptOnExpLineMandatory' - moved to standalone script 'SCG_makeDeptColumnMandatory'
 *
 */


/**
 * Handles user events that occur before the record loads in the user's browser
 * 
 * @appliedtorecord vendorbill
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_vb_beforeLoad(type, form, request) {
	try {
		is_vb_setClientScript(type, form, request);
		is_vb_addRejectButton(type, form, request);
		is_vb_setCreatedFromPO(type, form, request);
		//is_vb_setDeptOnExpLineMandatory(type, form, request);//MOVED TO STANDALONE SCRIPT 'SCG_makeDeptColumnMandatory_UE'
	} catch (e) {
		is_vb_logError(e);
		throw e;
	}
}


/**
 * Performs actions immediately prior to a write event on a record.
 *
 * @appliedtorecord vendorbill
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_vb_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        //is_vb_beforeSubmitFunction(type);
    } catch (e) {
        is_vb_logError(e);
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
function is_vb_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}


/**
 * Sets the client script to be used by this form
 * 
 * @appliedtorecord vendorbill
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_vb_setClientScript(type, form, request) {
	form.setScript('customscript_scg_vendorbill_cs');
}


/**
 * Handles click events on the Reject button
 * 
 * @appliedtorecord vendorbill
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_vb_addRejectButton(type, form, request){
	
	if (type == 'view') {
		// Initialize variables
		var nextApprover = nlapiGetFieldValue('nextapprover');
		var user = nlapiGetContext().getUser();
		var role = nlapiGetContext().getRole();
		var approvalStatus = nlapiGetFieldValue('approvalstatus');
		//var employee = nlapiGetFieldValue('employee');
		
		nlapiLogExecution('DEBUG', 'Next Approver', nextApprover);
		nlapiLogExecution('DEBUG', 'User', user);
		
		//Supervisor, Exec, CFO, and CEO Stages
		//if ((nextApprover == user && approvalStatus == 1 /* Pending Approval */) || (role == 3 /* Administrator */ && approvalStatus == 1 /* Pending Approval */ && employee != user)){
		if ((nextApprover == user && approvalStatus == 1 /* Pending Approval */) || (role == 3 /* Administrator */ && approvalStatus == 1 /* Pending Approval */)){
			form.addButton('custpage_reject_button', 'Reject', 'is_vb_rejectionPopup()');
		}
		
	}
}


/**
 * Checks off the 'Created from PO' checkbox if Vendor Bill is created from a PO
 * 
 * @appliedtorecord vendorbill
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_vb_setCreatedFromPO(type, form, request){

	if (type != 'create'){
		return;
	}
	
	if (request == null){
		nlapiLogExecution('DEBUG', 'No request object', 'Approval Process Required');
		nlapiSetFieldValue('custbody_scg_created_from_po', 'F');
	}
	else{
		//var url = request.getURL();
		var param = request.getParameter('transform');
		//nlapiLogExecution('DEBUG', 'URL', url);
		nlapiLogExecution('DEBUG', 'Transform', param);

		if (param == 'purchord'){
			nlapiSetFieldValue('custbody_scg_created_from_po', 'T');
			nlapiLogExecution('DEBUG', 'purchord Parameter Found', 'Check off Created from PO');
		}

	}
	
}




function is_vb_setDeptOnExpLineMandatory(type, form, request){
	
	//Run in Edit mode, On Create, or On Copy
	if (type != 'edit' && type != 'create' && type != 'copy'){
		return;
	}
	
	//var lineLevelDept = nlapiGetLineItemField('expense', 'department', '1');
	var lineLevelDept = nlapiGetLineItemField('expense', 'department');
	
	if (lineLevelDept){
		lineLevelDept.setMandatory(true);
	}
	
}




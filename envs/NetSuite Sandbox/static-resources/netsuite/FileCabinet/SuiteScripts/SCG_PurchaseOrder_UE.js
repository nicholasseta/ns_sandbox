/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Aug 2018     Doug Humberd     Handles user events on Purchase Order records
 * 1.10       10 Aug 2018     Doug Humberd     Added beforeSubmit function, and a CapEx check that is analyzed in the PO Approval Workflow
 * 1.15       23 Mar 2021     Doug Humberd     Updated all functions for new WF - Certent Purchase Order Approval
 * 1.16       25 Mar 2021     Doug Humberd     Added 'Super Approver' logic
 * 1.20       23 Apr 2021     Doug Humberd     Updated for reworked PO Approval WF
 * 1.25       18 Jun 2021     Doug Humberd     Added 'is_po_addVendEmailButton' to manually send email to vendor for approved POs
 * 1.30       22 Mar 2022     Doug Humberd     Added 'Close PO' functionality
 * 1.35       10 May 2022     Doug Humberd     Updated for new "Employee Hierarchy" workflow updates
 *
 */


/**
 * Constants
 */
const FINANCE_ROLE = '1042';//User Role: IS Accounting Manager - Finance Procurement
const PURCH_ORD_APPROVER_REC = '1';//SCG Purchase Order Approvers Custom Record



/**
 * Handles user events that occur before the record loads in the user's browser
 * 
 * @appliedtorecord purchaseorder
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_po_beforeLoad(type, form, request) {
	try {
		is_po_setClientScript(type, form, request);
		is_po_addRejectButton(type, form, request);
		is_po_addVendEmailButton(type, form, request);
		is_po_addClosePOButton(type, form, request);
	} catch (e) {
		is_po_logError(e);
		throw e;
	}
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_po_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        is_po_capexCheck(type);
        //is_po_setDeptApprovers(type);
    } catch (e) {
        is_po_logError(e);
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
function is_po_logError(e) {
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
 * @appliedtorecord purchaseorder
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_po_setClientScript(type, form, request) {
	form.setScript('customscript_scg_purchaseorder_cs');
}


/**
 * Handles click events on the Reject button
 * 
 * @appliedtorecord purchaseorder
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_po_addRejectButton(type, form, request){
	
	if (type == 'view') {
		// Initialize variables
		var nextApprover = nlapiGetFieldValue('nextapprover');
		var user = nlapiGetContext().getUser();
		var role = nlapiGetContext().getRole();
		var approvalStatus = nlapiGetFieldValue('approvalstatus');
		var employee = nlapiGetFieldValue('employee');
		var cState = nlapiGetFieldValue('custbody_scg_po_appvl_current_state');
		
		nlapiLogExecution('DEBUG', 'Next Approver', nextApprover);
		nlapiLogExecution('DEBUG', 'User', user);
		
		//var superApprover = nlapiLookupField('customrecord_scg_purchase_order_approver', PURCH_ORD_APPROVER_REC , 'custrecord_scg_poa_super_approver');
		//nlapiLogExecution('DEBUG', 'Super Approver', superApprover);
		
		//***** Add Approve and Reject Buttons *****
		
		//Supervisor Approval State
		//if ((nextApprover == user && approvalStatus == 1 /* Pending Approval */) || ((role == 3 || role == 1012) /* Administrator or IS Accounting Manager */ && approvalStatus == 1 /* Pending Approval */ && employee != user)){
		if (((nextApprover == user && approvalStatus == 1 /* Pending Approval */) || ((role == 3 || role == FINANCE_ROLE) /* Administrator or Finance Procurement */ && approvalStatus == 1 /* Pending Approval */ && employee != user)) && cState == '2'){
			form.addButton('custpage_approve_button', 'Approve', 'is_po_approveClicked()');
			form.addButton('custpage_reject_button', 'Reject', 'is_po_rejectionPopup()');
		}
		
		// VP/SVP/GM Approval State
		//if (((nextApprover == user && approvalStatus == 1 /* Pending Approval */) || ((role == 3 || role == FINANCE_ROLE) /* Administrator or Finance Procurement */ && approvalStatus == 1 /* Pending Approval */ && employee != user)) && cState == '3'){
			//form.addButton('custpage_approve_button', 'Approve', 'is_po_approveClicked()');
			//form.addButton('custpage_reject_button', 'Reject', 'is_po_rejectionPopup()');
		//}
		
		//ELT Member Approval State
		//if (((nextApprover == user && approvalStatus == 1 /* Pending Approval */) || ((role == 3 || role == FINANCE_ROLE) /* Administrator or Finance Procurement */ && approvalStatus == 1 /* Pending Approval */ && employee != user)) && cState == '4'){
			//form.addButton('custpage_approve_button', 'Approve', 'is_po_approveClicked()');
			//form.addButton('custpage_reject_button', 'Reject', 'is_po_rejectionPopup()');
		//}
		
		//Head of FP&A Approval State
		if (((nextApprover == user && approvalStatus == 1 /* Pending Approval */) || ((role == 3 || role == FINANCE_ROLE) /* Administrator or Finance Procurement */ && approvalStatus == 1 /* Pending Approval */ && employee != user)) && cState == '5'){
			form.addButton('custpage_approve_button', 'Approve', 'is_po_approveClicked()');
			form.addButton('custpage_reject_button', 'Reject', 'is_po_rejectionPopup()');
		}
		
		//CFO Approval State
		if (((nextApprover == user && approvalStatus == 1 /* Pending Approval */) || ((role == 3 || role == FINANCE_ROLE) /* Administrator or Finance Procurement */ && approvalStatus == 1 /* Pending Approval */ && employee != user)) && cState == '6'){
			form.addButton('custpage_approve_button', 'Approve', 'is_po_approveClicked()');
			form.addButton('custpage_reject_button', 'Reject', 'is_po_rejectionPopup()');
		}
		
		//CEO Approval State
		if (((nextApprover == user && approvalStatus == 1 /* Pending Approval */) || ((role == 3 || role == FINANCE_ROLE) /* Administrator or Finance Procurement */ && approvalStatus == 1 /* Pending Approval */ && employee != user)) && cState == '7'){
			form.addButton('custpage_approve_button', 'Approve', 'is_po_approveClicked()');
			form.addButton('custpage_reject_button', 'Reject', 'is_po_rejectionPopup()');
		}
		
		//Finance - Procurement 2 State
		if (((role == 3 || role == FINANCE_ROLE) /* Administrator or Finance Procurement */ && approvalStatus == 1 /* Pending Approval */ && employee != user) && cState == '9'){
			//form.addButton('custpage_approve_button', 'Approve', 'is_po_approveClicked()');
			form.addButton('custpage_approve_button', 'Approve', 'is_po_confirmFilesAndApprove()');
			form.addButton('custpage_reject_button', 'Reject', 'is_po_rejectionPopup()');
		}
		
		
		
		//***** Add Super Approver Button *****
		//if (superApprover == user && approvalStatus == 1 /* Pending Approval */){
			//form.addButton('custpage_super_button', 'Super Approver', 'is_po_superApproverClicked()');
		//}
		
		
	}
}





function is_po_addVendEmailButton(type, form, request){
	
	if (type == 'view') {
		// Initialize variables
		var user = nlapiGetContext().getUser();
		var role = nlapiGetContext().getRole();
		var approvalStatus = nlapiGetFieldValue('approvalstatus');
		var cState = nlapiGetFieldValue('custbody_scg_po_appvl_current_state');
		var delayEmail = nlapiGetFieldValue('custbody_delay_email_to_vendor');
		
		//nlapiLogExecution('DEBUG', 'Next Approver', nextApprover);
		nlapiLogExecution('DEBUG', 'User', user);
		
		//***** Add Send Email to Vendor Button *****
		
		//Approved State
		if ((delayEmail == 'T' && approvalStatus == 2 /* Approved */ && (role == 3 || role == FINANCE_ROLE)) && cState == '11'){
			form.addButton('custpage_vend_email_button', 'Send Delayed Vendor Email', 'is_po_sendDelayedVendEmail()');
		}
		
	}
	
}






function is_po_addClosePOButton(type, form, request){
	
	if (type == 'view') {
		// Initialize variables
		var user = nlapiGetContext().getUser();
		var role = nlapiGetContext().getRole();
		var approvalStatus = nlapiGetFieldValue('approvalstatus');
		var cState = nlapiGetFieldValue('custbody_scg_po_appvl_current_state');
		
		//nlapiLogExecution('DEBUG', 'Next Approver', nextApprover);
		nlapiLogExecution('DEBUG', 'User', user);
		
		//***** Add Close PO Button *****
		
		//Rejected State
		if (((role == 3 || role == FINANCE_ROLE) /* Administrator or Finance Procurement */ && approvalStatus == 3 /* Rejected */) && cState == '12'){
			form.addButton('custpage_close_po_button', 'Close PO', 'is_po_closePO()');
		}
		
	}
	
}






function is_po_capexCheck(type){
	
	//Only run on Create
	if (type != 'create')
		return;
	
	var count = nlapiGetLineItemCount('item');
	var found = 0;
	
	//Search line items to see if any are a capital expense
	for (var i = 1; i <= count; i++){
		
		var item = nlapiGetLineItemValue('item', 'item', i);
		nlapiLogExecution('DEBUG', 'Item', item);
		var isCapex = nlapiLookupField('item', item, 'custitem_fixedasset');
		
		if (isCapex == 'T'){
			found = 1;
		}
		
	}
	
	if (found == '1'){
		nlapiSetFieldValue('custbody_scg_capex', 'T');
	} 
	else{
		nlapiSetFieldValue('custbody_scg_capex', 'F');
	}
	
}





function is_po_setDeptApprovers(type){
	
	//Run on Create and Edit
	if (type != 'create' && type != 'edit'){
		return;
	}

	
	var poId = nlapiGetRecordId();
	nlapiLogExecution('DEBUG', 'Purchase Order ID', poId);
	

	//Clear all Department Approver Values prior to analyzing line items
	nlapiSetFieldValue('custbody_department_approver_1', '');
	nlapiSetFieldValue('custbody_department_approver_2', '');
	nlapiSetFieldValue('custbody_department_approver_3', '');
	nlapiSetFieldValue('custbody_department_approver_4', '');
	nlapiSetFieldValue('custbody_department_approver_5', '');
	
	//Clear all ELT Member Values prior to analyzing line items
	nlapiSetFieldValue('custbody_scg_elt_member_1', '');
	nlapiSetFieldValue('custbody_scg_elt_member_2', '');
	nlapiSetFieldValue('custbody_scg_elt_member_3', '');
	nlapiSetFieldValue('custbody_scg_elt_member_4', '');
	nlapiSetFieldValue('custbody_scg_elt_member_5', '');
	
	
	var depts = [];
	
	//Build a list of department values on the PO
	var itemCount = nlapiGetLineItemCount('item');
	
	for (var i = 1; itemCount && i <= itemCount; i++){
		
		var department = nlapiGetLineItemValue('item', 'department', i);
		nlapiLogExecution('DEBUG', 'Department Line ' + i, department);
		
		if (depts.indexOf(department) == -1){
			depts.push(department);
		}
		
	}//End for i loop
	
	var numDepts = depts.length;
	nlapiLogExecution('DEBUG', 'Number of Departments Found', numDepts);
	nlapiLogExecution('DEBUG', 'Department List', depts);
	
	
	//Update Department Approver / ELT Member values on the Purchase Order
	for (var d = 0; d < numDepts; d++){
		
		var deptId = depts[d];
		nlapiLogExecution('DEBUG', 'Dept Id ' + d, deptId);
		
		var deptApprover = nlapiLookupField('department', deptId, 'custrecord_department_approver');
		nlapiLogExecution('DEBUG', 'Department Approver ' + d, deptApprover);
		
		var number = Number(d) + 1;
		
		var deptAppIntId = 'custbody_department_approver_' + number;
		nlapiLogExecution('DEBUG', 'Department Approver Internal ID', deptAppIntId);

		if (isEmpty(deptApprover)){
			nlapiLogExecution('DEBUG', 'Department Approver Missing for Dept:', department);
		}else{
			nlapiLogExecution('DEBUG', 'Set Department Approver ' + number, deptApprover);
			nlapiSetFieldValue(deptAppIntId, deptApprover);
		}
		
		
		var eltMember = nlapiLookupField('department', deptId, 'custrecord_scg_dept_elt_member');
		nlapiLogExecution('DEBUG', 'ELT Member ' + d, eltMember);
		
		var eltMemIntId = 'custbody_scg_elt_member_' + number;
		nlapiLogExecution('DEBUG', 'ELT Member Internal ID', eltMemIntId);
		
		if (isEmpty(eltMember)){
			nlapiLogExecution('DEBUG', 'ELT Member Missing for Dept:', department);
		}else{
			nlapiLogExecution('DEBUG', 'Set ELT MEMBER ' + number, eltMember);
			nlapiSetFieldValue(eltMemIntId, eltMember);
		}
		
	}//End for d loop
	
	
}






function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}  





/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       21 Mar 2019     Doug Humberd     Handles User Events on Customer Refund Records
 * 											   Added 'is_cr_updRecordStatusOnCreditMemo' function to update the Record Status' field on the associated credit memo (if applied to a credit memo)
 * 1.10       24 Feb 2020     Doug Humberd     Added functionality to capture Reject Reason for Customer Refund Approval Process WF
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord customerrefund
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_cr_beforeLoad(type, form, request){
    try {
    	is_cr_setClientScript(type, form, request);
		is_cr_addRejectButton(type, form, request);
        //is_cr_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_cr_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord customerrefund
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_cr_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        //is_cr_beforeSubmitFunction(type);
    } catch (e) {
        is_cr_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord customerrefund
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_cr_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        is_cr_updRecordStatusOnCreditMemo(type);
    } catch (e) {
        is_cr_logError(e);
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
function is_cr_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function is_cr_updRecordStatusOnCreditMemo(type){
	
	//Run on create, edit, and delete
	//if (type != 'edit'){
		//return;
	//}
	
	nlapiLogExecution('DEBUG', 'Run Type', type);
	
	//Initialize Variables
	var crRec = nlapiGetNewRecord();
	var oldcrRec = nlapiGetOldRecord();
	
	var applyCount = crRec.getLineItemCount('apply');
	
	for (var i = 1; i <= applyCount; i++){
		
		var applyType = crRec.getLineItemValue('apply', 'trantype', i);
		nlapiLogExecution('DEBUG', 'applyType', applyType);
		var applyChecked = crRec.getLineItemValue('apply', 'apply', i);
		nlapiLogExecution('DEBUG', 'Apply Checkbox', applyChecked);
		
		if (oldcrRec){
			var applyOrigChecked = oldcrRec.getLineItemValue('apply', 'apply', i);
			nlapiLogExecution('DEBUG', 'Original Apply Checkbox', applyOrigChecked);
		}else{
			var applyOrigChecked = 'F';
		}
		
		//Only Update if Credit Memo and if either the Apply checkbox is Checked or Apply checkbox was unchecked (was originally checked)
		if (applyType == 'CustCred' && (applyChecked == 'T' || (applyChecked == 'F' && applyOrigChecked == 'T'))){
			
			var cmId = crRec.getLineItemValue('apply', 'internalid', i);
			nlapiLogExecution('DEBUG', 'Apply Checked, Credit Memo Found', 'Credit Memo # ' + cmId);
			
			var invFound = 'N';
			var custRefFound = 'N';
			var jeFound = 'N';
			
			var searchresults = is_getAppliedToTransactionValues(cmId);
			
			if (searchresults){
				
				//nlapiLogExecution('DEBUG', 'Search Results Found', 'SUCCESS');
				
				for (var x = 0; x < searchresults.length; x++){
					
					var appliedToTransaction = searchresults[x].getValue('appliedtotransaction');
					var appliedToTransactionText = searchresults[x].getText('appliedtotransaction');
					//nlapiLogExecution('DEBUG', 'Applied To Transaction line ' + x, appliedToTransaction);
					nlapiLogExecution('DEBUG', 'Applied To Trans Text line ' + x, appliedToTransactionText);
					
					if (appliedToTransactionText.indexOf('Invoice') != -1){
						invFound = 'Y';
					}
					
					if (appliedToTransactionText.indexOf('Refund') != -1){
						custRefFound = 'Y';
					}
					
					if (appliedToTransactionText.indexOf('Journal') != -1){
						jeFound = 'Y';
					}
					
				}
				
				nlapiLogExecution('DEBUG', 'invFound', invFound);
				nlapiLogExecution('DEBUG', 'custRefFound', custRefFound);
				nlapiLogExecution('DEBUG', 'jeFound', jeFound);
				
			}
			
			var recStatus = '24';//24 = CM: Open
			var cmRec = nlapiLoadRecord('creditmemo', cmId, {recordmode: 'dynamic'});
			
			if (invFound == 'Y' && custRefFound == 'N' && jeFound == 'N'){
				recStatus = '7';//7 = CM: Applied to Invoice
			}
			else if (invFound == 'N' && custRefFound == 'Y' && jeFound == 'N'){
				recStatus = '8';//8 = CM: Refunded
			}
			else if (invFound == 'N' && custRefFound == 'N' && jeFound == 'Y'){
				recStatus = '25';//25 = CM: Journal Applied
			}
			else if (invFound == 'Y' && custRefFound == 'Y' && jeFound == 'N'){
				recStatus = '11';//11 = CM: Applied to Invoice and Refunded
			}
			else if (invFound == 'Y' && custRefFound == 'N' && jeFound == 'Y'){
				recStatus = '26';//26 = CM: Applied to Invoice and Journal Applied
			}
			else if (invFound == 'N' && custRefFound == 'Y' && jeFound == 'Y'){
				recStatus = '27';//27 = CM: Refunded and Journal Applied
			}
			else if (invFound == 'Y' && custRefFound == 'Y' && jeFound == 'Y'){
				recStatus = '28';//28 = CM: Applied to Invoice, Refunded, and Journal Applied
			}
			
			nlapiLogExecution('DEBUG', 'Set Record Status to:', recStatus);
			
			cmRec.setFieldValue('custbody_scg_record_status', recStatus);
			nlapiSubmitRecord(cmRec);
			
		}//End if (applyType == 'CustCred' && (applyChecked == 'T' || (applyChecked == 'F' && applyOrigChecked == 'T')))
		
	}
	
}




/**
 * Returns a list of applied to transaction values for a given credit memo record
 * 
 * @appliedtorecord creditmemo
 * 
 * @returns {nlobjSearch}
 */
function is_getAppliedToTransactionValues(cmId){
	// Define filters
	var filters = new Array();
	//filters.push(new nlobjSearchFilter('type', null, 'anyof', 'invoice'));
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', cmId));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	//columns.push(new nlobjSearchColumn('payingtransaction', null, null));
	columns.push(new nlobjSearchColumn('appliedtotransaction', null, null));

	return nlapiSearchRecord('creditmemo', null, filters, columns);
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
 * Sets the client script to be used by this form
 * 
 * @appliedtorecord customerrefund
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_cr_setClientScript(type, form, request) {
	form.setScript('customscript_scg_customerrefund_cs');
}


/**
 * Handles click events on the Reject button
 * 
 * @appliedtorecord customerrefund
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_cr_addRejectButton(type, form, request){
	
	if (type == 'view') {
		// Initialize variables
		var refApprover = nlapiGetFieldValue('custbody_refund_approver');
		var user = nlapiGetContext().getUser();
		var role = nlapiGetContext().getRole();
		var refAppStatus = nlapiGetFieldValue('custbody_refund_approval_status');
		
		nlapiLogExecution('DEBUG', 'Refund Approver', refApprover);
		nlapiLogExecution('DEBUG', 'User', user);
		nlapiLogExecution('DEBUG', 'Refund Approval Status', refAppStatus);
		
		//Approver 1, Approver 2, and Approver - Final stages
		if ((refApprover == user && refAppStatus == 1 /* Pending Approval */) || (role == 3 /* Administrator */ && refAppStatus == 1 /* Pending Approval */ )){
			form.addButton('custpage_reject_button', 'Reject', 'is_cr_rejectionPopup()');
		}
		
	}
}



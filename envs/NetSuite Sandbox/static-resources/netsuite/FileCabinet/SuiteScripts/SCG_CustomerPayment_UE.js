/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       21 Mar 2019     Doug Humberd     Handles User Events on Customer Payment Records
 * 											   Added 'is_cp_updRecordStatusOnInvoice' function to update the Record Status' field on the associated invoice (if created for an invoice)
 * 1.10       28 Mar 2019     Doug Humberd     Updated 'is_cp_updRecordStatusOnInvoice' to include scenarios for Journal Entries
 * 1.20       02 Apr 2019     Doug Humberd     Updated 'is_cp_updRecordStatusOnInvoice' to simplify the number of values available in the Record Status field (list)
 * 1.30       08 Apr 2019     Doug Humberd     Updated 'is_cp_updRecordStatusOnInvoice' to run new function 'is_cp_updRecordStatusOnCreditMemo' to update Record Status on the credit memo record - also works standalone when JE is created via Customer Payment
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord customerpayment
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_cp_beforeLoad(type, form, request){
    try {
        //is_cp_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_cp_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord customerpayment
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_cp_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        //is_cp_beforeSubmitFunction(type);
    } catch (e) {
        is_cp_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord customerpayment
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_cp_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        is_cp_updRecordStatusOnInvoice(type);
        is_cp_updRecordStatusOnCreditMemo(type);
    } catch (e) {
        is_cp_logError(e);
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
function is_cp_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function is_cp_updRecordStatusOnInvoice(type){
	
	//Run on create, edit, and delete
	//if (type != 'edit'){
		//return;
	//}
	
	nlapiLogExecution('DEBUG', 'Run Type', type);
	
	//Initialize Variables
	var cpRec = nlapiGetNewRecord();
	var oldcpRec = nlapiGetOldRecord();
	
	var applyCount = cpRec.getLineItemCount('apply');
	
	for (var i = 1; i <= applyCount; i++){
		
		var applyType = cpRec.getLineItemValue('apply', 'trantype', i);
		nlapiLogExecution('DEBUG', 'applyType', applyType);
		var applyChecked = cpRec.getLineItemValue('apply', 'apply', i);
		nlapiLogExecution('DEBUG', 'Apply Checkbox', applyChecked);
		
		if (oldcpRec){
			var applyOrigChecked = oldcpRec.getLineItemValue('apply', 'apply', i);
			nlapiLogExecution('DEBUG', 'Original Apply Checkbox', applyOrigChecked);
		}else{
			var applyOrigChecked = 'F';
		}
		
		//Only Update if Invoice and if either the Apply checkbox is Checked or Apply checkbox was unchecked (was originally checked)
		if (applyType == 'CustInvc' && (applyChecked == 'T' || (applyChecked == 'F' && applyOrigChecked == 'T'))){
			
			var invId = cpRec.getLineItemValue('apply', 'internalid', i);
			nlapiLogExecution('DEBUG', 'Apply Checked, Invoice Found', 'Invoice # ' + invId);
			
			var cmFound = 'N';
			var payFound = 'N';
			var jeFound = 'N';
			
			var searchresults = is_getPayingTransactionValues(invId);
			
			if (searchresults){
				
				//nlapiLogExecution('DEBUG', 'Search Results Found', 'SUCCESS');
				
				for (var x = 0; x < searchresults.length; x++){
					
					var payTransaction = searchresults[x].getValue('payingtransaction');
					var payTransactionText = searchresults[x].getText('payingtransaction');
					//nlapiLogExecution('DEBUG', 'Paying Transaction line ' + x, payTransaction);
					nlapiLogExecution('DEBUG', 'Paying Trans Text line ' + x, payTransactionText);
					
					if (payTransactionText.indexOf('Credit Memo') != -1){
						cmFound = 'Y';
						var cmId = payTransaction;
						nlapiLogExecution('DEBUG', 'Credit Memo Id', cmId);
						//Credit Memo Found - Update Record Status field on Credit Memo
						is_cp_updRecordStatusOnCreditMemo(type, cmId);
						nlapiLogExecution('DEBUG', 'Credit Memo function Finished', 'CONTINUE w Invoice Update');
					}
					
					if (payTransactionText.indexOf('Payment') != -1){
						payFound = 'Y';
					}
					
					if (payTransactionText.indexOf('Journal') != -1){
						jeFound = 'Y';
					}
					
				}
				
				nlapiLogExecution('DEBUG', 'cmFound', cmFound);
				nlapiLogExecution('DEBUG', 'payFound', payFound);
				nlapiLogExecution('DEBUG', 'jeFound', jeFound);
				
			}
			
			var recStatus = '1';//1 = Inv: Open
			var invRec = nlapiLoadRecord('invoice', invId, {recordmode: 'dynamic'});
			
			if (cmFound == 'Y' && payFound == 'N' && jeFound == 'N'){
				recStatus = '2';//2 = Inv: Credit Applied
			}
			else if (cmFound == 'N' && payFound == 'Y' && jeFound == 'N'){
				recStatus = '3';//3 = Inv: Payment Applied
			}
			else if (cmFound == 'N' && payFound == 'N' && jeFound == 'Y'){
				recStatus = '4';//4 = Inv: Journal Applied
			}
			else if (cmFound == 'Y' && payFound == 'Y' && jeFound == 'N'){
				recStatus = '5';//5 = Inv: Credit and Payment Applied
			}
			else if (cmFound == 'Y' && payFound == 'N' && jeFound == 'Y'){
				recStatus = '6';//6 = Inv: Credit and Journal Applied
			}
			else if (cmFound == 'N' && payFound == 'Y' && jeFound == 'Y'){
				recStatus = '34';//34 = Inv: Payment and Journal Applied
			}
			else if (cmFound == 'Y' && payFound == 'Y' && jeFound == 'Y'){
				recStatus = '35';//35 = Inv: Credit, Payment, and Journal Applied
			}
			
			nlapiLogExecution('DEBUG', 'Set Record Status to:', recStatus);
			
			invRec.setFieldValue('custbody_scg_record_status', recStatus);
			nlapiSubmitRecord(invRec);
			
		}//End if (applyType == 'CustInvc' && applyChecked == 'T')
		
	}
	
}




/**
 * Returns a list of paying transaction values for a given invoice record
 * 
 * @appliedtorecord customrecord_scg_emp_processing_queue
 * 
 * @returns {nlobjSearch}
 */
function is_getPayingTransactionValues(invId){
	// Define filters
	var filters = new Array();
	//filters.push(new nlobjSearchFilter('type', null, 'anyof', 'invoice'));
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', invId));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('payingtransaction', null, null));

	return nlapiSearchRecord('invoice', null, filters, columns);
}





function is_cp_updRecordStatusOnCreditMemo(type, cmId){
	
	//Run on create, edit, and delete
	//if (type != 'edit'){
		//return;
	//}
	
	nlapiLogExecution('DEBUG', 'Run Type', type);
	nlapiLogExecution('DEBUG', 'Start updRecordStatusOnCreditMemo', 'START CREDIT MEMO');
	
	//Initialize Variables
	var cpRec = nlapiGetNewRecord();
	//var oldcpRec = nlapiGetOldRecord();
	
	var creditCount = cpRec.getLineItemCount('credit');
	
	for (var i = 1; i <= creditCount; i++){
		
		var creditType = cpRec.getLineItemValue('credit', 'trantype', i);
		nlapiLogExecution('DEBUG', 'creditType', creditType);
		var creditChecked = cpRec.getLineItemValue('credit', 'apply', i);
		nlapiLogExecution('DEBUG', 'Credit Checkbox', creditChecked);
		
		//if (oldcpRec){
			//var applyOrigChecked = oldcpRec.getLineItemValue('apply', 'apply', i);
			//nlapiLogExecution('DEBUG', 'Original Apply Checkbox', applyOrigChecked);
		//}else{
			//var applyOrigChecked = 'F';
		//}
		
		//Only Update if Credit Memo and if the Apply checkbox is Checked
		if (creditType == 'CustCred' && creditChecked == 'T'){
			
			var cmId = cpRec.getLineItemValue('credit', 'internalid', i);
			nlapiLogExecution('DEBUG', 'Credit Checked, Credit Memo Found', 'Credit Memo # ' + cmId);
			
			var invFound = 'N';
			var custRefFound = 'N';
			var jeFound = 'N';
			
			var searchresults = is_getAppliedToTransactionValues(cmId);
			
			if (searchresults){
				
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
			var creditmemoRec = nlapiLoadRecord('creditmemo', cmId, {recordmode: 'dynamic'});
			
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
			
			creditmemoRec.setFieldValue('custbody_scg_record_status', recStatus);
			nlapiSubmitRecord(creditmemoRec);
			
		}//End if (creditType == 'CustCred' && creditChecked == 'T')
		
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



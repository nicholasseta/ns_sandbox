/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       21 Mar 2019     Doug Humberd     Handles User Events on Credit Memo Records
 * 											   Added 'is_cm_updRecordStatusOnInvoice' function to update 'Record Status' field on invoice if CM is created from an Invoice
 * 1.10       28 Mar 2019     Doug Humberd     Updated 'is_cm_updRecordStatusOnInvoice' to include scenarios for Journal Entries
 * 1.20       02 Apr 2019     Doug Humberd     Updated 'is_cm_updRecordStatusOnInvoice' to simplify the number of values available in the Record Status field (list)
 * 1.30       05 Apr 2019     Doug Humberd     Added 'is_cm_updRecordStatus' to update 'Record Status' field on the credit memo
 * 1.35       19 Jul 2021     Doug Humberd     Added 'print_invoice_html' (incl. LIB file) to run Print Amount Code on CM
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord creditmemo
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_cm_beforeLoad(type, form, request){
    try {
        //is_cm_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_cm_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord creditmemo
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_cm_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        //is_cm_beforeSubmitFunction(type);
    } catch (e) {
        is_cm_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord creditmemo
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_cm_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        is_cm_updRecordStatusOnInvoice(type);
        is_cm_updRecordStatus(type);
        print_invoice_html(type);
    } catch (e) {
        is_cm_logError(e);
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
function is_cm_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function is_cm_updRecordStatusOnInvoice(type){
	
	//Run on create, edit, and delete
	//if (type != 'edit'){
		//return;
	//}
	
	nlapiLogExecution('DEBUG', 'Run Type', type);
	
	//Initialize Variables
	var cmRec = nlapiGetNewRecord();
	var oldcmRec = nlapiGetOldRecord();
	
	var applyCount = cmRec.getLineItemCount('apply');
	
	for (var i = 1; i <= applyCount; i++){
		
		var applyType = cmRec.getLineItemValue('apply', 'trantype', i);
		nlapiLogExecution('DEBUG', 'applyType', applyType);
		var applyChecked = cmRec.getLineItemValue('apply', 'apply', i);
		nlapiLogExecution('DEBUG', 'Apply Checkbox', applyChecked);
		
		if (oldcmRec){
			var applyOrigChecked = oldcmRec.getLineItemValue('apply', 'apply', i);
			nlapiLogExecution('DEBUG', 'Original Apply Checkbox', applyOrigChecked);
		}else{
			var applyOrigChecked = 'F';
		}
		
		//Only Update if Invoice and if either the Apply checkbox is Checked or Apply checkbox was unchecked (was originally checked)
		if (applyType == 'CustInvc' && (applyChecked == 'T' || (applyChecked == 'F' && applyOrigChecked == 'T'))){
			
			var invId = cmRec.getLineItemValue('apply', 'internalid', i);
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




function is_cm_updRecordStatus(type){
	
	//Run on create and edit
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'Run Type', type);
	
	//Initialize Variables
	var cmRec = nlapiGetNewRecord();
	var cmId = cmRec.getId();
	nlapiLogExecution('DEBUG', 'Credit Memo Id', cmId);
	
	var invFound = 'N';
	var custRefFound = 'N';
	var jeFound = 'N';
	
	var searchresults = is_getAppliedToTransactionValues(cmId);
	
	if (searchresults){
		
		for (var i = 0; i < searchresults.length; i++){
			
			var appliedToTransaction = searchresults[i].getValue('appliedtotransaction');
			var appliedToTransactionText = searchresults[i].getText('appliedtotransaction');
			//nlapiLogExecution('DEBUG', 'Applied To Transaction line ' + i, appliedToTransaction);
			nlapiLogExecution('DEBUG', 'Applied To Trans Text line ' + i, appliedToTransactionText);
			
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
	
	var currRecStatus = cmRec.getFieldValue('custbody_scg_record_status');
	
	if (isEmpty(currRecStatus) || currRecStatus != recStatus){
		
		var creditmemoRec = nlapiLoadRecord('creditmemo', cmId, {recordmode: 'dynamic'});
		creditmemoRec.setFieldValue('custbody_scg_record_status', recStatus);
		nlapiSubmitRecord(creditmemoRec);
		
	}
	
}



/**
 * Returns a list of paying transaction values for a given invoice record
 * 
 * @appliedtorecord customrecord_scg_emp_processing_queue
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



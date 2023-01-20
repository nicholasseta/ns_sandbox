/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       29 Mar 2019     Doug Humberd     Handles User Events on Journal Entry Records
 * 											   Added 'is_je_updRecordStatusOnInvoice' function to update 'Record Status' field on invoice if JE is applied to an Invoice
 * 1.10       02 Apr 2019     Doug Humberd     Updated 'is_je_updRecordStatusOnInvoice' to simplify the number of values available in the Record Status field (list)
 * 1.15       01 May 2020     Doug Humberd     Minor updates to 'is_je_clearCustRefFieldsAfterVoid'
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord journalentry
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_je_beforeLoad(type, form, request){
    try {
        //is_je_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_je_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately before a write event on a record.
 *
 * @appliedtorecord journalentry
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_je_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        //is_je_beforeSubmitFunction(type);
    	is_je_checkIfAppliedToInvoice(type);
    } catch (e) {
        is_je_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord journalentry
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_je_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        is_je_updRecordStatusOnInvoice(type);
        //is_je_clearCustRefFieldsAfterVoid(type);
    } catch (e) {
        is_je_logError(e);
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
function is_je_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}




function is_je_checkIfAppliedToInvoice(type){
	
	//Run on edit and delete
	if (type != 'edit' && type != 'delete'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'Run Type', type);
	
	var jeRec = nlapiGetNewRecord();
	var jeId = jeRec.getId();
	nlapiLogExecution('DEBUG', 'Journal Entry Id', jeId);
	
	var invFound = 'N';
	var invArray = '';
	var seperator = ',';
	
	var searchresults = is_getAppliedToTransactionValues(jeId);
	
	if (searchresults){
		
		nlapiLogExecution('DEBUG', 'Search Results Found', 'SUCCESS');
		
		for (var i = 0; i < searchresults.length; i++){
			
			var appliedToTransaction = searchresults[i].getValue('appliedtotransaction');
			var appliedToTransactionText = searchresults[i].getText('appliedtotransaction');
			nlapiLogExecution('DEBUG', 'Applied to Transaction line ' + i, appliedToTransaction);
			nlapiLogExecution('DEBUG', 'Applied to Trans Text line ' + i, appliedToTransactionText);
			
			if (appliedToTransactionText.indexOf('Invoice') != -1){
				invFound = 'Y';
				var invId = appliedToTransaction;
				
				if (invArray == ''){
					invArray = invId;
				}else{
					invArray = invArray + seperator + invId;
				}
				
			}
			
		}
		
		nlapiLogExecution('DEBUG', 'invFound', invFound);
		
	}
	
	if (invFound == 'Y'){
		
		nlapiSetFieldValue('custbody_scg_applied_to_invoice', invArray);
		
	}//End if invFound = Y
	
}




/**
 * Returns a list of applied to transaction values for a given journal entry record
 * 
 * @appliedtorecord journalentry
 * 
 * @returns {nlobjSearch}
 */
function is_getAppliedToTransactionValues(jeId){
	// Define filters
	var filters = new Array();
	//filters.push(new nlobjSearchFilter('type', null, 'anyof', 'invoice'));
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', jeId));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	//columns.push(new nlobjSearchColumn('payingtransaction', null, null));
	columns.push(new nlobjSearchColumn('appliedtotransaction', null, null));

	return nlapiSearchRecord('journalentry', null, filters, columns);
}




function is_je_updRecordStatusOnInvoice(type){
	
	nlapiLogExecution('DEBUG', 'Run Type', type);
	
	var jeRec = nlapiGetNewRecord();
	var jeId = jeRec.getId();
	
	var invList = jeRec.getFieldValue('custbody_scg_applied_to_invoice');
	nlapiLogExecution('DEBUG', 'Invoice Array', invList);
	
	if (!isEmpty(invList)){
		
		var invArray = invList.split(',');
		
		for (var z = 0; z < invArray.length; z++){
			
			var invId = invArray[z];
			nlapiLogExecution('DEBUG', 'Invoice ID # ' + z, invId);
			
			var cmFound = 'N';
			var payFound = 'N';
			var jeFound = 'N';
			
			var searchresultsInv = is_getPayingTransactionValues(invId);
			
			if (searchresultsInv){
				
				//nlapiLogExecution('DEBUG', 'Search Results Found', 'SUCCESS');
				
				for (var x = 0; x < searchresultsInv.length; x++){
					
					var payTransaction = searchresultsInv[x].getValue('payingtransaction');
					var payTransactionText = searchresultsInv[x].getText('payingtransaction');
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
			
			//Clear out Applied to Invoice field
			nlapiSubmitField('journalentry', jeId, 'custbody_scg_applied_to_invoice', '');
			
		}//End invArray for loop
		
	}//End !isEmpty(invList)
	
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



function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}





function is_je_clearCustRefFieldsAfterVoid(type){
	
	if (type != 'create'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'clearCustRefFieldsAfterVoid', 'START');
	
	var voidOf = nlapiGetFieldValue('createdfrom');
	var voidOfText = nlapiGetFieldText('createdfrom');
	
	nlapiLogExecution('DEBUG', 'Void Of', voidOf);
	nlapiLogExecution('DEBUG', 'Void Of Text', voidOfText);
	
	if (voidOfText.indexOf('Customer Refund') != -1){
		nlapiLogExecution('DEBUG', 'Customer Refund Found', 'FOUND');
		
		var crRec = nlapiLoadRecord('customerrefund', voidOf);
		
		var voided = crRec.getFieldValue('voided');
		nlapiLogExecution('DEBUG', 'voided', voided);
		
		if (voided == 'T'){
			
			nlapiLogExecution('DEBUG', 'Voided = T', 'Clear Fields');
			//crRec.setFieldValue('custbody_refund_created_by', '');
			crRec.setFieldValue('custbody_refund_status', '5');
			//crRec.setFieldText('custbody_refund_approver', '');
			crRec.setFieldValue('tobeprinted', 'F');
			
		}
		
		nlapiLogExecution('DEBUG', 'Submit Record', 'SUBMIT');
		nlapiSubmitRecord(crRec);
		
	}
	
	nlapiLogExecution('DEBUG', 'clearCustRefFieldsAfterVoid', 'END');
	
}





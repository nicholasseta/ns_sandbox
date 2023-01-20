/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Aug 2018     Doug Humberd	   After Submit script that runs on custom record type 'Create Check Records' to create Check Records imported from CSV files
 *
 */

/**
 * Constants
 *
 */
const DEPARTMENT = '20';//20 = G&A
const TO_BE_PRINTED = 'F';

/**
 * Writes an error message to the Script Execution Log
 * 
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 * 
 * @returns {Void}
 */
function is_ccr_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}


/**
 * Performs actions immediately before a write event on a record.
 * 
 * @appliedtorecord Create Check Records
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_ccr_afterSubmit(type) {
	try {
		is_ccr_createCheckRecord(type);
	} catch (e) {
		is_ccr_logError(e);
		throw e;
	}
}



/**
 * Performs actions immediately before a write event on a record.
 * 
 * @appliedtorecord Create Check Record
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_ccr_createCheckRecord(type){
	try {
		// Initialize variables
        var ccrRec = nlapiGetNewRecord();
        var complete = ccrRec.getFieldValue('custrecord_scg_ccr_complete');
        
        //Don't run if Complete field is checked
        if (complete == 'T'){
        	nlapiLogExecution('DEBUG', 'Complete is checked', complete);
        	return;
        }
        
        //Get Body values
        var ccrPayee = ccrRec.getFieldValue('custrecord_scg_ccr_payee');
        var ccrAccount = ccrRec.getFieldValue('custrecord_scg_ccr_account');
        var ccrSubsidiary = ccrRec.getFieldValue('custrecord_scg_ccr_subsidiary');
        var ccrDate = ccrRec.getFieldValue('custrecord_scg_ccr_date');
        var ccrCheckNum = ccrRec.getFieldValue('custrecord_scg_ccr_check_number');
        var ccrMemo = ccrRec.getFieldValue('custrecord_scg_ccr_memo');
        var ccrCurrency = ccrRec.getFieldValue('custrecord_scg_ccr_currency');
        var ccrExchRate = ccrRec.getFieldValue('custrecord_scg_ccr_exchange_rate');
        
        nlapiLogExecution('DEBUG', 'Payee', ccrPayee);
        nlapiLogExecution('DEBUG', 'Account', ccrAccount);
        nlapiLogExecution('DEBUG', 'Subsidiary', ccrSubsidiary);
        nlapiLogExecution('DEBUG', 'Date', ccrDate);
        nlapiLogExecution('DEBUG', 'Check #', ccrCheckNum);
        nlapiLogExecution('DEBUG', 'Memo', ccrMemo);
        nlapiLogExecution('DEBUG', 'Currency', ccrCurrency);
        nlapiLogExecution('DEBUG', 'Exchange Rate', ccrExchRate);
        
        //Get Item values
        var ccrItemAcct = ccrRec.getFieldValue('custrecord_scg_ccr_line_item_acct');
        var ccrItemAmount = ccrRec.getFieldValue('custrecord_scg_ccr_line_item_amount');//NOT SURE WE NEED THIS VALUE
        var ccrForeignAmount = ccrRec.getFieldValue('custrecord_scg_ccr_foreign_amount');
        
        nlapiLogExecution('DEBUG', 'Item Account', ccrItemAcct);
        nlapiLogExecution('DEBUG', 'Amount', ccrItemAmount);
        nlapiLogExecution('DEBUG', 'Foreign Amount', ccrForeignAmount);
        
        var ccrTranId;
        
        //Create Check Record
        nlapiLogExecution('DEBUG', 'Create Check Record', 'Amount = ' + ccrForeignAmount);
        
        //return;
        	
        var chkTranRec = nlapiCreateRecord('check', {recordmode: 'dynamic'});
        
        nlapiLogExecution('DEBUG', 'Check Record', chkTranRec);
            
        //Set Body fields
        chkTranRec.setFieldValue('entity', ccrPayee);
        chkTranRec.setFieldValue('account',ccrAccount);
        chkTranRec.setFieldValue('currency', ccrCurrency);
        chkTranRec.setFieldValue('exchangerate', ccrExchRate);
        chkTranRec.setFieldValue('trandate', ccrDate);
        chkTranRec.setFieldValue('tobeprinted', TO_BE_PRINTED);
        //chkTranRec.setFieldValue('tranid', ccrCheckNum);
        chkTranRec.setFieldValue('memo', ccrMemo);
        chkTranRec.setFieldValue('subsidiary', ccrSubsidiary);
        
        nlapiLogExecution('DEBUG', 'Set Body Fields', 'Done');
        
        // Add items to item sublist
        chkTranRec.selectNewLineItem('expense');
        chkTranRec.setCurrentLineItemValue('expense', 'account', ccrItemAcct);
        chkTranRec.setCurrentLineItemValue('expense', 'amount', ccrForeignAmount);
        chkTranRec.setCurrentLineItemValue('expense', 'department', DEPARTMENT);
        
        nlapiLogExecution('DEBUG', 'Set Item Fields', 'Done');

        //return;
        
        chkTranRec.commitLineItem('expense');
            
        //Submit New Check Record
        ccrTranId = nlapiSubmitRecord(chkTranRec, true, true);
        
        //Update the Check # field after the Record has been submitted
        nlapiSubmitField('check', ccrTranId, 'tranid', ccrCheckNum);
        	
        // Update custom record
       	nlapiSubmitField('customrecord_scg_create_check_records', nlapiGetRecordId(), ['custrecord_scg_ccr_complete', 'custrecord_scg_ccr_check_record'], ['T', ccrTranId]);

       	nlapiLogExecution('DEBUG', 'Script Completed', 'END');
       	
	} catch(e) {
        var errorMessage = '';
		if (e instanceof nlobjError) {
			errorMessage = e.getCode() + '\n' + e.getDetails();
			nlapiLogExecution( 'DEBUG', 'System Error', errorMessage );
		} else {
			errorMessage = e.toString();
			nlapiLogExecution( 'DEBUG', 'Unexpected Error', errorMessage );
		}
		// Record the error on the Create Check Record custom record
		nlapiSubmitField('customrecord_scg_create_check_records', nlapiGetRecordId(), 'custrecord_scg_ccr_error', errorMessage);
	}
	
}


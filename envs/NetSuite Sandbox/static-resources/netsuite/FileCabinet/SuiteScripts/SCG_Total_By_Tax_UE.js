/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       11 Jul 2020     Doug Humberd     Sets the Total by Tax value on Invoices
 * 1.05       13 Jul 2020     Doug Humberd     Updated to skip line if Tax Amount = null
 * 1.10       23 Feb 2021     Doug Humberd     Updated Line Field ID - Changed from 'custcol_scg_total_by_tax' to 'custcol_scg_total_tax_by_taxcode'
 * 1.11       20 Dec 2021     Doug Humberd     Updated to always run in Edit mode
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
//const OPENAIR_INTEGRATION = '5453';//OpenAir Integration Item
//const DUE_ON_RECEIPT = '4';


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_tbt_beforeLoad(type, form, request){
    try {
        //is_tbt_beforeLoadScript(type, form, request);
    } catch (e) {
        is_tbt_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_tbt_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        //is_tbt_beforeSubmitScript(type);
    } catch (e) {
        is_tbt_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_tbt_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        is_tbt_setTotalByTax(type);
      	//is_tbt_afterSubmitScript(type);
    } catch (e) {
        is_tbt_logError(e);
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
function is_tbt_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



/**
 * Sets the Print Total Hours field on the invoice
 *
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_tbt_setTotalByTax(type){
	
	if (type === 'delete'){
		return;
	}
	
	try{
		
	nlapiLogExecution('DEBUG', 'setTotalByTax UE', 'START');
	nlapiLogExecution('DEBUG', 'Execution Type', type);
		  
	var startUsage = nlapiGetContext().getRemainingUsage();
	nlapiLogExecution('DEBUG', 'Start Usage', startUsage);
	var endUsage;
	
	//PER CHERRIE - ALWAYS RUN IN EDIT MODE
	//var amtChanged = 'F';
	//if (type != 'create'){
		//var oldInvRec = nlapiGetOldRecord();
		//var newInvRec = nlapiGetNewRecord();
		//var oldTotal = oldInvRec.getFieldValue('total');
		//var newTotal = newInvRec.getFieldValue('total');
		//nlapiLogExecution('DEBUG', 'oldTotal = ' + oldTotal, 'newTotal = ' + newTotal);
		//if (newTotal != oldTotal){
			//amtChanged = 'T';
		//}
	//}
	//amtChanged = 'T';//TEMPORARY CODE FOR TESTING - TO BE REMOVED
	//if (type != 'create' && amtChanged == 'F'){
		//nlapiLogExecution('DEBUG', 'NOT in Create Mode, Amount did NOT Change', 'RETURN');
		//return;
	//}
	
	var invId = nlapiGetRecordId();
	  
    var rec = nlapiLoadRecord(nlapiGetRecordType(), invId);

    var lineCount = rec.getLineItemCount('item');
    
    
    /*
    if (lineCount > 150){
    	
    	nlapiLogExecution('DEBUG', 'Line Count > 150', 'Create Cust Rec.  Execute Sched Script.  EXIT');
    	
    	var custRecExists = is_upth_getPrintTotHrsQueueIds(invId);
    	
    	if (custRecExists){
    		nlapiLogExecution('DEBUG', 'Custom Record Already Exists in Queue', 'SCHED SCRIPT & EXIT');
    		
    		var scriptSched = nlapiScheduleScript('customscript_scg_invoice_print_ss', 'customdeploy_scg_invoice_print_ss');//UPDATE THIS LINE
			nlapiLogExecution('DEBUG', 'Update Print Total Hours Script Queued - ID: ', scriptSched);
			
			//Check 'Print Amount Updates Pending' to indicate scheduled job has not completed processing
			nlapiSubmitField('invoice', invId, 'custbody_scg_print_amt_upds_pend', 'T');//UPDATE THIS LINE
			nlapiLogExecution('DEBUG', 'Print Amount Updates Pending', 'CHECKED');//UPDATE THIS LINE
    		
    		return;
    	}
    	
    	var updPrintTotHrsQueueRec = nlapiCreateRecord('customrecord_scg_updprinttotalhrs_queue');
		
		// Create Update Print Total Hours Processing Queue record
		updPrintTotHrsQueueRec.setFieldValue('custrecord_scg_upth_transaction', invId);
		updPrintTotHrsQueueRec.setFieldValue('custrecord_scg_upth_complete', 'F');
		var updPrintTotHrsProcQueueRecId = nlapiSubmitRecord(updPrintTotHrsQueueRec);
		
		if (updPrintTotHrsProcQueueRecId){
			
			var scriptSched = nlapiScheduleScript('customscript_scg_invoice_print_ss', 'customdeploy_scg_invoice_print_ss');//UPDATE THIS LINE
			nlapiLogExecution('DEBUG', 'Update Print Total Hours Script Queued - ID: ', scriptSched);
			
			//Check 'Print Amount Updates Pending' to indicate scheduled job has not completed processing
			nlapiSubmitField('invoice', invId, 'custbody_scg_print_amt_upds_pend', 'T');//UPDATE THIS LINE
			nlapiLogExecution('DEBUG', 'Print Amount Updates Pending', 'CHECKED');//UPDATE THIS LINE
			
		}else {
			throw nlapiCreateError('PROCESS_TRANSACTION-NOT_IN_QUEUE', 'The transaction could not be placed in the Update Print Total Hours Processing Queue.', false);
		}
    	
    	nlapiLogExecution('DEBUG', 'setPrintTotalHours UE', 'RETURN');
		
    	return;
    	
    }//End if (lineCount > 150)
    
    nlapiLogExecution('DEBUG', 'Line Count <= 150', 'Update Print Total Hours');
	*/
    
    
    //var arrAssgnTask = [];
    //var arrTotQtyHrs = [];
    var arrTotTaxAmt = [];
    //var arrItems = [];
    var arrTaxcodes = [];
    var arrLine = [];
    //var assgnUser;
    //var taskName;
    
    for (var i = 1; i <= lineCount; i++){
    	
    	//Clear out Existing Value, if any, in the 'Total Qty By Item' field
    	rec.setLineItemValue('item', 'custcol_scg_total_tax_by_taxcode', i, '');
    	
    	//var item = rec.getLineItemValue('item', 'item', i);
    	//var printTimeEntry = rec.getLineItemValue('item', 'custcol_print_time_entry', i);
    	//nlapiLogExecution('DEBUG', 'Item Line ' + i + ': ' + item, 'Print Time Entry Line ' + i + ': ' + printTimeEntry);
    	//nlapiLogExecution('DEBUG', 'Item Line ' + i, item);
    	
    	var taxCode = rec.getLineItemValue('item', 'taxcode', i);
    	nlapiLogExecution('DEBUG', 'Tax Code Line ' + i, taxCode);
    	
    	var taxAmt = rec.getLineItemValue('item', 'tax1amt', i);
    	nlapiLogExecution('DEBUG', 'Tax Amt Line ' + i, taxAmt);
    	
    	//If Tax Amt is null, skip line
    	if (isEmpty(taxAmt)){
    		nlapiLogExecution('DEBUG', 'Tax Amt NULL', 'SKIP LINE');
    		continue;
    	}
    	
    	//if (item == OPENAIR_INTEGRATION && printTimeEntry == 'T'){
    	//if (printTimeEntry == 'T'){
    		
    		//assgnUser = rec.getLineItemValue('item', 'custcol_oa_wbs_assignees', i);
    		//taskName = rec.getLineItemValue('item', 'custcol_oa_wbs_task_name', i);
    		
    		//if (isEmpty(assgnUser)){
    			//assgnUser = 'EMPTY_AssgnUser';
    		//}
    		//if (isEmpty(taskName)){
    			//taskName = 'EMPTY_TaskName';
    		//}
    		
    		//var combined = assgnUser + '-' + taskName;
    		//nlapiLogExecution('DEBUG', 'Combined Assignee / Task Value Line ' + i, combined);

    		
		//Create Arrays to tally / store Total Tax Amt by Tax Code Information, and which line to write it to
		if (arrTaxcodes.indexOf(taxCode) < 0) {
          	//nlapiLogExecution('debug', i, '1');
          	var ind = arrTaxcodes.length || 0;
          	nlapiLogExecution('DEBUG', 'ind', ind);
          	arrTaxcodes[ind] = taxCode;
          	arrTotTaxAmt[ind] = parseFloat(rec.getLineItemValue('item', 'tax1amt', i));
          	arrLine[ind] = i;
          	continue;
        } else {
        	//nlapiLogExecution('debug', i, '2');
        	var index = arrTaxcodes.indexOf(taxCode);
        	nlapiLogExecution('DEBUG', 'index', index);
        	arrTotTaxAmt[index] += parseFloat(rec.getLineItemValue('item', 'tax1amt', i));
        	continue;
        }
    		
    		
    	//}//End if (printTimeEntry == 'T')
    	
    	
    }//End for i loop
	
    nlapiLogExecution('DEBUG', 'Finished 1st Loop', '1');
    
    endUsage = nlapiGetContext().getRemainingUsage();
    nlapiLogExecution('DEBUG', 'End Usage Loop 1 Line ' + i, endUsage);
    
    
    //Loop through arrays, and write the Total by Tax values
    for (var j = 0; j < arrTaxcodes.length; j++) {

    	nlapiLogExecution('DEBUG', 'Set Total by Tax on Line ' + arrLine[j], arrTotTaxAmt[j]);
    	rec.setLineItemValue('item', 'custcol_scg_total_tax_by_taxcode', arrLine[j], arrTotTaxAmt[j]);
    	
    }
    nlapiLogExecution('DEBUG', 'Finished 2nd Loop', '2');
    
    endUsage = nlapiGetContext().getRemainingUsage();
    nlapiLogExecution('DEBUG', 'End Usage', endUsage);
    
	
    nlapiSubmitRecord(rec, false, true);
    
    nlapiLogExecution('DEBUG', 'setTotalByTax UE', 'FINISH');
	
		
	}catch (err) {
	    nlapiLogExecution('error', 'setTotalByTax', JSON.stringify(handleException(err)));
	}
	
}




function handleException(error) {
	
	var message;

	if (error instanceof nlobjError) {
		message = {
			'code': error.getCode(),
			'details': error.getDetails()
	    };
	} else {
	    message = {
    		'code': 'unexpected error',
    		'details': ((typeof error === 'object') ? error.toString() : error)
	    };
	}

	return message;
}





/**
 * Returns a list of Custom Records to be processed
 * 
 * @appliedtorecord customrecord_scg_emp_processing_queue
 * 
 * @returns {nlobjSearch}
 */
function is_upth_getPrintTotHrsQueueIds(invId) {
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custrecord_scg_upth_transaction', null, 'anyof', invId));
	filters.push(new nlobjSearchFilter('custrecord_scg_upth_complete', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_scg_upth_error', null, 'isempty', null));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('custrecord_scg_upth_transaction', null, null));
	//columns.push(new nlobjSearchColumn('custrecord_scg_prand_trans_type', null, null));
	columns.push(new nlobjSearchColumn('created', null, null).setSort(false /* ascending */));

	return nlapiSearchRecord('customrecord_scg_updprinttotalhrs_queue', null, filters, columns);
}








function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}





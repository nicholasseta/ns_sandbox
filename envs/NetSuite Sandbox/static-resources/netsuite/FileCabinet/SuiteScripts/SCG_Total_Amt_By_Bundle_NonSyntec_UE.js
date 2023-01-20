/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       03 Mar 2021     Doug Humberd     Sets the Total by Bundle value on Invoices (only for lines where Item != Syntec)
 * 1.05       11 Apr 2022     Doug Humberd     Changed to run as beforeSubmit (not afterSubmit)
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
//const OPENAIR_INTEGRATION = '5453';//OpenAir Integration Item
const SYNTEC = '7251';//Non-Inventory Item: Syntec


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
function is_tbb_beforeLoad(type, form, request){
    try {
        //is_tbb_beforeLoadScript(type, form, request);
    } catch (e) {
        is_tbb_logError(e);
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
function is_tbb_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
    	is_tbb_setTotalByBundle(type);
        //is_tbb_beforeSubmitScript(type);
    } catch (e) {
        is_tbb_logError(e);
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
function is_tbb_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //is_tbb_setTotalByBundle(type);
      	//is_tbb_afterSubmitScript(type);
    } catch (e) {
        is_tbb_logError(e);
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
function is_tbb_logError(e) {
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
function is_tbb_setTotalByBundle(type){
	
	if (type === 'delete'){
		return;
	}
	
	try{
		
	nlapiLogExecution('DEBUG', 'setTotalByBundle UE', 'START');
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
	  
    //var rec = nlapiLoadRecord(nlapiGetRecordType(), invId);//REMOVED VERSION 1.05

    //var lineCount = rec.getLineItemCount('item');//CHANGED VERSION 1.05
    var lineCount = nlapiGetLineItemCount('item');
    
    
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
    var arrTotAmt = [];
    //var arrItems = [];
    var arrSynBundles = [];
    var arrLine = [];
    //var assgnUser;
    //var taskName;
    
    for (var i = 1; i <= lineCount; i++){
    	
    	//Clear out Existing Value, if any, in the 'Total By Bundle' field
    	//rec.setLineItemValue('item', 'custcol_total_by_bundle', i, '');//CHANGED VERSION 1.05
    	nlapiSetLineItemValue('item', 'custcol_total_by_bundle', i, '');
    	
    	//var item = rec.getLineItemValue('item', 'item', i);
    	//var printTimeEntry = rec.getLineItemValue('item', 'custcol_print_time_entry', i);
    	//nlapiLogExecution('DEBUG', 'Item Line ' + i + ': ' + item, 'Print Time Entry Line ' + i + ': ' + printTimeEntry);
    	//nlapiLogExecution('DEBUG', 'Item Line ' + i, item);
    	
    	//var item = rec.getLineItemValue('item', 'item', i);//CHANGED VERSION 1.05
    	var item = nlapiGetLineItemValue('item', 'item', i);
    	nlapiLogExecution('DEBUG', 'Item Line ' + i, item);
    	
    	//If Item = Syntec, skip line
    	if (item == SYNTEC){
    		nlapiLogExecution('DEBUG', 'Item is Syntec', 'SKIP LINE');
    		continue;
    	}
    	
    	//var bundleName = rec.getLineItemValue('item', 'custcol_bundle_name', i);//CHANGED VERSION 1.05
    	var bundleName = nlapiGetLineItemValue('item', 'custcol_bundle_name', i);
    	nlapiLogExecution('DEBUG', 'Bundle Name Line ' + i, bundleName);
    	
    	//If Bundle Name is null, skip line
    	if (isEmpty(bundleName)){
    		nlapiLogExecution('DEBUG', 'Bundle Name NULL', 'SKIP LINE');
    		continue;
    	}
    	
    	//var amount = rec.getLineItemValue('item', 'amount', i);//CHANGED VERSION 1.05
    	var amount = nlapiGetLineItemValue('item', 'amount', i);
    	nlapiLogExecution('DEBUG', 'Amount Line ' + i, amount);
    	
    	//If Amount is null, skip line
    	if (isEmpty(amount)){
    		nlapiLogExecution('DEBUG', 'Amount NULL', 'SKIP LINE');
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

    		
		//Create Arrays to tally / store Total Amt by Bundle Information, and which line to write it to
		if (arrSynBundles.indexOf(bundleName) < 0) {
          	//nlapiLogExecution('debug', i, '1');
          	var ind = arrSynBundles.length || 0;
          	nlapiLogExecution('DEBUG', 'ind', ind);
          	arrSynBundles[ind] = bundleName;
          	//arrTotAmt[ind] = parseFloat(rec.getLineItemValue('item', 'amount', i));//CHANGED VERSION 1.05
          	arrTotAmt[ind] = parseFloat(nlapiGetLineItemValue('item', 'amount', i));
          	arrLine[ind] = i;
          	continue;
        } else {
        	//nlapiLogExecution('debug', i, '2');
        	var index = arrSynBundles.indexOf(bundleName);
        	nlapiLogExecution('DEBUG', 'index', index);
        	//arrTotAmt[index] += parseFloat(rec.getLineItemValue('item', 'amount', i));//CHANGED VERSION 1.05
        	arrTotAmt[index] += parseFloat(nlapiGetLineItemValue('item', 'amount', i));
        	continue;
        }
    		
    		
    	//}//End if (printTimeEntry == 'T')
    	
    	
    }//End for i loop
	
    nlapiLogExecution('DEBUG', 'Finished 1st Loop', '1');
    
    endUsage = nlapiGetContext().getRemainingUsage();
    nlapiLogExecution('DEBUG', 'End Usage Loop 1 Line ' + i, endUsage);
    
    
    //Loop through arrays, and write the Total by Tax values
    for (var j = 0; j < arrSynBundles.length; j++) {

    	nlapiLogExecution('DEBUG', 'Set Total by Bundle on Line ' + arrLine[j], arrTotAmt[j]);
    	//rec.setLineItemValue('item', 'custcol_total_by_bundle', arrLine[j], arrTotAmt[j]);//CHANGED VERSION 1.05
    	nlapiSetLineItemValue('item', 'custcol_total_by_bundle', arrLine[j], arrTotAmt[j]);
    	
    }
    nlapiLogExecution('DEBUG', 'Finished 2nd Loop', '2');
    
    endUsage = nlapiGetContext().getRemainingUsage();
    nlapiLogExecution('DEBUG', 'End Usage', endUsage);
    
	
    //nlapiSubmitRecord(rec, false, true);//REMOVED VERSION 1.05
    
    nlapiLogExecution('DEBUG', 'setTotalByBundle UE', 'FINISH');
	
		
	}catch (err) {
	    nlapiLogExecution('error', 'setTotalByBundle', JSON.stringify(handleException(err)));
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





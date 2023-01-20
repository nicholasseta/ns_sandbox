/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       19 Apr 2022     Doug Humberd     Combines SCG_Total_Amt_By_Item_UE and SCG_Total_Qty_By_Item_UE
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


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
function is_ipg_beforeLoad(type, form, request){
    try {
        //is_ipg_beforeLoadScript(type, form, request);
    } catch (e) {
        is_ipg_logError(e);
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
function is_ipg_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
    	is_ipg_invPDFgroups(type);
        //is_ipg_beforeSubmitScript(type);
    } catch (e) {
        is_ipg_logError(e);
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
function is_ipg_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
      	//is_ipg_afterSubmitScript(type);
    } catch (e) {
        is_ipg_logError(e);
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
function is_ipg_logError(e) {
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
function is_ipg_invPDFgroups(type){
	
	if (type === 'delete'){
		return;
	}
	
	try{
		
	nlapiLogExecution('DEBUG', 'invPDFgroups UE', 'START');
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
	  
    //var rec = nlapiLoadRecord(nlapiGetRecordType(), invId);

    //var lineCount = rec.getLineItemCount('item');
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
    var arrTotAmt = [];
    var arrTotTax = [];
    var arrTotQtyHrs = [];
    var arrItems = [];
    var arrLine = [];
    //var assgnUser;
    //var taskName;
    var lineAmount;
    var lineTaxRate1;
    var lineTaxRate2;
    
    for (var i = 1; i <= lineCount; i++){
    	
    	//Clear out Existing Value, if any, in the 'Total Amount By Item' field
    	//rec.setLineItemValue('item', 'custcol_total_amount_by_item', i, '');
    	nlapiSetLineItemValue('item', 'custcol_total_amount_by_item', i, '');
    	
    	//Clear out Existing Value, if any, in the 'Total Tax By Item' field
    	//rec.setLineItemValue('item', 'custcol_total_tax_by_item', i, '');
    	nlapiSetLineItemValue('item', 'custcol_total_tax_by_item', i, '');
    	
    	//Clear out Existing Value, if any, in the 'Total Qty By Item' field
    	//rec.setLineItemValue('item', 'custcol_print_total_qty_byitem', i, '');\
    	nlapiSetLineItemValue('item', 'custcol_print_total_qty_byitem', i, '');
    	
    	//var item = rec.getLineItemValue('item', 'item', i);
    	var item = nlapiGetLineItemValue('item', 'item', i);
    	//var printTimeEntry = rec.getLineItemValue('item', 'custcol_print_time_entry', i);
    	//nlapiLogExecution('DEBUG', 'Item Line ' + i + ': ' + item, 'Print Time Entry Line ' + i + ': ' + printTimeEntry);
    	nlapiLogExecution('DEBUG', 'Item Line ' + i, item);
    	
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
    	
    	var totalTaxAmount = 0;
    	
    	//var tax1AmtLine = rec.getLineItemValue('item', 'tax1amt', i);//CHANGED VERSION 1.10
    	var tax1AmtLine = nlapiGetLineItemValue('item', 'tax1amt', i);
    	nlapiLogExecution('DEBUG', 'Tax 1 Amount Line ' + i, tax1AmtLine);
    	
    	if (isEmpty(tax1AmtLine)){
    		
    		//lineAmount = rec.getLineItemValue('item', 'amount', i);//CHANGED VERSION 1.10
    	    //lineTaxRate1 = rec.getLineItemValue('item', 'taxrate1', i);//CHANGED VERSION 1.10
    	    lineAmount = nlapiGetLineItemValue('item', 'amount', i);
    	    lineTaxRate1 = nlapiGetLineItemValue('item', 'taxrate1', i);
    	    //lineTaxRate2 = rec.getLineItemValue('item', 'taxrate2', i);
    	    
    	    nlapiLogExecution('DEBUG', 'Amount Line ' + i, lineAmount);
    	    nlapiLogExecution('DEBUG', 'Tax Rate 1 Line ' + i, lineTaxRate1);
    	    //nlapiLogExecution('DEBUG', 'Tax Rate 2 Line ' + i, lineTaxRate2);
    	    
    	    //if (isEmpty(lineTaxRate2)){
    	    	//lineTaxRate2 = 0;
    	    //}
    	    
    	    //tax1AmtLine = (parseFloat(lineAmount) * parseFloat(lineTaxRate1) / 100) + (parseFloat(lineAmount) * parseFloat(lineTaxRate2) / 100);
    	    tax1AmtLine = parseFloat(lineAmount) * parseFloat(lineTaxRate1) / 100;
    	    nlapiLogExecution('DEBUG', 'Calculated Tax 1 Amount Line ' + i, tax1AmtLine);
    		
    	}
    	
    	//var tax2AmtLine = rec.getLineItemValue('item', 'tax2amt', i);//CHANGED VERSION 1.10
    	var tax2AmtLine = nlapiGetLineItemValue('item', 'tax2amt', i);
    	nlapiLogExecution('DEBUG', 'Tax 2 Amount Line ' + i, tax2AmtLine);
    	
    	if (isEmpty(tax2AmtLine)){
    		
    		//lineAmount = rec.getLineItemValue('item', 'amount', i);//CHANGED VERSION 1.10
    	    //lineTaxRate1 = rec.getLineItemValue('item', 'taxrate1', i);
    	    //lineTaxRate2 = rec.getLineItemValue('item', 'taxrate2', i);//CHANGED VERSION 1.10
    	    lineAmount = nlapiGetLineItemValue('item', 'amount', i);
    	    lineTaxRate2 = nlapiGetLineItemValue('item', 'taxrate2', i);
    	    
    	    nlapiLogExecution('DEBUG', 'Amount Line ' + i, lineAmount);
    	    //nlapiLogExecution('DEBUG', 'Tax Rate 1 Line ' + i, lineTaxRate1);
    	    nlapiLogExecution('DEBUG', 'Tax Rate 2 Line ' + i, lineTaxRate2);
    	    
    	    if (isEmpty(lineTaxRate2)){
    	    	lineTaxRate2 = 0;
    	    }
    	    
    	    //tax1AmtLine = (parseFloat(lineAmount) * parseFloat(lineTaxRate1) / 100) + (parseFloat(lineAmount) * parseFloat(lineTaxRate2) / 100);
    	    tax2AmtLine = parseFloat(lineAmount) * parseFloat(lineTaxRate2) / 100;
    	    nlapiLogExecution('DEBUG', 'Calculated Tax 2 Amount Line ' + i, tax2AmtLine);
    		
    	}
    	
    	totalTaxAmount = Number(tax1AmtLine) + Number (tax2AmtLine);
    	nlapiLogExecution('DEBUG', 'Total Tax Amount Line ' + i, totalTaxAmount);

    		
		//Create Arrays to tally / store Total Quantity by Item Information, and which line to write it to
		if (arrItems.indexOf(item) < 0) {
          	//nlapiLogExecution('debug', i, '1');
          	var ind = arrItems.length || 0;
          	nlapiLogExecution('DEBUG', 'ind', ind);
          	arrItems[ind] = item;
          	//arrTotAmt[ind] = parseFloat(rec.getLineItemValue('item', 'amount', i));//CHANGED VERSION 1.10
          	arrTotAmt[ind] = parseFloat(nlapiGetLineItemValue('item', 'amount', i));
          	//arrTotTax[ind] = parseFloat(rec.getLineItemValue('item', 'tax1amt', i));
          	arrTotTax[ind] = totalTaxAmount;
          	arrTotQtyHrs[ind] = parseFloat(nlapiGetLineItemValue('item', 'custcol_quantity_for_customer', i));
          	arrLine[ind] = i;
          	continue;
        } else {
        	//nlapiLogExecution('debug', i, '2');
        	var index = arrItems.indexOf(item);
        	nlapiLogExecution('DEBUG', 'index', index);
        	//arrTotAmt[index] += parseFloat(rec.getLineItemValue('item', 'amount', i));//CHANGED VERSION 1.10
        	arrTotAmt[index] += parseFloat(nlapiGetLineItemValue('item', 'amount', i));
        	//arrTotTax[index] += parseFloat(rec.getLineItemValue('item', 'tax1amt', i));
        	arrTotTax[index] += totalTaxAmount;
        	arrTotQtyHrs[index] += parseFloat(nlapiGetLineItemValue('item', 'custcol_quantity_for_customer', i));
        	continue;
        }
    		
    		
    	//}//End if (printTimeEntry == 'T')
    	
    	
    }//End for i loop
	
    nlapiLogExecution('DEBUG', 'Finished 1st Loop', '1');
    
    endUsage = nlapiGetContext().getRemainingUsage();
    nlapiLogExecution('DEBUG', 'End Usage Loop 1 Line ' + i, endUsage);
    
    
    //Loop through arrays, and write the Print Total Amount by Item values
    for (var j = 0; j < arrItems.length; j++) {

    	nlapiLogExecution('DEBUG', 'Set Total Amount by Item on Line ' + arrLine[j], arrTotAmt[j]);
    	//rec.setLineItemValue('item', 'custcol_total_amount_by_item', arrLine[j], arrTotAmt[j]);
    	nlapiSetLineItemValue('item', 'custcol_total_amount_by_item', arrLine[j], arrTotAmt[j]);
    	
    	nlapiLogExecution('DEBUG', 'Set Total Tax by Item on Line ' + arrLine[j], arrTotTax[j]);
    	//rec.setLineItemValue('item', 'custcol_total_tax_by_item', arrLine[j], arrTotTax[j]);
    	nlapiSetLineItemValue('item', 'custcol_total_tax_by_item', arrLine[j], arrTotTax[j]);
    	
    	nlapiLogExecution('DEBUG', 'Set Total Qty by Item on Line ' + arrLine[j], arrTotQtyHrs[j]);
    	//rec.setLineItemValue('item', 'custcol_print_total_qty_byitem', arrLine[j], arrTotQtyHrs[j]);
    	nlapiSetLineItemValue('item', 'custcol_print_total_qty_byitem', arrLine[j], arrTotQtyHrs[j]);
    	
    }
    nlapiLogExecution('DEBUG', 'Finished 2nd Loop', '2');
    
    endUsage = nlapiGetContext().getRemainingUsage();
    nlapiLogExecution('DEBUG', 'End Usage', endUsage);
    
	
    //nlapiSubmitRecord(rec, false, true);//REMOVED VERSION 1.10
    
    nlapiLogExecution('DEBUG', 'setTotalAmtByItem UE', 'FINISH');
	
		
	}catch (err) {
	    nlapiLogExecution('error', 'invPDFgroups', JSON.stringify(handleException(err)));
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





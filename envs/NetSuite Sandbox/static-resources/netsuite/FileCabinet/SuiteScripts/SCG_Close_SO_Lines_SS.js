/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       08 May 2020     Doug Humberd     Scheduled Script to close SO lines if Project != null, Item: Close SO Line is checked, and the line is not already closed
 *
 */


/**
 * Constants
 */


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord recordType
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_closeSOlines_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}


/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function is_closeSOlines(type){

	//var date = new Date();
	//today = nlapiDateToString(date, 'date');
	//date.setDate(date.getDate() + 14);
	//twoWksFrmToday = nlapiDateToString(date, 'date');
	
	nlapiLogExecution('DEBUG', 'closeSOlines', 'START');
	
	var soId;
	var lastId;
	var minRecId = 0;
	
	var soIds = is_csl_getSOids(minRecId);
	var count = 0;
	
	if (!soIds){
		nlapiLogExecution('DEBUG', 'No New Sales Orders Found to Update', 'EXIT');
		return;
	}
	
	while (soIds && soIds.length > 0){
		
		// Loop through the results and update them
		is_crc_scheduledBatch(soIds, function (soId) {
			try{
				
				salesOrdId = soId.getValue('internalid');
				
				//nlapiSubmitField('customerrefund', salesOrdId, 'custbody_refund_status', '4');
				//count = count + 1;
				
				if (salesOrdId != lastId){
					
					lastId = salesOrdId;
					
					nlapiLogExecution('DEBUG', 'Processing for SO:', salesOrdId);
					
					var soRec = nlapiLoadRecord('salesorder', salesOrdId);
					
					var soLineCount = soRec.getLineItemCount('item');
					
					for (var i = 1; soLineCount > 0 && i <= soLineCount; i++){
						
						var project = soRec.getLineItemValue('item', 'job', i);
						var item = soRec.getLineItemValue('item', 'item', i);
						var isClosed = soRec.getLineItemValue('item', 'isclosed', i);
						
						nlapiLogExecution('DEBUG', 'Project Line ' + i, project);
						nlapiLogExecution('DEBUG', 'Item Line ' + i, item);
						nlapiLogExecution('DEBUG', 'Is Closed Line ' + i, isClosed);
						
						var closeSOline = nlapiLookupField('item', item, 'custitem_close_so_line');
						
						nlapiLogExecution('DEBUG', 'Close SO Line for Item: ' + item, closeSOline);
						
						if (!isEmpty(project) && closeSOline == 'T' && isClosed == 'F'){
							
							nlapiLogExecution('DEBUG', 'Criteria Met', 'CLOSE SO LINE ' + i);
							soRec.setLineItemValue('item', 'isclosed', i, 'T');
							
						}else{//End if (!isEmpty(project) && closeSOline == 'T' && isClosed == 'F')
							
							nlapiLogExecution('DEBUG', 'Criteria NOT Met', 'DO NOT CLOSE SO LINE ' + i);
							
						}
						
					}//End for i loop
					
					
					nlapiSubmitRecord(soRec);
					
					count = count + 1;
					
				}else{//End if (salesOrdId != lastId)
					
					nlapiLogExecution('DEBUG', 'Same SO as Last Found', 'DO NOT PROCESS AGAIN');
					
				}
				
				
			} catch ( e ) {
				var errorMessage = '';
				if (e instanceof nlobjError) {
					if (e.getCode() == 'SSS_USAGE_LIMIT_EXCEEDED') {
						nlapiLogExecution('debug','Usage Exceeded on script:', 'SCG_sentJoinedStmtsInvoices_SS');
						var state = nlapiYieldScript();
						if (state.status == 'FAILURE') {
								nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
								throw "Failed to reschedule script";
						} else if ( state.status == 'RESUME' ) {
							nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
						}
						startUsage = nlapiGetContext().getRemainingUsage();
					} else if (e.getCode() == 'RCRD_DSNT_EXIST') {
						nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', custId );
					} else {
						errorMessage = e.getCode() + '\n' + e.getDetails();
						nlapiLogExecution( 'DEBUG', 'system error', errorMessage );
						nlapiSubmitField('customer', custId, 'custentity_scg_stmt_inv_proc_error', errorMessage);
					}
				} else {
					errorMessage = e.toString();
					nlapiLogExecution( 'DEBUG', 'unexpected error', errorMessage );
					nlapiSubmitField('customer', custId, 'custentity_scg_stmt_inv_proc_error', errorMessage);
				}
			}
		});
		
		
		// Check for any additional records
		minRecId = salesOrdId;
		nlapiLogExecution('DEBUG', 'minRecId after loop', minRecId);
		soIds = is_csl_getSOids(minRecId);
		
	}//End while loop
	
	nlapiLogExecution('DEBUG', 'Count of Search Results', count);
	
	
}




/**
 * Processes each element of an array, checks remaining governance units 
 * and reschedules the script, if needed.
 * 
 * @appliedtorecord invoice
 * 
 * @param {Array} arr: array to be processed by the script
 * @param {Array} proc: function to be used to process each element of the array
 * @returns {Void}
 */
function is_crc_scheduledBatch(arr, proc) {

	// Initialize variables
	var maxUsage = 0;
	var startUsage = nlapiGetContext().getRemainingUsage();
	
	// Loop through the array
	for (var i in arr){
		// Process the current array value
		proc(arr[i], i, arr);
		
		// Update the percent complete value on the script status page
		if (nlapiGetContext().getExecutionContext() == "scheduled") nlapiGetContext().setPercentComplete( ((100*i)/arr.length ).toFixed(1));
		
		// Track governance and reschedule script, if needed
		var endUsage = nlapiGetContext().getRemainingUsage();
		var runUsage = startUsage - endUsage;
		//nlapiLogExecution('debug', 'End Usage / Run Usage', endUsage + ' / ' + runUsage);
		if (maxUsage < runUsage) maxUsage = runUsage;
		if (endUsage < (maxUsage + 40)){
			var state = nlapiYieldScript();
			if (state.status == 'FAILURE') {
					nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
					throw "Failed to reschedule script";
			} else if ( state.status == 'RESUME' ) {
				nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
			}
			startUsage = nlapiGetContext().getRemainingUsage();
		} else {
			startUsage = endUsage;
		}
	}
}




/**
 * Returns a list of Sales Orders to be processed (to join statements / invoices, and email)
 * 
 * @appliedtorecord customer
 * 
 * @returns {nlobjSearch}
 */
function is_csl_getSOids(minRecId) {
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('internalid', 'job', 'noneof', '@NONE@'));
	filters.push(new nlobjSearchFilter('closed', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custitem_close_so_line', 'item', 'is', 'T'));
	filters.push(new nlobjSearchFilter('status', null, 'noneof', 'SalesOrd:C'));
	filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', minRecId));
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['8218613', '8220365']));//TEMPORARY FILTER FOR TESTING
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['8220365']));//TEMPORARY FILTER FOR TESTING

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns[0].setSort(false /* ascending */);

	return nlapiSearchRecord('salesorder', null, filters, columns);
}




function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}





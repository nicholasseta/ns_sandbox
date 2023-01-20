/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Mar 2020     Doug Humberd     Scheduled Script to create subsequent invoices 2 weeks before their Billing Date
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
function is_createInvNextBill_logError(e) {
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
function is_createInvNextBill(type){

	var date = new Date();
	today = nlapiDateToString(date, 'date');
	date.setDate(date.getDate() + 14);
	twoWksFrmToday = nlapiDateToString(date, 'date');
	
	nlapiLogExecution('DEBUG', 'Today: ' + today, 'Two Weeks from Today: ' + twoWksFrmToday);
	
	var soId;
	var lastId;
	var minRecId = 0;
	
	var soIds = is_cinb_getSOids(minRecId, twoWksFrmToday);
	var count = 0;
	
	while (soIds && soIds.length > 0){
		
		// Loop through the results and update them
		is_cinb_scheduledBatch(soIds, function (soId) {
			try{
				
				salesOrdId = soId.getValue('internalid');
				
				if (salesOrdId != lastId){
					
					lastId = salesOrdId;
					nextBillDate = soId.getValue('nextbilldate');
					nlapiLogExecution('DEBUG', 'soID = ' + salesOrdId, 'Next Bill Date = ' + nextBillDate);
					
					var invObj = nlapiTransformRecord('salesorder', salesOrdId, 'invoice', {'billdate':nextBillDate});
					nlapiSubmitRecord(invObj,true);
					
					count = count + 1;
					
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
						nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', salesOrdId );
					} else {
						errorMessage = e.getCode() + '\n' + e.getDetails();
						nlapiLogExecution( 'DEBUG', 'system error', errorMessage );
						//nlapiSubmitField('customer', custId, 'custentity_scg_stmt_inv_proc_error', errorMessage);
					}
				} else {
					errorMessage = e.toString();
					nlapiLogExecution( 'DEBUG', 'unexpected error', errorMessage );
					//nlapiSubmitField('customer', custId, 'custentity_scg_stmt_inv_proc_error', errorMessage);
				}
			}
		});
		
		
		// Check for any additional records
		minRecId = salesOrdId;
		nlapiLogExecution('DEBUG', 'minRecId after loop', minRecId);
		soIds = is_cinb_getSOids(minRecId, twoWksFrmToday);
		
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
function is_cinb_scheduledBatch(arr, proc) {

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
function is_cinb_getSOids(minRecId, twoWksFrmToday) {
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('billingschedule', null, 'noneof', ['@NONE@']));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('nextbilldate', null, 'on', twoWksFrmToday));//CORRECT LINE
	//filters.push(new nlobjSearchFilter('nextbilldate', null, 'on', '12/1/2020'));//TEMP CODE
	//filters.push(new nlobjSearchFilter('nextbilldate', null, 'onorafter', '2/6/2020'));//TEMP CODE
	filters.push(new nlobjSearchFilter('status', null, 'noneof', 'SalesOrd:A'));
	filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', minRecId));
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['92', '646001', '63888']));//TEMPORARY FILTER FOR TESTING
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['38881']));//TEMPORARY FILTER FOR TESTING

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('nextbilldate', null, null));
	columns.push(new nlobjSearchColumn('trandate', null, null));
	columns[0].setSort(false /* ascending */);

	return nlapiSearchRecord('salesorder', null, filters, columns);
}





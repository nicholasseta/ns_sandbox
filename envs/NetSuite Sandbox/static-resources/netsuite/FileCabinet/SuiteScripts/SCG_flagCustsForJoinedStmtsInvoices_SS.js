/**
 * Module Description
 *
 * Version			Date			Author				Remarks
 * 1.00				11 Mar 2020		Doug Humberd		Checks Processing Incomplete Checkbox - to be unchecked after emails are sent via Scheduled Script
 *
 */
 
 
 /**
 * Constants
 */
//const CUST_STMTS_INV_FOLDER = '573399'//Customer Statements and Invoices


 /**
 * Global Variables
 */
//var is_fcjsi_context = nlapiGetContext();


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord recordType
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_fcjsi_logError(e) {
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
function is_fcjsi_flagCustsForJoinedStmtsInvs(type) {
	
	nlapiLogExecution('DEBUG', 'is_fcjsi_sendJoinedStmtsInvs', 'START');
	
	// Initialize variables
	var minRecId = 0;
	
	var customerIds = is_fcjsi_getCustomerIds(minRecId);
	var count = 0;
	var custId;
	
	while (customerIds && customerIds.length > 0){
		
		// Loop through the results and update them
		is_fcjsi_scheduledBatch(customerIds, function (customerId) {
			try{
				// Initialize variables
				custId = customerId.getValue('internalid');
				
				//Check Processing Incomplete Checkbox - to be unchecked after emails are sent
				//nlapiSubmitField('customer', custId, 'custentity_scg_stmt_inv_proc_incomplete', 'T');
				nlapiSubmitField('customer', custId, ['custentity_scg_stmt_inv_proc_incomplete', 'custentity_scg_stmt_inv_proc_error'], ['T', 'PENDING_STATEMENT_NOTIFICATION']);
				
				
				count = count + 1;
				
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
		minRecId = custId;
		nlapiLogExecution('DEBUG', 'minRecId after loop', minRecId);
		customerIds = is_fcjsi_getCustomerIds(minRecId);
		
	}//End while loop
	
	//nlapiLogExecution('DEBUG', 'Files to Delete', filesToDelete);
	
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
function is_fcjsi_scheduledBatch(arr, proc) {

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
 * Returns a list of Customer Records to be processed (to join statements / invoices, and email)
 * 
 * @appliedtorecord customer
 * 
 * @returns {nlobjSearch}
 */
function is_fcjsi_getCustomerIds(minRecId) {
	// Define filters
	var filters = new Array();
	//filters.push(new nlobjSearchFilter('daysoverdue', null, 'greaterthanorequalto', '30'));
	//filters.push(new nlobjSearchFilter('custentity_disable_invoice_email_notice', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custentity_scg_disable_stmt_email_notif', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custentity_scg_mult_inv_emails', null, 'isnotempty', ''));
	//filters.push(new nlobjSearchFilter('custrecord_subsidiary_group', 'msesubsidiary', 'noneof', SUB_GROUP_JET_GLOBAL));
	//filters.push(new nlobjSearchFilter('subsidiary', null, 'noneof', ['71', '72', '73', '74']));//Jet Subsidiaries
	//filters.push(new nlobjSearchFilter('balance', null, 'greaterthan', '0.00'));
	filters.push(new nlobjSearchFilter('fxbalance', null, 'greaterthan', '0.00'));
	filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', minRecId));
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['92', '646001', '63888']));//TEMPORARY FILTER FOR TESTING
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['1556382']));//TEMPORARY FILTER FOR TESTING

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('altname', null, null));
	columns.push(new nlobjSearchColumn('entityid', null, null));
	columns.push(new nlobjSearchColumn('daysoverdue', null, null));
	columns.push(new nlobjSearchColumn('balance', null, null));
	columns.push(new nlobjSearchColumn('custentity_scg_mult_inv_emails', null, null));
	columns[0].setSort(false /* ascending */);

	return nlapiSearchRecord('customer', null, filters, columns);
}





function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
} 




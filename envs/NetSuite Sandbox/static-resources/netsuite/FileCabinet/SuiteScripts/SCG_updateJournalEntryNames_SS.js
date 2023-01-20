/**
 * Module Description
 *
 * Version			Date			Author				Remarks
 * 1.00				22 Mar 2019		Doug Humberd		Updates Journal Entries - to write the Name field for line items that are Account Type AP or AR
 *
 */
 
 
/**
 * Constants
 */
const ACCT_REC_VENDOR = '97';//2 AR Migration Customer
const ACCT_PAY_VENDOR = '96';//AP Migration Vendor



/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord recordType
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_updJEname_logError(e) {
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
function is_updateJournalEntryNames(type) {
	
	nlapiLogExecution('DEBUG', 'updateJournalEntryNames', 'START');
	
	var JournalEntryIds = is_getJournalEntryIds();
	
	if (!JournalEntryIds){
		nlapiLogExecution('DEBUG', 'No Journal Entries Found', 'RETURN');
		return;
	}
	
	// Loop through the journal entries and update lines with Account 19100 (change to 19102) and Account 19150 (change to 19152)
	is_updtJEname_scheduledBatch(JournalEntryIds, function (JournalEntryId) {
		try{
			
			// Initialize variables
			var jeId = JournalEntryId.getValue('internalid');
			
			var updtCompleted = nlapiLookupField('journalentry', jeId, 'custbody_scg_update_completed');
			nlapiLogExecution('DEBUG', 'Update Completed', updtCompleted);
			
			if (updtCompleted == 'F'){
				
				nlapiLogExecution('DEBUG', 'Journal Entry ID', jeId);
				
				//Load Journal Entry
				var jeRec = nlapiLoadRecord('journalentry', jeId);
				var lineCount = jeRec.getLineItemCount('line');
				
				for (var i = 1; i <= lineCount; i++){
					
					var account = jeRec.getLineItemValue('line', 'account', i);
					var account_text = jeRec.getLineItemText('line', 'account', i);
					var account_type = jeRec.getLineItemValue('line', 'accounttype', i);
					nlapiLogExecution('DEBUG', 'Account Type Line ' + i, account_type);
					
					if (account_type == 'AcctRec'){
						
						//nlapiLogExecution('DEBUG', 'Account Line ' + i, account);
						//nlapiLogExecution('DEBUG', 'Account Text Line ' + i, account_text);
						nlapiLogExecution('DEBUG', 'Set Name to ', ACCT_REC_VENDOR);
						jeRec.setLineItemValue('line', 'entity', i, ACCT_REC_VENDOR);
						
					}
					
					if (account_type == 'AcctPay'){
						
						//nlapiLogExecution('DEBUG', 'Account Line ' + i, account);
						//nlapiLogExecution('DEBUG', 'Account Text Line ' + i, account_text);
						nlapiLogExecution('DEBUG', 'Set Name to ', ACCT_PAY_VENDOR);
						jeRec.setLineItemValue('line', 'entity', i, ACCT_PAY_VENDOR);
						
					}
					
				}//End for loop
				
				//Check "Update Completed" so that the script doesn't run through the same lines over and over again
				jeRec.setFieldValue('custbody_scg_update_completed', 'T');
				nlapiSubmitRecord(jeRec);
				
			}//End if updtCompleted = F

		} catch ( e ) {
			var errorMessage = '';
			if (e instanceof nlobjError) {
				if (e.getCode() == 'SSS_USAGE_LIMIT_EXCEEDED') {
					nlapiLogExecution('debug','Usage Exceeded on EmpId:',empId);
					var state = nlapiYieldScript();
					if (state.status == 'FAILURE') {
							nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
							throw "Failed to reschedule script";
					} else if ( state.status == 'RESUME' ) {
						nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
					}
					startUsage = nlapiGetContext().getRemainingUsage();
				} else if (e.getCode() == 'RCRD_DSNT_EXIST') {
					nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', invId );
				} else {
					errorMessage = e.getCode() + '\n' + e.getDetails();
					nlapiLogExecution( 'DEBUG', 'system error', errorMessage );
				}
			} else {
				errorMessage = e.toString();
				nlapiLogExecution( 'DEBUG', 'unexpected error', errorMessage );
			}
		}
	});
	nlapiLogExecution('DEBUG', 'updateJournalEntryAccts', 'END');
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
function is_updtJEname_scheduledBatch(arr, proc) {

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
		if (endUsage < (maxUsage + 100)){
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
 * Returns a list of employee records to be processed
 * 
 * @appliedtorecord customrecord_scg_emp_processing_queue
 * 
 * @returns {nlobjSearch}
 */
function is_getJournalEntryIds() {
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('type', null, 'anyof', 'Journal'));
	filters.push(new nlobjSearchFilter('type', 'account', 'anyof', ['AcctRec', 'AcctPay']));
	filters.push(new nlobjSearchFilter('formulatext', null, 'isempty', '').setFormula('{name}'));
	filters.push(new nlobjSearchFilter('posting', null, 'is', 'T'));
	
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['113', '118']));//THIS LINE FOR TESTING ONLY.  REMOVE BEFORE DEPLOYMENT
	//filters.push(new nlobjSearchFilter('internalid', null, 'noneof', ['32259']));//THIS LINE FOR TESTING ONLY.  REMOVE BEFORE DEPLOYMENT
	filters.push(new nlobjSearchFilter('custbody_scg_update_completed', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('iselimination', 'subsidiary', 'is', 'F'));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('accounttype', null, null));
	columns.push(new nlobjSearchColumn('account', null, null));

	return nlapiSearchRecord('journalentry', null, filters, columns);
}




function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}





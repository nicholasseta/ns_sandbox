/**
 * Module Description
 *
 * Version			Date			Author				Remarks
 * 1.00				29 Mar 2021		Doug Humberd		Auto-Rejects Purchase Orders that have not been approved after 14 days
 * 1.05             26 Apr 2021     Doug Humberd        Updated for reworked PO Approval WF (changed from 14 days to 28 days)
 * 1.10             10 May 2022     Doug Humberd        Updated for new "Employee Hierarchy" workflow updates
 *
 */
 
 
/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord recordType
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_autoReject_logError(e) {
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
function is_fourWeekAutoReject(type) {
	
	// Initialize variables
	var date = new Date();
	var today = nlapiDateToString(date, 'date');
	nlapiLogExecution('DEBUG', 'Today', today);
	
	//today = '5/24/2021';//TEMP CODE
	
	var poIds = is_getPurchOrdIds(today);
	
	nlapiLogExecution('DEBUG', 'After Search', 'AFTER');
	
	if (!poIds){
		return;
	}
	
	
	// Loop through the purchase orders and auto reject the records
	is_personal_scheduledBatch(poIds, function (poId) {
		try{
			
			// Initialize variables
			var poIntId = poId.getValue('internalid');
			var cState = poId.getValue('custbody_scg_po_appvl_current_state');
			var nextApprover = poId.getValue('nextapprover');
			
			nlapiLogExecution('DEBUG', 'Purchase Order ID', poIntId);
			nlapiLogExecution('DEBUG', 'Current State', cState);
			nlapiLogExecution('DEBUG', 'Next Approver', nextApprover);
			
			
			var rejButtonId = '';
			switch (cState) {
			case '2'://Supervisor Approval
				rejButtonId = 'workflowaction_director_reject';
				break;
			//case '3':// VP/SVP/GM Approval
				//rejButtonId = 'workflowaction_vp_svp_gm_reject';
				//break;
			//case '4'://ELT Member Approval
				//rejButtonId = 'workflowaction_elt_member_reject';
				//break;
			default:
				break;
			}
			nlapiLogExecution('debug', 'rejButtonId', rejButtonId);
			
			
			//Update the Purchase Order Reject Reason with 'Auto-Reject' message
			nlapiSubmitField('purchaseorder', poIntId, 'custbody_scg_reject_reason_po', 'Auto-Rejected after 4 Weeks without Approval');
			
			
			//Trigger the WF to Auto-Approve the Purchase Order
			var wfInstance = nlapiTriggerWorkflow('purchaseorder', poIntId, 'customworkflow_is_po_apprvl_wf_2', rejButtonId);
			
			
			//Update the Button Approver field
			//nlapiSubmitField('purchaseorder', poIntId, ['custbody_scg_super_auto_apprvd', 'custbody_scg_po_button_appvr'], [nextApprover, nextApprover]);
			nlapiSubmitField('purchaseorder', poIntId, ['custbody_scg_po_button_appvr'], [nextApprover]);
			
			
		} catch ( e ) {
			var errorMessage = '';
			if (e instanceof nlobjError) {
				if (e.getCode() == 'SSS_USAGE_LIMIT_EXCEEDED') {
					nlapiLogExecution('debug','Usage Exceeded','');
					var state = nlapiYieldScript();
					if (state.status == 'FAILURE') {
							nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
							throw "Failed to reschedule script";
					} else if ( state.status == 'RESUME' ) {
						nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
					}
					startUsage = nlapiGetContext().getRemainingUsage();
				} else if (e.getCode() == 'RCRD_DSNT_EXIST') {
					nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', poIntId);
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
function is_personal_scheduledBatch(arr, proc) {

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
 * Returns a list of purchase order records to be processed
 * 
 * @appliedtorecord purchaseorder
 * 
 * @returns {nlobjSearch}
 */
function is_getPurchOrdIds(today) {
	
	nlapiLogExecution('DEBUG', 'In Search', today);
	
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custbody_scg_po_auto_reject_date', null, 'on', today));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	//filters.push(new nlobjSearchFilter('custbody_scg_po_appvl_current_state', null, 'anyof', ['2', '3', '4']));//Director Approval, VP/SVP/GM Approval, ELT Member Approval
	filters.push(new nlobjSearchFilter('custbody_scg_po_appvl_current_state', null, 'anyof', ['2']));//Supervisor Approval

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('custbody_scg_po_appvl_current_state', null, null));
	columns.push(new nlobjSearchColumn('nextapprover', null, null));
	//columns.push(new nlobjSearchColumn('created', null, null).setSort(false /* ascending */));

	return nlapiSearchRecord('purchaseorder', null, filters, columns);
}




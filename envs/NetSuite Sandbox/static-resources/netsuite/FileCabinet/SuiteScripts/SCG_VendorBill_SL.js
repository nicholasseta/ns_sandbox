/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       21 Aug 2018     Doug Humberd     Moves the Vendor Bill approval workflow to the Rejected state
 *
 */


/**
 * Moves the Vendor Bill approval workflow to the Rejected state when the Reject button is clicked
 * 
 * @appliedtorecord vendorbill
 * 
 * @param {Object} request The Suitelet request object
 * @param {Object} response The Suitelet response object
 * @returns {Void}
 */
function is_vb_rejectButton(request, response) {
	try {
		// Get the Vendor Bill ID
		var vbId = request.getParameter('vbid');
		var userId = nlapiGetContext().getUser();
		var buttonId = request.getParameter('buttonid');
		//var cState = request.getParameter('currentstate');
		//nlapiLogExecution('debug', 'vbId', vbId);
		//nlapiLogExecution('debug', 'userId', userId);
		//nlapiLogExecution('debug', 'Current State', cState);
		if (!vbId) {
			throw nlapiCreateError('MISSING_RECORD_ID', 'No Vendor Bill ID was received', false);
		}
		if (!buttonId) {
			throw nlapiCreateError('MISSING_BUTTON_ID', 'No Button ID was received', false);
		}
		//if (!cState) {
			//throw nlapiCreateError('MISSING_CURRENT_STATE', 'No Current State was received', false);
		//}
		
		// Trigger the Rejection state of the workflow
		if (buttonId == 'REJECTION'){
			/*
			var rejButtonId = '';
			switch (cState) {
			case '1'://Pending Approval
				rejButtonId = 'workflowaction9';
				break;
			case '2'://Pending Approval Exec
				rejButtonId = 'workflowaction37';
				break;
			case '3'://Pending Approval CFO
				rejButtonId = 'workflowaction55';
				break;
			case '4'://Pending Approval CEO
				rejButtonId = 'workflowaction46';
				break;
			default:
				break;
			}
			*/
			//nlapiLogExecution('debug', 'rejButtonId', rejButtonId);
			var wfInstance = nlapiTriggerWorkflow('vendorbill', vbId, 'customworkflow_scg_vb_approval', 'workflowaction70');
		}
		
		// Redirect user to the updated record
		nlapiSetRedirectURL('RECORD', 'vendorbill', vbId);
	} catch(e) {
		if (e instanceof nlobjError) {
			nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails() );
			throw e;
		} else {
			nlapiLogExecution( 'ERROR', 'unexpected error', e.toString() );
			throw e;
		}
	}
}
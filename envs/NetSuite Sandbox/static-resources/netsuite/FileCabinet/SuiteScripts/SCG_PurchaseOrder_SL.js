/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Aug 2018     Doug Humberd     Moves the Purchase Order approval workflow to the Rejected state
 * 1.05       04 Mar 2021     Doug Humberd     Added logic to update Button Approver field on PO
 * 1.10       23 Mar 2021     Doug Humberd     Updated for new WF - Certent Purchase Order Approval
 * 1.11       25 Mar 2021     Doug Humberd     Added 'Super Approver' logic
 * 1.15       23 Apr 2021     Doug Humberd     Updated for reworked PO Approval WF
 * 1.20       18 Jun 2021     Doug Humberd     Updated to Flag PO Attached Files for inclusion/exclusion from Vendor Email (sent from WF)
 * 1.25       22 Mar 2022     Doug Humberd     Added 'Close PO' functionality
 * 1.30       10 May 2022     Doug Humberd     Updated for new "Employee Hierarchy" workflow updates
 * 1.35       13 Jun 2022     Doug Humberd     Updated to close PO Expense subtab, not just item subtab
 *
 */


/**
 * Moves the Certent Purchase Order approval workflow to the appropriate state when the Approve or Reject buttons are clicked
 * 
 * @appliedtorecord purchaseorder
 * 
 * @param {Object} request The Suitelet request object
 * @param {Object} response The Suitelet response object
 * @returns {Void}
 */
function is_po_rejectButton(request, response) {
	try {
		// Get the Purchase Order ID
		var poId = request.getParameter('poid');
		var userId = nlapiGetContext().getUser();
		var buttonId = request.getParameter('buttonid');
		var cState = request.getParameter('currentstate');
		nlapiLogExecution('debug', 'poId', poId);
		nlapiLogExecution('debug', 'userId', userId);
		nlapiLogExecution('DEBUG', 'buttonId', buttonId);
		nlapiLogExecution('debug', 'Current State', cState);
		if (!poId) {
			throw nlapiCreateError('MISSING_RECORD_ID', 'No Purchase Order ID was received', false);
		}
		if (!buttonId) {
			throw nlapiCreateError('MISSING_BUTTON_ID', 'No Button ID was received', false);
		}
		if (!cState) {
			throw nlapiCreateError('MISSING_CURRENT_STATE', 'No Current State was received', false);
		}
		
		
		//Flag PO Attached Files to be included / excluded from Vendor Email (sent from WF)
		var inclFiles = request.getParameter('inclfiles');
		var exclFiles = request.getParameter('exclfiles');
		nlapiLogExecution('DEBUG', 'Include Files', inclFiles);
		nlapiLogExecution('DEBUG', 'Exclude Files', exclFiles);
		
		if (inclFiles != 'NONE'){
			
			inclFiles = inclFiles.split('-');
			nlapiLogExecution('DEBUG', 'Incl Files after Split', inclFiles);
			
			for (var i = 0; i < inclFiles.length; i++){
				
				var fileToIncl = inclFiles[i];
				nlapiLogExecution('DEBUG', 'fileToIncl ' + i, fileToIncl);
				
				//Update Description on File so that it is included
				var file = nlapiLoadFile(fileToIncl);
				var desc = file.getDescription();
				nlapiLogExecution('DEBUG', 'Initial Description', desc);
				desc = desc + '_SEND_TO_VENDOR';
				nlapiLogExecution('DEBUG', 'Updated Description', desc);
				
				file.setDescription(desc)
				
				nlapiSubmitFile(file);
				
			}//End for i loop
			
		}
		
		if (exclFiles != 'NONE'){
			
			exclFiles = exclFiles.split('-');
			nlapiLogExecution('DEBUG', 'Excl Files after Split', exclFiles);
			
			for (var x = 0; x < exclFiles.length; x++){
				
				var fileToExcl = exclFiles[x];
				nlapiLogExecution('DEBUG', 'fileToExcl ' + x, fileToExcl);
				
				//Update Description on File so that it is excluded
				var file = nlapiLoadFile(fileToExcl);
				var desc = file.getDescription();
				nlapiLogExecution('DEBUG', 'Initial Description', desc);
				//desc = desc + '_SEND_TO_VENDOR';
				while (desc.indexOf('_SEND_TO_VENDOR') != -1){
					desc = desc.replace('_SEND_TO_VENDOR', '');
				}
				nlapiLogExecution('DEBUG', 'Updated Description', desc);
				
				file.setDescription(desc)
				
				nlapiSubmitFile(file);
				
			}//End for i loop
			
		}
		
		
		
		// Trigger the Rejection state of the workflow
		if (buttonId == 'REJECTION'){
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
			case '5'://Head of FP&A Approval
				rejButtonId = 'workflowaction_final_finance_reject';
				break;
			case '6'://CFO Approval
				rejButtonId = 'workflowaction_cfo_reject';
				break;
			case '7'://CEO Approval
				rejButtonId = 'workflowaction_ceo_reject';
				break;
			case '9'://Finance - Procurement 2
				rejButtonId = 'workflowaction_finance_2_reject';
				break;
			default:
				break;
			}
			nlapiLogExecution('debug', 'rejButtonId', rejButtonId);
			var wfInstance = nlapiTriggerWorkflow('purchaseorder', poId, 'customworkflow_is_po_apprvl_wf_2', rejButtonId);
		}
		
		
		// Trigger the Approved state of the workflow
		if (buttonId == 'APPROVAL'){
			var appButtonId = '';
			//var appButtonId = 'workflowaction_approve';
			switch (cState) {
			case '2'://Supervisor Approval
				appButtonId = 'workflowaction_director_approve';
				break;
			//case '3':// VP/SVP/GM Approval
				//appButtonId = 'workflowaction_vp_svp_gm_approve';
				//break;
			//case '4'://ELT Member Approval
				//appButtonId = 'workflowaction_elt_member_approve';
				//break;
			case '5'://Head of FP&A Approval
				appButtonId = 'workflowaction_final_finance_approve';
				break;
			case '6'://CFO Approval
				appButtonId = 'workflowaction_cfo_approve';
				break;
			case '7'://CEO Approval
				appButtonId = 'workflowaction_ceo_approve';
				break;
			case '9'://Finance - Procurement 2
				appButtonId = 'workflowaction_finance_2_approve';
				break;
			default:
				break;
			}
			nlapiLogExecution('debug', 'appButtonId', appButtonId);
			
			var wfInstance = nlapiTriggerWorkflow('purchaseorder', poId, 'customworkflow_is_po_apprvl_wf_2', appButtonId);
		}
		
		
		// Trigger the Approved state of the workflow
		if (buttonId == 'CLOSE'){
			var closeButtonId = 'workflowaction_close_po';
			nlapiLogExecution('debug', 'closeButtonId', closeButtonId);
			
			
			//Close Purchase Order
			var poRecord = nlapiLoadRecord('purchaseorder', poId, {recordmode: 'dynamic'});
			
			var itemCount = poRecord.getLineItemCount('item');
			nlapiLogExecution('DEBUG', 'itemCount', itemCount);
			
			for (var i = 1; i <= itemCount; i++){
				nlapiLogExecution('DEBUG', 'Close PO Item Line ' + i, 'CLOSE ITEM LINE');
				poRecord.setLineItemValue('item', 'isclosed', i, 'T');
			}
			

			var expCount = poRecord.getLineItemCount('expense');
			nlapiLogExecution('DEBUG', 'expCount', expCount);
			
			for (var x = 1; x <= expCount; x++){
				nlapiLogExecution('DEBUG', 'Close PO Expense Line ' + x, 'CLOSE EXPENSE LINE');
				poRecord.setLineItemValue('expense', 'isclosed', x, 'T');
			}
			
			nlapiSubmitRecord(poRecord);
			
			
			//Trigger Workflow
			var wfInstance = nlapiTriggerWorkflow('purchaseorder', poId, 'customworkflow_is_po_apprvl_wf_2', closeButtonId);
		}
		
		
		/*
		// Trigger the Super Approval state of the workflow
		if (buttonId == 'SUPER'){
			var supButtonId = '';
			//var supButtonId = 'workflowaction_approve';
			switch (cState) {
			case '2'://Supervisor Approval
				supButtonId = 'workflowaction_mgr_func_area_super';
				break;
			case '3'://Department Approval
				supButtonId = 'workflowaction_owner_func_area_super';
				break;
			case '5'://Finance - Procurement 2
				supButtonId = 'workflowaction_finance_2_super';
				break;
			case '6'://Finance Approver
				supButtonId = 'workflowaction_final_finance_super';
				break;
			case '7'://CFO Approval
				supButtonId = 'workflowaction_cfo_super';
				break;
			default:
				break;
			}
			nlapiLogExecution('debug', 'supButtonId', supButtonId);
			
			var wfInstance = nlapiTriggerWorkflow('purchaseorder', poId, 'customworkflow_certent_po_apprvl_wf', supButtonId);
		}
		*/
		
		
		//Update the 'Button Approver' value on the Purchase Order (tracks who clicked the button vs the actual next approver)
		nlapiSubmitField('purchaseorder', poId, 'custbody_scg_po_button_appvr', userId);
		
		
		// Redirect user to the updated record (if not Auto Approved)
		nlapiSetRedirectURL('RECORD', 'purchaseorder', poId);

		
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
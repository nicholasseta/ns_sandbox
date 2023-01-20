/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Aug 2018     Doug Humberd     Workflow Action script to get Approver values for Purchase Orders where the Approver is a specific person
 *
 */


/**
 * Constants
 */
const WF_APPROVER_CUST_RECORD_ID = '1';


/**
 * Returns the appropriate Approver value for the current WF Approval Stage (Purchase Orders)
 * 
 * @returns {Integer} Next Approver Value for Buyer Manager Approval and CEO Approval Stages
 */
function getWorkflowApproverValues(){
	
	try{
		
		//Initalize Variables
		var poRec = nlapiGetNewRecord();
		var currState = poRec.getFieldValue('custbody_scg_po_appvl_current_state');
		nlapiLogExecution('DEBUG', 'Current State', currState);
		var nextapp = '';
		
		//Look Up Approver Values
		nlapiLogExecution('DEBUG', 'Executive Before', executive);
		nlapiLogExecution('DEBUG', 'CFO Before', cfo);
		nlapiLogExecution('DEBUG', 'CEO Before', ceo);
		var custRec = nlapiLoadRecord('customrecord_scg_workflow_approvers', '1');
		var executive = custRec.getFieldValue('custrecord_scg_wfa_exec');
		var cfo = custRec.getFieldValue('custrecord_scg_wfa_cfo');
		var ceo = custRec.getFieldValue('custrecord_scg_wfa_ceo');
		//var executive = nlapiLookupField('customrecord_scg_wf_approval_approvers', WF_APPROVER_CUST_RECORD_ID, 'custrecord_scg_waa_po_buyer_mgr');
		//var ceo = nlapiLookupField('customrecord_scg_wf_approval_approvers', WF_APPROVER_CUST_RECORD_ID, 'custrecord_scg_waa_po_ceo');
		nlapiLogExecution('DEBUG', 'Executive After', executive);
		nlapiLogExecution('DEBUG', 'CFO After', cfo);
		nlapiLogExecution('DEBUG', 'CEO After', ceo);
		
		if (currState == '2'){
			nextapp = executive;
		}
		else if (currState == '3'){
			nextapp = cfo;
		}
		else if (currState == '4'){
			nextapp = ceo;
		}
		
		return nextapp;

		
	}catch(e){
		is_getWFAppVal_logError(e);
		return 0;
	}
	
}


/**
 * Writes an error message to the Script Execution Log
 * 
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 * 
 * @returns {Void}
 */
function is_getWFAppVal_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}


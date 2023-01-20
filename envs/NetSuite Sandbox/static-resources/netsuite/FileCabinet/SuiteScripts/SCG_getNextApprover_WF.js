/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 Mar 2021     Doug Humberd     Gets the Next Approver from the Custom Record "SCG Purchase Order Approvers" (from Record 1)
 * 1.05       23 Apr 2021     Doug Humberd     Updated for reworked PO Approval WF
 * 1.10       16 Mar 2022     Doug Humberd     Updated to set Dummy Employee if Next Approver is Inactive
 * 1.15       10 May 2022     Doug Humberd     Updated for new "Employee Hierarchy" workflow updates
 * 1.16       24 May 2022     Doug Humberd     Updated to perform Inactive Approver check for Supervisor Hierarchy
 * 
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const PURCH_ORD_APPROVER_REC = '1';//SCG Purchase Order Approvers Custom Record
const INACTIVE_APPROVER = 13207923;//Employee: Inactive Approver



/**
 * Gets the appropriate Next Approver from the Custom Record "SCG Purchase Order Approvers"
 * 
 * @returns Employee ID - to be used in the Next Approver field
 */
function is_gna_getNextApprover(form, type){
	
	try{
		
		var poId = nlapiGetRecordId();
		nlapiLogExecution('DEBUG', 'Purch Ord ID', poId);
		
		//Get the Region from the Subsidiary Record
		//var subsidiary = nlapiGetFieldValue('subsidiary');
		//nlapiLogExecution('DEBUG', 'Subsidiary', subsidiary);
		//var region = nlapiLookupField('subsidiary', subsidiary, 'custrecord_sub_region');
		//nlapiLogExecution('DEBUG', 'Region', region);
		
		//Get the Department
		//var dept = nlapiGetFieldValue('custbody_scg_dept_resp_4_apprvl');
		//nlapiLogExecution('DEBUG', 'Responsible Department', dept);
		
		//Get Current State of the WF
		var cState = nlapiGetFieldValue('custbody_scg_po_appvl_current_state');
		nlapiLogExecution('DEBUG', 'Current State', cState);
		
		//Get the Employee and the Current Next Approver
		var employee = nlapiGetFieldValue('employee');
		var currNextAppr = nlapiGetFieldValue('nextapprover');
		nlapiLogExecution('DEBUG', 'Employee: ' + employee, 'Next Approver: ' + currNextAppr);
		
		var inactiveApprover = nlapiGetFieldValue('custbody_scg_inactive_approver_id');
		nlapiLogExecution('DEBUG', 'Inactive Approver', inactiveApprover);
		
		//Get the Next Approver value based on the Current State of the Workflow
		var nextApprover;
		
		switch (cState){
		//case '2'://Director Approval
			//if (region == '1'){//Americas
				//nextApprover = nlapiLookupField('department', dept , 'custrecord_scg_amer_dir_approver');
			//}
			//if (region == '2'){//APAC
				//nextApprover = nlapiLookupField('department', dept , 'custrecord_scg_apac_dir_approver');
			//}
			//if (region == '3'){//EMEA
				//nextApprover = nlapiLookupField('department', dept , 'custrecord_scg_emea_dir_approver');
			//}
			//break;
		//case '3':// VP/SVP/GM Approval
			//if (region == '1'){//Americas
				//nextApprover = nlapiLookupField('department', dept , 'custrecord_scg_amer_vp_approver');
			//}
			//if (region == '2'){//APAC
				//nextApprover = nlapiLookupField('department', dept , 'custrecord_scg_apac_vp_approver');
			//}
			//if (region == '3'){//EMEA
				//nextApprover = nlapiLookupField('department', dept , 'custrecord_scg_emea_vp_approver');
			//}
			//break;
		//case '4'://ELT Member Approval
			//if (region == '1'){//Americas
				//nextApprover = nlapiLookupField('department', dept , 'custrecord_scg_amer_elt_approver');
			//}
			//if (region == '2'){//APAC
				//nextApprover = nlapiLookupField('department', dept , 'custrecord_scg_apac_elt_approver');
			//}
			//if (region == '3'){//EMEA
				//nextApprover = nlapiLookupField('department', dept , 'custrecord_scg_emea_elt_approver');
			//}
			//break;
		case '2'://Supervisor Approval
			if (currNextAppr == INACTIVE_APPROVER){
				nextApprover = nlapiLookupField('employee', inactiveApprover, 'supervisor');
			}else{
				nextApprover = nlapiLookupField('employee', currNextAppr, 'supervisor');
			}
			break;
		case '5'://Head of FP&A Approval
			nextApprover = nlapiLookupField('customrecord_scg_purchase_order_approver', PURCH_ORD_APPROVER_REC , 'custrecord_scg_poa_finance_approver');
			break;
		case '6'://CFO Approval
			nextApprover = nlapiLookupField('customrecord_scg_purchase_order_approver', PURCH_ORD_APPROVER_REC , 'custrecord_scg_poa_cfo_approver');
			break;
		case '7'://CEO Approval
			nextApprover = nlapiLookupField('customrecord_scg_purchase_order_approver', PURCH_ORD_APPROVER_REC , 'custrecord_scg_poa_ceo_approver');
			break;
		case '12'://Rejected 
			nextApprover = nlapiLookupField('employee', employee, 'supervisor');
			break;
		default:
			nextApprover = '';
			break;
		}
		nlapiLogExecution('DEBUG', 'Next Approver', nextApprover);
		
		
		//If the Next Approver is inactive, set Next Approver to Dummy "Inactive Approver"
		var empInactive = nlapiLookupField('employee', nextApprover, 'isinactive');
		nlapiLogExecution('DEBUG', 'Next Approver: ' + nextApprover, 'Inactive: ' + empInactive);
		
		if (empInactive == 'T'){
			nlapiLogExecution('DEBUG', 'Inactive Approver Found', 'Set Next Approver to Dummy Employee');
			nextApprover = INACTIVE_APPROVER;
		}
		
		nlapiLogExecution('DEBUG', 'Next Approver After Inactive Check', nextApprover);
		
		
		return nextApprover;
		
	}catch(e){
		is_gna_logError(e);
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
function is_gna_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}




function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}  



